export type SpaceType =
  | 'go'
  | 'property'
  | 'railroad'
  | 'utility'
  | 'tax'
  | 'chance'
  | 'community_chest'
  | 'jail'
  | 'free_parking'
  | 'go_to_jail';

export type ColorGroup =
  | 'brown'
  | 'light_blue'
  | 'pink'
  | 'orange'
  | 'red'
  | 'yellow'
  | 'green'
  | 'dark_blue';

export interface BoardSpace {
  id: number;
  name: string;
  type: SpaceType;
  price?: number;
  rent?: [number, number, number, number, number, number]; // [0h,1h,2h,3h,4h,hotel]
  houseCost?: number;
  colorGroup?: ColorGroup;
  taxAmount?: number;
}

export interface SpaceState {
  ownerId: string | null;
  isMortgaged: boolean;
  houses: number; // 0-4 houses, 5 = hotel
}

export const PLAYER_COLORS = [
  '#EF4444',
  '#3B82F6',
  '#22C55E',
  '#EAB308',
  '#A855F7',
  '#F97316',
] as const;

export type PlayerColor = (typeof PLAYER_COLORS)[number];

export type PlayerIcon = 'log' | 'leaf' | 'tree' | 'rock' | 'flower' | 'mushroom';

export const PLAYER_ICONS: PlayerIcon[] = ['log', 'leaf', 'tree', 'rock', 'flower', 'mushroom'];

export const ICON_EMOJI: Record<PlayerIcon, string> = {
  log: '🪵',
  leaf: '🍃',
  tree: '🌲',
  rock: '🪨',
  flower: '🌸',
  mushroom: '🍄',
};

export interface Player {
  id: string;
  name: string;
  color: PlayerColor;
  icon: PlayerIcon;
  position: number;
  money: number;
  propertyIds: number[];
  inJail: boolean;
  jailTurns: number;
  isBankrupt: boolean;
  getOutOfJailFreeCount: number;
}

export type GamePhase = 'pre_roll' | 'post_roll' | 'card' | 'game_over';

export type CardAction =
  | { type: 'advance_to'; position: number; collectGo: boolean }
  | { type: 'advance_to_nearest'; propertyType: 'railroad' | 'utility'; doubleRent: boolean }
  | { type: 'collect'; amount: number }
  | { type: 'pay'; amount: number }
  | { type: 'collect_from_each'; amount: number }
  | { type: 'pay_each'; amount: number }
  | { type: 'get_out_of_jail_free' }
  | { type: 'go_to_jail' }
  | { type: 'go_back'; spaces: number }
  | { type: 'repairs'; houseAmount: number; hotelAmount: number };

export interface Card {
  id: string;
  deck: 'chance' | 'community_chest';
  text: string;
  action: CardAction;
}
