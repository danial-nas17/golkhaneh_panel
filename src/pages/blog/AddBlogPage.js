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
  Divider,
  Row,
  Col,
  Switch,
  Card,
  Space,
} from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import api from "../../api";
import { Editor } from "@tinymce/tinymce-react";
import TinyEditor from "../../components/Editor";

const { TextArea } = Input;

const AddBlog = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [options, setOptions] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const editorRef = useRef(null);
  const [editorContent, setEditorContent] = useState("");
  const [charCount, setCharCount] = useState(0);
  const maxCharLimit = 500;
  const [imageFiles, setImageFiles] = useState([]);

  const uploadProps = {
    beforeUpload: (file) => {
      const isImage = file.type.startsWith("image/");
      if (!isImage) {
        message.error(`${file.name} is not an image file`);
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

  const handleEditorChange = (content, editor) => {
    setEditorContent(content);
    setCharCount(content.length);
  };

  useEffect(() => {
    const fetchOptions = async () => {
      setLoadingOptions(true);
      try {
        const response = await api.get("/panel/category?type=Blog");
        setOptions(
          response.data.data.map((item) => ({
            value: item.id,
            label: item.title,
          }))
        );
      } catch (error) {
        message.error("خطا در دریافت گزینه‌ها");
      }
      setLoadingOptions(false);
    };

    fetchOptions();
  }, []);

  const handleUpload = async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    setUploading(true);
    try {
      const response = await api.post("/panel/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data.url;
    } catch (error) {
      message.error("خطا در آپلود تصویر");
      return "";
    } finally {
      setUploading(false);
    }
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

      if (values.thumb?.fileList?.[0]?.originFileObj) {
        formData.append("thumb", values.thumb.fileList[0].originFileObj);
      }

      formData.append("title", values.title);
      formData.append("description", values.description);
      formData.append("read_time", values.read_time);
      formData.append("categories", values.category_id);
      formData.append("body", editorContent);

      appendIfExists("seo_title", values.seo_title);
      appendIfExists("seo_description", values.seo_description);
      appendIfExists("canonical", values.canonical);
      formData.append("follow", values.follow ? "1" : "0");
      formData.append("index", values.index ? "1" : "0");

      imageFiles.forEach((file) => {
        const fileToUpload = file.originFileObj || file;
        formData.append("commercial_images[]", fileToUpload);
      });

      for (let pair of formData.entries()) {
        console.log(pair[0], pair[1]);
      }

      await api.post("/panel/blog", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      message.success("بلاگ با موفقیت ایجاد شد");
      navigate("/blogs");
    } catch (error) {
      message.error("خطا در ایجاد بلاگ");
      console.error("Error:", error);
    }
    setLoading(false);
  };

  return (
    <Card>
      <h2 className="mb-10 text-xl">افزودن بلاگ</h2>
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
                message: "لطفا عنوان را وارد کنید",
              },
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="read_time"
            label="زمان مطالعه"
            rules={[
              {
                required: true,
                message: "لطفا عنوان را وارد کنید",
              },
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="description"
            label="توضیحات مختصر"
            rules={[
              {
                required: true,
                message: "لطفا توضیحات را وارد کنید",
              },
            ]}
          >
            <TextArea rows={6} />
          </Form.Item>

          <Form.Item
            name="category_id"
            label="دسته‌بندی"
            rules={[
              {
                required: true,
                message: "لطفا دسته‌بندی را انتخاب کنید",
              },
            ]}
          >
            <Select
              loading={loadingOptions}
              options={options}
              placeholder="انتخاب دسته‌بندی"
            />
          </Form.Item>

          <Form.Item
            name="thumb"
            label="تصویر بنر"
            rules={[
              {
                required: true,
                message: "لطفا تصویر بنر را آپلود کنید",
              },
            ]}
          >
            <Upload maxCount={1} beforeUpload={() => false} listType="picture">
              <Button icon={<UploadOutlined />} loading={uploading}>
                انتخاب تصویر
              </Button>
            </Upload>
          </Form.Item>

          <Form.Item
            label="توضیحات"
            required
            validateTrigger={["onChange", "onBlur"]}
            rules={[
              {
                required: true,
                validator: (_, value) => {
                  if (!editorContent) {
                    return Promise.reject("لطفا توضیحات را وارد کنید");
                  }
                  return Promise.resolve();
                },
              },
            ]}
          >
            <TinyEditor
              content={editorContent}
              onEditorChange={handleEditorChange}
              model={"Blog"}
              height={1000}
            />
            <div style={{ marginTop: "8px", fontSize: "16px", color: "#999" }}>
              {/* {`You can use up to ${maxCharLimit} characters. Used: ${charCount}. Remaining: ${maxCharLimit - charCount}`} */}
              {`شما میتوانید از ${maxCharLimit} کاراکتر در این ادیتور استفاده نمایید. (تعداد کاراکتر فعلی:${charCount})`}
            </div>
          </Form.Item>

          {/* <Form.Item
            label="commercial images"
            required
            rules={[
              {
                validator: (_, value) =>
                  imageFiles.length > 0
                    ? Promise.resolve()
                    : Promise.reject(
                        new Error("Please upload at least one image")
                      ),
              },
            ]}
          >
            <Upload {...uploadProps}>
              <Button icon={<UploadOutlined />}>
                Select Images{" "}
                {imageFiles.length > 0 && `(${imageFiles.length} selected)`}
              </Button>
            </Upload>
            {imageFiles.length > 0 && (
              <div className="mt-2 text-gray-500">
                {imageFiles.length} image{imageFiles.length !== 1 ? "s" : ""}{" "}
                selected
              </div>
            )}
          </Form.Item> */}

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
                <Switch />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="index" label="Index" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
          </Row>
          <Space>
            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading}>
                ثبت
              </Button>
              <Button
                onClick={() => navigate("/panel/immigration-programs")}
                style={{ marginRight: "8px" }}
              >
                انصراف
              </Button>
            </Form.Item>
          </Space>
        </Form>
      </Spin>
    </Card>
  );
};

export default AddBlog;
