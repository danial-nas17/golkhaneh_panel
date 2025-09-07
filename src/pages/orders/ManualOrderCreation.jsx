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
} from "@ant-design/icons";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api";
import logo from "../../images/1_11zon.jpg";
import UnifiedErrorHandler from "../../utils/unifiedErrorHandler";

const { Title, Text } = Typography;
const { Option } = Select;

// ---------- تنظیمات ثابت ----------
const COMPANY_LOGO = logo;
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

  // برای چاپ فاکتور Batch
  const [completePrintData, setCompletePrintData] = useState(null); // آرایه data از API تکمیل
  const [showInvoicePreview, setShowInvoicePreview] = useState(false);
  const [invoiceHTML, setInvoiceHTML] = useState("");

  // helper: آیا اجازه‌ی ساخت جعبه‌ی بعدی داریم؟
const canAddAnotherBox = boxes.every(b => b.status === "submitted");

// Add new box (global)
const addNewBox = () => {
  if (!canAddAnotherBox) {
    message.warning("ابتدا جعبه‌های قبلی را تکمیل کنید، سپس جعبه جدید بسازید.");
    return;
  }
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
                }
              : {
                  stems: 1,
                  flowers_per_stem: 1,
                }),
          };
          return { ...box, rows: [...box.rows, newRow] };
        }
        return box;
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
  const buildInvoiceHTML = (orderInfoArg, items) => {
    const customerName = orderInfoArg?.customer?.first_name || "نامشخص";
    const orderCode = `#${orderId}`;

    const getPackTypeFa = (t) =>
      t === "POTTED_PLANT"
        ? "گلدان"
        : t === "CUT_FLOWER"
        ? "شاخه بریده"
        : "نامشخص";

    const htmlPages = (items || [])
      .map((box) => {
        const item = box.item || {};
        const printMeta = box.print_meta || {};
        const media = box.media || {};
        const printedAt = box.printed_at || "";
        const serial = box.serial_code || "";

        // شماره جعبه ساده (فقط عدد)
        const boxNo = printMeta.sequence_no || "1";
        const boxTotal = printMeta.sequence_total || "1";

        // ساخت لیست محصولات
        let productDetails = "";
        let totalItems = 0;

        if (item.pack_type === "POTTED_PLANT" && box.pot_summary?.by_variation) {
          // برای گلدان از pot_summary استفاده می‌کنیم
          const variations = box.pot_summary.by_variation;
          productDetails = variations.map(variation => {
            totalItems += variation.pot_count;
            return `<div class="product-item">• ${variation.product_title}: ${variation.pot_count} گلدان</div>`;
          }).join("");
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
            مجموع: ${totalItems} ${item.pack_type === "POTTED_PLANT" ? "گلدان" : "گل"}
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
              <td class="info-value">${printedAt}</td>
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
            media.barcode_url || ""
          }" onerror="this.style.display='none'"/>
          <div class="serial">${serial}</div>
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
          <title>چاپ فاکتور</title>
          <style>${A6_PRINT_CSS}</style>
        </head>
        <body>
          ${htmlPages}
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
  const submitBoxData = async (boxId) => {
    const box = boxes.find((b) => b.id === boxId);
    if (!box || box.rows.length === 0) {
      message.warning("لطفا حداقل یک ردیف به جعبه اضافه کنید");
      return;
    }

    // Validate rows based on pack type
    const invalidRows = box.rows.filter((row) => {
      if (box.pack_type === "POTTED_PLANT") {
        return !row.serial_code || !row.product_id || !row.product_variation_id;
      } else if (box.pack_type === "CUT_FLOWER") {
        return (
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
          pot_type: "سرامیک",
          pots: box.rows.map((row) => ({
            serial_code: row.serial_code,
            product_id: row.product_id,
            product_variation_id: row.product_variation_id,
          })),
        };
      } else if (box.pack_type === "CUT_FLOWER") {
        payload = {
          pack_type: "CUT_FLOWER",
          product_id: box.product_id,
          product_variation_id: box.product_variation_id,
          lines: box.rows.map((row) => ({
            stems: row.stems,
            flowers_per_stem: row.flowers_per_stem,
          })),
        };
      }

      const resp = await api.post(
        `/panel/packaging-orders/${orderId}/items`,
        payload
      );

      // ← تغییر مهم: گرفتن row_no از ریسپانس
      const lastRowNo = resp?.data?.data?.row_no ?? null;

      // Update box status to submitted + ذخیره row_no برای پرینت برچسب
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
      // Use the unified error handler
      const errorResult = UnifiedErrorHandler.handleApiError(error, null, {
        showValidationMessages: true,  // Show validation messages for this case
        showGeneralMessages: true,
        defaultMessage: "خطا در ارسال جعبه"
      });
      
      console.error("Error submitting box:", errorResult);
    } finally {
      setLoading((prev) => ({ ...prev, [boxId]: false }));
    }
  };

  // --- تکمیل سفارش و چاپ فاکتورهای A6 ---
  const handleCompleteOrder = async () => {
    try {
      message.loading({ content: "در حال تکمیل سفارش...", key: "complete" });
      const resp = await api.post(
        `/panel/packaging-orders/${orderId}/complete`
      );
      const arr = resp?.data?.data || [];
      setCompletePrintData(arr);

      const html = buildInvoiceHTML(orderInfo, arr);
      setInvoiceHTML(html);
      setShowInvoicePreview(true);
      message.success({
        content: "سفارش تکمیل شد. پیش‌نمایش آماده است.",
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
    }
  };

  const renderPottedPlantForm = (box, row) => (
    <Row gutter={16}>
      <Col span={8}>
        <Form.Item label="کد سریال">
          <Input
            value={row.serial_code || ""}
            onChange={(e) =>
              updateRowData(box.id, row.id, "serial_code", e.target.value)
            }
            placeholder="مثال: P-08163796"
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
                  {variation.SKU || `تنوع ${variation.product_variant_id}`}
                </Option>
              ))}
          </Select>
        </Form.Item>
      </Col>
    </Row>
  );

  const renderCutFlowerForm = (box, row) => (
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
        {box.pack_type === "CUT_FLOWER" && (
          <div
            style={{
              marginBottom: 24,
              padding: 16,
              backgroundColor: "#f0f8ff",
              borderRadius: 8,
              border: "1px solid #91caff",
            }}
          >
            <Text
              strong
              style={{ color: "#1677ff", marginBottom: 12, display: "block" }}
            >
              تنظیمات کلی برای شاخه بریده
            </Text>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="محصول">
                  <Select
                    value={box.product_id}
                    onChange={(value) => {
                      setBoxes((prev) =>
                        prev.map((b) =>
                          b.id === box.id
                            ? {
                                ...b,
                                product_id: value,
                                product_variation_id: null,
                              }
                            : b
                        )
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
                    value={box.product_variation_id}
                    onChange={(value) => {
                      setBoxes((prev) =>
                        prev.map((b) =>
                          b.id === box.id
                            ? { ...b, product_variation_id: value }
                            : b
                        )
                      );
                    }}
                    placeholder="انتخاب تنوع"
                    style={{ width: "100%" }}
                    disabled={!box.product_id}
                    showSearch
                    filterOption={(input, option) =>
                      option?.children
                        ?.toString()
                        ?.toLowerCase()
                        ?.indexOf(input.toLowerCase()) >= 0
                    }
                  >
                    {getVariationsForProduct(box.product_id).map(
                      (variation) => (
                        <Option
                          key={variation.product_variant_id}
                          value={variation.product_variant_id}
                        >
                          {variation.SKU ||
                            `تنوع ${variation.product_variant_id}`}
                        </Option>
                      )
                    )}
                  </Select>
                </Form.Item>
              </Col>
            </Row>
          </div>
        )}

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
              <Button
                danger
                size="small"
                icon={<MinusOutlined />}
                onClick={() => removeRowFromBox(box.id, row.id)}
                style={{ borderRadius: 6 }}
              >
                حذف
              </Button>
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
        padding: "24px",
        backgroundColor: "#f5f7fa",
        minHeight: "100vh",
      }}
    >
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
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
          }}
        >
          <Space wrap>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate("/orders")}
              style={{ borderRadius: 8 }}
            >
              بازگشت
            </Button>
            <Title level={3} style={{ margin: 0, color: "#2c3e50" }}>
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

          {/* دکمه تکمیل سفارش + چاپ */}
          <Space>
            <Button
              type="primary"
              icon={<CheckCircleOutlined />}
              onClick={handleCompleteOrder}
              style={{ borderRadius: 8, fontWeight: 600 }}
            >
              تکمیل سفارش
            </Button>
            {completePrintData?.length > 0 && (
              <Button
                icon={<PrinterOutlined />}
                onClick={() => printInIframe(invoiceHTML)}
                style={{ borderRadius: 8 }}
              >
                پرینت فاکتورها
              </Button>
            )}
          </Space>
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
            <Row gutter={32}>
              <Col span={12}>
                <Text strong style={{ color: "#1f2937" }}>
                  مشتری:{" "}
                </Text>
                <Text style={{ color: "#333", fontSize: "15px" }}>
                  {orderInfo.customer?.first_name || "نامشخص"}
                </Text>
              </Col>
              <Col span={12}>
                <Text strong style={{ color: "#1f2937" }}>
                  کنترل کننده کیفیت:{" "}
                </Text>
                <Text style={{ color: "#333", fontSize: "15px" }}>
                  {orderInfo.qc_controller || "نامشخص"}
                </Text>
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
              >
                <Button
                  danger
                  icon={<DeleteOutlined />}
                  style={{ borderRadius: 8 }}
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
                <Row gutter={16}>
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
                        <Row gutter={16} style={{ marginTop: 12 }}>
                          <Col span={12}>
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
                          <Col span={12}>
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
        title="پیش‌نمایش فاکتورهای جعبه (A6)"
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
