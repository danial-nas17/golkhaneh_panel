import React, { useState, useEffect } from "react";
import {
  Card,
  Button,
  Table,
  Tag,
  Space,
  Typography,
  Spin,
  Row,
  Col,
  Divider,
  Descriptions,
  Badge,
  Input,
  Modal,
  message,
  Popconfirm,
} from "antd";
import {
  ArrowLeftOutlined,
  ShoppingCartOutlined,
  UserOutlined,
  FileTextOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  EditOutlined,
  SearchOutlined,
  PrinterOutlined,
  PlusOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api";
import BoxEditModal from "./boxModal";
import logo from "../../images/1_11zon.jpg";

const { Title, Text, Paragraph } = Typography;

// ---------- تنظیمات ثابت ----------
const COMPANY_LOGO = logo;
// CSS for invoice printing
const A6_PRINT_CSS = `
 @page {
  size: A6;
  margin: 3mm;
}

* {
  -webkit-print-color-adjust: exact !important;
  print-color-adjust: exact !important;
}

body {
  direction: rtl;
  font-family: IRANSans, Vazirmatn, Tahoma, Arial, sans-serif;
  margin: 0;
  padding: 0;
}

.page {
  width: 100%;
  height: calc(148mm - 6mm);
  box-sizing: border-box;
  page-break-after: always;
  display: flex;
  flex-direction: column;
}

.inv-card {
  border: 2px solid #2563eb;
  border-radius: 6px;
  padding: 8px;
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #ffffff;
}

/* Header با لوگو و عنوان */
.inv-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  padding: 4px 0;
  border-bottom: 1px solid #e5e7eb;
}

.inv-logo-container {
  flex: 0 0 auto;
}

.inv-logo {
  height: 25px;
  max-width: 35px;
  object-fit: contain;
}

.inv-title {
  font-size: 14px;
  font-weight: 700;
  color: #1f2937;
  flex: 1;
  text-align: center;
}

.box-no {
  font-weight: 900;
  font-size: 16px;
  color: #dc2626;
  background: #fee2e2;
  padding: 2px 8px;
  border-radius: 4px;
  border: 1px solid #dc2626;
  flex: 0 0 auto;
}

/* اطلاعات مهم - مشتری و سفارش */
.important-info {
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  border: 1px solid #3b82f6;
  border-radius: 4px;
  padding: 6px;
  margin-bottom: 8px;
  text-align: center;
}

.customer-name {
  font-size: 12px;
  font-weight: 800;
  color: #1e40af;
  margin-bottom: 2px;
}

.customer-name:before {
  content: "مشتری: ";
  font-weight: 600;
  color: #374151;
}

.order-code {
  font-size: 11px;
  font-weight: 700;
  color: #059669;
}

.order-code:before {
  content: "سفارش: ";
  font-weight: 600;
  color: #374151;
}

/* بخش محصولات */
.products-section {
  background: #f9fafb;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  padding: 6px;
  margin-bottom: 8px;
  flex: 1;
}

.products-title {
  font-size: 10px;
  font-weight: 700;
  color: #374151;
  margin-bottom: 4px;
  text-align: center;
  border-bottom: 1px dashed #9ca3af;
  padding-bottom: 2px;
}

.products-list {
  margin-bottom: 4px;
}

.product-item {
  font-size: 9px;
  color: #1f2937;
  margin-bottom: 2px;
  padding: 2px 4px;
  background: white;
  border-radius: 3px;
  border: 1px solid #e5e7eb;
}

.total-summary {
  font-size: 10px;
  font-weight: 800;
  color: #dc2626;
  text-align: center;
  background: #fef2f2;
  border: 1px solid #fca5a5;
  border-radius: 3px;
  padding: 3px;
}

/* جدول اطلاعات اضافی */
.extra-info {
  margin-bottom: 8px;
}

.info-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 9px;
}

.info-table td {
  border: 1px solid #d1d5db;
  padding: 3px 4px;
}

.info-label {
  background: #f3f4f6;
  font-weight: 600;
  color: #374151;
  width: 35%;
  text-align: right;
}

.info-value {
  background: white;
  color: #1f2937;
  font-weight: 500;
}

/* Barcode */
.barcode-box {
  margin-top: auto;
  text-align: center;
  padding: 4px 0;
  border-top: 1px solid #e5e7eb;
}

.barcode-img {
  width: 80%;
  max-width: 50mm;
  height: 8mm;
  object-fit: contain;
  margin: 0 auto 2px auto;
  display: block;
}

.serial {
  font-size: 8px;
  font-weight: 700;
  letter-spacing: 0.5px;
  color: #374151;
  word-break: break-all;
}
`;

// CSS for label printing
const ROWID_PRINT_CSS = `
  @page { size: A6; margin: 5mm; }
  body { direction: rtl; font-family: IRANSans, Vazirmatn, Tahoma, Arial, sans-serif; }
  * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
  .page { width: 100%; min-height: calc(148mm - 10mm); box-sizing: border-box; }
  .grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10mm;
    justify-content: center;
    align-items: center;
  }
  .sticker {
    width: 50mm;
    height: 50mm;
    border: 1px dashed #111827;
    border-radius: 6px;
    display:flex;
    align-items:center;
    justify-content:center;
  }
  .num {
    font-size: 22mm;
    font-weight: 800;
    line-height: 1;
  }
`;

const PackagingOrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedBoxId, setSelectedBoxId] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [filteredItems, setFilteredItems] = useState([]);
  const [addBoxModalVisible, setAddBoxModalVisible] = useState(false);

  // For printing
  const [completePrintData, setCompletePrintData] = useState(null);
  const [showInvoicePreview, setShowInvoicePreview] = useState(false);
  const [invoiceHTML, setInvoiceHTML] = useState("");
  const [deleteReasonModalVisible, setDeleteReasonModalVisible] = useState(false);
