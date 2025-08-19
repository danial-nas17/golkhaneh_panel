import { message } from "antd";

/**
 * Global error handler for API responses
 * Handles different types of errors including validation errors
 */
export class ErrorHandler {
  /**
   * Handle API errors and display appropriate messages
   * @param {Object} error - Axios error object
   * @param {string} defaultMessage - Default error message to show
   * @returns {Object} Processed error information
   */
  static handleError(error, defaultMessage = "خطایی رخ داده است") {
    const errorInfo = {
      hasError: true,
      message: defaultMessage,
      validationErrors: {},
      status: null,
      data: null
    };

    if (error.response) {
      const { status, data } = error.response;
      errorInfo.status = status;
      errorInfo.data = data;

      switch (status) {
        case 422:
          // Validation errors
          errorInfo.message = data.message || "خطای اعتبارسنجی";
          errorInfo.validationErrors = data.data?.errors || data.errors || {};
          this.handleValidationErrors(errorInfo.validationErrors);
          break;
        
        case 401:
          errorInfo.message = "عدم دسترسی - لطفاً مجدداً وارد شوید";
          message.error(errorInfo.message);
          break;
        
        case 403:
          errorInfo.message = "شما مجوز دسترسی به این بخش را ندارید";
          message.error(errorInfo.message);
          break;
        
        case 404:
          errorInfo.message = "اطلاعات مورد نظر یافت نشد";
          message.error(errorInfo.message);
          break;
        
        case 500:
          errorInfo.message = "خطای سرور - لطفاً بعداً تلاش کنید";
          message.error(errorInfo.message);
          break;
        
        default:
          errorInfo.message = data.message || defaultMessage;
          message.error(errorInfo.message);
      }
    } else if (error.request) {
      // Network error
      errorInfo.message = "خطای شبکه - لطفاً اتصال اینترنت خود را بررسی کنید";
      message.error(errorInfo.message);
    } else {
      // Other errors
      errorInfo.message = error.message || defaultMessage;
      message.error(errorInfo.message);
    }

    return errorInfo;
  }

  /**
   * Handle validation errors specifically
   * @param {Object} validationErrors - Validation errors object
   */
  static handleValidationErrors(validationErrors) {
    if (!validationErrors || typeof validationErrors !== 'object') {
      return;
    }

    // Display validation errors
    Object.keys(validationErrors).forEach(field => {
      const errors = validationErrors[field];
      if (Array.isArray(errors) && errors.length > 0) {
        // Decode Unicode characters in error messages
        const decodedErrors = errors.map(error => this.decodeUnicodeString(error));
        message.error(`${this.getFieldDisplayName(field)}: ${decodedErrors.join(', ')}`);
      }
    });
  }

  /**
   * Decode Unicode escape sequences in strings
   * @param {string} str - String with Unicode escape sequences
   * @returns {string} Decoded string
   */
  static decodeUnicodeString(str) {
    if (typeof str !== 'string') return str;
    
    try {
      // Replace Unicode escape sequences
      return str.replace(/\\u[\dA-F]{4}/gi, (match) => {
        return String.fromCharCode(parseInt(match.replace(/\\u/g, ''), 16));
      });
    } catch (error) {
      console.warn('Error decoding Unicode string:', error);
      return str;
    }
  }

  /**
   * Get display name for form fields
   * @param {string} fieldName - Field name from validation error
   * @returns {string} Display name in Persian
   */
  static getFieldDisplayName(fieldName) {
    const fieldNames = {
      'title': 'عنوان',
      'description': 'توضیحات',
      'category_id': 'دسته‌بندی',
      'parent_id': 'والد',
      'order': 'ترتیب',
      'type': 'نوع',
      'is_required': 'اجباری بودن',
      'is_filterable': 'قابلیت فیلتر',
      'is_searchable': 'قابلیت جستجو',
      'options': 'گزینه‌ها',
      'default_value': 'مقدار پیش‌فرض',
      'min_value': 'حداقل مقدار',
      'max_value': 'حداکثر مقدار',
      'unit': 'واحد',
      'validation_rules': 'قوانین اعتبارسنجی',
      'label': 'عنوان',
      'value': 'مقدار',
      'operator': 'عملگر'
    };

    return fieldNames[fieldName] || fieldName;
  }

  /**
   * Extract validation errors for a specific field
   * @param {Object} validationErrors - All validation errors
   * @param {string} fieldName - Field name to extract errors for
   * @returns {Array} Array of error messages for the field
   */
  static getFieldErrors(validationErrors, fieldName) {
    if (!validationErrors || !validationErrors[fieldName]) {
      return [];
    }

    const errors = validationErrors[fieldName];
    if (Array.isArray(errors)) {
      return errors.map(error => this.decodeUnicodeString(error));
    }

    return [];
  }

  /**
   * Check if a field has validation errors
   * @param {Object} validationErrors - All validation errors
   * @param {string} fieldName - Field name to check
   * @returns {boolean} True if field has errors
   */
  static hasFieldError(validationErrors, fieldName) {
    return this.getFieldErrors(validationErrors, fieldName).length > 0;
  }

  /**
   * Get the first error message for a field
   * @param {Object} validationErrors - All validation errors
   * @param {string} fieldName - Field name to get error for
   * @returns {string|null} First error message or null
   */
  static getFirstFieldError(validationErrors, fieldName) {
    const errors = this.getFieldErrors(validationErrors, fieldName);
    return errors.length > 0 ? errors[0] : null;
  }

