import React, { useState, useEffect } from "react";
import { Table, Button, Space, Modal, message, Form, Input, Upload, Image, Card } from "antd";
import { EditOutlined, DeleteOutlined, PlusOutlined, UploadOutlined } from "@ant-design/icons";
import api from "../../api";
import { useNavigate } from "react-router-dom";

const BlogList = () => {
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedBlogId, setSelectedBlogId] = useState(null);
  const [commercialItems, setCommercialItems] = useState([]);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const fetchCommercialItems = async (blogId) => {
    try {
      const response = await api.get(
        `/panel/commercial-banner?per_page=all&commercialable_type=Blog&commercialable_id=${blogId}`
      );
      setCommercialItems(response.data.data);
    } catch (error) {
      message.error("خطا در دریافت اطلاعات");
    }
  };

  const handleUploadClick = (blogId) => {
    setSelectedBlogId(blogId);
    fetchCommercialItems(blogId);
    setModalVisible(true);
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      const formData = new FormData();
      formData.append("title", values.title);
      formData.append("order", values.order);
      formData.append("link", values.link);
      formData.append("image", values.image.file.originFileObj);
      formData.append("commercialable_type", "Blog");
      formData.append("commercialable_id", selectedBlogId);

      await api.post("/panel/commercial-banner", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      message.success("آیتم با موفقیت اضافه شد");
      fetchCommercialItems(selectedBlogId);
      form.resetFields();
    } catch (error) {
      message.error("خطا در افزودن آیتم");
    }
  };

  const handleDeleteCommercialItem = async (id) => {
    try {
      await api.delete(`/panel/commercial-banner/${id}`);
      message.success("آیتم با موفقیت حذف شد");
      fetchCommercialItems(selectedBlogId);
    } catch (error) {
      message.error("خطا در حذف آیتم");
    }
  };

  useEffect(() => {
    fetchPrograms();
  }, []);

//   const columns = [
//     { title: "شناسه", dataIndex: "id", key: "id", width: 100 },
//     { title: "عنوان ", dataIndex: "title", key: "title" },
//     {
//       title: "عملیات",
//       key: "action",
//       fixed: "right",
//       width: 200,
//       render: (_, record) => (
//         <Space>
//           <Button
//             type="primary"
//             icon={<EditOutlined />}
//             onClick={() => handleEdit(record.id)}
//           />
//           <Button
//             type="primary"
//             danger
//             icon={<DeleteOutlined />}
//             onClick={() => handleDelete(record.id)}
//           />
//           <Button
//             type="primary"
//             icon={<UploadOutlined />}
//             onClick={() => handleUploadClick(record.id)}
//           />
//         </Space>
//       ),
//     },
//   ];

  const commercialColumns = [
    { title: "عنوان", dataIndex: "title", key: "title" },
    { title: "ترتیب", dataIndex: "order", key: "order" },
    { title: "لینک", dataIndex: "link", key: "link" },
    {
      title: "تصویر",
      dataIndex: "image",
      key: "image",
      render: (image) => <Image src={image} width={100} />,
    },
    {
      title: "عملیات",
      key: "action",
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteCommercialItem(record.id)}
          />
        </Space>
      ),
    },
  ];

  const fetchPrograms = async () => {
    setLoading(true);
    try {
      const response = await api.get("/panel/blog");
      setPrograms(response.data.data);
    } catch (error) {
      message.error("خطا در دریافت اطلاعات");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPrograms();
  }, []);

  const handleDelete = (id) => {
    Modal.confirm({
      title: "آیا از حذف این  بلاگ اطمینان دارید؟",
      okText: "بله",
      cancelText: "خیر",
      onOk: async () => {
        try {
          await api.delete(`/panel/blog/${id}`);
          message.success("بلاگ  با موفقیت حذف شد");
          fetchPrograms();
        } catch (error) {
          message.error("خطا در حذف  بلاگ");
        }
      },
    });
  };

  const handleAdd = () => {
    navigate("/blogs/add");
  };

  const handleEdit = (id) => {
    navigate(`/blogs/edit/${id}`);
  };

  const columns = [
    {
      title: "شناسه",
      dataIndex: "id",
      key: "id",
      width: 100,
    },
    {
      title: "عنوان ",
      dataIndex: "title",
      key: "title",
    },

    {
      title: "بنر",
      dataIndex: "thumb",
      key: "thumb",
      render: (thumb) => (
        <Image
          src={thumb}
          alt="بنر  بلاگ"
          width={100}
          style={{ objectFit: "cover" }}
          fallback="data:image/png;base64,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"
        />
      ),
    },
    {
      title: "تاریخ ایجاد",
      dataIndex: "created_at",
      key: "created_at",
    },
    {
      title: "عملیات",
      key: "action",
      fixed: "right",
    //   width: 150,
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record.id)}
          />
          <Button
            type="primary"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
          />
          <Button
            type="primary"
            icon={<UploadOutlined />}
            onClick={() => handleUploadClick(record.id)}
          />
        </Space>
      ),
    },
  ];

  return (
    <Card>
      <h1 className="mb-10 text-xl"> بلاگ‌ها</h1>
      <div style={{ marginBottom: "16px", textAlign: "right" }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          افزودن بلاگ
        </Button>
      </div>
      <Table
        columns={columns}
        dataSource={programs}
        rowKey="id"
        loading={loading}
        // scroll={{ x: 1200 }}
      />
      <Modal
        title="مدیریت بنرهای تجاری"
        visible={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleModalOk}
        okText="ارسال"
        cancelText="لغو"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="title"
            label="عنوان"
            rules={[{ required: true, message: "لطفا عنوان را وارد کنید" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="image"
            label="آپلود تصویر"
            valuePropName="file"
            rules={[{ required: true, message: "لطفا تصویر را وارد کنید" }]}
          >
            <Upload accept="image/*" maxCount={1}>
              <Button icon={<UploadOutlined />}>انتخاب تصویر</Button>
            </Upload>
          </Form.Item>
          <Form.Item
            name="order"
            label="ترتیب"
            rules={[{ required: true, message: "لطفا ترتیب را وارد کنید" }]}
          >
            <Input type="number" />
          </Form.Item>
          <Form.Item
            name="link"
            label="لینک"
            rules={[{ required: true, message: "لطفا لینک را وارد کنید" }]}
          >
            <Input />
          </Form.Item>
        </Form>
        <Table
          columns={commercialColumns}
          dataSource={commercialItems}
          scroll={{ x: 1000 }}
          rowKey="id"
        />
      </Modal>
    </Card>
  );
};

export default BlogList;
