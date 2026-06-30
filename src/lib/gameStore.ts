import { create } from 'zustand';
import { BOARD_SPACES, COLOR_GROUPS, RAILROAD_IDS, UTILITY_IDS } from './boardData';
import { CHANCE_CARDS, COMMUNITY_CHEST_CARDS } from './cardData';
import { supabase } from './supabase';
import type { Player, SpaceState, GamePhase, PlayerColor, PlayerIcon, Card } from '@/types/game';

// ─── Remote sync helpers ──────────────────────────────────────────────────────

let _isSyncingFromRemote = false;
export function setSyncingFromRemote(val: boolean) { _isSyncingFromRemote = val; }

export function serializeGameState(state: GameStore) {
  return {
    players: state.players,
    spaceStates: state.spaceStates,
    currentPlayerIdx: state.currentPlayerIdx,
    phase: state.phase,
    lastRoll: state.lastRoll,
    pendingPurchaseId: state.pendingPurchaseId,
    drawnCard: state.drawnCard,
    chanceCards: state.chanceCards,
    chanceIdx: state.chanceIdx,
    communityCards: state.communityCards,
    communityIdx: state.communityIdx,
    log: state.log,
    doublesStreak: state.doublesStreak,
    freeParkingPot: state.freeParkingPot,
    pendingIncomeTax: state.pendingIncomeTax,
    pendingBankruptcy: state.pendingBankruptcy,
    pendingTrade: state.pendingTrade,
    setupRolls: state.setupRolls,
    setupRollCurrentIdx: state.setupRollCurrentIdx,
    setupRollCandidateIds: state.setupRollCandidateIds,
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function calculateRent(spaceIdx: number, ownerId: string, spaceStates: SpaceState[]): number {
  const space = BOARD_SPACES[spaceIdx];
  const houses = spaceStates[spaceIdx].houses;

  if (space.type === 'railroad') {
    const count = RAILROAD_IDS.filter((id) => spaceStates[id].ownerId === ownerId).length;
    return 25 * Math.pow(2, count - 1);
  }

  if (space.type === 'utility') {
    const count = UTILITY_IDS.filter((id) => spaceStates[id].ownerId === ownerId).length;
    return count === 2 ? 100 : 50;
  }

  if (space.type === 'property' && space.rent && space.colorGroup) {
    if (houses > 0) return space.rent[houses];
    const group = COLOR_GROUPS[space.colorGroup];
    const ownsAll = group.every((id) => spaceStates[id].ownerId === ownerId);
    return ownsAll ? space.rent[0] * 2 : space.rent[0];
  }

  return 0;
}

function nearestOfType(from: number, ids: number[]): number {
  for (let i = 1; i <= 40; i++) {
    const pos = (from + i) % 40;
    if (ids.includes(pos)) return pos;
  }
  return ids[0];
}

/** Apply property/rent/tax/jail landing effects in-place on mutable players/spaces arrays. */
function applyLanding(
  spaceIdx: number,
  currentIdx: number,
  players: Player[],
  spaceStates: SpaceState[],
  log: string[],
  doubleRentOnFirst = false,
  currentPot = 0
): { pendingPurchaseId: number | null; goToJail: boolean; potDelta: number; pendingIncomeTax: boolean } {
  const current = players[currentIdx];
  const space = BOARD_SPACES[spaceIdx];
  const ss = spaceStates[spaceIdx];
  let potDelta = 0;

  switch (space.type) {
    case 'property':
    case 'railroad':
    case 'utility': {
      if (!ss.ownerId) {
        if (space.price !== undefined)
          return { pendingPurchaseId: spaceIdx, goToJail: false, potDelta: 0, pendingIncomeTax: false };
      } else if (ss.ownerId !== current.id) {
        const ownerIdx = players.findIndex((p) => p.id === ss.ownerId);
        if (ownerIdx !== -1 && !players[ownerIdx].isBankrupt && !ss.isMortgaged) {
          let rent = calculateRent(spaceIdx, ss.ownerId, spaceStates);
          if (doubleRentOnFirst) rent *= 2;
          current.money -= rent;
          players[ownerIdx].money += rent;
          log.push(`${current.name} paid $${rent} rent to ${players[ownerIdx].name}`);
        }
      } else {
        log.push(`${current.name} owns ${space.name}.`);
      }
      break;
    }
    case 'tax': {
      if (spaceIdx === 4) {
        log.push(`${current.name} landed on Income Tax — choose how to pay.`);
        return { pendingPurchaseId: null, goToJail: false, potDelta: 0, pendingIncomeTax: true };
      }
      const taxAmt = space.taxAmount ?? 0;
      current.money -= taxAmt;
      potDelta = taxAmt;
      log.push(`${current.name} paid $${taxAmt} in Luxury Tax.`);
      break;
    }
    case 'free_parking': {
      if (currentPot > 0) {
        current.money += currentPot;
        potDelta = -currentPot;
        log.push(`${current.name} collected the Free Parking pot of $${currentPot.toLocaleString()}!`);
      } else {
        log.push(`${current.name} landed on Free Parking. (Pot is empty)`);
      }
      break;
    }
    case 'go_to_jail':
      return { pendingPurchaseId: null, goToJail: true, potDelta: 0, pendingIncomeTax: false };
    default:
      break;
  }
  return { pendingPurchaseId: null, goToJail: false, potDelta, pendingIncomeTax: false };
}

/**
 * Returns:
 *   'ok'         — money >= 0, nothing to do
 *   'need_funds' — money < 0 but player has assets to raise money; caller sets pendingBankruptcy
 *   'bankrupt'   — money < 0 with no assets; player eliminated in-place
 */
function checkBankruptcy(
  playerIdx: number,
  players: Player[],
  spaceStates: SpaceState[],
  log: string[]
): 'ok' | 'need_funds' | 'bankrupt' {
  const p = players[playerIdx];
  if (p.money >= 0) return 'ok';

  const hasHouses = p.propertyIds.some((pid) => (spaceStates[pid]?.houses ?? 0) > 0);
  const hasUnmortgaged = p.propertyIds.some((pid) => !spaceStates[pid]?.isMortgaged);

  if (hasHouses || hasUnmortgaged) return 'need_funds';

  // Truly bankrupt — eliminate immediately
  p.isBankrupt = true;
  p.money = 0;
  p.propertyIds.forEach((pid) => {
    spaceStates[pid] = { ownerId: null, isMortgaged: false, houses: 0 };
  });
  p.propertyIds = [];
  log.push(`${p.name} is bankrupt and eliminated!`);
  return 'bankrupt';
}

function checkWinner(players: Player[], log: string[]): boolean {
  const active = players.filter((p) => !p.isBankrupt);
  if (active.length === 1) {
    log.push(`🏆 ${active[0].name} wins the game!`);
    return true;
  }
  return false;
}

// ─── Trade ───────────────────────────────────────────────────────────────────

export interface TradeOffer {
  fromPlayerId: string;
  toPlayerId: string;
  offer:   { propertyIds: number[]; cash: number; jailFreeCards: number };
  request: { propertyIds: number[]; cash: number; jailFreeCards: number };
}

/** True when the space has no houses anywhere in its color group (safe to trade). */
function isSpaceTradeable(spaceId: number, spaceStates: SpaceState[]): boolean {
  const space = BOARD_SPACES[spaceId];
  if (!space.colorGroup) return true;
  const group = COLOR_GROUPS[space.colorGroup];
  return !group.some((id) => (spaceStates[id]?.houses ?? 0) > 0);
}

// ─── Store ────────────────────────────────────────────────────────────────────

interface GameStore {
  gameStarted: boolean;
  players: Player[];
  spaceStates: SpaceState[];
  currentPlayerIdx: number;
  phase: GamePhase;
  lastRoll: [number, number] | null;
  pendingPurchaseId: number | null;
  drawnCard: Card | null;
  chanceCards: Card[];
  chanceIdx: number;
  communityCards: Card[];
  communityIdx: number;
  log: string[];
  doublesStreak: number;
  freeParkingPot: number;
  pendingIncomeTax: boolean;
  pendingBankruptcy: boolean;
  pendingTrade: TradeOffer | null;
  setupRolls: Record<string, number>;
  setupRollCurrentIdx: number;
  setupRollCandidateIds: string[];
  roomId: string | null;
  myPlayerId: string | null;

  startGame: (setups: { name: string; color: PlayerColor; icon: PlayerIcon; id?: string }[]) => void;
  rollForFirst: () => void;
  setRoomInfo: (roomId: string, myPlayerId: string) => void;
  syncFromRemote: (serialized: ReturnType<typeof serializeGameState>) => void;
  rollDice: () => void;
  buyProperty: () => void;
  declinePurchase: () => void;
  endTurn: () => void;
  resetGame: () => void;
  confirmCard: () => void;
  payJailFine: () => void;
  useGetOutOfJailFree: () => void;
  buyHouse: (spaceId: number) => void;
  sellHouse: (spaceId: number) => void;
  payIncomeTaxFlat: () => void;
  payIncomeTaxPercent: () => void;
  mortgageProperty: (spaceId: number) => void;
  unmortgageProperty: (spaceId: number) => void;
  declareBankruptcy: () => void;
  proposeTrade: (trade: TradeOffer) => void;
  acceptTrade: () => void;
  declineTrade: () => void;
}

const BLANK_STATE = {
  gameStarted: false,
  players: [] as Player[],
  spaceStates: [] as SpaceState[],
  currentPlayerIdx: 0,
  phase: 'pre_roll' as GamePhase,
  lastRoll: null as [number, number] | null,
  pendingPurchaseId: null as number | null,
  drawnCard: null as Card | null,
  chanceCards: [] as Card[],
  chanceIdx: 0,
  communityCards: [] as Card[],
  communityIdx: 0,
  log: [] as string[],
  doublesStreak: 0,
  freeParkingPot: 0,
  pendingIncomeTax: false,
  pendingBankruptcy: false,
  pendingTrade: null as TradeOffer | null,
  setupRolls: {} as Record<string, number>,
  setupRollCurrentIdx: 0,
  setupRollCandidateIds: [] as string[],
  roomId: null as string | null,
  myPlayerId: null as string | null,
};

export const useGameStore = create<GameStore>((set, get) => ({
  ...BLANK_STATE,

  setRoomInfo: (roomId, myPlayerId) => set({ roomId, myPlayerId }),

  syncFromRemote: (serialized) => {
    _isSyncingFromRemote = true;
    set({ ...serialized, gameStarted: true });
    _isSyncingFromRemote = false;
  },

  startGame: (setups) => {
    const players: Player[] = setups.map((s, i) => ({
      id: s.id ?? `player-${i}`,
      name: s.name,
      color: s.color,
      icon: s.icon,
      position: 0,
      money: 1500,
      propertyIds: [],
      inJail: false,
      jailTurns: 0,
      isBankrupt: false,
      getOutOfJailFreeCount: 0,
    }));

    const spaceStates: SpaceState[] = BOARD_SPACES.map(() => ({
      ownerId: null,
      isMortgaged: false,
      houses: 0,
    }));

    set({
      ...BLANK_STATE,
      gameStarted: true,
      players,
      spaceStates,
      phase: 'setup_roll',
      chanceCards: shuffle(CHANCE_CARDS),
      communityCards: shuffle(COMMUNITY_CHEST_CARDS),
      setupRolls: {},
      setupRollCurrentIdx: 0,
      setupRollCandidateIds: players.map((p) => p.id),
      log: [
        `Game started! ${players.map((p) => p.name).join(', ')} are playing.`,
        `Roll to determine who goes first — highest roll starts.`,
      ],
    });
  },

  rollForFirst: () => {
    const state = get();
    const { players, setupRolls, setupRollCandidateIds, setupRollCurrentIdx, log } = state;

    const candidateId = setupRollCandidateIds[setupRollCurrentIdx];
    const player = players.find((p) => p.id === candidateId)!;

    const die1 = Math.ceil(Math.random() * 6);
    const die2 = Math.ceil(Math.random() * 6);
    const roll = die1 + die2;

    const newRolls = { ...setupRolls, [candidateId]: roll };
    const newLog = [...log, `${player.name} rolled ${die1} + ${die2} = ${roll}.`];
    const nextIdx = setupRollCurrentIdx + 1;

    if (nextIdx < setupRollCandidateIds.length) {
      set({ setupRolls: newRolls, setupRollCurrentIdx: nextIdx, lastRoll: [die1, die2], log: newLog });
      return;
    }

    const maxRoll = Math.max(...setupRollCandidateIds.map((id) => newRolls[id]));
    const winners = setupRollCandidateIds.filter((id) => newRolls[id] === maxRoll);

    if (winners.length > 1) {
      const tiedNames = winners.map((id) => players.find((p) => p.id === id)!.name).join(', ');
      newLog.push(`Tie at ${maxRoll}! ${tiedNames} roll again.`);
      set({
        setupRolls: {},
        setupRollCurrentIdx: 0,
        setupRollCandidateIds: winners,
        lastRoll: [die1, die2],
        log: newLog,
      });
      return;
    }

    const winnerId = winners[0];
    const winnerIdx = players.findIndex((p) => p.id === winnerId);
    newLog.push(`${players[winnerIdx].name} goes first!`);
    newLog.push(`--- ${players[winnerIdx].name}'s turn ---`);
    set({
      setupRolls: {},
      setupRollCurrentIdx: 0,
      setupRollCandidateIds: [],
      currentPlayerIdx: winnerIdx,
      phase: 'pre_roll',
      lastRoll: [die1, die2],
      log: newLog,
    });
  },

  rollDice: () => {
    const state = get();
    const {
      players, currentPlayerIdx, spaceStates, log,
      chanceCards, chanceIdx, communityCards, communityIdx,
      doublesStreak, freeParkingPot,
    } = state;
    const player = players[currentPlayerIdx];

    const die1 = Math.ceil(Math.random() * 6);
    const die2 = Math.ceil(Math.random() * 6);
    const roll = die1 + die2;
    const isDoubles = die1 === die2;
    const newLog = [...log, `${player.name} rolled ${die1} + ${die2} = ${roll}${isDoubles ? ' (Doubles!)' : ''}`];

    const updatedPlayers = players.map((p) => ({ ...p }));
    const updatedSpaces = spaceStates.map((s) => ({ ...s }));
    const current = updatedPlayers[currentPlayerIdx];
    let newFreeParkingPot = freeParkingPot;
    let newDoublesStreak = doublesStreak;

    // ── Jail ─────────────────────────────────────────────────────────────────
    if (current.inJail) {
      if (isDoubles) {
        current.inJail = false;
        current.jailTurns = 0;
        newDoublesStreak = 0;
        newLog.push(`${current.name} rolled doubles and escaped jail!`);
      } else {
        current.jailTurns++;
        if (current.jailTurns >= 3) {
          current.money -= 50;
          current.inJail = false;
          current.jailTurns = 0;
          newLog.push(`${current.name} paid $50 jail fine and is released!`);
        } else {
          newLog.push(`No doubles — ${current.name} stays in jail (turn ${current.jailTurns} of 3).`);
          set({
            players: updatedPlayers,
            freeParkingPot: newFreeParkingPot,
            lastRoll: [die1, die2],
            phase: 'post_roll',
            log: newLog,
            doublesStreak: 0,
            pendingBankruptcy: false,
          });
          return;
        }
      }
      // Fall through: move from jail position (10)
    } else {
      if (isDoubles) {
        newDoublesStreak = doublesStreak + 1;
        if (newDoublesStreak >= 3) {
          current.position = 10;
          current.inJail = true;
          current.jailTurns = 0;
          newDoublesStreak = 0;
          newLog.push(`${current.name} rolled doubles 3 times in a row — sent to Jail!`);
          const bStatus = checkBankruptcy(currentPlayerIdx, updatedPlayers, updatedSpaces, newLog);
          const needsFunds = bStatus === 'need_funds';
          const isGameOver = !needsFunds && checkWinner(updatedPlayers, newLog);
          set({
            players: updatedPlayers,
            spaceStates: updatedSpaces,
            lastRoll: [die1, die2],
            phase: isGameOver ? 'game_over' : 'post_roll',
            log: newLog,
            pendingPurchaseId: null,
            drawnCard: null,
            doublesStreak: 0,
            freeParkingPot: newFreeParkingPot,
            pendingIncomeTax: false,
            pendingBankruptcy: needsFunds,
          });
          return;
        }
      } else {
        newDoublesStreak = 0;
      }
    }

    // ── Move ─────────────────────────────────────────────────────────────────
    const total = current.position + roll;
    const newPosition = total % 40;
    const passedGo = total >= 40;

    if (passedGo) {
      current.money += 200;
      newLog.push(`${current.name} passed GO and collected $200!`);
    }

    current.position = newPosition;
    const space = BOARD_SPACES[newPosition];
    newLog.push(`${current.name} landed on ${space.name}`);

    let pendingPurchaseId: number | null = null;
    let nextPhase: GamePhase = 'post_roll';
    let newChanceIdx = chanceIdx;
    let newCommunityIdx = communityIdx;
    let drawnCard: Card | null = null;
    let pendingIncomeTax = false;

    if (space.type === 'go_to_jail') {
      current.position = 10;
      current.inJail = true;
      current.jailTurns = 0;
      newLog.push(`${current.name} was sent to Jail!`);
    } else if (space.type === 'chance') {
      const card = chanceCards[chanceIdx];
      newChanceIdx = (chanceIdx + 1) % chanceCards.length;
      drawnCard = card;
      nextPhase = 'card';
      newLog.push(`${current.name} draws a Chance card…`);
    } else if (space.type === 'community_chest') {
      const card = communityCards[communityIdx];
      newCommunityIdx = (communityIdx + 1) % communityCards.length;
      drawnCard = card;
      nextPhase = 'card';
      newLog.push(`${current.name} draws a Community Chest card…`);
    } else {
      const result = applyLanding(newPosition, currentPlayerIdx, updatedPlayers, updatedSpaces, newLog, false, newFreeParkingPot);
      pendingPurchaseId = result.pendingPurchaseId;
      newFreeParkingPot = Math.max(0, newFreeParkingPot + result.potDelta);
      pendingIncomeTax = result.pendingIncomeTax;
      if (result.goToJail) {
        current.position = 10;
        current.inJail = true;
        current.jailTurns = 0;
        newLog.push(`${current.name} was sent to Jail!`);
      }
    }

    const bStatus = checkBankruptcy(currentPlayerIdx, updatedPlayers, updatedSpaces, newLog);
    const needsFunds = bStatus === 'need_funds';
    if (!needsFunds && checkWinner(updatedPlayers, newLog)) {
      nextPhase = 'game_over';
      pendingPurchaseId = null;
      drawnCard = null;
      pendingIncomeTax = false;
    }

    set({
      players: updatedPlayers,
      spaceStates: updatedSpaces,
      lastRoll: [die1, die2],
      phase: nextPhase,
      log: newLog,
      pendingPurchaseId,
      drawnCard,
      chanceIdx: newChanceIdx,
      communityIdx: newCommunityIdx,
      doublesStreak: newDoublesStreak,
      freeParkingPot: newFreeParkingPot,
      pendingIncomeTax,
      pendingBankruptcy: needsFunds,
    });
  },

  confirmCard: () => {
    const state = get();
    const { players, currentPlayerIdx, spaceStates, log, drawnCard, freeParkingPot } = state;
    if (!drawnCard) return;

    const updatedPlayers = players.map((p) => ({ ...p }));
    const updatedSpaces = spaceStates.map((s) => ({ ...s }));
    const current = updatedPlayers[currentPlayerIdx];
    const newLog = [...log, `Card: ${drawnCard.text}`];
    const action = drawnCard.action;

    let pendingPurchaseId: number | null = null;
    let nextPhase: GamePhase = 'post_roll';
    let pendingIncomeTax = false;
    let newPot = freeParkingPot;

    switch (action.type) {
      case 'collect':
        current.money += action.amount;
        newLog.push(`${current.name} collected $${action.amount}.`);
        break;

      case 'pay':
        current.money -= action.amount;
        newPot += action.amount;
        newLog.push(`${current.name} paid $${action.amount}.`);
        break;

      case 'collect_from_each':
        updatedPlayers.forEach((p, i) => {
          if (i !== currentPlayerIdx && !p.isBankrupt) {
            const amt = Math.min(p.money, action.amount);
            updatedPlayers[i].money -= amt;
            current.money += amt;
          }
        });
        newLog.push(`${current.name} collected $${action.amount} from each player.`);
        break;

      case 'pay_each':
        updatedPlayers.forEach((p, i) => {
          if (i !== currentPlayerIdx && !p.isBankrupt) {
            current.money -= action.amount;
            updatedPlayers[i].money += action.amount;
          }
        });
        newLog.push(`${current.name} paid $${action.amount} to each player.`);
        break;

      case 'get_out_of_jail_free':
        current.getOutOfJailFreeCount += 1;
        newLog.push(`${current.name} keeps a Get Out of Jail Free card!`);
        break;

      case 'go_to_jail':
        current.position = 10;
        current.inJail = true;
        current.jailTurns = 0;
        newLog.push(`${current.name} was sent to Jail!`);
        break;

      case 'go_back': {
        const newPos = (current.position - action.spaces + 40) % 40;
        newLog.push(`${current.name} goes back ${action.spaces} spaces to ${BOARD_SPACES[newPos].name}`);
        current.position = newPos;
        const res = applyLanding(newPos, currentPlayerIdx, updatedPlayers, updatedSpaces, newLog, false, newPot);
        pendingPurchaseId = res.pendingPurchaseId;
        newPot = Math.max(0, newPot + res.potDelta);
        pendingIncomeTax = res.pendingIncomeTax;
        if (res.goToJail) { current.position = 10; current.inJail = true; current.jailTurns = 0; }
        break;
      }

      case 'advance_to': {
        const newPos = action.position;
        const passedGo = action.collectGo && newPos < current.position;
        if (passedGo || action.position === 0) {
          if (action.collectGo) { current.money += 200; newLog.push(`${current.name} passed GO! Collected $200.`); }
        }
        newLog.push(`${current.name} advances to ${BOARD_SPACES[newPos].name}`);
        current.position = newPos;
        const res = applyLanding(newPos, currentPlayerIdx, updatedPlayers, updatedSpaces, newLog, false, newPot);
        pendingPurchaseId = res.pendingPurchaseId;
        newPot = Math.max(0, newPot + res.potDelta);
        pendingIncomeTax = res.pendingIncomeTax;
        if (res.goToJail) { current.position = 10; current.inJail = true; current.jailTurns = 0; }
        break;
      }

      case 'advance_to_nearest': {
        const ids = action.propertyType === 'railroad' ? RAILROAD_IDS : UTILITY_IDS;
        const nearest = nearestOfType(current.position, ids);
        const passedGo = nearest < current.position;
        if (passedGo) { current.money += 200; newLog.push(`${current.name} passed GO! Collected $200.`); }
        newLog.push(`${current.name} advances to nearest ${action.propertyType}: ${BOARD_SPACES[nearest].name}`);
        current.position = nearest;
        const res = applyLanding(nearest, currentPlayerIdx, updatedPlayers, updatedSpaces, newLog, action.doubleRent, newPot);
        pendingPurchaseId = res.pendingPurchaseId;
        newPot = Math.max(0, newPot + res.potDelta);
        break;
      }

      case 'repairs': {
        let cost = 0;
        current.propertyIds.forEach((pid) => {
          const h = updatedSpaces[pid].houses;
          cost += h === 5 ? action.hotelAmount : h * action.houseAmount;
        });
        current.money -= cost;
        newPot += cost;
        newLog.push(`${current.name} paid $${cost} in property repairs.`);
        break;
      }
    }

    const bStatus = checkBankruptcy(currentPlayerIdx, updatedPlayers, updatedSpaces, newLog);
    const needsFunds = bStatus === 'need_funds';
    if (!needsFunds && checkWinner(updatedPlayers, newLog)) {
      nextPhase = 'game_over';
      pendingPurchaseId = null;
      pendingIncomeTax = false;
    }

    set({
      players: updatedPlayers,
      spaceStates: updatedSpaces,
      drawnCard: null,
      phase: nextPhase,
      log: newLog,
      pendingPurchaseId,
      pendingIncomeTax,
      freeParkingPot: newPot,
      pendingBankruptcy: needsFunds,
    });
  },

  buyProperty: () => {
    const { players, currentPlayerIdx, spaceStates, pendingPurchaseId, log } = get();
    if (pendingPurchaseId === null) return;
    const player = players[currentPlayerIdx];
    const space = BOARD_SPACES[pendingPurchaseId];
    if (!space.price || player.money < space.price) return;

    const updatedPlayers = players.map((p, i) =>
      i === currentPlayerIdx
        ? { ...p, money: p.money - space.price!, propertyIds: [...p.propertyIds, pendingPurchaseId] }
        : p
    );
    const updatedSpaces = spaceStates.map((s, i) =>
      i === pendingPurchaseId ? { ...s, ownerId: player.id } : s
    );
    set({
      players: updatedPlayers,
      spaceStates: updatedSpaces,
      pendingPurchaseId: null,
      log: [...log, `${player.name} bought ${space.name} for $${space.price}!`],
    });
  },

  declinePurchase: () => {
    const { log, players, currentPlayerIdx, pendingPurchaseId } = get();
    if (pendingPurchaseId === null) return;
    set({
      pendingPurchaseId: null,
      log: [...log, `${players[currentPlayerIdx].name} declined to buy ${BOARD_SPACES[pendingPurchaseId].name}.`],
    });
  },

  payJailFine: () => {
    const { players, currentPlayerIdx, log } = get();
    const p = players[currentPlayerIdx];
    if (!p.inJail || p.money < 50) return;
    const updated = players.map((pl, i) =>
      i === currentPlayerIdx ? { ...pl, money: pl.money - 50, inJail: false, jailTurns: 0 } : pl
    );
    set({ players: updated, log: [...log, `${p.name} paid $50 bail and is free to roll!`] });
  },

  useGetOutOfJailFree: () => {
    const { players, currentPlayerIdx, log } = get();
    const p = players[currentPlayerIdx];
    if (!p.inJail || p.getOutOfJailFreeCount <= 0) return;
    const updated = players.map((pl, i) =>
      i === currentPlayerIdx
        ? { ...pl, inJail: false, jailTurns: 0, getOutOfJailFreeCount: pl.getOutOfJailFreeCount - 1 }
        : pl
    );
    set({ players: updated, log: [...log, `${p.name} used Get Out of Jail Free!`] });
  },

  payIncomeTaxFlat: () => {
    const { players, currentPlayerIdx, log, freeParkingPot, spaceStates } = get();
    const p = players[currentPlayerIdx];
    const updatedPlayers = players.map((pl) => ({ ...pl }));
    const updatedSpaces = spaceStates.map((s) => ({ ...s }));
    updatedPlayers[currentPlayerIdx].money -= 200;
    const newLog = [...log, `${p.name} paid $200 flat Income Tax.`];
    const bStatus = checkBankruptcy(currentPlayerIdx, updatedPlayers, updatedSpaces, newLog);
    const needsFunds = bStatus === 'need_funds';
    const isGameOver = !needsFunds && checkWinner(updatedPlayers, newLog);
    set({
      players: updatedPlayers,
      spaceStates: updatedSpaces,
      freeParkingPot: freeParkingPot + 200,
      pendingIncomeTax: false,
      log: newLog,
      phase: isGameOver ? 'game_over' : 'post_roll',
      pendingBankruptcy: needsFunds,
    });
  },

  payIncomeTaxPercent: () => {
    const { players, currentPlayerIdx, log, freeParkingPot, spaceStates } = get();
    const p = players[currentPlayerIdx];
    const amount = Math.floor(p.money * 0.10);
    const updatedPlayers = players.map((pl) => ({ ...pl }));
    const updatedSpaces = spaceStates.map((s) => ({ ...s }));
    updatedPlayers[currentPlayerIdx].money -= amount;
    const newLog = [...log, `${p.name} paid $${amount} (10%) Income Tax.`];
    const bStatus = checkBankruptcy(currentPlayerIdx, updatedPlayers, updatedSpaces, newLog);
    const needsFunds = bStatus === 'need_funds';
    const isGameOver = !needsFunds && checkWinner(updatedPlayers, newLog);
    set({
      players: updatedPlayers,
      spaceStates: updatedSpaces,
      freeParkingPot: freeParkingPot + amount,
      pendingIncomeTax: false,
      log: newLog,
      phase: isGameOver ? 'game_over' : 'post_roll',
      pendingBankruptcy: needsFunds,
    });
  },

  buyHouse: (spaceId) => {
    const { players, currentPlayerIdx, spaceStates, log } = get();
    const space = BOARD_SPACES[spaceId];
    if (!space.colorGroup || !space.houseCost || space.type !== 'property') return;

    const player = players[currentPlayerIdx];
    if (!player.propertyIds.includes(spaceId)) return;
    if (player.money < space.houseCost) return;

    const group = COLOR_GROUPS[space.colorGroup];
    if (!group.every((id) => spaceStates[id].ownerId === player.id)) return;

    const currentHouses = spaceStates[spaceId].houses;
    if (currentHouses >= 5) return;
    const minInGroup = Math.min(...group.map((id) => spaceStates[id].houses));
    if (currentHouses > minInGroup) return;

    const updatedPlayers = players.map((p, i) =>
      i === currentPlayerIdx ? { ...p, money: p.money - space.houseCost! } : p
    );
    const updatedSpaces = spaceStates.map((s, i) =>
      i === spaceId ? { ...s, houses: s.houses + 1 } : s
    );
    const label = currentHouses === 4 ? 'hotel' : 'house';
    set({
      players: updatedPlayers,
      spaceStates: updatedSpaces,
      log: [...log, `${player.name} built a ${label} on ${space.name} for $${space.houseCost}.`],
    });
  },

  sellHouse: (spaceId) => {
    const { players, currentPlayerIdx, spaceStates, log, pendingBankruptcy } = get();
    const space = BOARD_SPACES[spaceId];
    if (!space.colorGroup || !space.houseCost || space.type !== 'property') return;

    const player = players[currentPlayerIdx];
    if (!player.propertyIds.includes(spaceId)) return;

    const currentHouses = spaceStates[spaceId].houses;
    if (currentHouses === 0) return;
    const group = COLOR_GROUPS[space.colorGroup];
    const maxInGroup = Math.max(...group.map((id) => spaceStates[id].houses));
    if (currentHouses < maxInGroup) return;

    const sellPrice = Math.floor(space.houseCost / 2);
    const updatedPlayers = players.map((p, i) =>
      i === currentPlayerIdx ? { ...p, money: p.money + sellPrice } : p
    );
    const updatedSpaces = spaceStates.map((s, i) =>
      i === spaceId ? { ...s, houses: s.houses - 1 } : s
    );
    const label = currentHouses === 5 ? 'hotel' : 'house';
    const stillInDebt = updatedPlayers[currentPlayerIdx].money < 0;
    set({
      players: updatedPlayers,
      spaceStates: updatedSpaces,
      log: [...log, `${player.name} sold a ${label} from ${space.name} for $${sellPrice}.`],
      pendingBankruptcy: pendingBankruptcy && stillInDebt,
    });
  },

  mortgageProperty: (spaceId) => {
    const { players, currentPlayerIdx, spaceStates, log, pendingBankruptcy } = get();
    const player = players[currentPlayerIdx];

    if (!player.propertyIds.includes(spaceId)) return;

    const space = BOARD_SPACES[spaceId];
    const ss = spaceStates[spaceId];
    if (ss.isMortgaged) return;

    // Must sell all houses in the color group before mortgaging
    if (space.colorGroup) {
      const group = COLOR_GROUPS[space.colorGroup];
      if (group.some((id) => (spaceStates[id]?.houses ?? 0) > 0)) return;
    }

    const mortgageValue = Math.floor((space.price ?? 0) / 2);
    if (mortgageValue === 0) return;

    const updatedPlayers = players.map((p, i) =>
      i === currentPlayerIdx ? { ...p, money: p.money + mortgageValue } : p
    );
    const updatedSpaces = spaceStates.map((s, i) =>
      i === spaceId ? { ...s, isMortgaged: true } : s
    );
    const stillInDebt = updatedPlayers[currentPlayerIdx].money < 0;
    set({
      players: updatedPlayers,
      spaceStates: updatedSpaces,
      log: [...log, `${player.name} mortgaged ${space.name} for $${mortgageValue}.`],
      pendingBankruptcy: pendingBankruptcy && stillInDebt,
    });
  },

  unmortgageProperty: (spaceId) => {
    const { players, currentPlayerIdx, spaceStates, log } = get();
    const player = players[currentPlayerIdx];

    if (!player.propertyIds.includes(spaceId)) return;

    const space = BOARD_SPACES[spaceId];
    const ss = spaceStates[spaceId];
    if (!ss.isMortgaged) return;

    const mortgageValue = Math.floor((space.price ?? 0) / 2);
    const unmortgageCost = mortgageValue;
    if (player.money < unmortgageCost) return;

    const updatedPlayers = players.map((p, i) =>
      i === currentPlayerIdx ? { ...p, money: p.money - unmortgageCost } : p
    );
    const updatedSpaces = spaceStates.map((s, i) =>
      i === spaceId ? { ...s, isMortgaged: false } : s
    );
    set({
      players: updatedPlayers,
      spaceStates: updatedSpaces,
      log: [...log, `${player.name} unmortgaged ${space.name} for $${unmortgageCost}.`],
    });
  },

  declareBankruptcy: () => {
    const { players, currentPlayerIdx, spaceStates, log, pendingTrade } = get();
    const p = players[currentPlayerIdx];
    if (p.money >= 0) return;

    const updatedPlayers = players.map((pl) => ({ ...pl }));
    const updatedSpaces = spaceStates.map((s) => ({ ...s }));
    const current = updatedPlayers[currentPlayerIdx];

    current.isBankrupt = true;
    current.money = 0;
    current.propertyIds.forEach((pid) => {
      updatedSpaces[pid] = { ownerId: null, isMortgaged: false, houses: 0 };
    });
    current.propertyIds = [];

    const newLog = [...log, `${current.name} declared bankruptcy and was eliminated!`];

    // Cancel any pending trade involving the bankrupt player
    const bankruptId = p.id;
    const tradeAffected =
      pendingTrade?.fromPlayerId === bankruptId || pendingTrade?.toPlayerId === bankruptId;

    if (checkWinner(updatedPlayers, newLog)) {
      set({
        players: updatedPlayers,
        spaceStates: updatedSpaces,
        log: newLog,
        phase: 'game_over',
        pendingBankruptcy: false,
        pendingTrade: tradeAffected ? null : pendingTrade,
      });
      return;
    }

    let nextIdx = (currentPlayerIdx + 1) % updatedPlayers.length;
    while (updatedPlayers[nextIdx].isBankrupt) nextIdx = (nextIdx + 1) % updatedPlayers.length;

    set({
      players: updatedPlayers,
      spaceStates: updatedSpaces,
      log: [...newLog, `--- ${updatedPlayers[nextIdx].name}'s turn ---`],
      phase: 'pre_roll',
      currentPlayerIdx: nextIdx,
      pendingBankruptcy: false,
      pendingPurchaseId: null,
      pendingIncomeTax: false,
      doublesStreak: 0,
      lastRoll: null,
      pendingTrade: tradeAffected ? null : pendingTrade,
    });
  },

  endTurn: () => {
    const { players, currentPlayerIdx, log, pendingBankruptcy } = get();
    if (pendingBankruptcy) return;

    const active = players.filter((p) => !p.isBankrupt);
    if (active.length <= 1) { set({ phase: 'game_over' }); return; }

    let nextIdx = (currentPlayerIdx + 1) % players.length;
    while (players[nextIdx].isBankrupt) nextIdx = (nextIdx + 1) % players.length;

    set({
      currentPlayerIdx: nextIdx,
      phase: 'pre_roll',
      pendingPurchaseId: null,
      pendingIncomeTax: false,
      pendingBankruptcy: false,
      lastRoll: null,
      doublesStreak: 0,
      log: [...log, `--- ${players[nextIdx].name}'s turn ---`],
    });
  },

  proposeTrade: (trade) => {
    const { log, players } = get();
    const from = players.find((p) => p.id === trade.fromPlayerId);
    const to = players.find((p) => p.id === trade.toPlayerId);
    set({
      pendingTrade: trade,
      log: [...log, `${from?.name} proposed a trade to ${to?.name}.`],
    });
  },

  acceptTrade: () => {
    const { pendingTrade, players, spaceStates, log } = get();
    if (!pendingTrade) return;

    const { fromPlayerId, toPlayerId, offer, request } = pendingTrade;
    const fromIdx = players.findIndex((p) => p.id === fromPlayerId);
    const toIdx = players.findIndex((p) => p.id === toPlayerId);
    if (fromIdx === -1 || toIdx === -1) return;

    const updatedPlayers = players.map((p) => ({ ...p, propertyIds: [...p.propertyIds] }));
    const updatedSpaces = spaceStates.map((s) => ({ ...s }));
    const from = updatedPlayers[fromIdx];
    const to = updatedPlayers[toIdx];

    // Validate both parties still hold their side of the deal
    if (from.money < offer.cash) return;
    if (to.money < request.cash) return;
    if (from.getOutOfJailFreeCount < offer.jailFreeCards) return;
    if (to.getOutOfJailFreeCount < request.jailFreeCards) return;
    if (!offer.propertyIds.every((id) => updatedSpaces[id]?.ownerId === fromPlayerId)) return;
    if (!request.propertyIds.every((id) => updatedSpaces[id]?.ownerId === toPlayerId)) return;
    if (!offer.propertyIds.every((id) => isSpaceTradeable(id, updatedSpaces))) return;
    if (!request.propertyIds.every((id) => isSpaceTradeable(id, updatedSpaces))) return;

    // Cash transfer
    from.money = from.money - offer.cash + request.cash;
    to.money   = to.money   - request.cash + offer.cash;

    // GOOJF transfer
    from.getOutOfJailFreeCount = from.getOutOfJailFreeCount - offer.jailFreeCards + request.jailFreeCards;
    to.getOutOfJailFreeCount   = to.getOutOfJailFreeCount   - request.jailFreeCards + offer.jailFreeCards;

    // Properties: offer side (from → to)
    offer.propertyIds.forEach((pid) => {
      from.propertyIds = from.propertyIds.filter((id) => id !== pid);
      to.propertyIds.push(pid);
      updatedSpaces[pid] = { ...updatedSpaces[pid], ownerId: toPlayerId };
    });

    // Properties: request side (to → from)
    request.propertyIds.forEach((pid) => {
      to.propertyIds = to.propertyIds.filter((id) => id !== pid);
      from.propertyIds.push(pid);
      updatedSpaces[pid] = { ...updatedSpaces[pid], ownerId: fromPlayerId };
    });

    set({
      players: updatedPlayers,
      spaceStates: updatedSpaces,
      pendingTrade: null,
      log: [...log, `${from.name} and ${to.name} completed a trade!`],
    });
  },

  declineTrade: () => {
    const { pendingTrade, players, log } = get();
    if (!pendingTrade) return;
    const to = players.find((p) => p.id === pendingTrade.toPlayerId);
    set({
      pendingTrade: null,
      log: [...log, `${to?.name} declined the trade offer.`],
    });
  },

  resetGame: () => set(BLANK_STATE),
}));

// Auto-push game state to Supabase after every local change.
// Skipped when _isSyncingFromRemote is true to prevent echo loops.
useGameStore.subscribe((state) => {
  if (_isSyncingFromRemote || !state.roomId || !state.gameStarted) return;
  const serialized = serializeGameState(state);
  supabase
    .from('game_rooms')
    .update({ game_state: serialized })
    .eq('id', state.roomId)
    .then(({ error }) => { if (error) console.error('[gameSync]', error); });
});
