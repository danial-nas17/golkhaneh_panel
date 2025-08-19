import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Modal, message, Spin } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../../../api';

const FaqIndex = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 7,
    total: 0,
  });
  
  const navigate = useNavigate();

  const fetchFaqs = async (page = 1, pageSize = 7) => {
    setLoading(true);
    try {
      const response = await api.get(`/panel/faq?page=${page}&per_page=${pageSize}&faqable_type=Plan`);
      setData(response.data.data);
      setPagination({
        current: response.data.meta.current_page,
        pageSize: response.data.meta.per_page,
        total: response.data.meta.total,
      });
    } catch (error) {
      message.error('خطا در دریافت اطلاعات');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchFaqs();
  }, []);

  const handleTableChange = (pagination) => {
    fetchFaqs(pagination.current, pagination.pageSize);
  };

  const handleDelete = async (id) => {
    Modal.confirm({
      title: 'آیا از حذف این سوال اطمینان دارید؟',
      content: 'با حذف این سوال، تمام اطلاعات مربوط به آن حذف خواهد شد.',
      okText: 'بله',
      cancelText: 'خیر',
      onOk: async () => {
        try {
          await api.delete(`/panel/faq/${id}`);
          message.success('سوال با موفقیت حذف شد');
          fetchFaqs(pagination.current);
        } catch (error) {
          message.error('خطا در حذف سوال');
        }
      },
    });
  };

  const columns = [
    {
      title: 'شناسه',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: 'سوال',
      dataIndex: 'question',
      key: 'question',
    },
    {
      title: 'پاسخ',
      dataIndex: 'answer',
      key: 'answer',
      render: (text) => (
        <div style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {text}
        </div>
      ),
    },
    {
      title: 'عملیات',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button 
            type="primary" 
            icon={<EditOutlined />}
            onClick={() => navigate(`/faq/plan/edit/${record.id}`)}
          >
            ویرایش
          </Button>
          <Button 
            type="primary" 
            danger 
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
          >
            حذف
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 className='mb-10 text-xl'> سوالات متداول برنامه‌ها</h2>
        <Button 
          type="primary" 
          icon={<PlusOutlined />}
          onClick={() => navigate('/faq/plan/add')}
        >
          افزودن سوال جدید
        </Button>
      </div>
      
      <Spin spinning={loading}>
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `مجموع ${total} مورد`,
          }}
          onChange={handleTableChange}
        />
      </Spin>
    </div>
  );
};

export default FaqIndex;