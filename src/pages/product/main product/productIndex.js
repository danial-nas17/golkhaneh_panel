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
  Modal,
  Timeline,
  Collapse,
  Typography,
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
  FileTextOutlined,
  UserOutlined,
  CalendarOutlined,
  GlobalOutlined,
  RollbackOutlined,
} from "@ant-design/icons";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../../../api";

const { Text, Paragraph } = Typography;
const { Panel } = Collapse;

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
  const [showDeleted, setShowDeleted] = useState(false);

  // States for logs modal
  const [logsModalVisible, setLogsModalVisible] = useState(false);
  const [productLogs, setProductLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [selectedProductTitle, setSelectedProductTitle] = useState("");
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [revertLoading, setRevertLoading] = useState({});

  // Function to get attribute value names from IDs
  const getAttributeValueNames = async (attributeIds) => {
    if (!attributeIds || attributeIds.length === 0) return [];

    try {
      // Parse the attribute_values if it's a string
      const ids =
        typeof attributeIds === "string"
          ? JSON.parse(attributeIds)
          : attributeIds;

      // Fetch attribute values by IDs
      const response = await api.get("/panel/attribute-value", {
        params: {
          ids: ids.join(","),
          per_page: 100,
        },
      });

      return response?.data?.data || [];
    } catch (error) {
      console.error("Error fetching attribute values:", error);
      return [];
    }
  };

  // Persian translation mapping for keys
  const getKeyTranslation = (key) => {
    const translations = {
      // Product fields
      creator_id: "شناسه سازنده",
      title: "عنوان",
      sub_title: "زیرعنوان",
      description: "توضیحات",
      size_guide: "راهنمای سایز",
      features: "ویژگی‌ها",
      return_conditions: "شرایط بازگشت",
      guarantee: "گارانتی",
      unit: "واحد",
      unit_price: "قیمت واحد",
      weight: "وزن",
      video_provider: "ارائه‌دهنده ویدیو",
      video_link: "لینک ویدیو",
      catalog_link: "لینک کاتالوگ",
      original: "اصل",
      featured: "ویژه",
      refundable: "قابل بازگشت",
      published: "منتشر شده",
      seo_title: "عنوان سئو",
      seo_description: "توضیحات سئو",
      follow: "دنبال کردن",
      index: "نمایه",
      canonical: "کانونیکال",
      slug: "پیوند",
      id: "شناسه",

      // Relations
      categories: "دسته‌بندی‌ها",
      auditAttributes: "ویژگی‌ها",
      attributes: "ویژگی‌ها",
      variations: "تنوع‌ها",
      variants: "تنوع‌ها",

      // Variant fields
      price: "قیمت",
      off_price: "قیمت تخفیف‌دار",
      buy_price: "قیمت خرید",
      stock: "موجودی",
      SKU: "کد کالا",
      UPC: "کد UPC",
      active: "فعال",
      images: "تصاویر",

      // Timestamps
      created_at: "تاریخ ایجاد",
      updated_at: "تاریخ به‌روزرسانی",
      deleted_at: "تاریخ حذف",

      // Other common fields
      name: "نام",
      key: "کلید",
      value: "مقدار",
      order: "ترتیب",
      type: "نوع",
      pivot: "جدول واسط",
      attribute_values: "مقادیر ویژگی",
    };

    return translations[key] || key;
  };

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

  // Check if a product is deleted
  const isProductDeleted = (product) => {
    return product.deleted_at !== null && product.deleted_at !== undefined;
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
        ...(showDeleted && { with_deleted: true }),
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

  // Fetch product logs
  const fetchProductLogs = async (productId, productTitle) => {
    setLogsLoading(true);
    setSelectedProductTitle(productTitle);
    setSelectedProductId(productId);
    try {
      const response = await api.get(`/panel/product/${productId}`, {
        params: {
          includes: ["logs"],
        },
      });

      // Filter logs that have non-empty changes
      const filteredLogs =
        response?.data?.data?.logs?.filter(
          (log) => log.changes && Object.keys(log.changes).length > 0
        ) || [];

      setProductLogs(filteredLogs);
      setLogsModalVisible(true);
    } catch (error) {
      console.error("خطا در دریافت لاگها:", error);
      message.error("دریافت لاگها با خطا مواجه شد");
    } finally {
      setLogsLoading(false);
    }
  };

  // Revert to specific log state
  const handleRevertToLog = async (logId) => {
    if (!selectedProductId) {
      message.error("شناسه محصول یافت نشد");
      return;
    }

    setRevertLoading((prev) => ({ ...prev, [logId]: true }));

    try {
      await api.post(
        `/panel/product/${selectedProductId}/transition-audit/${logId}`
      );

      message.success("محصول با موفقیت به حالت قبلی بازگردانده شد");

      // Refresh both logs and products data
      await Promise.all([
        fetchProductLogs(selectedProductId, selectedProductTitle),
        fetchProducts(),
      ]);
    } catch (error) {
      console.error("خطا در بازگردانی لاگ:", error);
      message.error("خطا در بازگردانی لاگ");
    } finally {
      setRevertLoading((prev) => ({ ...prev, [logId]: false }));
    }
  };

  // Get event type in Persian
  const getEventTypePersian = (eventType) => {
    const eventTypes = {
      created: "ایجاد",
      updated: "به‌روزرسانی",
      deleted: "حذف",
      attach: "اتصال",
      detach: "جدایی",
      sync: "همگام‌سازی",
      restore: "بازیابی",
    };
    return eventTypes[eventType] || eventType;
  };

  // Get event color
  const getEventColor = (eventType) => {
    const colors = {
      created: "green",
      updated: "blue",
      deleted: "red",
      attach: "orange",
      detach: "purple",
      sync: "cyan",
      restore: "gold",
    };
    return colors[eventType] || "default";
  };

  // Format change value for display
  // Enhanced function to format change value for display
  const formatChangeValue = async (key, value, isAttributeChange = false) => {
    if (value === null) return "خالی";
    if (typeof value === "boolean") return value ? "فعال" : "غیرفعال";

    // Special handling for attribute values
    if (
      isAttributeChange &&
      key === "attribute_values" &&
      typeof value === "string"
    ) {
      try {
        const attributeIds = JSON.parse(value);
        const attributeValues = await getAttributeValueNames(attributeIds);
        return attributeValues.map((av) => av.name || av.value).join(", ");
      } catch (error) {
        console.error("Error parsing attribute values:", error);
        return value;
      }
    }

    if (typeof value === "object") {
      return JSON.stringify(value, null, 2);
    }

    return String(value);
  };

  // Check if log can be reverted (exclude 'created' event type)
  const canRevertLog = (eventType) => {
    return eventType !== "created";
  };

  // Render changes in a readable format
  // Enhanced render changes component
  const RenderChanges = ({ changes, eventType }) => {
    const [renderedContent, setRenderedContent] = React.useState(null);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
      const processChanges = async () => {
        if (!changes || Object.keys(changes).length === 0) {
          setRenderedContent(null);
          setLoading(false);
          return;
        }

        const renderedChanges = [];

        for (const [key, change] of Object.entries(changes)) {
          const translatedKey = getKeyTranslation(key);
          const isAttributeChange = key === "auditAttributes";

          if (
            eventType === "attach" ||
            eventType === "detach" ||
            eventType === "sync"
          ) {
            // For attach/detach/sync events, show the items that were attached/detached
            const oldItems = [];
            const newItems = [];

            if (change.old && change.old.length > 0) {
              for (const item of change.old) {
                if (
                  isAttributeChange &&
                  item.pivot &&
                  item.pivot.attribute_values
                ) {
                  const attributeValueNames = await formatChangeValue(
                    "attribute_values",
                    item.pivot.attribute_values,
                    true
                  );
                  oldItems.push(
                    <Tag key={`old-${item.id}`} color="red" className="mb-1">
                      {`${item.key}: ${attributeValueNames}`}
                    </Tag>
                  );
                } else {
                  oldItems.push(
                    <Tag key={`old-${item.id}`} color="red" className="mb-1">
                      {item.title || item.name || item.key || `آیتم ${item.id}`}
                    </Tag>
                  );
                }
              }
            }

            if (change.new && change.new.length > 0) {
              for (const item of change.new) {
                if (
                  isAttributeChange &&
                  item.pivot &&
                  item.pivot.attribute_values
                ) {
                  const attributeValueNames = await formatChangeValue(
                    "attribute_values",
                    item.pivot.attribute_values,
                    true
                  );
                  newItems.push(
                    <Tag key={`new-${item.id}`} color="green" className="mb-1">
                      {`${item.key}: ${attributeValueNames}`}
                    </Tag>
                  );
                } else {
                  newItems.push(
                    <Tag key={`new-${item.id}`} color="green" className="mb-1">
                      {item.title || item.name || item.key || `آیتم ${item.id}`}
                    </Tag>
                  );
                }
              }
            }

            renderedChanges.push(
              <div key={key} className="mb-2 p-2 bg-gray-50 rounded">
                <Text strong className="text-blue-600">
                  {translatedKey}:
                </Text>
                <div className="mt-1">
                  {oldItems.length > 0 && (
                    <div className="mb-1">
                      <Text type="danger">حذف شده:</Text>
                      <div className="ml-2">{oldItems}</div>
                    </div>
                  )}
                  {newItems.length > 0 && (
                    <div>
                      <Text type="success">اضافه شده:</Text>
                      <div className="ml-2">{newItems}</div>
                    </div>
                  )}
                </div>
              </div>
            );
          } else {
            // For other events, show old -> new format
            const oldValue =
              change.old !== undefined
                ? await formatChangeValue(key, change.old, isAttributeChange)
                : undefined;
            const newValue =
              change.new !== undefined
                ? await formatChangeValue(key, change.new, isAttributeChange)
                : undefined;

            renderedChanges.push(
              <div key={key} className="mb-2 p-2 bg-gray-50 rounded">
                <Text strong className="text-blue-600">
                  {translatedKey}:
                </Text>
                <div className="mt-1">
                  {oldValue !== undefined && (
                    <div>
                      <Text type="secondary">قبل:</Text>
                      <Text code className="ml-2">
                        {oldValue}
                      </Text>
                    </div>
                  )}
                  {newValue !== undefined && (
                    <div>
                      <Text type="success">بعد:</Text>
                      <Text code className="ml-2">
                        {newValue}
                      </Text>
                    </div>
                  )}
                </div>
              </div>
            );
          }
        }

        setRenderedContent(<div className="mt-3">{renderedChanges}</div>);
        setLoading(false);
      };

      processChanges();
    }, [changes, eventType]);

    if (loading) {
      return <div className="text-center py-2">در حال بارگیری...</div>;
    }

    return renderedContent;
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
  }, [searchParams, showDeleted]);

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
          <Button
            type="primary"
            icon={<EditOutlined />}
            size="small"
            onClick={() =>
              navigate(`/productsVariation/edit/${record.product_variant_id}`)
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
      render: (title, record) => (
        <div>
          {title}
          {isProductDeleted(record) && (
            <Tag color="red" className="ml-2">
              حذف شده
            </Tag>
          )}
        </div>
      ),
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
            disabled={isProductDeleted(record)}
            title={
              isProductDeleted(record)
                ? "محصول حذف شده قابل ویرایش نیست"
                : "افزودن تنوع"
            }
          >
            افزودن تنوع
          </Button>
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => navigate(`/products/edit/${record.id}`)}
            disabled={isProductDeleted(record)}
            title={
              isProductDeleted(record)
                ? "محصول حذف شده قابل ویرایش نیست"
                : "ویرایش"
            }
          />
          <Button
            type="default"
            icon={<FileTextOutlined />}
            onClick={() => fetchProductLogs(record.id, record.title)}
            title="مشاهده لاگها"
          >
            لاگها
          </Button>
          {!isProductDeleted(record) && (
            <Popconfirm
              title="آیا از حذف این محصول اطمینان دارید؟"
              onConfirm={() => handleDelete(record.id)}
              okText="بله"
              cancelText="خیر"
            >
              <Button type="primary" danger icon={<DeleteOutlined />} />
            </Popconfirm>
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

          <Button
            type={showDeleted ? "primary" : "default"}
            onClick={() => {
              setShowDeleted(!showDeleted);
              // Reset to first page when toggling filter
              setSearchParams({
                ...Object.fromEntries(searchParams.entries()),
                page: 1,
              });
            }}
          >
            {showDeleted ? "مخفی کردن حذف شده‌ها" : "نمایش حذف شده‌ها"}
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

      {/* Modal for displaying logs */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <FileTextOutlined />
            <span>لاگهای محصول: {selectedProductTitle}</span>
          </div>
        }
        open={logsModalVisible}
        onCancel={() => setLogsModalVisible(false)}
        width={900}
        footer={[
          <Button key="close" onClick={() => setLogsModalVisible(false)}>
            بستن
          </Button>,
        ]}
        style={{ top: 20 }}
        bodyStyle={{ maxHeight: "70vh", overflow: "auto" }}
      >
        {logsLoading ? (
          <div className="flex justify-center items-center py-8">
            <div>در حال بارگیری لاگها...</div>
          </div>
        ) : (
          <Timeline mode="left" className="mt-4">
            {productLogs.map((log, index) => (
              <Timeline.Item
                key={log.audit_id}
                color={getEventColor(log.audit_event)}
                dot={
                  <div
                    className={`w-3 h-3 rounded-full`}
                    style={{
                      backgroundColor:
                        getEventColor(log.audit_event) === "default"
                          ? "#d9d9d9"
                          : undefined,
                    }}
                  />
                }
                label={
                  <div className="text-sm text-gray-500 min-w-[120px]">
                    <div className="flex items-center gap-1 mb-1">
                      <CalendarOutlined />
                      {log.audit_created_at}
                    </div>
                    <div className="flex items-center gap-1">
                      <UserOutlined />
                      {log.user_name}
                    </div>
                  </div>
                }
              >
                <Card
                  size="small"
                  className="mb-2"
                  title={
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Tag
                          color={getEventColor(log.audit_event)}
                          className="text-sm"
                        >
                          {getEventTypePersian(log.audit_event)}
                        </Tag>
                        {canRevertLog(log.audit_event) && (
                          <Popconfirm
                            title="آیا از بازگردانی محصول به این حالت اطمینان دارید؟"
                            description="این عملیات باعث تغییر وضعیت کنونی محصول خواهد شد."
                            onConfirm={() => handleRevertToLog(log.audit_id)}
                            okText="بله"
                            cancelText="خیر"
                            placement="topLeft"
                          >
                            <Button
                              size="small"
                              type="link"
                              icon={<RollbackOutlined />}
                              loading={revertLoading[log.audit_id]}
                              className="text-orange-500 hover:text-orange-600"
                              title="بازگردانی به این حالت"
                            >
                              بازگردانی
                            </Button>
                          </Popconfirm>
                        )}
                      </div>
                      <Text type="secondary" className="text-xs">
                        #{log.audit_id}
                      </Text>
                    </div>
                  }
                >
                  <div className="mb-2">
                    <div className="flex items-center gap-2 mb-2">
                      <GlobalOutlined className="text-gray-400" />
                      <Text type="secondary" className="text-xs">
                        {log.audit_url}
                      </Text>
                    </div>
                    <div className="flex items-center gap-2">
                      <Text type="secondary" className="text-xs">
                        آی پی کاربر: {log.audit_ip_address}
                      </Text>
                      <Text type="secondary" className="text-xs">
                        مرورگر کاربر: {log.audit_user_agent}
                      </Text>
                    </div>
                  </div>

                  <Collapse size="small" ghost>
                    <Panel
                      header={
                        <Text strong className="text-blue-600">
                          جزئیات تغییرات (
                          {Object.keys(log.changes || {}).length} مورد)
                        </Text>
                      }
                      key="1"
                    >
                      <RenderChanges
                        changes={log.changes}
                        eventType={log.audit_event}
                      />
                    </Panel>
                  </Collapse>
                </Card>
              </Timeline.Item>
            ))}
          </Timeline>
        )}

        {!logsLoading && productLogs.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            هیچ لاگی برای این محصول یافت نشد
          </div>
        )}
      </Modal>
    </Card>
  );
}

export default ProductIndex;
