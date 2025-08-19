import React, { useEffect, useState } from "react";
import {
  Button,
  Card,
  Image,
  Input,
  message,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  InputNumber,
} from "antd";
import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  SearchOutlined,
  SaveOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../../api";

const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

function ProductVariationIndex() {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [brands, setBrands] = useState([]);
  const [searchInput, setSearchInput] = useState("");
  const [editingVariant, setEditingVariant] = useState(null);
  const [editingValues, setEditingValues] = useState({});
  const [updateLoading, setUpdateLoading] = useState({});
  
  const getColor = (index) => {
    const colors = [
      "gold",
      "cyan",
      "blue",
      "purple",
    ];
    return colors[index % colors.length];
  };
  
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 50,
    total: 0,
  });
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const fetchBrands = async () => {
    try {
      const response = await api.get("/panel/brand", {
        params: { per_page: 100, page: 1 },
      });
      setBrands(response?.data?.data || []);
    } catch (error) {
      console.error("خطا در دریافت برندها:", error);
      message.error("دریافت برندها با خطا مواجه شد");
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const page = searchParams.get("page") || 1;
      const pageSize = searchParams.get("per_page") || 50;
      const search = searchParams.get("search") || "";
      const brand = searchParams.get("brand") || null;

      const response = await api.get("/panel/product-variation", {
        params: {
          page,
          per_page: pageSize,
          search: search.trim(),
          brand,
        },
      });

      setProducts(response?.data?.data || []);
      setPagination({
        current: response?.data?.meta?.current_page || 1,
        pageSize: parseInt(pageSize),
        total: response?.data?.meta?.total || 0,
      });
    } catch (error) {
      message.error("دریافت محصولات با خطا مواجه شد");
    } finally {
      setLoading(false);
    }
  };

  // Handle inline editing for variants
  const handleEditVariant = (record) => {
    setEditingVariant(record.product_variant_id);
    setEditingValues({
      price: record.price?.replace(/[^0-9]/g, ''),
      off_price: record.off_price?.replace(/[^0-9]/g, ''),
      buy_price: record.buy_price,
      stock: record.stock,
    });
  };

  const handleCancelEdit = () => {
    setEditingVariant(null);
    setEditingValues({});
  };

  const handleSaveVariant = async (variantId) => {
    setUpdateLoading(prev => ({ ...prev, [variantId]: true }));
    try {
      await api.put(`/panel/product-variation/mini-update/${variantId}`, {
        price: editingValues.price,
        off_price: editingValues.off_price,
        buy_price: editingValues.buy_price,
        stock: editingValues.stock,
      });
      
      message.success("واریانت با موفقیت به‌روزرسانی شد");
      setEditingVariant(null);
      setEditingValues({});
      fetchProducts(); // Refresh data
    } catch (error) {
      console.error("خطا در به‌روزرسانی واریانت:", error);
      message.error("خطا در به‌روزرسانی واریانت");
    } finally {
      setUpdateLoading(prev => ({ ...prev, [variantId]: false }));
    }
  };

  const debouncedSearch = React.useCallback(
    debounce((value) => {
      setSearchParams({
        ...Object.fromEntries(searchParams.entries()),
        search: value,
        page: 1,
      });
    }, 500),
    [searchParams, setSearchParams]
  );

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchInput(value); 
    debouncedSearch(value); 
  };

  const handleBrandChange = (value) => {
    setSearchParams({
      ...Object.fromEntries(searchParams.entries()),
      brand: value || "",
      page: 1,
    });
  };

  const handleTableChange = (pagination) => {
    const { current, pageSize } = pagination;
    setSearchParams({
      ...Object.fromEntries(searchParams.entries()),
      page: current,
      per_page: pageSize,
    });
  };

  useEffect(() => {
    fetchBrands();
    fetchProducts();
    
    setSearchInput(searchParams.get("search") || "");
  }, [searchParams]);

  const handleDelete = async (id) => {
    try {
      await api.delete(`/panel/product-variation/${id}`);
      message.success("محصول با موفقیت حذف شد");
      fetchProducts();
    } catch (error) {
      message.error("خطا در حذف محصول");
    }
  };

  const processAttributeVariation = (attributeVaritation) => {
    if (!attributeVaritation || !Array.isArray(attributeVaritation)) return {};
    
    const result = {};
    attributeVaritation.forEach(attr => {
      if (attr.values && attr.values.length > 0) {
        result[attr.key] = attr.values.map(v => v.value).join(', ');
      }
    });
    return result;
  };

  const columns = [
    {
      title: "شناسه",
      dataIndex: "product_variant_id",
      key: "product_variant_id",
    },
    {
      title: "عنوان",
      dataIndex: "title",
      key: "title",
    },
    {
      title: "تصویر",
      dataIndex: "images",
      key: "image",
      width: 100,
      render: (images) => {
        const image = Array.isArray(images) && images.length > 0 ? images[0] : null;
        return image ? (
          <Image
            src={image}
            alt="محصول"
            width={100}
            height={50}
            style={{ objectFit: "cover" }}
          />
        ) : (
          <span>بدون تصویر</span>
        );
      },
    },
    {
      title: "کد کالا",
      dataIndex: "SKU",
      key: "SKU",
      render: (sku) => <span style={{ direction: "ltr", textAlign: "right", display: "block" }}>{sku}</span>,
    },
    {
      title: "بارکد",
      dataIndex: "UPC",
      key: "UPC",
    },
    {
      title: "قیمت خرید",
      dataIndex: "buy_price",
      key: "buy_price",
      render: (buyPrice, record) => {
        if (editingVariant === record.product_variant_id) {
          return (
            <InputNumber
              value={editingValues.buy_price}
              onChange={(value) => setEditingValues(prev => ({ ...prev, buy_price: value }))}
              formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value.replace(/\$\s?|(,*)/g, '')}
              style={{ width: '120px' }}
              placeholder="قیمت خرید"
            />
          );
        }
        return `${buyPrice?.toLocaleString()} تومان`;
      },
    },
    {
      title: "قیمت",
      dataIndex: "price",
      key: "price",
      render: (price, record) => {
        if (editingVariant === record.product_variant_id) {
          return (
            <InputNumber
              value={editingValues.price}
              onChange={(value) => setEditingValues(prev => ({ ...prev, price: value }))}
              formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value.replace(/\$\s?|(,*)/g, '')}
              style={{ width: '120px' }}
              placeholder="قیمت"
            />
          );
        }
        return `${price} تومان`;
      },
    },
    {
      title: "قیمت تخفیف",
      dataIndex: "off_price",
      key: "off_price",
      render: (price, record) => {
        if (editingVariant === record.product_variant_id) {
          return (
            <InputNumber
              value={editingValues.off_price}
              onChange={(value) => setEditingValues(prev => ({ ...prev, off_price: value }))}
              formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value.replace(/\$\s?|(,*)/g, '')}
              style={{ width: '120px' }}
              placeholder="قیمت تخفیف"
            />
          );
        }
        return parseFloat(price) === 0 ? "-" : `${price} تومان`;
      },
    },
    {
      title: "موجودی",
      dataIndex: "stock",
      key: "stock",
      render: (stock, record) => {
        if (editingVariant === record.product_variant_id) {
          return (
            <InputNumber
              value={editingValues.stock}
              onChange={(value) => setEditingValues(prev => ({ ...prev, stock: value }))}
              min={0}
              style={{ width: '80px' }}
              placeholder="موجودی"
            />
          );
        }
        return stock;
      },
    },
    {
      title: "وضعیت انتشار",
      dataIndex: "active",
      key: "published",
      render: (published) => (
        <Tag color={published ? "green" : "red"}>
          {published ? "منتشر شده" : "منتشر نشده"}
        </Tag>
      ),
    },
    {
      title: "ویژگی‌ها",
      dataIndex: "attribute_varitation",
      key: "attributes",
      render: (attributeVaritation) => {
        const attributes = processAttributeVariation(attributeVaritation);
        return (
          <div>
            {Object.entries(attributes).map(([key, value]) => (
              <Tag key={key} color="blue">
                {`${key}: ${value}`}
              </Tag>
            ))}
          </div>
        );
      },
    },
    {
      title: "تاریخ ایجاد",
      dataIndex: "created_at",
      key: "created_at",
    },
    {
      title: "عملیات",
      key: "actions",
      render: (_, record) => (
        <Space>
          {editingVariant === record.product_variant_id ? (
            <>
              <Button
                type="primary"
                icon={<SaveOutlined />}
                size="small"
                loading={updateLoading[record.product_variant_id]}
                onClick={() => handleSaveVariant(record.product_variant_id)}
              >
                ذخیره
              </Button>
              <Button
                icon={<CloseOutlined />}
                size="small"
                onClick={handleCancelEdit}
              >
                لغو
              </Button>
            </>
          ) : (
            <>
              <Button
                type="default"
                icon={<EditOutlined />}
                size="small"
                onClick={() => handleEditVariant(record)}
                title="ویرایش سریع"
              >
                ویرایش سریع
              </Button>
              <Button
                type="primary"
                icon={<EditOutlined />}
                size="small"
                onClick={() => navigate(`/productsVariation/edit/${record.product_variant_id}`)}
                title="ویرایش کامل"
              />
              <Popconfirm
                title="آیا از حذف این محصول اطمینان دارید؟"
                onConfirm={() => handleDelete(record.product_variant_id)}
                okText="بله"
                cancelText="خیر"
              >
                <Button type="primary" danger icon={<DeleteOutlined />} size="small" />
              </Popconfirm>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Card>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">محصولات</h1>
          {/* <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate("/productsVariation/add")}
          >
            افزودن تنوع
          </Button> */}
        </div>

        <div className="mb-4 flex gap-4">
          <Input
            placeholder="جستجوی محصولات..."
            prefix={<SearchOutlined />}
            onChange={handleSearchChange}
            value={searchInput} 
            className="max-w-md"
            allowClear
          />
          <Select
            placeholder="فیلتر بر اساس برند"
            onChange={handleBrandChange}
            value={searchParams.get("brand") || null}
            allowClear
            className="min-w-[200px]"
            showSearch
            filterOption={(input, option) =>
              option.label.toLowerCase().includes(input.toLowerCase())
            }
            options={brands.map((brand) => ({
              value: brand.title,
              label: brand.title,
            }))}
          />
        </div>

        <Table
          columns={columns}
          dataSource={products}
          loading={loading}
          rowKey="product_variant_id"
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showTotal: (total) => `مجموع ${total} مورد`,
          }}
          onChange={handleTableChange}
          scroll={{ x: true }}
        />
      </div>
    </Card>
  );
}

export default ProductVariationIndex;