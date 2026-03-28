import { z, ZodError } from 'zod';
import { ApiResponseSchema } from './ValidationSchemas';

// Type definitions
interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: string[];
  message?: string;
}

interface ApiError {
  status: number;
  message: string;
  errors?: Record<string, string>;
}

/**
 * Validates data against a Zod schema and returns structured result
 */
export const validateData = <T>(
  data: unknown,
  schema: z.ZodSchema<T>,
  fieldName?: string
): ValidationResult<T> => {
  try {
    const validatedData = schema.parse(data);
    return {
      success: true,
      data: validatedData,
    };
  } catch (error) {
    if (error instanceof ZodError) {
      const issues = error.issues ?? (error as any).errors ?? [];
      const errorMessages = issues.map((err: any) => {
        const path = err.path.join('.');
        return `${path || fieldName || 'Field'}: ${err.message}`;
      });
      return {
        success: false,
        errors: errorMessages,
        message: `Validation failed for ${fieldName || 'input'}`,
      };
    }
    return {
      success: false,
      errors: ['Unknown validation error'],
      message: 'An unexpected error occurred during validation',
    };
  }
};

/**
 * Validates API response structure and extracts data
 */
export const validateApiResponse = <T>(
  response: unknown,
  dataSchema?: z.ZodSchema<T>
): ValidationResult<T> => {
  try {
    // First validate basic API response structure
    const apiResponse = ApiResponseSchema.parse(response);

    // If no data schema provided, just return the raw data
    if (!dataSchema) {
      return {
        success: true,
        data: apiResponse.data as T,
      };
    }

    // Validate data against provided schema
    if (apiResponse.data) {
      return validateData(apiResponse.data, dataSchema);
    }

    return {
      success: true,
      data: undefined,
      message: apiResponse.message || 'No data in response',
    };
  } catch (error) {
    if (error instanceof ZodError) {
      const errorMessages = error.errors.map((err) => {
        const path = err.path.join('.');
        return `${path}: ${err.message}`;
      });
      return {
        success: false,
        errors: errorMessages,
        message: 'API response validation failed',
      };
    }
    return {
      success: false,
      errors: ['Invalid API response structure'],
      message: 'Failed to validate API response',
    };
  }
};

/**
 * Safely parses and validates error responses from API
 */
export const parseApiError = (error: any): ApiError => {
  try {
    // Check if error has response data (Axios error)
    if (error?.response) {
      const { status, data } = error.response;
      return {
        status,
        message: data?.message || error.message || 'An error occurred',
        errors: data?.errors,
      };
    }

    // Generic error handling
    return {
      status: error?.status || 500,
      message: error?.message || 'An unexpected error occurred',
    };
  } catch {
    return {
      status: 500,
      message: 'Failed to parse error response',
    };
  }
};

/**
 * Batch validates multiple form fields
 */
export const validateFormFields = (
  formData: Record<string, any>,
  schemas: Record<string, z.ZodSchema>
): Record<string, string[]> => {
  const errors: Record<string, string[]> = {};

  Object.entries(schemas).forEach(([fieldName, schema]) => {
    const result = validateData(formData[fieldName], schema, fieldName);
    if (!result.success && result.errors) {
      errors[fieldName] = result.errors;
    }
  });

  return errors;
};

/**
 * Type-safe field validation for React form handlers
 */
export const createFieldValidator = <T extends Record<string, any>>(
  schema: z.ZodSchema<T>
) => {
  return (fieldName: keyof T, value: any) => {
    // Ensure schema is actually a ZodObject
    if (!(schema instanceof z.ZodObject)) {
      // If not an object, just validate whole value
      try {
        schema.parse(value);
        return { valid: true };
      } catch (error) {
        if (error instanceof ZodError) {
          return { valid: false, error: error.errors[0]?.message || 'Invalid value' };
        }
        return { valid: false, error: 'Validation failed' };
      }
    }

    // If ZodObject, validate the specific field
    const fieldSchema = schema.shape[fieldName as string];
    if (!fieldSchema) {
      return { valid: true };
    }

    try {
      fieldSchema.parse(value);
      return { valid: true };
    } catch (error) {
      if (error instanceof ZodError) {
        return { valid: false, error: error.errors[0]?.message || 'Invalid value' };
      }
      return { valid: false, error: 'Validation failed' };
    }
  };
};


/**
 * Creates a sanitized copy of data by validating against schema
 * (removes extra fields not in schema)
 */
export const sanitizeData = <T>(
  data: unknown,
  schema: z.ZodSchema<T>
): T | null => {
  const result = validateData(data, schema);
  return result.success && result.data ? result.data : null;
};
