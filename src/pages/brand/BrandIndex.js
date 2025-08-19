import { useState, useEffect } from "react";
import {
  Table,
  Button,
  Space,
  Popconfirm,
  message,
  Image,
  Card,
  Upload,
  Input,
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  UploadOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import api from "../../api";

const BrandIndex = () => {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState({});
  const [searchText, setSearchText] = useState("");
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 25,
    total: 0,
  });

  const navigate = useNavigate();

  const debounce = (func, wait) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  };

  const fetchBrands = async (page = 1, pageSize = 25, search = "") => {
    setLoading(true);
    try {
      const response = await api.get(`/panel/brand`, {
        params: {
          "includes[]": "products",
          page,
          per_page: pageSize,
          search: search.trim(),
        },
      });
      setBrands(response.data.data);
      setPagination({
        current: response.data.meta.current_page,
        pageSize: response.data.meta.per_page,
        total: response.data.meta.total,
      });
    } catch (error) {
      message.error("خطا در دریافت اطلاعات برندها");
    } finally {
      setLoading(false);
    }
  };

  const debouncedSearch = debounce((value) => {
    setPagination((prev) => ({ ...prev, current: 1 }));
    fetchBrands(1, pagination.pageSize, value);
  }, 500);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchText(value);
    debouncedSearch(value);
  };

  useEffect(() => {
    fetchBrands(1, pagination.pageSize, searchText);
  }, []);

  const handleTableChange = (pagination) => {
    fetchBrands(pagination.current, pagination.pageSize, searchText);
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/panel/brand/${id}`);
      message.success("برند با موفقیت حذف شد");
      fetchBrands(pagination.current, pagination.pageSize);
    } catch (error) {
      message.error("خطا در حذف برند");
    }
  };

  const handleExcelUpload = async (file, brandId) => {
    setUploadLoading((prev) => ({ ...prev, [brandId]: true }));
    const formData = new FormData();
    formData.append("excel_file", file);
    formData.append("brand_id", brandId);

    try {
      await api.post("/panel/brand/excel/product-variation-import", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      message.success("فایل اکسل با موفقیت آپلود شد");
    } catch (error) {
      message.error("خطا در آپلود فایل اکسل");
    } finally {
      setUploadLoading((prev) => ({ ...prev, [brandId]: false }));
    }
  };

  const columns = [
    {
      title: "شناسه",
      dataIndex: "id",
      key: "id",
    },
    {
      title: "عنوان",
      dataIndex: "title",
      key: "title",
    },
    {
      title: "تصویر آیکون",
      dataIndex: "icon",
      key: "icon",
      render: (icon) => (
        <Image src={icon} alt="تصویر برند" width={100} preview={true} />
      ),
    },
    {
      title: "عملیات",
      key: "action",
      render: (_, record) => (
        <Space size="middle">
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => navigate(`/brands/edit/${record.id}`)}
          ></Button>
          <Popconfirm
            title="آیا از حذف این برند اطمینان دارید؟"
            onConfirm={() => handleDelete(record.id)}
            okText="بله"
            cancelText="خیر"
          >
            <Button type="primary" danger icon={<DeleteOutlined />}></Button>
          </Popconfirm>
          {/* <Upload
            showUploadList={false}
            accept=".xlsx,.xls"
            beforeUpload={(file) => {
              handleExcelUpload(file, record.id);
              return false;
            }}
          >
            <Button
              type="primary"
              icon={<UploadOutlined />}
              loading={uploadLoading[record.id]}
            >
              آپلود اکسل
            </Button>
          </Upload> */}
        </Space>
      ),
    },
  ];

  return (
    <Card>
      <div>
        <div className="mb-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">مدیریت برندها</h1>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate("/brands/add")}
          >
            افزودن برند جدید
          </Button>
        </div>
        <div className="mb-4">
          <Input
            placeholder="جستجوی برندها..."
            prefix={<SearchOutlined />}
            onChange={handleSearchChange}
            value={searchText}
            className="max-w-md"
            allowClear
          />
        </div>

        <Table
          columns={columns}
          dataSource={brands}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showTotal: (total) => `مجموع: ${total} برند`,
          }}
          onChange={handleTableChange}
        />
      </div>
    </Card>
  );
};

export default BrandIndex;
