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
import axios from "axios";
import UnifiedErrorHandler from "../../utils/unifiedErrorHandler";
import BoxEditModal from "./boxModal";
import logo from "../../images/1_11zon.jpg";

const { Title, Text, Paragraph } = Typography;

// ---------- تنظیمات ثابت ----------
const COMPANY_LOGO = logo;
// CSS for invoice printing
const A6_PRINT_CSS = `
 @page { size: A6; margin: 5mm; }
 * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
 body { direction: rtl; font-family: IRANSans, Vazirmatn, Tahoma, Arial, sans-serif; margin: 0; padding: 0; }
 .page { width: 100%; min-height: calc(148mm - 10mm); box-sizing: border-box; page-break-after: always; display: flex; }
 .inv { border: 2px solid #2563eb; border-radius: 8px; padding: 10px; display: flex; flex-direction: column; width: 100%; background: #fff; }

 /* Header */
 .inv__head { display:flex; align-items:center; justify-content:space-between; border-bottom:1px solid #e5e7eb; padding-bottom:6px; margin-bottom:8px; }
 .inv__logo img { height: 50px; max-width: 70px; object-fit: contain; }
 .inv__title { font-size:14px; font-weight:800; color:#1f2937; }
 .inv__boxno { font-weight:900; font-size:16px; color:#dc2626; background:#fee2e2; padding:2px 8px; border-radius:6px; border:1px solid #dc2626; }

 /* Info strip */
 .strip { display:grid; grid-template-columns: 1fr; gap:6px; margin-bottom:8px; }
 .chip { background:#f3f4f6; border:1px solid #e5e7eb; border-radius:6px; padding:6px; font-size:11px; }
 .chip b { color:#374151; margin-left:4px; }

 /* Counters row */
 .counters { display:grid; grid-template-columns: 1fr 1fr; gap:6px; margin-bottom:8px; }
 .counter { background:#eef2ff; border:1px solid #c7d2fe; border-radius:6px; padding:6px; text-align:center; }
 .counter__label { font-size:11px; color:#374151; }
 .counter__val { font-size:13px; font-weight:800; color:#111827; }

 /* List box */
 .listBox { background:#f9fafb; border:1px solid #e5e7eb; border-radius:6px; padding:6px; margin-bottom:8px; }
 .listBox__title { font-size:11px; font-weight:700; color:#374151; margin-bottom:4px; border-bottom:1px dashed #e5e7eb; padding-bottom:4px; text-align:center; }
 .listBox__item { font-size:10px; padding:3px 6px; background:#fff; border:1px solid #f3f4f6; border-radius:4px; margin-bottom:4px; }

 /* Footer meta */
 .meta { margin-top:auto; border-top:1px dashed #e5e7eb; padding-top:6px; }
 .meta__tbl { width:100%; border-collapse:collapse; font-size:10px; }
 .meta__tbl td { border:1px solid #e5e7eb; padding:4px 6px; }
 .meta__lbl { background:#f3f4f6; font-weight:600; color:#374151; width:35%; }
 .meta__val { background:#fff; color:#1f2937; }

 .pager { text-align:center; font-size:11px; font-weight:800; color:#111827; margin-top:6px; }

 /* ✅ بخش بارکد—دقیقاً مثل قبل نگه داشته شده */
 .barcode-box {
   margin-top: 6px;
   text-align: center;
   padding: 4px 0;
   border-top: 1px solid #e5e7eb;
 }
.barcode-img {
  width: 100%;
  max-width: 80mm;
  height: 16mm;
  object-fit: contain;
  margin: 0 auto 6px auto;
  display: block;
}
 .serial {
  font-size: 9px;
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
  const [completingOrder, setCompletingOrder] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 25,
    total: 0,
  });

  // For printing
  const [completePrintData, setCompletePrintData] = useState(null);
  const [showInvoicePreview, setShowInvoicePreview] = useState(false);
  const [invoiceHTML, setInvoiceHTML] = useState("");
  const [deleteReasonModalVisible, setDeleteReasonModalVisible] =
    useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [deleteReason, setDeleteReason] = useState("");

  // برای انتخاب لوگو قبل از پرینت
  const [logoConfirmModalVisible, setLogoConfirmModalVisible] = useState(false);
  const [pendingPrintAction, setPendingPrintAction] = useState(null); // { type: 'single' | 'batch', data: ... }

  const openDeleteReasonModal = (boxId) => {
    setDeleteTargetId(boxId);
    setDeleteReason("");
    setDeleteReasonModalVisible(true);
  };

  const debounce = (func, wait) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  };

  const debouncedSearch = debounce((value) => {
    setPagination((prev) => ({ ...prev, current: 1 }));
    fetchOrderDetails(1, pagination.pageSize, value);
  }, 500);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchText(value);
    debouncedSearch(value);
  };

  const handleTableChange = (pagination) => {
    fetchOrderDetails(pagination.current, pagination.pageSize, searchText);
  };

  useEffect(() => {
    if (id) {
      fetchOrderDetails(1, pagination.pageSize, searchText);
    }
  }, [id]);

  const getVoidStatus = (item) => {
    if (item.is_void) return { key: "VOID", text: "باطل‌شده", color: "red" };
    if (item.cancel_status_pending)
      return { key: "PENDING", text: "در انتظار ابطال", color: "orange" };
    return { key: "NORMAL", text: "عادی", color: "default" };
  };

  const fetchOrderDetails = async (page = 1, pageSize = 25, search = "") => {
    setLoading(true);
    try {
      const response = await api.get(`/panel/packaging-orders/${id}`, {
        params: {
          includes: ["items"],
          page,
          per_page: pageSize,
          search: search.trim(),
        },
      });
      setOrderData(response.data.data);
      setFilteredItems(response.data.data.items || []);
      setPagination({
        current: response.data.meta?.current_page || 1,
        pageSize: response.data.meta?.per_page || pageSize,
        total: response.data.meta?.total || (response.data.data.items?.length || 0),
      });
    } catch (error) {
      console.error("Error fetching order details:", error);
      UnifiedErrorHandler.handleApiError(error, null, {
        showGeneralMessages: true,
        defaultMessage: "خطا در دریافت اطلاعات بسته بندی",
      });
    } finally {
      setLoading(false);
    }
  };


  const openEditModal = (boxId) => {
    setSelectedBoxId(boxId);
    setEditModalVisible(true);
  };

  const handleBoxUpdated = () => {
    fetchOrderDetails(pagination.current, pagination.pageSize, searchText); // Refresh the order data
    setEditModalVisible(false);
    setSelectedBoxId(null);
  };

  // تلاش برای پیدا کردن «درجه کیفی» از آبجکت تنوع
  const extractQualityFromVariation = (variationObj) => {
    if (!variationObj) return null;

    const attrs =
      variationObj.attribute_varitation ||
      variationObj.attribute_variation ||
      variationObj.attributes ||
      [];

    if (Array.isArray(attrs)) {
      const a = attrs.find(
        (x) =>
          (x.key && x.key.trim() === "درجه_کیفی") ||
          (x.name && x.name.includes("درجه"))
      );
      const v = a?.values?.[0];
      const vv = (v?.name || v?.value || "").toString().trim();
      if (vv) return vv; // مثل «درجه A»
    }

    // fallback: از SKU الگو را دربیاوریم (مثل: درجه_A ، درجه-A)
    if (variationObj.SKU) {
      const m = variationObj.SKU.match(/درجه[_\-\s]*([A-Za-z\u0600-\u06FF]+)/);
      if (m && m[1]) {
        return `درجه ${m[1].replace(/[_\-]/g, " ")}`.trim();
      }
    }

    return null;
  };

  // از variation شیء، لیبل نمایشی بساز (نام محصول + ویژگی‌ها)
  // variation: ممکن است فیلدهای متفاوت داشته باشد (id یا product_variant_id و ...).
  const buildVariationLabel = (variationObj, productTitle) => {
    if (!variationObj) return productTitle || "تنوع";

    // 1) تلاش برای خواندن attribute_varitation
    const attrs =
      variationObj.attribute_varitation ||
      variationObj.attribute_variation || // اگر API گاهی این نام را بدهد
      variationObj.attributes ||
      [];

    let attrsParts = [];
    if (Array.isArray(attrs) && attrs.length) {
      attrsParts = attrs
        .filter((a) => {
          // فیلتر کردن attribute‌های مربوط به درجه کیفی
          const key = (a.key || "").toString().trim();
          const name = (a.name || "").toString().trim();
          const isQuality = 
            key === "درجه_کیفی" || 
            key.toLowerCase().includes("درجه") ||
            name.includes("درجه") ||
            name.toLowerCase().includes("quality");
          return !isQuality; // فقط attribute‌هایی که درجه نیستند
        })
        .map((a) => {
          const vals = (a.values || [])
            .map((v) => (v.name || v.value || "").toString().trim())
            .filter(Boolean)
            .join("، ");
          if (!vals) return null;
          // نمایش کوتاه: فقط مقدارها؛ اگر دوست داشتی "نام: مقدارها" بگذار
          return vals;
        })
        .filter(Boolean);
    }

    // 2) حذف شده: از SKU درجه را استخراج نمی‌کنیم (در لیبل‌ها نمایش داده نمی‌شود)

    const attrsStr = attrsParts.join(" | ");
    const baseName = productTitle || variationObj.title || "محصول";
    return attrsStr ? `${baseName} – ${attrsStr}` : baseName;
  };

  // اگر از API فقط لیست variationهای ساده داری (مثلاً products[].variants)
  // آن‌ها را به options خوانا تبدیل کن
  const variationToOption = (variation, productTitle) => ({
    value: variation.product_variant_id ?? variation.id, // هر کدام موجود بود
    label: buildVariationLabel(variation, productTitle),
  });

  // یک نام محصول کوتاه
  const shortProductName = (item) =>
    item?.product?.title || item?.product || item?.product_title || "محصول";

  const handlePrintLabel = async (record) => {
    const loadingKey = "print-label";
    try {
      message.loading({ content: "در حال آماده‌سازی لیبل...", key: loadingKey });
      
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

      // کمی تاخیر برای نمایش loading
      await new Promise(resolve => setTimeout(resolve, 300));

      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.focus();
        
        message.success({ content: "لیبل آماده است", key: loadingKey });
        
        printWindow.print();

        setTimeout(() => {
          printWindow.close();
        }, 1000);
      } else {
        message.error({
          content: "پنجره پرینت باز نشد. لطفا popup blocker را غیرفعال کنید.",
          key: loadingKey
        });
      }
    } catch (error) {
      console.error("Error printing label:", error);
      message.error({
        content: "خطا در پرینت لیبل",
        key: loadingKey
      });
      UnifiedErrorHandler.handleApiError(error, null, {
        showGeneralMessages: true,
        defaultMessage: "خطا در پرینت لیبل",
      });
    }
  };

  const handlePrintInvoice = async (record) => {
    // نمایش مودال تایید لوگو
    setPendingPrintAction({ type: 'single', data: record });
    setLogoConfirmModalVisible(true);
  };

  const executePrintInvoice = async (record, includeLogo) => {
    try {
      message.loading({ content: "در حال آماده‌سازی لیبل...", key: "print-single" });
      
      // Get label data from API
      const response = await api.get(
        `/panel/packaging-items/${record.id}/label`
      );
      const labelData = response.data.data;

      // Convert barcode to data URL
      if (labelData?.media?.barcode_url) {
        try {
          const token = localStorage.getItem("token");
          const imgRes = await axios.get(labelData.media.barcode_url, {
            responseType: "blob",
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          });
          const blob = imgRes.data;
          const reader = new FileReader();
          const dataUrl = await new Promise((resolve, reject) => {
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
          labelData.media.barcode_url = dataUrl;
        } catch (e) {
          console.warn("Failed to embed barcode:", e);
        }
      }

      // Convert logo to data URL if needed
      let logoDataUrl = null;
      if (includeLogo) {
        logoDataUrl = COMPANY_LOGO;
      try {
        const logoRes = await fetch(COMPANY_LOGO);
        const logoBlob = await logoRes.blob();
        const logoReader = new FileReader();
        logoDataUrl = await new Promise((resolve, reject) => {
          logoReader.onloadend = () => resolve(logoReader.result);
          logoReader.onerror = reject;
          logoReader.readAsDataURL(logoBlob);
        });
      } catch (e) {
        console.warn("Failed to embed logo:", e);
        }
      }

      // Build invoice using label data with or without logo
      const invoiceContent = buildSingleInvoiceFromLabel(labelData, logoDataUrl);

      const fullHTML = `
        <!doctype html>
        <html lang="fa" dir="rtl">
          <head>
            <meta charset="utf-8"/>
            <title>چاپ لیبل</title>
            <style>${A6_PRINT_CSS}</style>
          </head>
          <body>
            ${invoiceContent}
          </body>
        </html>
      `;

      message.success({ content: "لیبل آماده است", key: "print-single" });

      // Use iframe instead of popup for better image loading
      printInIframe(fullHTML);
    } catch (error) {
      console.error("Error printing invoice:", error);
      message.error({ content: "خطا در پرینت لیبل", key: "print-single" });
      UnifiedErrorHandler.handleApiError(error, null, {
        showGeneralMessages: true,
        defaultMessage: "خطا در پرینت لیبل",
      });
    }
  };

  const handleDeleteBox = async (boxId, reason) => {
    try {
      if (!reason || !reason.trim()) {
        message.warning("لطفاً دلیل حذف را وارد کنید.");
        return;
      }

      await api.delete(`/panel/items/${boxId}`, {
        data: { reason: reason.trim() },
      });

      message.success("جعبه با موفقیت حذف شد");
      fetchOrderDetails(pagination.current, pagination.pageSize, searchText);
    } catch (error) {
      console.error("Error deleting box:", error);
      UnifiedErrorHandler.handleApiError(error, null, {
        showGeneralMessages: true,
        defaultMessage: "خطا در حذف جعبه",
      });
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
    // نمایش مودال تایید لوگو
    setPendingPrintAction({ type: 'batch', data: null });
    setLogoConfirmModalVisible(true);
  };

  const executePrintAllInvoices = async (includeLogo) => {
    try {
      message.loading({
        content: "در حال دریافت اطلاعات لیبلها...",
        key: "print",
      });

      const response = await api.get(`/panel/packaging-orders/${id}/labels`);
      const labelsData = response?.data?.data || [];

      // Prefetch and embed barcode images as data URLs
      const token = localStorage.getItem("token");
      const embedded = await Promise.all(
        labelsData.map(async (label) => {
          if (label?.media?.barcode_url) {
            try {
              const imgRes = await axios.get(label.media.barcode_url, {
                responseType: "blob",
                headers: token ? { Authorization: `Bearer ${token}` } : undefined,
              });
              const blob = imgRes.data;
              const reader = new FileReader();
              const dataUrl = await new Promise((resolve, reject) => {
                reader.onloadend = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
              });
              return { ...label, media: { ...label.media, barcode_url: dataUrl } };
            } catch (e) {
              return label;
            }
          }
          return label;
        })
      );

      if (labelsData.length === 0) {
        message.warning("اطلاعات لیبل برای این بسته بندی موجود نیست");
        return;
      }

      const html = buildBatchInvoiceHTML(orderData, embedded, includeLogo);
      setInvoiceHTML(html);
      setShowInvoicePreview(true);

      message.success({
        content: "پیش‌نمایش لیبلها آماده است.",
        key: "print",
      });
    } catch (e) {
      console.error(e);
      message.error({ content: "خطا در دریافت اطلاعات لیبلها", key: "print" });
      UnifiedErrorHandler.handleApiError(e, null, {
        showGeneralMessages: true,
        defaultMessage: "خطا در دریافت اطلاعات لیبلها",
      });
    }
  };

  // --- تکمیل بسته بندی و نمایش پیش نمایش فاکتورها ---
  const handleCompleteOrder = async () => {
    if (completingOrder) return;
    try {
      setCompletingOrder(true);
      message.loading({ content: "در حال تکمیل بسته بندی...", key: "complete" });
      const resp = await api.post(`/panel/packaging-orders/${id}/complete`);
      const arr = resp?.data?.data || [];
      setCompletePrintData(arr);
      const html = buildInvoiceHTML(orderData, arr);
      setInvoiceHTML(html);
      setShowInvoicePreview(true);
      message.success({ content: "بسته بندی تکمیل شد. پیش‌نمایش آماده است.", key: "complete" });
      fetchOrderDetails(pagination.current, pagination.pageSize, searchText);
    } catch (error) {
      const errorResult = UnifiedErrorHandler.handleApiError(error, null, {
        showValidationMessages: true,
        showGeneralMessages: true,
        defaultMessage: "خطا در تکمیل بسته بندی",
      });
      message.error({ content: errorResult.message, key: "complete" });
      console.error("Error completing packaging order:", errorResult);
    } finally {
      setCompletingOrder(false);
    }
  };

  const buildInvoiceHTML = (orderInfoArg, items) => {
    // Use the new batch format for consistency
    return buildBatchInvoiceHTML(orderInfoArg, items);
  };

  // تبدیل اعداد انگلیسی به فارسی
  const toPersianDigits = (num) => {
    if (num === null || num === undefined) return '';
    const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    return String(num).replace(/\d/g, (digit) => persianDigits[parseInt(digit)]);
  };

  // ساخت HTML برای «چاپ کلی فاکتورها» (labelsData از /labels)
  const buildBatchInvoiceHTML = (orderInfoArg, labelsData, includeLogo = true) => {
    const customerName =
      orderInfoArg?.customer?.first_name && orderInfoArg?.customer?.last_name
        ? `${orderInfoArg.customer.first_name} ${orderInfoArg.customer.last_name}`
        : orderInfoArg?.customer?.first_name ||
          orderInfoArg?.customer?.last_name ||
          "نامشخص";
    const totalPages = (labelsData || []).length;

    const pages = (labelsData || []).map((label, idx) => {
      const item = label.item || {};
      const pm = label.print_meta || {};
      const potSummary = label.pot_summary || {};
      const media = label.media || {};
      const seqNo = pm.sequence_no || idx + 1;
      const seqTotal = pm.sequence_total || totalPages;

      const headerHTML = `
      <div class="inv__head">
        ${includeLogo ? `<div class="inv__logo"><img src="${COMPANY_LOGO}" alt="لوگو" /></div>` : '<div class="inv__logo"></div>'}
        <div class="inv__title">عرفان ارکید</div>
        <div class="inv__boxno">${toPersianDigits(item.row_no ?? seqNo)}</div>
      </div>
    `;

      const stripHTML = `
      <div class="strip">
        <div class="chip"><b>مشتری:</b> ${customerName}</div>
      </div>
    `;

      // --- محتوا بر اساس نوع بسته‌بندی
      let countersHTML = "";
      let listBoxTitle = "";
      let listHTML = "";

      if (item.pack_type === "POTTED_PLANT") {
        // گلدان‌ها
        let totalPots = 0;
        const potsArr = item.pots || [];
        const totalStems = potsArr.reduce(
          (sum, pot) => sum + (pot.stems_count || 0),
          0
        );
        const totalFlowers = potsArr.reduce(
          (sum, pot) => sum + (pot.flowers_total || 0),
          0
        );

        if (potSummary?.by_variation?.length) {
          listHTML = potSummary.by_variation
            .map((v, i) => {
              totalPots += v.pot_count || 0;

              // استخراج pots مربوط به این variation برای نمایش شاخه و گل
              const matchingPots = (item.pots || []).filter(
                (pot) =>
                  pot.product?.id === v.product_id &&
                  pot.variation?.product_variant_id === v.variation_id
              );

              // محاسبه مجموع شاخه و گل برای این variation
              const variationStems = matchingPots.reduce(
                (sum, pot) => sum + (pot.stems_count || 0),
                0
              );
              const variationFlowers = matchingPots.reduce(
                (sum, pot) => sum + (pot.flowers_total || 0),
                0
              );

              // ساخت variationLabel مثل حالت شاخه بریده
              // اول از v.product_variation، اگر نبود از اولین pot variation را می‌گیریم
              const variationForLabel = v.product_variation || matchingPots[0]?.variation || null;
              const variationLabel = variationForLabel
                ? buildVariationLabel(variationForLabel, v.product_title)
                : v.product_title;

              // سریال گلدان - کامنت شده برای استفاده بعدی
              // const serialCodes = matchingPots
              //   .map((pot) => pot.serial_code)
              //   .filter(Boolean);
              // const serialText =
              //   serialCodes.length > 0 ? ` (${serialCodes.join(", ")})` : "";

              return `<div class="listBox__item">${toPersianDigits(i + 1)}. ${variationLabel} – (${toPersianDigits(variationStems)} شاخه، ${toPersianDigits(variationFlowers)} گل)</div>`;
            })
            .join("");
        } else {
          totalPots = item.total_pots || 0;
          // برای حالت fallback هم باید از potsArr استفاده کنیم
          const fallbackStems = potsArr.reduce(
            (sum, pot) => sum + (pot.stems_count || 0),
            0
          );
          const fallbackFlowers = potsArr.reduce(
            (sum, pot) => sum + (pot.flowers_total || 0),
            0
          );
          // ساخت variationLabel از اولین pot
          const fallbackVariation = potsArr[0]?.variation || null;
          const fallbackProductName = shortProductName(item);
          const fallbackVariationLabel = fallbackVariation
            ? buildVariationLabel(fallbackVariation, fallbackProductName)
            : fallbackProductName;
          listHTML = `<div class="listBox__item">${toPersianDigits(1)}. ${fallbackVariationLabel} – (${toPersianDigits(fallbackStems)} شاخه، ${toPersianDigits(fallbackFlowers)} گل)</div>`;
        }

        countersHTML = `
        <div class="counters">
          <div class="counter">
            <div class="counter__label">تعداد گل</div>
            <div class="counter__val">${toPersianDigits(totalFlowers)}</div>
          </div>
          <div class="counter">
            <div class="counter__label">تعداد شاخه</div>
            <div class="counter__val">${toPersianDigits(totalStems)}</div>
          </div>
        </div>
      `;
        listBoxTitle = "لیست گلدان‌ها";
      } else if (item.pack_type === "CUT_FLOWER") {
        // شاخه بریده: تجمیع خطوط با محصول/تنوع یکسان
        const stems = item.total_stems || 0;
        const flowers = item.total_flowers || 0;

        const lines = item.lines || [];
        const groupedLines = new Map();
        
        for (const line of lines) {
          const productName = typeof line.product === 'string' ? line.product : line.product?.title || "محصول";
          const variationId = line.product_variation_id?.product_variant_id || line.variation?.product_variant_id;
          const key = `${productName}::${variationId}`;
          
          if (!groupedLines.has(key)) {
            groupedLines.set(key, {
              productName,
              variation: line.product_variation_id || line.variation,
              stems: 0,
              flowers: 0,
            });
          }
          
          const group = groupedLines.get(key);
          group.stems += line.stems_count || 0;
          group.flowers += line.line_total_flowers || (line.stems_count || 0) * (line.flowers_per_stem || 0);
        }

        // ساخت لیست از گروه‌های تجمیع شده
        if (groupedLines.size > 0) {
          listHTML = Array.from(groupedLines.values())
            .map((group, i) => {
              const variationLabel = group.variation ? buildVariationLabel(group.variation, group.productName) : group.productName;
              return `<div class="listBox__item">${toPersianDigits(i + 1)}. ${variationLabel} – (${toPersianDigits(group.stems)} شاخه، ${toPersianDigits(group.flowers)} گل)</div>`;
            })
            .join("");
        } else {
          // fallback
          listHTML = `<div class="listBox__item">${shortProductName(item)} – (${toPersianDigits(stems)} شاخه، ${toPersianDigits(flowers)} گل)</div>`;
        }

        countersHTML = `
        <div class="counters">
          <div class="counter">
            <div class="counter__label">تعداد گل</div>
            <div class="counter__val">${toPersianDigits(flowers)}</div>
          </div>
          <div class="counter">
            <div class="counter__label">تعداد شاخه</div>
            <div class="counter__val">${toPersianDigits(stems)}</div>
          </div>
        </div>
      `;
        listBoxTitle = "گل‌های موجود";
      } else {
        listHTML = `<div class="listBox__item">نوع بسته‌بندی نامشخص</div>`;
        listBoxTitle = "اقلام";
      }

      const listBoxHTML = `
      <div class="listBox">
        <div class="listBox__title">${listBoxTitle}</div>
        ${listHTML || `<div class="listBox__item">موردی ثبت نشده</div>`}
      </div>
    `;

      const footerHTML = `
      <div class="meta">
        <table class="meta__tbl">
          <tr>
            <td class="meta__lbl">اپراتور ثبت محصول</td>
            <td class="meta__val">${
              orderInfoArg?.packed_by?.first_name
                ? `${orderInfoArg.packed_by.first_name}${
                    orderInfoArg.packed_by.last_name
                      ? " " + orderInfoArg.packed_by.last_name
                      : ""
                  }`
                : "-"
            }</td>
          </tr>
          <tr>
            <td class="meta__lbl">ناظر کیفی</td>
            <td class="meta__val">${item.qc_controller || "-"}</td>
          </tr>
        </table>
      </div>
      <div class="pager">شماره ${toPersianDigits(seqNo)} از ${toPersianDigits(seqTotal)}</div>
    `;

      // ✅ باکس بارکد مثل قبل در انتهای کارت
      const barcodeHTML = `
      <div class="barcode-box">
        <img class="barcode-img" src="${
          media?.barcode_url || ""
        }" onerror="this.style.display='none'"/>
        <div class="serial">${label.serial_code || ""}</div>
      </div>
    `;

      return `
      <div class="page">
        <div class="inv">
          ${headerHTML}
          ${stripHTML}
          ${countersHTML}
          ${listBoxHTML}
          ${footerHTML}
          ${barcodeHTML}
        </div>
      </div>
    `;
    });

    return `
    <!doctype html>
    <html lang="fa" dir="rtl">
      <head>
        <meta charset="utf-8"/>
        <title>چاپ لیبل های بسته بندی</title>
        <style>${A6_PRINT_CSS}</style>
      </head>
      <body>
        ${pages.join("\n")}
      </body>
    </html>
  `;
  };

  // ساخت HTML برای «پرینت تکی» (labelData از /packaging-items/{id}/label)
  const buildSingleInvoiceFromLabel = (labelData, logoUrl = COMPANY_LOGO) => {
    const packOrder = labelData.packaging_order || {};
    
    // استخراج نام مشتری از orderData (اطلاعات اصلی صفحه)
    const customerName =
      orderData?.customer?.first_name && orderData?.customer?.last_name
        ? `${orderData.customer.first_name} ${orderData.customer.last_name}`
        : orderData?.customer?.first_name ||
          orderData?.customer?.last_name ||
          "نامشخص";

    const item = labelData.item || {};
    const media = labelData.media || {};
    const pm = labelData.print_meta || {};
    const potSummary = labelData.pot_summary || {};
    const seqNo = pm.sequence_no || 1;
    const seqTotal = pm.sequence_total || 1;

    const headerHTML = `
    <div class="inv__head">
      ${logoUrl ? `<div class="inv__logo"><img src="${logoUrl}" alt="لوگو" /></div>` : '<div class="inv__logo"></div>'}
      <div class="inv__title">عرفان ارکید</div>
      <div class="inv__boxno">${toPersianDigits(item.row_no ?? seqNo)}</div>
    </div>
  `;

    const stripHTML = `
    <div class="strip">
      <div class="chip"><b>مشتری:</b> ${customerName}</div>
    </div>
  `;

    let countersHTML = "";
    let listBoxTitle = "";
    let listHTML = "";

    if (item.pack_type === "POTTED_PLANT") {
      let totalPots = 0;
      const potsArr = item.pots || [];
      const totalStems = potsArr.reduce(
        (sum, pot) => sum + (pot.stems_count || 0),
        0
      );
      const totalFlowers = potsArr.reduce(
        (sum, pot) => sum + (pot.flowers_total || 0),
        0
      );

      if (potSummary?.by_variation?.length) {
        listHTML = potSummary.by_variation
          .map((v, i) => {
            totalPots += v.pot_count || 0;

            // استخراج pots مربوط به این variation برای نمایش شاخه و گل
            const matchingPots = (item.pots || []).filter(
              (pot) =>
                pot.product?.id === v.product_id &&
                pot.variation?.product_variant_id === v.variation_id
            );

            // محاسبه مجموع شاخه و گل برای این variation
            const variationStems = matchingPots.reduce(
              (sum, pot) => sum + (pot.stems_count || 0),
              0
            );
            const variationFlowers = matchingPots.reduce(
              (sum, pot) => sum + (pot.flowers_total || 0),
              0
            );

            // ساخت variationLabel مثل حالت شاخه بریده
            // اول از v.product_variation، اگر نبود از اولین pot variation را می‌گیریم
            const variationForLabel = v.product_variation || matchingPots[0]?.variation || null;
            const variationLabel = variationForLabel
              ? buildVariationLabel(variationForLabel, v.product_title)
              : v.product_title;

            // سریال گلدان - کامنت شده برای استفاده بعدی
            // const serialCodes = matchingPots
            //   .map((pot) => pot.serial_code)
            //   .filter(Boolean);
            // const serialText =
            //   serialCodes.length > 0 ? ` (${serialCodes.join(", ")})` : "";

            return `<div class="listBox__item">${toPersianDigits(i + 1)}. ${variationLabel} – (${toPersianDigits(variationStems)} شاخه، ${toPersianDigits(variationFlowers)} گل)</div>`;
          })
          .join("");
      } else {
        totalPots = item.total_pots || 0;
        // برای حالت fallback هم باید از potsArr استفاده کنیم
        const fallbackStems = potsArr.reduce(
          (sum, pot) => sum + (pot.stems_count || 0),
          0
        );
        const fallbackFlowers = potsArr.reduce(
          (sum, pot) => sum + (pot.flowers_total || 0),
          0
        );
        // ساخت variationLabel از اولین pot
        const fallbackVariation = potsArr[0]?.variation || null;
        const fallbackProductName = shortProductName(item);
        const fallbackVariationLabel = fallbackVariation
          ? buildVariationLabel(fallbackVariation, fallbackProductName)
          : fallbackProductName;
        listHTML = `<div class="listBox__item">${toPersianDigits(1)}. ${fallbackVariationLabel} – (${toPersianDigits(fallbackStems)} شاخه، ${toPersianDigits(fallbackFlowers)} گل)</div>`;
      }

      countersHTML = `
      <div class="counters">
        <div class="counter">
          <div class="counter__label">تعداد گل</div>
          <div class="counter__val">${toPersianDigits(totalFlowers)}</div>
        </div>
        <div class="counter">
          <div class="counter__label">تعداد شاخه</div>
          <div class="counter__val">${toPersianDigits(totalStems)}</div>
        </div>
      </div>
    `;
      listBoxTitle = "لیست گلدان‌ها";
    } else if (item.pack_type === "CUT_FLOWER") {
      // شاخه بریده: تجمیع خطوط با محصول/تنوع یکسان
      const stems = item.total_stems || 0;
      const flowers = item.total_flowers || 0;

      const lines = item.lines || [];
      const groupedLines = new Map();
      
      for (const line of lines) {
        const productName = typeof line.product === 'string' ? line.product : line.product?.title || "محصول";
        const variationId = line.product_variation_id?.product_variant_id || line.variation?.product_variant_id;
        const key = `${productName}::${variationId}`;
        
        if (!groupedLines.has(key)) {
          groupedLines.set(key, {
            productName,
            variation: line.product_variation_id || line.variation,
            stems: 0,
            flowers: 0,
          });
        }
        
        const group = groupedLines.get(key);
        group.stems += line.stems_count || 0;
        group.flowers += line.line_total_flowers || (line.stems_count || 0) * (line.flowers_per_stem || 0);
      }

      // ساخت لیست از گروه‌های تجمیع شده
      if (groupedLines.size > 0) {
        listHTML = Array.from(groupedLines.values())
          .map((group, i) => {
            const variationLabel = group.variation ? buildVariationLabel(group.variation, group.productName) : group.productName;
            return `<div class="listBox__item">${toPersianDigits(i + 1)}. ${variationLabel} – (${toPersianDigits(group.stems)} شاخه، ${toPersianDigits(group.flowers)} گل)</div>`;
          })
          .join("");
      } else {
        // fallback
        listHTML = `<div class="listBox__item">${shortProductName(item)} – (${toPersianDigits(stems)} شاخه، ${toPersianDigits(flowers)} گل)</div>`;
      }

      countersHTML = `
      <div class="counters">
        <div class="counter">
          <div class="counter__label">تعداد گل</div>
          <div class="counter__val">${toPersianDigits(flowers)}</div>
        </div>
        <div class="counter">
          <div class="counter__label">تعداد شاخه</div>
          <div class="counter__val">${toPersianDigits(stems)}</div>
        </div>
      </div>
    `;
      listBoxTitle = "گل‌های موجود";
    } else {
      listHTML = `<div class="listBox__item">نوع بسته‌بندی نامشخص</div>`;
      listBoxTitle = "اقلام";
    }

    const listBoxHTML = `
    <div class="listBox">
      <div class="listBox__title">${listBoxTitle}</div>
      ${listHTML || `<div class="listBox__item">موردی ثبت نشده</div>`}
    </div>
  `;

    // استخراج اپراتور از packaging_order.pack_by
    const operatorName = packOrder?.pack_by?.name && packOrder?.pack_by?.last_name
      ? `${packOrder.pack_by.name} ${packOrder.pack_by.last_name}`
      : packOrder?.pack_by?.name || packOrder?.pack_by?.last_name || "-";

    const footerHTML = `
    <div class="meta">
      <table class="meta__tbl">
        <tr>
          <td class="meta__lbl">اپراتور ثبت محصول</td>
          <td class="meta__val">${operatorName}</td>
        </tr>
        <tr>
          <td class="meta__lbl">ناظر کیفی</td>
          <td class="meta__val">${item.qc_controller || "-"}</td>
        </tr>
      </table>
    </div>
    <div class="pager">شماره ${toPersianDigits(seqNo)} از ${toPersianDigits(seqTotal)}</div>
  `;

    // ✅ بارکد مثل قبل
    const barcodeHTML = `
    <div class="barcode-box">
      <img class="barcode-img" src="${
        media?.barcode_url || ""
      }" onerror="this.style.display='none'"/>
      <div class="serial">${labelData.serial_code || ""}</div>
    </div>
  `;

    return `
    <div class="page">
      <div class="inv">
        ${headerHTML}
        ${stripHTML}
        ${countersHTML}
        ${listBoxHTML}
        ${footerHTML}
        ${barcodeHTML}
      </div>
    </div>
  `;
  };

  // const buildSingleInvoiceFromLabel = (labelData) => {
  //   const customerName =
  //     labelData.packaging_order?.customer?.first_name &&
  //     labelData.packaging_order?.customer?.last_name
  //       ? `${labelData.packaging_order.customer.first_name} ${labelData.packaging_order.customer.last_name}`
  //       : labelData.packaging_order?.customer?.first_name ||
  //         labelData.packaging_order?.customer?.last_name ||
  //         "نامشخص";
  //   const orderCode =
  //     labelData.packaging_order?.order_no || `#${labelData.packaging_item_id}`;

  //   const item = labelData.item || {};
  //   const printMeta = labelData.print_meta || {};
  //   const potSummary = labelData.pot_summary || {};

  //   // شماره جعبه ساده (فقط عدد)
  //   const boxNo = printMeta.sequence_no || "1";
  //   const boxTotal = printMeta.sequence_total || "1";

  //   // ساخت لیست محصولات
  //   let productDetails = "";
  //   let totalItems = 0;

  //   if (item.pack_type === "POTTED_PLANT" && potSummary.by_variation) {
  //     // برای گلدان از pot_summary استفاده می‌کنیم
  //     const variations = potSummary.by_variation;
  //     productDetails = variations
  //       .map((variation) => {
  //         totalItems += variation.pot_count;
  //         return `<div class="product-item">• ${variation.product_title}: ${variation.pot_count} گلدان</div>`;
  //       })
  //       .join("");
  //   } else if (item.pack_type === "CUT_FLOWER") {
  //     // برای شاخه بریده
  //     const productName = item.product || "محصول نامشخص";
  //     const stems = item.total_stems || 0;
  //     const flowers = item.total_flowers || 0;
  //     totalItems = flowers;
  //     productDetails = `<div class="product-item">• ${productName}: ${stems} شاخه (${flowers} گل)</div>`;
  //   }

  //   return `
  //   <div class="page">
  //     <div class="inv-card">

  //      <!-- Header -->
  //       <div class="inv-head">
  //         <div class="inv-logo-container">
  //           <img class="inv-logo" src="${COMPANY_LOGO}" alt="لوگو شرکت" />
  //         </div>
  //         <div class="inv-title">فاکتور</div>
  //         <div class="box-no">${boxNo}</div>
  //       </div>

  //       <!-- مشتری و سفارش (برجسته) -->
  //       <div class="important-info">
  //         <div class="customer-name">${customerName}</div>
  //         <div class="order-code">${orderCode}</div>
  //       </div>

  //       <!-- جزییات محصولات -->
  //       <div class="products-section">
  //         <div class="products-title">جزییات محصولات:</div>
  //         <div class="products-list">
  //           ${productDetails}
  //         </div>
  //         <div class="total-summary">
  //           مجموع: ${totalItems} ${
  //     item.pack_type === "POTTED_PLANT" ? "گلدان" : "گل"
  //   }
  //         </div>
  //       </div>

  //       <!-- اطلاعات اضافی -->
  //       <div class="extra-info">
  //         <table class="info-table">
  //           <tr>
  //             <td class="info-label">اپراتور:</td>
  //             <td class="info-value">${item.qc_controller || "-"}</td>
  //           </tr>
  //           <tr>
  //             <td class="info-label">تاریخ:</td>
  //             <td class="info-value">${item.packaged_at || ""}</td>
  //           </tr>
  //           <tr>
  //             <td class="info-label">جعبه:</td>
  //             <td class="info-value">${boxNo} از ${boxTotal}</td>
  //           </tr>
  //         </table>
  //       </div>

  //       <!-- Barcode -->
  //       <div class="barcode-box">
  //         <img class="barcode-img" src="${
  //           labelData.media?.barcode_url || ""
  //         }" onerror="this.style.display='none'"/>
  //         <div class="serial">${labelData.serial_code || ""}</div>
  //       </div>
  //     </div>
  //   </div>
  // `;
  // };

  const buildSingleInvoiceHTML = (record) => {
    const customerName = orderData?.customer?.first_name || "نامشخص";

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

      const potsArr = record.pots || [];
      const totalStems = potsArr.reduce(
        (sum, pot) => sum + (pot.stems_count || 0),
        0
      );
      const totalFlowers = potsArr.reduce(
        (sum, pot) => sum + (pot.flowers_total || 0),
        0
      );

      // ساخت variationLabel مثل حالت شاخه بریده
      // از اولین pot variation را می‌گیریم (یا از record.product_variation)
      const variation = potsArr[0]?.variation || record.product_variation || null;
      const variationLabel = variation
        ? buildVariationLabel(variation, productName)
        : productName;

      // سریال گلدان - کامنت شده برای استفاده بعدی
      // const serialCodes = (record.pots || [])
      //   .filter(
      //     (pot) =>
      //       pot.product?.id === record.product?.id &&
      //       pot.variation?.product_variant_id === record.product_variation_id
      //   )
      //   .map((pot) => pot.serial_code)
      //   .filter(Boolean);
      // const serialText =
      //   serialCodes.length > 0 ? ` (${serialCodes.join(", ")})` : "";

      productDetails = `<div class="product-item">• ${variationLabel}: ${toPersianDigits(pots)} گلدان – (${toPersianDigits(totalStems)} شاخه، ${toPersianDigits(totalFlowers)} گل)</div>`;
    } else if (record.pack_type === "CUT_FLOWER") {
      // برای شاخه بریده
      const productName = record.product?.title || "محصول نامشخص";
      const stems = record.total_stems || 0;
      const flowers = record.total_flowers || 0;
      totalItems = flowers;

      // درجه کیفی در لیبل‌ها نمایش داده نمی‌شود
      productDetails = `<div class="product-item">• ${productName}: (${toPersianDigits(stems)} شاخه، ${toPersianDigits(flowers)} گل)</div>`;
    }

    return `
    <div class="page">
      <div class="inv-card">

       <!-- Header -->
        <div class="inv-head">
          <div class="inv-logo-container">
            <img class="inv-logo" src="${COMPANY_LOGO}" alt="لوگو شرکت" />
          </div>
          <div class="inv-title">لیبل</div>
          <div class="box-no">${boxNo}</div>
        </div>

        <!-- مشتری و بسته بندی (برجسته) -->
        <div class="important-info">
          <div class="customer-name">${customerName}</div>
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
      title: "تنوع",
      dataIndex: "product_variation_id",
      key: "product_variation_id",
      render: (variation, record) => {
        // API گاهی ID می‌دهد، گاهی شیء کامل variation.
        if (!variation) return "-";

        // اگر شیء کامل است:
        if (typeof variation === "object") {
          return buildVariationLabel(variation, record?.product?.title);
        }

        // اگر فقط ID است و شیء محصول هست ولی attributes را نداریم،
        // حداقل اسم محصول را نشان بدهیم:
        return record?.product?.title
          ? `${record.product.title} – #${variation}`
          : `#${variation}`;
      },
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
      responsive: ["md", "lg"],
    },
    {
      title: "تاریخ بسته‌بندی",
      dataIndex: "packaged_at",
      key: "packaged_at",
      responsive: ["md", "lg"],
    },
    {
      title: "عملیات",
      key: "actions",
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
            ویرایش اطلاعات
          </Button>

          <Button
            size="small"
            icon={<PrinterOutlined />}
            onClick={() => handlePrintLabel(record)}
            disabled={record.is_void} // ✅
          >
            پرینت شماره لیبل
          </Button>

          <Button
            size="small"
            icon={<PrinterOutlined />}
            onClick={() => handlePrintInvoice(record)}
            disabled={record.is_void} // ✅
          >
            پرینت لیبل
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
    },
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
        <Text type="danger">خطا در دریافت اطلاعات بسته بندی</Text>
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
      className="responsive-container"
    >
      {/* Header */}
      <Card style={{ marginBottom: 24 }}>
          <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
          className="responsive-header"
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
                onClick={() => navigate("/orders")}
                size="small"
              >
                بازگشت به لیست بسته بندی
              </Button>
              <Title level={4} style={{ margin: 0, fontSize: "16px" }}>
                جزئیات بسته بندی - #{orderData.id}
              </Title>
            </Space>
            <Space>
              <Badge
                status={orderData.status === "OPEN" ? "processing" : "success"}
                text={
                  <Tag color={getStatusColor(orderData.status)}>
                    {getStatusText(orderData.status)}
                  </Tag>
                }
              />
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                onClick={handleCompleteOrder}
                loading={completingOrder}
                disabled={orderData?.status === "COMPLETED"}
              >
                تکمیل بسته بندی
              </Button>
            </Space>
          </div>
        </div>
      </Card>

      {/* Order Information */}
      <Row gutter={24}>
        <Col xs={24}>
          <Card
            title={
              <Space>
                <ShoppingCartOutlined />
                <span>اطلاعات بسته بندی</span>
              </Space>
            }
          >
            <Descriptions bordered column={{ xs: 1, sm: 1, md: 2 }}>
              <Descriptions.Item label="شماره بسته بندی">
                <Text strong>{orderData.order_no || `#${orderData.id}`}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="وضعیت">
                <Tag color={getStatusColor(orderData.status)}>
                  {getStatusText(orderData.status)}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="تعداد جعبه موجود در بسته بندی">
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
              <Space wrap style={{ width: "100%" }}>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => setAddBoxModalVisible(true)}
                  style={{ borderRadius: 8, fontWeight: 600 }}
                  disabled={orderData?.status === "COMPLETED"}
                  block
                  className="responsive-button"
                >
                  افزودن جعبه جدید
                </Button>
                <Button
                  type="primary"
                  icon={<PrinterOutlined />}
                  onClick={handlePrintAllInvoices}
                  style={{ borderRadius: 8, fontWeight: 600 }}
                  block
                  className="responsive-button"
                >
                  پرینت کلی لیبلها
                </Button>
              </Space>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Customer Information */}
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
                <span>آیتم‌های بسته بندی ({orderData.items?.length || 0})</span>
              </Space>
            }
            extra={
              <Input
                placeholder="جستجوی جعبه..."
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={handleSearchChange}
                style={{ width: '100%', maxWidth: 260 }}
                allowClear
              />
            }
          >
            <Table
              columns={itemColumns}
              dataSource={filteredItems}
              rowKey="id"
              loading={loading}
              pagination={{
                ...pagination,
                showSizeChanger: true,
                showTotal: (total) => `مجموع: ${total} جعبه`,
              }}
              onChange={handleTableChange}
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
                <Col xs={12} sm={12} md={6} lg={6}>
                  <div style={{ textAlign: "center" }}>
                    <Title level={3} style={{ color: "#1890ff" }}>
                      {
                        orderData.items.filter(
                          (item) => item.pack_type === "POTTED_PLANT"
                        ).length
                      }
                    </Title>
                    <Text>مجموع جعبه‌های گلدانی</Text>
                  </div>
                </Col>
                <Col xs={12} sm={12} md={6} lg={6}>
                  <div style={{ textAlign: "center" }}>
                    <Title level={3} style={{ color: "#52c41a" }}>
                      {
                        orderData.items.filter(
                          (item) => item.pack_type === "CUT_FLOWER"
                        ).length
                      }
                    </Title>
                    <Text>مجموع جعبه‌های شاخه بریده‌دار</Text>
                  </div>
                </Col>
                <Col xs={12} sm={12} md={6} lg={6}>
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
                <Col xs={12} sm={12} md={6} lg={6}>
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
            برای افزودن جعبه جدید به این بسته بندی، به صفحه ایجاد دستی بسته بندی هدایت
            خواهید شد.
          </p>
          <p style={{ marginTop: 16, color: "#666" }}>
            در آن صفحه می‌توانید جعبه‌های جدید را به بسته بندی موجود اضافه کنید.
          </p>
        </div>
      </Modal>

      {/* Modal پیش‌نمایش فاکتورها */}
      <Modal
        title="پیش‌نمایش لیبلهای بسته بندی "
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
            چاپ لیبل‌ها
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
        onCancel={() => {
          setDeleteReasonModalVisible(false);
          setDeleteReason("");
        }}
        onOk={() => {
          const id = deleteTargetId;
          const reason = deleteReason;
          
          // بررسی الزامی بودن فیلد دلیل حذف
          if (!reason || !reason.trim()) {
            message.warning("لطفاً دلیل حذف جعبه را وارد کنید");
            return;
          }
          
          setDeleteReasonModalVisible(false);
          handleDeleteBox(id, reason);
          setDeleteReason("");
        }}
        okText="حذف"
        okButtonProps={{ danger: true }}
        cancelText="انصراف"
        destroyOnClose
      >
        <p style={{ marginBottom: 8 }}>
          لطفاً دلیل حذف این جعبه را وارد کنید: <span style={{ color: "#ff4d4f" }}>*</span>
        </p>
        <Input.TextArea
          value={deleteReason}
          onChange={(e) => setDeleteReason(e.target.value)}
          placeholder="مثلاً: ثبت اشتباه، داده‌های ناقص، تست..."
          autoSize={{ minRows: 3, maxRows: 6 }}
          allowClear
        />
      </Modal>

      {/* Modal تایید لوگو */}
      <Modal
        title="تنظیمات چاپ لیبل"
        open={logoConfirmModalVisible}
        onCancel={() => {
          setLogoConfirmModalVisible(false);
          setPendingPrintAction(null);
        }}
        footer={[
          <Button
            key="without-logo"
            onClick={() => {
              const action = pendingPrintAction;
              setLogoConfirmModalVisible(false);
              setPendingPrintAction(null);
              
              if (action?.type === 'single') {
                executePrintInvoice(action.data, false);
              } else if (action?.type === 'batch') {
                executePrintAllInvoices(false);
              }
            }}
          >
            بدون لوگو
          </Button>,
          <Button
            key="with-logo"
            type="primary"
            onClick={() => {
              const action = pendingPrintAction;
              setLogoConfirmModalVisible(false);
              setPendingPrintAction(null);
              
              if (action?.type === 'single') {
                executePrintInvoice(action.data, true);
              } else if (action?.type === 'batch') {
                executePrintAllInvoices(true);
              }
            }}
          >
            با لوگو
          </Button>,
        ]}
        width={400}
        destroyOnClose
      >
        <div style={{ textAlign: "center", padding: "20px 0" }}>
          <p style={{ fontSize: "15px", marginBottom: 16 }}>
            آیا می‌خواهید لوگو شرکت در لیبل‌ها نمایش داده شود؟
          </p>
          <p style={{ color: "#666", fontSize: "13px" }}>
            با انتخاب "با لوگو"، لوگو شرکت در بالای لیبل نمایش داده می‌شود.
          </p>
        </div>
      </Modal>
    </div>
  );
};

export default PackagingOrderDetails;
