import { useState, useEffect } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Transfer,
  Space,
  message,
  Popconfirm,
  Card,
} from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { roleService } from "../../services/roleService";
import { useParams } from "react-router-dom";
import api from "../../api";

const RoleManagement = () => {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const { id } = useParams();

  useEffect(() => {
    fetchRoles();
    fetchPermissions();
  }, []);

  const fetchRoles = async () => {
    try {
      const response = await roleService.getRoles();
      setRoles(response?.data?.data);
    } catch (error) {
      message.error("خطا در بارگذاری نقش‌ها");
    }
  };

  const fetchPermissions = async () => {
    try {
      const response = await roleService.getAllPermissions();
      setPermissions(response?.data?.data?.map(perm => ({ key: perm.name, title: perm.name })));
    } catch (error) {
      message.error("خطا در بارگذاری مجوزها");
    }
  };

  const handleAddEdit = async (id) => {
    setEditingRole(id);

    const res = await api.get(`/panel/roles/${id}`);
    const rolePermissions = res?.data?.data?.permissions?.map(p => p.name) || [];

    form.setFieldsValue({
      name: res?.data?.data?.name,
    });

    setSelectedPermissions(rolePermissions);
    setModalVisible(true);
  };

  useEffect(() => {
    if (!modalVisible) {
      form.resetFields();
      setSelectedPermissions([]);
    }
  }, [modalVisible]);

  const handleDelete = async (roleId) => {
    try {
      await roleService.deleteRole(roleId);
      message.success("نقش با موفقیت حذف شد");
      fetchRoles();
    } catch (error) {
      message.error("خطا در حذف نقش");
    }
  };

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      if (editingRole) {
        const res = await roleService.updateRole(editingRole, values);
        if (res?.data?.data?.id) {
          await roleService.syncPermissions({
            role_id: res?.data?.data?.id,
            permissions: selectedPermissions,
          });
        }
        message.success("نقش با موفقیت به‌روزرسانی شد");
      } else {
        const res = await roleService.createRole(values);
        if (res?.data?.data?.id) {
          await roleService.syncPermissions({
            role_id: res?.data?.data?.id,
            permissions: selectedPermissions,
          });
        }
        message.success("نقش با موفقیت ایجاد شد");
      }
      setModalVisible(false);
      fetchRoles();
    } catch (error) {
      message.error("خطا در ذخیره‌سازی نقش");
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { title: "نام نقش", dataIndex: "name", key: "name" },
    {
      title: "اقدامات",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => handleAddEdit(record.id)}></Button>
          <Popconfirm
            title="آیا مطمئن هستید که می‌خواهید این نقش را حذف کنید؟"
            onConfirm={() => handleDelete(record.id)}
            okText="بله"
            cancelText="خیر"
          >
            <Button danger icon={<DeleteOutlined />}></Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card>
      <div className="p-6">
        <div className="flex justify-between mb-4">
          <h1 className="text-2xl">مدیریت نقش‌ها</h1>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
            افزودن نقش جدید
          </Button>
        </div>

        <Table columns={columns} dataSource={roles} rowKey="id" loading={loading} />

        <Modal title={editingRole ? "ویرایش نقش" : "افزودن نقش جدید"} open={modalVisible} onCancel={() => setModalVisible(false)} footer={null}>
          <Form form={form} onFinish={handleSubmit} layout="vertical">
            <Form.Item name="name" label="نام نقش" rules={[{ required: true, message: "لطفاً نام نقش را وارد کنید" }]}> 
              <Input />
            </Form.Item>

            <Form.Item name="permissions" label="مجوزها">
              <Transfer
                dataSource={permissions}
                targetKeys={selectedPermissions}
                onChange={setSelectedPermissions}
                render={item => item.title}
                oneWay
                showSearch
                titles={["همه مجوزها", "مجوزهای انتخاب‌شده"]}
              />
            </Form.Item>

            <Form.Item className="text-left">
              <Space>
                <Button type="primary" htmlType="submit" loading={loading}>
                  {editingRole ? "به‌روزرسانی" : "ایجاد"}
                </Button>
                <Button onClick={() => setModalVisible(false)}>لغو</Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </Card>
  );
};

export default RoleManagement;
