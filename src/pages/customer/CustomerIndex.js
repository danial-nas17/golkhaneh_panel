import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Input,
  Space,
  Card,
  Tag,
  message,
  Typography,
} from "antd";
import {
  SearchOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import api from "../../api";
import UnifiedErrorHandler from "../../utils/unifiedErrorHandler";

const { Text } = Typography;

const CustomerIndex = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 25,
    total: 0,
  });
  const navigate = useNavigate();

  const fetchCustomers = async (page = 1, search = "") => {
    try {
      setLoading(true);
      const params = {
        page,
        per_page: pagination.pageSize,
      };
      
      if (search.trim()) {
        params.search = search.trim();
      }

      const response = await api.get("/panel/customers", { params });
      const { data, meta } = response.data;
      
      setCustomers(data || []);
      setPagination(prev => ({
        ...prev,
        current: meta.current_page,
        total: meta.total,
      }));
    } catch (error) {
      console.error("Error fetching customers:", error);
      UnifiedErrorHandler.handleApiError(error, null, {
        showGeneralMessages: true,
        defaultMessage: "خطا در دریافت لیست مشتریان",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleSearch = (value) => {
    setSearchText(value);
    setPagination(prev => ({ ...prev, current: 1 }));
    fetchCustomers(1, value);
  };

  const handleTableChange = (paginationConfig) => {
    const { current, pageSize } = paginationConfig;
    setPagination(prev => ({ ...prev, current, pageSize }));
    fetchCustomers(current, searchText);
  };

  const handleViewCustomer = (customerId) => {
    navigate(`/customers/${customerId}`);
  };

  const columns = [
    {
      title: "شناسه",
      dataIndex: "id",
      key: "id",
      width: 80,
    },
    {
      title: "نام",
      dataIndex: "name",
      key: "name",
      render: (text) => <Text strong>{text || "نامشخص"}</Text>,
    },
    
    
    {
      title: "شماره تماس",
      dataIndex: "phone",
      key: "phone",
    },
    {
      title: "ایمیل",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "شهر",
      dataIndex: "city",
      key: "city",
      render: (text) => text || "-",
    },
    {
      title: "وضعیت",
      dataIndex: "is_active",
      key: "is_active",
      render: (isActive) => (
        <Tag color={isActive ? "green" : "red"}>
          {isActive ? "فعال" : "غیرفعال"}
        </Tag>
      ),
    },
    {
      title: "تاریخ ایجاد",
      dataIndex: "created_at",
      key: "created_at",
      render: (date) => {
        if (!date) return "-";
        return new Date(date).toLocaleDateString("fa-IR");
      },
    },
    {
      title: "عملیات",
      key: "actions",
      width: 120,
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewCustomer(record.id)}
          >
            مشاهده
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Card>
      <div style={{ padding: "24px" }}>
        <div className="flex justify-between mb-10" style={{ marginBottom: "16px" }}>
          <h1 className="text-xl">مدیریت مشتریان</h1>
        </div>

        <div style={{ marginBottom: 16 }}>
          <Input.Search
            placeholder="جستجوی مشتریان..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onSearch={handleSearch}
            style={{ width: "100%", maxWidth: 400 }}
            allowClear
          />
        </div>

        <Table
          columns={columns}
          dataSource={customers}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} از ${total} مشتری`,
            pageSizeOptions: ["10", "25", "50", "100"],
          }}
          onChange={handleTableChange}
          scroll={{ x: true }}
          size="small"
        />
      </div>
    </Card>
  );
};

export default CustomerIndex;
