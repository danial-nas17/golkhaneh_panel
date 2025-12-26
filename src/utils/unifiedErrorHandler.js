import { message, notification, Modal } from "antd";
import { ErrorHandler } from "./errorHandler";

/**
 * Unified Error Handler for consistent error handling across the application
 * Handles both 422 validation errors and 403 forbidden errors according to your API format
 */
export class UnifiedErrorHandler {
  /**
   * Handle API errors with automatic message display and form field error setting
   * @param {Object} error - Axios error object
   * @param {Object} form - Ant Design form instance (optional)
   * @param {Object} options - Configuration options
   * @returns {Object} Processed error information
   */
  static handleApiError(error, form = null, options = {}) {
    // Check if showValidationMessages was explicitly provided (not just default)
    const showValidationMessagesExplicitlySet = 'showValidationMessages' in options;
    
    const {
      showValidationMessages = false, // Don't show validation messages by default
      showGeneralMessages = true,     // Show general error messages by default
      defaultMessage = "خطایی رخ داده است"
    } = options;

    if (!error.response) {
      // Network or other errors
      // Check if browser reports offline status
      const isOffline = !navigator.onLine;
      
      if (showGeneralMessages) {
        Modal.error({
          title: (
            <div style={{ 
              fontSize: '18px', 
              fontWeight: 'bold', 
              color: '#f5222d',
              fontFamily: 'MyCustomFont, sans-serif'
            }}>
              🌐 {isOffline ? 'اتصال اینترنت قطع شده است' : 'خطای شبکه'}
            </div>
          ),
          content: (
            <div style={{ 
              fontFamily: 'MyCustomFont, sans-serif',
              fontSize: '14px',
              lineHeight: '1.8',
              color: '#262626',
              padding: '12px',
              backgroundColor: '#fff2f0',
              borderRight: '3px solid #ff4d4f',
              borderRadius: '4px'
            }}>
              {isOffline 
                ? 'اتصال اینترنت شما قطع شده است. لطفاً اتصال اینترنت خود را بررسی کنید و دوباره تلاش کنید.'
                : 'لطفاً اتصال اینترنت خود را بررسی کنید و دوباره تلاش کنید.'
              }
            </div>
          ),
          okText: 'متوجه شدم',
          okButtonProps: {
            style: {
              fontFamily: 'MyCustomFont, sans-serif',
              fontSize: '14px',
              height: '40px',
              paddingLeft: '24px',
              paddingRight: '24px'
            }
          },
          width: 520,
          centered: true,
          style: { direction: 'rtl' },
          icon: null,
          className: 'custom-error-modal'
        });
      }
      return {
        hasError: true,
        type: 'network',
        message: isOffline ? "اتصال اینترنت قطع شده است" : "خطای شبکه",
        validationErrors: {},
        status: null
      };
    }

    const { status, data } = error.response;
    const result = {
      hasError: true,
      type: 'api',
      status: status,
      message: data?.message || defaultMessage,
      validationErrors: {},
      data: data
    };

    switch (status) {
      case 422:
        // Validation errors - special format with nested errors
        result.type = 'validation';
        result.message = data?.message || "خطای اعتبارسنجی";
        result.validationErrors = data?.data?.errors || {};
        
        // Handle form field errors if form is provided
        if (form && Object.keys(result.validationErrors).length > 0) {
          this.setFormFieldErrors(form, result.validationErrors);
        }
        
        // For 422 errors, always show validation messages by default (unless explicitly disabled)
        // This ensures users see specific validation error messages like "pots.0.serial_code قبلا انتحاب شده است."
        const hasValidationErrors = Object.keys(result.validationErrors).length > 0;
        
        // Show validation messages if:
        // 1. There are validation errors AND
        // 2. showValidationMessages is not explicitly set to false
        // For 422 errors, we always show validation messages by default to help users understand what went wrong
        const shouldShowValidationMessages = hasValidationErrors && showValidationMessages !== false;
        
        if (shouldShowValidationMessages) {
          this.showValidationMessages(result.validationErrors);
        }
        
        // Show general validation error message only if no specific validation errors exist
        // or if validation messages were explicitly disabled
        if (showGeneralMessages && (!hasValidationErrors || showValidationMessages === false)) {
          message.error(result.message);
        }
        break;

      default:
        // All other errors (403, 409, 500, etc.) follow the same format
        // Use decoded message from API interceptor if available
        const decodedMessage = error.decodedMessage || error.errorData?.decodedMessage;
        
        result.type = this.getErrorType(status);
        result.message = decodedMessage || data?.message || this.getDefaultMessage(status, defaultMessage);
        
        if (showGeneralMessages) {
          // Show general errors using Modal for better visibility
          Modal.error({
            title: (
              <div style={{ 
                fontSize: '18px', 
                fontWeight: 'bold', 
                color: '#f5222d',
                fontFamily: 'MyCustomFont, sans-serif'
              }}>
                ⚠️ خطا
              </div>
            ),
            content: (
              <div style={{ 
                fontFamily: 'MyCustomFont, sans-serif',
                fontSize: '14px',
                lineHeight: '1.8',
                color: '#262626',
                padding: '12px',
                backgroundColor: '#fff2f0',
                borderRight: '3px solid #ff4d4f',
                borderRadius: '4px'
              }}>
                {result.message}
              </div>
            ),
            okText: 'متوجه شدم',
            okButtonProps: {
              style: {
                fontFamily: 'MyCustomFont, sans-serif',
                fontSize: '14px',
                height: '40px',
                paddingLeft: '24px',
                paddingRight: '24px'
              }
            },
            width: 520,
            centered: true,
            style: { direction: 'rtl' },
            icon: null,
            className: 'custom-error-modal'
          });
        }
        break;
    }

    return result;
  }

