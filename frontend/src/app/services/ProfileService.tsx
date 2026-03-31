import axiosInstance from "../interceptor/AxiosInterceptor";
import { secureInfo, secureError } from "./secure-logging-service";
import { extractErrorMessage, formatErrorForLogging } from "./error-extractor-service";

const normalizeProfilePayload = (profile: any) => {
    const normalizedExperiences = Array.isArray(profile?.experiences)
        ? profile.experiences.map((experience: any) => {
            if (!experience || typeof experience !== "object") {
                return experience;
            }

            const { jobTitle, ...rest } = experience;
            return {
                ...rest,
                title: experience.title ?? jobTitle ?? "",
            };
        })
        : profile?.experiences;

    return {
        ...profile,
        experiences: normalizedExperiences,
    };
};

const getProfile = async (id:any)=>{
    secureInfo('Fetching profile', { profileId: id }, 'ProfileService');
    try {
        const response = await axiosInstance.get(`/profiles/get/${id}`);
        console.log('Get profile response:', {
            status: response.status,
            dataKeys: Object.keys(response.data || {}),
            timestamp: new Date().toISOString()
        });
        secureInfo('Profile fetched successfully', undefined, 'ProfileService');
        return response.data;
    } catch (error:any) {
        console.error('Get profile error:', formatErrorForLogging(error, 'GetProfile'));
        secureError('Failed to fetch profile', error, 'ProfileService');
        throw error;
    }
}

const updateProfile = async (profile:any)=>{
    // Note: PII data in profile is automatically sanitized by SecureLoggingService
    secureInfo('Updating profile', { profileId: profile?.id }, 'ProfileService');
    try {
        const normalizedProfile = normalizeProfilePayload(profile);
        console.log('Sending profile update request for ID:', profile?.id);
        const response = await axiosInstance.put(`/profiles/update`, normalizedProfile);
        console.log('Update profile response:', {
            status: response.status,
            profileId: response.data?.id,
            timestamp: new Date().toISOString()
        });
        secureInfo('Profile updated successfully', undefined, 'ProfileService');
        return response.data;
    } catch (error:any) {
        console.error('Update profile error:', formatErrorForLogging(error, 'UpdateProfile'));
        secureError('Failed to update profile', error, 'ProfileService');
        throw error;
    }
}

const patchProfile = async (profileId: number, changes: any) => {
    secureInfo('Patching profile section', { profileId, changedKeys: Object.keys(changes || {}) }, 'ProfileService');
    try {
        const normalizedChanges = normalizeProfilePayload(changes);
        const response = await axiosInstance.patch(`/profiles/${profileId}`, normalizedChanges);
        secureInfo('Profile section patched successfully', undefined, 'ProfileService');
        return response.data;
    } catch (error:any) {
        console.error('Patch profile error:', formatErrorForLogging(error, 'PatchProfile'));
        secureError('Failed to patch profile section', error, 'ProfileService');
        throw error;
    }
}

const getAllProfiles = async ()=>{
    secureInfo('Fetching all profiles', undefined, 'ProfileService');
    try {
        const response = await axiosInstance.get(`/profiles/getAll`);
        console.log('Get all profiles response:', {
            status: response.status,
            count: response.data?.length,
            timestamp: new Date().toISOString()
        });
        secureInfo('All profiles fetched successfully', undefined, 'ProfileService');
        return response.data;
    } catch (error:any) {
        console.error('Get all profiles error:', formatErrorForLogging(error, 'GetAllProfiles'));
        secureError('Failed to fetch all profiles', error, 'ProfileService');
        throw error;
    }
}

const uploadResume = async (profileId: number, fileData: string, fileName: string) => {
    const response = await axiosInstance.post(`/profiles/uploadResume`, { profileId, fileData, fileName });
    return response.data;
};

const parseResume = async (fileData: string, fileName: string) => {
    const response = await axiosInstance.post(`/profiles/parseResume`, { fileData, fileName });
    return response.data;
};

const chatWithProfileAssistant = async (message: string, accountType?: string, profileContext?: string) => {
    const response = await axiosInstance.post(`/profiles/chatAssistant`, {
        message,
        accountType,
        profileContext,
    });
    return response.data?.reply;
};

export {getProfile, updateProfile, patchProfile, getAllProfiles, uploadResume, parseResume, chatWithProfileAssistant};