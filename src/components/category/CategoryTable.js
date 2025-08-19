import React from "react";
import { Table, Space, Button, Image } from "antd";
import { Link } from "react-router-dom";
import { DeleteOutlined, EditOutlined } from "@ant-design/icons";

const CategoryTable = ({ categories, loading, onDelete }) => {
  const columns = [
    {
      title: "Id",
      dataIndex: "id",
      key: "id",
    },
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
    },
    {
      title: " Thumb",
      dataIndex: "thumb",
      key: "image",
      render: (text) => <Image src={text} alt="Cover" width={100} />,
    },
    {
      title: "Slug",
      dataIndex: "slug",
      key: "slug",
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space size="middle">
          <Link to={`/categories/edit/${record.id}`}>
            <Button icon={<EditOutlined />} type="primary">
              
            </Button>
          </Link>
          <Button icon={<DeleteOutlined />} onClick={() => onDelete(record.id)} danger>
            
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={categories}
      loading={loading}
      rowKey="id"
    />
  );
};

export default CategoryTable;
