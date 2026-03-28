import { configureStore } from "@reduxjs/toolkit";
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";

import userReducer from "./slices/UserSlice";
import profileReducer from "./slices/ProfileSlice";
import filterReducer from "./slices/FilterSlice";
import sortReducer from "./slices/SortSlice";
import jwtReducer from "./slices/JwtSlice";
import overlayReducer from "./slices/OverlaySlice";

const store = configureStore({
    reducer: {
        user: userReducer,
        profile: profileReducer,
        filter: filterReducer,
        sort: sortReducer,
        jwt: jwtReducer,
        overlay: overlayReducer,
    },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export default store;