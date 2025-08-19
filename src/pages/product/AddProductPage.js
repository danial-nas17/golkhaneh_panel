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
} from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api";
import { useLocation } from "react-router-dom";

const { TextArea } = Input;

function AddVariationProduct() {
  const [form] = Form.useForm();
  const location = useLocation();

  const navigate = useNavigate();
  const { productId } = useParams();
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [attributes, setAttributes] = useState([]);
  const [selectedAttributes, setSelectedAttributes] = useState([]); // اضافه شده
  const [imageFiles, setImageFiles] = useState([]);
  const [products, setProducts] = useState([]);
  const [productData, setProductData] = useState(null); // اضافه شده برای نگهداری اطلاعات محصول
  const [globalProperties, setGlobalProperties] = useState([]); // اضافه شده برای نگهداری global properties

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (productId) {
      fetchProductData(productId);
    }
  }, [productId]);

  useEffect(() => {
    if (location.state?.variantData && attributes.length > 0) {
      const { variantData } = location.state;

      const initialValues = {
        buy_price: variantData.buy_price,
        price: variantData.price,
        off_price: variantData.off_price,
        sku: "", // خالی کردن SKU برای تولید کد جدید
        upc: variantData.upc,
        stock: variantData.stock,
        active: variantData.active === 1 || variantData.active === true,
        product_id: parseInt(productId || variantData.product_id),
      };

      // کپی کردن تصاویر موجود (اختیاری - می‌توانید این بخش را حذف کنید)
      // if (variantData.images && variantData.images.length > 0) {
      //   const existingImages = variantData.images.map((imageUrl, index) => ({
      //     uid: `existing-${index}`,
      //     name: `image-${index}`,
      //     status: 'done',
      //     url: imageUrl,
      //   }));
      //   setImageFiles(existingImages);
      // }

      // کپی کردن Global Properties
      if (
        variantData.global_properties &&
        Array.isArray(variantData.global_properties)
      ) {
        variantData.global_properties.forEach((globalProp) => {
          initialValues[`global_property_${globalProp.id}`] = globalProp.value;
        });
      }

      // تنظیم selectedAttributes بر اساس داده‌های موجود
      const variantSelectedAttributes = [];

      // پردازش attribute_varitation به جای attribute_combination
      if (
        variantData.attribute_varitation &&
        Array.isArray(variantData.attribute_varitation)
      ) {
        variantData.attribute_varitation.forEach((attrVariation) => {
          const attributeObj = attributes.find(
            (attr) => attr.key === attrVariation.key
          );
          if (attributeObj) {
            variantSelectedAttributes.push(attributeObj.id);
            if (
              attributeObj.values &&
              attrVariation.values &&
              attrVariation.values.length > 0
            ) {
              // اگر attribute چندتایی است
              if (attributeObj.multiple) {
                const valueIds = attrVariation.values
                  .map((val) => {
                    const valueObj = attributeObj.values.find(
                      (v) => v.name === val.name || v.value === val.value
                    );
                    return valueObj ? valueObj.id : null;
                  })
                  .filter((id) => id !== null);
                if (valueIds.length > 0) {
                  initialValues[attrVariation.key] = valueIds;
                }
              } else {
                // اگر attribute تکی است
                const valueObj = attributeObj.values.find(
                  (val) =>
                    val.name === attrVariation.values[0].name ||
                    val.value === attrVariation.values[0].value
                );
                if (valueObj) {
                  initialValues[attrVariation.key] = valueObj.id;
                }
              }
            }
          }
        });
      }

      setSelectedAttributes(variantSelectedAttributes);
      form.setFieldsValue(initialValues);
    }
  }, [location.state, form, attributes, productId, globalProperties]);

  const fetchInitialData = async () => {
    setFetchingData(true);
    try {
      const [categoriesRes, brandsRes, attributesRes, productsRes] =
        await Promise.all([
          api.get(`/panel/category`),
          api.get(`/panel/brand`),
          api.get(`/panel/attribute?includes[]=values&type=variant`),
          api.get(`/panel/product?per_page=all`),
        ]);

      setCategories(categoriesRes.data.data || []);
      setBrands(brandsRes.data.data || []);
      setAttributes(attributesRes.data.data || []);
      setProducts(productsRes.data.data || []);
      if (productId) {
        form.setFieldsValue({ product_id: parseInt(productId) });
      }
    } catch (error) {
      message.error("دریافت اطلاعات اولیه با خطا مواجه شد");
      console.error("خطا در دریافت اطلاعات:", error);
    } finally {
      setFetchingData(false);
    }
  };

  // تابع جدید برای دریافت اطلاعات محصول
  const fetchProductData = async (id) => {
    try {
      const response = await api.get(
        `/panel/product/${id}?includes[]=needed_global_property`
      );
      setProductData(response.data.data);

      // پردازش global properties
      const processedProperties = [];
      if (response.data.data.needed_global_property) {
        response.data.data.needed_global_property.forEach((parent) => {
          if (parent.children && parent.children.length > 0) {
            // اگر children دارد، برای هر child یک field ایجاد کن
            parent.children.forEach((child) => {
              processedProperties.push({
                id: child.id,
                title: child.title,
                description: child.description,
                parentTitle: parent.title,
                parentId: parent.id,
              });
            });
          } else {
            // اگر children ندارد، برای خود parent یک field ایجاد کن
            processedProperties.push({
              id: parent.id,
              title: parent.title,
              description: parent.description,
              parentTitle: null,
              parentId: null,
            });
          }
        });
      }
      setGlobalProperties(processedProperties);
    } catch (error) {
      console.error("خطا در دریافت اطلاعات محصول:", error);
      message.error("دریافت اطلاعات محصول با خطا مواجه شد");
    }
  };

  // تابع برای تغییر محصول انتخاب شده
  const handleProductChange = (value) => {
    if (value) {
      fetchProductData(value);
    } else {
      setProductData(null);
      setGlobalProperties([]);
    }
  };

  // تابع برای مدیریت انتخاب ویژگی‌ها
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

  // تابع برای رندر کردن فیلدهای ویژگی‌های انتخاب شده
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
    try {
      const formData = new FormData();

      const basicFields = [
        "buy_price",
        "price",
        "off_price",
        "sku",
        "upc",
        "stock",
      ];
      basicFields.forEach((field) => {
        if (values[field] !== undefined) {
          formData.append(field, values[field]);
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

      // Prepare attributes in the required format
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

      // Add attributes to formData as a JSON string
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

      imageFiles.forEach((file) => {
        if (file.originFileObj) {
          formData.append("images[]", file.originFileObj);
        } else if (file.url) {
          formData.append("existing_images[]", file.url);
        }
      });

      const seoFields = [
        "seo_title",
        "seo_description",
        "canonical",
        "follow",
        "index",
      ];
      seoFields.forEach((field) => {
        if (values[field] !== undefined) {
          formData.append(field, values[field]);
        }
      });

      await api.post(`/panel/product-variation`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      message.success("تنوع محصول با موفقیت اضافه شد");
      navigate(`/products?expandedProduct=${values.product_id}`);
    } catch (error) {
      message.error("افزودن تنوع محصول با خطا مواجه شد");
      console.error("خطا در افزودن تنوع محصول:", error);
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
      <Card title="افزودن تنوع جدید" className="mb-4">
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
                  disabled={!!productId}
                  onChange={handleProductChange}
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
              {/* گروه‌بندی بر اساس parent */}
              {Array.from(
                new Set(globalProperties.map((p) => p.parentTitle || p.title))
              ).map((parentTitle) => {
                const parentProperties = globalProperties.filter(
                  (p) =>
                    p.parentTitle === parentTitle ||
                    (p.parentTitle === null && p.title === parentTitle)
                );

                return (
                  <div key={parentTitle}>
                    <h4 className="mb-3 text-base font-medium">
                      {parentTitle}
                    </h4>
                    <Row gutter={16}>
                      {parentProperties.map((property) => (
                        <Col span={24} key={property.id} className="mb-4">
                          <Form.Item
                            name={`global_property_${property.id}`}
                            label={property.parentTitle ? property.title : null}
                            tooltip={property.description}
                          >
                            <TextArea
                              rows={4}
                              placeholder={`${property.title} را وارد کنید...`}
                            />
                          </Form.Item>
                        </Col>
                      ))}
                    </Row>
                    <Divider />
                  </div>
                );
              })}
            </Card>
          )}
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="buy_price"
                label="قیمت خرید"
                rules={[
                  { required: true, message: "لطفاً قیمت خرید را وارد کنید" },
                ]}
              >
                <InputNumber
                  min={0}
                  className="w-full"
                  formatter={(value) =>
                    value
                      ? `${value
                          .toString()
                          .replace(/\B(?=(\d{3})+(?!\d))/g, ",")} `
                      : ""
                  }
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="price"
                label="قیمت فروش"
                rules={[
                  { required: true, message: "لطفاً قیمت فروش را وارد کنید" },
                ]}
              >
                <InputNumber
                  min={0}
                  className="w-full"
                  formatter={(value) =>
                    value
                      ? `${value
                          .toString()
                          .replace(/\B(?=(\d{3})+(?!\d))/g, ",")} `
                      : ""
                  }
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="off_price" label="قیمت با تخفیف">
                <InputNumber
                  min={0}
                  className="w-full"
                  formatter={(value) =>
                    value
                      ? `${value
                          .toString()
                          .replace(/\B(?=(\d{3})+(?!\d))/g, ",")} `
                      : ""
                  }
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="upc" label="کد جهانی محصول">
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
          <Form.Item name="active" label="فعال" valuePropName="checked">
            <Switch />
          </Form.Item>
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

export default AddVariationProduct;
