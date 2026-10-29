import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { fetchAnalogues, fetchBrands } from '../api/wsprice.js';

export const MIN_QUERY_LENGTH = 2;

export const searchBrands = createAsyncThunk(
  'parts/searchBrands',
  async (number, { signal, rejectWithValue }) => {
    try {
      return { number, items: await fetchBrands(number, signal) };
    } catch (error) {
      if (error.name === 'AbortError') throw error;
      return rejectWithValue(error.message);
    }
  },
);

export const loadAnalogues = createAsyncThunk(
  'parts/loadAnalogues',
  async ({ item, number }, { signal, rejectWithValue }) => {
    try {
      return { item, ...(await fetchAnalogues({ number, brand: item.brand }, signal)) };
    } catch (error) {
      if (error.name === 'AbortError') throw error;
      return rejectWithValue(error.message);
    }
  },
);

const initialState = {
  query: '',
  brandsStatus: 'idle',
  brands: [],
  brandsError: null,
  brandsNumber: '',
  selection: null,
  base: null,
  offersStatus: 'idle',
  offers: [],
  offersError: null,
};

const emptyBrands = (state) => {
  state.brandsStatus = 'idle';
  state.brands = [];
  state.brandsError = null;
  state.brandsNumber = '';
  emptySelection(state);
};

const emptySelection = (state) => {
  state.selection = null;
  state.base = null;
  state.offersStatus = 'idle';
  state.offers = [];
  state.offersError = null;
};

const partsSlice = createSlice({
  name: 'parts',
  initialState,
  reducers: {
    queryChanged(state, action) {
      state.query = action.payload;
      if (action.payload.trim().length < MIN_QUERY_LENGTH) {
        emptyBrands(state);
      }
    },
    clearSelection(state) {
      emptySelection(state);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(searchBrands.pending, (state) => {
        state.brandsStatus = 'loading';
        state.brandsError = null;
        emptySelection(state);
      })
      .addCase(searchBrands.fulfilled, (state, action) => {
        state.brandsStatus = 'succeeded';
        state.brands = action.payload.items;
        state.brandsNumber = action.payload.number;
      })
      .addCase(searchBrands.rejected, (state, action) => {
        if (action.meta.aborted) {
          return;
        }
        state.brandsStatus = 'failed';
        state.brands = [];
        state.brandsError = action.payload || 'Не удалось получить список производителей.';
      })
      .addCase(loadAnalogues.pending, (state, action) => {
        state.selection = action.meta.arg.item;
        state.offersStatus = 'loading';
        state.offers = [];
        state.base = null;
        state.offersError = null;
      })
      .addCase(loadAnalogues.fulfilled, (state, action) => {
        state.offersStatus = 'succeeded';
        state.base = action.payload.base;
        state.offers = action.payload.analogues;
      })
      .addCase(loadAnalogues.rejected, (state, action) => {
        if (action.meta.aborted) {
          return;
        }
        state.offersStatus = 'failed';
        state.offersError = action.payload || 'Не удалось получить список аналогов.';
      });
  },
});

export const { queryChanged, clearSelection } = partsSlice.actions;

export default partsSlice.reducer;
