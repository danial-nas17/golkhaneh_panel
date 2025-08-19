import React, { useState, useEffect, useCallback } from "react";
import {
  Table,
  Button,
  Input,
  Space,
  Modal,
  message,
  Popconfirm,
  Typography,
  Card,
} from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import api from "../../api";
import debounce from "lodash/debounce"; 

const { Title } = Typography;

function Carriers() {
  const [carriers, setCarriers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [searchText, setSearchText] = useState("");
  const navigate = useNavigate();

  const fetchCarriers = async (page = 1, perPage = 10, search = "") => {
    setLoading(true);
    try {
      const response = await api.get("/panel/carriers", {
        params: {
          page,
          per_page: perPage,
          search,
        },
      });
      setCarriers(response.data.data);
      setPagination({
        current: response.data.meta.current_page,
        pageSize: response.data.meta.per_page,
        total: response.data.meta.total,
      });
    } catch (error) {
      message.error("خطا در دریافت اطلاعات حامل‌ها");
      console.error("Error fetching carriers:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCarriers(pagination.current, pagination.pageSize, searchText);
  }, [pagination.current, pagination.pageSize, searchText]);

  const handleTableChange = (pagination) => {
    setPagination(pagination);
  };

  const debouncedSearch = useCallback(
    debounce((value) => {
      setSearchText(value);
      setPagination((prev) => ({ ...prev, current: 1 })); 
    }, 500), 
    []
  );

  const handleSearchChange = (e) => {
    debouncedSearch(e.target.value);
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/panel/carriers/${id}`);
      message.success("حامل با موفقیت حذف شد");
      fetchCarriers(pagination.current, pagination.pageSize, searchText); 
    } catch (error) {
      message.error("خطا در حذف حامل");
      console.error("Error deleting carrier:", error);
    }
  };

  const columns = [
    { title: "عنوان", dataIndex: "title", key: "title" },
    { title: "زمان تحویل", dataIndex: "eta", key: "eta" },
    {
      title: "هزینه",
      dataIndex: "cost",
      key: "cost",
      render: (cost) => `${cost} تومان`,
    },
    {
      title: "حداقل سقف خرید",
      dataIndex: "min_limit",
      key: "min_limit",
      render: (minLimit) => `${minLimit} تومان`,
    },
    {
      title: "حداقل سقف خرید رایگان",
      dataIndex: "free_shipment_limit",
      key: "free_shipment_limit",
      render: (freeLimit) => `${freeLimit} تومان`,
    },
    { title: "ترتیب", dataIndex: "order", key: "order" },
    {
      title: "وضعیت",
      dataIndex: "active",
      key: "active",
      render: (active) => (active === 1 ? "فعال" : "غیرفعال"),
    },
    {
      title: "عملیات",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            type="primary"

            onClick={() => navigate(`/carriers/edit/${record.id}`)}
          >
            
          </Button>
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
<h1 className="text-xl mb-5">لیست حامل ها</h1>
      <div style={{ marginBottom: 16 }}>
        <Space>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate("/carriers/add")}
          >
            افزودن حامل
          </Button>
          <Input
            placeholder="جستجو..."
            allowClear
            onChange={handleSearchChange}
            style={{ width: 300 }}
          />
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={carriers}
        loading={loading}
        pagination={pagination}
        onChange={handleTableChange}
        rowKey="id"
      />
    </Card>
  );
}

export default Carriers;
