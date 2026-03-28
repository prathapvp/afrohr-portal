import axiosInstance from "../interceptor/AxiosInterceptor";
import { secureInfo, secureError } from "./secure-logging-service";
import { extractErrorMessage, formatErrorForLogging } from "./error-extractor-service";

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
        console.log('Sending profile update request for ID:', profile?.id);
        const response = await axiosInstance.put(`/profiles/update`, profile);
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

export {getProfile, updateProfile, getAllProfiles, uploadResume, parseResume};