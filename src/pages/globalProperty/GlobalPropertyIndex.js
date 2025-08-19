import { useState, useEffect } from "react";
import { Table, Button, Space, Popconfirm, message, Card, Input, Tag } from "antd";
import { EditOutlined, DeleteOutlined, PlusOutlined, SearchOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import api from "../../api";

const GlobalPropertyIndex = () => {
  const [globalProperties, setGlobalProperties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 25,
    total: 0,
  });

  const navigate = useNavigate();

  const debounce = (func, wait) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  };

  const fetchGlobalProperties = async (page = 1, pageSize = 25, search = "") => {
    setLoading(true);
    try {
      const response = await api.get(`/panel/global-property`, {
        params: {
          "includes[]": ["parent", "category", "relation_category"],
          page,
          per_page: pageSize,
          search: search.trim(),
        },
      });
      setGlobalProperties(response.data.data);
      setPagination({
        current: response.data.meta.current_page,
        pageSize: response.data.meta.per_page,
        total: response.data.meta.total,
      });
    } catch (error) {
      message.error("خطا در دریافت اطلاعات مشخصات فنی");
    } finally {
      setLoading(false);
    }
  };

  const debouncedSearch = debounce((value) => {
    setPagination((prev) => ({ ...prev, current: 1 }));
    fetchGlobalProperties(1, pagination.pageSize, value);
  }, 500);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchText(value);
    debouncedSearch(value);
  };

  useEffect(() => {
    fetchGlobalProperties(1, pagination.pageSize, searchText);
  }, []);

  const handleTableChange = (pagination) => {
    fetchGlobalProperties(pagination.current, pagination.pageSize, searchText);
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/panel/global-property/${id}`);
      message.success("مشخصات فنی با موفقیت حذف شد");
      fetchGlobalProperties(pagination.current, pagination.pageSize, searchText);
    } catch (error) {
      message.error("خطا در حذف مشخصات فنی");
    }
  };

  const columns = [
    {
      title: "شناسه",
      dataIndex: "id",
      key: "id",
      width: 80,
    },
    {
      title: "عنوان",
      dataIndex: "title",
      key: "title",
    },
    {
      title: "توضیحات",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
    },
    {
      title: "ترتیب",
      dataIndex: "order",
      key: "order",
      width: 100,
    },
    {
      title: "والد",
      key: "parent",
      render: (_, record) => record.parent ? record.parent.title : "-",
    },
    {
      title: "دسته‌بندی",
      key: "category",
      render: (_, record) => record.category ? record.category.title : "-",
    },
    {
      title: "تاریخ ایجاد",
      dataIndex: "created_at",
      key: "created_at",
      render: (date) => new Date(date).toLocaleDateString("fa-IR"),
    },
    {
      title: "عملیات",
      key: "action",
      width: 150,
      render: (_, record) => (
        <Space size="middle">
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => navigate(`/global-properties/edit/${record.id}`)}
          />
          <Popconfirm
            title="آیا از حذف این مشخصات فنی اطمینان دارید؟"
            onConfirm={() => handleDelete(record.id)}
            okText="بله"
            cancelText="خیر"
          >
            <Button type="primary" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card>
      <div>
        <div className="mb-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">مدیریت مشخصات فنی</h1>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate("/global-properties/add")}
          >
            افزودن مشخصات فنی جدید
          </Button>
        </div>
        <div className="mb-4">
          <Input
            placeholder="جستجوی مشخصات فنی..."
            prefix={<SearchOutlined />}
            onChange={handleSearchChange}
            value={searchText}
            className="max-w-md"
            allowClear
          />
        </div>

        <Table
          columns={columns}
          dataSource={globalProperties}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showTotal: (total) => `مجموع: ${total} مشخصات فنی`,
          }}
          onChange={handleTableChange}
        />
      </div>
    </Card>
  );
};

export default GlobalPropertyIndex;