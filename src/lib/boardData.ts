import type { BoardSpace, ColorGroup } from '@/types/game';

export const BOARD_SPACES: BoardSpace[] = [
  { id: 0, name: 'GO', type: 'go' },
  { id: 1, name: 'Spruce Path', type: 'property', colorGroup: 'brown', price: 60, rent: [2, 10, 30, 90, 160, 250], houseCost: 50 },
  { id: 2, name: 'Community Chest', type: 'community_chest' },
  { id: 3, name: 'Birch Lane', type: 'property', colorGroup: 'brown', price: 60, rent: [4, 20, 60, 180, 320, 450], houseCost: 50 },
  { id: 4, name: 'Income Tax', type: 'tax', taxAmount: 200 },
  { id: 5, name: 'Northern Rail', type: 'railroad', price: 200 },
  { id: 6, name: 'Pine Avenue', type: 'property', colorGroup: 'light_blue', price: 100, rent: [6, 30, 90, 270, 400, 550], houseCost: 50 },
  { id: 7, name: 'Chance', type: 'chance' },
  { id: 8, name: 'Cedar Walk', type: 'property', colorGroup: 'light_blue', price: 100, rent: [6, 30, 90, 270, 400, 550], houseCost: 50 },
  { id: 9, name: 'Willow Row', type: 'property', colorGroup: 'light_blue', price: 120, rent: [8, 40, 100, 300, 450, 600], houseCost: 50 },
  { id: 10, name: 'Jail', type: 'jail' },
  { id: 11, name: 'Maple Grove', type: 'property', colorGroup: 'pink', price: 140, rent: [10, 50, 150, 450, 625, 750], houseCost: 100 },
  { id: 12, name: 'The Sawmill', type: 'utility', price: 150 },
  { id: 13, name: 'Cherry Way', type: 'property', colorGroup: 'pink', price: 140, rent: [10, 50, 150, 450, 625, 750], houseCost: 100 },
  { id: 14, name: 'Ash Court', type: 'property', colorGroup: 'pink', price: 160, rent: [12, 60, 180, 500, 700, 900], houseCost: 100 },
  { id: 15, name: 'Western Logging', type: 'railroad', price: 200 },
  { id: 16, name: 'Elm Boulevard', type: 'property', colorGroup: 'orange', price: 180, rent: [14, 70, 200, 550, 750, 950], houseCost: 100 },
  { id: 17, name: 'Community Chest', type: 'community_chest' },
  { id: 18, name: 'Hickory Lane', type: 'property', colorGroup: 'orange', price: 180, rent: [14, 70, 200, 550, 750, 950], houseCost: 100 },
  { id: 19, name: 'Chestnut Avenue', type: 'property', colorGroup: 'orange', price: 200, rent: [16, 80, 220, 600, 800, 1000], houseCost: 100 },
  { id: 20, name: 'Free Parking', type: 'free_parking' },
  { id: 21, name: 'Rosewood Road', type: 'property', colorGroup: 'red', price: 220, rent: [18, 90, 250, 700, 875, 1050], houseCost: 150 },
  { id: 22, name: 'Chance', type: 'chance' },
  { id: 23, name: 'Oakwood Drive', type: 'property', colorGroup: 'red', price: 220, rent: [18, 90, 250, 700, 875, 1050], houseCost: 150 },
  { id: 24, name: 'Fireside Street', type: 'property', colorGroup: 'red', price: 240, rent: [20, 100, 300, 750, 925, 1100], houseCost: 150 },
  { id: 25, name: 'Southern Timber', type: 'railroad', price: 200 },
  { id: 26, name: 'Juniper Close', type: 'property', colorGroup: 'yellow', price: 260, rent: [22, 110, 330, 800, 975, 1150], houseCost: 150 },
  { id: 27, name: 'Aspen Heights', type: 'property', colorGroup: 'yellow', price: 260, rent: [22, 110, 330, 800, 975, 1150], houseCost: 150 },
  { id: 28, name: 'The Lumberyard', type: 'utility', price: 150 },
  { id: 29, name: 'Birchwood Park', type: 'property', colorGroup: 'yellow', price: 280, rent: [24, 120, 360, 850, 1025, 1200], houseCost: 150 },
  { id: 30, name: 'Go to Jail', type: 'go_to_jail' },
  { id: 31, name: 'Greenwood Cres.', type: 'property', colorGroup: 'green', price: 300, rent: [26, 130, 390, 900, 1100, 1275], houseCost: 200 },
  { id: 32, name: 'Walnut Way', type: 'property', colorGroup: 'green', price: 300, rent: [26, 130, 390, 900, 1100, 1275], houseCost: 200 },
  { id: 33, name: 'Community Chest', type: 'community_chest' },
  { id: 34, name: 'Mahogany Row', type: 'property', colorGroup: 'green', price: 320, rent: [28, 150, 450, 1000, 1200, 1400], houseCost: 200 },
  { id: 35, name: 'Eastern Rail Co.', type: 'railroad', price: 200 },
  { id: 36, name: 'Chance', type: 'chance' },
  { id: 37, name: 'Cedarwood Park', type: 'property', colorGroup: 'dark_blue', price: 350, rent: [35, 175, 500, 1100, 1300, 1500], houseCost: 200 },
  { id: 38, name: 'Luxury Tax', type: 'tax', taxAmount: 75 },
  { id: 39, name: 'The Great Oak', type: 'property', colorGroup: 'dark_blue', price: 400, rent: [50, 200, 600, 1400, 1700, 2000], houseCost: 200 },
];

export const COLOR_GROUPS: Record<ColorGroup, number[]> = {
  brown: [1, 3],
  light_blue: [6, 8, 9],
  pink: [11, 13, 14],
  orange: [16, 18, 19],
  red: [21, 23, 24],
  yellow: [26, 27, 29],
  green: [31, 32, 34],
  dark_blue: [37, 39],
};

export const COLOR_HEX: Record<ColorGroup, string> = {
  brown: '#92400e',
  light_blue: '#7dd3fc',
  pink: '#f9a8d4',
  orange: '#fb923c',
  red: '#ef4444',
  yellow: '#facc15',
  green: '#22c55e',
  dark_blue: '#1d4ed8',
};

export const RAILROAD_IDS = [5, 15, 25, 35];
export const UTILITY_IDS = [12, 28];