  /**
   * Format validation errors for form display
   * @param {Object} validationErrors - All validation errors
   * @returns {Object} Formatted errors object for form components
   */
  static formatValidationErrorsForForm(validationErrors) {
    const formattedErrors = {};

    if (!validationErrors || typeof validationErrors !== 'object') {
      return formattedErrors;
    }

    Object.keys(validationErrors).forEach(field => {
      const errors = this.getFieldErrors(validationErrors, field);
      if (errors.length > 0) {
        formattedErrors[field] = {
          validateStatus: 'error',
          help: errors[0] // Show first error
        };
      }
    });

    return formattedErrors;
  }
}

/**
 * Global Property specific error handler
 */
export class GlobalPropertyErrorHandler extends ErrorHandler {
  /**
   * Handle errors specific to global property operations
   * @param {Object} error - Axios error object
   * @param {string} operation - Operation type (create, update, delete, fetch)
   * @returns {Object} Processed error information
   */
  static handleGlobalPropertyError(error, operation = 'unknown') {
    const operationMessages = {
      create: "خطا در ایجاد مشخصات فنی",
      update: "خطا در ویرایش مشخصات فنی",
      delete: "خطا در حذف مشخصات فنی",
      fetch: "خطا در دریافت اطلاعات مشخصات فنی",
      unknown: "خطا در عملیات مشخصات فنی"
    };

    const defaultMessage = operationMessages[operation] || operationMessages.unknown;
    return this.handleError(error, defaultMessage);
  }

  /**
   * Handle validation errors for global property forms
   * @param {Object} error - Axios error object
   * @returns {Object} Formatted validation errors for form
   */
  static handleGlobalPropertyValidation(error) {
    const errorInfo = {
      hasError: true,
      message: "خطای اعتبارسنجی",
      validationErrors: {},
      status: null,
      data: null
    };

    if (error.response) {
      const { status, data } = error.response;
      errorInfo.status = status;
      errorInfo.data = data;

      if (status === 422) {
        // Extract validation errors from the response structure you provided
        errorInfo.validationErrors = data.data?.errors || data.errors || {};
        
        // Don't call handleValidationErrors here to avoid duplicate messages
        // Just return the error info for form handling
        return {
          ...errorInfo,
          formErrors: this.formatValidationErrorsForForm(errorInfo.validationErrors)
        };
      } else {
        // For non-422 errors, use the general handler
        return this.handleGlobalPropertyError(error, 'create');
      }
    }

    return errorInfo;
  }

  /**
   * Get display name for global property fields
   * @param {string} fieldName - Field name from validation error
   * @returns {string} Display name in Persian
   */
  static getFieldDisplayName(fieldName) {
    const fieldNames = {
      'title': 'عنوان',
      'description': 'توضیحات',
      'category_id': 'دسته‌بندی',
      'parent_id': 'والد',
      'order': 'ترتیب',
      'type': 'نوع',
      'is_required': 'اجباری بودن',
      'is_filterable': 'قابلیت فیلتر',
      'is_searchable': 'قابلیت جستجو',
      'options': 'گزینه‌ها',
      'default_value': 'مقدار پیش‌فرض',
      'min_value': 'حداقل مقدار',
      'max_value': 'حداکثر مقدار',
      'unit': 'واحد',
      'validation_rules': 'قوانین اعتبارسنجی'
    };

    return fieldNames[fieldName] || super.getFieldDisplayName(fieldName);
  }
}

/**
 * Filter specific error handler
 */
export class FilterErrorHandler extends ErrorHandler {
  /**
   * Handle errors specific to filter operations
   * @param {Object} error - Axios error object
   * @param {string} operation - Operation type (create, update, delete, fetch)
   * @returns {Object} Processed error information
   */
  static handleFilterError(error, operation = 'unknown') {
    const operationMessages = {
      create: "خطا در ایجاد فیلتر",
      update: "خطا در ویرایش فیلتر",
      delete: "خطا در حذف فیلتر",
      fetch: "خطا در دریافت اطلاعات فیلترها",
      unknown: "خطا در عملیات فیلتر"
    };

    const defaultMessage = operationMessages[operation] || operationMessages.unknown;
    return this.handleError(error, defaultMessage);
  }

  /**
   * Handle validation errors for filter forms
   * @param {Object} error - Axios error object
   * @returns {Object} Formatted validation errors for form
   */
  static handleFilterValidation(error) {
    const errorInfo = this.handleFilterError(error, 'validation');
    
    if (errorInfo.status === 422) {
      return {
        ...errorInfo,
        formErrors: this.formatValidationErrorsForForm(errorInfo.validationErrors)
      };
    }

    return errorInfo;
  }

  /**
   * Get display name for filter fields
   * @param {string} fieldName - Field name from validation error
   * @returns {string} Display name in Persian
   */
  static getFieldDisplayName(fieldName) {
    const fieldNames = {
      'label': 'عنوان فیلتر',
      'type': 'نوع فیلتر',
      'value': 'مقدار',
      'operator': 'عملگر',
      'min_value': 'حداقل مقدار',
      'max_value': 'حداکثر مقدار',
      'is_active': 'وضعیت فعال',
      'sort_order': 'ترتیب نمایش'
    };

    return fieldNames[fieldName] || super.getFieldDisplayName(fieldName);
  }
}

export default ErrorHandler;