const [deleteTargetId, setDeleteTargetId] = useState(null);
const [deleteReason, setDeleteReason] = useState('');

const openDeleteReasonModal = (boxId) => {
  setDeleteTargetId(boxId);
  setDeleteReason('');
  setDeleteReasonModalVisible(true);
};



  useEffect(() => {
    if (id) {
      fetchOrderDetails();
    }
  }, [id]);

  useEffect(() => {
    if (orderData?.items) {
      filterItems();
    }
  }, [orderData, searchText]);

  const getVoidStatus = (item) => {
    if (item.is_void) return { key: "VOID", text: "باطل‌شده", color: "red" };
    if (item.cancel_status_pending)
      return { key: "PENDING", text: "در انتظار ابطال", color: "orange" };
    return { key: "NORMAL", text: "عادی", color: "default" };
  };

  const fetchOrderDetails = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/panel/packaging-orders/${id}`, {
        params: {
          includes: ["items"],
        },
      });
      setOrderData(response.data.data);
    } catch (error) {
      console.error("Error fetching order details:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterItems = () => {
    if (!orderData?.items) return;

    if (!searchText.trim()) {
      setFilteredItems(orderData.items);
      return;
    }

    const filtered = orderData.items.filter((item) => {
      const searchLower = searchText.toLowerCase();
      return (
        item.id.toString().includes(searchLower) ||
        item.row_no?.toString().includes(searchLower) ||
        item.product?.title?.toLowerCase().includes(searchLower) ||
        item.qc_controller?.toLowerCase().includes(searchLower) ||
        getPackTypeText(item.pack_type).toLowerCase().includes(searchLower)
      );
    });
    setFilteredItems(filtered);
  };

  const openEditModal = (boxId) => {
    setSelectedBoxId(boxId);
    setEditModalVisible(true);
  };

  const handleBoxUpdated = () => {
    fetchOrderDetails(); // Refresh the order data
    setEditModalVisible(false);
    setSelectedBoxId(null);
  };

  const handlePrintLabel = async (record) => {
    try {
      const n = String(record.row_no ?? "");
      const printContent = `
        <!doctype html>
        <html lang="fa" dir="rtl">
          <head>
            <meta charset="utf-8"/>
            <title>پرینت برچسب ردیف</title>
            <style>${ROWID_PRINT_CSS}</style>
          </head>
          <body>
            <div class="page">
              <div class="grid">
                <div class="sticker"><div class="num">${n}</div></div>
                <div class="sticker"><div class="num">${n}</div></div>
              </div>
            </div>
          </body>
        </html>
      `;

      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();

        setTimeout(() => {
          printWindow.close();
        }, 1000);
      } else {
        message.error(
          "پنجره پرینت باز نشد. لطفا popup blocker را غیرفعال کنید."
        );
      }
    } catch (error) {
      console.error("Error printing label:", error);
      message.error("خطا در پرینت لیبل");
    }
  };

  const handlePrintInvoice = async (record) => {
    try {
      // Get label data from API
      const response = await api.get(
        `/panel/packaging-items/${record.id}/label`
      );
      const labelData = response.data.data;

      // Build invoice using label data
      const invoiceContent = buildSingleInvoiceFromLabel(labelData);

      const fullHTML = `
        <!doctype html>
        <html lang="fa" dir="rtl">
          <head>
            <meta charset="utf-8"/>
            <title>چاپ فاکتور</title>
            <style>${A6_PRINT_CSS}</style>
          </head>
          <body>
            ${invoiceContent}
          </body>
        </html>
      `;

      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(fullHTML);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();

        setTimeout(() => {
          printWindow.close();
        }, 1000);
      } else {
        message.error(
          "پنجره پرینت باز نشد. لطفا popup blocker را غیرفعال کنید."
        );
      }
    } catch (error) {
      console.error("Error printing invoice:", error);
      message.error("خطا در پرینت فاکتور");
    }
  };

const handleDeleteBox = async (boxId, reason) => {
  try {
    if (!reason || !reason.trim()) {
      message.warning("لطفاً دلیل حذف را وارد کنید.");
      return;
    }

    await api.delete(`/panel/items/${boxId}`, {
      data: { reason: reason.trim() }
    });

    message.success("جعبه با موفقیت حذف شد");
    fetchOrderDetails();
  } catch (error) {
    console.error("Error deleting box:", error);
    message.error("خطا در حذف جعبه");
  }
};


  // --- چاپ داخل iframe (حل مشکل popup) ---
  const printInIframe = (html) => {
    const iframe = document.createElement("iframe");
    Object.assign(iframe.style, {
      position: "fixed",
      right: 0,
      bottom: 0,
      width: "0",
      height: "0",
      border: "0",
    });
    document.body.appendChild(iframe);

    let cleaned = false;
    const cleanup = () => {
      if (cleaned) return;
      cleaned = true;
      try {
        iframe.removeEventListener("load", onLoad);
        const w = iframe.contentWindow;
        if (w && "removeEventListener" in w) {
          w.removeEventListener("afterprint", cleanup);
        }
      } catch {}
      try {
        if (iframe && iframe.parentNode) {
          iframe.parentNode.removeChild(iframe);
        }
      } catch {}
    };

    const onLoad = () => {
      const w = iframe.contentWindow;
      if (!w) return cleanup();
      // یک ذره صبر تا محتوا کامل رندر شود
      setTimeout(() => {
        try {
          w.focus();
          w.print();
        } catch {}
      }, 100);
      // بعد از چاپ تمیزکاری کن
      w.addEventListener("afterprint", cleanup, { once: true });
      // fallback اگر afterprint در بعضی مرورگرها نیامد
      setTimeout(cleanup, 4000);
    };

    iframe.addEventListener("load", onLoad, { once: true });

    if ("srcdoc" in iframe) {
      iframe.srcdoc = html;
    } else {
      const doc = iframe.contentWindow || iframe.contentDocument;
      const iDoc = doc.document || doc;
      iDoc.open();
      iDoc.write(html);
      iDoc.close();
    }
  };

  const handlePrintAllInvoices = async () => {
    try {
      message.loading({
        content: "در حال دریافت اطلاعات فاکتورها...",
        key: "print",
      });

      const response = await api.get(`/panel/packaging-orders/${id}/labels`);
      const labelsData = response?.data?.data || [];

      if (labelsData.length === 0) {
        message.warning("اطلاعات فاکتور برای این سفارش موجود نیست");
        return;
      }

      const html = buildBatchInvoiceHTML(orderData, labelsData);
      setInvoiceHTML(html);
      setShowInvoicePreview(true);

      message.success({
        content: "پیش‌نمایش فاکتورها آماده است.",
        key: "print",
      });
    } catch (e) {
      console.error(e);
      message.error({
        content: "خطا در دریافت اطلاعات فاکتورها",
        key: "print",
      });
    }
  };

  const buildInvoiceHTML = (orderInfoArg, items) => {
    // Use the new batch format for consistency
    return buildBatchInvoiceHTML(orderInfoArg, items);
  };

  const buildBatchInvoiceHTML = (orderInfoArg, labelsData) => {
    const customerName =
      orderInfoArg?.customer?.first_name && orderInfoArg?.customer?.last_name
        ? `${orderInfoArg.customer.first_name} ${orderInfoArg.customer.last_name}`
        : orderInfoArg?.customer?.first_name ||
          orderInfoArg?.customer?.last_name ||
          "نامشخص";
    const orderCode = orderInfoArg?.order_no || `#${id}`;

    const getPackTypeFa = (t) =>
      t === "POTTED_PLANT"
        ? "گلدان"
        : t === "CUT_FLOWER"
        ? "شاخه بریده"
        : "نامشخص";

    const htmlPages = labelsData
      .map((label) => {
        const item = label.item || {};
        const printMeta = label.print_meta || {};
        const potSummary = label.pot_summary || {};

        // شماره جعبه ساده (فقط عدد)
        const boxNo = label.item.row_no;
        const number = printMeta.sequence_no;
        const boxTotal = printMeta.sequence_total || "1";

        // ساخت لیست محصولات
        let productDetails = "";
        let totalItems = 0;

        if (item.pack_type === "POTTED_PLANT" && potSummary.by_variation) {
          // برای گلدان از pot_summary استفاده می‌کنیم
          const variations = potSummary.by_variation;
          productDetails = variations
            .map((variation) => {
              totalItems += variation.pot_count;
              return `<div class="product-item">• ${variation.product_title}: ${variation.pot_count} گلدان</div>`;
            })
            .join("");
        } else if (item.pack_type === "CUT_FLOWER") {
          // برای شاخه بریده
          const productName = item.product || "محصول نامشخص";
          const stems = item.total_stems || 0;
          const flowers = item.total_flowers || 0;
          totalItems = flowers;
          productDetails = `<div class="product-item">• ${productName}: ${stems} شاخه (${flowers} گل)</div>`;
        }

        return `
    <div class="page">
      <div class="inv-card">

       <!-- Header -->
        <div class="inv-head">
          <div class="inv-logo-container">
            <img class="inv-logo" src="${COMPANY_LOGO}" alt="لوگو شرکت" />
          </div>
          <div class="inv-title">فاکتور</div>
          <div class="box-no">${boxNo}</div>
        </div>

        <!-- مشتری و سفارش (برجسته) -->
        <div class="important-info">
          <div class="customer-name">${customerName}</div>
          <div class="order-code">${orderCode}</div>
        </div>

        <!-- جزییات محصولات -->
        <div class="products-section">
          <div class="products-title">جزییات محصولات:</div>
          <div class="products-list">
            ${productDetails}
          </div>
          <div class="total-summary">
            مجموع: ${totalItems} ${
          item.pack_type === "POTTED_PLANT" ? "گلدان" : "گل"
        }
          </div>
        </div>

        <!-- اطلاعات اضافی -->
        <div class="extra-info">
          <table class="info-table">
            <tr>
              <td class="info-label">اپراتور:</td>
              <td class="info-value">${item.qc_controller || "-"}</td>
            </tr>
            <tr>
              <td class="info-label">تاریخ:</td>
              <td class="info-value">${item.packaged_at || ""}</td>
            </tr>
            <tr>
              <td class="info-label">جعبه:</td>
              <td class="info-value">${number} از ${boxTotal}</td>
            </tr>
          </table>
        </div>

        <!-- Barcode -->
        <div class="barcode-box">
          <img class="barcode-img" src="${
            label.media?.barcode_url || ""
          }" onerror="this.style.display='none'"/>
          <div class="serial">${label.serial_code || ""}</div>
        </div>
      </div>
    </div>
  `;
      })
      .join("\n");

    return `
      <!doctype html>
      <html lang="fa" dir="rtl">
        <head>
          <meta charset="utf-8"/>
          <title>چاپ فاکتورها</title>
          <style>${A6_PRINT_CSS}</style>
        </head>
        <body>
          ${htmlPages}
        </body>
      </html>
    `;
  };

  const buildSingleInvoiceFromLabel = (labelData) => {
    const customerName =
      labelData.packaging_order?.customer?.first_name &&
      labelData.packaging_order?.customer?.last_name
        ? `${labelData.packaging_order.customer.first_name} ${labelData.packaging_order.customer.last_name}`
        : labelData.packaging_order?.customer?.first_name ||
          labelData.packaging_order?.customer?.last_name ||
          "نامشخص";
    const orderCode =
      labelData.packaging_order?.order_no || `#${labelData.packaging_item_id}`;

    const item = labelData.item || {};
    const printMeta = labelData.print_meta || {};
    const potSummary = labelData.pot_summary || {};

    // شماره جعبه ساده (فقط عدد)
    const boxNo = printMeta.sequence_no || "1";
    const boxTotal = printMeta.sequence_total || "1";

    // ساخت لیست محصولات
    let productDetails = "";
    let totalItems = 0;

    if (item.pack_type === "POTTED_PLANT" && potSummary.by_variation) {
      // برای گلدان از pot_summary استفاده می‌کنیم
      const variations = potSummary.by_variation;
      productDetails = variations
        .map((variation) => {
          totalItems += variation.pot_count;
          return `<div class="product-item">• ${variation.product_title}: ${variation.pot_count} گلدان</div>`;
        })
        .join("");
    } else if (item.pack_type === "CUT_FLOWER") {
      // برای شاخه بریده
      const productName = item.product || "محصول نامشخص";
      const stems = item.total_stems || 0;
      const flowers = item.total_flowers || 0;
      totalItems = flowers;
      productDetails = `<div class="product-item">• ${productName}: ${stems} شاخه (${flowers} گل)</div>`;
    }

    return `
    <div class="page">
      <div class="inv-card">

       <!-- Header -->
        <div class="inv-head">
          <div class="inv-logo-container">
            <img class="inv-logo" src="${COMPANY_LOGO}" alt="لوگو شرکت" />
          </div>
          <div class="inv-title">فاکتور</div>
          <div class="box-no">${boxNo}</div>
        </div>

        <!-- مشتری و سفارش (برجسته) -->
        <div class="important-info">
          <div class="customer-name">${customerName}</div>
          <div class="order-code">${orderCode}</div>
        </div>

        <!-- جزییات محصولات -->
        <div class="products-section">
          <div class="products-title">جزییات محصولات:</div>
          <div class="products-list">
            ${productDetails}
          </div>
          <div class="total-summary">
            مجموع: ${totalItems} ${
      item.pack_type === "POTTED_PLANT" ? "گلدان" : "گل"
    }
          </div>
        </div>

        <!-- اطلاعات اضافی -->
        <div class="extra-info">
          <table class="info-table">
            <tr>
              <td class="info-label">اپراتور:</td>
              <td class="info-value">${item.qc_controller || "-"}</td>
            </tr>
            <tr>
              <td class="info-label">تاریخ:</td>
              <td class="info-value">${item.packaged_at || ""}</td>
            </tr>
            <tr>
              <td class="info-label">جعبه:</td>
              <td class="info-value">${boxNo} از ${boxTotal}</td>
            </tr>
          </table>
        </div>

        <!-- Barcode -->
        <div class="barcode-box">
          <img class="barcode-img" src="${
            labelData.media?.barcode_url || ""
          }" onerror="this.style.display='none'"/>
          <div class="serial">${labelData.serial_code || ""}</div>
        </div>
      </div>
    </div>
  `;
  };

  const buildSingleInvoiceHTML = (record) => {
    const customerName = orderData?.customer?.first_name || "نامشخص";
    const orderCode = `#${id}`;

    const getPackTypeFa = (t) =>
      t === "POTTED_PLANT"
        ? "گلدان"
        : t === "CUT_FLOWER"
        ? "شاخه بریده"
        : "نامشخص";

    // شماره جعبه ساده (فقط عدد)
    const boxNo = "1";
    const boxTotal = "1";

    // ساخت لیست محصولات
    let productDetails = "";
    let totalItems = 0;

    if (record.pack_type === "POTTED_PLANT") {
      // برای گلدان از اطلاعات موجود استفاده می‌کنیم
      const productName = record.product?.title || "محصول نامشخص";
      const pots = record.total_pots || 0;
      totalItems = pots;
      productDetails = `<div class="product-item">• ${productName}: ${pots} گلدان</div>`;
    } else if (record.pack_type === "CUT_FLOWER") {
      // برای شاخه بریده
      const productName = record.product?.title || "محصول نامشخص";
      const stems = record.total_stems || 0;
      const flowers = record.total_flowers || 0;
      totalItems = flowers;
      productDetails = `<div class="product-item">• ${productName}: ${stems} شاخه (${flowers} گل)</div>`;
    }

    return `
    <div class="page">
      <div class="inv-card">

       <!-- Header -->
        <div class="inv-head">
          <div class="inv-logo-container">
            <img class="inv-logo" src="${COMPANY_LOGO}" alt="لوگو شرکت" />
          </div>
          <div class="inv-title">فاکتور</div>
          <div class="box-no">${boxNo}</div>
        </div>

        <!-- مشتری و سفارش (برجسته) -->
        <div class="important-info">
          <div class="customer-name">${customerName}</div>
          <div class="order-code">${orderCode}</div>
        </div>

        <!-- جزییات محصولات -->
        <div class="products-section">
          <div class="products-title">جزییات محصولات:</div>
          <div class="products-list">
            ${productDetails}
          </div>
          <div class="total-summary">
            مجموع: ${totalItems} ${
      record.pack_type === "POTTED_PLANT" ? "گلدان" : "گل"
    }
          </div>
        </div>

        <!-- اطلاعات اضافی -->
        <div class="extra-info">
          <table class="info-table">
            <tr>
              <td class="info-label">اپراتور:</td>
              <td class="info-value">${record.qc_controller || "-"}</td>
            </tr>
            <tr>
              <td class="info-label">تاریخ:</td>
              <td class="info-value">${record.packaged_at || ""}</td>
            </tr>
            <tr>
              <td class="info-label">جعبه:</td>
              <td class="info-value">${boxNo} از ${boxTotal}</td>
            </tr>
          </table>
        </div>

        <!-- Barcode -->
        <div class="barcode-box">
          <div class="serial">${record.serial_code || ""}</div>
        </div>
      </div>
    </div>
  `;
  };

  const getStatusColor = (status) => {
    const colors = {
      OPEN: "blue",
      CLOSED: "green",
      CANCELLED: "red",
      COMPLETED: "green",
    };
    return colors[status] || "default";
  };

  const getStatusText = (status) => {
    const texts = {
      OPEN: "باز",
      CLOSED: "بسته",
      CANCELLED: "لغو شده",
      COMPLETED: "تکمیل شده",
    };
    return texts[status] || status;
  };

  const getPackTypeText = (packType) => {
    const types = {
      POTTED_PLANT: "گلدان",
      CUT_FLOWER: "شاخه بریده",
    };
    return types[packType] || packType;
  };

  const getPackTypeColor = (packType) => {
    const colors = {
      POTTED_PLANT: "green",
      CUT_FLOWER: "blue",
    };
    return colors[packType] || "default";
  };

  const itemColumns = [
    {
      title: "جعبه",
      dataIndex: "row_no",
      key: "row_no",
      width: 80,
    },
    {
      title: "نوع بسته‌بندی",
      dataIndex: "pack_type",
      key: "pack_type",
      render: (packType) => (
        <Tag color={getPackTypeColor(packType)}>
          {getPackTypeText(packType)}
        </Tag>
      ),
    },
    {
      title: "وضعیت ابطال",
      key: "void_status",
      dataIndex: "void_status",
      render: (_, record) => {
        const s = getVoidStatus(record);
        return <Tag color={s.color}>{s.text}</Tag>;
      },
      filters: [
        { text: "باطل‌شده", value: "VOID" },
        { text: "در انتظار ابطال", value: "PENDING" },
        { text: "عادی", value: "NORMAL" },
      ],
      onFilter: (value, record) => getVoidStatus(record).key === value,
      width: 130,
    },

    {
      title: "محصول",
      dataIndex: "product",
      key: "product",
      render: (product) => (product ? product.title : "-"),
    },
    {
      title: "تنوع",
      dataIndex: "product_variation_id",
      key: "product_variation_id",
      render: (variation) => {
        if (!variation) return "-";
        if (typeof variation === "object" && variation.SKU) {
          return variation.SKU;
        }
        return variation;
      },
    },
    {
      title: "تعداد گلدان",
      dataIndex: "total_pots",
      key: "total_pots",
      render: (pots) => (pots > 0 ? pots : "-"),
    },

    {
      title: "تعداد شاخه",
      dataIndex: "total_stems",
      key: "total_stems",
      render: (stems) => (stems > 0 ? stems : "-"),
    },
    {
      title: "تعداد گل",
      dataIndex: "total_flowers",
      key: "total_flowers",
      render: (flowers) => (flowers > 0 ? flowers : "-"),
    },
    {
      title: "کنترل کننده کیفیت",
      dataIndex: "qc_controller",
      key: "qc_controller",
    },
    {
      title: "تاریخ بسته‌بندی",
      dataIndex: "packaged_at",
      key: "packaged_at",
    },
   {
  title: 'عملیات',
  key: 'actions',
  width: 200,
  render: (_, record) => (
    <Space>
      <Button
        type="primary"
        size="small"
        icon={<EditOutlined />}
        onClick={() => openEditModal(record.id)}
        disabled={record.is_void} // ✅ به‌جای isVoid
      >
        ویرایش
      </Button>

      <Button
        size="small"
        icon={<PrinterOutlined />}
        onClick={() => handlePrintLabel(record)}
        disabled={record.is_void} // ✅
      >
        پرینت لیبل
      </Button>

      <Button
        size="small"
        icon={<PrinterOutlined />}
        onClick={() => handlePrintInvoice(record)}
        disabled={record.is_void} // ✅
      >
        پرینت فاکتور
      </Button>

      <Button
        danger
        size="small"
        icon={<DeleteOutlined />}
        onClick={() => openDeleteReasonModal(record.id)}
        disabled={record.is_void} // ✅
      >
        حذف
      </Button>
    </Space>
  ),
}

  ];

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

  if (!orderData) {
    return (
      <div style={{ textAlign: "center", padding: "50px" }}>
        <Text type="danger">خطا در دریافت اطلاعات سفارش</Text>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "24px",
        backgroundColor: "#f5f7fa",
        minHeight: "100vh",
      }}
    >
      {/* Header */}
      <Card style={{ marginBottom: 24 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Space>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate("/orders")}
            >
              بازگشت به لیست سفارشات
            </Button>
            <Title level={4} style={{ margin: 0 }}>
              جزئیات سفارش بسته‌بندی - #{orderData.id}
            </Title>
          </Space>
          <Badge
            status={orderData.status === "OPEN" ? "processing" : "success"}
            text={
              <Tag color={getStatusColor(orderData.status)}>
                {getStatusText(orderData.status)}
              </Tag>
            }
          />
        </div>
      </Card>

      {/* Order Information */}
      <Row gutter={24}>
        <Col span={24}>
          <Card
            title={
              <Space>
                <ShoppingCartOutlined />
                <span>اطلاعات سفارش</span>
              </Space>
            }
          >
            <Descriptions bordered column={2}>
              <Descriptions.Item label="شماره سفارش">
                <Text strong>{orderData.order_no || `#${orderData.id}`}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="وضعیت">
                <Tag color={getStatusColor(orderData.status)}>
                  {getStatusText(orderData.status)}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="تعداد جعبه موجود در سفارش">
                <Text strong>{orderData.count_item}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="تاریخ ایجاد">
                {orderData.created_at}
              </Descriptions.Item>
              <Descriptions.Item label="تاریخ تکمیل" span={2}>
                {orderData.completed_at || "هنوز تکمیل نشده"}
              </Descriptions.Item>
              <Descriptions.Item label="یادداشت" span={2}>
                <Paragraph ellipsis={{ rows: 2, expandable: true }}>
                  {orderData.notes || "بدون یادداشت"}
                </Paragraph>
              </Descriptions.Item>
            </Descriptions>
            <div style={{ marginTop: 16, textAlign: "left" }}>
              <Space>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => setAddBoxModalVisible(true)}
                  style={{ borderRadius: 8, fontWeight: 600 }}
                >
                  افزودن جعبه جدید
                </Button>
                <Button
                  type="primary"
                  icon={<PrinterOutlined />}
                  onClick={handlePrintAllInvoices}
                  style={{ borderRadius: 8, fontWeight: 600 }}
                >
                  پرینت کلی فاکتورها
                </Button>
              </Space>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Customer Information */}
      <Row gutter={24} style={{ marginTop: 24 }}>
        <Col span={24}>
          <Card
            title={
              <Space>
                <UserOutlined />
                <span>اطلاعات مشتری</span>
              </Space>
            }
          >
            <Descriptions bordered column={2}>
              <Descriptions.Item label="نام مشتری">
                <Text strong>
                  {orderData.customer?.first_name &&
                  orderData.customer?.last_name
                    ? `${orderData.customer.first_name} ${orderData.customer.last_name}`
                    : orderData.customer?.first_name ||
                      orderData.customer?.last_name ||
                      "نامشخص"}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="شماره تماس">
                {orderData.customer?.mobile || "ثبت نشده"}
              </Descriptions.Item>
              <Descriptions.Item label="ایمیل">
                {orderData.customer?.email || "ثبت نشده"}
              </Descriptions.Item>
              <Descriptions.Item label="کد مشتری">
                {orderData.customer?.id || "ثبت نشده"}
              </Descriptions.Item>
              <Descriptions.Item label="آدرس" span={2}>
                {orderData.customer?.address || "ثبت نشده"}
              </Descriptions.Item>
              <Descriptions.Item label="شهر">
                {orderData.customer?.city || "ثبت نشده"}
              </Descriptions.Item>
              <Descriptions.Item label="استان">
                {orderData.customer?.state || "ثبت نشده"}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
      </Row>

      {/* Order Items */}
      <Row gutter={24} style={{ marginTop: 24 }}>
        <Col span={24}>
          <Card
            title={
              <Space>
                <CheckCircleOutlined />
                <span>آیتم‌های سفارش ({orderData.items?.length || 0})</span>
              </Space>
            }
            extra={
              <Input
                placeholder="جستجوی جعبه..."
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={{ width: 250 }}
                allowClear
              />
            }
          >
            <Table
              columns={itemColumns}
              dataSource={filteredItems}
              rowKey="id"
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} از ${total} جعبه`,
              }}
              scroll={{ x: true }}
              size="small"
            />
          </Card>
        </Col>
      </Row>

      {/* Summary Statistics */}
      {orderData.items && orderData.items.length > 0 && (
        <Row gutter={24} style={{ marginTop: 24 }}>
          <Col span={24}>
            <Card title="آمار کلی">
              <Row gutter={16}>
                <Col span={6}>
                  <div style={{ textAlign: "center" }}>
                    <Title level={3} style={{ color: "#1890ff" }}>
                      {
                        orderData.items.filter(
                          (item) => item.pack_type === "POTTED_PLANT"
                        ).length
                      }
                    </Title>
                    <Text>آیتم گلدان</Text>
                  </div>
                </Col>
                <Col span={6}>
                  <div style={{ textAlign: "center" }}>
                    <Title level={3} style={{ color: "#52c41a" }}>
                      {
                        orderData.items.filter(
                          (item) => item.pack_type === "CUT_FLOWER"
                        ).length
                      }
                    </Title>
                    <Text>آیتم شاخه بریده</Text>
                  </div>
                </Col>
                <Col span={6}>
                  <div style={{ textAlign: "center" }}>
                    <Title level={3} style={{ color: "#722ed1" }}>
                      {orderData.items.reduce(
                        (sum, item) => sum + (item.total_pots || 0),
                        0
                      )}
                    </Title>
                    <Text>مجموع گلدان‌ها</Text>
                  </div>
                </Col>
                <Col span={6}>
                  <div style={{ textAlign: "center" }}>
                    <Title level={3} style={{ color: "#eb2f96" }}>
                      {orderData.items.reduce(
                        (sum, item) => sum + (item.total_stems || 0),
                        0
                      )}
                    </Title>
                    <Text>مجموع شاخه‌ها</Text>
                  </div>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>
      )}

      {/* Box Edit Modal */}
      <BoxEditModal
        visible={editModalVisible}
        boxId={selectedBoxId}
        onCancel={() => {
          setEditModalVisible(false);
          setSelectedBoxId(null);
        }}
        onUpdated={handleBoxUpdated}
      />

      {/* Add New Box Modal */}
      <Modal
        title="افزودن جعبه جدید"
        open={addBoxModalVisible}
        onCancel={() => setAddBoxModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setAddBoxModalVisible(false)}>
            انصراف
          </Button>,
          <Button
            key="create"
            type="primary"
            onClick={() => {
              navigate(`/orders/manual/${id}`);
              setAddBoxModalVisible(false);
            }}
          >
            ایجاد جعبه جدید
          </Button>,
        ]}
        width={500}
      >
        <div style={{ textAlign: "center", padding: "20px" }}>
          <p>
            برای افزودن جعبه جدید به این سفارش، به صفحه ایجاد دستی سفارش هدایت
            خواهید شد.
          </p>
          <p style={{ marginTop: 16, color: "#666" }}>
            در آن صفحه می‌توانید جعبه‌های جدید را به سفارش موجود اضافه کنید.
          </p>
        </div>
      </Modal>

      {/* Modal پیش‌نمایش فاکتورها */}
      <Modal
        title="پیش‌نمایش فاکتورهای سفارش (A6)"
        open={showInvoicePreview}
        onCancel={() => setShowInvoicePreview(false)}
        footer={[
          <Button key="cancel" onClick={() => setShowInvoicePreview(false)}>
            بستن
          </Button>,
          <Button
            key="print"
            type="primary"
            icon={<PrinterOutlined />}
            onClick={() => printInIframe(invoiceHTML)}
          >
            چاپ فاکتورها
          </Button>,
        ]}
        width={900}
      >
        <iframe
          title="invoice-preview"
          style={{
            width: "100%",
            height: "70vh",
            border: "1px solid #eee",
            borderRadius: 8,
          }}
          srcDoc={invoiceHTML}
        />
      </Modal>
      <Modal
  title="حذف جعبه - ثبت دلیل"
  open={deleteReasonModalVisible}
  onCancel={() => setDeleteReasonModalVisible(false)}
  onOk={() => {
    const id = deleteTargetId;
    const reason = deleteReason;
    setDeleteReasonModalVisible(false);
    handleDeleteBox(id, reason);
  }}
  okText="حذف"
  okButtonProps={{ danger: true }}
  cancelText="انصراف"
  destroyOnClose
>
  <p style={{ marginBottom: 8 }}>لطفاً دلیل حذف این جعبه را وارد کنید:</p>
  <Input.TextArea
    value={deleteReason}
    onChange={(e) => setDeleteReason(e.target.value)}
    placeholder="مثلاً: ثبت اشتباه، داده‌های ناقص، تست..."
    autoSize={{ minRows: 3, maxRows: 6 }}
    allowClear
  />
</Modal>

    </div>
  );
};

export default PackagingOrderDetails;
