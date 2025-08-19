import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Form,
  Input,
  Select,
  Button,
  message,
  Spin,
  Upload,
  Image,
  Row,
  Col,
  Switch,
  Divider,
  Card,
  Space,
} from "antd";
import { Editor } from "@tinymce/tinymce-react";
import { UploadOutlined } from "@ant-design/icons";
import api from "../../api";
import TextArea from "antd/es/input/TextArea";
import TinyEditor from "../../components/Editor";

const EDITOR_CONFIG = {
  height: 500,
  menubar: true,
  branding: false,
  statusbar: false,
  plugins: [
    "advlist",
    "autolink",
    "lists",
    "link",
    "image",
    "charmap",
    "preview",
    "anchor",
    "searchreplace",
    "visualblocks",
    "code",
    "fullscreen",
    "media",
    "table",
    "help",
    "wordcount",
    "directionality",
  ],
  toolbar:
    "undo redo | formatselect | bold italic backcolor | alignleft aligncenter " +
    "alignright alignjustify | bullist numlist outdent indent | " +
    "removeformat | help | rtl ltr | image",
  content_style:
    "body { font-family:Helvetica,Arial,sans-serif; font-size:14px }",
  directionality: "rtl",
  language: "fa",
};

const EditBlog = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [editorContent, setEditorContent] = useState("");
  const [categories, setCategories] = useState([]);
  const [fileList, setFileList] = useState([]);
  const [charCount, setCharCount] = useState(0);
  const maxCharLimit = 500;
  const [imageFiles, setImageFiles] = useState([]); 
  const [currentImages, setCurrentImages] = useState([]); 
  const [thumbUrl, setThumbUrl] = useState(null);

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

  const handleEditorChange = (content, editor) => {
    setEditorContent(content);
    setCharCount(content.length);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categoriesResponse, blogResponse] = await Promise.all([
          api.get("/panel/category?type=Blog"),
          api.get(`/panel/blog/${id}`),
        ]);

        const blogData = blogResponse?.data?.data;
        setCategories(categoriesResponse?.data?.data);

        if (blogData?.commercial_images?.length > 0) {
          setCurrentImages(
            blogData.commercial_images.map((url) => ({
              url,
              status: "done",
              isExisting: true,
            }))
          );
        }

        if (blogData.thumb) {
          setThumbUrl(blogData?.thumb);
        }

        form.setFieldsValue({
          title: blogData?.title,
          description: blogData?.description,
          category_id: blogData?.category?.id,
          seo_title: blogData?.seo_meta?.seo_title, 
          seo_description: blogData?.seo_meta?.seo_description,
          canonical:  blogData?.seo_meta?.canonical,
          follow: blogData?.seo_meta?.follow,
          index: blogData?.seo_meta?.index,

        });

        setEditorContent(blogData?.body);
      } catch (error) {
        message.error("خطا در دریافت اطلاعات");
      } finally {
        setInitialLoading(false);
      }
    };

    fetchData();
  }, [id, form]);

  const thumbUploadProps = {
    beforeUpload: (file) => {
      const isImage = file.type.startsWith("image/");
      if (!isImage) {
        message.error(`${file.name} is not an image file`);
        return Upload.LIST_IGNORE;
      }
      setFileList([file]);
      setThumbUrl(URL.createObjectURL(file));
      return false;
    },
    multiple: false,
    listType: "picture",
    accept: "image/*",
    showUploadList: false,
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

      formData.append("title", values.title);
      formData.append("description", values.description);
      formData.append("categories[]", values.category_id);
      formData.append("body", editorContent);

    appendIfExists("seo_title", values.seo_title);
    appendIfExists("seo_description", values.seo_description);
    appendIfExists("canonical", values.canonical);
    formData.append("follow", values.follow ? "1" : "0");
    formData.append("index", values.index ? "1" : "0");


      if (fileList.length > 0) {
        formData.append("thumb", fileList[0]);
      }

      const existingImageFiles = await Promise.all(
        currentImages.map((img) => urlToFile(img.url))
      );

      [...existingImageFiles, ...imageFiles].forEach((file) => {
        if (file) {
          formData.append("commercial_images[]", file);
        }
      });

      for (let pair of formData.entries()) {
        console.log(pair[0] + ": " + pair[1]);
      }

      await api.post(`/panel/blog/${id}?_method=PUT`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      message.success("بلاگ با موفقیت ویرایش شد");
      navigate("/blogs");
    } catch (error) {
      message.error("خطا در ویرایش بلاگ");
    }
    setLoading(false);
  };

  if (initialLoading) {
    return <Spin size="large" />;
  }

  return (
    <Card>
      <h2 className="mb-10 text-xl">ویرایش بلاگ</h2>
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
            rules={[{ required: true, message: "لطفا عنوان را وارد کنید" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="description"
            label="توضیحات مختصر"
            rules={[{ required: true, message: "لطفا توضیحات را وارد کنید" }]}
          >
            <TextArea rows={6} />
          </Form.Item>

          <Form.Item
            name="category_id"
            label="دسته‌بندی"
            rules={[{ required: true, message: 'لطفا دسته‌بندی را انتخاب کنید' }]}
          >
            <Select>
              {categories.map((category) => (
                <Select.Option key={category.id} value={category.id}>
                  {category.title}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="thumb" label="بنر">
            <div className="flex flex-col gap-4">
              {thumbUrl && (
                <div className="relative w-fit">
                  <Image
                    src={thumbUrl}
                    alt="Thumbnail"
                    width={200}
                    preview={false}
                  />
                  <Button
                    danger
                    size="small"
                    className="absolute top-2 right-2"
                    onClick={() => {
                      setThumbUrl(null);
                      setFileList([]);
                    }}
                  >
                    ×
                  </Button>
                </div>
              )}
              <Upload {...thumbUploadProps}>
                <Button icon={<UploadOutlined />}>
                  {thumbUrl ? "تغییر تصویر" : "انتخاب تصویر"}
                </Button>
              </Upload>
            </div>
          </Form.Item>

          <Form.Item
            label="محتوای اصلی"
            required
            validateTrigger={["onChange", "onBlur"]}
            rules={[
              {
                required: true,
                validator: (_, value) =>
                  editorContent
                    ? Promise.resolve()
                    : Promise.reject("لطفا محتوا را وارد کنید"),
              },
            ]}
          >
            <TinyEditor
              content={editorContent}
              onEditorChange={handleEditorChange}
              model={"Blog"}
              height={1000}
            />
            .{" "}
            <div style={{ marginTop: "8px", fontSize: "16px", color: "#999" }}>
              {/* {`You can use up to ${maxCharLimit} characters. Used: ${charCount}. Remaining: ${maxCharLimit - charCount}`} */}
              {`شما میتوانید از ${maxCharLimit} کاراکتر در این ادیتور استفاده نمایید. (تعداد کاراکتر فعلی:${charCount})`}
            </div>
          </Form.Item>

          

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
           
          >
            <TextArea rows={4} />
          </Form.Item>

          <Form.Item
            name="canonical"
            label="URL Canonical"
            
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

          <Form.Item className="flex gap-2">
            <Space>
            <Button type="primary" htmlType="submit">
              ذخیره تغییرات
            </Button>
            <Button onClick={() => navigate("/blogs")}>انصراف</Button>
            </Space>
          </Form.Item>
        </Form>
      </Spin>
      </Card>
  );
};

export default EditBlog;
