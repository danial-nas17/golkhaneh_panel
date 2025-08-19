import React, { useEffect, useState } from "react";
import { Table, Modal, Button, Card } from "antd";
import axios from "axios";
import api from "../../api";

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalData, setModalData] = useState([]);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await api.get(
          "/panel/notifications?per_page=all&page"
        );
        setNotifications(response.data.notifications);
      } catch (error) {
        console.error("Error fetching notifications:", error);
      }
    };

    fetchNotifications();
  }, []);

  const columns = [
    {
      title: "Brand Name",
      dataIndex: ["data", "brand", "title"],
      key: "brand",
    },
    {
      title: "User Name",
      key: "userName",
      render: (_, record) =>
        `${record.data?.imported_by?.first_name} ${record.data?.imported_by?.last_name}`,
    },
    {
      title: "Email",
      dataIndex: ["data", "imported_by", "email"],
      key: "email",
    },
    {
      title: "File Info",
      dataIndex: ["data", "file_info", "fileName"],
      key: "email",
    },
    {
      title: "Successfully Added",
      dataIndex: ["data", "count_of_products_successfully_added"],
      key: "successCount",
    },
    {
      title: "Failed to Add",
      dataIndex: ["data", "count_of_products_failed_to_add"],
      key: "failCount",
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Button
          type="primary"
          onClick={() => {
            setModalData(record?.data?.failures || []);
            setModalVisible(true);
          }}
        >
          Details
        </Button>
      ),
    },
  ];

  const modalColumns = [
    {
      title: "Row",
      dataIndex: "row",
      key: "row",
    },
    {
      title: "Errors",
      dataIndex: "errors",
      key: "errors",
      render: (errors) => errors.join(", "),
    },
  ];

  return (
    <Card>
      <h1 className="text-lg font-bold mb-4">Notifications</h1>
      <Table
        dataSource={notifications}
        columns={columns}
        rowKey={(record) => record.id || record.data.brand.id}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title="Failure Details"
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

export default NotificationsPage;
