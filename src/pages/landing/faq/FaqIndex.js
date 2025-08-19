import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Card } from 'antd';
import { Link } from 'react-router-dom';
import { EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';

const FAQList = () => {
  const [faqs, setFaqs] = useState([]);

  useEffect(() => {
    // Fetch FAQs from your API
    // For now, we'll use dummy data
    setFaqs([
      { id: 1, question: 'What is React?', answer: 'React is a JavaScript library for building user interfaces.' },
      { id: 2, question: 'What is Ant Design?', answer: 'Ant Design is a React UI library that contains a set of high quality components and demos for building rich, interactive user interfaces.' },
    ]);
  }, []);

  const columns = [
    {
      title: 'Question',
      dataIndex: 'question',
      key: 'question',
    },
    {
      title: 'Answer',
      dataIndex: 'answer',
      key: 'answer',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (text, record) => (
        <Space size="middle">
          <Link to={`/edit-faq/${record.id}`}>
            <Button type='primary' icon={<EditOutlined />} />
          </Link>
          <Button danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)} />
        </Space>
      ),
    },
  ];

  const handleDelete = (id) => {
    // Implement delete functionality
    console.log('Delete FAQ with id:', id);
  };

  return (
    <Card>
    <div>
      <h1>FAQ List</h1>
      <Link to="/add-faq">
        <Button type="primary" icon={<PlusOutlined />} style={{ marginBottom: 16 }}>
          Add FAQ
        </Button>
      </Link>
      <Table columns={columns} dataSource={faqs} rowKey="id" />
    </div>

    </Card>
  );
};

export default FAQList;