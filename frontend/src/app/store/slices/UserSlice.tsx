import { createSlice } from "@reduxjs/toolkit";
import { getItem, removeItem, setItem } from "../../services/local-storage-service";
import { clearEncryptionKey } from "../../services/pii-encryption-service";

const userSlice=createSlice({
    name:'user',
    initialState:getItem("user"),
    reducers:{
        setUser:(state,action)=>{
            setItem("user",action.payload);
            localStorage.setItem("accountType", action.payload.accountType);
            state=action.payload;
            return state;
        },
        removeUser:(state)=>{
            // Clear all user data
            removeItem("user");
            removeItem("token");
            localStorage.removeItem("accountType");
            
            // Clear PII encryption keys
            clearEncryptionKey();
            
            // Zero out state to prevent memory leaks
            state=null;
            return state;
        }
    }
});
export const {setUser, removeUser}=userSlice.actions;
export default userSlice.reducer;