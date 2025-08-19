import React, { useEffect, useState } from "react";
import {
  Form,
  Input,
  Button,
  Select,
  InputNumber,
  Switch,
  Upload,
  message,
  Card,
  Row,
  Col,
  Spin,
  Divider,
  Alert,
} from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import api from "../../../api";
import TinyEditor from "../../../components/Editor";

const { TextArea } = Input;

function AddProduct() {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [attributes, setAttributes] = useState([]);
  const [selectedAttributes, setSelectedAttributes] = useState([]);
  const [imageFiles, setImageFiles] = useState([]);
  const [editorContent1, setEditorContent1] = useState("");
  const [editorContent2, setEditorContent2] = useState("");
  const [editorContent3, setEditorContent3] = useState("");
  const [editorContent4, setEditorContent4] = useState("");
  const [uploading, setUploading] = useState(false);
  const [validationErrors, setValidationErrors] = useState(null);

  const handleEditorChange1 = (content) => {
    setEditorContent1(content);
  };

  const handleEditorChange2 = (content) => {
    setEditorContent2(content);
  };

  const handleEditorChange3 = (content) => {
    setEditorContent3(content);
  };

  const handleEditorChange4 = (content) => {
    setEditorContent4(content);
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setFetchingData(true);
    try {
      const [categoriesRes, brandsRes, attributesRes] = await Promise.all([
        api.get(`/panel/category`),
        api.get(`/panel/brand`),
        api.get(`/panel/attribute?includes[]=values&type=product`),
      ]);

      setCategories(categoriesRes.data.data || []);
      setBrands(brandsRes.data.data || []);
      setAttributes(attributesRes.data.data || []);
    } catch (error) {
      message.error("دریافت اطلاعات اولیه با خطا مواجه شد");
      console.error("خطا در دریافت اطلاعات:", error);
    } finally {
      setFetchingData(false);
    }
  };

  const handleAttributeSelection = (attributeIds) => {
    setSelectedAttributes(attributeIds);

    // پاک کردن مقادیر فیلدهای attribute هایی که دیگر انتخاب نشده‌اند
    const currentFormValues = form.getFieldsValue();
    const attributesToRemove = attributes
      .filter((attr) => !attributeIds.includes(attr.id))
      .map((attr) => attr.key);

    const updatedValues = { ...currentFormValues };
    attributesToRemove.forEach((attrKey) => {
      delete updatedValues[attrKey];
    });

    form.setFieldsValue(updatedValues);
  };

  // Helper function to set form errors from backend validation
  const setFormFieldsError = (errors) => {
    const fieldErrors = {};

    Object.keys(errors).forEach((field) => {
      fieldErrors[field] = {
        errors: errors[field].map((message) => ({ message })),
      };
    });

    form.setFields(
      Object.entries(fieldErrors).map(([name, value]) => ({
        name,
        errors: value.errors,
      }))
    );
  };

  const uploadProps = {
    beforeUpload: (file) => {
      const isImage = file.type.startsWith("image/");
      if (!isImage) {
        message.error(`${file.name} فایل تصویر نیست`);
        return Upload.LIST_IGNORE;
      }
      return false;
    },
    onChange: ({ fileList }) => {
      const validFiles = fileList.filter(
        (file) => !file.status || file.status !== "error"
      );
      setImageFiles(validFiles);
    },
    onRemove: (file) => {
      const newFileList = imageFiles.filter((item) => item.uid !== file.uid);
      setImageFiles(newFileList);
    },
    multiple: true,
    listType: "picture",
    accept: "image/*",
    fileList: imageFiles,
  };

  const onFinish = async (values) => {
    setLoading(true);
    setValidationErrors(null);
    try {
      const formData = new FormData();

      const appendIfExists = (key, value) => {
        if (value !== undefined && value !== null && value !== "") {
          formData.append(key, value);
        }
      };

      const basicFields = [
        "title",
        "sub_title",
        "unit",
        "video_provider",
        "video_link",
        "catalog_link",
        "brand",
        "description",
      ];
      basicFields.forEach((field) => {
        if (values[field] !== undefined) {
          appendIfExists(field, values[field]);
        }
      });

      if (values.categories) {
        formData.append("categories[]", values.categories);
      }

      // Prepare attributes in the required format
      const attributesData = [];
      const selectedAttributeObjects = attributes.filter((attr) =>
        selectedAttributes.includes(attr.id)
      );

      selectedAttributeObjects.forEach((attribute) => {
        const attrKey = attribute.key;
        const attrValue = values[attrKey];

        if (attrValue) {
          const attributeItem = {
            attribute_id: attribute.id,
            attribute_value_ids: Array.isArray(attrValue)
              ? attrValue
              : [attrValue],
          };
          attributesData.push(attributeItem);
        }
      });

      // Add attributes to formData as a JSON string
      if (attributesData.length > 0) {
        formData.append("attributes", JSON.stringify(attributesData));
      }

      if (values.thumb?.file) {
        formData.append("thumb", values.thumb.file);
      }

      formData.append("size_guide", editorContent1);
      formData.append("features", editorContent2);
      formData.append("return_conditions", editorContent3);
      formData.append("guarantee", editorContent4);

      appendIfExists("seo_title", values.seo_title);
      appendIfExists("seo_description", values.seo_description);
      appendIfExists("canonical", values.canonical);
      formData.append("follow", values.follow ? "1" : "0");
      formData.append("index", values.index ? "1" : "0");

      formData.append("refundable", values.refundable ? 1 : 0);
      formData.append("original", values.original ? 1 : 0);
      formData.append("featured", values.featured ? 1 : 0);
      formData.append("published", values.published ? 1 : 0);

      imageFiles.forEach((file) => {
        const fileToUpload = file.originFileObj || file;
        formData.append("images[]", fileToUpload);
      });

      await api.post(`/panel/product`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      message.success("محصول با موفقیت اضافه شد");
      navigate("/products");
    } catch (error) {
      if (error.response && error.response.status === 422) {
        // Handle validation errors
        const { errors } = error.response.data.data;
        setValidationErrors(errors);
        setFormFieldsError(errors);

        // Scroll to top to show the error message
        window.scrollTo({ top: 0, behavior: "smooth" });
        message.error("لطفاً خطاهای فرم را برطرف کنید");
      } else {
        message.error("افزودن محصول با خطا مواجه شد");
      }
      console.error("خطا در افزودن محصول:", error);
    } finally {
      setLoading(false);
    }
  };

  const renderAttributeFields = () => {
    const selectedAttributeObjects = attributes.filter((attr) =>
      selectedAttributes.includes(attr.id)
    );

    if (selectedAttributeObjects.length === 0) {
      return null;
    }

    return (
      <div>
        <Divider>ویژگی‌های محصول</Divider>
        <Row gutter={[16, 16]}>
          {selectedAttributeObjects.map((attr) => (
            <Col xs={24} sm={12} md={8} lg={6} key={attr.id}>
              <Form.Item name={attr.key} label={attr.key}>
                <Select
                  mode={attr.multiple ? "multiple" : undefined}
                  placeholder={`${attr.key} را انتخاب کنید`}
                  allowClear
                  options={
                    attr.values?.map((value) => ({
                      value: value.id,
                      label: value.key || value.name,
                    })) || []
                  }
                />
              </Form.Item>
            </Col>
          ))}
        </Row>
      </div>
    );
  };

  if (fetchingData) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spin size="large" tip="در حال بارگذاری..." />
      </div>
    );
  }

  return (
    <div>
      <Card title="افزودن محصول جدید" className="mb-4">
        {validationErrors && (
          <Alert
            message="خطاهای اعتبارسنجی"
            description={
              <ul>
                {Object.entries(validationErrors).map(([field, errors]) => (
                  <li key={field}>
                    <strong>{field}:</strong> {errors.join(", ")}
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

        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          onFinishFailed={() => {
            message.error("لطفاً فیلدهای ضروری را پر کنید.");
          }}
          initialValues={{ active: true }}
          scrollToFirstError
        >
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={24} md={12} lg={12}>
              <Form.Item
                name="title"
                label="عنوان"
                rules={[
                  { required: true, message: "لطفاً عنوان را وارد کنید" },
                ]}
              >
                <Input style={{ width: "100%" }} />
              </Form.Item>
            </Col>

            <Col xs={24} sm={24} md={12} lg={12}>
              <Form.Item name="sub_title" label="زیرعنوان">
                <Input style={{ width: "100%" }} />
              </Form.Item>
            </Col>

            <Col xs={24} sm={24} md={12} lg={12}>
              <Form.Item
                name="brand"
                label="برند"
                rules={[
                  { required: true, message: "لطفاً برند را انتخاب کنید" },
                ]}
              >
                <Select allowClear>
                  {brands?.map((brand) => (
                    <Select.Option key={brand.id} value={brand.id}>
                      {brand.title}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} sm={24} md={12} lg={12}>
              <Form.Item name="catalog_link" label="لینک کاتالوگ">
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col span={12}>
              <Form.Item name="video_provider" label="ویدیو">
                <Input />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item name="video_link" label="لینک ویدیو">
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col span={24}>
              <Form.Item
                name="categories"
                label="دسته‌بندی‌ها"
                rules={[
                  {
                    required: true,
                    message: "لط��اً دسته‌بندی را انتخاب کنید",
                  },
                ]}
              >
                <Select
                  placeholder="دسته‌بندی‌ها را انتخاب کنید"
                  allowClear
                  options={categories.map((category) => ({
                    value: category.id,
                    label: category.title,
                  }))}
                />
              </Form.Item>
            </Col>
          </Row>

          {/* انتخاب Attributes */}
          <Row gutter={24}>
            <Col span={24}>
              <Form.Item label="انتخاب ویژگی‌های محصول" required>
                <Select
                  mode="multiple"
                  placeholder="ویژگی‌هایی که برای این محصول نیاز دارید را انتخاب کنید"
                  allowClear
                  value={selectedAttributes}
                  onChange={handleAttributeSelection}
                  options={attributes.map((attr) => ({
                    value: attr.id,
                    label: attr.key,
                  }))}
                />
              </Form.Item>
            </Col>
          </Row>

          {/* نمایش فیلدهای Attributes انتخاب شده */}
          {renderAttributeFields()}

          <Form.Item name="description" label="توضیحات">
            <TextArea rows={4} />
          </Form.Item>

          <Form.Item name="thumb" label="تصویر بندانگشتی">
            <Upload
              maxCount={1}
              beforeUpload={() => false}
              listType="picture"
              accept="image/*"
            >
              <Button icon={<UploadOutlined />} loading={uploading}>
                آپلود تصویر بندانگشتی
              </Button>
            </Upload>
          </Form.Item>

          <Form.Item
            label="مشخصات محصول"
            validateTrigger={["onChange", "onBlur"]}
            rules={[
              {
                required: true,
                validator: (_, value) => {
                  if (!editorContent2) {
                    return Promise.reject("لطفاً مشخصات محصول را وارد کنید.");
                  }
                  return Promise.resolve();
                },
              },
            ]}
          >
            <TinyEditor
              content={editorContent2}
              onEditorChange={handleEditorChange2}
              model={"Product"}
              height={300}
            />
          </Form.Item>

          <Form.Item
            label="شرایط بازگشت کالا"
            validateTrigger={["onChange", "onBlur"]}
            rules={[
              {
                required: true,
                validator: (_, value) => {
                  if (!editorContent3) {
                    return Promise.reject(
                      "لطفاً شرایط بازگشت کالا را وارد کنید."
                    );
                  }
                  return Promise.resolve();
                },
              },
            ]}
          >
            <TinyEditor
              content={editorContent3}
              onEditorChange={handleEditorChange3}
              model={"Product"}
              height={300}
            />
          </Form.Item>

          <Form.Item
            label=" گارانتی محصول"
            validateTrigger={["onChange", "onBlur"]}
            rules={[
              {
                required: true,
                validator: (_, value) => {
                  if (!editorContent4) {
                    return Promise.reject("لطفاً گارانتی محصول را وارد کنید.");
                  }
                  return Promise.resolve();
                },
              },
            ]}
          >
            <TinyEditor
              content={editorContent4}
              onEditorChange={handleEditorChange4}
              model={"Product"}
              height={300}
            />
          </Form.Item>

          <Row gutter={24}>
            <Col span={6}>
              <Form.Item name="original" label="اصل" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="featured" label="برجسته" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="refundable"
                label="بازگشت وجه"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="published"
                label="انتشار یافته"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="تصاویر"
            rules={[
              {
                validator: (_, value) =>
                  imageFiles.length > 0
                    ? Promise.resolve()
                    : Promise.reject(
                        new Error("لطفاً حداقل یک تصویر بارگذاری کنید")
                      ),
              },
            ]}
          >
            <Upload {...uploadProps}>
              <Button icon={<UploadOutlined />}>
                انتخاب تصاویر{" "}
                {imageFiles.length > 0 && `(${imageFiles.length} انتخاب شده)`}
              </Button>
            </Upload>
          </Form.Item>

          <Divider>بخش سئو</Divider>
          <Form.Item name="seo_title" label="عنوان سئو">
            <Input />
          </Form.Item>

          <Form.Item name="seo_description" label="توضیحات سئو">
            <TextArea rows={4} />
          </Form.Item>

          <Form.Item name="canonical" label="URL Canonical">
            <Input />
          </Form.Item>

          <Row gutter={24}>
            <Col span={12}>
              <Form.Item name="follow" label="Follow" valuePropName="checked">
                <Switch defaultChecked="true" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="index" label="Index" valuePropName="checked">
                <Switch defaultChecked="true" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              افزودن محصول
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}

export default AddProduct;
