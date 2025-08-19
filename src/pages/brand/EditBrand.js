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
  Space,
} from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api";
import TinyEditor from "../../components/Editor";

const { TextArea } = Input;

const EditBrand = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [loadingBrand, setLoadingBrand] = useState(false);
  const [uploading, setUploading] = useState(false);
  const editorRef = useRef(null);
  const [editorContent, setEditorContent] = useState("");
  const [existingBanner, setExistingBanner] = useState(null);
  const [existingIcon, setExistingIcon] = useState(null);

  const handleEditorChange = (content) => {
    setEditorContent(content);
  };

  useEffect(() => {
    const fetchBrand = async () => {
      setLoadingBrand(true);
      try {
        const response = await api.get(`/panel/brand/${id}`);
        const data = response?.data?.data;
        form.setFieldsValue({
          title: data?.title,
          description: data?.description,
          order: data?.order,
        });
        setEditorContent(data?.body);
        setExistingBanner(data?.banner);
        setExistingIcon(data?.icon);
      } catch (error) {
        message.error("خطا در دریافت اطلاعات برند.");
        navigate("/brands");
      } finally {
        setLoadingBrand(false);
      }
    };

    fetchBrand();
  }, [id, form, navigate]);

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

      if (values.banner?.file) {
        formData.append("banner", values.banner.file);
      }
      if (values.icon?.file) {
        formData.append("icon", values.icon.file);
      }

      await api.post(`/panel/brand/${id}?_method=PUT`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      message.success("برند با موفقیت به‌روزرسانی شد.");
      navigate("/brands");
    } catch (error) {
      if (error.response && error.response.status === 422) {
        const validationErrors = error.validationErrors || {};
        
        // Display the first validation error message
        const firstErrorField = Object.keys(validationErrors)[0];
        const firstErrorMessage = validationErrors[firstErrorField]?.[0];
        
        if (firstErrorMessage) {
          message.error(firstErrorMessage);
        } else {
          message.error("خطای اعتبارسنجی در فرم");
        }
        
        // Set form field errors
        const formErrors = {};
        Object.keys(validationErrors).forEach(field => {
          formErrors[field] = {
            errors: validationErrors[field].map(msg => new Error(msg))
          };
        });
        
        form.setFields(Object.keys(formErrors).map(field => ({
          name: field,
          errors: validationErrors[field]
        })));
        
        console.error("خطای اعتبارسنجی:", validationErrors);
      } else {
        message.error("خطا در به‌روزرسانی برند.");
        console.error("خطا:", error);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <div>
        <h2 className="mb-10 text-xl">ویرایش برند</h2>
        <Spin spinning={loading || loadingBrand}>
          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            autoComplete="off"
          >
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

            <Form.Item
              name="description"
              label="توضیحات"
              // rules={[
              //   {
              //     required: true,
              //     message: "لطفاً توضیحات را وارد کنید.",
              //   },
              // ]}
            >
              <TextArea rows={6} />
            </Form.Item>

            <Form.Item
              name="order"
              label="اولویت"
              // rules={[
              //   {
              //     required: true,
              //     message: "لطفاً اولویت را وارد کنید.",
              //   },
              // ]}
            >
              <InputNumber min={1} style={{ width: "100%" }} />
            </Form.Item>

            <Form.Item
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
                model={"Brand"}
                height={1000}
              />
            </Form.Item>

            <div className="border p-4 rounded-lg mb-4">
              <h3 className="text-xl text-blue-500 text-center mb-4">رسانه</h3>

              <Form.Item
                name="banner"
                label="تصویر بنر"
                extra={
                  existingBanner && (
                    <img
                    className="mt-4"
                      src={existingBanner}
                      alt="بنر موجود"
                      style={{ maxWidth: "200px" }}
                    />
                  )
                }
              >
                <Upload
                  maxCount={1}
                  beforeUpload={() => false}
                  listType="picture"
                >
                  <Button icon={<UploadOutlined />} loading={uploading}>
                    {existingBanner ? "تغییر تصویر" : "انتخاب تصویر"}
                  </Button>
                </Upload>
              </Form.Item>

              <Form.Item
                name="icon"
                label="تصویر آیکون"
                extra={
                  existingIcon && (
                    <img
                    className="mt-4"
                      src={existingIcon}
                      alt="آیکون موجود"
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
                    آپلود آیکون
                  </Button>
                </Upload>
              </Form.Item>
            </div>

            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit" loading={loading}>
                  ذخیره تغییرات
                </Button>
                <Button
                  onClick={() => navigate("/brands")}
                  style={{ marginRight: "8px" }}
                >
                  انصراف
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Spin>
      </div>
    </Card>
  );
};

export default EditBrand;
