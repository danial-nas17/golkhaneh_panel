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
  Image,
  Divider,
} from "antd";
import { UploadOutlined } from "@ant-design/icons";
import BackButton from "../../components/BackButton";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api";

const { TextArea } = Input;

function EditVariationProduct() {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [attributes, setAttributes] = useState([]);
  const [selectedAttributes, setSelectedAttributes] = useState([]);
  const [products, setProducts] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [imageFiles, setImageFiles] = useState([]);
  const [currentImages, setCurrentImages] = useState([]);
  const [globalProperties, setGlobalProperties] = useState([]);
  const [currentVariation, setCurrentVariation] = useState(null);

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

  const handleRemoveCurrentImage = (index) => {
    setCurrentImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRemoveNewImage = (index) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAttributeSelection = (attributeIds) => {
    setSelectedAttributes(attributeIds);

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

  const renderAttributeFields = () => {
    const selectedAttributeObjects = attributes.filter((attr) =>
      selectedAttributes.includes(attr.id)
    );

    if (selectedAttributeObjects.length === 0) {
      return null;
    }

    return (
      <Card title="ویژگی‌های محصول" className="mb-4">
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
                      label: value.key || value.name || value.value,
                    })) || []
                  }
                />
              </Form.Item>
            </Col>
          ))}
        </Row>
      </Card>
    );
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const processGlobalProperties = (variantData) => {
    if (!variantData?.global_properties) return [];

    return variantData.global_properties.map((prop) => ({
      id: prop.id,
      title: prop.title,
      value: prop.value,
      parentTitle: null,
      parentId: null,
    }));
  };

  const fetchInitialData = async () => {
    setFetchingData(true);
    try {
      const [categoriesRes, attributesRes, productsRes, variantRes] =
        await Promise.all([
          api.get(`/panel/category`),
          api.get(`/panel/attribute?includes[]=values&type=variant`),
          api.get(`/panel/product?per_page=100`),
          api.get(`/panel/product-variation/${id}`),
        ]);

      setCategories(categoriesRes?.data?.data || []);
      setAttributes(attributesRes?.data?.data || []);
      setProducts(productsRes?.data?.data || []);

      const variantData = variantRes?.data?.data;
      setCurrentVariation(variantData);

      // پردازش global properties از داده‌های variant
      const processedGlobalProperties = processGlobalProperties(variantData);
      setGlobalProperties(processedGlobalProperties);

      if (variantData?.images?.length > 0) {
        setCurrentImages(
          variantData?.images?.map((url) => ({
            url,
            status: "done",
            isExisting: true,
          }))
        );
      }

      // پردازش attributes و تنظیم selectedAttributes
      const attributeValues = {};
      const variantSelectedAttributes = [];

      if (
        variantData?.attribute_varitation &&
        variantData.attribute_varitation.length > 0
      ) {
        variantData.attribute_varitation.forEach((varAttr) => {
          const foundAttribute = attributesRes?.data?.data.find(
            (attr) => attr.key === varAttr.key
          );

          if (foundAttribute) {
            variantSelectedAttributes.push(foundAttribute.id);

            if (varAttr.values && varAttr.values.length > 0) {
              if (foundAttribute.multiple && varAttr.values.length > 1) {
                attributeValues[varAttr.key] = varAttr.values.map(
                  (val) => val.id
                );
              } else {
                attributeValues[varAttr.key] = varAttr.values[0].id;
              }
            }
          }
        });
      }

      setSelectedAttributes(variantSelectedAttributes);

      // تنظیم مقادیر اولیه form
      const initialValues = {
        product_id: variantData?.product_variant_id, // استفاده از product_variant_id به جای id
        // buy_price: variantData?.buy_price?.replace(/[^0-9.]/g, ""), // اضافه شده
        // price: variantData?.price?.replace(/[^0-9.]/g, ""),
        // off_price: variantData?.off_price?.replace(/[^0-9.]/g, ""),
        sku: variantData?.SKU,
        upc: variantData?.UPC,
        stock: variantData?.stock,
        active: variantData?.active === 1,
        ...attributeValues,
      };

      // اضافه کردن مقادیر global properties به form
      if (variantData?.global_properties) {
        variantData.global_properties.forEach((prop) => {
          initialValues[`global_property_${prop.id}`] = prop.value;
        });
      }

      form.setFieldsValue(initialValues);

      setExistingImages(
        variantData?.images.map((url) => ({
          uid: url,
          url: url,
          status: "done",
        }))
      );
    } catch (error) {
      message.error("دریافت اطلاعات اولیه با خطا مواجه شد");
      console.error("خطا در دریافت اطلاعات:", error);
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
    try {
      const formData = new FormData();

      const appendIfExists = (key, value) => {
        if (value !== undefined && value !== null && value !== "") {
          formData.append(key, value);
        }
      };

      const basicFields = [
        // "buy_price",
        // "price",
        // "off_price",
        "sku",
        "upc",
        "stock",
      ];
      basicFields.forEach((field) => {
        if (values[field] !== undefined) {
          appendIfExists(field, values[field]);
        }
      });

      formData.append("active", values.active ? 1 : 0);
      formData.append("product_status", "existing");

      if (values.product_id) {
        formData.append("product_id", values.product_id);
      }

      // ارسال ویژگی‌های انتخاب شده
      const selectedAttributeObjects = attributes.filter((attr) =>
        selectedAttributes.includes(attr.id)
      );

      const attributesData = [];
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

      if (attributesData.length > 0) {
        formData.append("attributes", JSON.stringify(attributesData));
      }

      // اضافه کردن global properties به payload
      const globalPropertyData = [];
      globalProperties.forEach((property) => {
        const fieldValue = values[`global_property_${property.id}`];
        if (fieldValue) {
          globalPropertyData.push({
            id: property.id,
            value: fieldValue,
          });
        }
      });

      if (globalPropertyData.length > 0) {
        formData.append("global_property", JSON.stringify(globalPropertyData));
      }

      const existingImageFiles = await Promise.all(
        currentImages.map((img) => urlToFile(img.url))
      );

      [...existingImageFiles, ...imageFiles].forEach((file) => {
        if (file) {
          formData.append("images[]", file);
        }
      });

      await api.post(`/panel/product-variation/${id}?_method=PUT`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      message.success("محصول با موفقیت ویرایش شد");
      navigate(`/products?expandedProduct=${values.product_id}`);
    } catch (error) {
      message.error("ویرایش محصول با خطا مواجه شد");
      console.error("خطا در ویرایش محصول:", error);
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
      <Card className="mb-4" title={
        <div className="flex items-center justify-between">
          <span>ویرایش محصول</span>
          <BackButton to="/products" />
        </div>
      }>
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
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="product_id"
                label="محصول اصلی"
                rules={[
                  {
                    required: true,
                    message: "لطفاً محصول اصلی را انتخاب کنید",
                  },
                ]}
              >
                <Select
                  placeholder="محصول اصلی را انتخاب کنید"
                  allowClear
                  disabled
                  options={products.map((product) => ({
                    value: product.id,
                    label: product.title,
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
                  placeholder="ویژگی‌هایی که برای این تنوع نیاز دارید را انتخاب کنید"
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
          {/* بخش Global Properties */}
          {globalProperties.length > 0 && (
            <Card title="مشخصات فنی" className="mb-4">
              <Row gutter={16}>
                {globalProperties.map((property) => (
                  <Col span={24} key={property.id} className="mb-4">
                    <Form.Item
                      name={`global_property_${property.id}`}
                      label={property.title}
                    >
                      <TextArea
                        rows={4}
                        placeholder={`${property.title} را وارد کنید...`}
                      />
                    </Form.Item>
                  </Col>
                ))}
              </Row>
            </Card>
          )}
         
         
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item name="upc" label="کد محصول">
                <Input />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="stock"
                label="موجودی"
                rules={[
                  { required: true, message: "لطفاً موجودی را وارد کنید" },
                ]}
              >
                <InputNumber min={0} className="w-full" />
              </Form.Item>
            </Col>
          </Row>
          {/* <Form.Item name="active" label="فعال" valuePropName="checked">
            <Switch />
          </Form.Item> */}
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

export default EditVariationProduct;
