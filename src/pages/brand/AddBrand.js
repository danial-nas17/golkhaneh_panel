import React, { useState, useEffect, useRef } from "react";
import {
  Form,
  Input,
  Button,
  Upload,
  Select,
  InputNumber,
  message,
  Spin,
  Card,
  Space,
} from "antd";
import { UploadOutlined } from "@ant-design/icons";
import BackButton from "../../components/BackButton";
import { useNavigate } from "react-router-dom";
import api from "../../api";
import TinyEditor from "../../components/Editor";


const { TextArea } = Input;


const AddBrand = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editorContent, setEditorContent] = useState("");

  const handleEditorChange = (content) => {
    setEditorContent(content);
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
      // if (values.thumb?.file) {
      //   formData.append("thumb", values.thumb.file);
      // }

      const response = await api.post("/panel/brand", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      message.success("برند با موفقیت اضافه شد.");
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
        message.error("خطا در ارسال اطلاعات.");
        console.error("خطا:", error);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl">افزودن برند</h2>
          <BackButton to="/brands" />
        </div>
        <Spin spinning={loading}>
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
                model={"Category"}
                height={1000}
              />
            </Form.Item>

            <div className="border p-4 rounded-lg mb-4">
              <h3 className="text-xl text-blue-500 text-center mb-4">Media</h3>

              <Form.Item
                name="banner"
                label="تصویر بنر"
               
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

              <Form.Item name="icon" label="تصویر آیکون">
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
                  ذخیره
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

export default AddBrand;
