import { createSlice } from "@reduxjs/toolkit";

/**
 * JWT Slice - Token Management
 * 
 * SECURITY NOTE: Currently using localStorage for JWT tokens.
 * 
 * RECOMMENDED MIGRATION PATH (requires backend support):
 * 1. Backend should set JWT in httpOnly, secure, sameSite cookies
 * 2. Remove localStorage usage completely
 * 3. Rely on cookie-based authentication
 * 4. Backend sends token in Set-Cookie header
 * 5. Browser automatically includes cookie in requests
 * 
 * Benefits of httpOnly cookies:
 * - Not accessible via JavaScript (XSS protection)
 * - Automatically sent with requests
 * - Secure flag ensures HTTPS-only transmission
 * - SameSite flag prevents CSRF attacks
 * 
 * Implementation requires backend changes to:
 * - Set cookies instead of returning token in response body
 * - Accept credentials in requests (withCredentials: true)
 * - Configure CORS to allow credentials
 */

const jwtSlice = createSlice({
    name: 'jwt',
    initialState: localStorage.getItem("token") || "",
    reducers: {
        setJwt: (state, action) => {
            // TODO: Remove localStorage usage after backend implements httpOnly cookies
            localStorage.setItem("token", action.payload);
            state = action.payload;
            return state;
        },
        removeJwt: (state) => {
            // TODO: Remove localStorage usage after backend implements httpOnly cookies
            localStorage.removeItem("token");
            state = "";
            return state;
        }
    }
});

export const { setJwt, removeJwt } = jwtSlice.actions;
export default jwtSlice.reducer;