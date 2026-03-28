import axiosInstance from '../interceptor/AxiosInterceptor';

const loginUser = async (login: any) => {
    try {
        console.log('Login request:', { email: login.email, timestamp: new Date().toISOString() });
        
        const response = await axiosInstance.post('/auth/login', login);
        
        console.log('Login response received:', {
            status: response.status,
            headers: response.headers,
            data: response.data,
            timestamp: new Date().toISOString()
        });
        
        // Handle multiple possible response formats
        const responseData = response.data;
        
        // Ensure we have a token in some form
        const token = responseData?.jwt || responseData?.token || responseData?.accessToken;
        
        if (!token) {
            console.error('No token found in response. Available keys:', Object.keys(responseData || {}));
            const error: any = new Error('Login response missing token');
            error.response = response;
            throw error;
        }
        
        // Return response with normalized token field
        return {
            ...responseData,
            jwt: token // Ensure jwt field always exists
        };
    } catch (error: any) {
        console.error('Login error:', {
            message: error?.message,
            status: error?.response?.status,
            data: error?.response?.data,
            headers: error?.response?.headers,
            request: error?.request,
            timestamp: new Date().toISOString()
        });
        
        // Provide detailed error information
        if (error.response) {
            // Server responded with error status
            const errorData = error.response.data;
            const errorMsg = errorData?.errorMessage || errorData?.message || errorData?.error || 'Server error during login';
            const detailedError: any = new Error(errorMsg);
            detailedError.response = error.response;
            throw detailedError;
        } else if (error.request) {
            // Request made but no response received
            const networkError: any = new Error('Network error: Cannot connect to server. Check if backend is running.');
            networkError.response = { 
                status: 0,
                data: { errorMessage: 'Connection failed' } 
            };
            throw networkError;
        } else {
            // Error in request setup or response parsing
            throw error;
        }
    }
};

export { loginUser };