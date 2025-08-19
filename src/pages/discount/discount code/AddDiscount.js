import React, { useState, useEffect } from "react";
import {
  Form,
  Input,
  Button,
  Select,
  Switch,
  InputNumber,
  message,
  Row,
  Col,
  Card,
} from "antd";
import DatePicker from "react-multi-date-picker";
import TimePicker from "react-multi-date-picker/plugins/time_picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import english from "react-date-object/locales/gregorian_en";
import api from "../../../api";
import { useNavigate } from "react-router-dom";
import { debounce } from "lodash";

const { Option } = Select;

const datePickerStyle = {
  width: "100%",
  height: "32px", 
  borderRadius: "6px",
  padding: "4px 11px", 
  border: "1px solid #d9d9d9",
  display: "flex",
  alignItems: "center"
};

const datePickerContainerStyle = {
  width: "100%",
  zIndex: 9999,
};

const AddDiscount = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [users, setUsers] = useState([]);
  const navigate = useNavigate();

  const handleSearch = debounce(async (searchText, endpoint, setData) => {
    try {
      const res = await api.get(`${endpoint}?search=${searchText}`);
      setData(res.data.data);
    } catch (error) {
      message.error("خطا در دریافت داده‌ها");
    }
  }, 300);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsRes, categoriesRes, brandsRes, usersRes] =
          await Promise.all([
            api.get("/panel/product/mini/index?per_page&page&search"),
            api.get("/panel/category?per_page=all&search"),
            api.get("/panel/brand?per_page=all&page&search"),
            api.get("/panel/users?per_page=all&page&search"),
          ]);
        setProducts(productsRes?.data?.data);
        setCategories(categoriesRes?.data?.data);
        setBrands(brandsRes?.data?.data);
        setUsers(usersRes?.data?.data);
      } catch (error) {
        message.error("خطا در دریافت داده ها");
      }
    };
    fetchData();
  }, []);

  const convertToGregorian = (date) => {
    return date
      ? date.convert(persian, english).format("YYYY-MM-DD HH:mm")
      : null;
  };

  const onFinish = async (values) => {
    try {
      setLoading(true);
      const payload = {
        ...values,
        is_active: values.is_active ? 1 : 0, 
        start_date: convertToGregorian(values.start_date),
        end_date: convertToGregorian(values.end_date),
      };
      await api.post("/panel/coupons", payload);
      message.success("تخفیف با موفقیت اضافه شد");
      navigate("/discounts");
    } catch (error) {
      message.error("خطا در ثبت تخفیف");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <h2 className="mb-10 text-xl">افزودن کد تخفیف جدید</h2>

      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Row gutter={24}>
          
          <Col span={24}>
            <Form.Item
              name="code"
              label="کد تخفیف"
              rules={[{ required: true, message: "این فیلد الزامی است" }]}
            >
              <Input placeholder="کد تخفیف را وارد کنید" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="usage_limit"
              label="محدودیت استفاده"
              rules={[
                {
                  required: true,
                  type: "number",
                  message: "عدد معتبر وارد کنید",
                },
              ]}
            >
              <InputNumber min={1} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="value"
              label="مقدار تخفیف"
              rules={[
                {
                  required: true,
                  type: "number",
                  message: "عدد معتبر وارد کنید",
                },
              ]}
            >
              <InputNumber min={1} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16} align="middle">
          <Col span={12}>
            <Form.Item
              name="type"
              label="نوع تخفیف"
              rules={[
                { required: true, message: "انتخاب نوع تخفیف الزامی است" },
              ]}
            >
              <Select placeholder="انتخاب کنید">
                <Option value="fixed">مبلغ ثابت</Option>
                <Option value="percentage">درصدی</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item 
              name="start_date" 
              label="تاریخ و ساعت شروع"
              className="date-picker-form-item"
            >
              <div style={datePickerContainerStyle}>
                <DatePicker
                  calendar={persian}
                  locale={persian_fa}
                  format="YYYY/MM/DD HH:mm"
                  plugins={[<TimePicker position="bottom" />]}
                  style={datePickerStyle}
                  containerStyle={{
                    width: "100%"
                  }}
                />
              </div>
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item 
              name="end_date" 
              label="تاریخ و ساعت پایان"
              className="date-picker-form-item"
            >
              <div style={datePickerContainerStyle}>
                <DatePicker
                  calendar={persian}
                  locale={persian_fa}
                  format="YYYY/MM/DD HH:mm"
                  plugins={[<TimePicker position="bottom" />]}
                  style={datePickerStyle}
                  containerStyle={{
                    width: "100%"
                  }}
                />
              </div>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="users" label="کاربران">
              <Select
                mode="multiple"
                showSearch
                placeholder="انتخاب کاربران"
                filterOption={false}
                
                onSearch={(searchText) =>
                  handleSearch(searchText, "/panel/users", setUsers)
                }
              >
                {users.map((user) => (
                  <Option key={user.id} value={user.id}>
                    {user.first_name} {user.last_name}-{user?.mobile}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={16}>
            <Form.Item name="is_active" label="فعال" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          
        </Row>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>
            افزودن تخفیف
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default AddDiscount;