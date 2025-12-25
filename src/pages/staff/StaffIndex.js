import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Space,
  Popconfirm,
  message,
  Card,
  Tag,
  Select,
} from "antd";
import api from "../../api";
import { usePermissions } from "../../hook/usePermissions";

const StaffIndex = () => {
  const [staff, setStaff] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const { userRole, userPermissions } = usePermissions();

  // Debug: Log user role and permissions
  console.log('StaffIndex - userRole:', userRole);
  console.log('StaffIndex - userPermissions:', userPermissions);
  
  // Also check localStorage directly
  const userFromStorage = localStorage.getItem('user');
  if (userFromStorage) {
    const parsedUser = JSON.parse(userFromStorage);
    console.log('StaffIndex - user from localStorage:', parsedUser);
  }


  const fetchStaff = async () => {
    try {
      setLoading(true);
      const response = await api.get("panel/store-staff?includes[]=manager");
      setStaff(response?.data?.data || []);
    } catch (error) {
      message.error("خطا در دریافت لیست پرسنل");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleEdit = (record) => {
    setEditingStaff(record);
    form.setFieldsValue({
      first_name: record?.first_name,
      last_name: record?.last_name,
      email: record?.email,
      mobile: record?.mobile,
      status: record?.status,
      company_name: record?.company_name,
      business_info: record?.business_info,
      country: record?.country,
      address: record?.address,
      password: undefined, // Don't populate password
    });
    setIsModalVisible(true);
  };

  const handleDelete = async (staffId) => {
    try {
      await api.delete(`panel/store-staff/${staffId}`);
      message.success("پرسنل با موفقیت حذف شد");
      fetchStaff();
    } catch (error) {
      message.error("خطا در حذف پرسنل");
      console.error(error);
    }
  };

  const handleSubmit = async (values) => {
    try {
      if (editingStaff) {
        // Update
        await api.post(`panel/store-staff/${editingStaff.id}?_method=PUT`, {
          first_name: values?.first_name,
          last_name: values?.last_name,
          email: values?.email,
          mobile: values?.mobile,
          status: values?.status,
          company_name: values?.company_name,
          business_info: values?.business_info,
          country: values?.country,
          address: values?.address,
          password: values?.password, // Optional
        });
        message.success("پرسنل با موفقیت به‌روزرسانی شد");
      } else {
        // Prevent super admin from creating new staff
        if (userRole && (
          userRole.toLowerCase() === 'super_admin' || 
          userRole.toLowerCase() === 'super admin' ||
          userRole === 'Super Admin' ||
          userRole === 'SUPER_ADMIN' ||
          userRole.toLowerCase().includes('super')
        )) {
          console.log('Blocking super admin from creating staff, role:', userRole);
          message.error("کاربران سوپر ادمین نمی‌توانند پرسنل جدید ایجاد کنند");
          return;
        }
        
        // Create
        await api.post("panel/store-staff", {
          first_name: values?.first_name,
          last_name: values?.last_name,
          email: values?.email,
          mobile: values?.mobile,
          status: values?.status,
          password: values?.password,
          company_name: values?.company_name,
          business_info: values?.business_info,
          country: values?.country,
          address: values?.address,
        });
        message.success("پرسنل با موفقیت ایجاد شد");
      }

      setIsModalVisible(false);
      form.resetFields();
      fetchStaff();
    } catch (error) {
      if (error.response) {
        const { status, data } = error.response;
        if (status === 422 && data?.data?.errors) {
          const errors = Object.values(data.data.errors).flat();
          message.error(errors.join(", "));
        } else {
          message.error(data?.message || "خطا در ذخیره پرسنل");
        }
      } else {
        message.error("یک خطای غیرمنتظره رخ داد");
      }
      console.error("خطا در ذخیره پرسنل:", error);
    }
  };

  const isCustomerRole = (userRole || "").toString().toLowerCase() === "customer";

  const managerColumn = {
    title: "مدیر",
    dataIndex: "manager",
    key: "manager",
    render: (manager) => {
      if (!manager) return "-";
      const fullName = [manager.first_name, manager.last_name].filter(Boolean).join(" ");
      return fullName || manager.email || manager.mobile || "-";
    },
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
      title: "ایمیل",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "موبایل",
      dataIndex: "mobile",
      key: "mobile",
    },
    // Manager column appears only when current user's role is not customer
    ...(!isCustomerRole ? [managerColumn] : []),
    
    {
      title: "وضعیت",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        const statusText = status === "active" ? "فعال" : "غیرفعال";
        const color = status === "active" ? "green" : "red";
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
            title="آیا از حذف این پرسنل اطمینان دارید؟"
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
        <div className="flex justify-between mb-10" style={{ marginBottom: "16px" }}>
          <h1 className="text-xl">مدیریت پرسنل</h1>
          {/* Debug: Show role check result */}
          {console.log('StaffIndex - Should show button?', 
            userRole !== 'super_admin' && 
            userRole !== 'Super Admin' && 
            userRole && 
            !userRole.toLowerCase().includes('super') &&
            userRole.toLowerCase() !== 'super_admin'
          )}
          {userRole && !(
            userRole.toLowerCase() === 'super_admin' || 
            userRole.toLowerCase() === 'super admin' ||
            userRole === 'Super Admin' ||
            userRole === 'SUPER_ADMIN' ||
            userRole.toLowerCase().includes('super')
          ) && (
            <Button
              type="primary"
              onClick={() => {
                setEditingStaff(null);
                form.resetFields();
                setIsModalVisible(true);
              }}
            >
              ایجاد پرسنل جدید
            </Button>
          )}
        </div>

        <Table
          columns={columns}
          dataSource={staff}
          rowKey="id"
          loading={loading}
          size="small"
          scroll={{ x: 1200 }}
        />

        <Modal
          title={editingStaff ? "ویرایش پرسنل" : "ایجاد پرسنل جدید"}
          open={isModalVisible}
          onCancel={() => setIsModalVisible(false)}
          footer={null}
          destroyOnClose
          width={600}
        >
          <Form form={form} layout="vertical" onFinish={handleSubmit} autoComplete="off">
            <Form.Item
              name="first_name"
              label="نام"
              rules={[{ required: true, message: "لطفاً نام را وارد کنید" }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              name="last_name"
              label="نام خانوادگی"
              rules={[{ required: true, message: "لطفاً نام خانوادگی را وارد کنید" }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              name="email"
              label="ایمیل"
              rules={[
                { required: true, message: "لطفاً ایمیل را وارد کنید" },
                { type: "email", message: "فرمت ایمیل نامعتبر است" },
              ]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              name="mobile"
              label="موبایل"
              rules={[{ required: true, message: "لطفاً شماره موبایل را وارد کنید" }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              name="status"
              label="وضعیت"
              rules={[{ required: true, message: "لطفاً وضعیت را انتخاب کنید" }]}
            >
              <Select placeholder="انتخاب وضعیت">
                <Select.Option value="active">فعال</Select.Option>
                <Select.Option value="inactive">غیرفعال</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="password"
              label="رمز عبور"
              rules={
                editingStaff
                  ? [] // Optional for edit
                  : [{ required: true, message: "لطفاً رمز عبور را وارد کنید" }]
              }
            >
              <Input.Password />
            </Form.Item>

            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit">
                  {editingStaff ? "به‌روزرسانی" : "ایجاد"}
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

export default StaffIndex;