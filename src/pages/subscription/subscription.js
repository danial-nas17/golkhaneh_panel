import React, { useState, useEffect } from "react";
import { Table, Tag, Spin, message, Card } from "antd";
import api from "../../api";

function SubscriptionPage() {
  const [loading, setLoading] = useState(false);
  const [subscriptions, setSubscriptions] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 25,
    total: 0,
  });

  useEffect(() => {
    fetchSubscriptions(pagination.current, pagination.pageSize);
  }, []);

  const fetchSubscriptions = async (page, pageSize) => {
    setLoading(true);
    try {
      const response = await api.get(`/panel/subscription/all?page=${page}&per_page=${pageSize}`);
      const { data } = response.data;

      setSubscriptions(data.data || []);
      setPagination({
        current: data.current_page,
        pageSize: data.per_page,
        total: data.total,
      });
    } catch (error) {
      message.error("خطا در دریافت اشتراک‌ها");
      console.error("خطا:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTableChange = (newPagination) => {
    fetchSubscriptions(newPagination.current, newPagination.pageSize);
  };

  const columns = [
    {
      title: "شناسه",
      dataIndex: "id",
      key: "id",
    },
    {
      title: "ایمیل",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "وضعیت",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag color={status === "Active" ? "green" : "red"}>{status === "Active" ? "فعال" : "غیرفعال"}</Tag>
      ),
    },
    {
      title: "دیده شده",
      dataIndex: "seen",
      key: "seen",
      render: (seen) => (seen ? "بله" : "خیر"),
    },
    {
      title: "تاریخ ایجاد",
      dataIndex: "created_at",
      key: "created_at",
    },
    {
      title: "آخرین به‌روزرسانی",
      dataIndex: "updated_at",
      key: "updated_at",
    },
  ];

  return (
    <Card title="لیست اشتراک‌ها">
      <Spin spinning={loading}>
        <Table
          dataSource={subscriptions}
          columns={columns}
          rowKey="id"
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
          }}
          onChange={handleTableChange}
        />
      </Spin>
    </Card>
  );
}

export default SubscriptionPage;
