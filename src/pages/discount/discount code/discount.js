import React, { useEffect, useState } from "react";
import { Table, Button, Space, Popconfirm, message, Input, Select, Card, Tag } from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import axios from "axios";
import api from "../../../api";
import { useNavigate } from "react-router-dom";

const { Option } = Select;

const DiscountsIndex = () => {
  const [discounts, setDiscounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ search: "", status: "" });
  const navigate = useNavigate();

  useEffect(() => {
    fetchDiscounts();
  }, [filters]);

  const fetchDiscounts = async () => {
    setLoading(true);
    try {
      const response = await api.get("/panel/coupons", {
        params: {
          search: filters?.search,
          is_active: filters?.status,
        },
      });
      setDiscounts(response?.data?.data);
    } catch (error) {
      message.error("خطا در دریافت لیست تخفیف‌ها");
    }
    setLoading(false);
  };

  const deleteDiscount = async (id) => {
    try {
      await api.delete(`/panel/coupons/${id}`);
      message.success("تخفیف با موفقیت حذف شد");
      fetchDiscounts();
    } catch (error) {
      message.error("خطا در حذف تخفیف");
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const columns = [
    // {
    //   title: "نام تخفیف",
    //   dataIndex: ["discount", "name"],
    //   key: "name",
    // },
    {
      title: "کد تخفیف",
      dataIndex: "code",
      key: "code",
    },
    {
      title: "محدودیت استفاده",
      dataIndex: "usage_limit",
      key: "usage_limit",
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
      title: "نوع تخفیف",
      dataIndex: "type",
      key: "type",
      render: (type) => (
        <Tag color={type === "fixed" ? "blue" : "orange"}>
          {type === "fixed" ? "مبلغ ثابت" : "درصدی"}
        </Tag>
      ),
    },
    {
      title: "مقدار تخفیف",
      dataIndex: "value",
      key: "value",
      render: (value, record) => (
        <span>
          {record?.type === "fixed" ? `${value} تومان` : `${value}%`}
        </span>
      ),
    },
    {
      title: "تاریخ شروع",
      dataIndex: "start_date",
      key: "start_date",
    },
    {
      title: "تاریخ پایان",
      dataIndex: "end_date",
      key: "end_date",
    },
    // {
    //   title: "محصولات",
    //   dataIndex: ["discount", "products"],
    //   key: "products",
    //   render: (products) => (
    //     <div>
    //       {products.map((product) => (
    //         <Tag key={product.id}>{product.title}</Tag>
    //       ))}
    //     </div>
    //   ),
    // },
    // {
    //   title: "دسته‌بندی‌ها",
    //   dataIndex: ["discount", "categories"],
    //   key: "categories",
    //   render: (categories) => (
    //     <div>
    //       {categories.map((category) => (
    //         <Tag key={category.id}>{category.title}</Tag>
    //       ))}
    //     </div>
    //   ),
    // },
    // {
    //   title: "برندها",
    //   dataIndex: ["discount", "brands"],
    //   key: "brands",
    //   render: (brands) => (
    //     <div>
    //       {brands.map((brand) => (
    //         <Tag key={brand.id}>{brand.title}</Tag>
    //       ))}
    //     </div>
    //   ),
    // },
    // {
    //   title: "کاربران",
    //   dataIndex: ["discount", "users"],
    //   key: "users",
    //   render: (users) => (
    //     <div>
    //       {users.map((user) => (
    //         <Tag key={user.id}>
    //           {user.name || user.mobile}
    //         </Tag>
    //       ))}
    //     </div>
    //   ),
    // },
    {
      title: "عملیات",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => navigate(`/discounts/edit/${record.id}`)}
          ></Button>
          <Popconfirm
            title="آیا از حذف مطمئن هستید؟"
            onConfirm={() => deleteDiscount(record.id)}
          >
            <Button danger icon={<DeleteOutlined />}></Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card>
      <h1 className="text-xl font-bold mb-10">مدیریت کدهای تخفیف</h1>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
      <Space>
        <Input
          placeholder="جستجو بر اساس نام یا کد تخفیف"
          allowClear
          prefix={<SearchOutlined />}
          value={filters.search}
          onChange={(e) => handleFilterChange("search", e.target.value)}
          style={{ width: 300 }}
        />
        <Select
          placeholder="وضعیت"
          allowClear
          value={filters.status}
          onChange={(value) => handleFilterChange("status", value)}
          style={{ width: 150 }}
        >
          <Option value="">همه</Option>
          <Option value="1">فعال</Option>
          <Option value="0">غیرفعال</Option>
        </Select>
      </Space>
      <Button
        type="primary"
        icon={<PlusOutlined />}
        onClick={() => navigate("/discounts/add")}
      >
        افزودن کد تخفیف جدید
      </Button>
    </div>
      <Table
        columns={columns}
        dataSource={discounts}
        loading={loading}
        rowKey="id"
        scroll={{ x: true }} 
      />
    </Card>
  );
};

export default DiscountsIndex;