  /**
   * Set form field errors from validation errors
   * @param {Object} form - Ant Design form instance
   * @param {Object} validationErrors - Validation errors object
   */
  static setFormFieldErrors(form, validationErrors) {
    if (!form || !validationErrors) return;

    const fieldErrors = Object.keys(validationErrors).map(fieldName => ({
      name: fieldName,
      errors: validationErrors[fieldName].map(errorMsg => 
        ErrorHandler.decodeUnicodeString(errorMsg)
      )
    }));

    form.setFields(fieldErrors);
  }

  /**
   * Show validation error messages
   * @param {Object} validationErrors - Validation errors object
   */
  static showValidationMessages(validationErrors) {
    if (!validationErrors || typeof validationErrors !== 'object') {
      return;
    }

    const errorKeys = Object.keys(validationErrors);
    if (errorKeys.length === 0) {
      return;
    }

    // Collect all error messages - decode Unicode and show them directly
    const allErrorMessages = [];

    errorKeys.forEach(field => {
      const errors = validationErrors[field];
      if (Array.isArray(errors) && errors.length > 0) {
        errors.forEach(error => {
          // Decode Unicode characters in the error message
          const decodedError = ErrorHandler.decodeUnicodeString(error);
          if (decodedError && decodedError.trim()) {
            allErrorMessages.push(decodedError.trim());
          }
        });
      }
    });

    // Show all errors using Modal.error with beautiful styling
    if (allErrorMessages.length > 0) {
      Modal.error({
        title: (
          <div style={{ 
            fontSize: '18px', 
            fontWeight: 'bold', 
            color: '#f5222d',
            fontFamily: 'MyCustomFont, sans-serif'
          }}>
            ⚠️ خطای اعتبارسنجی
          </div>
        ),
        content: (
          <div style={{ 
            fontFamily: 'MyCustomFont, sans-serif',
            fontSize: '14px',
            lineHeight: '1.8',
            color: '#262626'
          }}>
            {allErrorMessages.length === 1 ? (
              <div style={{
                padding: '12px',
                backgroundColor: '#fff2f0',
                borderRight: '3px solid #ff4d4f',
                borderRadius: '4px'
              }}>
                {allErrorMessages[0]}
              </div>
            ) : (
              <div>
                {allErrorMessages.map((msg, idx) => (
                  <div 
                    key={idx} 
                    style={{
                      padding: '10px 12px',
                      marginBottom: idx < allErrorMessages.length - 1 ? '8px' : '0',
                      backgroundColor: '#fff2f0',
                      borderRight: '3px solid #ff4d4f',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'flex-start'
                    }}
                  >
                    <span style={{
                      minWidth: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      backgroundColor: '#ff4d4f',
                      color: '#fff',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      marginLeft: '10px',
                      flexShrink: 0
                    }}>
                      {idx + 1}
                    </span>
                    <span style={{ flex: 1 }}>{msg}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ),
        okText: 'متوجه شدم',
        okButtonProps: {
          style: {
            fontFamily: 'MyCustomFont, sans-serif',
            fontSize: '14px',
            height: '40px',
            paddingLeft: '24px',
            paddingRight: '24px'
          }
        },
        width: 520,
        centered: true,
        style: { direction: 'rtl' },
        icon: null,
        className: 'custom-error-modal'
      });
    }
  }

  /**
   * Handle validation errors specifically for forms
   * @param {Object} error - Axios error object
   * @param {Object} form - Ant Design form instance
   * @param {Object} options - Configuration options
   * @returns {Object} Processed validation error information
   */
  static handleValidationError(error, form, options = {}) {
    return this.handleApiError(error, form, {
      showValidationMessages: false,
      showGeneralMessages: true,
      ...options
    });
  }

  /**
   * Handle forbidden errors specifically
   * @param {Object} error - Axios error object
   * @param {Object} options - Configuration options
   * @returns {Object} Processed forbidden error information
   */
  static handleForbiddenError(error, options = {}) {
    return this.handleApiError(error, null, {
      showGeneralMessages: true,
      ...options
    });
  }

  /**
   * Get first validation error for a specific field
   * @param {Object} validationErrors - Validation errors object
   * @param {string} fieldName - Field name
   * @returns {string|null} First error message or null
   */
  static getFirstFieldError(validationErrors, fieldName) {
    if (!validationErrors || !validationErrors[fieldName]) {
      return null;
    }

    const errors = validationErrors[fieldName];
    if (Array.isArray(errors) && errors.length > 0) {
      return ErrorHandler.decodeUnicodeString(errors[0]);
    }

    return null;
  }

  /**
   * Check if field has validation errors
   * @param {Object} validationErrors - Validation errors object
   * @param {string} fieldName - Field name
   * @returns {boolean} True if field has errors
   */
  static hasFieldError(validationErrors, fieldName) {
    return this.getFirstFieldError(validationErrors, fieldName) !== null;
  }

  /**
   * Format validation errors for display in components
   * @param {Object} validationErrors - Validation errors object
   * @returns {Object} Formatted errors for display
   */
  static formatValidationErrorsForDisplay(validationErrors) {
    const formatted = {};
    
    if (!validationErrors || typeof validationErrors !== 'object') {
      return formatted;
    }

    Object.keys(validationErrors).forEach(field => {
      const errors = validationErrors[field];
      if (Array.isArray(errors) && errors.length > 0) {
        formatted[field] = {
          status: 'error',
          help: ErrorHandler.decodeUnicodeString(errors[0]),
          errors: errors.map(error => ErrorHandler.decodeUnicodeString(error))
        };
      }
    });

    return formatted;
  }

  /**
   * Get error type based on status code
   * @param {number} status - HTTP status code
   * @returns {string} Error type
   */
  static getErrorType(status) {
    switch (status) {
      case 401: return 'unauthorized';
      case 403: return 'forbidden';
      case 404: return 'not_found';
      case 409: return 'conflict';
      case 500: return 'server_error';
      default: return 'unknown';
    }
  }

  /**
   * Get default message based on status code
   * @param {number} status - HTTP status code
   * @param {string} fallback - Fallback message
   * @returns {string} Default message
   */
  static getDefaultMessage(status, fallback) {
    switch (status) {
      case 401: return "عدم دسترسی - لطفاً مجدداً وارد شوید";
      case 403: return "شما مجوز دسترسی به این بخش را ندارید";
      case 404: return "اطلاعات مورد نظر یافت نشد";
      case 409: return "تداخل در اطلاعات - عملیات امکان‌پذیر نیست";
      case 500: return "خطای سرور - لطفاً بعداً تلاش کنید";
      default: return fallback;
    }
  }
}

export default UnifiedErrorHandler;