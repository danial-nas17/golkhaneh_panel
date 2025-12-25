import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, Descriptions, Spin, Button, Alert, Typography, Space } from "antd";
import { ArrowLeftOutlined, FileTextOutlined, PrinterOutlined } from "@ant-design/icons";
import api from "../../api";
import UnifiedErrorHandler from "../../utils/unifiedErrorHandler";

const { Title, Text } = Typography;

// Lightweight box detail page by packaging item ID.
// Uses the existing endpoint `/panel/packaging-items/:id/label` that returns labelData
// which includes item, packaging_order, media (barcode_url), etc.
const BoxViewPage = () => {
  const { itemId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/panel/packaging-items/${itemId}/label`);
      setData(res?.data?.data || null);
    } catch (err) {
      UnifiedErrorHandler(err, { context: "BoxViewPage.fetchData" });
      setError(err?.errorData?.decodedMessage || "خطا در دریافت اطلاعات جعبه");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (itemId) fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemId]);

  const item = data?.item || {};
  const order = data?.packaging_order || {};
  const potSummary = data?.pot_summary || {};

  const goToOrder = () => {
    if (order?.id) navigate(`/orders/packaging/${order.id}`);
  };

  const handlePrint = () => {
    // Reuse the single-invoice print already implemented on PackagingOrderDetails via labelData
    try {
      const win = window.open("", "_blank");
      if (!win) return;
      const customerName =
        order?.customer?.first_name && order?.customer?.last_name
          ? `${order.customer.first_name} ${order.customer.last_name}`
          : order?.customer?.first_name || order?.customer?.last_name || "-";
      const orderCode = order?.order_no || `#${data?.packaging_item_id || itemId}`;

      // very small printable summary (fallback printing)
      win.document.write(`<!doctype html><html lang="fa" dir="rtl"><head><meta charset="utf-8"/><title>Label</title></head><body>
        <div style="font-family: Tahoma, Arial; max-width: 380px;">
          <h3>لیبل جعبه</h3>
          <div><b>مشتری:</b> ${customerName}</div>
          <div><b>سفارش:</b> ${orderCode}</div>
          <div><b>شماره جعبه:</b> ${item?.row_no ?? "-"}</div>
          <div><b>نوع بسته‌بندی:</b> ${item?.pack_type ?? "-"}</div>
          ${data?.media?.barcode_url ? `<div style="margin-top:8px;"><img src="${data.media.barcode_url}" style="max-width: 100%;"/></div>` : ""}
        </div>
      </body></html>`);
      win.document.close();
      win.focus();
      win.print();
      setTimeout(() => win.close(), 400);
    } catch {}
  };

  return (
    <div dir="rtl" className="p-4">
      <div className="mb-4">
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
          بازگشت
        </Button>
      </div>

      <Title level={3}>جزییات جعبه</Title>
      <Text type="secondary">شناسه: {itemId}</Text>

      {loading && (
        <div className="flex justify-center items-center min-h-[200px]"><Spin /></div>
      )}

      {error && (
        <Alert type="error" message="خطا" description={error} className="mt-3" />
      )}

      {!loading && data && (
        <>
          <Card className="mt-4" title="اطلاعات سفارش">
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="کد سفارش">{order?.order_no || "-"}</Descriptions.Item>
              <Descriptions.Item label="مشتری">
                {order?.customer?.first_name || order?.customer?.last_name
                  ? `${order?.customer?.first_name || ""} ${order?.customer?.last_name || ""}`
                  : "-"}
              </Descriptions.Item>
              <Descriptions.Item label="وضعیت">{order?.status || "-"}</Descriptions.Item>
            </Descriptions>
            <Space className="mt-3">
              {order?.id && (
                <Button type="primary" icon={<FileTextOutlined />} onClick={goToOrder}>
                  مشاهده سفارش کامل
                </Button>
              )}
              <Button icon={<PrinterOutlined />} onClick={handlePrint}>چاپ خلاصه</Button>
            </Space>
          </Card>

          <Card className="mt-4" title="اطلاعات جعبه">
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="شماره جعبه">{item?.row_no ?? "-"}</Descriptions.Item>
              <Descriptions.Item label="نوع بسته‌بندی">{item?.pack_type ?? "-"}</Descriptions.Item>
              {item?.pack_type === "CUT_FLOWER" && (
                <>
                  <Descriptions.Item label="تعداد شاخه">{item?.total_stems ?? 0}</Descriptions.Item>
                  <Descriptions.Item label="تعداد گل">{item?.total_flowers ?? 0}</Descriptions.Item>
                </>
              )}
              {item?.pack_type === "POTTED_PLANT" && (
                <Descriptions.Item label="تعداد گلدان">
                  {potSummary?.by_variation?.length
                    ? potSummary.by_variation.reduce((s, v) => s + (v?.pot_count || 0), 0)
                    : item?.total_pots || 0}
                </Descriptions.Item>
              )}
            </Descriptions>

            {data?.media?.barcode_url && (
              <div className="mt-4">
                <img
                  src={data.media.barcode_url}
                  alt="barcode"
                  style={{ maxWidth: 280, width: "100%", background: "#fff", padding: 8, borderRadius: 8 }}
                />
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
};

export default BoxViewPage;

