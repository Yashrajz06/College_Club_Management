import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface College {
  id: string;
  name: string;
  domain: string;
}

interface CollegeState {
  colleges: College[];
  currentCollegeId: string | null;
  loading: boolean;
}

const initialState: CollegeState = {
  colleges: [],
  currentCollegeId: localStorage.getItem('collegeId'),
  loading: false,
};

const collegeSlice = createSlice({
  name: 'college',
  initialState,
  reducers: {
    setColleges: (state, action: PayloadAction<College[]>) => {
      state.colleges = action.payload;
    },
    setCurrentCollegeId: (state, action: PayloadAction<string | null>) => {
      state.currentCollegeId = action.payload;
      if (action.payload) {
        localStorage.setItem('collegeId', action.payload);
      } else {
        localStorage.removeItem('collegeId');
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
  },
});

export const { setColleges, setCurrentCollegeId, setLoading } = collegeSlice.actions;
export default collegeSlice.reducer;
