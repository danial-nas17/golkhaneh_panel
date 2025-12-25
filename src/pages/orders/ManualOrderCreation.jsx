import React, { useState, useEffect } from "react";
import {
  Card,
  Button,
  Select,
  Input,
  InputNumber,
  Space,
  Row,
  Col,
  Divider,
  message,
  notification,
  Typography,
  Popconfirm,
  Badge,
  Form,
  Spin,
  Modal,
} from "antd";
import {
  PlusOutlined,
  MinusOutlined,
  DeleteOutlined,
  GiftOutlined,
  SendOutlined,
  ArrowLeftOutlined,
  PrinterOutlined,
  CheckCircleOutlined,
  FieldNumberOutlined,
  CopyOutlined,
} from "@ant-design/icons";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api";
import logo from "../../images/1_11zon.jpg";
import UnifiedErrorHandler from "../../utils/unifiedErrorHandler";

const { Title, Text } = Typography;
const { Option } = Select;

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

const ManualOrderCreation = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [boxes, setBoxes] = useState([]);
  const [loading, setLoading] = useState({});
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [orderInfo, setOrderInfo] = useState(null);
  const [completingOrder, setCompletingOrder] = useState(false);

  // برای چاپ فاکتور Batch
  const [completePrintData, setCompletePrintData] = useState(null); // آرایه data از API تکمیل
  const [showInvoicePreview, setShowInvoicePreview] = useState(false);
  const [invoiceHTML, setInvoiceHTML] = useState("");

  // برای انتخاب لوگو قبل از پرینت
  const [logoConfirmModalVisible, setLogoConfirmModalVisible] = useState(false);
  const [pendingPrintData, setPendingPrintData] = useState(null);

  // برای نمایش خطاها
  const [errorMessages, setErrorMessages] = useState([]);
  
  // برای نمایش warning (جعبه‌های ناقص)
  const [warningMessage, setWarningMessage] = useState(null);

  // Helper functions for invoice generation
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

  // حذف نسخه تکراری buildVariationLabel

// Add new box (global) - حذف محدودیت
const addNewBox = () => {
  const newBox = {
    id: Date.now(),
    pack_type: null,
    rows: [],
    status: "draft",
    last_row_no: null,
  };
  setBoxes((prev) => [...prev, newBox]);
  message.success("جعبه جدید اضافه شد");
};


