import type { Card, Color } from '../types';
import { LEVEL_1_CARDS, LEVEL_2_CARDS, LEVEL_3_CARDS } from '../game/data/cards';

type GemColor = Exclude<Color, 'gold'>;

const GEM_IMAGE_SETS: Record<GemColor, { folder: string; files: string[] }> = {
  red: {
    folder: 'rubies',
    files: [
      'gemRuby.png',
      'ruby-01.jpg',
      'ruby-02.jpeg',
      'ruby-03.png',
      'ruby-04.png',
      'rubies-05.png',
      'ruby-06.png',
      'ruby-07.png',
    ],
  },
  blue: {
    folder: 'sapphires',
    files: [
      'sapphire-01.jpg',
      'sapphire-02.jpg',
      'sapphire-03.png',
      'sapphire-04.png',
      'sapphire-05.png',
      'sapphire-06.png',
      'sapphire-07.png',
    ],
  },
  green: {
    folder: 'emeralds',
    files: [
      'emerald-01.jpg',
      'emerald-02.jpg',
      'emerald-03.jpg',
      'emerald-04.png',
      'emerald-05.png',
      'emerald-06.png',
      'emerald-07.png',
      'emerald-08.jpg',
    ],
  },
  white: {
    folder: 'diamonds',
    files: [
      'diamond-01.jpg',
      'diamond-02.jpg',
      'diamond-03.png',
      'diamond-04.png',
      'diamond-05.png',
      'diamond-06.png',
      'diamond-07.png',
    ],
  },
  black: {
    folder: 'onyx',
    files: [
      'onyx-01.jpeg',
      'onyx-02.jpg',
      'onyx-03.png',
      'onyx-04.png',
      'onyx-05.png',
      'onyxRing-01.png',
      'onyxRing-02.png',
    ],
  },
};

const ALL_CARDS: Card[] = [...LEVEL_1_CARDS, ...LEVEL_2_CARDS, ...LEVEL_3_CARDS];
const cardGemBackgrounds: Record<string, string> = {};

const buildCardGemBackgrounds = () => {
  (Object.keys(GEM_IMAGE_SETS) as GemColor[]).forEach((color) => {
    const { folder, files } = GEM_IMAGE_SETS[color];
    const cardsForColor = ALL_CARDS.filter((card) => card.color === color);

    cardsForColor.forEach((card, index) => {
      const file = files[index % files.length];
      cardGemBackgrounds[card.id] = `${process.env.PUBLIC_URL}/imgs/gems/${folder}/${file}`;
    });
  });
};

buildCardGemBackgrounds();

export const getCardGemBackground = (card: Card): string | undefined => {
  return cardGemBackgrounds[card.id];
};
