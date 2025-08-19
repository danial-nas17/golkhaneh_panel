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
  Drawer,
  Form,
  Divider,
} from "antd";
import {
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  SearchOutlined,
  SaveOutlined,
  CloseOutlined,
  FilterOutlined,
} from "@ant-design/icons";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../../../api";

const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

function ProductIndex() {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [brands, setBrands] = useState([]);
  const [expandedRows, setExpandedRows] = useState([]);
  const [searchInput, setSearchInput] = useState("");
  const [editingVariant, setEditingVariant] = useState(null);
  const [editingValues, setEditingValues] = useState({});
  const [updateLoading, setUpdateLoading] = useState({});
  const [attributes, setAttributes] = useState([]);
  const [selectedAttributes, setSelectedAttributes] = useState([]);
  const [attributeValues, setAttributeValues] = useState({});
  const [filterDrawerVisible, setFilterDrawerVisible] = useState(false);
  const [filterForm] = Form.useForm();

  const getColor = (index) => {
    const colors = ["gold", "cyan", "blue", "purple"];
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

  const parsePriceString = (priceString) => {
    if (typeof priceString === "number") return priceString;
    if (!priceString) return 0;

    // حذف تمام کاراکترهای غیرعددی به جز نقطه (برای اعداد اعشاری)
    const numericString = priceString.toString().replace(/[^0-9.]/g, "");
    return numericString ? parseFloat(numericString) : 0;
  };

  const fetchAttributes = async () => {
    try {
      const response = await api.get("/panel/attribute", {
        params: {
          includes: ["values"],
          type: "product",
          per_page: 100,
        },
      });
      setAttributes(response?.data?.data || []);
    } catch (error) {
      console.error("خطا در دریافت ویژگی‌ها:", error);
      message.error("دریافت ویژگی‌ها با خطا مواجه شد");
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const page = searchParams.get("page") || 1;
      const pageSize = searchParams.get("per_page") || 50;
      const search = searchParams.get("search") || "";
      const brand = searchParams.get("brand") || null;

      // Get attribute filters from URL params
      const attributeFilters = {};
      searchParams.forEach((value, key) => {
        if (key.startsWith("attr_")) {
          const attrKey = key.replace("attr_", "");
          attributeFilters[attrKey] = value;
        }
      });

      const params = {
        page,
        per_page: pageSize,
        search: search.trim(),
        brand,
        includes: ["variants", "attributes"],
        ...attributeFilters,
      };

      const response = await api.get("/panel/product", { params });

      setProducts(response.data.data);
      setPagination({
        current: parseInt(page),
        pageSize: parseInt(pageSize),
        total: response?.data?.meta?.total,
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
      price: parsePriceString(record.price),
      off_price: parsePriceString(record.off_price),
      buy_price: parsePriceString(record.buy_price),
      stock: record.stock,
    });
  };

  const handleCancelEdit = () => {
    setEditingVariant(null);
    setEditingValues({});
  };

  const handleSaveVariant = async (variantId) => {
    setUpdateLoading((prev) => ({ ...prev, [variantId]: true }));
    try {
      await api.put(`/panel/product-variation/mini-update/${variantId}`, {
        price: parsePriceString(editingValues.price),
        off_price: parsePriceString(editingValues.off_price),
        buy_price: parsePriceString(editingValues.buy_price),
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
      setUpdateLoading((prev) => ({ ...prev, [variantId]: false }));
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

  const handleAttributeSelect = (attributeIds) => {
    setSelectedAttributes(
      attributes.filter((attr) => attributeIds.includes(attr.id))
    );
  };

  const handleAttributeValueChange = (attrKey, values) => {
    setAttributeValues((prev) => ({
      ...prev,
      [attrKey]: values,
    }));
  };

  const handleApplyFilters = () => {
    const values = filterForm.getFieldsValue();
    const newParams = {
      ...Object.fromEntries(searchParams.entries()),
      page: 1,
    };

    // Clear existing attribute filters
    Object.keys(newParams).forEach((key) => {
      if (key.startsWith("attr_")) {
        delete newParams[key];
      }
    });

    // Add new attribute filters
    Object.entries(attributeValues).forEach(([key, value]) => {
      if (value && value.length > 0) {
        newParams[`attr_${key}`] = value.join(",");
      }
    });

    setSearchParams(newParams);
    setFilterDrawerVisible(false);
  };

  const handleResetFilters = () => {
    filterForm.resetFields();
    setAttributeValues({});
    setSelectedAttributes([]);

    // Remove attribute filters from URL
    const newParams = { ...Object.fromEntries(searchParams.entries()) };
    Object.keys(newParams).forEach((key) => {
      if (key.startsWith("attr_")) {
        delete newParams[key];
      }
    });

    setSearchParams(newParams);
    setFilterDrawerVisible(false);
  };

  useEffect(() => {
    fetchBrands();
    fetchAttributes();
    fetchProducts();

    setSearchInput(searchParams.get("search") || "");

    const expandedProductId = searchParams.get("expandedProduct");
    if (expandedProductId) {
      setExpandedRows([parseInt(expandedProductId)]);
    }

    // Initialize attribute values from URL params
    const initialAttributeValues = {};
    searchParams.forEach((value, key) => {
      if (key.startsWith("attr_")) {
        const attrKey = key.replace("attr_", "");
        initialAttributeValues[attrKey] = value.split(",");
      }
    });
    setAttributeValues(initialAttributeValues);
  }, [searchParams]);

  const handleDelete = async (id) => {
    try {
      await api.delete(`/panel/product/${id}`);
      message.success("محصول با موفقیت حذف شد");
      fetchProducts();
    } catch (error) {
      message.error("خطا در حذف محصول");
    }
  };

  const handleDeleteVariant = async (variantId) => {
    try {
      await api.delete(`/panel/product-variation/${variantId}`);
      message.success("واریانت با موفقیت حذف شد");
      fetchProducts();
    } catch (error) {
      message.error("خطا در حذف واریانت");
    }
  };

  const variantColumns = [
    {
      title: "شناسه",
      dataIndex: "product_variant_id",
      key: "product_variant_id",
    },
    {
      title: "کد کالا",
      dataIndex: "SKU",
      key: "SKU",
      render: (sku) => (
        <span
          style={{ direction: "ltr", textAlign: "right", display: "block" }}
        >
          {sku}
        </span>
      ),
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
              onChange={(value) =>
                setEditingValues((prev) => ({ ...prev, buy_price: value }))
              }
              formatter={(value) =>
                `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
              }
              parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
              style={{ width: "120px" }}
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
              onChange={(value) =>
                setEditingValues((prev) => ({ ...prev, price: value }))
              }
              formatter={(value) =>
                `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
              }
              parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
              style={{ width: "120px" }}
              placeholder="قیمت"
            />
          );
        }
        return `${price?.toLocaleString()} تومان`;
      },
    },
    {
      title: "قیمت تخفیف‌خورده",
      dataIndex: "off_price",
      key: "off_price",
      render: (offPrice, record) => {
        if (editingVariant === record.product_variant_id) {
          return (
            <InputNumber
              value={editingValues.off_price}
              onChange={(value) =>
                setEditingValues((prev) => ({ ...prev, off_price: value }))
              }
              formatter={(value) =>
                `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
              }
              parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
              style={{ width: "120px" }}
              placeholder="قیمت تخفیف"
            />
          );
        }
        return `${offPrice} تومان`;
      },
    },
    {
      title: "ترکیب ویژگی‌ها",
      dataIndex: "attribute_varitation",
      key: "attributes",
      render: (attributeVariations) => (
        <Space wrap>
          {attributeVariations?.map((attr) => (
            <Tag key={attr.key} color="blue">
              {`${attr.name}: ${attr.values.map((v) => v.name).join(", ")}`}
            </Tag>
          ))}
        </Space>
      ),
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
              onChange={(value) =>
                setEditingValues((prev) => ({ ...prev, stock: value }))
              }
              min={0}
              style={{ width: "80px" }}
              placeholder="موجودی"
            />
          );
        }
        return stock;
      },
    },
    {
      title: "تصویر",
      dataIndex: "images",
      key: "images",
      render: (images) =>
        images.length > 0 ? (
          <Image width={50} src={images[0]} alt="تصویر محصول" />
        ) : (
          "بدون تصویر"
        ),
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
                onClick={() =>
                  navigate(
                    `/productsVariation/edit/${record.product_variant_id}`
                  )
                }
                title="ویرایش کامل"
              />
              <Button
                type="primary"
                icon={<CopyOutlined />}
                size="small"
                onClick={() =>
                  navigate(`/productsVariation/add/${record.id}`, {
                    state: {
                      variantData: { ...record, product_id: record.id },
                    },
                  })
                }
              >
                کپی
              </Button>
              <Popconfirm
                title="آیا از حذف این واریانت اطمینان دارید؟"
                onConfirm={() => handleDeleteVariant(record.product_variant_id)}
                okText="بله"
                cancelText="خیر"
              >
                <Button
                  type="primary"
                  danger
                  icon={<DeleteOutlined />}
                  size="small"
                />
              </Popconfirm>
            </>
          )}
        </Space>
      ),
    },
  ];

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
      title: "برند",
      dataIndex: "brand",
      key: "brand",
    },
    {
      title: "دسته‌بندی‌ها",
      dataIndex: "categories",
      key: "categories",
      render: (categories) => (
        <div>
          {categories?.map((category, index) => (
            <Tag color={getColor(index)} key={category.id}>
              {category.title}
            </Tag>
          ))}
        </div>
      ),
    },
    {
      title: "ویژگی‌ها",
      dataIndex: "attributes",
      key: "attributes",
      render: (attributes) => (
        <Space wrap>
          {attributes.map((attr) => (
            <Tag color={getColor(attr?.attribute_id)} key={attr?.id}>
              {`${attr?.name}: ${attr?.values
                .map((val) => val?.name)
                .join(", ")}`}
            </Tag>
          ))}
        </Space>
      ),
    },
    {
      title: "تاریخ ایجاد",
      dataIndex: "created_at",
      key: "created_at",
    },
    {
      title: "تصویر",
      dataIndex: "thumb",
      key: "thumb",
      render: (icon) => (
        <Image src={icon} alt="تصویر دسته‌بندی" width={100} preview={false} />
      ),
    },
    {
      title: "عملیات",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate(`/productsVariation/add/${record.id}`)}
          >
            افزودن تنوع
          </Button>
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => navigate(`/products/edit/${record.id}`)}
          />
          <Popconfirm
            title="آیا از حذف این محصول اطمینان دارید؟"
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
    <Card>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">محصولات</h1>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate("/products/add")}
          >
            افزودن محصول
          </Button>
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
          <Button
            icon={<FilterOutlined />}
            onClick={() => setFilterDrawerVisible(true)}
            type={
              Object.keys(attributeValues).length > 0 ? "primary" : "default"
            }
          >
            فیلتر بر اساس ویژگی‌ها
            {Object.keys(attributeValues).length > 0 &&
              ` (${Object.keys(attributeValues).length})`}
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={products}
          loading={loading}
          rowKey="id"
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showTotal: (total) => `مجموع ${total} مورد`,
          }}
          onChange={handleTableChange}
          scroll={{ x: true }}
          expandable={{
            expandedRowRender: (record) =>
              record.variants?.length > 0 ? (
                <Table
                  className="MyCustomFont"
                  columns={variantColumns}
                  dataSource={record.variants}
                  pagination={false}
                  rowKey="product_variant_id"
                  size="small"
                />
              ) : (
                <p>محصول تنوع ندارد </p>
              ),
            expandedRowKeys: expandedRows,
            onExpand: (expanded, record) => {
              if (expanded) {
                setExpandedRows([record.id]);
              } else {
                setExpandedRows([]);
              }
            },
          }}
        />
      </div>

      {/* Drawer for attribute filtering */}
      <Drawer
        title="فیلتر بر اساس ویژگی‌ها"
        placement="right"
        onClose={() => setFilterDrawerVisible(false)}
        open={filterDrawerVisible}
        width={400}
        footer={
          <div style={{ textAlign: "right" }}>
            <Button onClick={handleResetFilters} style={{ marginRight: 8 }}>
              پاک کردن
            </Button>
            <Button onClick={handleApplyFilters} type="primary">
              اعمال فیلتر
            </Button>
          </div>
        }
      >
        <Form form={filterForm} layout="vertical">
          <Form.Item name="selectedAttributes" label="انتخاب ویژگی‌ها">
            <Select
              mode="multiple"
              placeholder="ویژگی‌های مورد نظر را انتخاب کنید"
              onChange={handleAttributeSelect}
              optionFilterProp="label"
              style={{ width: "100%" }}
              value={selectedAttributes.map((attr) => attr.id)}
              options={attributes.map((attr) => ({
                label: attr.name,
                value: attr.id,
                key: attr.id,
              }))}
            />
          </Form.Item>

          <Divider />

          {selectedAttributes.map((attribute) => (
            <Form.Item
              key={attribute.id}
              name={`attr_${attribute.key}`}
              label={attribute.name}
            >
              <Select
                mode="multiple"
                placeholder={`انتخاب ${attribute.name}`}
                onChange={(values) =>
                  handleAttributeValueChange(attribute.key, values)
                }
                value={attributeValues[attribute.key] || []}
                style={{ width: "100%" }}
                options={attribute.values.map((val) => ({
                  label: val.name,
                  value: val.id,
                  key: val.id,
                }))}
              />
            </Form.Item>
          ))}
        </Form>
      </Drawer>
    </Card>
  );
}

export default ProductIndex;
