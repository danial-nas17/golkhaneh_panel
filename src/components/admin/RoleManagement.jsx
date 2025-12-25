import React, { useState, useEffect } from 'react';
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
  Tag
} from 'antd';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import roleService from '../../services/roleService';

const RoleManagement = () => {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [form] = Form.useForm();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [rolesData, permissionsData] = await Promise.all([
        roleService.getRoles(),
        roleService.getPermissions()
      ]);
      setRoles(rolesData);
      setPermissions(permissionsData);
    } catch (error) {
      message.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values) => {
    try {
      const roleData = {
        ...values,
        permissions: selectedPermissions
      };
      
      if (editingRole) {
        await roleService.updateRole(editingRole.id, roleData);
        message.success('Role updated successfully');
      } else {
        await roleService.createRole(roleData);
        message.success('Role created successfully');
      }
      setModalVisible(false);
      form.resetFields();
      setSelectedPermissions([]);
      loadData();
    } catch (error) {
      message.error('Operation failed');
    }
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Space>
          {text}
          {record.isSystem && <Tag color="blue">System</Tag>}
        </Space>
      )
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Permissions',
      dataIndex: 'permissions',
      key: 'permissions',
      render: (permissions) => {
        if (permissions === '*') return <Tag color="green">All Permissions</Tag>;
        return <Tag color="blue">{permissions.length} permissions</Tag>;
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            disabled={record.isSystem}
            onClick={() => {
              setEditingRole(record);
              const rolePermissions = record.permissions === '*' ? [] : record.permissions;
              setSelectedPermissions(rolePermissions);
              form.setFieldsValue({
                name: record.name,
                description: record.description
              });
              setModalVisible(true);
            }}
          />
          <Popconfirm
            title="Are you sure you want to delete this role?"
            onConfirm={() => handleDelete(record.id)}
            disabled={record.isSystem}
          >
            <Button 
              icon={<DeleteOutlined />} 
              danger 
              disabled={record.isSystem}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const handleDelete = async (roleId) => {
    try {
      await roleService.deleteRole(roleId);
      message.success('Role deleted successfully');
      loadData();
    } catch (error) {
      message.error('Failed to delete role');
    }
  };

  return (
    <Card title="Role Management">
      <Button
        type="primary"
        icon={<PlusOutlined />}
        onClick={() => {
          setEditingRole(null);
          setSelectedPermissions([]);
          form.resetFields();
          setModalVisible(true);
        }}
        style={{ marginBottom: 16 }}
      >
        Create New Role
      </Button>

      <Table
        columns={columns}
        dataSource={roles}
        rowKey="id"
        loading={loading}
      />

      <Modal
        title={editingRole ? 'Edit Role' : 'Create Role'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setSelectedPermissions([]);
          form.resetFields();
        }}
        footer={null}
        width={800}
      >
        <Form
          form={form}
          onFinish={handleSubmit}
          layout="vertical"
        >
          <Form.Item
            name="name"
            label="Role Name"
            rules={[{ required: true, message: 'Please input role name' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: 'Please input description' }]}
          >
            <Input.TextArea rows={4} />
          </Form.Item>

          <Form.Item
            label="Permissions"
            rules={[{ required: true, message: 'Please select permissions' }]}
          >
            <Transfer
              dataSource={permissions}
              titles={['Available', 'Selected']}
              targetKeys={selectedPermissions}
              onChange={setSelectedPermissions}
              render={item => `${item.name} - ${item.description}`}
              rowKey={item => item.id}
              listStyle={{
                width: 300,
                height: 300,
              }}
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {editingRole ? 'Update' : 'Create'}
              </Button>
              <Button onClick={() => {
                setModalVisible(false);
                setSelectedPermissions([]);
                form.resetFields();
              }}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default RoleManagement;