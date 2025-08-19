import { useState, useEffect } from "react";
import { Table, Button, Space, Popconfirm, message, Card, Input, Tag } from "antd";
import { EditOutlined, DeleteOutlined, PlusOutlined, SearchOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import api from "../../api";
import { FilterErrorHandler } from "../../utils/errorHandler";

const FilterIndex = () => {
  const [filters, setFilters] = useState([]);
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

  const fetchFilters = async (page = 1, pageSize = 25, search = "") => {
    setLoading(true);
    try {
      const response = await api.get(`/panel/dynamic-filter`, {
        params: {
          page,
          per_page: pageSize,
          search: search.trim(),
        },
      });
      setFilters(response.data.data);
      setPagination({
        current: response.data.meta.current_page,
        pageSize: response.data.meta.per_page,
        total: response.data.meta.total,
      });
    } catch (error) {
      FilterErrorHandler.handleFilterError(error, 'fetch');
    } finally {
      setLoading(false);
    }
  };

  const debouncedSearch = debounce((value) => {
    setPagination((prev) => ({ ...prev, current: 1 }));
    fetchFilters(1, pagination.pageSize, value);
  }, 500);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchText(value);
    debouncedSearch(value);
  };

  useEffect(() => {
    fetchFilters(1, pagination.pageSize, searchText);
  }, []);

  const handleTableChange = (pagination) => {
    fetchFilters(pagination.current, pagination.pageSize, searchText);
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/panel/dynamic-filter/${id}`);
      message.success("فیلتر با موفقیت حذف شد");
      fetchFilters(pagination.current, pagination.pageSize, searchText);
    } catch (error) {
      FilterErrorHandler.handleFilterError(error, 'delete');
    }
  };

  const renderValue = (value) => {
    if (!value) return "-";
    
    if (value.min !== undefined || value.max !== undefined) {
      return (
        <div>
          {value.min !== null && <div>حداقل: {value.min.toLocaleString()}</div>}
          {value.max !== null && <div>حداکثر: {value.max.toLocaleString()}</div>}
        </div>
      );
    }
    
    return JSON.stringify(value);
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
      dataIndex: "label",
      key: "label",
    },
    {
      title: "نوع",
      dataIndex: "type",
      key: "type",
      render: (type) => {
        const typeNames = {
          price: "قیمت",
        };
        
        const displayName = typeNames[type] || type;
        
        return <Tag color="blue">{displayName}</Tag>;
      },
    },
    // {
    //   title: "عملگر",
    //   dataIndex: "operator",
    //   key: "operator",
    // },
    {
      title: "مقدار",
      dataIndex: "value",
      key: "value",
      render: renderValue,
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
            onClick={() => navigate(`/filters/edit/${record.id}`)}
          />
          <Popconfirm
            title="آیا از حذف این فیلتر اطمینان دارید؟"
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
          <h1 className="text-2xl font-bold">مدیریت فیلترها</h1>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate("/filters/add")}
          >
            افزودن فیلتر جدید
          </Button>
        </div>
        <div className="mb-4">
          <Input
            placeholder="جستجوی فیلترها..."
            prefix={<SearchOutlined />}
            onChange={handleSearchChange}
            value={searchText}
            className="max-w-md"
            allowClear
          />
        </div>

        <Table
          columns={columns}
          dataSource={filters}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showTotal: (total) => `مجموع: ${total} فیلتر`,
          }}
          onChange={handleTableChange}
        />
      </div>
    </Card>
  );
};

export default FilterIndex;