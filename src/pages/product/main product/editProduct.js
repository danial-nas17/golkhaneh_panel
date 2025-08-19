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
  Image,
  Alert,
} from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../../api";
import TinyEditor from "../../../components/Editor";

const { TextArea } = Input;

function EditProduct() {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [attributes, setAttributes] = useState([]);
  const [selectedAttributes, setSelectedAttributes] = useState([]);
  const [editorContent1, setEditorContent1] = useState("");
  const [editorContent2, setEditorContent2] = useState("");
  const [editorContent3, setEditorContent3] = useState("");
  const [editorContent4, setEditorContent4] = useState("");
  const [imageFiles, setImageFiles] = useState([]);
  const [currentImages, setCurrentImages] = useState([]);
  const [existingThumb, setExistingThumb] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [validationErrors, setValidationErrors] = useState(null);

  const urlToFile = async (url) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const filename = url.split("/").pop();
      return new File([blob], filename, { type: blob.type });
    } catch (error) {
      console.error("Error converting URL to File:", error);
      return null;
    }
  };

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

  const handleRemoveCurrentImage = (index) => {
    setCurrentImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRemoveNewImage = (index) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
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

  const handleAttributeSelect = (attributeIds) => {
    const newSelectedAttributes = attributes.filter((attr) =>
      attributeIds.includes(attr.id)
    );
    setSelectedAttributes(newSelectedAttributes);

    // Clear values for attributes that are no longer selected
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

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setFetchingData(true);
    try {
      const [categoriesRes, brandsRes, attributesRes, productRes] =
        await Promise.all([
          api.get(`/panel/category`),
          api.get(`/panel/brand`),
          api.get(`/panel/attribute?includes[]=values&type=product`), // دریافت ویژگی‌ها
          api.get(`/panel/product/${id}`),
        ]);

      setCategories(categoriesRes?.data?.data || []);
      setBrands(brandsRes?.data?.data || []);
      setAttributes(attributesRes?.data?.data || []);

      const productData = productRes?.data?.data;

      // پیش‌پر کردن فیلدهای فرم
      form.setFieldsValue({
        title: productData?.title,
        sub_title: productData?.sub_title,
        video_provider: productData?.video_provider,
        video_link: productData?.video_link,
        catalog_link: productData?.catalog_link,
        // تغییر: دریافت اولین دسته‌بندی به جای آرایه‌ای از دسته‌بندی‌ها
        categories:
          productData?.categories?.length > 0
            ? productData.categories[0].id
            : undefined,
        brand: productData?.brand?.id,
        description: productData?.description,
        original: productData?.original === 1,
        featured: productData?.featured === 1,
        refundable: productData?.refundable === 1,
        published: productData?.published === 1,
        seo_title: productData?.seo_meta?.seo_title,
        seo_description: productData?.seo_meta?.seo_description,
        canonical: productData?.seo_meta?.canonical,
        follow: productData?.seo_meta?.follow === 1,
        index: productData?.seo_meta?.index === 1,
      });

      // Process product attributes
      const attributeValues = {};
      const selectedAttrs = [];

      if (productData?.attributes && productData.attributes.length > 0) {
        productData.attributes.forEach((attr) => {
          const matchingAttr = attributesRes?.data?.data.find(
            (a) => a.id === attr.attribute_id
          );
          if (matchingAttr) {
            selectedAttrs.push(matchingAttr);

            if (attr.values && attr.values.length > 0) {
              if (attr.values.length === 1) {
                attributeValues[matchingAttr.key] = attr.values[0].id;
              } else {
                attributeValues[matchingAttr.key] = attr.values.map(
                  (val) => val.id
                );
              }
            }
          }
        });

        setSelectedAttributes(selectedAttrs);
      }

      form.setFieldsValue({
        ...attributeValues,
        selectedAttributes: selectedAttrs.map((attr) => attr.id),
      });

      setEditorContent1(productData?.size_guide || "");
      setEditorContent2(productData?.features || "");
      setEditorContent3(productData?.return_conditions || "");
      setEditorContent4(productData?.guarantee || "");
      setExistingThumb(productData?.thumb);

      if (productData?.images?.length > 0) {
        setCurrentImages(
          productData?.images.map((url) => ({
            uid: url,
            url: url,
            status: "done",
          }))
        );
      }
    } catch (error) {
      message.error("خطا در دریافت اطلاعات اولیه");
      console.error("Error fetching initial data:", error);
    } finally {
      setFetchingData(false);
    }
  };

  const uploadProps = {
    beforeUpload: (file) => {
      const isImage = file.type.startsWith("image/");
      if (!isImage) {
        message.error(`${file.name} is not an image file`);
        return Upload.LIST_IGNORE;
      }
      setImageFiles((prev) => [...prev, file]);
      return false;
    },
    multiple: true,
    listType: "picture",
    accept: "image/*",
    showUploadList: false,
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

      // تغییر: ارسال یک دسته‌بندی به جای آرایه‌ای از دسته‌بندی‌ها
      if (values.categories) {
        formData.append("categories[]", values.categories);
      }

      // Prepare attributes in the required format
      const attributesData = [];

      selectedAttributes.forEach((attribute) => {
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

      formData.append("original", values.original ? "1" : "0");
      formData.append("featured", values.featured ? "1" : "0");
      formData.append("refundable", values.refundable ? "1" : "0");
      formData.append("published", values.published ? "1" : "0");

      const existingImageFiles = await Promise.all(
        currentImages.map((img) => urlToFile(img.url))
      );

      console.log("existing", existingImageFiles);

      [...existingImageFiles, ...imageFiles]?.forEach((file) => {
        if (file) {
          formData.append("images[]", file);
        }
      });

      await api.post(`/panel/product/${id}?_method=PUT`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      message.success("محصول با موفقیت ویرایش شد");
      navigate("/products");
    } catch (error) {
      if (error.response && error.response.status === 422) {
        // Handle validation errors
        const validationErrors = error.validationErrors || {};
        setValidationErrors(validationErrors);
        setFormFieldsError(validationErrors);

        // Scroll to top to show the error message
        window.scrollTo({ top: 0, behavior: "smooth" });
        message.error("لطفاً خطاهای فرم را برطرف کنید");
      } else {
        message.error("ویرایش محصول با خطا مواجه شد");
      }
      console.error("Error updating product:", error);
    } finally {
      setLoading(false);
    }
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
      <Card title="ویرایش محصول" className="mb-4">
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
                label="دسته‌بندی"
                rules={[
                  {
                    required: true,
                    message: "لطفاً دسته‌بندی را انتخاب کنید",
                  },
                ]}
              >
                <Select
                  placeholder="دسته‌بندی را انتخاب کنید"
                  allowClear
                  options={categories.map((category) => ({
                    value: category.id,
                    label: category.title,
                  }))}
                />
              </Form.Item>
            </Col>
          </Row>

          {/* Product Attributes Section */}
          <Divider>ویژگی‌های محصول</Divider>

          <Row gutter={24}>
            <Col span={24}>
              <Form.Item
                name="selectedAttributes"
                label="انتخاب ویژگی‌ها"
                required
              >
                <Select
                  mode="multiple"
                  placeholder="ویژگی‌های مورد نظر را انتخاب کنید"
                  onChange={handleAttributeSelect}
                  optionFilterProp="label"
                  style={{ width: "100%" }}
                  options={attributes.map((attr) => ({
                    label: attr.key,
                    value: attr.id,
                    key: attr.id,
                  }))}
                />
              </Form.Item>
            </Col>
          </Row>

          {selectedAttributes.length > 0 && (
            <Row gutter={[24, 24]}>
              {selectedAttributes.map((attribute) => (
                <Col span={12} key={attribute.id}>
                  <Form.Item
                    name={attribute.key}
                    label={attribute.key}
                    rules={[
                      {
                        required: attribute.required,
                        message: `لطفاً ${attribute.key} را انتخاب کنید`,
                      },
                    ]}
                  >
                    <Select
                      mode={attribute.multiple ? "multiple" : undefined}
                      placeholder={`انتخاب ${attribute.key}`}
                      allowClear
                      style={{ width: "100%" }}
                      options={attribute.values.map((val) => ({
                        label: val.key || val.name,
                        value: val.id,
                        key: val.id,
                      }))}
                    />
                  </Form.Item>
                </Col>
              ))}
            </Row>
          )}

          <Form.Item name="description" label="توضیحات">
            <TextArea rows={4} />
          </Form.Item>

          <Form.Item
            name="thumb"
            label=" تصویر انگشتی"
            extra={
              existingThumb && (
                <img
                  className="mt-4"
                  src={existingThumb}
                  alt="Current banner"
                  style={{ maxWidth: "200px" }}
                />
              )
            }
          >
            <Upload
              maxCount={1}
              beforeUpload={() => false}
              listType="picture"
              accept="image/*"
            >
              <Button icon={<UploadOutlined />} loading={uploading}>
                انتخاب تصویر
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
                    return Promise.reject(
                      "لطفاً راهنمای سایز فریم را وارد کنید."
                    );
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
                      "لطفاً راهنمای سایز فریم را وارد کنید."
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
                    return Promise.reject(
                      "لطفاً راهنمای سایز فریم را وارد کنید."
                    );
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

          <Form.Item label="تصاویر">
            <div className="mb-4 flex flex-wrap gap-4">
              {/* Existing Images */}
              {currentImages.map((image, index) => (
                <div key={`current-${index}`} className="relative">
                  <Image
                    src={image.url}
                    alt={`Current image ${index + 1}`}
                    width={200}
                    preview={false}
                  />
                  <Button
                    danger
                    size="small"
                    className="absolute top-2 right-2"
                    onClick={() => handleRemoveCurrentImage(index)}
                  >
                    ×
                  </Button>
                </div>
              ))}

              {/* New Images */}
              {imageFiles.map((file, index) => (
                <div key={`new-${index}`} className="relative">
                  <Image
                    src={URL.createObjectURL(file)}
                    alt={`New image ${index + 1}`}
                    width={200}
                    preview={false}
                  />
                  <Button
                    danger
                    size="small"
                    className="absolute top-2 right-2"
                    onClick={() => handleRemoveNewImage(index)}
                  >
                    ×
                  </Button>
                </div>
              ))}
            </div>

            <Upload {...uploadProps}>
              <Button icon={<UploadOutlined />}>افزودن تصاویر </Button>
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
              ویرایش محصول
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}

export default EditProduct;
