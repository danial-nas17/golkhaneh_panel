# راهنمای مدیریت خطا در پروژه

## مقدمه

این سند راهنمای کاملی برای استفاده از سیستم مدیریت خطای یکپارچه در پروژه ارائه می‌دهد. سیستم جدید برای مدیریت خطاهای 422 (اعتبارسنجی) و 403 (عدم دسترسی) بر اساس فرمت مشخص شده طراحی شده است.

## فرمت خطاهای API

### خطای 422 (Validation Error)
```json
{
    "success": false,
    "status": 422,
    "message": "validation error",
    "data": {
        "errors": {
            "pots.0.serial_code": [
                "فیلد pots.0.serial_code مقدار تکراری دارد."
            ],
            "pots.1.serial_code": [
                "فیلد pots.1.serial_code مقدار تکراری دارد."
            ]
        }
    }
}
```

### خطای 403 (Forbidden Error)
```json
{
  "success": false,
  "status": 403,
  "message": "فقط ایجادکننده‌ی سفارش مجاز به ثبت درخواست لغو است."
}
```

## کامپوننت‌های سیستم مدیریت خطا

### 1. API Interceptor (`src/api.js`)

Interceptor به‌روزرسانی شده برای مدیریت خطاهای مختلف:

```javascript
// خطاهای 422 را به صورت خودکار پردازش می‌کند
error.validationErrors = data?.data?.errors || {};
error.validationMessage = data?.message || "validation error";

// خطاهای 403 را مدیریت می‌کند
error.forbiddenMessage = data?.message || "دسترسی مجاز نیست";
```

### 2. UnifiedErrorHandler (`src/utils/unifiedErrorHandler.js`)

کلاس اصلی برای مدیریت خطاها:

#### متدهای اصلی:

- `handleApiError(error, form, options)` - مدیریت کلی خطاهای API
- `handleValidationError(error, form, options)` - مدیریت خاص خطاهای اعتبارسنجی
- `handleForbiddenError(error, options)` - مدیریت خاص خطاهای 403
- `setFormFieldErrors(form, validationErrors)` - تنظیم خطاهای فیلدهای فرم
- `showValidationMessages(validationErrors)` - نمایش پیام‌های خطای اعتبارسنجی

## نحوه استفاده

### 1. استفاده پایه برای فرم‌ها

```javascript
import UnifiedErrorHandler from "../../utils/unifiedErrorHandler";

const onFinish = async (values) => {
  setLoading(true);
  try {
    await api.post("/panel/category", values);
    message.success("عملیات با موفقیت انجام شد");
    navigate("/categories");
  } catch (error) {
    const errorResult = UnifiedErrorHandler.handleApiError(error, form, {
      showValidationMessages: false, // عدم نمایش پیام‌های جداگانه فیلدها
      showGeneralMessages: true,     // نمایش پیام کلی خطا
      defaultMessage: "خطا در ارسال اطلاعات"
    });
    
    // مدیریت خطاهای اعتبارسنجی
    if (errorResult.type === 'validation') {
      setValidationErrors(errorResult.validationErrors);
    }
  } finally {
    setLoading(false);
  }
};
```

### 2. استفاده برای درخواست‌های ساده

```javascript
const fetchData = async () => {
  try {
    const response = await api.get("/panel/products");
    setData(response.data.data);
  } catch (error) {
    UnifiedErrorHandler.handleApiError(error, null, {
      showGeneralMessages: true,
      defaultMessage: "خطا در دریافت اطلاعات"
    });
  }
};
```

### 3. مدیریت خطاهای 403

```javascript
const deleteItem = async (id) => {
  try {
    await api.delete(`/panel/item/${id}`);
    message.success("آیتم حذف شد");
  } catch (error) {
    if (error.response?.status === 403) {
      UnifiedErrorHandler.handleForbiddenError(error);
    } else {
      UnifiedErrorHandler.handleApiError(error);
    }
  }
};
```

## گزینه‌های پیکربندی

### options پارامتر

```javascript
const options = {
  showValidationMessages: false, // نمایش پیام‌های جداگانه فیلدها
  showGeneralMessages: true,     // نمایش پیام کلی خطا
  defaultMessage: "خطایی رخ داده است" // پیام پیش‌فرض
};
```

## نمایش خطاهای اعتبارسنجی در کامپوننت

### استفاده از Alert برای نمایش خطاها

```javascript
{validationErrors && Object.keys(validationErrors).length > 0 && (
  <Alert
    message="خطاهای اعتبارسنجی"
    description={
      <ul>
        {Object.entries(validationErrors).map(([field, errors]) => (
          <li key={field}>
            <strong>{UnifiedErrorHandler.getFieldDisplayName(field)}:</strong> 
            {errors.join(", ")}
          </li>
        ))}
      </ul>
    }
    type="error"
    showIcon
    closable
    className="mb-4"
  />
)}
```

