import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Space,
  Popconfirm,
  Select,
  message,
  Card,
  Tag,
} from "antd";
import api from "../../api";

const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [currentUserRole, setCurrentUserRole] = useState(null);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const fetchCurrentUserRole = async () => {
    try {
      const response = await api.get("panel/user/info");
      setCurrentUserRole(response?.data?.data?.role);
    } catch (error) {
      message.error("خطا در دریافت نقش کاربر");
      console.error(error);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get("panel/users");
      setUsers(response?.data?.data);
    } catch (error) {
      message.error("خطا در دریافت لیست کاربران");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await api.get("panel/roles");
      setRoles(response?.data?.data);
    } catch (error) {
      message.error("خطا در دریافت نقش‌ها");
      console.error(error);
    }
  };

  useEffect(() => {
    fetchCurrentUserRole();
    fetchUsers();
    fetchRoles();
  }, []);

  const handleEdit = (user) => {
    setEditingUser(user);
    form.setFieldsValue({
      first_name: user?.first_name,
      last_name: user?.last_name,
      company_name: user?.company_name,
      email: user?.email,
      mobile: user?.mobile,
      role: user?.role?.name,
      country: user?.country,
      business_info: user?.business_info,
      status: user?.status,
    });
    setIsModalVisible(true);
  };

  const handleDelete = async (userId) => {
    try {
      await api.delete(`panel/users/${userId}`);
      message.success("کاربر با موفقیت حذف شد");
      fetchUsers();
    } catch (error) {
      message.error("خطا در حذف کاربر");
      console.error(error);
    }
  };

  const removeRoleFromUser = async (userId, roleId) => {
    try {
      await api.post("panel/roles/removeRoleFromUser", {
        user_id: userId,
        role_id: roleId,
      });
      message.success("نقش قبلی کاربر با موفقیت حذف شد");
    } catch (error) {
      message.error("خطا در حذف نقش قبلی کاربر");
      console.error(error);
    }
  };

  const handleSubmit = async (values) => {
    try {
      let res;
      if (editingUser) {
        res = await api.post(`panel/users/${editingUser.id}?_method=PUT`, {
          first_name: values?.first_name,
          last_name: values?.last_name,
          // company_name: values.company_name,
          email: values?.email,
          mobile: values?.mobile,
          // country: values.country,
          // business_info: values.business_info,
          password: values?.password,
          status: values?.status,
        });

        if (res?.data?.data?.id && currentUserRole === "super_admin") {
          if (editingUser?.role) {
            const previousRole = roles.find(
              (role) => role?.name === editingUser?.role?.name
            );
            if (previousRole) {
              await removeRoleFromUser(res?.data?.data?.id, previousRole.id);
            }
          }

          await api.post("panel/roles/assignRoleToUser", {
            user_id: res?.data?.data?.id,
            role_id: values?.role,
          });
        }

        message.success("کاربر با موفقیت به‌روزرسانی شد");
      } else {
        res = await api.post("panel/users", {
          ...values,
          status: values?.status, 
        });

        if (res?.data?.data?.id && currentUserRole === "super_admin") {
          await api.post("panel/roles/assignRoleToUser", {
            user_id: res?.data?.data?.id,
            role_id: values?.role?.id,
          });
        }

        message.success("کاربر با موفقیت ایجاد شد");
      }

      setIsModalVisible(false);
      form.resetFields();
      fetchUsers();
    } catch (error) {
      if (error.response) {
        const { status, data } = error.response;

        if (status === 422 && data?.data?.errors) {
          const errors = Object.values(data.data.errors).flat(); 
          message.error(errors.join(", ")); 
        } else {
          message.error(data?.message || "خطا در ذخیره کاربر");
        }
      } else {
        message.error("یک خطای غیرمنتظره رخ داد");
      }

      console.error("خطا در ذخیره کاربر:", error);
    }
  };

  const columns = [
    {
      title: "شناسه",
      dataIndex: "id",
      key: "id",
    },
    {
      title: "نام",
      dataIndex: "first_name",
      key: "first_name",
    },
    {
      title: "نام خانوادگی",
      dataIndex: "last_name",
      key: "last_name",
    },
    {
      title: "کد معرف",
      dataIndex: "referral_code",
      key: "referral_code",
      render: (referral_code, record) => (
        <>
          <div>{referral_code}</div>
          {record.referred_by && (
            <div style={{ fontSize: "12px", color: "#888" }}>
              ارجاع‌دهنده: {record.referred_by.first_name}{" "}
              {record.referred_by.last_name} ({record.referred_by.mobile})
            </div>
          )}
        </>
      ),
    },

    {
      title: "ایمیل",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "موبایل",
      dataIndex: "mobile",
      key: "mobile",
    },

    {
      title: "نقش",
      dataIndex: ["role", "name"],
      key: "role",
    },
    {
      title: "وضعیت",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        const statusText = status === "approved" ? "تأیید شده" : "تأیید نشده";
        const color = status === "approved" ? "green" : "red";
        return <Tag color={color}>{statusText}</Tag>;
      },
    },
    {
      title: "تاریخ ایجاد",
      dataIndex: "created_at",
      key: "created_at",
    },
    {
      title: "عملیات",
      key: "action",
      render: (_, record) => (
        <Space>
          <Button type="primary" onClick={() => handleEdit(record)}>
            ویرایش
          </Button>
          <Popconfirm
            title="آیا از حذف این کاربر اطمینان دارید؟"
            onConfirm={() => handleDelete(record.id)}
            okText="بله"
            cancelText="خیر"
          >
            <Button type="primary" danger>
              حذف
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card>
      <div style={{ padding: "24px" }}>
        <div
          className="flex justify-between mb-10"
          style={{ marginBottom: "16px" }}
        >
          <h1 className="text-xl">مدیریت کاربران</h1>
          <Button
            type="primary"
            onClick={() => {
              setEditingUser(null);
              form.resetFields();
              setIsModalVisible(true);
            }}
          >
            ایجاد کاربر جدید
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={users}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1200 }}
        />

        <Modal
          title={editingUser ? "ویرایش کاربر" : "ایجاد کاربر جدید"}
          open={isModalVisible}
          onCancel={() => setIsModalVisible(false)}
          footer={null}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            autoComplete="off"
          >
            <Form.Item
              name="first_name"
              label="نام"
              rules={[{ required: true, message: "لطفاً نام را وارد کنید" }]}
            >
              <Input autoComplete="off" />
            </Form.Item>

            <Form.Item
              name="last_name"
              label="نام خانوادگی"
              rules={[
                { required: true, message: "لطفاً نام خانوادگی را وارد کنید" },
              ]}
            >
              <Input autoComplete="off" />
            </Form.Item>

            {/* <Form.Item
      name="company_name"
      label="نام شرکت"
      rules={[{ required: true, message: "لطفاً نام شرکت را وارد کنید" }]}
    >
      <Input autoComplete="off" />
    </Form.Item> */}

            <Form.Item
              name="email"
              label="ایمیل"
              rules={[
                { required: true, message: "لطفاً ایمیل را وارد کنید" },
                { type: "email", message: "فرمت ایمیل نامعتبر است" },
              ]}
            >
              <Input autoComplete="off" />
            </Form.Item>

            <Form.Item
              name="mobile"
              label="موبایل"
              rules={[
                { required: true, message: "لطفاً شماره موبایل را وارد کنید" },
              ]}
            >
              <Input autoComplete="off" />
            </Form.Item>

            {/* <Form.Item
      name="country"
      label="کشور"
      rules={[{ required: true, message: "لطفاً کشور را وارد کنید" }]}
    >
      <Input autoComplete="off" />
    </Form.Item> */}

            {/* <Form.Item
      name="business_info"
      label="اطلاعات کسب‌وکار"
      rules={[{ required: true, message: "لطفاً اطلاعات کسب‌وکار را وارد کنید" }]}
    >
      <Input.TextArea autoComplete="off"/>
    </Form.Item> */}

            {currentUserRole === "super_admin" && (
              <Form.Item name="role" label="نقش">
                <Select allowClear>
                  {roles.map((role) => (
                    <Select.Option key={role.id} value={role.id}>
                      {role.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            )}

            <Form.Item
              name="status"
              label="وضعیت"
              rules={[
                { required: true, message: "لطفاً وضعیت را انتخاب کنید" },
              ]}
            >
              <Select>
                <Select.Option value="approved">تایید شده</Select.Option>
                <Select.Option value="unapproved">تایید نشده</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="password"
              label="رمز عبور"
              rules={[
                !editingUser && {
                  required: true,
                  message: "لطفاً رمز عبور را وارد کنید",
                },
              ]}
            >
              <Input.Password autoComplete="off" />
            </Form.Item>

            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit">
                  {editingUser ? "به‌روزرسانی" : "ایجاد"}
                </Button>
                <Button onClick={() => setIsModalVisible(false)}>لغو</Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </Card>
  );
};

export default UsersPage;
