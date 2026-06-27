import type { Card } from '@/types/game';

export const CHANCE_CARDS: Card[] = [
  {
    id: 'c1', deck: 'chance',
    text: 'Follow the forest path to GO! Collect $200.',
    action: { type: 'advance_to', position: 0, collectGo: false },
  },
  {
    id: 'c2', deck: 'chance',
    text: 'The forest elder summons you to Fireside Street!',
    action: { type: 'advance_to', position: 24, collectGo: true },
  },
  {
    id: 'c3', deck: 'chance',
    text: 'A nature walk leads you to Maple Grove!',
    action: { type: 'advance_to', position: 11, collectGo: true },
  },
  {
    id: 'c4', deck: 'chance',
    text: 'Hop the nearest logging railway! If owned, pay double rent.',
    action: { type: 'advance_to_nearest', propertyType: 'railroad', doubleRent: true },
  },
  {
    id: 'c5', deck: 'chance',
    text: 'Another train whistle! Advance to nearest railroad. If owned, pay double rent.',
    action: { type: 'advance_to_nearest', propertyType: 'railroad', doubleRent: true },
  },
  {
    id: 'c6', deck: 'chance',
    text: 'The sawmill needs timber! Advance to nearest utility. If owned, pay 10× dice roll.',
    action: { type: 'advance_to_nearest', propertyType: 'utility', doubleRent: false },
  },
  {
    id: 'c7', deck: 'chance',
    text: 'The Forest Council pays you $50 in timber dividends!',
    action: { type: 'collect', amount: 50 },
  },
  {
    id: 'c8', deck: 'chance',
    text: '🍃 Get Out of Jail Free! Keep this card — it may be used at any time.',
    action: { type: 'get_out_of_jail_free' },
  },
  {
    id: 'c9', deck: 'chance',
    text: 'Lost in the woods! Go back 3 spaces.',
    action: { type: 'go_back', spaces: 3 },
  },
  {
    id: 'c10', deck: 'chance',
    text: 'Forest warden caught you! Go to Jail. Do not pass GO.',
    action: { type: 'go_to_jail' },
  },
  {
    id: 'c11', deck: 'chance',
    text: 'General repairs on your forest properties: $25 per cabin, $100 per lodge.',
    action: { type: 'repairs', houseAmount: 25, hotelAmount: 100 },
  },
  {
    id: 'c12', deck: 'chance',
    text: 'Pay forest levy of $15.',
    action: { type: 'pay', amount: 15 },
  },
  {
    id: 'c13', deck: 'chance',
    text: 'Take the Northern Rail! Advance to Northern Rail. If you pass GO, collect $200.',
    action: { type: 'advance_to', position: 5, collectGo: true },
  },
  {
    id: 'c14', deck: 'chance',
    text: 'Marvel at the Great Oak! Advance to The Great Oak.',
    action: { type: 'advance_to', position: 39, collectGo: true },
  },
  {
    id: 'c15', deck: 'chance',
    text: 'Elected Forest Council Chair! Pay each player $50.',
    action: { type: 'pay_each', amount: 50 },
  },
  {
    id: 'c16', deck: 'chance',
    text: 'Your timber loan matures. Collect $150!',
    action: { type: 'collect', amount: 150 },
  },
];

export const COMMUNITY_CHEST_CARDS: Card[] = [
  {
    id: 'cc1', deck: 'community_chest',
    text: 'Return to GO! Collect $200.',
    action: { type: 'advance_to', position: 0, collectGo: false },
  },
  {
    id: 'cc2', deck: 'community_chest',
    text: 'Forest bank error in your favor! Collect $200.',
    action: { type: 'collect', amount: 200 },
  },
  {
    id: 'cc3', deck: 'community_chest',
    text: "Woodcutter's medical fees. Pay $50.",
    action: { type: 'pay', amount: 50 },
  },
  {
    id: 'cc4', deck: 'community_chest',
    text: 'Sold timber futures! Collect $50.',
    action: { type: 'collect', amount: 50 },
  },
  {
    id: 'cc5', deck: 'community_chest',
    text: '🍃 Get Out of Jail Free! Keep this card — it may be used at any time.',
    action: { type: 'get_out_of_jail_free' },
  },
  {
    id: 'cc6', deck: 'community_chest',
    text: 'Caught trespassing in protected forest! Go to Jail.',
    action: { type: 'go_to_jail' },
  },
  {
    id: 'cc7', deck: 'community_chest',
    text: 'Forest Festival Night! Collect $50 from every player.',
    action: { type: 'collect_from_each', amount: 50 },
  },
  {
    id: 'cc8', deck: 'community_chest',
    text: 'Timber fund matures. Receive $100.',
    action: { type: 'collect', amount: 100 },
  },
  {
    id: 'cc9', deck: 'community_chest',
    text: 'Lumber tax refund. Collect $20!',
    action: { type: 'collect', amount: 20 },
  },
  {
    id: 'cc10', deck: 'community_chest',
    text: "It's your birthday! Collect $10 from every other player.",
    action: { type: 'collect_from_each', amount: 10 },
  },
  {
    id: 'cc11', deck: 'community_chest',
    text: 'Forest insurance matures. Collect $100.',
    action: { type: 'collect', amount: 100 },
  },
  {
    id: 'cc12', deck: 'community_chest',
    text: 'Treehouse hospital fees. Pay $100.',
    action: { type: 'pay', amount: 100 },
  },
  {
    id: 'cc13', deck: 'community_chest',
    text: 'Forest school fees. Pay $150.',
    action: { type: 'pay', amount: 150 },
  },
  {
    id: 'cc14', deck: 'community_chest',
    text: 'Receive $25 tree-surgeon consultancy fee.',
    action: { type: 'collect', amount: 25 },
  },
  {
    id: 'cc15', deck: 'community_chest',
    text: 'Assessed for forest repairs: $40 per cabin, $115 per lodge.',
    action: { type: 'repairs', houseAmount: 40, hotelAmount: 115 },
  },
  {
    id: 'cc16', deck: 'community_chest',
    text: 'Won the wood carving contest! Collect $10.',
    action: { type: 'collect', amount: 10 },
  },
  {
    id: 'cc17', deck: 'community_chest',
    text: 'Inherited a forest plot! Collect $100.',
    action: { type: 'collect', amount: 100 },
  },
];
