import React, { useState, useEffect } from "react";
import {
  Card,
  Button,
  message,
  Timeline,
  Tag,
  Modal,
  Select,
  Space,
  Typography,
  Collapse,
  Spin,
  Empty,
  InputNumber,
} from "antd";
import {
  FileTextOutlined,
  UserOutlined,
  CalendarOutlined,
  GlobalOutlined,
  FilterOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api";
import UnifiedErrorHandler from "../../utils/unifiedErrorHandler";

const { Text, Paragraph } = Typography;
const { Panel } = Collapse;
const { Option } = Select;

const OrderLogsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [orderData, setOrderData] = useState(null);
  const [allLogs, setAllLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [selectedLogTypes, setSelectedLogTypes] = useState(['logs']); // Only general logs active initially
  const [logsLimit, setLogsLimit] = useState(200); // Default logs limit

  // Log type mappings
  const logTypeLabels = {
    logs: 'لاگ‌های عمومی',
    order_logs: 'لاگ‌های سفارش',
    item_logs: 'لاگ‌های آیتم‌ها',
    line_logs: 'لاگ‌های ردیفها',
    pot_logs: 'لاگ‌های گلدان‌ها'
  };

  const logTypeColors = {
    logs: 'blue',
    order_logs: 'green',
    item_logs: 'orange',
    line_logs: 'purple',
    pot_logs: 'cyan'
  };

  // Persian translation mapping for keys
  const getKeyTranslation = (key) => {
    const translations = {
      // Order fields
      order_no: "شماره سفارش",
      status: "وضعیت",
      count_item: "تعداد آیتم",
      created_at: "تاریخ ایجاد",
      completed_at: "تاریخ تکمیل",
      notes: "یادداشت",
      deleted_at: "تاریخ حذف",
      qc_controller: "کنترل کیفیت",
      customer_id: "شناسه مشتری",
      packed_by: "بسته‌بندی شده توسط",
      is_void:"باطل شده",
      void_reason:"دلیل ابطال",


      // Item fields
      packaging_order_id: "شناسه سفارش بسته‌بندی",
      row_no: "شماره ردیف",
      product_id: "شناسه محصول",
      product_variation_id: "شناسه تنوع محصول",
      pack_type: "نوع بسته‌بندی",
      pot_count: "تعداد گلدان",
      pot_type: "نوع گلدان",
      qc_controller: "کنترل کیفیت",
      packaged_by: "بسته‌بندی شده توسط",
      packaged_at: "تاریخ بسته‌بندی",
      stems_count: "تعداد شاخه",
      flowers_per_stem: "گل در هر شاخه",
      line_total_stems: "مجموع شاخه ردیف",
      line_total_flowers: "مجموع گل ردیف",
      total_stems: "مجموع شاخه",
      total_flowers: "مجموع گل",
      attributes_snapshot: "اسنپ‌شات ویژگی‌ها",
      total_pots:"مجموع گلدانها",
      packaging_item_id:"شناسه جعبه",
      line_no:"شماره ردیف" , 

      // Common fields
      id: "شناسه",
      name: "نام",
      key: "کلید",
      value: "مقدار",
      order: "ترتیب",
      type: "نوع",
      created_by: "ایجاد شده توسط",
    };

    return translations[key] || key;
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
  const formatChangeValue = (key, value) => {
    if (value === null) return "خالی";
    if (typeof value === "boolean") return value ? "فعال" : "غیرفعال";

    if (typeof value === "object") {
      // Handle attributes_snapshot specially
      if (key === "attributes_snapshot" && value.attrs) {
        return value.attrs.map(attr =>
          `${attr.attribute_key}: ${attr.value}`
        ).join(", ");
      }
      return JSON.stringify(value, null, 2);
    }

    return String(value);
  };

  // Render changes in a readable format
  const RenderChanges = ({ changes, eventType }) => {
    if (!changes || Object.keys(changes).length === 0) {
      return <div className="text-center py-2 text-gray-500">تغییری یافت نشد</div>;
    }

    const renderedChanges = [];

    for (const [key, change] of Object.entries(changes)) {
      const translatedKey = getKeyTranslation(key);

      if (
        eventType === "attach" ||
        eventType === "detach" ||
        eventType === "sync"
      ) {
        // For attach/detach/sync events, show the items that were attached/detached
        const oldItems = change.old || [];
        const newItems = change.new || [];

        renderedChanges.push(
          <div key={key} className="mb-2 p-2 bg-gray-50 rounded">
            <Text strong className="text-blue-600">
              {translatedKey}:
            </Text>
            <div className="mt-1">
              {oldItems.length > 0 && (
                <div className="mb-1">
                  <Text type="danger">حذف شده:</Text>
                  <div className="ml-2">
                    {oldItems.map((item, idx) => (
                      <Tag key={`old-${idx}`} color="red" className="mb-1">
                        {item.title || item.name || item.key || `آیتم ${item.id}`}
                      </Tag>
                    ))}
                  </div>
                </div>
              )}
              {newItems.length > 0 && (
                <div>
                  <Text type="success">اضافه شده:</Text>
                  <div className="ml-2">
                    {newItems.map((item, idx) => (
                      <Tag key={`new-${idx}`} color="green" className="mb-1">
                        {item.title || item.name || item.key || `آیتم ${item.id}`}
                      </Tag>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      } else {
        // For other events, show old -> new format
        const oldValue = change.old !== undefined ? formatChangeValue(key, change.old) : undefined;
        const newValue = change.new !== undefined ? formatChangeValue(key, change.new) : undefined;

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

    return <div className="mt-3">{renderedChanges}</div>;
  };

  // Fetch order logs
  const fetchOrderLogs = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/panel/packaging-orders/${id}`, {
        params: {
          includes: ['items', 'order_logs', 'item_logs', 'line_logs', 'logs', 'pot_logs'],
          logs_limit: logsLimit,
        },
      });

      const data = response.data.data;
      setOrderData(data);

      // Combine all logs with type information
      const combinedLogs = [];

      // Add logs with type
      if (data.logs) {
        data.logs.forEach(log => {
          combinedLogs.push({ ...log, logType: 'logs' });
        });
      }

      if (data.order_logs) {
        data.order_logs.forEach(log => {
          combinedLogs.push({ ...log, logType: 'order_logs' });
        });
      }

      if (data.item_logs) {
        data.item_logs.forEach(log => {
          combinedLogs.push({ ...log, logType: 'item_logs' });
        });
      }

      if (data.line_logs) {
        data.line_logs.forEach(log => {
          combinedLogs.push({ ...log, logType: 'line_logs' });
        });
      }

      if (data.pot_logs) {
        data.pot_logs.forEach(log => {
          combinedLogs.push({ ...log, logType: 'pot_logs' });
        });
      }

      // Sort by creation date (newest first)
      combinedLogs.sort((a, b) => new Date(b.audit_created_at) - new Date(a.audit_created_at));

      setAllLogs(combinedLogs);
      setFilteredLogs(combinedLogs);

    } catch (error) {
      UnifiedErrorHandler.handleApiError(error, null, {
        showGeneralMessages: true,
        defaultMessage: "ردیف در دریافت لاگ‌های سفارش"
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle log type filter change
  const handleLogTypeFilterChange = (selectedType) => {
    const selectedTypes = selectedType ? [selectedType] : [];
    setSelectedLogTypes(selectedTypes);
    if (selectedTypes.length === 0) {
      setFilteredLogs([]);
    } else {
      const filtered = allLogs.filter(log => selectedTypes.includes(log.logType));
      setFilteredLogs(filtered);
    }
  };

  useEffect(() => {
    if (id) {
      fetchOrderLogs();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spin size="large" />
        <span className="ml-2">در حال بارگیری لاگ‌ها...</span>
      </div>
    );
  }

  if (!orderData) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Empty description="سفارش یافت نشد" />
      </div>
    );
  }

  return (
    <div dir="rtl" className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/orders')}
            type="default"
          >
            بازگشت به لیست سفارش‌ها
          </Button>
          <div>
            <h1 className="text-2xl font-bold">لاگ‌های سفارش</h1>
            <p className="text-gray-600">
              شماره سفارش: {orderData.order_no} | وضعیت: {orderData.status}
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <div className="flex items-center gap-4 flex-wrap">
          <FilterOutlined />
          <span className="font-medium">فیلتر بر اساس نوع لاگ:</span>
          <Select
            placeholder="انتخاب نوع لاگ"
            value={selectedLogTypes[0] || undefined}
            onChange={handleLogTypeFilterChange}
            style={{ minWidth: 300 }}
          >
            {Object.entries(logTypeLabels).map(([key, label]) => (
              <Option key={key} value={key}>
                <Tag color={logTypeColors[key]}>{label}</Tag>
              </Option>
            ))}
          </Select>

          <div className="flex items-center gap-2">
            <span className="font-medium">تعداد لاگ‌ها:</span>
            <InputNumber
              min={1}
              max={1000}
              value={logsLimit}
              onChange={(value) => setLogsLimit(value || 200)}
              style={{ width: 100 }}
              placeholder="200"
            />
            <Button
              type="primary"
              size="small"
              onClick={() => fetchOrderLogs()}
              style={{ borderRadius: 6 }}
            >
              اعمال
            </Button>
          </div>

          <Button
            onClick={() => {
              setSelectedLogTypes(['logs']);
              setLogsLimit(200);
            }}
            type="link"
          >
            بازنشانی
          </Button>
        </div>
      </Card>

      {/* Logs Timeline */}
      <Card>
        {filteredLogs.length === 0 ? (
          <Empty
            description={
              selectedLogTypes.length === 0
                ? "هیچ نوع لاگی انتخاب نشده"
                : `هیچ لاگی ${logTypeLabels[selectedLogTypes[0]] || ''} برای این سفارش یافت نشد`
            }
          />
        ) : (
          <Timeline mode="left" className="mt-4">
            {filteredLogs.map((log, index) => (
              <Timeline.Item
                key={`${log.logType}-${log.audit_id}`}
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
                        <Tag color={logTypeColors[log.logType]} className="text-xs">
                          {logTypeLabels[log.logType]}
                        </Tag>
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
      </Card>
    </div>
  );
};

export default OrderLogsPage;