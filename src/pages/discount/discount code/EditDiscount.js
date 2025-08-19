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
  Spin,
} from "antd";
import DatePicker from "react-multi-date-picker";
import TimePicker from "react-multi-date-picker/plugins/time_picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import english from "react-date-object/locales/gregorian_en";
import DateObject from "react-date-object";
import api from "../../../api";
import { useNavigate, useParams } from "react-router-dom";
import { debounce } from "lodash";

const { Option } = Select;

// اضافه کردن استایل برای یکسان سازی ارتفاع فیلدها
const datePickerStyle = {
  width: "100%",
  height: "32px", // ارتفاع استاندارد فیلدهای antd
  borderRadius: "6px",
  padding: "4px 11px", // پدینگ استاندارد فیلدهای antd
  border: "1px solid #d9d9d9", // برای تطابق با استایل antd
  display: "flex",
  alignItems: "center",
};

const datePickerContainerStyle = {
  width: "100%",
  zIndex: 9999,
};

const EditDiscount = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [users, setUsers] = useState([]);
  const navigate = useNavigate();
  const { id } = useParams(); 

  const handleSearch = debounce(async (searchText, endpoint, setData) => {
    try {
      const res = await api.get(`${endpoint}?search=${searchText}`);
      setData(res?.data?.data);
    } catch (error) {
      message.error("خطا در دریافت داده‌ها");
    }
  }, 300);

  // تبدیل تاریخ شمسی به آبجکت DatePicker
  const convertToPersianDateObject = (dateString) => {
    if (!dateString) return null;

    // تبدیل فرمت تاریخ از 1403-12-20 15:17 به آبجکت DateObject
    const [datePart, timePart] = dateString.split(" ");
    const [year, month, day] = datePart.split("-");
    const [hour, minute] = timePart.split(":");

    return new DateObject({
      calendar: persian,
      locale: persian_fa,
      year: parseInt(year),
      month: parseInt(month),
      day: parseInt(day),
      hour: parseInt(hour),
      minute: parseInt(minute),
    });
  };

  // تبدیل تاریخ DatePicker به فرمت گرگوری
  const convertToGregorian = (date) => {
    return date
      ? date.convert(persian, english).format("YYYY-MM-DD HH:mm")
      : null;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setFetchLoading(true);
        const discountRes = await api.get(`/panel/coupons/${id}`);
        const discountData = discountRes?.data?.data;

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

        const discount = discountData;
        form.setFieldsValue({
          name: discount?.name,
          code: discountData?.code,
          usage_limit: discountData?.usage_limit,
          value: parseInt(discount?.value),
          type: discount?.type,
          is_active: discountData?.is_active === 1,
          start_date: convertToPersianDateObject(discount?.start_date),
          end_date: convertToPersianDateObject(discount?.end_date),
          // products: discount?.products?.map(p => p.id) || [],
          // categories: discount?.categories?.map(c => c.id) || [],
          // brands: discount?.brands?.map(b => b.id) || [],
          users: discount?.users?.map((u) => u.id) || [],
        });
      } catch (error) {
        message.error("خطا در دریافت اطلاعات کد تخفیف");
        console.error(error);
      } finally {
        setFetchLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id, form]);

  const onFinish = async (values) => {
    try {
      setLoading(true);
      const payload = {
        ...values,
        is_active: values?.is_active ? 1 : 0,
        start_date: convertToGregorian(values?.start_date),
        end_date: convertToGregorian(values?.end_date),
      };

      await api.put(`/panel/coupons/${id}`, payload);
      message.success("کد تخفیف با موفقیت ویرایش شد");
      navigate("/discounts");
    } catch (error) {
      message.error("خطا در ویرایش کد تخفیف");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <Card className="text-center py-12">
        <Spin size="large" />
        <p className="mt-4">در حال بارگذاری اطلاعات...</p>
      </Card>
    );
  }

  return (
    <Card>
      <h2 className="mb-10 text-xl">ویرایش کد تخفیف</h2>

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
                    width: "100%",
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
                    width: "100%",
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
                    {user.first_name} {user.last_name}
                    {user.mobile ? `-${user.mobile}` : ""}
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

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            className="ml-2"
          >
            ذخیره تغییرات
          </Button>
          <Button onClick={() => navigate("/discounts")}>انصراف</Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default EditDiscount;
