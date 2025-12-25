import React, { useCallback, useMemo, useRef, useState, useEffect } from "react";
import {
  Card,
  Button,
  Typography,
  Space,
  Input,
  message,
  Table,
  Tag,
  Modal,
  Divider,
  Form,
  Select,
  Tooltip,
  InputNumber,
  Checkbox,
  Row,
  Col,
  Collapse,
  Badge,
  Popconfirm,
  Alert,
} from "antd";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeftOutlined,
  PlusOutlined,
  ScanOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  SplitCellsOutlined,
  MinusCircleOutlined,
  BoxPlotOutlined,
  InboxOutlined,
} from "@ant-design/icons";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { lookupSerial, finalizeInvoice } from "../../services/invoiceService";
import UnifiedErrorHandler from "../../utils/unifiedErrorHandler";
import api from "../../api";

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;

// تابع کمکی برای فرمت کردن اعداد با جداکننده هزارگان
const formatNumber = (value) => {
  if (!value && value !== 0) return '';
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

// تابع کمکی برای حذف جداکننده‌ها و تبدیل به عدد
const parseNumber = (value) => {
  if (!value && value !== 0) return 0;
  return Number(value.toString().replace(/,/g, ''));
};

// Helper to stringify attributes of a variation
const renderAttributes = (variantsData) => {
  const attrs = variantsData?.attribute_varitation || [];
  const parts = attrs.map((a) => {
    const vals = (a.values || []).map((v) => v.name || v.value).join("، ");
    return `${a.name}: ${vals}`;
  });
  return parts.join(" | ");
};

const InvoicePricingPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form] = Form.useForm();
  const [inputSerial, setInputSerial] = useState("");
  const [addedSerials, setAddedSerials] = useState([]); // list of strings
  const serialSetRef = useRef(new Set());
  const [rawItems, setRawItems] = useState([]); // list of lookup data blocks
  const [loadingAdd, setLoadingAdd] = useState(false);
  const [finalizing, setFinalizing] = useState(false);

  // State for pricing items - هر variant در هر کارتن یک آیتم است
  const [pricingItems, setPricingItems] = useState([]); // array of variant items
  const itemIdCounter = useRef(0);

  // State for single stems
  const [singleStems, setSingleStems] = useState([]);
  const [singleStemModalOpen, setSingleStemModalOpen] = useState(false);
  const [products, setProducts] = useState([]); // for single stems dropdown
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [singleStemForm] = Form.useForm(); // فرم جداگانه برای modal فروش شاخه‌ای

  // Scanner modal state
  const [scanOpen, setScanOpen] = useState(false);
  const videoRef = useRef(null);
  const codeReaderRef = useRef(null);
  const [devices, setDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState();
  const [torchOn, setTorchOn] = useState(false);
  const mediaStreamRef = useRef(null);
  const beepRef = useRef(null);
  const [scanFlash, setScanFlash] = useState(false);
  const [lastScanned, setLastScanned] = useState("");
  const scanningRef = useRef(false);
  const recentScanCacheRef = useRef(new Map());
  const [cooldownMs] = useState(1200);
  const BEEP_URL = useMemo(() => `${process.env.PUBLIC_URL || ""}/scan-beep.mp3`, []);

  // Build pricing items from rawItems
  useMemo(() => {
    const items = [];

    for (const rawItem of rawItems) {
      if (rawItem.pack_type === "CUT_FLOWER") {
        const variants = Array.isArray(rawItem.variants) ? rawItem.variants : [];
        
        for (const variant of variants) {
          const newId = `item-${itemIdCounter.current++}`;
          const stems = variant.available_stems !== undefined ? variant.available_stems : variant.stems;
          const flowers = variant.available_flowers !== undefined ? variant.available_flowers : variant.flowers;
          
          items.push({
            id: newId,
            pack_type: "CUT_FLOWER",
            product_id: variant.product_id,
            product_variation_id: variant.variation_id,
            variants_data: variant.variants_data,
            carton_serial: rawItem.label_serial,
            stems: stems || 0,
            flowers: flowers || 0,
            original_stems: variant.stems || 0,
            original_flowers: variant.flowers || 0,
            is_carton_separated: false, // آیا کل کارتن جدا شده
          });
        }
      } else if (rawItem.pack_type === "POTTED_PLANT") {
        const variants = Array.isArray(rawItem.variants) ? rawItem.variants : [];
        
        for (const variant of variants) {
          const newId = `item-${itemIdCounter.current++}`;
          const unitSerials = Array.isArray(variant.serials) ? variant.serials : [];
          const potCount = variant.count || unitSerials.length || 0;
          
          items.push({
            id: newId,
            pack_type: "POTTED_PLANT",
            product_id: variant.product_id,
            product_variation_id: variant.variation_id,
            variants_data: variant.variants_data,
            unit_serials: unitSerials,
            carton_serial: rawItem.label_serial,
            pot_count: potCount,
            original_pot_count: variant.count || 0,
          });
        }
      }
    }

    setPricingItems(items);
  }, [rawItems]);

  // گروه‌بندی بر اساس کارتن برای نمایش
  const groupedByCartons = useMemo(() => {
    const cartonGroups = new Map();
    
    for (const item of pricingItems) {
      const cartonSerial = item.carton_serial;
      
      if (!cartonGroups.has(cartonSerial)) {
        cartonGroups.set(cartonSerial, {
          carton_serial: cartonSerial,
          pack_type: item.pack_type,
          is_carton_separated: item.is_carton_separated,
          items: [],
        });
      }
      
      cartonGroups.get(cartonSerial).items.push(item);
    }
    
    // حالا باید کارتن‌ها را بر اساس is_carton_separated گروه‌بندی کنیم
    // کارتن‌های جدا نشده را بر اساس variant گروه می‌کنیم
    const finalGroups = [];
    const normalVariantGroups = new Map(); // برای کارتن‌های عادی CUT_FLOWER
    const pottedVariantGroups = new Map(); // برای کارتن‌های POTTED_PLANT - تجمیع بر اساس variant
    
    for (const cartonGroup of cartonGroups.values()) {
      if (cartonGroup.is_carton_separated) {
        // کارتن جدا شده - یک گروه مستقل
        finalGroups.push({
          type: 'separated_carton',
          carton_serial: cartonGroup.carton_serial,
          pack_type: cartonGroup.pack_type,
          cartons: [cartonGroup],
        });
      } else {
        // کارتن عادی - باید با variant های مشابه گروه شود
        if (cartonGroup.pack_type === "CUT_FLOWER") {
          for (const item of cartonGroup.items) {
            const variantKey = `${item.product_id}::${item.product_variation_id}`;
            if (!normalVariantGroups.has(variantKey)) {
              normalVariantGroups.set(variantKey, {
                type: 'grouped_variant',
                product_id: item.product_id,
                product_variation_id: item.product_variation_id,
                variants_data: item.variants_data,
                pack_type: 'CUT_FLOWER',
                cartons: [],
              });
            }
            
            // اضافه کردن به لیست کارتن‌های این variant
            const group = normalVariantGroups.get(variantKey);
            const existingCarton = group.cartons.find(c => c.carton_serial === cartonGroup.carton_serial);
            if (!existingCarton) {
              group.cartons.push(cartonGroup);
            }
          }
        } else if (cartonGroup.pack_type === "POTTED_PLANT") {
          // POTTED_PLANT - تجمیع بر اساس product+variation (مثل CUT_FLOWER)
          for (const item of cartonGroup.items) {
            const variantKey = `${item.product_id}::${item.product_variation_id}`;
            if (!pottedVariantGroups.has(variantKey)) {
              pottedVariantGroups.set(variantKey, {
                type: 'potted_grouped',
                product_id: item.product_id,
                product_variation_id: item.product_variation_id,
                variants_data: item.variants_data,
                pack_type: 'POTTED_PLANT',
                carton_serials: new Set(),
                total_pot_count: 0,
                items: [], // لیست همه آیتم‌ها برای محاسبه قیمت
              });
            }
            
            const group = pottedVariantGroups.get(variantKey);
            group.carton_serials.add(cartonGroup.carton_serial);
            group.total_pot_count += (item.unit_serials?.length || item.pot_count || 0);
            group.items.push(item);
          }
        }
      }
    }
    
    // اضافه کردن گروه‌های variant عادی CUT_FLOWER
    for (const group of normalVariantGroups.values()) {
      finalGroups.push(group);
    }
    
    // اضافه کردن گروه‌های variant گلدانی
    for (const group of pottedVariantGroups.values()) {
      finalGroups.push({
        ...group,
        carton_count: group.carton_serials.size,
        carton_serials: Array.from(group.carton_serials),
      });
    }
    
    return finalGroups;
  }, [pricingItems]);

  // Fetch products for single stems dropdown
  useEffect(() => {
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
        const errorResult = UnifiedErrorHandler.handleApiError(error, null, {
          showGeneralMessages: true,
          defaultMessage: "خطا در دریافت محصولات",
        });
        console.error("Error fetching products:", errorResult);
      } finally {
        setLoadingProducts(false);
      }
    };
    fetchProducts();
  }, []);

  // Get variations for a specific product
  const getVariationsForProduct = (productId) => {
    if (!productId) return [];
    const product = products.find((p) => p.id === productId);
    const variations = product ? product.variants || [] : [];
    return variations;
  };

  // Helper to build variation label
  const buildVariationLabel = (variation, productTitle) => {
    if (!variation) return productTitle || "—";
    const attrs = variation.attribute_varitation || [];
    if (attrs.length === 0) return productTitle || variation.title || "—";
    const parts = attrs.map((a) => {
      const vals = (a.values || []).map((v) => v.name || v.value).join("، ");
      return `${a.name}: ${vals}`;
    });
    return `${productTitle || ""} (${parts.join(" | ")})`.trim();
  };

  const addSerial = useCallback(
    async (serial) => {
      const s = String(serial).trim();
      if (!s || serialSetRef.current.has(s)) {
        if (serialSetRef.current.has(s)) {
          message.warning(`سریال ${s} قبلاً اضافه شده است`);
        }
        return;
      }
      try {
        setLoadingAdd(true);
        const lookupData = await lookupSerial({ invoiceId: id, serial: s });
        if (!lookupData) {
          message.error("پاسخ نامعتبر از سرور");
          return;
        }
        serialSetRef.current.add(s);
        setAddedSerials((prev) => [s, ...prev]);
        setRawItems((prev) => [...prev, lookupData]);
        message.success(`سریال ${s} اضافه شد`);
      } catch (error) {
        const errorResult = UnifiedErrorHandler.handleApiError(error, form, {
          showValidationMessages: true,
          showGeneralMessages: true,
          defaultMessage: "خطا در افزودن سریال",
        });
        message.error(errorResult.message);
      } finally {
        setLoadingAdd(false);
      }
    },
    [id]
  );

  const removeSerial = (serial) => {
    const s = String(serial);
    serialSetRef.current.delete(s);
    setAddedSerials((prev) => prev.filter((x) => x !== s));
    setRawItems((prev) => prev.filter((ri) => ri.label_serial !== s));
  };

  // جداسازی کل کارتن (تمام variant های آن)
  const separateCarton = (cartonSerial) => {
    setPricingItems((prev) => 
      prev.map((item) => 
        item.carton_serial === cartonSerial 
          ? { ...item, is_carton_separated: true }
          : item
      )
    );
    
    // فعال کردن چک‌باکس آسیب برای همه variant های این کارتن
    const itemsInCarton = pricingItems.filter(item => item.carton_serial === cartonSerial);
    itemsInCarton.forEach(item => {
      form.setFieldValue(`damaged_${item.id}`, true);
    });
    
    message.success("کارتن جدا شد و به عنوان آسیب‌دیده علامت‌گذاری شد");
  };

  // بازگشت کارتن به گروه
  const returnCartonToGroup = (cartonSerial) => {
    setPricingItems((prev) => 
      prev.map((item) => 
        item.carton_serial === cartonSerial 
          ? { ...item, is_carton_separated: false }
          : item
      )
    );
    
    // پاک کردن چک‌باکس و توضیحات آسیب
    const itemsInCarton = pricingItems.filter(item => item.carton_serial === cartonSerial);
    itemsInCarton.forEach(item => {
      form.setFieldValue(`damaged_${item.id}`, false);
      form.setFieldValue(`damaged_desc_${item.id}`, '');
    });
    
    message.success("کارتن به گروه بازگشت");
  };

  // حذف کل کارتن
  const removeCarton = (cartonSerial) => {
    setPricingItems((prev) => prev.filter((item) => item.carton_serial !== cartonSerial));
    removeSerial(cartonSerial);
  };

  // Add single stem
  const addSingleStem = (values) => {
    const newId = `stem-${Date.now()}`;
    setSingleStems((prev) => [
      ...prev,
      {
        id: newId,
        product_id: values.product_id,
        product_variation_id: values.product_variation_id,
        stems_count: values.stems_count,
        flowers_per_stem: values.flowers_per_stem,
        unit_price: values.unit_price,
        cartons: values.cartons || [],
      },
    ]);
    singleStemForm.resetFields();
    setSingleStemModalOpen(false);
    message.success("فروش شاخه‌ای اضافه شد");
  };

  const removeSingleStem = (stemId) => {
    setSingleStems((prev) => prev.filter((s) => s.id !== stemId));
  };

  // Scanner controls
  const startScanner = useCallback(async () => {
    try {
      if (scanningRef.current) return;
      scanningRef.current = true;
      try {
        codeReaderRef.current?.reset?.();
        const prevSrc = videoRef.current?.srcObject || mediaStreamRef.current;
        if (prevSrc) {
          prevSrc.getTracks?.().forEach((t) => t.stop());
          if (videoRef.current) videoRef.current.srcObject = null;
          mediaStreamRef.current = null;
        }
      } catch {}

      const reader = new BrowserMultiFormatReader();
      codeReaderRef.current = reader;
      const list = await BrowserMultiFormatReader.listVideoInputDevices();
      setDevices(list);
      const defaultId = selectedDeviceId || list.find((d) => /back|rear|environment/i.test(d.label))?.deviceId || list[0]?.deviceId;
      if (!selectedDeviceId) setSelectedDeviceId(defaultId);
      const video = videoRef.current;
      if (!video) throw new Error("Video element not ready");
      await reader.decodeFromVideoDevice(defaultId || undefined, video, (result) => {
        const text = result?.getText?.();
        if (!text) return;

        const now = Date.now();
        for (const [k, exp] of Array.from(recentScanCacheRef.current.entries())) {
          if (exp <= now) recentScanCacheRef.current.delete(k);
        }
        if (recentScanCacheRef.current.has(text)) return;

        recentScanCacheRef.current.set(text, now + cooldownMs);
        setLastScanned(text);
        setScanFlash(true);
        window.navigator?.vibrate?.(80);
        try {
          if (!beepRef.current) {
            const a = new Audio(BEEP_URL);
            a.preload = "auto";
            a.volume = 0.8;
            beepRef.current = a;
          }
          beepRef.current.currentTime = 0;
          const p = beepRef.current.play();
          if (p && p.catch) p.catch(() => {});
        } catch {}
        addSerial(text);
        setTimeout(() => setScanFlash(false), 250);
      });
      mediaStreamRef.current = video.srcObject;
    } catch (e) {
      console.error(e);
      message.error("خطا در شروع اسکنر یا دسترسی به دوربین");
      setScanOpen(false);
    } finally {
      setTimeout(() => {
        if (!videoRef.current?.srcObject) scanningRef.current = false;
      }, 50);
    }
  }, [addSerial, cooldownMs, selectedDeviceId, BEEP_URL]);

  const stopScanner = useCallback(() => {
    try {
      const reader = codeReaderRef.current;
      if (reader) reader.reset();
      const src = videoRef.current?.srcObject || mediaStreamRef.current;
      if (src) {
        src.getTracks?.().forEach((t) => t.stop());
        if (videoRef.current) videoRef.current.srcObject = null;
        mediaStreamRef.current = null;
      }
      scanningRef.current = false;
    } catch (e) {
      console.error(e);
    }
  }, []);

  const toggleScanner = (open) => {
    setScanOpen(open);
    if (open) {
      try {
        if (!beepRef.current) {
          const a = new Audio(BEEP_URL);
          a.preload = "auto";
          a.volume = 0.8;
          beepRef.current = a;
        }
        beepRef.current.currentTime = 0;
        const p = beepRef.current.play();
        if (p && p.then) p.then(() => beepRef.current.pause());
      } catch {}
      startScanner();
    } else stopScanner();
  };

  const handleCameraChange = async (deviceId) => {
    setSelectedDeviceId(deviceId);
    try {
      const reader = codeReaderRef.current;
      if (!reader || !videoRef.current) return;
      stopScanner();
      await new Promise((r) => setTimeout(r, 50));
      await startScanner();
    } catch (e) {
      console.error(e);
      message.error("خطا در تغییر دوربین");
    }
  };

  const toggleTorch = async () => {
    try {
      const stream = mediaStreamRef.current || videoRef.current?.srcObject;
      if (!stream) {
        message.warning("دوربین فعال نیست");
        return;
      }
      const track = stream.getVideoTracks?.()?.[0];
      if (!track) return;
      const capabilities = track.getCapabilities?.();
      if (!capabilities?.torch) {
        message.warning("این دوربین قابلیت چراغ‌قوه را ندارد");
        return;
      }
      const newVal = !torchOn;
      await track.applyConstraints({ advanced: [{ torch: newVal }] });
      setTorchOn(newVal);
    } catch (e) {
      console.error(e);
      message.error("خطا در تغییر وضعیت چراغ‌قوه");
    }
  };

  // محاسبه مجموع قیمت
  const calculateTotalPrice = () => {
    const values = form.getFieldsValue();
    let total = 0;
    
    // CUT_FLOWER items
    for (const item of pricingItems.filter(i => i.pack_type === "CUT_FLOWER")) {
      const unitPrice = parseNumber(values[`price_${item.id}`] || 0);
      const deducted = Number(values[`deducted_${item.id}`] || 0);
      const effectiveFlowers = item.flowers - deducted;
      total += unitPrice * effectiveFlowers;
    }

    // POTTED_PLANT items - از گروه‌های تجمیع شده استفاده می‌کنیم
    const pottedGroups = groupedByCartons.filter(g => g.type === 'potted_grouped');
    for (const group of pottedGroups) {
      const unitPrice = parseNumber(values[`price_potted_${group.product_id}_${group.product_variation_id}`] || 0);
      total += unitPrice * group.total_pot_count;
    }

    // Single stems
    for (const stem of singleStems) {
      const stemTotal = (stem.stems_count || 0) * (stem.flowers_per_stem || 0);
      total += (stem.unit_price || 0) * stemTotal;
    }

    return total;
  };

  // محاسبه مجموع پس از اعمال تخفیف (در صورت وجود)
  const calculateDiscountedTotal = () => {
    const baseTotal = calculateTotalPrice();
    const { discount_percent, discount_amount } = form.getFieldsValue([
      "discount_percent",
      "discount_amount",
    ]);

    const hasPercent =
      discount_percent !== null &&
      discount_percent !== undefined &&
      discount_percent !== "";
    const hasAmount =
      discount_amount !== null &&
      discount_amount !== undefined &&
      discount_amount !== "";

    // اگر هر دو پر باشند، مقدار بعد از تخفیف را نشان نمی‌دهیم تا کاربر خطا را ببیند
    if (hasPercent && hasAmount) {
      return null;
    }

    if (hasPercent) {
      const p = Number(discount_percent) || 0;
      const discounted = baseTotal - (baseTotal * p) / 100;
      return discounted >= 0 ? discounted : 0;
    }

    if (hasAmount) {
      const a = Number(discount_amount) || 0;
      const discounted = baseTotal - a;
      return discounted >= 0 ? discounted : 0;
    }

    // بدون تخفیف
    return baseTotal;
  };

  const handleFinalize = async () => {
    try {
      const values = form.getFieldsValue();

      // ولیدیشن تخفیف: یا درصد یا مبلغ، یا هیچ‌کدام؛ نه هر دو
      const discountPercentRaw = values.discount_percent;
      const discountAmountRaw = values.discount_amount;
      const hasPercent =
        discountPercentRaw !== null &&
        discountPercentRaw !== undefined &&
        discountPercentRaw !== "";
      const hasAmount =
        discountAmountRaw !== null &&
        discountAmountRaw !== undefined &&
        discountAmountRaw !== "";

      if (hasPercent && hasAmount) {
        form.setFields([
          {
            name: "discount_percent",
            errors: ["یا درصد تخفیف را پر کنید یا مبلغ، نه هر دو"],
          },
          {
            name: "discount_amount",
            errors: ["یا درصد تخفیف را پر کنید یا مبلغ، نه هر دو"],
          },
        ]);
        message.error("نمی‌توانید هم درصد تخفیف و هم مبلغ تخفیف را همزمان وارد کنید.");
        return;
      }

      const items = [];

      // گروه‌بندی براساس product+variation برای payload
      // کارتن‌های جدا شده به صورت مستقل، بقیه تجمیع می‌شوند
      const groupedForPayload = new Map();
      const pottedGroups = new Map();
      
      for (const item of pricingItems) {
        if (item.pack_type === "CUT_FLOWER") {
          const unitPrice = parseNumber(values[`price_${item.id}`] || 0);
          const deducted = Number(values[`deducted_${item.id}`] || 0);
          const isDamaged = values[`damaged_${item.id}`] || false;
          const damagedDesc = values[`damaged_desc_${item.id}`] || "";
          
          if (item.is_carton_separated) {
            // کارتن جدا شده - هر variant یک payload item مستقل
            const payload = {
              pack_type: "CUT_FLOWER",
              product_id: item.product_id,
              product_variation_id: item.product_variation_id,
              unit_price: unitPrice,
              flower_total: item.flowers - deducted,
              carton_barcodes: [item.carton_serial],
            };

            if (deducted > 0) {
              payload.deducted_count = deducted;
            }

            // کارتن جدا شده حتماً باید adjustment داشته باشد
            payload.adjustment = {
              reason_type: "damaged",
              description: damagedDesc || "کارتن آسیب دیده",
            };

            items.push(payload);
          } else {
            // کارتن عادی - گروه‌بندی بر اساس variant
            const key = `${item.product_id}::${item.product_variation_id}`;
            if (!groupedForPayload.has(key)) {
              groupedForPayload.set(key, {
                pack_type: "CUT_FLOWER",
                product_id: item.product_id,
                product_variation_id: item.product_variation_id,
                unit_price: unitPrice,
                flower_total: 0,
                deducted_count: 0,
                carton_barcodes: [],
              });
            }
            
            const group = groupedForPayload.get(key);
            group.flower_total += item.flowers;
            group.deducted_count += deducted;
            
            if (!group.carton_barcodes.includes(item.carton_serial)) {
              group.carton_barcodes.push(item.carton_serial);
            }
            
            // اگر آسیب دیده باشد
            if (isDamaged && damagedDesc) {
              group.adjustment = {
                reason_type: "damaged",
                description: damagedDesc,
              };
            }
          }
        } else if (item.pack_type === "POTTED_PLANT") {
          // POTTED_PLANT - تجمیع بر اساس product و variation
          const key = `${item.product_id}::${item.product_variation_id}`;
          // قیمت را از فرم گروهی می‌گیریم
          const unitPrice = parseNumber(values[`price_potted_${item.product_id}_${item.product_variation_id}`] || 0);
          
          if (!pottedGroups.has(key)) {
            pottedGroups.set(key, {
              pack_type: "POTTED_PLANT",
              product_id: item.product_id,
              product_variation_id: item.product_variation_id,
              unit_price: unitPrice,
              unit_serials: [],
              carton_barcodes: [],
              variants_data: item.variants_data,
            });
          }
          
          const group = pottedGroups.get(key);
          
          // اضافه کردن سریال‌های واحد
          if (item.unit_serials && item.unit_serials.length > 0) {
            group.unit_serials = [...group.unit_serials, ...item.unit_serials];
          }
          
          // اضافه کردن شماره کارتن
          if (item.carton_serial && !group.carton_barcodes.includes(item.carton_serial)) {
            group.carton_barcodes.push(item.carton_serial);
          }
        }
      }
      
      // اضافه کردن گروه‌های تجمیع شده CUT_FLOWER
      for (const group of groupedForPayload.values()) {
        const payload = { ...group };
        payload.flower_total = payload.flower_total - payload.deducted_count;
        
        if (payload.deducted_count > 0) {
          // deducted_count باقی می‌ماند
        } else {
          delete payload.deducted_count;
        }
        
        items.push(payload);
      }
      
      // اضافه کردن گروه‌های گلدانی به آیتم‌ها (فقط unit_serials، بدون carton_barcodes)
      for (const group of pottedGroups.values()) {
        items.push({
          pack_type: group.pack_type,
          product_id: group.product_id,
          product_variation_id: group.product_variation_id,
          unit_price: group.unit_price,
          unit_serials: group.unit_serials,
        });
      }

      // Build single_stems
      const single_stems = singleStems.map((stem) => ({
        product_id: stem.product_id,
        product_variation_id: stem.product_variation_id,
        stems_count: stem.stems_count,
        flowers_per_stem: stem.flowers_per_stem,
        unit_price: stem.unit_price,
        cartons: stem.cartons.length > 0 ? stem.cartons : null,
      }));

      const payload = {
        items,
        discount_percent: hasPercent ? Number(discountPercentRaw) : null,
        discount_amount: hasAmount ? Number(discountAmountRaw) : null,
      };
      if (single_stems.length > 0) {
        payload.single_stems = single_stems;
      }

      setFinalizing(true);
      await finalizeInvoice({ invoiceId: id, ...payload });
      message.success("فاکتور با موفقیت نهایی شد");
      navigate(`/invoices/${id}`);
    } catch (error) {
      const errorResult = UnifiedErrorHandler.handleApiError(error, form, {
        showValidationMessages: true,
        showGeneralMessages: true,
        defaultMessage: "خطا در نهایی‌سازی فاکتور",
      });
      message.error(errorResult.message);
      console.error(errorResult);
    } finally {
      setFinalizing(false);
    }
  };

  return (
    <div dir="rtl" style={{ padding: 16 }}>
      <Space style={{ marginBottom: 12 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>بازگشت</Button>
        <Title level={4} style={{ margin: 0 }}>قیمت‌گذاری فاکتور #{id}</Title>
      </Space>

      {/* بخش اسکن */}
      <Card style={{ marginBottom: 16 }} title="افزودن سریال کارتن یا گلدان">
        <Space.Compact style={{ width: "100%" }}>
          <Input
            placeholder="سریال را وارد کنید"
            value={inputSerial}
            onChange={(e) => setInputSerial(e.target.value)}
            onPressEnter={() => {
              addSerial(inputSerial);
              setInputSerial("");
            }}
            disabled={loadingAdd}
          />
          <Button type="primary" onClick={() => { addSerial(inputSerial); setInputSerial(""); }} loading={loadingAdd}>
            افزودن
          </Button>
          <Button icon={<ScanOutlined />} onClick={() => toggleScanner(true)}>اسکن</Button>
        </Space.Compact>

        {addedSerials.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <Text type="secondary">سریال‌های افزوده‌شده:</Text>
            <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
              {addedSerials.map((s) => (
                <Tag key={s} closable onClose={() => removeSerial(s)} color="processing" style={{ direction: "ltr" }}>
                  {s}
                </Tag>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* بخش قیمت‌گذاری */}
      <Form form={form} layout="vertical">
        <Card
          title={
            <Space>
              <InboxOutlined />
              <span>کارتن‌های اسکن شده</span>
              <Badge count={addedSerials.length} style={{ backgroundColor: "#52c41a" }} />
            </Space>
          }
          style={{ marginBottom: 16 }}
        >
          {pricingItems.length === 0 ? (
            <Alert
              message="هنوز کارتنی اسکن نشده است"
              description="لطفاً کارتن‌ها را اسکن کنید یا سریال آنها را وارد نمایید."
              type="info"
              showIcon
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* گل‌های بریده */}
              {groupedByCartons
                .filter(group => group.type === 'grouped_variant')
                .map((group) => (
                  <Card
                    key={group.product_id + '-' + group.product_variation_id}
                    size="small"
                    style={{
                      backgroundColor: '#f6ffed',
                      borderColor: '#95de64',
                    }}
                  >
                    <div style={{ marginBottom: 12 }}>
                      <Space>
                        <Tag color="green">{group.cartons.length} کارتن</Tag>
                        <Text strong>{group.variants_data?.title || "محصول"}</Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {renderAttributes(group.variants_data)}
                        </Text>
                      </Space>
                    </div>

                    {/* نمایش کارتن‌ها */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                      {group.cartons.map((carton) => (
                        <div
                          key={carton.carton_serial}
                          style={{
                            padding: 12,
                            backgroundColor: '#fff',
                            border: '1px solid #e8e8e8',
                            borderRadius: 6,
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Space>
                              <Tag color="blue" style={{ direction: 'ltr' }}>{carton.carton_serial}</Tag>
                              {carton.items.map((item, idx) => (
                                <Text key={idx} type="secondary">
                                  • {item.stems} شاخه ({item.flowers} گل)
                                </Text>
                              ))}
                            </Space>
                            
                            <Space>
                              <Tooltip title="جداسازی این کارتن (برای آسیب‌دیده)">
                                <Button
                                  size="small"
                                  danger
                                  icon={<SplitCellsOutlined />}
                                  onClick={() => separateCarton(carton.carton_serial)}
                                >
                                  جداسازی کارتن
                                </Button>
                              </Tooltip>
                              <Popconfirm
                                title="حذف این کارتن؟"
                                description="تمام variant های این کارتن حذف می‌شوند"
                                onConfirm={() => removeCarton(carton.carton_serial)}
                              >
                                <Button size="small" danger icon={<DeleteOutlined />} />
                              </Popconfirm>
                            </Space>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* فرم قیمت‌گذاری برای این variant */}
                    {group.cartons[0]?.items.filter(i => i.product_variation_id === group.product_variation_id).map((item) => (
                      <div key={`form-${item.id}`} style={{ padding: 12, backgroundColor: '#fafafa', borderRadius: 6 }}>
                        <Row gutter={16}>
                          <Col span={12}>
                            <Form.Item 
                              label="قیمت واحد (تومان)" 
                              name={`price_${item.id}`}
                              rules={[{ required: true, message: 'لطفاً قیمت واحد را وارد کنید' }]}
                            >
                              <Input placeholder="مثلاً 12,000" />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item label="تعداد حذف شده" name={`deducted_${item.id}`} initialValue={0}>
                              <InputNumber min={0} max={item.flowers} style={{ width: "100%" }} />
                            </Form.Item>
                          </Col>
                        </Row>

                        <div style={{ padding: 8, backgroundColor: '#e6f7ff', borderRadius: 4 }}>
                          <Text strong>مجموع گل: </Text>
                          <Text>
                            {group.cartons.reduce((sum, c) => {
                              const matchingItems = c.items.filter(i => i.product_variation_id === group.product_variation_id);
                              return sum + matchingItems.reduce((s, i) => s + i.flowers, 0);
                            }, 0)} گل
                          </Text>
                        </div>
                      </div>
                    ))}
                  </Card>
                ))}

              {/* کارتن‌های جدا شده */}
              {groupedByCartons
                .filter(group => group.type === 'separated_carton')
                .map((group) => {
                  const carton = group.cartons[0];
                  return (
                    <Card
                      key={carton.carton_serial}
                      size="small"
                      style={{
                        backgroundColor: '#fff7e6',
                        borderColor: '#ffa940',
                      }}
                    >
                      <div style={{ marginBottom: 12 }}>
                        <Space>
                          <WarningOutlined style={{ color: '#fa8c16' }} />
                          <Tag color="orange">کارتن جدا شده (آسیب‌دیده)</Tag>
                          <Tag color="blue" style={{ direction: 'ltr' }}>{carton.carton_serial}</Tag>
                        </Space>
                      </div>

                      <Alert
                        message="این کارتن به دلیل آسیب از گروه جدا شده است"
                        type="warning"
                        showIcon
                        style={{ marginBottom: 16 }}
                        action={
                          <Button size="small" onClick={() => returnCartonToGroup(carton.carton_serial)}>
                            برگشت به گروه
                          </Button>
                        }
                      />

                      {/* نمایش variant های این کارتن */}
                      <div style={{ marginBottom: 16 }}>
                        <Text strong>محتویات کارتن:</Text>
                        {carton.items.map((item) => (
                          <div key={item.id} style={{ marginTop: 8, padding: 8, backgroundColor: '#fff', borderRadius: 4 }}>
                            <Space direction="vertical" size="small" style={{ width: '100%' }}>
                              <Text strong>{item.variants_data?.title || "محصول"}</Text>
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                {renderAttributes(item.variants_data)}
                              </Text>
                              <Text>شاخه: {item.stems} | گل: {item.flowers}</Text>
                            </Space>
                          </div>
                        ))}
                      </div>

                      {/* فرم قیمت‌گذاری برای هر variant */}
                      {carton.items.map((item) => (
                        <div key={`form-${item.id}`} style={{ marginBottom: 12, padding: 12, backgroundColor: '#fafafa', borderRadius: 6 }}>
                          <Text strong style={{ display: 'block', marginBottom: 8 }}>
                            قیمت‌گذاری: {item.variants_data?.title}
                          </Text>
                          <Row gutter={16}>
                            <Col span={12}>
                              <Form.Item 
                                label="قیمت واحد (تومان)" 
                                name={`price_${item.id}`}
                                rules={[{ required: true, message: 'لطفاً قیمت واحد را وارد کنید' }]}
                              >
                                <Input placeholder="مثلاً 12,000" />
                              </Form.Item>
                            </Col>
                            <Col span={12}>
                              <Form.Item label="تعداد حذف شده" name={`deducted_${item.id}`} initialValue={0}>
                                <InputNumber min={0} max={item.flowers} style={{ width: "100%" }} />
                              </Form.Item>
                            </Col>
                          </Row>

                          <Form.Item 
                            label="توضیحات آسیب" 
                            name={`damaged_desc_${item.id}`}
                            rules={[{ required: true, message: 'لطفاً توضیحات آسیب را وارد کنید' }]}
                          >
                            <Input.TextArea rows={2} placeholder="دلیل جداسازی و آسیب را توضیح دهید..." />
                          </Form.Item>

                          <Form.Item name={`damaged_${item.id}`} valuePropName="checked" initialValue={true} hidden>
                            <Checkbox />
                          </Form.Item>

                          <div style={{ padding: 8, backgroundColor: '#fff1f0', borderRadius: 4 }}>
                            <Text strong>گل قابل فروش: </Text>
                            <Text>{item.flowers - (form.getFieldValue(`deducted_${item.id}`) || 0)}</Text>
                          </div>
                        </div>
                      ))}

                      <Popconfirm
                        title="حذف این کارتن؟"
                        description="تمام variant های این کارتن حذف می‌شوند"
                        onConfirm={() => removeCarton(carton.carton_serial)}
                      >
                        <Button danger icon={<DeleteOutlined />}>حذف کارتن</Button>
                      </Popconfirm>
                    </Card>
                  );
                })}

              {/* گروه‌های گلدانی - نمایش جدولی ساده مثل قبل */}
              {groupedByCartons.filter(group => group.type === 'potted_grouped').length > 0 && (
                <Card
                  size="small"
                  title={
                    <Space>
                      <BoxPlotOutlined />
                      <span>گروه‌های آماده برای قیمت‌گذاری</span>
                    </Space>
                  }
                  extra={
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      گروه‌بندی بر اساس نوع بسته و تنوع محصول
                    </Text>
                  }
                >
                  <Table
                    dataSource={groupedByCartons.filter(group => group.type === 'potted_grouped')}
                    rowKey={(record) => `${record.product_id}-${record.product_variation_id}`}
                    pagination={false}
                    size="small"
                    columns={[
                      {
                        title: 'نوع بسته',
                        key: 'pack_type',
                        width: 100,
                        render: () => <Tag color="purple">گلدانی</Tag>,
                      },
                      {
                        title: 'محصول/تنوع',
                        key: 'product',
                        render: (_, record) => (
                          <div>
                            <Text strong>{record.variants_data?.title || "محصول"}</Text>
                            <br />
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              {renderAttributes(record.variants_data)}
                            </Text>
                          </div>
                        ),
                      },
                      {
                        title: 'تعداد/شاخه/گل',
                        key: 'count',
                        width: 140,
                        render: (_, record) => (
                          <Text>تعداد گلدان: {record.total_pot_count}</Text>
                        ),
                      },
                      {
                        title: 'تعداد کارتن‌ها',
                        key: 'cartons',
                        width: 110,
                        align: 'center',
                        render: (_, record) => record.carton_count,
                      },
                      {
                        title: 'قیمت واحد',
                        key: 'price',
                        width: 150,
                        render: (_, record) => (
                          <Form.Item 
                            name={`price_potted_${record.product_id}_${record.product_variation_id}`}
                            style={{ marginBottom: 0 }}
                          >
                            <Input placeholder="مثلاً 12,000" />
                          </Form.Item>
                        ),
                      },
                    ]}
                  />
                </Card>
              )}
            </div>
          )}
        </Card>

        {/* بخش فروش شاخه‌ای */}
        <Card
          title={
            <Space>
              <span>فروش شاخه‌ای</span>
              <Badge count={singleStems.length} style={{ backgroundColor: "#722ed1" }} />
            </Space>
          }
          extra={
            <Button 
              type="dashed" 
              icon={<PlusOutlined />} 
              onClick={() => {
                singleStemForm.resetFields();
                setSingleStemModalOpen(true);
              }}
            >
              افزودن فروش شاخه‌ای
            </Button>
          }
          style={{ marginBottom: 16 }}
        >
          {singleStems.length === 0 ? (
            <Text type="secondary">هنوز فروش شاخه‌ای ثبت نشده است.</Text>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {singleStems.map((stem, idx) => (
                <Card key={stem.id} size="small">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Space direction="vertical" size="small">
                      <Text strong>فروش شاخه‌ای {idx + 1}</Text>
                      <Text>تعداد شاخه: {stem.stems_count} | گل در شاخه: {stem.flowers_per_stem}</Text>
                      <Text>قیمت واحد: {formatNumber(stem.unit_price)} تومان</Text>
                      {stem.cartons?.length > 0 && (
                        <Text type="secondary">
                          کارتن‌ها: {stem.cartons.map((c) => `${c.serial_code} (${c.count})`).join(", ")}
                        </Text>
                      )}
                    </Space>
                    <Button danger icon={<MinusCircleOutlined />} onClick={() => removeSingleStem(stem.id)}>
                      حذف
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </Card>

        {/* نهایی‌سازی */}
        <Card>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <div
                style={{
                  padding: 16,
                  backgroundColor: "#e6f7ff",
                  borderRadius: 8,
                  marginBottom: 16,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 8,
                  }}
                >
                  <Text strong style={{ fontSize: 16 }}>
                    مجموع قیمت:
                  </Text>
                  <Text strong style={{ fontSize: 18, color: "#1677ff" }}>
                    {formatNumber(calculateTotalPrice())} تومان
                  </Text>
                </div>
                {(() => {
                  const discounted = calculateDiscountedTotal();
                  const base = calculateTotalPrice();
                  if (discounted === null || discounted === base) return null;
                  return (
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginTop: 4,
                      }}
                    >
                      <Text type="secondary" style={{ fontSize: 14 }}>
                        مجموع پس از تخفیف:
                      </Text>
                      <Text strong style={{ fontSize: 18, color: "#52c41a" }}>
                        {formatNumber(discounted)} تومان
                      </Text>
                    </div>
                  );
                })()}
              </div>
            </Col>
            <Col xs={24} md={12}>
              <Row gutter={8}>
                <Col span={12}>
                  <Form.Item label="درصد تخفیف" name="discount_percent">
                    <InputNumber
                      min={0}
                      max={100}
                      style={{ width: "100%" }}
                      placeholder="مثلاً 5"
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="مبلغ تخفیف (تومان)" name="discount_amount">
                    <InputNumber
                      min={0}
                      style={{ width: "100%" }}
                      placeholder="مثلاً 100000"
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Col>
          </Row>

          <Space>
            <Button
              icon={<DeleteOutlined />}
              danger
              disabled={pricingItems.length === 0 && singleStems.length === 0}
              onClick={() => {
                serialSetRef.current = new Set();
                setAddedSerials([]);
                setRawItems([]);
                setPricingItems([]);
                setSingleStems([]);
                form.resetFields();
              }}
            >
              حذف همه
            </Button>
            <Button
              type="primary"
              icon={<CheckCircleOutlined />}
              onClick={handleFinalize}
              loading={finalizing}
              disabled={pricingItems.length === 0 && singleStems.length === 0}
            >
              نهایی‌سازی و ثبت قیمت‌ها
            </Button>
          </Space>
        </Card>
      </Form>

      {/* Modal اسکنر */}
      <Modal
        title="اسکن با دوربین"
        open={scanOpen}
        onCancel={() => toggleScanner(false)}
        footer={null}
        width={600}
        destroyOnClose
        afterClose={stopScanner}
      >
        <div>
          <div style={{ marginBottom: 8, display: "flex", gap: 8, alignItems: "center" }}>
            <Select
              value={selectedDeviceId}
              onChange={handleCameraChange}
              style={{ flex: 1 }}
              options={devices.map((d) => ({ value: d.deviceId, label: d.label || d.deviceId }))}
            />
            <Tooltip title="چراغ‌قوه">
              <Button type={torchOn ? "primary" : "default"} onClick={toggleTorch}>
                چراغ‌قوه
              </Button>
            </Tooltip>
          </div>
          <div style={{ position: "relative", width: "100%", minHeight: 400, background: "#000", borderRadius: 8, overflow: "hidden" }}>
            <video
              ref={videoRef}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              muted
              playsInline
            />
            {scanFlash && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "rgba(16, 185, 129, 0.2)",
                  border: "2px solid #10b981",
                  borderRadius: 8,
                  pointerEvents: "none",
                }}
              />
            )}
          </div>
          <div style={{ marginTop: 8 }}>
            <Text type="secondary">دوربین را روی بارکد/QR بگیرید. با هر اسکن به لیست اضافه می‌شود.</Text>
            {lastScanned && (
              <div style={{ marginTop: 4, direction: "ltr", fontSize: 12 }}>
                آخرین کد: <code>{lastScanned}</code>
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Modal فروش شاخه‌ای */}
      <Modal
        title="افزودن فروش شاخه‌ای"
        open={singleStemModalOpen}
        onCancel={() => {
          singleStemForm.resetFields();
          setSingleStemModalOpen(false);
        }}
        footer={null}
        width={600}
        destroyOnClose
      >
        <Form
          form={singleStemForm}
          layout="vertical"
          onFinish={addSingleStem}
        >
          <Text type="secondary" style={{ display: "block", marginBottom: 16 }}>
            این بخش برای فروش شاخه‌های جداگانه است که خارج از کارتن‌های اصلی هستند.
          </Text>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="محصول"
                name="product_id"
                rules={[{ required: true, message: "لطفاً محصول را انتخاب کنید" }]}
              >
                <Select 
                  placeholder="انتخاب محصول" 
                  showSearch
                  loading={loadingProducts}
                  filterOption={(input, option) =>
                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                  }
                  onChange={(value) => {
                    // Reset variation when product changes
                    singleStemForm.setFieldValue('product_variation_id', undefined);
                  }}
                  options={products.map((product) => ({
                    value: product.id,
                    label: product.title || `محصول ${product.id}`,
                  }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                noStyle
                shouldUpdate={(prevValues, currentValues) => 
                  prevValues.product_id !== currentValues.product_id
                }
              >
                {({ getFieldValue }) => {
                  const selectedProductId = getFieldValue('product_id');
                  const variations = getVariationsForProduct(selectedProductId);
                  const product = products.find(p => p.id === selectedProductId);
                  
                  return (
                    <Form.Item
                      label="تنوع"
                      name="product_variation_id"
                      rules={[{ required: true, message: "لطفاً تنوع را انتخاب کنید" }]}
                      key={selectedProductId || 'no-product'} // Force re-render when product changes
                    >
                      <Select 
                        placeholder={selectedProductId ? "انتخاب تنوع" : "ابتدا محصول را انتخاب کنید"} 
                        showSearch
                        disabled={!selectedProductId}
                        filterOption={(input, option) =>
                          (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                        }
                        options={variations.map((variation) => ({
                          value: variation.product_variant_id,
                          label: buildVariationLabel(variation, product?.title),
                        }))}
                      />
                    </Form.Item>
                  );
                }}
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="تعداد شاخه"
                name="stems_count"
                rules={[{ required: true, message: "لطفاً تعداد را وارد کنید" }]}
              >
                <InputNumber min={1} style={{ width: "100%" }} placeholder="مثلاً 10" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="گل در هر شاخه"
                name="flowers_per_stem"
                rules={[{ required: true, message: "لطفاً تعداد را وارد کنید" }]}
              >
                <InputNumber min={1} style={{ width: "100%" }} placeholder="مثلاً 3" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            label="قیمت واحد (تومان)"
            name="unit_price"
            rules={[{ required: true, message: "لطفاً قیمت را وارد کنید" }]}
          >
            <InputNumber min={0} style={{ width: "100%" }} placeholder="مثلاً 5000" />
          </Form.Item>

          <Form.List name="cartons">
            {(fields, { add, remove }) => (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <Text>کارتن‌ها (اختیاری)</Text>
                  <Button type="dashed" size="small" onClick={() => add()} icon={<PlusOutlined />}>
                    افزودن کارتن
                  </Button>
                </div>
                {fields.map(({ key, name, ...restField }) => (
                  <Space key={key} style={{ display: "flex", marginBottom: 8 }} align="baseline">
                    <Form.Item
                      {...restField}
                      name={[name, "serial_code"]}
                      rules={[{ required: true, message: "سریال را وارد کنید" }]}
                    >
                      <Input placeholder="سریال کارتن" style={{ width: 200 }} />
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, "count"]}
                      rules={[{ required: true, message: "تعداد را وارد کنید" }]}
                    >
                      <InputNumber min={1} placeholder="تعداد" style={{ width: 100 }} />
                    </Form.Item>
                    <MinusCircleOutlined onClick={() => remove(name)} />
                  </Space>
                ))}
              </>
            )}
          </Form.List>

          <Divider />
          <Space style={{ width: "100%", justifyContent: "flex-end" }}>
            <Button onClick={() => setSingleStemModalOpen(false)}>انصراف</Button>
            <Button type="primary" htmlType="submit">
              افزودن
            </Button>
          </Space>
        </Form>
      </Modal>
    </div>
  );
};

export default InvoicePricingPage;