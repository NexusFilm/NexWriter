import { create } from 'zustand';
import type { MoodBoard, MoodBoardImage, MovieSearchResult, TMDBImage } from '@/types/productionTools';

export interface MoodBoardState {
  boards: MoodBoard[];
  currentBoard: MoodBoard | null;
  images: MoodBoardImage[];
  searchResults: MovieSearchResult[];
  movieImages: TMDBImage[];
  setBoards: (boards: MoodBoard[]) => void;
  setCurrentBoard: (board: MoodBoard | null) => void;
  setImages: (images: MoodBoardImage[]) => void;
  setSearchResults: (results: MovieSearchResult[]) => void;
  setMovieImages: (images: TMDBImage[]) => void;
}

export const useMoodBoardStore = create<MoodBoardState>((set) => ({
  boards: [],
  currentBoard: null,
  images: [],
  searchResults: [],
  movieImages: [],

  setBoards: (boards: MoodBoard[]) => {
    set({ boards });
  },

  setCurrentBoard: (board: MoodBoard | null) => {
    set({ currentBoard: board });
  },

  setImages: (images: MoodBoardImage[]) => {
    set({ images });
  },

  setSearchResults: (results: MovieSearchResult[]) => {
    set({ searchResults: results });
  },

  setMovieImages: (images: TMDBImage[]) => {
    set({ movieImages: images });
  },
}));
