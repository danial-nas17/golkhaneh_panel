import React, { useEffect, useState } from "react";
import { Table, Modal, Button, Card } from "antd";
import axios from "axios";
import api from "../../api";

const MyNotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalData, setModalData] = useState([]);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await api.get(
          "/panel/user/notifications?per_page=all&page"
        );
        setNotifications(response.data.user_notifications);
      } catch (error) {
        console.error("خطا در دریافت اعلان‌ها:", error);
      }
    };

    fetchNotifications();
  }, []);

  const columns = [
    {
      title: "نام برند",
      dataIndex: ["data", "brand", "title"],
      key: "brand",
    },
    {
      title: "نام کاربر",
      key: "userName",
      render: (_, record) =>
        `${record.data?.imported_by?.first_name} ${record.data?.imported_by?.last_name}`,
    },
    {
      title: "ایمیل",
      dataIndex: ["data", "imported_by", "email"],
      key: "email",
    },
    {
      title: "اطلاعات فایل",
      dataIndex: ["data", "file_info", "fileName"],
      key: "email",
    },
    {
      title: "موفقیت در افزودن",
      dataIndex: ["data", "count_of_products_successfully_added"],
      key: "successCount",
    },
    {
      title: "عدم موفقیت در افزودن",
      dataIndex: ["data", "count_of_products_failed_to_add"],
      key: "failCount",
    },
    {
      title: "عملیات",
      key: "actions",
      render: (_, record) => (
        <Button
          type="primary"
          onClick={() => {
            setModalData(record?.data?.failures || []);
            setModalVisible(true);
          }}
        >
          جزئیات
        </Button>
      ),
    },
  ];

  const modalColumns = [
    {
      title: "ردیف",
      dataIndex: "row",
      key: "row",
    },
    {
      title: "خطاها",
      dataIndex: "errors",
      key: "errors",
      render: (errors) => errors.join(", "),
    },
  ];

  return (
    <Card>
      <h1 className="text-lg  mb-4">اعلان‌های من</h1>
      <Table
        dataSource={notifications}
        columns={columns}
        rowKey={(record) => record.id || record.data.brand.id}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title="جزئیات خطا"
        visible={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
      >
        <Table
          dataSource={modalData}
          columns={modalColumns}
          rowKey="row"
          pagination={false}
        />
      </Modal>
    </Card>
  );
};

export default MyNotificationsPage;