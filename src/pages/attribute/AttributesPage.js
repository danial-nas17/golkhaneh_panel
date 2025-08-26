import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Popconfirm,
  Select,
  Tabs,
  Card,
  Space,
  message,
  Upload,
  Image,
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  SearchOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import api from "../../api";

const { TabPane } = Tabs;
const { Option } = Select;

const AttributesPage = () => {
  const [attributes, setAttributes] = useState([]);
  const [selectedAttributeValues, setSelectedAttributeValues] = useState([]);
  const [loading, setLoading] = useState(false);
  const [valuesLoading, setValuesLoading] = useState(false);
  const [attributeModal, setAttributeModal] = useState(false);
  const [valueModal, setValueModal] = useState(false);
  const [selectedAttribute, setSelectedAttribute] = useState(null);
  const [form] = Form.useForm();
  const [valueForm] = Form.useForm();
  const [valueSearch, setValueSearch] = useState("");
  const [fileList, setFileList] = useState([]);

  const fetchAttributes = async () => {
    setLoading(true);
    try {
      const response = await api.get("/panel/attribute");
      setAttributes(response.data.data);
    } catch (error) {
      console.error("خطا در دریافت ویژگی‌ها:", error);
    }
    setLoading(false);
  };

  const fetchAttributeValues = async (attributeId, search = "") => {
    setValuesLoading(true);
    try {
      const response = await api.get(
        `/panel/attribute/${attributeId}?includes[]=values&search=${search}`
      );
      setSelectedAttributeValues(response.data.data.values);
    } catch (error) {
      console.error("خطا در دریافت مقادیر ویژگی:", error);
    }
    setValuesLoading(false);
  };

  useEffect(() => {
    fetchAttributes();
  }, []);

  const handleAttributeChange = (attributeId) => {
    const attribute = attributes.find((attr) => attr.id === attributeId);
    setSelectedAttribute(attribute);
    fetchAttributeValues(attributeId);
  };

  const handleValueSearchChange = (e) => {
    const searchTerm = e.target.value;
    setValueSearch(searchTerm);
    if (selectedAttribute) {
      fetchAttributeValues(selectedAttribute.id, searchTerm);
    }
  };

  const handleAddAttribute = async (values) => {
    try {
      await api.post("/panel/attribute", values);
      fetchAttributes();
      setAttributeModal(false);
      form.resetFields();
    } catch (error) {
      console.error("خطا در افزودن ویژگی:", error);
    }
  };

  const handleEditAttribute = async (values) => {
    try {
      await api.put(`/panel/attribute/${selectedAttribute.id}`, values);
      fetchAttributes();
      setAttributeModal(false);
      form.resetFields();
    } catch (error) {
      console.error("خطا در ویرایش ویژگی:", error);
    }
  };

  const handleDeleteAttribute = async (id) => {
    try {
      await api.delete(`/panel/attribute/${id}`);
      fetchAttributes();
    } catch (error) {
      console.error("خطا در حذف ویژگی:", error);
    }
  };

  const handleAddValue = async (values) => {
    try {
      const formData = new FormData();
      formData.append("attribute_id", selectedAttribute.id);
      formData.append("value", values.value);
      formData.append("order", values.order ? values.order : "");
      if (fileList.length > 0) {
        formData.append("file", fileList[0].originFileObj);
      }

      await api.post("/panel/attribute_value", formData);
      fetchAttributeValues(selectedAttribute.id);
      setValueModal(false);
      valueForm.resetFields();
      setFileList([]);
    } catch (error) {
      console.error("خطا در افزودن مقدار:", error);
    }
  };

  const handleEditValue = async () => {
    try {
      const formValues = valueForm.getFieldsValue();
      if (!formValues.id) {
        throw new Error("شناسه مقدار موجود نیست");
      }

      const formData = new FormData();
      formData.append("attribute_id", selectedAttribute.id);
      formData.append("value", formValues.value);
      formData.append("order", formValues.order);
      if (fileList.length > 0) {
        formData.append("file", fileList[0].originFileObj);
      }

      await api.post(
        `/panel/attribute_value/${formValues.id}?includes[]=attribute&_method=PUT`,
        formData
      );

      message.success("مقدار با موفقیت به‌روزرسانی شد");
      fetchAttributeValues(selectedAttribute.id);
      setValueModal(false);
      valueForm.resetFields();
      setFileList([]);
    } catch (error) {
      console.error("خطا در ویرایش مقدار:", error);

      if (error.response) {
        const { status, data } = error.response;
        if (status === 422 && data?.data?.errors) {
          const errors = Object.values(data.data.errors).flat();
          message.error(errors.join(", "));
        } else {
          message.error(data?.message || "خطا در ویرایش مقدار");
        }
      } else {
        message.error("یک خطای غیرمنتظره رخ داد");
      }
    }
  };

  const handleDeleteValue = async (valueId) => {
    try {
      await api.delete(`/panel/attribute_value/${valueId}`);
      fetchAttributeValues(selectedAttribute.id);
    } catch (error) {
      console.error("خطا در حذف مقدار:", error);
    }
  };

  const attributeColumns = [
    {
      title: "کلید",
      dataIndex: "key",
      key: "key",
    },
    {
      title: "ترتیب",
      dataIndex: "order",
      key: "order",
    },
    {
      title: "نوع",
      dataIndex: "type",
      key: "type",
      render: (type) => (type === "product" ? "محصول" : "تنوع"),
    },
    {
      title: "عملیات",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => {
              setSelectedAttribute(record);
              form.setFieldsValue({
                ...record,
                type: record.type || "product",
              });
              setAttributeModal(true);
            }}
          />
          <Popconfirm
            title="آیا از حذف این ویژگی اطمینان دارید؟"
            onConfirm={() => handleDeleteAttribute(record.id)}
          >
            <Button type="primary" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const valueColumns = [
    {
      title: "مقدار",
      dataIndex: "value",
      key: "value",
    },
    {
      title: "ترتیب",
      dataIndex: "order",
      key: "order",
    },
    {
      title: "تاریخ ایجاد",
      dataIndex: "created_at",
      key: "created_at",
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      title: "تصویر",
      dataIndex: "image",
      key: "image",
      render: (icon) =>
        icon ? (
          <Image src={icon} alt="تصویر دسته‌بندی" width={100} preview={false} />
        ) : (
          "ـ"
        ),
    },
    {
      title: "عملیات",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => {
              valueForm.setFieldsValue({
                id: record.id,
                value: record.value,
                order: record.order,
              });
              setValueModal(true);
            }}
          />
          <Popconfirm
            title="آیا از حذف این مقدار اطمینان دارید؟"
            onConfirm={() => handleDeleteValue(record.id)}
          >
            <Button type="primary" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const uploadProps = {
    beforeUpload: (file) => {
      const isImage = file.type.startsWith("image/");
      if (!isImage) {
        message.error(`${file.name} فایل تصویر نیست`);
        return Upload.LIST_IGNORE;
      }
      return false;
    },
    onChange: ({ fileList }) => {
      setFileList(fileList);
    },
    onRemove: (file) => {
      setFileList((prevList) =>
        prevList.filter((item) => item.uid !== file.uid)
      );
    },
    fileList,
  };

  return (
    <Card>
      <div className="p-2">
        {/* هدر و دکمه افزودن ویژگی */}
        <div className="mb-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
          <h1 className="text-xl sm:text-2xl font-bold text-center sm:text-left">
            مدیریت ویژگی‌ها
          </h1>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setSelectedAttribute(null);
              form.resetFields();
              setAttributeModal(true);
            }}
            className="w-full sm:w-auto"
          >
            افزودن ویژگی
          </Button>
        </div>

        <Tabs defaultActiveKey="attributes">
          {/* تب ویژگی‌ها */}
          <TabPane tab="ویژگی‌ها" key="attributes">
            <Table
              columns={attributeColumns}
              dataSource={attributes}
              loading={loading}
              rowKey="id"
              scroll={{ x: "max-content" }}
              pagination={{ responsive: true }}
            />
          </TabPane>

          {/* تب مقادیر */}
          <TabPane tab="مقادیر" key="values">
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center gap-2">
              <Select
                className="w-full sm:w-64"
                placeholder="انتخاب یک ویژگی"
                onChange={handleAttributeChange}
                value={selectedAttribute?.id}
                showSearch
                filterOption={(input, option) =>
                  option?.children
                    ?.toLowerCase()
                    .includes(input.toLowerCase())
                }
              >
                {attributes.map((attr) => (
                  <Option key={attr.id} value={attr.id}>
                    {attr.key}
                  </Option>
                ))}
              </Select>
              {selectedAttribute && (
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => {
                    valueForm.resetFields();
                    setValueModal(true);
                  }}
                  className="w-full sm:w-auto"
                >
                  افزودن مقدار
                </Button>
              )}
            </div>
            {selectedAttribute && (
              <>
                <Input
                  placeholder="جستجوی مقادیر..."
                  prefix={<SearchOutlined />}
                  value={valueSearch}
                  onChange={handleValueSearchChange}
                  allowClear
                  className="mb-4"
                />
                <Table
                  columns={valueColumns}
                  dataSource={selectedAttributeValues}
                  loading={valuesLoading}
                  rowKey="id"
                  scroll={{ x: "max-content" }}
                  pagination={{ responsive: true }}
                />
              </>
            )}
          </TabPane>
        </Tabs>

        {/* مودال ویژگی */}
        <Modal
          title={selectedAttribute ? "ویرایش ویژگی" : "افزودن ویژگی"}
          open={attributeModal}
          onOk={form.submit}
          onCancel={() => setAttributeModal(false)}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={
              selectedAttribute ? handleEditAttribute : handleAddAttribute
            }
          >
            <Form.Item
              name="key"
              label="کلید"
              rules={[{ required: true, message: "لطفاً کلید را وارد کنید!" }]}
            >
              <Input />
            </Form.Item>
            <Form.Item name="order" label="ترتیب">
              <Input type="number" />
            </Form.Item>
            <Form.Item
              name="type"
              label="نوع"
              rules={[{ required: true, message: "لطفاً نوع را انتخاب کنید!" }]}
            >
              <Select placeholder="انتخاب نوع">
                <Option value="product">محصول</Option>
                <Option value="variant">تنوع</Option>
              </Select>
            </Form.Item>
          </Form>
        </Modal>

        {/* مودال مقدار */}
        <Modal
          title="افزودن/ویرایش مقدار"
          open={valueModal}
          onOk={valueForm.submit}
          onCancel={() => setValueModal(false)}
        >
          <Form
            form={valueForm}
            layout="vertical"
            onFinish={
              valueForm.getFieldValue("id") ? handleEditValue : handleAddValue
            }
          >
            <Form.Item name="id" hidden>
              <Input />
            </Form.Item>
            <Form.Item
              name="value"
              label="مقدار"
              rules={[{ required: true, message: "لطفاً مقدار را وارد کنید!" }]}
            >
              <Input />
            </Form.Item>
            <Form.Item name="order" label="ترتیب">
              <Input type="number" />
            </Form.Item>
            <Form.Item label="فایل">
              <Upload {...uploadProps}>
                <Button icon={<UploadOutlined />}>انتخاب فایل</Button>
              </Upload>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </Card>
  );
};

export default AttributesPage;