// کپی جعبه - مکانیزم جدید
const duplicateBox = (boxId) => {
  const boxToCopy = boxes.find((b) => b.id === boxId);
  if (!boxToCopy) return;

  // بررسی شرایط کپی
  if (boxToCopy.pack_type === "CUT_FLOWER") {
    // برای شاخه بریده: همه ردیف‌ها باید محصول و تنوع داشته باشند
    const hasMissingProduct = boxToCopy.rows.some(
      (row) => !row.product_id || !row.product_variation_id
    );
    if (hasMissingProduct) {
      message.warning(
        "ابتدا محصول و تنوع هر ردیف را کامل کنید، سپس جعبه را کپی کنید."
      );
      return;
    }
  }
  // برای گلدان: در هر زمان می‌توان کپی کرد

  const newBox = {
    id: Date.now(),
    pack_type: boxToCopy.pack_type,
    rows: boxToCopy.rows.map((row) => ({
      ...row,
      id: Date.now() + Math.random(), // ID جدید برای هر ردیف
    })),
    status: "draft",
    last_row_no: null,
  };

  setBoxes((prev) => [...prev, newBox]);
  message.success("جعبه کپی شد");
};


  // Fetch order info
  useEffect(() => {
    if (orderId) {
      fetchOrderInfo();
    }
  }, [orderId]);

  // Fetch products
  useEffect(() => {
    fetchProducts();
  }, []);

  // Auto-close error messages after 10 seconds
  useEffect(() => {
    if (errorMessages.length > 0) {
      const timer = setTimeout(() => {
        setErrorMessages([]);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [errorMessages]);

  // Auto-close warning message after 10 seconds
  useEffect(() => {
    if (warningMessage) {
      const timer = setTimeout(() => {
        setWarningMessage(null);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [warningMessage]);

  const fetchOrderInfo = async () => {
    try {
      const response = await api.get(`/panel/packaging-orders/${orderId}`);
      setOrderInfo(response.data.data);
    } catch (error) {
      // Use the unified error handler
      const errorResult = UnifiedErrorHandler.handleApiError(error, null, {
        showGeneralMessages: true,
        defaultMessage: "خطا در دریافت اطلاعات سفارش"
      });
      
      console.error("Error fetching order info:", errorResult);
    }
  };

  const fetchProducts = async () => {
    setLoadingProducts(true);
    try {
      const response = await api.get("/panel/product", {
        params: {
          includes: ["variants"],
          per_page: 100,
        },
      });
      setProducts(response.data.data || []);
    } catch (error) {
      // Use the unified error handler
      const errorResult = UnifiedErrorHandler.handleApiError(error, null, {
        showGeneralMessages: true,
        defaultMessage: "خطا در دریافت محصولات"
      });
      
      console.error("Error fetching products:", errorResult);
    } finally {
      setLoadingProducts(false);
    }
  };

  // Get variations for a specific product
  const getVariationsForProduct = (productId) => {
    if (!productId) return [];
    const product = products.find((p) => p.id === productId);
    const variations = product ? product.variants || [] : [];
    return variations;
  };

  // // Add new box (global)
  // const addNewBox = () => {
  //   const newBox = {
  //     id: Date.now(),
  //     pack_type: null,
  //     rows: [],
  //     status: "draft",
  //     last_row_no: null, // ← برای پرینت بر اساس row_no
  //   };
  //   setBoxes((prev) => [...prev, newBox]);
  //   message.success("جعبه جدید اضافه شد");
  // };

  // Remove box
  const removeBox = (boxId) => {
    setBoxes((prev) => prev.filter((box) => box.id !== boxId));
    message.success("جعبه حذف شد");
  };

  // Update box pack type
  const updateBoxPackType = (boxId, packType) => {
    setBoxes((prev) =>
      prev.map((box) => {
        if (box.id === boxId) {
          return {
            ...box,
            pack_type: packType,
            rows: [], // Clear rows when changing type
          };
        }
        return box;
      })
    );
  };

  // Add row to specific box
  const addRowToBox = (boxId) => {
    setBoxes((prev) =>
      prev.map((box) => {
        if (box.id === boxId) {
          const newRow = {
            id: Date.now() + Math.random(),
            ...(box.pack_type === "POTTED_PLANT"
              ? {
                  serial_code: "",
                  product_id: null,
                  product_variation_id: null,
                  stems_count: null,
                  flowers_total: null,
                }
              : {
                  stems: 1,
                  flowers_per_stem: 1,
                  product_id: null,
                  product_variation_id: null,
                }),
          };
          return { ...box, rows: [...box.rows, newRow] };
        }
        return box;
      })
    );
  };

  // Duplicate a specific row inside a box
  const duplicateRowInBox = (boxId, rowId) => {
    setBoxes((prev) =>
      prev.map((box) => {
        if (box.id !== boxId) return box;

        const rowIndex = box.rows.findIndex((row) => row.id === rowId);
        if (rowIndex === -1) return box;

        const sourceRow = box.rows[rowIndex];
        const clonedRow = {
          ...sourceRow,
          id: Date.now() + Math.random(),
        };

        return {
          ...box,
          rows: [
            ...box.rows.slice(0, rowIndex + 1),
            clonedRow,
            ...box.rows.slice(rowIndex + 1),
          ],
        };
      })
    );
  };

  // Remove row from box
  const removeRowFromBox = (boxId, rowId) => {
    setBoxes((prev) =>
      prev.map((box) => {
        if (box.id === boxId) {
          return { ...box, rows: box.rows.filter((row) => row.id !== rowId) };
        }
        return box;
      })
    );
  };

  // Update row data
  const updateRowData = (boxId, rowId, field, value) => {
    setBoxes((prevBoxes) =>
      prevBoxes.map((box) => {
        if (box.id === boxId) {
          return {
            ...box,
            rows: box.rows.map((row) =>
              row.id === rowId ? { ...row, [field]: value } : row
            ),
          };
        }
        return box;
      })
    );
  };

  // Get dynamic box name based on index
  const getBoxName = (boxIndex) => `جعبه ${boxIndex + 1}`;

  // Calculate box statistics
  const calculateBoxStats = (box) => {
    if (box.pack_type === "CUT_FLOWER") {
      const totalStems = box.rows.reduce(
        (sum, row) => sum + (row.stems || 0),
        0
      );
      const totalFlowers = box.rows.reduce(
        (sum, row) => sum + (row.stems || 0) * (row.flowers_per_stem || 0),
        0
      );
      return { totalStems, totalFlowers };
    }
    return null;
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

// --- Helper: ساخت HTML فاکتورهای A6 ---
const buildInvoiceHTML = (orderInfoArg, items, includeLogo = true) => {
  // Use the new batch format for consistency
  return buildBatchInvoiceHTML(orderInfoArg, items, includeLogo);
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

            // اگر v خودش variation داشته باشد می‌توان کیفیت را از آن هم گرفت
            const vQuality =
              extractQualityFromVariation(v.product_variation) || "";

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
      // شاخه بریده - با تجمیع خطوط یکسان
      const stems = item.total_stems || 0;
      const flowers = item.total_flowers || 0;

      // تجمیع خطوط بر اساس product + variation
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
        group.stems += line.stems_count || line.line_total_stems || 0;
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
        // fallback: اگر lines نداشتیم
        const line = `${shortProductName(item)} – ${flowers ? `(${toPersianDigits(stems)} شاخه، ${toPersianDigits(flowers)} گل)` : `${toPersianDigits(stems)} شاخه`}`;
      listHTML = `<div class="listBox__item">${line}</div>`;
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
      <title>چاپ لیبل های سفارش</title>
      <style>${A6_PRINT_CSS}</style>
    </head>
    <body>
      ${pages.join("\n")}
    </body>
  </html>
`;
};

  // --- Helper: ساخت HTML برچسب row_no (دو تا 5×5 در A6) ---
  const buildRowNoStickersHTML = (rowNo) => {
    const n = String(rowNo ?? "");
    return `
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
  };

  // Submit box data to backend
  // Submit box data to backend
// Submit box data to backend
// Submit box data to backend
const submitBoxData = async (boxId) => {
  const box = boxes.find((b) => b.id === boxId);
  if (!box || box.rows.length === 0) {
    message.warning("لطفا حداقل یک ردیف به جعبه اضافه کنید");
    return;
  }

  // Validate rows based on pack type
  const invalidRows = box.rows.filter((row) => {
    if (box.pack_type === "POTTED_PLANT") {
      return !row.serial_code || !row.product_id || !row.product_variation_id || 
             row.stems_count === null || row.stems_count === undefined ||
             row.flowers_total === null || row.flowers_total === undefined;
    } else if (box.pack_type === "CUT_FLOWER") {
      return (
        !row.product_id ||
        !row.product_variation_id ||
        !row.stems ||
        !row.flowers_per_stem ||
        row.stems < 1 ||
        row.flowers_per_stem < 1
      );
    }
    return true;
  });

  if (invalidRows.length > 0) {
    message.error("لطفا تمام فیلدهای مورد نیاز را پر کنید");
    return;
  }

  try {
    setLoading((prev) => ({ ...prev, [boxId]: true }));

    let payload;

    if (box.pack_type === "POTTED_PLANT") {
      payload = {
        pack_type: "POTTED_PLANT",
        qc_controller: orderInfo?.qc_controller || "QC-Shift-A",
        pots: box.rows.map((row) => ({
          serial_code: row.serial_code,
          product_id: row.product_id,
          product_variation_id: row.product_variation_id,
          stems_count: row.stems_count,
          flowers_total: row.flowers_total,
        })),
      };
    } else if (box.pack_type === "CUT_FLOWER") {
      payload = {
        pack_type: "CUT_FLOWER",
        lines: box.rows.map((row) => ({
          stems: row.stems,
          flowers_per_stem: row.flowers_per_stem,
          product_id: row.product_id,
          product_variation_id: row.product_variation_id,
        })),
      };
    }

    const resp = await api.post(
      `/panel/packaging-orders/${orderId}/items`,
      payload
    );

    const lastRowNo = resp?.data?.data?.row_no ?? null;

    setBoxes((prev) =>
      prev.map((b) =>
        b.id === boxId
          ? { ...b, status: "submitted", last_row_no: lastRowNo }
          : b
      )
    );

    message.success(
      `${getBoxName(
        boxes.findIndex((b) => b.id === boxId)
      )} با موفقیت ارسال شد`
    );
   } catch (error) {
     console.error("Error submitting box:", error);
     
     if (error.response) {
       const { status, data } = error.response;
       
       if (status === 422 && data?.data?.errors) {
         const validationErrors = data.data.errors;
         const errorKeys = Object.keys(validationErrors);
         
         if (errorKeys.length > 0) {
           const allErrors = [];
           
           errorKeys.forEach(field => {
             const errors = validationErrors[field];
             if (Array.isArray(errors) && errors.length > 0) {
               errors.forEach(errorMsg => {
                 const decodedMsg = errorMsg.replace(/\\u[\dA-F]{4}/gi, (match) => {
                   return String.fromCharCode(parseInt(match.replace(/\\u/g, ''), 16));
                 });
                 allErrors.push(decodedMsg);
               });
             }
           });
           
          if (allErrors.length > 0) {
            // Show errors in custom UI
            setErrorMessages(allErrors);
          }
         }
      } else {
        const errorMessage = data?.message || 'خطا در ارسال جعبه';
        const decodedMessage = errorMessage.replace(/\\u[\dA-F]{4}/gi, (match) => {
          return String.fromCharCode(parseInt(match.replace(/\\u/g, ''), 16));
        });
        setErrorMessages([decodedMessage]);
      }
    } else {
      setErrorMessages(['خطای شبکه - لطفاً اتصال اینترنت خود را بررسی کنید']);
    }
   } finally {
     setLoading((prev) => ({ ...prev, [boxId]: false }));
   }
 };

  // --- تکمیل سفارش و چاپ فاکتورهای A6 ---
  const handleCompleteOrder = async () => {
    if (completingOrder) return; // Prevent multiple clicks

    // اعتبارسنجی جعبه‌های ناقص
    console.log("همه جعبه‌ها:", boxes);
    
    const incompleteBoxes = boxes.filter(box => {
      if (box.status === "submitted") return false; // جعبه‌های تکمیل شده را نادیده بگیر
      
      console.log(`بررسی جعبه ${box.id}:`, {
        pack_type: box.pack_type,
        product_id: box.product_id,
        product_variation_id: box.product_variation_id,
        rows: box.rows,
        status: box.status
      });
      
      // بررسی جعبه‌های ناقص
      if (!box.pack_type) {
        console.log(`جعبه ${box.id} ناقص: نوع بسته‌بندی انتخاب نشده`);
        return true; // نوع بسته‌بندی انتخاب نشده
      }
      if (!box.rows || box.rows.length === 0) {
        console.log(`جعبه ${box.id} ناقص: هیچ ردیفی ندارد`);
        return true; // هیچ ردیفی ندارد
      }
      
      if (box.pack_type === "CUT_FLOWER") {
        // بررسی ردیف‌ها - باید مقادیر معتبر و انتخاب محصول/تنوع داشته باشند
        const hasInvalidRows = box.rows.some(row => {
          const missingProduct = !row.product_id || !row.product_variation_id;
          const invalidCounts =
            !row.stems || !row.flowers_per_stem || row.stems < 1 || row.flowers_per_stem < 1;

          if (missingProduct || invalidCounts) {
            console.log(`جعبه ${box.id} ناقص: ردیف نامعتبر:`, row);
          }
          return missingProduct || invalidCounts;
        });
        return hasInvalidRows;
      } else if (box.pack_type === "POTTED_PLANT") {
        // برای گلدان: بررسی ردیف‌ها
        const hasInvalidRows = box.rows.some(row => {
          const isInvalid = !row.product_id || 
            !row.product_variation_id || 
            !row.serial_code || 
            row.serial_code.trim() === "" ||
            row.stems_count === null || row.stems_count === undefined ||
            row.flowers_total === null || row.flowers_total === undefined;
          if (isInvalid) {
            console.log(`جعبه ${box.id} ناقص: ردیف گلدان نامعتبر:`, row);
          }
          return isInvalid;
        });
        return hasInvalidRows;
      }
      
      return false;
    });

    if (incompleteBoxes.length > 0) {
      console.log("جعبه‌های ناقص:", incompleteBoxes);
      
      // ساخت لیست نام جعبه‌های ناقص
      const incompleteBoxNames = incompleteBoxes.map((box, idx) => {
        const boxIndex = boxes.findIndex(b => b.id === box.id);
        return getBoxName(boxIndex);
      });
      
      // نمایش پیام به کاربر با UI سفارشی
      setWarningMessage({
        title: `شما ${incompleteBoxes.length} جعبه ناقص دارید`,
        boxes: incompleteBoxNames
      });
      
      return;
    }

    try {
      setCompletingOrder(true);
      message.loading({ content: "در حال تکمیل سفارش...", key: "complete" });
      const resp = await api.post(
        `/panel/packaging-orders/${orderId}/complete`
      );
      const arr = resp?.data?.data || [];
      setCompletePrintData(arr);
      setPendingPrintData(arr);
      
      // نمایش مودال تایید لوگو
      setLogoConfirmModalVisible(true);
      
      message.success({
        content: "سفارش تکمیل شد.",
        key: "complete",
      });
    } catch (error) {
      // Use the unified error handler
      const errorResult = UnifiedErrorHandler.handleApiError(error, null, {
        showValidationMessages: true,
        showGeneralMessages: true,
        defaultMessage: "خطا در تکمیل سفارش"
      });

      message.error({ content: errorResult.message, key: "complete" });
      console.error("Error completing order:", errorResult);
    } finally {
      setCompletingOrder(false);
    }
  };

  const executePrintInvoices = (includeLogo) => {
    const html = buildInvoiceHTML(orderInfo, pendingPrintData, includeLogo);
    setInvoiceHTML(html);
    setShowInvoicePreview(true);
  };

  const renderPottedPlantForm = (box, row) => (
    <>
      <Row gutter={16}>
        <Col span={8}>
          <Form.Item label="کد سریال">
            <Input
              value={row.serial_code || ""}
              onChange={(e) =>
                updateRowData(box.id, row.id, "serial_code", e.target.value)
              }
              placeholder="مثال: P-08163796"
              disabled={box.status === "submitted"}
            />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item label="محصول">
            <Select
              value={row.product_id || undefined}
              onChange={(value) => {
                // set product and reset variation
                setBoxes((prevBoxes) =>
                  prevBoxes.map((b) => {
                    if (b.id === box.id) {
                      return {
                        ...b,
                        rows: b.rows.map((r) =>
                          r.id === row.id
                            ? {
                                ...r,
                                product_id: value,
                                product_variation_id: null,
                              }
                            : r
                        ),
                      };
                    }
                    return b;
                  })
                );
              }}
              placeholder="انتخاب محصول"
              loading={loadingProducts}
              style={{ width: "100%" }}
              showSearch
              filterOption={(input, option) =>
                option?.children
                  ?.toString()
                  ?.toLowerCase()
                  ?.indexOf(input.toLowerCase()) >= 0
              }
            >
              {products.map((product) => (
                <Option key={product.id} value={product.id}>
                  {product.title}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item label="تنوع">
            <Select
              value={row.product_variation_id || undefined}
              onChange={(value) =>
                updateRowData(box.id, row.id, "product_variation_id", value)
              }
              placeholder="انتخاب تنوع"
              style={{ width: "100%" }}
              disabled={!row.product_id}
              showSearch
              filterOption={(input, option) =>
                option?.children
                  ?.toString()
                  ?.toLowerCase()
                  ?.indexOf(input.toLowerCase()) >= 0
              }
              notFoundContent={
                row.product_id ? "تنوعی یافت نشد" : "ابتدا محصول را انتخاب کنید"
              }
            >
              {row.product_id &&
                getVariationsForProduct(row.product_id).map((variation) => (
                  <Option
                    key={variation.product_variant_id}
                    value={variation.product_variant_id}
                  >
                    {buildVariationLabel(
                      variation,
                      (products.find((p) => p.id === row.product_id) || {}).title
                    )}
                  </Option>
                ))}
            </Select>
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item label="تعداد شاخه">
            <InputNumber
              min={0}
              value={row.stems_count}
              onChange={(value) => updateRowData(box.id, row.id, "stems_count", value)}
              placeholder="تعداد شاخه"
              style={{ width: "100%" }}
              disabled={box.status === "submitted"}
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label="تعداد گل">
            <InputNumber
              min={0}
              value={row.flowers_total}
              onChange={(value) => updateRowData(box.id, row.id, "flowers_total", value)}
              placeholder="تعداد گل"
              style={{ width: "100%" }}
              disabled={box.status === "submitted"}
            />
          </Form.Item>
        </Col>
      </Row>
    </>
  );

  const renderCutFlowerForm = (box, row) => (
    <>
    <Row gutter={16}>
      <Col span={12}>
                <Form.Item label="محصول">
                  <Select
              value={row.product_id || undefined}
                    onChange={(value) => {
                // set product and reset variation
                setBoxes((prevBoxes) =>
                  prevBoxes.map((b) => {
                    if (b.id === box.id) {
                      return {
                                ...b,
                        rows: b.rows.map((r) =>
                          r.id === row.id
                            ? {
                                ...r,
                                product_id: value,
                                product_variation_id: null,
                              }
                            : r
                        ),
                      };
                    }
                    return b;
                  })
                      );
                    }}
                    placeholder="انتخاب محصول"
                    loading={loadingProducts}
                    style={{ width: "100%" }}
                    showSearch
                    filterOption={(input, option) =>
                      option?.children
                        ?.toString()
                        ?.toLowerCase()
                        ?.indexOf(input.toLowerCase()) >= 0
                    }
                  >
                    {products.map((product) => (
                      <Option key={product.id} value={product.id}>
                        {product.title}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
        <Col span={12}>
                <Form.Item label="تنوع">
                  <Select
              value={row.product_variation_id || undefined}
              onChange={(value) =>
                updateRowData(box.id, row.id, "product_variation_id", value)
              }
                    placeholder="انتخاب تنوع"
                    style={{ width: "100%" }}
              disabled={!row.product_id}
                    showSearch
                    filterOption={(input, option) =>
                      option?.children
                        ?.toString()
                        ?.toLowerCase()
                        ?.indexOf(input.toLowerCase()) >= 0
                    }
              notFoundContent={
                row.product_id ? "تنوعی یافت نشد" : "ابتدا محصول را انتخاب کنید"
              }
            >
              {row.product_id &&
                getVariationsForProduct(row.product_id).map((variation) => (
                        <Option
                    key={variation.product_variant_id ?? variation.id}
                    value={variation.product_variant_id ?? variation.id}
                        >
                    {buildVariationLabel(
                      variation,
                      (products.find((p) => p.id === row.product_id) || {}).title
                    )}
                        </Option>
                ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item label="تعداد شاخه">
            <InputNumber
              min={1}
              value={row.stems}
              onChange={(value) => updateRowData(box.id, row.id, "stems", value)}
              placeholder="تعداد شاخه"
              style={{ width: "100%" }}
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label="گل در هر شاخه">
            <InputNumber
              min={1}
              value={row.flowers_per_stem}
              onChange={(value) =>
                updateRowData(box.id, row.id, "flowers_per_stem", value)
              }
              placeholder="گل در هر شاخه"
              style={{ width: "100%" }}
            />
          </Form.Item>
        </Col>
      </Row>
    </>
  );

  // پرینت برچسب row_no برای یک جعبه
  const handlePrintRowNo = (rowNo) => {
    if (rowNo === undefined || rowNo === null) {
      message.warning("row_no برای این جعبه موجود نیست");
      return;
    }
    printInIframe(buildRowNoStickersHTML(rowNo));
  };

  const renderBoxContent = (box, boxIndex) => {
    if (!box.pack_type) {
      return (
        <div style={{ padding: "40px", textAlign: "center", color: "#999" }}>
          <GiftOutlined
            style={{ fontSize: 32, marginBottom: 16, color: "#d9d9d9" }}
          />
          <div>لطفا نوع جعبه را انتخاب کنید</div>
          </div>
      );
    }

    return (
      <>
        {box.rows.map((row, rowIndex) => (
          <Card
            key={row.id}
            size="small"
            style={{
              marginBottom: 16,
              border: "1px solid #f0f0f0",
              borderRadius: 8,
            }}
            bodyStyle={{ padding: "16px" }}
            title={
              <Space>
                <Badge
                  count={rowIndex + 1}
                  style={{
                    backgroundColor:
                      box.pack_type === "POTTED_PLANT" ? "#52c41a" : "#1677ff",
                    fontSize: "12px",
                  }}
                />
                <Text strong style={{ color: "#333" }}>
                  {box.pack_type === "POTTED_PLANT"
                    ? `گلدان ${rowIndex + 1}`
                    : `ردیف ${rowIndex + 1}`}
                </Text>
              </Space>
            }
            extra={
              <Space>
                <Button
                  danger
                  size="small"
                  icon={<MinusOutlined />}
                  onClick={() => removeRowFromBox(box.id, row.id)}
                  style={{ borderRadius: 6 }}
                  disabled={box.status === "submitted"}
                >
                  حذف
                </Button>
                <Button
                  size="small"
                  icon={<CopyOutlined />}
                  onClick={() => duplicateRowInBox(box.id, row.id)}
                  style={{ borderRadius: 6 }}
                  disabled={box.status === "submitted"}
                >
                  کپی ردیف
                </Button>
              </Space>
            }
          >
            {box.pack_type === "POTTED_PLANT" &&
              renderPottedPlantForm(box, row)}
            {box.pack_type === "CUT_FLOWER" && renderCutFlowerForm(box, row)}
          </Card>
        ))}

        <Button
          type="dashed"
          icon={<PlusOutlined />}
          onClick={() => addRowToBox(box.id)}
          disabled={box.status === "submitted"}
          style={{
            width: "100%",
            height: 50,
            borderColor:
              box.pack_type === "POTTED_PLANT" ? "#52c41a" : "#1677ff",
            color: box.pack_type === "POTTED_PLANT" ? "#52c41a" : "#1677ff",
            borderRadius: 8,
            fontSize: "14px",
            fontWeight: 500,
          }}
        >
          {box.pack_type === "POTTED_PLANT"
            ? "افزودن گلدان جدید"
            : "افزودن ردیف جدید"}{" "}
          به {getBoxName(boxIndex)}
        </Button>
      </>
    );
  };

  if (!orderInfo) {
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

  return (
    <div
      style={{
        padding: "16px",
        backgroundColor: "#f5f7fa",
        minHeight: "100vh",
      }}
      className="responsive-container"
    >
      {/* Custom Error Display */}
      {errorMessages.length > 0 && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          left: '20px',
          zIndex: 9999,
          maxWidth: '500px',
          margin: '0 auto'
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '8px',
            padding: '16px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            border: '1px solid #ff4d4f'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '12px'
            }}>
              <span style={{
                color: '#ff4d4f',
                fontSize: '16px',
                fontWeight: 'bold',
                fontFamily: 'MyCustomFont, sans-serif'
              }}>
                خطا
              </span>
              <button
                onClick={() => setErrorMessages([])}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#999',
                  fontSize: '20px',
                  cursor: 'pointer',
                  padding: '0',
                  width: '24px',
                  height: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ×
              </button>
            </div>
            <div>
              {errorMessages.map((msg, idx) => (
                <div 
                  key={idx}
                  style={{
                    padding: '8px 0',
                    color: '#262626',
                    fontSize: '14px',
                    lineHeight: '1.6',
                    fontFamily: 'MyCustomFont, sans-serif',
                    borderBottom: idx < errorMessages.length - 1 ? '1px solid #f0f0f0' : 'none'
                  }}
                >
                  {errorMessages.length > 1 && `${idx + 1}. `}{msg}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Custom Warning Display */}
      {warningMessage && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          left: '20px',
          zIndex: 9999,
          maxWidth: '500px',
          margin: '0 auto'
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '8px',
            padding: '16px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            border: '1px solid #faad14'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '12px'
            }}>
              <span style={{
                color: '#faad14',
                fontSize: '16px',
                fontWeight: 'bold',
                fontFamily: 'MyCustomFont, sans-serif'
              }}>
                ⚠️ {warningMessage.title}
              </span>
              <button
                onClick={() => setWarningMessage(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#999',
                  fontSize: '20px',
                  cursor: 'pointer',
                  padding: '0',
                  width: '24px',
                  height: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ×
              </button>
            </div>
            <div style={{
              fontFamily: 'MyCustomFont, sans-serif',
              fontSize: '14px',
              lineHeight: '1.8',
              color: '#262626'
            }}>
              <p style={{ marginBottom: '12px' }}>
                لطفاً ابتدا آن‌ها را تکمیل کنید:
              </p>
              <div style={{
                background: '#fff7e6',
                border: '1px solid #ffd591',
                borderRadius: '6px',
                padding: '12px',
                marginTop: '8px'
              }}>
                {warningMessage.boxes.map((boxName, idx) => (
                  <div key={idx} style={{ marginBottom: '4px' }}>
                    {idx + 1}. {boxName}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Header */}
      <Card
        style={{
          marginBottom: 24,
          borderRadius: 12,
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.06)",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
          className="order-creation-header"
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
                style={{ borderRadius: 8 }}
                size="small"
              >
                بازگشت
              </Button>
              <Title level={3} style={{ margin: 0, color: "#2c3e50", fontSize: "18px" }}>
                ایجاد سفارش دستی
              </Title>
              <Badge
                count={`#${orderId}`}
                style={{
                  backgroundColor: "#faad14",
                  color: "#fff",
                  fontSize: "12px",
                }}
              />
            </Space>
          </div>

          {/* دکمه تکمیل سفارش + چاپ */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
              width: "100%",
            }}
          >
            <Button
              type="primary"
              icon={<CheckCircleOutlined />}
              onClick={handleCompleteOrder}
              loading={completingOrder}
              style={{ borderRadius: 8, fontWeight: 600, flex: 1, minWidth: 120 }}
              block
            >
              تکمیل سفارش
            </Button>
            {completePrintData?.length > 0 && (
              <Button
                icon={<PrinterOutlined />}
                onClick={() => printInIframe(invoiceHTML)}
                style={{ borderRadius: 8, flex: 1, minWidth: 120 }}
                block
              >
                پرینت فاکتورها
              </Button>
            )}
          </div>
        </div>

        {orderInfo && (
          <div
            style={{
              marginTop: 20,
              padding: 20,
              background: "#fafafa",
              borderRadius: 10,
              border: "1px solid #f0f0f0",
            }}
          >
            <Row gutter={{ xs: 16, sm: 24, md: 32 }}>
              <Col xs={24} sm={12}>
                <div style={{ marginBottom: 8 }}>
                  <Text strong style={{ color: "#1f2937", display: "block", marginBottom: 4 }}>
                    مشتری:
                  </Text>
                  <Text style={{ color: "#333", fontSize: "15px" }}>
                    {orderInfo.customer?.first_name} {orderInfo.customer?.last_name}
                  </Text>
                </div>
              </Col>
              <Col xs={24} sm={12}>
                <div style={{ marginBottom: 8 }}>
                  <Text strong style={{ color: "#1f2937", display: "block", marginBottom: 4 }}>
                    کنترل کننده کیفیت:
                  </Text>
                  <Text style={{ color: "#333", fontSize: "15px" }}>
                    {orderInfo.qc_controller || "نامشخص"}
                  </Text>
                </div>
              </Col>
            </Row>
          </div>
        )}
      </Card>

      {/* Boxes */}
      {boxes.map((box, index) => (
        <Card
          key={box.id}
          className="box-card"
          style={{
            marginBottom: 32,
            borderRadius: 12,
            boxShadow:
              box.status === "submitted"
                ? "0 6px 20px rgba(76, 175, 80, 0.12)"
                : "0 6px 20px rgba(0, 0, 0, 0.06)",
            border:
              box.status === "submitted"
                ? "2px solid #4caf50"
                : "1px solid #f0f0f0",
          }}
          title={
            <Space wrap>
              <GiftOutlined style={{ fontSize: "18px" }} />
              <span style={{ fontSize: "18px", fontWeight: "bold" }}>
                {getBoxName(index)}
              </span>
              <Badge
                status={box.status === "submitted" ? "success" : "default"}
                text={box.status === "submitted" ? "ارسال شده" : "پیش‌نویس"}
                style={{ fontSize: "13px" }}
              />
              {box.pack_type && (
                <Badge
                  count={
                    box.pack_type === "POTTED_PLANT" ? "گلدان" : "شاخه بریده"
                  }
                  style={{
                    backgroundColor:
                      box.pack_type === "POTTED_PLANT" ? "#52c41a" : "#1677ff",
                    fontSize: "11px",
                  }}
                />
              )}
            </Space>
          }
          extra={
            <Space wrap>
              {/* دکمه پرینت برچسب ردیف (row_no) بعد از ارسال */}
              {box.status === "submitted" && (
                <Button
                  // icon={<FieldNumberOutlined />}
                  onClick={() => handlePrintRowNo(box.last_row_no)}
                  style={{ borderRadius: 8 }}
                >
                  پرینت برچسب ردیف
                </Button>
              )}

              <Popconfirm
                title="آیا از حذف این جعبه اطمینان دارید؟"
                onConfirm={() => removeBox(box.id)}
                okText="بله"
                cancelText="خیر"
                disabled={box.status === "submitted"}
              >
                <Button
                  danger
                  icon={<DeleteOutlined />}
                  style={{ borderRadius: 8 }}
                  disabled={box.status === "submitted"}
                >
                  حذف جعبه
                </Button>
              </Popconfirm>
            </Space>
          }
        >
          {/* Pack Type Selector */}
          <div
            style={{
              marginBottom: 24,
              padding: 16,
              backgroundColor: "#fafafa",
              borderRadius: 8,
              border: "1px solid #f0f0f0",
            }}
          >
            <Form.Item
              label={<Text strong>نوع بسته‌بندی</Text>}
              style={{ marginBottom: 0 }}
            >
              <Select
                value={box.pack_type}
                onChange={(value) => updateBoxPackType(box.id, value)}
                placeholder="انتخاب نوع بسته‌بندی"
                style={{ width: "100%" }}
                size="large"
                disabled={box.status === "submitted"} 
              >
                <Option value="POTTED_PLANT">
                  <Space>
                    <GiftOutlined style={{ color: "#52c41a" }} />
                    گلدان
                  </Space>
                </Option>
                <Option value="CUT_FLOWER">
                  <Space>
                    <GiftOutlined style={{ color: "#1677ff" }} />
                    شاخه بریده
                  </Space>
                </Option>
              </Select>
            </Form.Item>
          </div>

          {renderBoxContent(box, index)}

          {box.rows.length > 0 && (
            <>
              <Divider style={{ margin: "24px 0" }} />
              <div
                style={{
                  textAlign: "center",
                  padding: "16px",
                  background:
                    box.pack_type === "POTTED_PLANT"
                      ? "linear-gradient(135deg, #f6ffed 0%, #d9f7be 100%)"
                      : "linear-gradient(135deg, #e6f7ff 0%, #bae7ff 100%)",
                  borderRadius: "10px",
                  border:
                    box.pack_type === "POTTED_PLANT"
                      ? "1px solid #b7eb8f"
                      : "1px solid #91caff",
                }}
              >
                <Row gutter={{ xs: 8, sm: 16 }}>
                  <Col span={24}>
                    <Text type="secondary" style={{ fontSize: "15px" }}>
                      تعداد{" "}
                      {box.pack_type === "POTTED_PLANT"
                        ? "گلدان‌ها"
                        : "ردیف‌ها"}
                      :
                      <Text
                        strong
                        style={{
                          fontSize: "16px",
                          marginLeft: 8,
                          color: "#1677ff",
                        }}
                      >
                        {box.rows.length}
                      </Text>
                    </Text>
                  </Col>
                </Row>

                {box.pack_type === "CUT_FLOWER" &&
                  (() => {
                    const stats = calculateBoxStats(box);
                    return (
                      stats && (
                        <Row gutter={{ xs: 8, sm: 16 }} style={{ marginTop: 12 }}>
                          <Col xs={24} sm={12}>
                            <Text type="secondary" style={{ fontSize: "14px" }}>
                              مجموع شاخه‌ها:{" "}
                              <Text
                                strong
                                style={{ color: "#1677ff", fontSize: "15px" }}
                              >
                                {stats.totalStems}
                              </Text>
                            </Text>
                          </Col>
                          <Col xs={24} sm={12}>
                            <Text type="secondary" style={{ fontSize: "14px" }}>
                              مجموع گل‌ها:{" "}
                              <Text
                                strong
                                style={{ color: "#52c41a", fontSize: "15px" }}
                              >
                                {stats.totalFlowers}
                              </Text>
                            </Text>
                          </Col>
                        </Row>
                      )
                    );
                  })()}
              </div>
            </>
          )}

          {/* دکمه‌های تکمیل جعبه و کپی در پایین */}
          <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid #f0f0f0" }}>
            <Space wrap style={{ width: "100%" }}>
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={() => submitBoxData(box.id)}
                loading={loading[box.id]}
                disabled={box.status === "submitted"}
                style={{ borderRadius: 8, fontWeight: 500 }}
              >
                تکمیل جعبه
              </Button>
              <Button
                icon={<CopyOutlined />}
                onClick={() => duplicateBox(box.id)}
                title="کپی جعبه"
                style={{ borderRadius: 8 }}
                disabled={
                  box.pack_type === "CUT_FLOWER" 
                    ? box.rows.some(
                        (row) => !row.product_id || !row.product_variation_id
                      )
                    : false // برای گلدان همیشه فعال
                }
              >
                کپی
              </Button>
            </Space>
          </div>
        </Card>
      ))}

      {boxes.length === 0 && (
        <Card
          style={{
            textAlign: "center",
            padding: "60px",
            borderRadius: 16,
            background: "#ffffff",
            border: "2px dashed #dee2e6",
          }}
        >
          <GiftOutlined
            style={{ fontSize: 64, color: "#6c757d", marginBottom: 24 }}
          />
          <Title level={3} style={{ color: "#495057", marginBottom: 16 }}>
            هیچ جعبه‌ای ایجاد نشده
          </Title>
          <Text
            style={{
              color: "#6c757d",
              fontSize: "16px",
              marginBottom: 32,
              display: "block",
            }}
          >
            برای شروع، روی دکمه زیر کلیک کنید
          </Text>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={addNewBox}
            size="large"
            style={{
              height: 50,
              paddingLeft: 32,
              paddingRight: 32,
              border: "none",
              borderRadius: 8,
              fontSize: "16px",
              fontWeight: 600,
            }}
          >
            ایجاد اولین جعبه
          </Button>
        </Card>
      )}

      {/* Global bottom action (outside all boxes) */}
      {boxes.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={addNewBox}
            size="large"
            style={{ width: "100%", height: 50, borderRadius: 8 }}
          >
            ایجاد جعبه جدید
          </Button>
        </div>
      )}

      {/* Modal پیش‌نمایش فاکتورها */}
      <Modal
        title="پیش‌نمایش لیبلهای جعبه (A6)"
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
            چاپ
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

      {/* Modal تایید لوگو */}
      <Modal
        title="تنظیمات چاپ لیبل"
        open={logoConfirmModalVisible}
        onCancel={() => {
          setLogoConfirmModalVisible(false);
          setPendingPrintData(null);
        }}
        footer={[
          <Button
            key="without-logo"
            onClick={() => {
              setLogoConfirmModalVisible(false);
              executePrintInvoices(false);
            }}
          >
            بدون لوگو
          </Button>,
          <Button
            key="with-logo"
            type="primary"
            onClick={() => {
              setLogoConfirmModalVisible(false);
              executePrintInvoices(true);
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

      <style jsx>{`
        /* پاک‌سازی گرادیانت‌ها و استفاده از ظاهری خنثی */
        .box-card .ant-card-head {
          background: #fff;
          color: inherit;
          border-radius: 12px 12px 0 0;
        }

        .box-card .ant-card-head-title {
          color: inherit;
        }

        .box-card
          .ant-card-head
          .ant-space-item
          .ant-badge
          .ant-badge-status-text {
          color: inherit;
        }

        .ant-form-item-label > label {
          font-weight: 600;
          color: #2c3e50;
        }

        .ant-select-selector:hover,
        .ant-input:hover,
        .ant-input-number:hover {
          border-color: #1677ff !important;
        }
      `}</style>
    </div>
  );
};

export default ManualOrderCreation;
