import React, { useState, useEffect } from "react";
import {
  Card,
  Button,
  Descriptions,
  Tag,
  Spin,
  Row,
  Col,
  Space,
  Typography,
  Divider,
  message,
  Table,
  Tooltip,
} from "antd";
import {
  ArrowLeftOutlined,
  EditOutlined,
  FileTextOutlined,
  UserOutlined,
  ShoppingCartOutlined,
  CalendarOutlined,
  PrinterOutlined,
} from "@ant-design/icons";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api";
import dayjs from "dayjs";
import UnifiedErrorHandler from "../../utils/unifiedErrorHandler";

const { Title, Text, Paragraph } = Typography;

const InvoiceShow = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoiceData, setInvoiceData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchInvoiceDetails();
    }
  }, [id]);

  const fetchInvoiceDetails = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/panel/invoices/${id}?includes[]=creator&includes[]=items&includes[]=single_stems`);
      setInvoiceData(response.data.data);
    } catch (error) {
      console.error("Error fetching invoice details:", error);
      UnifiedErrorHandler.handleApiError(error, null, {
        showGeneralMessages: true,
        defaultMessage: "خطا در دریافت اطلاعات فاکتور",
      });
    } finally {
      setLoading(false);
    }
  };

  const statusTranslations = {
    OPEN: "باز",
    CLOSED: "بسته",
    CANCELLED: "لغو شده",
    COMPLETED: "تکمیل شده"
  };

  const statusColors = {
    OPEN: "blue",
    CLOSED: "green",
    CANCELLED: "red",
    COMPLETED: "green"
  };

  const paymentTypeTranslations = {
    cash: "نقدی",
    credit: "اعتباری",
    card_to_card: "کارت به کارت",
    cheque: "چک",
    other: "سایر"
  };

  const packTypeTranslations = {
    CUT_FLOWER: "شاخه بریده",
    POTTED_PLANT: "گلدانی"
  };

  const handlePrintInvoice = () => {
    if (!invoiceData) return;

    const printWindow = window.open('', '_blank');
    const printContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="fa">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>فاکتور فروش - ${invoiceData.invoice_number}</title>
        <style>
          body {
            font-family: 'Tahoma', 'Arial', sans-serif;
            margin: 0;
            padding: 20px;
            direction: rtl;
            text-align: right;
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .invoice-title {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 10px;
          }
          .invoice-number {
            font-size: 18px;
            color: #666;
          }
          .info-section {
            margin-bottom: 30px;
          }
          .info-title {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 10px;
            border-bottom: 1px solid #ddd;
            padding-bottom: 5px;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 5px;
            padding: 5px 0;
          }
          .info-label {
            font-weight: bold;
            min-width: 120px;
          }
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }
          .items-table th,
          .items-table td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: center;
          }
          .items-table th {
            background-color: #f5f5f5;
            font-weight: bold;
          }
          .total-section {
            margin-top: 30px;
            text-align: left;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            font-size: 18px;
            font-weight: bold;
            padding: 10px 0;
            border-top: 2px solid #333;
          }
          .footer {
            margin-top: 50px;
            text-align: center;
            font-size: 12px;
            color: #666;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="invoice-title">فاکتور فروش</div>
          <div class="invoice-number">شماره: ${invoiceData.invoice_number}</div>
        </div>

        <div class="info-section">
          <div class="info-title">اطلاعات فاکتور</div>
          <div class="info-row">
            <span class="info-label">وضعیت:</span>
            <span>${statusTranslations[invoiceData.status]}</span>
          </div>
          <div class="info-row">
            <span class="info-label">نوع پرداخت:</span>
            <span>${paymentTypeTranslations[invoiceData.payment_type] || invoiceData.payment_type}</span>
          </div>
          <div class="info-row">
            <span class="info-label">تاریخ ایجاد:</span>
            <span>${invoiceData.created_at ? invoiceData.created_at  :  "—"}</span>
          </div>
          <div class="info-row">
            <span class="info-label">تاریخ تکمیل:</span>
            <span>${invoiceData.completed_at ? invoiceData.completed_at : "تکمیل نشده"}</span>
          </div>
        </div>

        <div class="info-section">
          <div class="info-title">اطلاعات مشتری</div>
          <div class="info-row">
            <span class="info-label">نام:</span>
            <span>${invoiceData.customer_snapshot?.identity?.name || "نامشخص"}</span>
          </div>
          <div class="info-row">
            <span class="info-label">تلفن:</span>
            <span>${invoiceData.customer_snapshot?.identity?.phone || "ثبت نشده"}</span>
          </div>
          <div class="info-row">
            <span class="info-label">ایمیل:</span>
            <span>${invoiceData.customer_snapshot?.identity?.email || "ثبت نشده"}</span>
          </div>
          <div class="info-row">
            <span class="info-label">شهر:</span>
            <span>${invoiceData.customer_snapshot?.identity?.city || "ثبت نشده"}</span>
          </div>
        </div>

        <div class="info-section">
          <div class="info-title">آیتم‌های فاکتور</div>
          <table class="items-table">
            <thead>
              <tr>
                <th>ردیف</th>
                <th>محصول</th>
                <th>نوع بسته‌بندی</th>
                <th>قیمت واحد</th>
                <th>تعداد</th>
                <th>مجموع</th>
              </tr>
            </thead>
            <tbody>
              ${invoiceData.items?.map((item, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>${item.product?.title || "نامشخص"}</td>
                  <td>${packTypeTranslations[item.pack_type] || item.pack_type}</td>
                  <td>${item.unit_price?.toLocaleString() || 0} تومان</td>
                  <td>${item.unit_count || 0}</td>
                  <td>${item.line_total?.toLocaleString() || 0} تومان</td>
                </tr>
              `).join('') || '<tr><td colspan="6">آیتمی یافت نشد</td></tr>'}
            </tbody>
          </table>
        </div>

        ${invoiceData.single_stems && invoiceData.single_stems.length > 0 ? `
        <div class="info-section">
          <div class="info-title">فروش‌های شاخه‌ای</div>
          <table class="items-table">
            <thead>
              <tr>
                <th>ردیف</th>
                <th>محصول</th>
                <th>تعداد شاخه</th>
                <th>گل در شاخه</th>
                <th>قیمت واحد</th>
                <th>مجموع</th>
              </tr>
            </thead>
            <tbody>
              ${invoiceData.single_stems.map((stem, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>${stem.product?.title || "نامشخص"}</td>
                  <td>${stem.stems_count || 0}</td>
                  <td>${stem.flowers_per_stem || 0}</td>
                  <td>${stem.unit_price?.toLocaleString() || 0} تومان</td>
                  <td>${stem.line_total?.toLocaleString() || 0} تومان</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        ` : ''}

        <div class="total-section">
          <div class="total-row">
            <span>مجموع کل:</span>
            <span>${invoiceData.total_amount?.toLocaleString() || 0} تومان</span>
          </div>
          ${invoiceData.discount_percent !== null && invoiceData.discount_percent !== undefined ? `
          <div class="total-row" style="border-top: 1px solid #ddd; padding-top: 10px;">
            <span>درصد تخفیف:</span>
            <span>${invoiceData.discount_percent}%</span>
          </div>
          ` : ''}
          ${invoiceData.discount_amount !== null && invoiceData.discount_amount !== undefined ? `
          <div class="total-row">
            <span>مبلغ تخفیف:</span>
            <span>${invoiceData.discount_amount.toLocaleString()} تومان</span>
          </div>
          ` : ''}
          ${invoiceData.discounted_total !== null && invoiceData.discounted_total !== undefined ? `
          <div class="total-row" style="border-top: 2px solid #333; font-size: 20px; font-weight: bold; padding-top: 10px;">
            <span>مجموع پس از تخفیف:</span>
            <span>${invoiceData.discounted_total.toLocaleString()} تومان</span>
          </div>
          ` : ''}
        </div>

       
      </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  if (!invoiceData) {
    return (
      <div style={{ textAlign: "center", padding: "50px" }}>
        <Text type="danger">خطا در دریافت اطلاعات فاکتور</Text>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "16px",
        backgroundColor: "#f5f7fa",
        minHeight: "100vh",
      }}
      dir="rtl"
    >
      {/* Header */}
      <Card style={{ marginBottom: 24 }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <Space wrap>
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={() => navigate("/invoices")}
                size="small"
              >
                بازگشت به لیست فاکتورها
              </Button>
              <Title level={4} style={{ margin: 0, fontSize: "16px" }}>
                جزئیات فاکتور - #{invoiceData.id}
              </Title>
            </Space>
            <Space>
              <Button
                icon={<PrinterOutlined />}
                onClick={handlePrintInvoice}
                type="primary"
              >
                پرینت فاکتور
              </Button>
              <Button
                icon={<EditOutlined />}
                onClick={() => navigate(`/invoices/${id}/edit-pricing`)}
              >
                ویرایش قیمت‌گذاری
              </Button>
              {/* <Button
                icon={<FileTextOutlined />}
                onClick={() => navigate(`/invoices/${id}/logs`)}
              >
                لاگ‌ها
              </Button> */}
            </Space>
          </div>
        </div>
      </Card>

      {/* Invoice Information */}
      <Row gutter={24}>
        <Col xs={24}>
          <Card
            title={
              <Space>
                <FileTextOutlined />
                <span>اطلاعات فاکتور</span>
              </Space>
            }
          >
            <Descriptions bordered column={{ xs: 1, sm: 1, md: 2 }}>
              <Descriptions.Item label="شماره فاکتور">
                <Text strong>{invoiceData.invoice_number}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="وضعیت">
                <Tag color={statusColors[invoiceData.status]}>
                  {statusTranslations[invoiceData.status]}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="نوع پرداخت">
                <Text>{paymentTypeTranslations[invoiceData.payment_type] || invoiceData.payment_type}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="مجموع مبلغ">
                <Text strong>
                  {invoiceData.total_amount ? `${invoiceData.total_amount.toLocaleString()} تومان` : "—"}
                </Text>
              </Descriptions.Item>
              {invoiceData.discount_percent !== null && invoiceData.discount_percent !== undefined && (
                <Descriptions.Item label="درصد تخفیف">
                  <Text>{invoiceData.discount_percent}%</Text>
                </Descriptions.Item>
              )}
              {invoiceData.discount_amount !== null && invoiceData.discount_amount !== undefined && (
                <Descriptions.Item label="مبلغ تخفیف">
                  <Text>{invoiceData.discount_amount.toLocaleString()} تومان</Text>
                </Descriptions.Item>
              )}
              {invoiceData.discounted_total !== null && invoiceData.discounted_total !== undefined && (
                <Descriptions.Item label="مجموع پس از تخفیف">
                  <Text strong style={{ color: "#52c41a", fontSize: "16px" }}>
                    {invoiceData.discounted_total.toLocaleString()} تومان
                  </Text>
                </Descriptions.Item>
              )}
              <Descriptions.Item label="تاریخ ایجاد">
                {invoiceData.created_at ? invoiceData.created_at : "—"}
              </Descriptions.Item>
              <Descriptions.Item label="تاریخ تکمیل">
                {invoiceData.completed_at ? invoiceData.completed_at  : "تکمیل نشده"}
              </Descriptions.Item>
              <Descriptions.Item label="یادداشت" span={2}>
                <Paragraph ellipsis={{ rows: 2, expandable: true }}>
                  {invoiceData.notes || "بدون یادداشت"}
                </Paragraph>
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
      </Row>

      {/* Customer Information (from customer_snapshot) */}
      <Row gutter={24} style={{ marginTop: 24 }}>
        <Col xs={24}>
          <Card
            title={
              <Space>
                <UserOutlined />
                <span>اطلاعات مشتری</span>
              </Space>
            }
          >
            <Descriptions bordered column={{ xs: 1, sm: 1, md: 2 }}>
              <Descriptions.Item label="نام مشتری">
                <Text strong>{invoiceData.customer_snapshot?.identity?.name || "نامشخص"}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="شماره تماس">
                {invoiceData.customer_snapshot?.identity?.phone || "ثبت نشده"}
              </Descriptions.Item>
              <Descriptions.Item label="ایمیل">
                {invoiceData.customer_snapshot?.identity?.email || "ثبت نشده"}
              </Descriptions.Item>
              <Descriptions.Item label="کد مشتری">
                {invoiceData.customer_snapshot?.customer_id || "ثبت نشده"}
              </Descriptions.Item>
              <Descriptions.Item label="آدرس" span={2}>
                {invoiceData.customer_snapshot?.billing?.address || invoiceData.customer_snapshot?.shipping?.address || "ثبت نشده"}
              </Descriptions.Item>
              <Descriptions.Item label="شهر">
                {invoiceData.customer_snapshot?.identity?.city || "ثبت نشده"}
              </Descriptions.Item>
              <Descriptions.Item label="زمان ثبت ">
                {invoiceData.customer_snapshot?.captured_at || "—"}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
      </Row>

      {/* Invoice Items */}
      {invoiceData.items && invoiceData.items.length > 0 && (
        <Row gutter={24} style={{ marginTop: 24 }}>
          <Col xs={24}>
            <Card
              title={
                <Space>
                  <ShoppingCartOutlined />
                  <span>آیتم‌های فاکتور</span>
                </Space>
              }
            >
              <Table
                dataSource={invoiceData.items}
                rowKey="id"
                pagination={false}
                scroll={{ x: true }}
                size="small"
                columns={[
                  {
                    title: "ردیف",
                    key: "index",
                    width: 60,
                    render: (_, __, index) => index + 1,
                  },
                  {
                    title: "محصول",
                    dataIndex: ["product", "title"],
                    key: "product",
                    render: (title) => title || "نامشخص",
                  },
                  {
                    title: "نوع بسته‌بندی",
                    dataIndex: "pack_type",
                    key: "pack_type",
                    render: (packType) => (
                      <Tag color={packType === "CUT_FLOWER" ? "blue" : "green"}>
                        {packTypeTranslations[packType] || packType}
                      </Tag>
                    ),
                  },
                  {
                    title: "قیمت واحد",
                    dataIndex: "unit_price",
                    key: "unit_price",
                    render: (price) => price ? `${price.toLocaleString()} تومان` : "—",
                    align: "left",
                  },
                  {
                    title: "تعداد",
                    dataIndex: "unit_count",
                    key: "unit_count",
                    render: (count) => count || 0,
                    align: "center",
                  },
                  {
                    title: "مجموع",
                    dataIndex: "line_total",
                    key: "line_total",
                    render: (total) => (
                      <Text strong>
                        {total ? `${total.toLocaleString()} تومان` : "—"}
                      </Text>
                    ),
                    align: "left",
                  },
                  {
                    title: "جزئیات",
                    key: "details",
                    width: 120,
                    render: (_, record) => (
                      <Space direction="vertical" size="small">
                        {record.pack_type === "CUT_FLOWER" && record.flower_total && (
                          <Tooltip title="تعداد گل">
                            <Tag size="small">گل: {record.flower_total}</Tag>
                          </Tooltip>
                        )}
                        {record.carton_barcodes && record.carton_barcodes.length > 0 && (
                          <Tooltip title="بارکدهای کارتن">
                            <Tag size="small">
                              کارتن: {record.carton_barcodes.length}
                            </Tag>
                          </Tooltip>
                        )}
                        {record.unit_serials && record.unit_serials.length > 0 && (
                          <Tooltip title="سریال‌های واحد">
                            <Tag size="small">
                              سریال: {record.unit_serials.length}
                            </Tag>
                          </Tooltip>
                        )}
                      </Space>
                    ),
                  },
                ]}
              />
              {/* مجموع قیمت */}
              <div style={{ marginTop: 16, padding: 16, backgroundColor: "#f6ffed", border: "1px solid #b7eb8f", borderRadius: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: invoiceData.discount_percent || invoiceData.discount_amount || invoiceData.discounted_total ? 8 : 0 }}>
                  <Text strong style={{ fontSize: 16 }}>مجموع قیمت فاکتور:</Text>
                  <Text strong style={{ fontSize: 18, color: "#1677ff" }}>
                    {invoiceData.total_amount ? invoiceData.total_amount.toLocaleString() : (
                      invoiceData.items.reduce((total, item) => {
                        return total + (item.line_total || 0);
                      }, 0) +
                      (invoiceData.single_stems || []).reduce((total, stem) => {
                        return total + (stem.line_total || 0);
                      }, 0)
                    ).toLocaleString()} تومان
                  </Text>
                </div>
                {invoiceData.discount_percent !== null && invoiceData.discount_percent !== undefined && (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8, paddingTop: 8, borderTop: "1px solid #d9f7be" }}>
                    <Text type="secondary" style={{ fontSize: 14 }}>درصد تخفیف:</Text>
                    <Text style={{ fontSize: 14 }}>{invoiceData.discount_percent}%</Text>
                  </div>
                )}
                {invoiceData.discount_amount !== null && invoiceData.discount_amount !== undefined && (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
                    <Text type="secondary" style={{ fontSize: 14 }}>مبلغ تخفیف:</Text>
                    <Text style={{ fontSize: 14 }}>{invoiceData.discount_amount.toLocaleString()} تومان</Text>
                  </div>
                )}
                {invoiceData.discounted_total !== null && invoiceData.discounted_total !== undefined && (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8, paddingTop: 8, borderTop: "2px solid #52c41a" }}>
                    <Text strong style={{ fontSize: 16 }}>مجموع پس از تخفیف:</Text>
                    <Text strong style={{ fontSize: 18, color: "#52c41a" }}>
                      {invoiceData.discounted_total.toLocaleString()} تومان
                    </Text>
                  </div>
                )}
              </div>
            </Card>
          </Col>
        </Row>
      )}

      {/* Single Stems Section */}
      {invoiceData.single_stems && invoiceData.single_stems.length > 0 && (
        <Row gutter={24} style={{ marginTop: 24 }}>
          <Col xs={24}>
            <Card
              title={
                <Space>
                  <ShoppingCartOutlined />
                  <span>فروش‌های شاخه‌ای</span>
                </Space>
              }
            >
              <Table
                dataSource={invoiceData.single_stems}
                rowKey="id"
                pagination={false}
                scroll={{ x: true }}
                size="small"
                columns={[
                  {
                    title: "ردیف",
                    key: "index",
                    width: 60,
                    render: (_, __, index) => index + 1,
                  },
                  {
                    title: "محصول",
                    dataIndex: ["product", "title"],
                    key: "product",
                    render: (title) => title || "نامشخص",
                  },
                  {
                    title: "تنوع",
                    key: "variation",
                    render: (_, record) => {
                      const attrs = record.variation?.attribute_varitation || [];
                      if (attrs.length === 0) return "—";
                      const parts = attrs.map((a) => {
                        const vals = (a.values || []).map((v) => v.name || v.value).join("، ");
                        return `${a.name}: ${vals}`;
                      });
                      return parts.join(" | ");
                    },
                  },
                  {
                    title: "تعداد شاخه",
                    dataIndex: "stems_count",
                    key: "stems_count",
                    align: "center",
                  },
                  {
                    title: "گل در شاخه",
                    dataIndex: "flowers_per_stem",
                    key: "flowers_per_stem",
                    align: "center",
                  },
                  {
                    title: "قیمت واحد",
                    dataIndex: "unit_price",
                    key: "unit_price",
                    render: (price) => price ? `${price.toLocaleString()} تومان` : "—",
                    align: "left",
                  },
                  {
                    title: "مجموع",
                    dataIndex: "line_total",
                    key: "line_total",
                    render: (total) => (
                      <Text strong>
                        {total ? `${total.toLocaleString()} تومان` : "—"}
                      </Text>
                    ),
                    align: "left",
                  },
                  {
                    title: "کارتن‌ها",
                    key: "cartons",
                    width: 150,
                    render: (_, record) => {
                      if (!record.cartons || record.cartons.length === 0) return "—";
                      return (
                        <Space direction="vertical" size="small">
                          {record.cartons.map((carton, idx) => (
                            <Tag key={idx} style={{ direction: 'ltr' }}>
                              {carton.serial_code} ({carton.count})
                            </Tag>
                          ))}
                        </Space>
                      );
                    },
                  },
                ]}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* Shop Manager Information */}
      <Row gutter={24} style={{ marginTop: 24 }}>
        <Col xs={24}>
          <Card
            title={
              <Space>
                <UserOutlined />
                <span>اطلاعات مدیر فروشگاه</span>
              </Space>
            }
          >
            <Descriptions bordered column={{ xs: 1, sm: 1, md: 2 }}>
              <Descriptions.Item label="نام مدیر">
                <Text strong>
                  {invoiceData.shop_manager?.first_name} {invoiceData.shop_manager?.last_name}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="شماره تماس">
                {invoiceData.shop_manager?.mobile || "ثبت نشده"}
              </Descriptions.Item>
              <Descriptions.Item label="ایمیل">
                {invoiceData.shop_manager?.email || "ثبت نشده"}
              </Descriptions.Item>
              {/* <Descriptions.Item label="شرکت">
                {invoiceData.shop_manager?.company_name || "ثبت نشده"}
              </Descriptions.Item> */}
            </Descriptions>
          </Card>
        </Col>
      </Row>

      {/* Creator Information */}
      {invoiceData.creator && (
        <Row gutter={24} style={{ marginTop: 24 }}>
          <Col xs={24}>
            <Card
              title={
                <Space>
                  <UserOutlined />
                  <span>اطلاعات ایجاد کننده</span>
                </Space>
              }
            >
              <Descriptions bordered column={{ xs: 1, sm: 1, md: 2 }}>
                <Descriptions.Item label="نام ایجاد کننده">
                  <Text strong>
                    {invoiceData.creator?.first_name} {invoiceData.creator?.last_name}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="شماره تماس">
                  {invoiceData.creator?.mobile || "ثبت نشده"}
                </Descriptions.Item>
                <Descriptions.Item label="ایمیل">
                  {invoiceData.creator?.email || "ثبت نشده"}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>
        </Row>
      )}

      {/* Snapshot card removed by request; customer information above now uses snapshot data */}
    </div>
  );
};

export default InvoiceShow;