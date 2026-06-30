import type { Card } from '@/types/game';

export const CHANCE_CARDS: Card[] = [
  {
    id: 'c1', deck: 'chance',
    text: 'Advance to Go. Collect $200.',
    action: { type: 'advance_to', position: 0, collectGo: false },
  },
  {
    id: 'c2', deck: 'chance',
    text: 'Advance to Illinois Avenue. If you pass Go, collect $200.',
    action: { type: 'advance_to', position: 24, collectGo: true },
  },
  {
    id: 'c3', deck: 'chance',
    text: 'Advance to St. Charles Place. If you pass Go, collect $200.',
    action: { type: 'advance_to', position: 11, collectGo: true },
  },
  {
    id: 'c4', deck: 'chance',
    text: 'Advance to the nearest Railroad. If unowned, you may buy it from the Bank. If owned, pay the owner twice the rental to which they are otherwise entitled.',
    action: { type: 'advance_to_nearest', propertyType: 'railroad', doubleRent: true },
  },
  {
    id: 'c5', deck: 'chance',
    text: 'Advance to the nearest Railroad. If unowned, you may buy it from the Bank. If owned, pay the owner twice the rental to which they are otherwise entitled.',
    action: { type: 'advance_to_nearest', propertyType: 'railroad', doubleRent: true },
  },
  {
    id: 'c6', deck: 'chance',
    text: 'Advance token to the nearest Utility. If unowned, you may buy it from the Bank. If owned, throw the dice and pay the owner a total ten times the amount thrown.',
    action: { type: 'advance_to_nearest', propertyType: 'utility', doubleRent: false },
  },
  {
    id: 'c7', deck: 'chance',
    text: 'Bank pays you a dividend of $50.',
    action: { type: 'collect', amount: 50 },
  },
  {
    id: 'c8', deck: 'chance',
    text: 'Get Out of Jail Free. This card may be kept until needed, traded, or sold.',
    action: { type: 'get_out_of_jail_free' },
  },
  {
    id: 'c9', deck: 'chance',
    text: 'Go Back Three Spaces.',
    action: { type: 'go_back', spaces: 3 },
  },
  {
    id: 'c10', deck: 'chance',
    text: 'Go to Jail. Do not pass Go. Do not collect $200.',
    action: { type: 'go_to_jail' },
  },
  {
    id: 'c11', deck: 'chance',
    text: 'Make general repairs on all your property. For each house pay $25, for each hotel pay $100.',
    action: { type: 'repairs', houseAmount: 25, hotelAmount: 100 },
  },
  {
    id: 'c12', deck: 'chance',
    text: 'Pay poor tax of $15.',
    action: { type: 'pay', amount: 15 },
  },
  {
    id: 'c13', deck: 'chance',
    text: 'Take a trip to Reading Railroad. If you pass Go, collect $200.',
    action: { type: 'advance_to', position: 5, collectGo: true },
  },
  {
    id: 'c14', deck: 'chance',
    text: 'Advance to Boardwalk.',
    action: { type: 'advance_to', position: 39, collectGo: false },
  },
  {
    id: 'c15', deck: 'chance',
    text: 'You have been elected Chairman of the Board. Pay each player $50.',
    action: { type: 'pay_each', amount: 50 },
  },
  {
    id: 'c16', deck: 'chance',
    text: 'Your building loan matures. Collect $150.',
    action: { type: 'collect', amount: 150 },
  },
];

export const COMMUNITY_CHEST_CARDS: Card[] = [
  {
    id: 'cc1', deck: 'community_chest',
    text: 'Advance to Go. Collect $200.',
    action: { type: 'advance_to', position: 0, collectGo: false },
  },
  {
    id: 'cc2', deck: 'community_chest',
    text: 'Bank error in your favor. Collect $200.',
    action: { type: 'collect', amount: 200 },
  },
  {
    id: 'cc3', deck: 'community_chest',
    text: "Doctor's fees. Pay $50.",
    action: { type: 'pay', amount: 50 },
  },
  {
    id: 'cc4', deck: 'community_chest',
    text: 'From sale of stock you get $50.',
    action: { type: 'collect', amount: 50 },
  },
  {
    id: 'cc5', deck: 'community_chest',
    text: 'Get Out of Jail Free. This card may be kept until needed, traded, or sold.',
    action: { type: 'get_out_of_jail_free' },
  },
  {
    id: 'cc6', deck: 'community_chest',
    text: 'Go to Jail. Do not pass Go. Do not collect $200.',
    action: { type: 'go_to_jail' },
  },
  {
    id: 'cc7', deck: 'community_chest',
    text: 'A grand civic celebration! Collect $50 from every player.',
    action: { type: 'collect_from_each', amount: 50 },
  },
  {
    id: 'cc8', deck: 'community_chest',
    text: 'Holiday fund matures. Receive $100.',
    action: { type: 'collect', amount: 100 },
  },
  {
    id: 'cc9', deck: 'community_chest',
    text: 'Income tax refund. Collect $20.',
    action: { type: 'collect', amount: 20 },
  },
  {
    id: 'cc10', deck: 'community_chest',
    text: 'It is your birthday. Collect $10 from every player.',
    action: { type: 'collect_from_each', amount: 10 },
  },
  {
    id: 'cc11', deck: 'community_chest',
    text: 'Life insurance matures. Collect $100.',
    action: { type: 'collect', amount: 100 },
  },
  {
    id: 'cc12', deck: 'community_chest',
    text: 'Pay hospital fees of $100.',
    action: { type: 'pay', amount: 100 },
  },
  {
    id: 'cc13', deck: 'community_chest',
    text: 'Pay school fees of $150.',
    action: { type: 'pay', amount: 150 },
  },
  {
    id: 'cc14', deck: 'community_chest',
    text: 'Receive $25 consultancy fee.',
    action: { type: 'collect', amount: 25 },
  },
  {
    id: 'cc15', deck: 'community_chest',
    text: 'You are assessed for street repairs. $40 per house, $115 per hotel.',
    action: { type: 'repairs', houseAmount: 40, hotelAmount: 115 },
  },
  {
    id: 'cc16', deck: 'community_chest',
    text: 'You have won second prize in a beauty contest. Collect $10.',
    action: { type: 'collect', amount: 10 },
  },
  {
    id: 'cc17', deck: 'community_chest',
    text: 'You inherit $100.',
    action: { type: 'collect', amount: 100 },
  },
];
