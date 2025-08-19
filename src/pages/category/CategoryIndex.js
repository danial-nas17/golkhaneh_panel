import { useState, useEffect } from "react";
import { Table, Button, Space, Popconfirm, message, Image, Card, Input, Tag } from "antd";
import { EditOutlined, DeleteOutlined, PlusOutlined, SearchOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import api from "../../api";

const CategoryIndex = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 25,
    total: 0,
  });

  const debounce = (func, wait) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  };

  const navigate = useNavigate();

  const fetchCategories = async (page = 1, pageSize = 25, search = "") => {
    setLoading(true);
    try {
      const response = await api.get(`/panel/category?includes[]=filters`, {
        params: {
          // "includes[]": ["products", "parent"],
          page,
          per_page: pageSize,
          search: search.trim(),
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

  const debouncedSearch = debounce((value) => {
    setPagination((prev) => ({ ...prev, current: 1 }));
    fetchCategories(1, pagination.pageSize, value);
  }, 500);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchText(value);
    debouncedSearch(value);
  };

  useEffect(() => {
    fetchCategories(1, pagination.pageSize, searchText);
  }, []);

  const handleTableChange = (pagination) => {
    fetchCategories(pagination.current, pagination.pageSize, searchText);
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
      render: (text, record) => (
        <Space direction="vertical" size="small">
          <span>{text}</span>
          {record.parent && (
            <Tag color="blue">زیردسته {record.parent.title}</Tag>
          )}
        </Space>
      ),
    },
    // {
    //   title: "نوع",
    //   key: "category_type",
    //   render: (_, record) => {
    //     if (record.parent) {
    //       return <Tag color="green">زیردسته</Tag>;
    //     } else {
    //       // Check if this category has any children
    //       const hasChildren = categories.some(cat => cat.parent_id === record.id);
    //       return hasChildren ? 
    //         <Tag color="purple">دسته‌بندی اصلی (دارای زیردسته)</Tag> : 
    //         <Tag color="default">دسته‌بندی اصلی</Tag>;
    //     }
    //   },
    // },
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
            onClick={() => navigate(`/categories/edit/${record.id}?includes[]=filters`)}
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
          <h1 className="text-2xl font-bold">مدیریت دسته‌بندی‌ها</h1>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate("/categories/add")}
          >
            افزودن دسته‌بندی جدید
          </Button>
        </div>
        <div className="mb-4">
          <Input
            placeholder="جستجوی دسته‌بندی..."
            prefix={<SearchOutlined />}
            onChange={handleSearchChange}
            value={searchText}
            className="max-w-md"
            allowClear
          />
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

export default CategoryIndex;
