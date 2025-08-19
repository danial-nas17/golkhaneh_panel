import React, { useState, useEffect } from "react";
import {
  Table,
  Switch,
  Button,
  Modal,
  Form,
  Input,
  message,
  Space,
  Popconfirm,
  Card,
  Pagination,
  Rate,
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  CommentOutlined,
} from "@ant-design/icons";
import api from "../../api";

const { Search } = Input;

const CommentsPage = () => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [replyModalVisible, setReplyModalVisible] = useState(false);
  const [selectedComment, setSelectedComment] = useState(null);
  const [form] = Form.useForm();
  const [searchTerm, setSearchTerm] = useState("");
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const fetchComments = async (page = 1, search = "") => {
    setLoading(true);
    try {
      const response = await api.get("/panel/comment", {
        params: {
          search,
          page,
          per_page: pagination.pageSize,
        },
      });
      
      setComments(response?.data?.data?.comments || []);
      
      setPagination({
        ...pagination,
        current: response?.data?.meta?.current_page || 1,
        total: response?.data?.meta?.total || 0,
      });
    } catch (error) {
      message.error("خطا در دریافت کامنت‌ها");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchComments(pagination.current, searchTerm);
  }, []);

  const handleSearch = (value) => {
    setSearchTerm(value);
    fetchComments(1, value); 
  };

  const handlePaginationChange = (page, pageSize) => {
    setPagination({
      ...pagination,
      current: page,
      pageSize: pageSize,
    });
    fetchComments(page, searchTerm);
  };

  const handleApproveToggle = async (record) => {
    try {
      await api.put(`/panel/comment/${record.id}`, {
        approved: record.approved === 1 ? 0 : 1,
      });
      message.success("وضعیت کامنت با موفقیت تغییر کرد");
      fetchComments(pagination.current, searchTerm);
    } catch (error) {
      message.error("خطا در تغییر وضعیت کامنت");
    }
  };

  const handleReply = async (values) => {
    try {
      await api.post("/panel/comment", {
        comment: values?.reply,
        parent_id: selectedComment?.id,
      });
      message.success("پاسخ با موفقیت ثبت شد");
      setReplyModalVisible(false);
      form.resetFields();
      fetchComments(pagination.current, searchTerm);
    } catch (error) {
      message.error("خطا در ثبت پاسخ");
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/panel/comment/${id}`);
      message.success("کامنت با موفقیت حذف شد");
      fetchComments(pagination.current, searchTerm);
    } catch (error) {
      message.error("خطا در حذف کامنت");
    }
  };

  const processComments = (commentsData) => {
    return commentsData.map(comment => {
      const processedComment = { ...comment };
      
      if (comment.children && comment.children.comments) {
        processedComment.children = processComments(comment.children.comments);
      }
      
      return processedComment;
    });
  };

  const columns = [
    {
      title: "نام",
      dataIndex: "name",
      key: "name",
      render: (name) => name || "بدون نام", 
    },
    {
      title: "ایمیل",
      dataIndex: "email",
      key: "email",
      render: (email) => email || "بدون ایمیل",
    },
    {
      title: "نوع",
      dataIndex: "type",
      key: "type",
      filters: [
        { text: "Product", value: "Product" },
      ],
      onFilter: (value, record) => record?.type === value,
      render: (type) => (
        <span className="px-2 py-1 rounded bg-blue-100">
          {type}
        </span>
      ),
    },
    {
      title: "امتیاز",
      dataIndex: "rate",
      key: "rate",
      render: (rate) => rate ? <Rate disabled defaultValue={rate} /> : "بدون امتیاز",
    },
    {
      title: "متن کامنت",
      dataIndex: "comment",
      key: "comment",
    },
    {
      title: "مربوط به",
      dataIndex: "commentable",
      key: "commentable",
      render: (commentable) => (
        <span>
          {commentable?.title || "بدون عنوان"}
        </span>
      ),
    },
    {
      title: "وضعیت نمایش",
      key: "approved",
      render: (_, record) => (
        <Switch
          checked={record?.approved === 1}
          onChange={() => handleApproveToggle(record)}
        />
      ),
    },
    {
      title: "عملیات",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            icon={<CommentOutlined />}
            onClick={() => {
              setSelectedComment(record);
              setReplyModalVisible(true);
            }}
          >
            پاسخ
          </Button>
          <Popconfirm
            title="آیا از حذف این کامنت اطمینان دارید؟"
            onConfirm={() => handleDelete(record?.id)}
            okText="بله"
            cancelText="خیر"
          >
            <Button danger icon={<DeleteOutlined />}>
              حذف
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card>
      <div className="flex">
        <div className="w-1/2">
          <h1 className="text-2xl mb-6">مدیریت کامنت‌ها</h1>
        </div>

        <div className="w-1/2">
          <Search
            placeholder="جستجو کنید"
            allowClear
            enterButton="جستجو"
            size="middle"
            onSearch={handleSearch}
            style={{ marginBottom: 16 }}
          />
        </div>
      </div>

      <Table
        loading={loading}
        columns={columns}
        dataSource={processComments(comments)}
        rowKey="id"
        pagination={false}
        expandable={{
          defaultExpandAllRows: false,
        }}
      />
      
      <div className="mt-4 flex justify-end">
        <Pagination
          current={pagination.current}
          pageSize={pagination.pageSize}
          total={pagination.total}
          onChange={handlePaginationChange}
          showSizeChanger
          showTotal={(total) => `مجموع ${total} کامنت`}
        />
      </div>

      <Modal
        title="پاسخ به کامنت"
        open={replyModalVisible}
        onCancel={() => {
          setReplyModalVisible(false);
          form.resetFields();
        }}
        footer={null}
      >
        <Form form={form} onFinish={handleReply}>
          <Form.Item
            name="reply"
            rules={[{ required: true, message: "لطفا پاسخ خود را وارد کنید" }]}
          >
            <Input.TextArea rows={4} placeholder="پاسخ خود را بنویسید..." />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              ارسال پاسخ
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default CommentsPage;