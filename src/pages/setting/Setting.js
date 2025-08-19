import React, { useState, useEffect } from 'react';
import { 
  Table, 
  Button, 
  Modal, 
  Form, 
  Input, 
  Select, 
  Space, 
  Upload,
  Image,
  Popconfirm,
  message, 
  Card
} from 'antd';
import { 
  DeleteOutlined, 
  PlusOutlined,
  UploadOutlined,
  EditOutlined 
} from '@ant-design/icons';
import api from "../../api";
import TinyEditor from '../../components/Editor'; 

const { Option } = Select;

const SettingList = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editorContent, setEditorContent] = useState('');
  const [currentFileUrl, setCurrentFileUrl] = useState('');
  const [form] = Form.useForm();
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 25,
    total: 0
  });

  const fetchSettings = async (page = 1, pageSize = 25) => {
    setLoading(true);
    try {
      const response = await api.get(`/panel/setting?page=${page}&per_page=${pageSize}`);
      setData(response.data.data);
      setPagination({
        current: response?.data?.meta?.current_page,
        pageSize: response?.data?.meta?.per_page,
        total: response?.data?.meta?.total
      });
    } catch (error) {
      message.error('خطا در بارگیری داده‌ها');
      console.error('خطا در بارگیری تنظیمات:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSettingById = async (id) => {
    try {
      const response = await api.get(`/panel/setting/${id}`);
      return response?.data?.data;
    } catch (error) {
      message.error('خطا در بارگیری جزئیات تنظیمات');
      console.error('خطا در بارگیری جزئیات تنظیمات:', error);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleTableChange = (pagination) => {
    fetchSettings(pagination.current, pagination.pageSize);
  };

  const showModal = async (record = null) => {
    form.resetFields();
    setEditorContent('');
    setCurrentFileUrl('');
    
    if (record) {
      setEditingId(record.id);
      const settingData = await fetchSettingById(record.id);
      
      form.setFieldsValue({
        key: settingData.key,
        type: settingData.type,
        value: settingData.type !== 'file' && settingData.type !== 'text' ? settingData.value : undefined
      });
      
      if (settingData.type === 'text') {
        setEditorContent(settingData.value);
      } else if (settingData.type === 'file') {
        setCurrentFileUrl(settingData.value);
      }
    } else {
      setEditingId(null);
    }
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/panel/setting/${id}`);
      message.success('تنظیمات با موفقیت حذف شد');
      fetchSettings(pagination.current);
    } catch (error) {
      message.error('خطا در حذف تنظیمات');
      console.error('خطا در حذف تنظیمات:', error);
    }
  };

  const handleEditorChange = (content) => {
    setEditorContent(content);
  };

  const handleSubmit = async (values) => {
    try {
      const formData = new FormData();
      formData.append('key', values.key);
      
      const selectedType = values.type;
      formData.append('type', selectedType);
      
      if (selectedType === 'file') {
        const file = values.value?.[0]?.originFileObj;
        if (file) {
          formData.append('value', file);
        } else if (!editingId) {
          message.error('لطفاً یک فایل انتخاب کنید');
          return;
        }
      } else if (selectedType === 'text') {
        formData.append('value', editorContent);
      } else {
        formData.append('value', values.value);
      }

      if (editingId) {
        formData.append('_method', 'PUT');
        await api.post(`/panel/setting/${editingId}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        message.success('تنظیمات با موفقیت به روز شد');
      } else {
        await api.post('/panel/setting', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        message.success('تنظیمات با موفقیت اضافه شد');
      }
      
      setModalVisible(false);
      fetchSettings();
    } catch (error) {
      message.error(editingId ? 'خطا در به روز رسانی تنظیمات' : 'خطا در افزودن تنظیمات');
      console.error('خطا در ارسال تنظیمات:', error);
    }
  };

  const columns = [
    {
      title: 'شناسه',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: 'کلید',
      dataIndex: 'key',
      key: 'key',
    },
    {
      title: 'نوع',
      dataIndex: 'type',
      key: 'type',
      render: (type) => {
        const typeTranslations = {
          'file': 'فایل',
          'text': 'ادیتور',
          'string': 'رشته'
        };
        return typeTranslations[type] || type;
      }
    },
    {
      title: 'مقدار',
      dataIndex: 'value',
      key: 'value',
      render: (value, record) => {
        if (record.type === 'file') {
          return <Image 
            src={value} 
            alt={record.key}
            width={100}
            style={{ objectFit: 'cover' }}
          />;
        } else if (record.type === 'text' || record.type === 'string') {
          return '-'; // نمایش خط فاصله برای نوع text و string
        }
        return value;
      }
    },
    {
      title: 'تاریخ ایجاد',
      dataIndex: 'created_at',
      key: 'created_at',
    },
    {
      title: 'عملیات',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button 
            type="primary" 
            icon={<EditOutlined />} 
            onClick={() => showModal(record)} 
          />
          <Popconfirm
            title="آیا مطمئن هستید که می‌خواهید این تنظیمات را حذف کنید؟"
            onConfirm={() => handleDelete(record.id)}
            okText="بله"
            cancelText="خیر"
          >
            <Button type="primary" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card title="تنظیمات">
      <div style={{ padding: 12 }}>
        <div style={{ marginBottom: 16 }}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => showModal()}
          >
            افزودن تنظیمات جدید
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          pagination={pagination}
          onChange={handleTableChange}
        />

        <Modal
          title={editingId ? "ویرایش تنظیمات" : "افزودن تنظیمات جدید"}
          open={modalVisible}
          onCancel={() => setModalVisible(false)}
          footer={null}
          width={1200}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
          >
            <Form.Item
              name="key"
              label="کلید"
              rules={[{ required: true, message: 'لطفاً کلید را وارد کنید' }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              name="type"
              label="نوع"
              rules={[{ required: true, message: 'لطفاً نوع را انتخاب کنید' }]}
            >
              <Select>
                <Option value="string">رشته</Option>
                <Option value="text">ادیتور </Option>
                <Option value="file">فایل</Option>
              </Select>
            </Form.Item>

            <Form.Item
              noStyle
              shouldUpdate={(prevValues, currentValues) => prevValues.type !== currentValues.type}
            >
              {({ getFieldValue }) => {
                const type = getFieldValue('type');
                
                if (type === 'file') {
                  return (
                    <>
                      {currentFileUrl && (
                        <div style={{ marginBottom: 16 }}>
                          <p>تصویر فعلی:</p>
                          <Image
                            src={currentFileUrl}
                            alt="فایل فعلی"
                            width={200}
                            style={{ objectFit: 'cover' }}
                          />
                        </div>
                      )}
                      <Form.Item
                        name="value"
                        label="فایل"
                        rules={[{ required: !editingId, message: 'لطفاً یک فایل انتخاب کنید' }]}
                        getValueFromEvent={(e) => {
                          if (Array.isArray(e)) {
                            return e;
                          }
                          return e?.fileList;
                        }}
                      >
                        <Upload
                          maxCount={1}
                          beforeUpload={() => false}
                          listType="picture"
                          accept="image/*"
                        >
                          <Button icon={<UploadOutlined />}>
                            {editingId ? 'تغییر فایل' : 'انتخاب فایل'}
                          </Button>
                        </Upload>
                      </Form.Item>
                    </>
                  );
                } else if (type === 'text') {
                  return (
                    <Form.Item
                      label="محتوا"
                      validateTrigger={["onChange", "onBlur"]}
                      rules={[
                        {
                          required: true,
                          validator: () => {
                            if (!editorContent) {
                              return Promise.reject("لطفاً محتوا را وارد کنید.");
                            }
                            return Promise.resolve();
                          },
                        },
                      ]}
                    >
                      <TinyEditor
                        content={editorContent}
                        onEditorChange={handleEditorChange}
                        model={"Setting"}
                        height={300}
                      />
                    </Form.Item>
                  );
                } else {
                  return (
                    <Form.Item
                      name="value"
                      label="مقدار"
                      rules={[{ required: true, message: 'لطفاً مقدار را وارد کنید' }]}
                    >
                      <Input />
                    </Form.Item>
                  );
                }
              }}
            </Form.Item>

            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit">
                  {editingId ? 'به روز رسانی' : 'ارسال'}
                </Button>
                <Button onClick={() => setModalVisible(false)}>
                  انصراف
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </Card>
  );
};

export default SettingList;