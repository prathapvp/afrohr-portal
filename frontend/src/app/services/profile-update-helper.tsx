/**
 * ProfileUpdateHelper - Ensures profile update payloads always include required fields
 * Required fields by backend: id, name, email
 */

export const ensureRequiredProfileFields = (profile: any, updates: any = {}): any => {
    /**
     * Merges updates with the base profile, ensuring required backend fields are always present
     * @param profile - The complete profile object from Redux store
     * @param updates - Partial update object containing only changed fields
     * @returns Complete profile update payload with required fields
     */
    
    const payload = {
        id: profile?.id,
        name: profile?.name,
        email: profile?.email,
        ...updates
    };
    
    // Validate that required fields are present
    if (!payload.id) {
        console.warn('⚠️ Profile update: Missing profile ID - this may cause backend validation failure');
    }
    if (!payload.name) {
        console.warn('⚠️ Profile update: Missing profile name - this may cause backend validation failure');
    }
    if (!payload.email) {
        console.warn('⚠️ Profile update: Missing profile email - this may cause backend validation failure');
    }
    
    return payload;
};

/**
 * Validates that a profile has all required fields before sending to backend
 */
export const validateProfileHasRequiredFields = (profile: any): { valid: boolean; missing: string[] } => {
    const missing: string[] = [];
    
    if (!profile?.id) missing.push('id');
    if (!profile?.name) missing.push('name');
    if (!profile?.email) missing.push('email');
    
    return {
        valid: missing.length === 0,
        missing
    };
};

/**
 * Logs detailed information about profile update payload for debugging
 */
export const logProfileUpdatePayload = (payload: any, context: string = 'Profile Update'): void => {
    console.log(`📦 ${context} Payload:`, {
        id: payload?.id,
        name: payload?.name,
        email: payload?.email,
        hasName: !!payload?.name,
        hasEmail: !!payload?.email,
        hasId: !!payload?.id,
        otherFields: Object.keys(payload || {}).filter(k => !['id', 'name', 'email'].includes(k))
    });
};
