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
  Tag,
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
  EditOutlined,
} from "@ant-design/icons";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api";
import logo from "../../images/1_11zon.jpg";
import BoxEditModal from "./boxModal";

const { Title, Text } = Typography;
const { Option } = Select;

// ---------- تنظیمات ثابت ----------
const COMPANY_LOGO = logo;
const A6_PRINT_CSS = `
  @page { size: A6; margin: 5mm; }
  * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
  body { direction: rtl; font-family: IRANSans, Vazirmatn, Tahoma, Arial, sans-serif; }
  .page { width: 100%; min-height: calc(148mm - 10mm); box-sizing: border-box; page-break-after: always; }

  .inv-card {
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 12px;
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .inv-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
    min-height: 40px;
  }

  .box-no {
    font-weight: bold;
    font-size: 12px;
    color: #111827;
    flex: 0 0 auto;
  }

  .inv-title {
    font-size: 14px;
    font-weight: 700;
    text-align: right;
    flex: 0 0 auto;
  }

  .inv-logo-container {
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .inv-logo {
    height: 90px;
    max-width: 120px;
    object-fit: contain;
    display: block;
  }

  .inv-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px;
    font-size: 11px;
    margin-bottom: 14px;
    flex: 1;
  }

  .inv-row {
    display: flex;
    gap: 4px;
    align-items: flex-start;
  }

  .inv-label {
    color: #6b7280;
    min-width: 85px;
    font-size: 10px;
  }

  .inv-val {
    color: #111827;
    font-weight: 600;
    font-size: 11px;
    flex: 1;
  }

  .barcode-box {
    margin-top: auto;
    text-align: center;
    padding-top: 8px;
  }

  .barcode-img {
    width: 50%;
    max-width: 56mm;
    height: 6mm;
    object-fit: contain;
    margin: 0 auto;
    display: block;
  }

  .serial {
    font-size: 11px;
    margin-top: 3px;
    font-weight: bold;
    letter-spacing: 1px;
    color: #111827;
    word-break: break-all;
  }

  .muted {
    color: #6b7280;
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

  // For existing boxes from API
  const [existingBoxes, setExistingBoxes] = useState([]);
  const [loadingExistingBoxes, setLoadingExistingBoxes] = useState(false);

  // Box edit modal
  const [boxEditModalVisible, setBoxEditModalVisible] = useState(false);
  const [selectedBoxId, setSelectedBoxId] = useState(null);

  // برای چاپ فاکتور Batch
  const [completePrintData, setCompletePrintData] = useState(null);
  const [showInvoicePreview, setShowInvoicePreview] = useState(false);
  const [invoiceHTML, setInvoiceHTML] = useState("");

  // Fetch order info
  useEffect(() => {
    if (orderId) {
      fetchOrderInfo();
      fetchExistingBoxes();
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
      message.error("خطا در دریافت اطلاعات سفارش");
      console.error("Error fetching order info:", error);
    }
  };

  const fetchExistingBoxes = async () => {
    setLoadingExistingBoxes(true);
    try {
      const response = await api.get(`/panel/packaging-orders/${orderId}/items`, {
        params: {
          'includes[]': ['product', 'variation', 'pots', 'lines', 'label']
        }
      });
      setExistingBoxes(response.data.data || []);
    } catch (error) {
      message.error("خطا در دریافت جعبه‌های موجود");
      console.error("Error fetching existing boxes:", error);
    } finally {
      setLoadingExistingBoxes(false);
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
      message.error("خطا در دریافت محصولات");
      console.error("Error fetching products:", error);
    } finally {
      setLoadingProducts(false);
    }
  };

  const openBoxEditModal = (boxId) => {
    setSelectedBoxId(boxId);
    setBoxEditModalVisible(true);
  };

  const handleBoxUpdated = () => {
    fetchExistingBoxes();
  };

  // Get variations for a specific product
  const getVariationsForProduct = (productId) => {
    if (!productId) return [];
    const product = products.find((p) => p.id === productId);
    const variations = product ? product.variants || [] : [];
    return variations;
  };

  // Add new box (global)
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
      setTimeout(() => {
        try {
          w.focus();
          w.print();
        } catch {}
      }, 100);
      w.addEventListener("afterprint", cleanup, { once: true });
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
    const customerName = orderInfoArg?.customer?.name || "نامشخص";
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

        // رنگ‌ها (فقط برای شاخه بریده)
        let colors = "";
        const iv = box.item_variation || item.product_variation_id || {};
        const attrs = iv.attribute_varitation || [];
        const colorEntry = attrs.find(
          (a) => (a.name || "").includes("رنگ") || (a.key || "").includes("رنگ")
        );
        if (colorEntry && Array.isArray(colorEntry.values)) {
          colors = colorEntry.values
            .map((v) => v.name || v.value)
            .filter(Boolean)
            .join("، ");
        }

        // UPC
        const upc = iv.UPC || "";

        // تعداد
        const qty =
          item.pack_type === "CUT_FLOWER"
            ? item.total_stems ?? 0
            : item.total_pots ?? 0;

        // شماره جعبه x از y
        const boxNoText =
          printMeta.sequence_no && printMeta.sequence_total
            ? `${printMeta.sequence_no} از ${printMeta.sequence_total}`
            : "-";

        return `
    <div class="page">
      <div class="inv-card">
        
       <!-- Header -->
        <div class="inv-head">
          <div class="inv-title">فاکتور جعبه</div>
          <div class="inv-logo-container">
            <img class="inv-logo" src="${COMPANY_LOGO}" alt="لوگو شرکت" />
          </div>
          <div class="box-no">جعبه: ${boxNoText}</div>
        </div>

        <!-- Info Grid -->
        <div class="inv-grid">
          <div class="inv-row"><div class="inv-label">نام مشتری:</div><div class="inv-val">${customerName}</div></div>
          <div class="inv-row"><div class="inv-label">تاریخ:</div><div class="inv-val">${printedAt}</div></div>

          <div class="inv-row"><div class="inv-label">رنگ‌های کالا:</div><div class="inv-val">${
            colors || "-"
          }</div></div>
          <div class="inv-row"><div class="inv-label">کد کالا (UPC):</div><div class="inv-val">${
            upc || "-"
          }</div></div>

          <div class="inv-row"><div class="inv-label">کد سفارش:</div><div class="inv-val">${orderCode}</div></div>
          <div class="inv-row"><div class="inv-label">تعداد:</div><div class="inv-val">${qty}</div></div>

          <div class="inv-row"><div class="inv-label">نام اپراتور:</div><div class="inv-val">${
            item.qc_controller || "-"
          }</div></div>
          <div class="inv-row"><div class="inv-label">نوع بسته‌بندی:</div><div class="inv-val">${getPackTypeFa(
            item.pack_type
          )}</div></div>
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
      
      // Refresh existing boxes
      fetchExistingBoxes();
    } catch (error) {
      message.error("خطا در ارسال جعبه");
      console.error("Error submitting box:", error);
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
    } catch (e) {
      console.error(e);
      message.error({ content: "خطا در تکمیل سفارش", key: "complete" });
    }
  };

  const renderExistingBox = (box) => {
    const getPackTypeFa = (type) =>
      type === "POTTED_PLANT" ? "گلدان" : type === "CUT_FLOWER" ? "شاخه بریده" : "نامشخص";

    const getBoxSummary = (box) => {
      if (box.pack_type === "POTTED_PLANT") {
        return `${box.total_pots} گلدان`;
      } else if (box.pack_type === "CUT_FLOWER") {
        return `${box.total_stems} شاخه، ${box.total_flowers} گل`;
      }
      return "-";
    };

    const handlePrintLabel = (box) => {
      if (box.label?.media?.barcode_url) {
        // Create a simple label print HTML
        const labelHTML = `
          <!doctype html>
          <html>
            <head>
              <title>چاپ لیبل</title>
              <style>
                body { margin: 0; padding: 20px; font-family: Arial; text-align: center; }
                .label { border: 2px solid #000; padding: 20px; display: inline-block; }
                img { max-width: 200px; height: 50px; }
                .serial { font-weight: bold; margin-top: 10px; }
              </style>
            </head>
            <body>
              <div class="label">
                <img src="${box.label.media.barcode_url}" alt="Barcode" />
                <div class="serial">${box.label.serial_code}</div>
              </div>
            </body>
          </html>
        `;
        printInIframe(labelHTML);
      } else {
        message.warning("لیبل برای این جعبه موجود نیست");
      }
    };

    return (
      <Card
        key={box.id}
        style={{
          marginBottom: 16,
          borderRadius: 12,
          border: "2px solid #4caf50",
          boxShadow: "0 6px 20px rgba(76, 175, 80, 0.12)",
        }}
        title={
          <Space wrap>
            <GiftOutlined style={{ fontSize: "18px", color: "#4caf50" }} />
            <span style={{ fontSize: "18px", fontWeight: "bold" }}>
              جعبه #{box.row_no}
            </span>
            <Badge status="success" text="ارسال شده" />
            <Badge
              count={getPackTypeFa(box.pack_type)}
              style={{
                backgroundColor: box.pack_type === "POTTED_PLANT" ? "#52c41a" : "#1677ff",
                fontSize: "11px",
              }}
            />
          </Space>
        }
        extra={
          <Space wrap>
            <Button
              icon={<EditOutlined />}
              onClick={() => openBoxEditModal(box.id)}
              style={{ borderRadius: 8 }}
            >
              ویرایش جعبه
            </Button>
            
            {box.label && (
              <Button
                icon={<PrinterOutlined />}
                onClick={() => handlePrintLabel(box)}
                style={{ borderRadius: 8 }}
              >
                پرینت لیبل
              </Button>
            )}

            <Button
              onClick={() => printInIframe(buildRowNoStickersHTML(box.row_no))}
              style={{ borderRadius: 8 }}
            >
              پرینت برچسب ردیف
            </Button>
          </Space>
        }
      >
        <div
          style={{
            padding: "16px",
            background: "linear-gradient(135deg, #f6ffed 0%, #d9f7be 100%)",
            borderRadius: "10px",
            border: "1px solid #b7eb8f",
          }}
        >
          <Row gutter={16}>
            <Col span={8}>
              <Text strong>نوع بسته‌بندی: </Text>
              <Text>{getPackTypeFa(box.pack_type)}</Text>
            </Col>
            <Col span={8}>
              <Text strong>خلاصه: </Text>
              <Text>{getBoxSummary(box)}</Text>
            </Col>
            <Col span={8}>
              <Text strong>تاریخ بسته‌بندی: </Text>
              <Text>{box.packaged_at}</Text>
            </Col>
          </Row>
          
          {box.pack_type === "POTTED_PLANT" && box.pots && box.pots.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <Text strong>گلدان‌ها:</Text>
              <div style={{ marginTop: 8 }}>
                {box.pots.map((pot, index) => (
                  <Tag key={pot.id} style={{ margin: "2px" }}>
                    {pot.serial_code}
                  </Tag>
                ))}
              </div>
            </div>
          )}

          {box.pack_type === "CUT_FLOWER" && box.lines && box.lines.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <Text strong>ردیف‌ها:</Text>
              <div style={{ marginTop: 8 }}>
                {box.lines.map((line, index) => (
                  <Tag key={line.id} style={{ margin: "2px" }}>
                    ردیف {index + 1}: {line.stems_count} شاخه × {line.flowers_per_stem} گل
                  </Tag>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>
    );
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
                  {orderInfo.customer?.name || "نامشخص"}
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

      {/* Existing Boxes */}
      {loadingExistingBoxes ? (
        <Card style={{ marginBottom: 24, textAlign: "center" }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>در حال بارگیری جعبه‌های موجود...</div>
        </Card>
      ) : existingBoxes.length > 0 ? (
        <div style={{ marginBottom: 32 }}>
          <Title level={4} style={{ marginBottom: 16, color: "#2c3e50" }}>
            جعبه‌های موجود ({existingBoxes.length})
          </Title>
          {existingBoxes.map(renderExistingBox)}
        </div>
      ) : null}

      {/* New Boxes */}
      {boxes.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <Title level={4} style={{ marginBottom: 16, color: "#2c3e50" }}>
            جعبه‌های جدید ({boxes.length})
          </Title>
        </div>
      )}

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
                ارسال جعبه
              </Button>

              {/* دکمه پرینت برچسب ردیف (row_no) بعد از ارسال */}
              {box.status === "submitted" && (
                <Button
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

      {boxes.length === 0 && existingBoxes.length === 0 && (
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
      {(boxes.length > 0 || existingBoxes.length > 0) && (
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

      {/* Box Edit Modal */}
      <BoxEditModal
        visible={boxEditModalVisible}
        boxId={selectedBoxId}
        onCancel={() => setBoxEditModalVisible(false)}
        onUpdated={handleBoxUpdated}
      />

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