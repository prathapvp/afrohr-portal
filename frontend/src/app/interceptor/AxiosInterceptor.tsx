import axios, { InternalAxiosRequestConfig, AxiosError } from "axios";
import { removeUser } from "../store/slices/UserSlice";
import { removeJwt } from "../store/slices/JwtSlice";
import { getCsrfToken, initializeCsrfToken, sanitizeErrorMessage } from "../services/security-service";
import { retryWithBackoff, shouldRateLimit, getRateLimitResetTime } from "../services/rate-limit-service";

const axiosInstance = axios.create({
    baseURL: '/api/ahrm/v3',
    timeout: 30000, // 30 second timeout
    withCredentials: false,
    headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest', // CSRF protection
    }
});

// Initialize CSRF token on app start
initializeCsrfToken();

axiosInstance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        // Get JWT token from localStorage (will migrate to httpOnly cookies with backend support)
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        // Add CSRF token for state-changing requests
        const csrfToken = getCsrfToken();
        if (csrfToken && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(config.method?.toUpperCase() || '')) {
            config.headers['X-CSRF-Token'] = csrfToken;
        }

        // Rate limiting check
        const endpoint = config.url || '';
        if (shouldRateLimit(endpoint, 10, 60000)) {
            const resetTime = getRateLimitResetTime(endpoint);
            const error: any = new Error('Rate limit exceeded. Please try again later.');
            error.response = {
                status: 429,
                data: { message: `Rate limit exceeded. Retry after ${Math.ceil(resetTime / 1000)}s` }
            };
            return Promise.reject(error);
        }

        return config;
    },
    (error: AxiosError) => {
        return Promise.reject(error);
    }
);

export const setupResponseInterceptor = (navigate: any, dispatch: any) => {
    axiosInstance.interceptors.response.use(
        (response) => {
            return response;
        },
        async (error: AxiosError) => {
            const status = error.response?.status;

            // Handle unauthorized - clear auth and redirect
            if (status === 401) {
                dispatch(removeUser());
                dispatch(removeJwt());
                navigate('/login');
                return Promise.reject(new Error('Session expired. Please log in again.'));
            }

            // Handle forbidden
            if (status === 403) {
                return Promise.reject(new Error('Access forbidden. You do not have permission.'));
            }

            // Handle rate limiting
            if (status === 429) {
                const retryAfter = error.response?.headers['retry-after'];
                const message = retryAfter 
                    ? `Too many requests. Please retry after ${retryAfter} seconds.`
                    : 'Too many requests. Please try again later.';
                return Promise.reject(new Error(message));
            }

            // Sanitize error message for security
            const sanitizedMessage = sanitizeErrorMessage(error);
            const sanitizedError: any = new Error(sanitizedMessage);
            sanitizedError.response = error.response;
            sanitizedError.originalError = error;

            return Promise.reject(sanitizedError);
        }
    );
};

/**
 * Makes an API call with retry logic and exponential backoff
 */
export const makeSecureRequest = async <T = any>(
    requestFn: () => Promise<T>,
    maxRetries: number = 3
): Promise<T> => {
    return retryWithBackoff(requestFn, { maxRetries });
};

export default axiosInstance;
