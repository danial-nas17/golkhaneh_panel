import React, { useState, useEffect } from "react";
import { Table, Button, Space, message, Popconfirm, Card, Input, Select, Tag } from "antd";
import { useNavigate } from "react-router-dom";
import api from "../../api";
import { debounce } from "lodash";

const { Option } = Select;

const TicketsIndex = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 25, total: 0 });
  const [filters, setFilters] = useState({
    department: null,
    status: null,
    priority: null,
    search: "",
  });
  const navigate = useNavigate();

  const fetchTickets = async (page = 1, filters = {}) => {
    setLoading(true);
    try {
      const params = {
        page,
        per_page: pagination.pageSize,
        ...filters,
      };
      const response = await api.get("/panel/ticket", { params });
      setTickets(response?.data?.data);
      setPagination({
        current: response?.data?.meta?.current_page,
        pageSize: response?.data?.meta?.per_page,
        total: response?.data?.meta?.total,
      });
    } catch (error) {
      message.error("خطا در دریافت تیکت‌ها");
      console.error("خطا در دریافت تیکت‌ها:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets(1, filters);
  }, [filters]);

  const handleSearch = debounce((value) => {
    setFilters((prevFilters) => ({ ...prevFilters, search: value }));
  }, 300);

  const handleFilterChange = (key, value) => {
    setFilters((prevFilters) => ({ ...prevFilters, [key]: value }));
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      await api.post(`/panel/ticket/${id}`, { _method: "PUT", status });
      message.success("وضعیت تیکت با موفقیت به‌روزرسانی شد.");
      fetchTickets(pagination.current, filters);
    } catch (error) {
      message.error("خطا در به‌روزرسانی وضعیت تیکت");
      console.error("خطا در به‌روزرسانی وضعیت تیکت:", error);
    }
  };

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
    },
    {
        title: "کاربر",
        dataIndex: "user",
        key: "user",
        render: (user) => (
          <>
            <p><strong>نام:</strong> {user.first_name} {user.last_name}</p>
            <p><strong>ایمیل:</strong> {user.email}</p>
            <p><strong>موبایل:</strong> {user.mobile}</p>
          </>
        ),
      },
    {
      title: "موضوع",
      dataIndex: "subject",
      key: "subject",
    },

    {
        title: "بخش مربوطه",
        dataIndex: "department",
        key: "department",
      },
    
    {
      title: "اولویت",
      dataIndex: "priority",
      key: "priority",
      render: (priority) => {
        let color = "";
        switch (priority) {
          case "low":
            color = "green";
            break;
          case "medium":
            color = "orange";
            break;
          case "high":
            color = "red";
            break;
          default:
            color = "gray";
        }
        return <Tag color={color}>{priority}</Tag>;
      },
    },
    {
      title: "وضعیت",
      dataIndex: "status",
      key: "status",
      render: (status, record) => (
        <Select
          defaultValue={status}
          style={{ width: 120 }}
          onChange={(value) => handleStatusUpdate(record.id, value)}
        >
          <Option value="open">باز</Option>
          <Option value="admin_answer">پاسخ ادمین</Option>
          <Option value="user_answer">پاسخ کاربر</Option>
          <Option value="completed">تکمیل شده</Option>
        </Select>
      ),
    },
    // {
    //   title: "عملیات",
    //   key: "actions",
    //   render: (_, record) => (
    //     <Space>
    //       <Button type="primary" onClick={() => navigate(`/tickets/${record.id}`)}>
    //         جزئیات
    //       </Button>
    //       <Popconfirm
    //         title="آیا از حذف این تیکت مطمئن هستید؟"
    //         onConfirm={() => handleDelete(record.id)}
    //         okText="بله"
    //         cancelText="خیر"
    //       >
    //         <Button danger>حذف</Button>
    //       </Popconfirm>
    //     </Space>
    //   ),
    // },
  ];

  return (
    <Card title="تیکت‌ها">
      <div className="mb-4 flex justify-between items-center">
        <div>
          <Input
            placeholder="جستجو..."
            onChange={(e) => handleSearch(e.target.value)}
            style={{ width: 200, marginRight: 8 }}
          />
         
          <Select
            placeholder="وضعیت"
            allowClear
            style={{ width: 120, marginRight: 8 }}
            onChange={(value) => handleFilterChange("status", value)}
          >
            <Option value="open">باز</Option>
            <Option value="admin_answer">پاسخ ادمین</Option>
            <Option value="user_answer">پاسخ کاربر</Option>
            <Option value="completed">تکمیل شده</Option>
          </Select>
          <Select
          className="mr-4"
            placeholder="اولویت"
            allowClear
            style={{ width: 120 }}
            onChange={(value) => handleFilterChange("priority", value)}
          >
            <Option value="low">کم</Option>
            <Option value="medium">متوسط</Option>
            <Option value="high">بالا</Option>
          </Select>
        </div>
        
      </div>
      <Table
        columns={columns}
        dataSource={tickets}
        loading={loading}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: pagination.total,
          onChange: (page) => fetchTickets(page, filters),
        }}
        rowKey="id"
      />
    </Card>
  );
};

export default TicketsIndex;