## مثال‌های کاربردی

### 1. صفحه افزودن دسته‌بندی

```javascript
// src/pages/category/AddCategoryPage.js
import UnifiedErrorHandler from "../../utils/unifiedErrorHandler";

const onFinish = async (values) => {
  setLoading(true);
  try {
    const formData = new FormData();
    // ... prepare form data
    
    await api.post("/panel/category", formData);
    message.success("دسته‌بندی با موفقیت اضافه شد.");
    navigate("/categories");
  } catch (error) {
    UnifiedErrorHandler.handleApiError(error, form, {
      showValidationMessages: false,
      showGeneralMessages: true,
      defaultMessage: "خطا در ارسال اطلاعات."
    });
  } finally {
    setLoading(false);
  }
};
```

### 2. صفحه افزودن محصول

```javascript
// src/pages/product/main product/addProduct.js
import UnifiedErrorHandler from "../../../utils/unifiedErrorHandler";

const onFinish = async (values) => {
  setLoading(true);
  setValidationErrors(null);
  
  try {
    // ... prepare and send data
    await api.post("/panel/product", formData);
    message.success("محصول با موفقیت اضافه شد");
    navigate("/products");
  } catch (error) {
    const errorResult = UnifiedErrorHandler.handleApiError(error, form, {
      showValidationMessages: false,
      showGeneralMessages: true,
      defaultMessage: "افزودن محصول با خطا مواجه شد"
    });
    
    if (errorResult.type === 'validation') {
      setValidationErrors(errorResult.validationErrors);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  } finally {
    setLoading(false);
  }
};
```

## ویژگی‌های خاص

### 1. رمزگشایی کاراکترهای Unicode

سیستم به صورت خودکار کاراکترهای Unicode موجود در پیام‌های خطا را رمزگشایی می‌کند:

```javascript
// "\u0641\u06cc\u0644\u062f" -> "فیلد"
ErrorHandler.decodeUnicodeString(errorMessage);
```

### 2. نام‌گذاری فیلدها

سیستم نام‌های فیلدها را به فارسی ترجمه می‌کند:

```javascript
// "pots.0.serial_code" -> "کد سریال گلدان اول"
ErrorHandler.getFieldDisplayName(fieldName);
```

### 3. مدیریت خطاهای شبکه

```javascript
// خطاهای شبکه به صورت خودکار تشخیص و مدیریت می‌شوند
if (!error.response) {
  // Network error
  message.error("خطای شبکه - لطفاً اتصال اینترنت خود را بررسی کنید");
}
```

## تست سیستم

برای تست سیستم مدیریت خطا، از کامپوننت `ErrorHandlingTest` استفاده کنید:

```javascript
// src/pages/test/ErrorHandlingTest.js
import ErrorHandlingTest from "../pages/test/ErrorHandlingTest";

// در روتر اضافه کنید:
<Route path="/test-errors" element={<ErrorHandlingTest />} />
```

## بهترین روش‌ها

### 1. همیشه از UnifiedErrorHandler استفاده کنید

```javascript
// ✅ درست
UnifiedErrorHandler.handleApiError(error, form);

// ❌ غلط
if (error.response?.status === 422) {
  // manual handling
}
```

### 2. گزینه‌های مناسب را انتخاب کنید

```javascript
// برای فرم‌ها
UnifiedErrorHandler.handleApiError(error, form, {
  showValidationMessages: false, // خطاها روی فیلدها نمایش داده می‌شوند
  showGeneralMessages: true
});

// برای درخواست‌های ساده
UnifiedErrorHandler.handleApiError(error, null, {
  showGeneralMessages: true
});
```

### 3. خطاها را لاگ کنید

```javascript
catch (error) {
  const errorResult = UnifiedErrorHandler.handleApiError(error, form);
  console.error("Operation failed:", errorResult);
}
```

## خلاصه

سیستم مدیریت خطای جدید:

- ✅ خطاهای 422 و 403 را بر اساس فرمت مشخص شده مدیریت می‌کند
- ✅ کاراکترهای Unicode را رمزگشایی می‌کند
- ✅ خطاهای فرم را به صورت خودکار تنظیم می‌کند
- ✅ پیام‌های خطا را به فارسی نمایش می‌دهد
- ✅ قابلیت پیکربندی بالا دارد
- ✅ استفاده آسان و یکپارچه در تمام پروژه

با استفاده از این سیستم، مدیریت خطاها در تمام پروژه یکپارچه و قابل اعتماد خواهد بود.