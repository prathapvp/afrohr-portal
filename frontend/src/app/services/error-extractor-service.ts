/**
 * Service to extract and normalize error messages from various error response formats
 * Used across the application to provide consistent user-friendly error messages
 */

export interface ErrorResponse {
    errorMessage?: string;
    message?: string;
    errors?: Record<string, string[]> | string[];
    detail?: string;
    status?: number;
}

/**
 * Extract error message from various possible response formats
 * Priority: errorMessage > message > detail > first validation error > generic message
 */
export const extractErrorMessage = (error: any): string => {
    // Check if error has response data (axios error)
    if (error?.response?.data) {
        const data = error.response.data;
        
        // Try errorMessage field (standardized format)
        if (data.errorMessage && typeof data.errorMessage === 'string') {
            return data.errorMessage;
        }
        
        // Try message field (legacy format)
        if (data.message && typeof data.message === 'string') {
            return data.message;
        }
        
        // Try detail field
        if (data.detail && typeof data.detail === 'string') {
            return data.detail;
        }
        
        // Try validation errors object (field: [errors])
        if (data.errors && typeof data.errors === 'object') {
            const errorEntries = Object.entries(data.errors);
            if (errorEntries.length > 0) {
                const [field, messages] = errorEntries[0];
                if (Array.isArray(messages) && messages.length > 0) {
                    return `${field}: ${messages[0]}`;
                }
            }
        }
        
        // Try validation errors array
        if (Array.isArray(data.errors) && data.errors.length > 0) {
            return data.errors[0];
        }
    }
    
    // Check error message property
    if (error?.message && typeof error.message === 'string') {
        return error.message;
    }
    
    // Check status message
    if (error?.response?.status) {
        const statusMessages: Record<number, string> = {
            400: "Invalid request data",
            401: "Unauthorized - Please log in again",
            403: "Forbidden - You don't have permission",
            404: "Resource not found",
            409: "Conflict - Resource already exists",
            422: "Validation error in request data",
            429: "Too many requests - Please try again later",
            500: "Server error - Please try again later",
            503: "Service unavailable - Please try again later",
        };
        return statusMessages[error.response.status] || "An error occurred";
    }
    
    return "An unexpected error occurred";
};

/**
 * Extract validation errors specifically for field-level messages
 * Useful for form validation display
 */
export const extractValidationErrors = (error: any): Record<string, string> => {
    const validationErrors: Record<string, string> = {};
    
    if (error?.response?.data?.errors && typeof error.response.data.errors === 'object' && !Array.isArray(error.response.data.errors)) {
        const errors = error.response.data.errors;
        for (const [field, messages] of Object.entries(errors)) {
            if (Array.isArray(messages) && messages.length > 0) {
                validationErrors[field] = messages[0] as string;
            }
        }
    }
    
    return validationErrors;
};

/**
 * Format error for logging (includes context like status, timestamp)
 */
export const formatErrorForLogging = (error: any, context: string = 'Error'): object => {
    return {
        context,
        message: extractErrorMessage(error),
        status: error?.response?.status,
        errorData: error?.response?.data,
        timestamp: new Date().toISOString(),
    };
};

/**
 * Safe error message getter with fallback
 */
export const getSafeErrorMessage = (error: any, defaultMessage: string = "Operation failed"): string => {
    try {
        return extractErrorMessage(error);
    } catch {
        return defaultMessage;
    }
};
