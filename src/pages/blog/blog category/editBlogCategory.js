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
  Row,
  Col,
  Divider,
  Switch,
} from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../../api";
import TinyEditor from "../../../components/Editor";

const { TextArea } = Input;

const EditCategoryBlogPage = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { id } = useParams(); 
  const [loading, setLoading] = useState(false);
  const [loadingCategory, setLoadingCategory] = useState(false);
  const [uploading, setUploading] = useState(false);
  const editorRef = useRef(null);
  const [editorContent, setEditorContent] = useState("");
  const [existingBanner, setExistingBanner] = useState(null);
  const [existingIcon, setExistingIcon] = useState(null);
  const [existingThumb, setExistingThumb] = useState(null);

  const handleEditorChange = (content) => {
    setEditorContent(content);
  };

  useEffect(() => {
    const fetchCategory = async () => {
      setLoadingCategory(true);
      try {
        const response = await api.get(`/panel/category/${id}`);
        console.log(response.data);
        const data = response?.data?.data;
        form.setFieldsValue({
          title: data.title,
          description: data.description,
          order: data.order,
          seo_title: data?.seo_meta?.seo_title, 
          seo_description: data?.seo_meta?.seo_description,
          canonical:  data?.seo_meta?.canonical,
          follow: data?.seo_meta?.follow,
          index: data?.seo_meta?.index,

        });
        setEditorContent(data.body);
        setExistingBanner(data.banner);
        setExistingIcon(data?.icon);
        setExistingThumb(data?.thumb);
      } catch (error) {
        message.error("Error fetching category data.");
        navigate("/blog-categories");
      } finally {
        setLoadingCategory(false);
      }
    };

    fetchCategory();
  }, [id, form, navigate]);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const formData = new FormData();
  
      const appendIfExists = (key, value) => {
        formData.append(key, value !== undefined && value !== null ? value : ""); 
      };
  
      formData.append("title", values.title);
      formData.append("description", values.description);
      formData.append("body", editorContent);
      formData.append("order", values.order);
      formData.append("type", "Blog");
  
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
  
      const response = await api.post(`/panel/category/${id}?_method=PUT`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
  
      message.success("Category updated successfully.");
      navigate("/blog-categories");
    } catch (error) {
      message.error("Error updating category.");
    } finally {
      setLoading(false);
    }
  };
  

  return (
    <Card>
      <div>
        <h2 className="mb-10 text-xl">ویرایش دسته بندی بلاگ </h2>
        <Spin spinning={loading || loadingCategory}>
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
                label=" تصویر بنر"
                extra={
                  existingBanner && (
                    <img
                      src={existingBanner}
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
                >
                  <Button icon={<UploadOutlined />} loading={uploading}>
                    {existingBanner ? " تغییر تصویر " : " انتخاب تصویر "}
                  </Button>
                </Upload>
              </Form.Item>

              <Form.Item
                name="icon"
                label="تصویر آیکون "
                extra={
                  existingIcon && (
                    <img
                      src={existingIcon}
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
                name="thumb"
                label=" تصویر انگشتی"
                extra={
                  existingThumb && (
                    <img
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
            </div>

            <Divider>بخش سئو</Divider>
            <Form.Item
              name="seo_title"
              label="عنوان سئو"
              // rules={[{ required: true, message: "لطفا عنوان سئو را وارد کنید" }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              name="seo_description"
              label="توضیحات سئو"
              // rules={[
              //   { required: true, message: "لطفا توضیحات سئو را وارد کنید" },
              // ]}
            >
              <TextArea rows={4} />
            </Form.Item>

            <Form.Item
              name="canonical"
              label="URL Canonical"
              // rules={[
              //   { required: true, message: "لطفا Canonical URL را وارد کنید" },
              // ]}
            >
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
              <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                بروزرسانی
              </Button>
              <Button
                onClick={() => navigate("/blog-categories")}
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

export default EditCategoryBlogPage;
