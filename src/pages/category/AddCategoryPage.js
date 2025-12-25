import React, { useState, useEffect, useRef } from "react";
import {
  Form,
  Input,
  Button,
  Upload,
  InputNumber,
  message,
  Spin,
  Card,
  Divider,
  Col,
  Row,
  Switch,
  Select,
} from "antd";
import { UploadOutlined } from "@ant-design/icons";
import BackButton from "../../components/BackButton";
import { useNavigate } from "react-router-dom";
import api from "../../api";
import TinyEditor from "../../components/Editor";
import UnifiedErrorHandler from "../../utils/unifiedErrorHandler";

const { TextArea } = Input;
const { Option } = Select;

const AddCategoryPage = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [filters, setFilters] = useState([]);
  const [fetchingFilters, setFetchingFilters] = useState(false);
  const editorRef = useRef(null);
  const [editorContent, setEditorContent] = useState("");

  const handleEditorChange = (content) => {
    setEditorContent(content);
  };

  // useEffect(() => {
  //   fetchFilters();
  // }, []);

  // const fetchFilters = async () => {
  //   setFetchingFilters(true);
  //   try {
  //     const response = await api.get("/panel/dynamic-filter", {
  //       params: {
  //         per_page: 100, // Get a large number to ensure we get all filters
  //       },
  //     });
  //     setFilters(response.data.data || []);
  //   } catch (error) {
  //     message.error("خطا در دریافت فیلترها");
  //     console.error("Error fetching filters:", error);
  //   } finally {
  //     setFetchingFilters(false);
  //   }
  // };

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const formData = new FormData();

      const appendIfExists = (key, value) => {
        if (value !== undefined && value !== null && value !== "") {
          formData.append(key, value);
        }
      };

      formData.append("title", values.title);
      formData.append("description", values.description);
      formData.append("body", editorContent);
      formData.append("order", values.order);
      formData.append("type", "Product");
      
      // Add selected filters
      if (values.filters && values.filters.length > 0) {
        values.filters.forEach((filterId, index) => {
          formData.append(`filter_ids[${index}]`, filterId);
        });
      }

      appendIfExists("seo_title", values.seo_title);
      appendIfExists("seo_description", values.seo_description);
      appendIfExists("canonical", values.canonical);
      formData.append("follow", values.follow ? "1" : "0");
      formData.append("index", values.index ? "1" : "0");

      if (values.banner?.file) {
        formData.append("banner", values.banner.file);
      }
      if (values.icon?.file) {
        formData.append("icon", values.icon.file);
      }
      if (values.thumb?.file) {
        formData.append("thumb", values.thumb.file);
      }

      const response = await api.post("/panel/category", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      message.success("دسته‌بندی با موفقیت اضافه شد.");
      navigate("/categories");
    } catch (error) {
      // Use the unified error handler
      const errorResult = UnifiedErrorHandler.handleApiError(error, form, {
        showValidationMessages: false, // Don't show individual field messages
        showGeneralMessages: true,     // Show general error message
        defaultMessage: "خطا در ارسال اطلاعات."
      });
      
      console.error("خطا در افزودن دسته‌بندی:", errorResult);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl">افزودن دسته‌بندی جدید</h2>
          <BackButton to="/categories" />
        </div>
        <Spin spinning={loading || fetchingFilters}>
          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            onFinishFailed={() => {
              message.error("لطفاً فیلدهای ضروری را پر کنید.");
            }}
            scrollToFirstError
            autoComplete="off"
          >
            <Row gutter={16}>
              <Col xs={24} md={24}>
                <Form.Item
                  name="title"
                  label="عنوان"
                  rules={[
                    {
                      required: true,
                      message: "لطفاً عنوان را وارد کنید.",
                    },
                  ]}
                >
                  <Input />
                </Form.Item>
              </Col>
              {/* <Col xs={24} md={12}>
                <Form.Item
                  name="filters"
                  label="فیلترهای دسته‌بندی"
                  tooltip="فیلترهای مربوط به این دسته‌بندی را انتخاب کنید"
                >
                  <Select
                    mode="multiple"
                    placeholder="انتخاب فیلترها"
                    allowClear
                    showSearch
                    filterOption={(input, option) =>
                      option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                    }
                    maxTagCount="responsive"
                  >
                    {filters.map((filter) => (
                      <Option key={filter.id} value={filter.id}>
                        {filter.label}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col> */}
            </Row>

            <Form.Item
              name="description"
              label="توضیحات"
              rules={[
                {
                  required: true,
                  message: "لطفاً توضیحات را وارد کنید.",
                },
              ]}
            >
              <TextArea rows={6} />
            </Form.Item>

            <Form.Item
              name="order"
              label="اولویت"
              rules={[
                {
                  required: true,
                  message: "لطفاً اولویت را وارد کنید.",
                },
              ]}
            >
              <InputNumber min={1} style={{ width: "100%" }} />
            </Form.Item>

            {/* <Form.Item
              label="محتوا"
              // required
              validateTrigger={["onChange", "onBlur"]}
              rules={[
                {
                  required: true,
                  validator: (_, value) => {
                    if (!editorContent) {
                      return Promise.reject("لطفاً محتوا را وارد کنید.");
                    }
                    return Promise.resolve();
                  },
                },
              ]}
            >
              <TinyEditor
                content={editorContent}
                onEditorChange={handleEditorChange}
                model={"Category"}
                height={1000}
              />
            </Form.Item> */}

            <div className="border p-4 rounded-lg mb-4">
              <h3 className="text-xl text-blue-500 text-center mb-4">Media</h3>

              <Form.Item
                name="banner"
                label="تصویر بنر"
                rules={[
                  {
                    required: true,
                    message: "لطفاً تصویر بنر را آپلود کنید.",
                  },
                ]}
              >
                <Upload
                  maxCount={1}
                  beforeUpload={() => false}
                  listType="picture"
                >
                  <Button icon={<UploadOutlined />} loading={uploading}>
                    آپلود تصویر
                  </Button>
                </Upload>
              </Form.Item>

              <Form.Item name="icon" label="آیکون">
                <Upload
                  maxCount={1}
                  beforeUpload={() => false}
                  listType="picture"
                  accept="image/*"
                >
                  <Button icon={<UploadOutlined />} loading={uploading}>
                    آپلود آیکون
                  </Button>
                </Upload>
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
            </div>

          

           
            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading}>
                ثبت
              </Button>
              <Button
                onClick={() => navigate("/categories")}
                style={{ marginRight: "8px" }}
              >
                انصراف
              </Button>
            </Form.Item>
          </Form>
        </Spin>
      </div>
    </Card>
  );
};

export default AddCategoryPage;