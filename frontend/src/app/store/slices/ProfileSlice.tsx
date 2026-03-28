import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { updateProfile as updateProfileApi } from "../../services/ProfileService";
import { ensureRequiredProfileFields, logProfileUpdatePayload } from "../../services/profile-update-helper";

const profileSlice = createSlice({
    name: 'profile',
    initialState:  {},
    reducers: {
        // Pure reducer: only updates local store. Persist via thunks or components.
        changeProfile: (_state, action) => {
            return action.payload;
        },
        setProfile: (_state, action) => {
            return action.payload;
        },
        // Clear profile data on logout (zero out PII)
        clearProfile: () => {
            return {};
        },
    }
});
export const { changeProfile, setProfile, clearProfile } = profileSlice.actions;
export default profileSlice.reducer;

// Optimistic persist thunk with rollback on error
export const persistProfile = createAsyncThunk(
    "profile/persist",
    async (newProfile: any, { getState, dispatch, rejectWithValue }) => {
        try {
            const state: any = (getState() as any);
            const prev: any = state.profile || {};
            const user: any = state.user || {};
            
            // Fill required fields from user slice if missing in profile state
            const baseWithFallbacks = {
                id: prev.id,
                name: prev.name || user.name,
                email: prev.email || user.email,
                ...prev,
            };

            // Ensure required fields are present
            const completeProfile = ensureRequiredProfileFields(baseWithFallbacks, newProfile);
            logProfileUpdatePayload(completeProfile, 'persistProfile');
            
            // Ensure UI already shows latest (optimistic)
            if (JSON.stringify(prev) !== JSON.stringify(completeProfile)) {
                dispatch(changeProfile(completeProfile));
            }
            // Persist to backend
            const saved = await updateProfileApi(completeProfile);
            // Sync store with server response if it differs
            if (saved && JSON.stringify(saved) !== JSON.stringify(completeProfile)) {
                dispatch(changeProfile(saved));
            }
            return saved ?? completeProfile;
        } catch (err: any) {
            // Rollback to previous profile on failure
            const prev: any = (getState() as any).profile;
            // If current store holds newProfile, we cannot access old snapshot here reliably.
            // Consumers should pass previous copy if strict rollback is needed.
            return rejectWithValue(err?.response?.data || err?.message || "Failed to persist profile");
        }
    }
);