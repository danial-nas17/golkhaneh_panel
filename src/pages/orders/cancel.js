import React, { useEffect, useState } from "react";
import {
  Card,
  Table,
  Tag,
  Select,
  Space,
  Button,
  message,
  Modal,
  Descriptions,
  Typography,
  Divider,
  Row,
  Col,
  Image,
} from "antd";
import {
  EyeOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  IssuesCloseOutlined,
  UserOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import api from "../../api";
import { usePermissions } from "../../hook/usePermissions";
import UnifiedErrorHandler from "../../utils/unifiedErrorHandler";

const { Option } = Select;
const { Text, Title } = Typography;

const STATUS_MAP = {
  PENDING: { label: "در انتظار تأیید", color: "processing" },
  APPROVED: { label: "تأیید شده", color: "success" },
  REJECTED: { label: "رد شده", color: "error" },
};

const TYPE_MAP = {
  item: { label: "جعبه" },
  order: { label: "سفارش" },
};

const PACK_TYPE_MAP = {
  CUT_FLOWER: "شاخه بریده",
  POTTED_PLANT: "گلدان",
  POT_PLANT: "گلدان", // fallback for old format
  MIXED: "ترکیبی",
};

const CancellationsList = () => {
  const { hasPermission } = usePermissions();
  const canModerate = hasPermission("packaging-cancellation");

  const [data, setData] = useState([]);
  const [meta, setMeta] = useState({ current_page: 1, per_page: 25, total: 0 });
  const [loading, setLoading] = useState(false);

  const [status, setStatus] = useState("");
  const [type, setType] = useState("item");
  const [page, setPage] = useState(1);

  const [showId, setShowId] = useState(null);
  const [showOpen, setShowOpen] = useState(false);
  const [showLoading, setShowLoading] = useState(false);
  const [showData, setShowData] = useState(null);

  const fetchList = async (pageArg = 1, typeArg = type, statusArg = status) => {
    setLoading(true);
    try {
      const res = await api.get("/panel/cancellations", {
        params: {
          type: typeArg,
          per_page: meta.per_page || 25,
          page: pageArg,
          ...(statusArg ? { status: statusArg } : {}),
        },
      });
      setData(res.data?.data || []);
      setMeta(res.data?.meta || {});
      setPage(pageArg);
    } catch (error) {
      UnifiedErrorHandler.handleApiError(error, null, {
        showGeneralMessages: true,
        defaultMessage: "خطا در دریافت لیست ابطال‌ها"
      });
    } finally {
      setLoading(false);
    }
  };

  const openShow = async (id) => {
    setShowId(id);
    setShowOpen(true);
    setShowLoading(true);
    try {
      const res = await api.get(`/panel/cancellations/${id}`);
      setShowData(res.data?.data || null);
    } catch (error) {
      UnifiedErrorHandler.handleApiError(error, null, {
        showGeneralMessages: true,
        defaultMessage: "خطا در دریافت جزئیات ابطال"
      });
    } finally {
      setShowLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await api.post(`/panel/cancellations/${id}/approve`);
      message.success("درخواست ابطال تأیید شد");
      setShowOpen(false);
      fetchList(page);
    } catch (error) {
      UnifiedErrorHandler.handleApiError(error, null, {
        showGeneralMessages: true,
        defaultMessage: "تأیید انجام نشد"
      });
    }
  };

  const handleReject = async (id) => {
    try {
      await api.post(`/panel/cancellations/${id}/reject`);
      message.success("درخواست ابطال رد شد");
      setShowOpen(false);
      fetchList(page);
    } catch (error) {
      UnifiedErrorHandler.handleApiError(error, null, {
        showGeneralMessages: true,
        defaultMessage: "رد انجام نشد"
      });
    }
  };

  useEffect(() => {
    fetchList(1);
  }, [type, status]);

  const columns = [
    {
      title: "شناسه",
      dataIndex: "id",
      key: "id",
      width: 90,
      render: (id) => <Text strong>#{id}</Text>,
    },
    {
      title: "وضعیت",
      dataIndex: "status",
      key: "status",
      width: 140,
      render: (st) => {
        const s = STATUS_MAP[(st || "").toUpperCase()] || { label: st, color: "default" };
        return <Tag color={s.color}>{s.label}</Tag>;
      },
    },
    {
      title: "نوع",
      dataIndex: ["target", "packaging_order_id"],
      key: "type",
      width: 120,
      render: () => <Tag color={type === "item" ? "blue" : "purple"}>{TYPE_MAP[type]?.label || type}</Tag>,
    },
    {
      title: "علت",
      dataIndex: "reason",
      key: "reason",
      render: (v) => (
        <div className="max-w-xs truncate" title={v}>
          {v}
        </div>
      ),
    },
    {
      title: "درخواست‌دهنده",
      dataIndex: "requested_by",
      key: "requested_by",
      width: 200,
      render: (u) => (u ? `${u.first_name || ""} ${u.last_name || ""}`.trim() || u.email || u.mobile : "—"),
    },
    {
      title: "هدف",
      key: "target",
      width: 220,
      render: (_, rec) => {
        const t = rec.target || {};
        if (type === "item") {
          return `جعبه #${t.row_no ?? t.id} در سفارش #${t.packaging_order_id ?? "—"}`;
        }
        return `سفارش #${t.id ?? "—"}`;
      },
    },
    {
      title: "تاریخ درخواست",
      dataIndex: "requested_at",
      key: "requested_at",
      width: 170,
    },
    {
      title: "عملیات",
      key: "actions",
      fixed: "right",
      width: 150,
      render: (_, rec) => (
        <Space>
          <Button size="small" icon={<EyeOutlined />} onClick={() => openShow(rec.id)}>
            نمایش
          </Button>
        </Space>
      ),
    },
  ];

  const renderProductDetails = (product) => {
    if (!product) return null;
    
    return (
      <Card size="small" title={<Space>محصول</Space>} style={{ marginBottom: 16 }}>
        <Descriptions size="small" column={2}>
          <Descriptions.Item label="نام محصول" span={2}>
            <Text strong>{product.title}</Text>
          </Descriptions.Item>
          {product.sub_title && (
            <Descriptions.Item label="زیرنویس" span={2}>
              {product.sub_title}
            </Descriptions.Item>
          )}
          <Descriptions.Item label="SKU">
            {product.variations?.[0]?.SKU || "—"}
          </Descriptions.Item>
          <Descriptions.Item label="UPC">
            {product.variations?.[0]?.UPC || "—"}
          </Descriptions.Item>
          <Descriptions.Item label="موجودی">
            {product.variations?.[0]?.stock || 0} عدد
          </Descriptions.Item>
          <Descriptions.Item label="قابل بازگشت">
            {product.refundable ? "بله" : "خیر"}
          </Descriptions.Item>
          {product.categories?.length > 0 && (
            <Descriptions.Item label="دسته‌بندی" span={2}>
              {product.categories.map(cat => (
                <Tag key={cat.id} color="blue">{cat.title}</Tag>
              ))}
            </Descriptions.Item>
          )}
        </Descriptions>
      </Card>
    );
  };

  const renderPackagingDetails = (target) => {
    if (!target) return null;
    
    return (
      <Card size="small" title={<Space>جزئیات بسته‌بندی</Space>} style={{ marginBottom: 16 }}>
        <Descriptions size="small" column={2}>
          <Descriptions.Item label="شماره ردیف">
            #{target.row_no}
          </Descriptions.Item>
          <Descriptions.Item label="شماره سفارش">
            #{target.order_no}
          </Descriptions.Item>
          <Descriptions.Item label="نوع بسته">
            {PACK_TYPE_MAP[target.pack_type] || target.pack_type || "—"}
          </Descriptions.Item>
          <Descriptions.Item label="کنترل کیفیت">
            {target.qc_controller || "—"}
          </Descriptions.Item>
          <Descriptions.Item label="تعداد شاخه">
            <Text strong>{target.total_stems || 0}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="تعداد گل">
            <Text strong>{target.total_flowers || 0}</Text>
          </Descriptions.Item>
          {target.total_pots > 0 && (
            <>
              <Descriptions.Item label="تعداد گلدان">
                <Text strong>{target.total_pots}</Text>
              </Descriptions.Item>
              
            </>
          )}
          <Descriptions.Item label="بسته‌بندی شده توسط">
            {target.packaged_by ? `کاربر #${target.packaged_by}` : "—"}
          </Descriptions.Item>
          <Descriptions.Item label="تاریخ بسته‌بندی">
            {target.packaged_at || "—"}
          </Descriptions.Item>
          {target.is_void && (
            <Descriptions.Item label="وضعیت" span={2}>
              <Tag color="red">باطل شده</Tag>
              {target.void_reason && (
                <div style={{ marginTop: 8 }}>
                  <Text type="secondary">دلیل باطل شدن: {target.void_reason}</Text>
                </div>
              )}
            </Descriptions.Item>
          )}
        </Descriptions>
      </Card>
    );
  };

  const renderUserInfo = (user, title) => {
    if (!user) return null;
    
    return (
      <Card size="small" title={<Space><UserOutlined />{title}</Space>} style={{ marginBottom: 16 }}>
        <Descriptions size="small" column={1}>
          <Descriptions.Item label="نام و نام خانوادگی">
            {`${user.first_name || ""} ${user.last_name || ""}`.trim() || "—"}
          </Descriptions.Item>
          <Descriptions.Item label="ایمیل">
            {user.email || "—"}
          </Descriptions.Item>
          <Descriptions.Item label="موبایل">
            {user.mobile || "—"}
          </Descriptions.Item>
          {user.company_name && (
            <Descriptions.Item label="نام شرکت">
              {user.company_name}
            </Descriptions.Item>
          )}
          {user.country && (
            <Descriptions.Item label="کشور">
              {user.country}
            </Descriptions.Item>
          )}
        </Descriptions>
      </Card>
    );
  };

  const renderProductVariations = (product) => {
    if (!product?.product_variation_id?.attribute_varitation?.length) return null;
    
    return (
      <Card size="small" title="مشخصات محصول" style={{ marginBottom: 16 }}>
        <Row gutter={[16, 8]}>
          {product.product_variation_id.attribute_varitation.map((attr) => (
            <Col span={12} key={attr.id}>
              <div>
                <Text strong>{attr.name}: </Text>
                {attr.values.map((val, idx) => (
                  <Tag key={val.id} color="geekblue">
                    {val.name}
                  </Tag>
                ))}
              </div>
            </Col>
          ))}
        </Row>
      </Card>
    );
  };

  return (
    <Card
      title={
        <Space>
          <IssuesCloseOutlined />
          <span>ابطال‌ها</span>
        </Space>
      }
      extra={
        <Space wrap>
          <Select
            value={type}
            onChange={(v) => setType(v)}
            style={{ width: 140 }}
            options={[
              { value: "item", label: "جعبه‌ها" },
              { value: "order", label: "سفارش‌ها" },
            ]}
          />
          <Select
            value={status}
            onChange={(v) => setStatus(v)}
            style={{ width: 160 }}
          >
            <Option value="">همه وضعیت‌ها</Option>
            <Option value="PENDING">در انتظار</Option>
            <Option value="APPROVED">تأیید شده</Option>
            <Option value="REJECTED">رد شده</Option>
          </Select>
        </Space>
      }
    >
      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        pagination={{
          current: meta.current_page || 1,
          pageSize: meta.per_page || 25,
          total: meta.total || 0,
          showSizeChanger: false,
          onChange: (p) => fetchList(p),
        }}
        scroll={{ x: 980 }}
      />

      <Modal
        open={showOpen}
        onCancel={() => setShowOpen(false)}
        title={
          <Space>
            <IssuesCloseOutlined />
            <span>جزئیات درخواست ابطال #{showId ?? ""}</span>
          </Space>
        }
        footer={
          showData &&
          showData.status &&
          showData.status.toUpperCase() === "PENDING" &&
          canModerate && [
            <Button
              key="reject"
              danger
              icon={<CloseCircleOutlined />}
              onClick={() => handleReject(showId)}
            >
              رد
            </Button>,
            <Button
              key="approve"
              type="primary"
              icon={<CheckCircleOutlined />}
              onClick={() => handleApprove(showId)}
            >
              تأیید
            </Button>,
          ]
        }
        destroyOnClose
        width={900}
      >
        {showLoading ? (
          <div style={{ textAlign: "center", padding: 24 }}>در حال بارگذاری…</div>
        ) : showData ? (
          <div>
            <Card size="small" title={<Space><ClockCircleOutlined />اطلاعات درخواست</Space>} style={{ marginBottom: 16 }}>
              <Descriptions bordered size="small" column={2}>
                <Descriptions.Item label="وضعیت">
                  <Tag color={STATUS_MAP[(showData.status || "").toUpperCase()]?.color || "default"}>
                    {STATUS_MAP[(showData.status || "").toUpperCase()]?.label || showData.status}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="نوع هدف">
                  <Tag color={showData.goal === "PackagingItem" ? "blue" : "purple"}>
                    {showData.goal === "PackagingItem" ? "جعبه" : "سفارش"}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="تاریخ درخواست">
                  {showData.requested_at || "—"}
                </Descriptions.Item>
                <Descriptions.Item label="تاریخ بروزرسانی">
                  {showData.updated_at || "—"}
                </Descriptions.Item>
                <Descriptions.Item label="علت ابطال" span={2}>
                  <div style={{ 
                    padding: '8px 12px', 
                    backgroundColor: '#f5f5f5', 
                    borderRadius: '6px',
                    border: '1px solid #d9d9d9'
                  }}>
                    <Text>{showData.reason || "—"}</Text>
                  </div>
                </Descriptions.Item>
                {showData.approved_at && (
                  <Descriptions.Item label="تاریخ تأیید">
                    {showData.approved_at}
                  </Descriptions.Item>
                )}
              </Descriptions>
            </Card>

            {renderUserInfo(showData.requested_by, "درخواست‌دهنده")}

            {showData.approved_by && renderUserInfo(showData.approved_by, "تأیید کننده")}

            {showData.target?.product && renderProductDetails(showData.target.product)}

            {showData.target && renderProductVariations(showData.target)}

            {showData.target && renderPackagingDetails(showData.target)}
          </div>
        ) : (
          <div>موردی یافت نشد</div>
        )}
      </Modal>
    </Card>
  );
};

export default CancellationsList;