import { useState, useEffect } from "react";
import { Table, Button, Space, Popconfirm, message, Image, Card } from "antd";
import { EditOutlined, DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import api from "../../../api";

const CategoryBlogIndex = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 25,
    total: 0,
  });

  const navigate = useNavigate();

  const fetchCategories = async (page = 1, pageSize = 25) => {
    setLoading(true);
    try {
      const response = await api.get(`/panel/category`, {
        params: {
        //   "includes[]": "products",
          "type" : "Blog",
          page,
          per_page: pageSize,
        },
      });
      setCategories(response.data.data);
      setPagination({
        current: response.data.meta.current_page,
        pageSize: response.data.meta.per_page,
        total: response.data.meta.total,
      });
    } catch (error) {
      message.error("خطا در دریافت اطلاعات");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleTableChange = (pagination) => {
    fetchCategories(pagination.current, pagination.pageSize);
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/panel/category/${id}`);
      message.success("دسته‌بندی با موفقیت حذف شد");
      fetchCategories(pagination.current, pagination.pageSize);
    } catch (error) {
      message.error("خطا در حذف دسته‌بندی");
    }
  };

  const columns = [
    {
      title: "شناسه",
      dataIndex: "id",
      key: "id",
    },
    {
      title: "عنوان",
      dataIndex: "title",
      key: "title",
    },
    {
      title: "تصویر",
      dataIndex: "thumb",
      key: "thumb",
      render: (icon) => (
        <Image src={icon} alt="تصویر دسته‌بندی" width={100} preview={false} />
      ),
    },
    {
      title: "اولویت",
      dataIndex: "order",
      key: "priority",
      sorter: (a, b) => a.order - b.order,
    },
    {
      title: "عملیات",
      key: "action",
      render: (_, record) => (
        <Space size="middle">
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => navigate(`/blog-categories/edit/${record.id}`)}
          ></Button>
          <Popconfirm
            title="آیا از حذف این دسته‌بندی اطمینان دارید؟"
            onConfirm={() => handleDelete(record.id)}
            okText="بله"
            cancelText="خیر"
          >
            <Button type="primary" danger icon={<DeleteOutlined />}></Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card>
      <div>
        <div className="mb-10 flex justify-between items-center">
          <h1 className="text-2xl font-bold">مدیریت دسته‌بندی‌های بلاگ</h1>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate("/blog-categories/add")}
          >
            افزودن دسته‌بندی جدید
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={categories}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showTotal: (total) => `مجموع: ${total} دسته‌بندی`,
          }}
          onChange={handleTableChange}
        />
      </div>
    </Card>
  );
};

export default CategoryBlogIndex;
