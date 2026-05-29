import { create } from 'zustand';
import { Card } from '../types';
import { getCards } from '../db/cards';

interface CardsState {
  cards: Card[];
  totalBalance: number;
  isLoading: boolean;
  loadCards: () => Promise<void>;
}

export const useCardsStore = create<CardsState>((set, get) => ({
  cards: [],
  totalBalance: 0,
  isLoading: true,
  
  loadCards: async () => {
    set({ isLoading: true });
    try {
      const cards = await getCards();
      const totalBalance = cards.reduce((acc, card) => acc + card.balance, 0);
      set({ cards, totalBalance, isLoading: false });
    } catch (error) {
      console.error('Error loading cards', error);
      set({ isLoading: false });
    }
  },
}));
