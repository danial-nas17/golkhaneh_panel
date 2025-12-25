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
  Spin,
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
  EditOutlined,
} from "@ant-design/icons";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { lookupSerial, getInvoiceDetails, updateInvoiceItems } from "../../services/invoiceService";
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
  if (!variantsData) return "";
  const attrs = variantsData?.attribute_varitation || variantsData?.attributes || [];
  const parts = attrs.map((a) => {
    const vals = (a.values || []).map((v) => v.name || v.value).join("، ");
    return `${a.name || a.key}: ${vals}`;
  });
  return parts.join(" | ");
};

// Helper to extract product/variation data from invoice item
const extractVariantsData = (item) => {
  return item.variation || item.product || {};
};

const InvoiceEditPricingPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form] = Form.useForm();
  const [inputSerial, setInputSerial] = useState("");
  const [addedSerials, setAddedSerials] = useState([]); // list of strings
  const serialSetRef = useRef(new Set());
  const [rawItems, setRawItems] = useState([]); // list of lookup data blocks
  const [loadingAdd, setLoadingAdd] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [loadingInvoice, setLoadingInvoice] = useState(true);

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

  // Load invoice data on mount
  useEffect(() => {
    const loadInvoiceData = async () => {
      try {
        setLoadingInvoice(true);
        const invoiceData = await getInvoiceDetails(id);
        
        if (invoiceData) {
          const invoice = invoiceData;
          
          // Process existing items
          const existingRawItems = [];
          const existingSerials = new Set();
          
          // Process CUT_FLOWER items
          const cutFlowerItems = invoice.items?.filter(item => item.pack_type === "CUT_FLOWER") || [];
          const cutFlowerCartons = new Map();
          
          cutFlowerItems.forEach(item => {
            const cartonBarcodes = item.carton_barcodes || [];
            cartonBarcodes.forEach(barcode => {
              if (!cutFlowerCartons.has(barcode)) {
                cutFlowerCartons.set(barcode, {
                  label_serial: barcode,
                  pack_type: "CUT_FLOWER",
                  variants: []
                });
              }
              
              const carton = cutFlowerCartons.get(barcode);
              const variantsData = extractVariantsData(item);
              
              carton.variants.push({
                product_id: item.product_id,
                variation_id: item.product_variation_id,
                variants_data: variantsData,
                stems: item.unit_count || 0,
                flowers: item.flower_total || item.unit_count || 0,
                available_stems: (item.unit_count || 0) - (item.deducted_count || 0),
                available_flowers: (item.flower_total || item.unit_count || 0) - (item.deducted_count || 0),
              });
              
              existingSerials.add(barcode);
            });
          });
          
          // Process POTTED_PLANT items
          const pottedItems = invoice.items?.filter(item => item.pack_type === "POTTED_PLANT") || [];
          const pottedCartons = new Map();
          
          pottedItems.forEach(item => {
            const unitSerials = item.unit_serials || [];
            // برای هر سریال واحد یک کارتن مجزا در نظر می‌گیریم
            unitSerials.forEach(serial => {
              if (!pottedCartons.has(serial)) {
                pottedCartons.set(serial, {
                  label_serial: serial,
                  pack_type: "POTTED_PLANT",
                  variants: []
                });
              }
              
              const carton = pottedCartons.get(serial);
              const variantsData = extractVariantsData(item);
              
              carton.variants.push({
                product_id: item.product_id,
                variation_id: item.product_variation_id,
                variants_data: variantsData,
                serials: [serial],
                count: 1
              });
              
              existingSerials.add(serial);
            });
          });
          
          // Add all cartons to rawItems
          for (const carton of [...cutFlowerCartons.values(), ...pottedCartons.values()]) {
            existingRawItems.push(carton);
          }
          
          // Set states
          setAddedSerials(Array.from(existingSerials));
          setRawItems(existingRawItems);
          serialSetRef.current = new Set(existingSerials);
          
          // Set single stems
          const existingSingleStems = invoice.single_stems?.map((stem, index) => ({
            id: `stem-${index}-${Date.now()}`,
            product_id: stem.product_id,
            product_variation_id: stem.product_variation_id,
            stems_count: stem.stems_count,
            flowers_per_stem: stem.flowers_per_stem,
            unit_price: stem.unit_price,
            cartons: stem.cartons || [],
            variation: stem.variation || {},
            product: stem.product || {},
          })) || [];
          
          setSingleStems(existingSingleStems);
        }
      } catch (error) {
        console.error("Error loading invoice data:", error);
        message.error("خطا در بارگذاری اطلاعات فاکتور");
      } finally {
        setLoadingInvoice(false);
      }
    };
    
    if (id) {
      loadInvoiceData();
    }
  }, [id]);

  // Build pricing items from rawItems
  useEffect(() => {
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
            is_carton_separated: false,
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

  // Set form values after pricingItems are built
  useEffect(() => {
    if (pricingItems.length > 0) {
      const loadAndSetFormValues = async () => {
        try {
          const invoiceData = await getInvoiceDetails(id);
          if (invoiceData) {
            const initialValues = {};
            
            // Set prices for CUT_FLOWER items
            const cutFlowerItems = invoiceData.items?.filter(item => item.pack_type === "CUT_FLOWER") || [];
            
            cutFlowerItems.forEach(item => {
              // Find all matching pricing items for this product+variation
              const matchingItems = pricingItems.filter(pi => 
                pi.product_id === item.product_id && 
                pi.product_variation_id === item.product_variation_id
              );
              
              // Distribute unit price to all matching items
              matchingItems.forEach(matchingItem => {
                initialValues[`price_${matchingItem.id}`] = formatNumber(item.unit_price || 0);
                initialValues[`deducted_${matchingItem.id}`] = item.deducted_count || 0;
                
                // Check if item has adjustment (damaged)
                if (item.adjustment) {
                  initialValues[`damaged_${matchingItem.id}`] = true;
                  initialValues[`damaged_desc_${matchingItem.id}`] = item.adjustment.description || "";
                }
              });
            });
            
            // Set prices for POTTED_PLANT items
            const pottedItems = invoiceData.items?.filter(item => item.pack_type === "POTTED_PLANT") || [];
            
            pottedItems.forEach(item => {
              // Find matching group
              const matchingItems = pricingItems.filter(pi => 
                pi.product_id === item.product_id && 
                pi.product_variation_id === item.product_variation_id
              );
              
              // Set same price for all matching items
              matchingItems.forEach(matchingItem => {
                initialValues[`price_potted_${item.product_id}_${item.product_variation_id}`] = 
                  formatNumber(item.unit_price || 0);
              });
            });
            
            form.setFieldsValue(initialValues);
          }
        } catch (error) {
          console.error("Error setting form values:", error);
        }
      };
      
      loadAndSetFormValues();
    }
  }, [pricingItems, id, form]);

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
    
    const finalGroups = [];
    const normalVariantGroups = new Map();
    const pottedVariantGroups = new Map();
    
    for (const cartonGroup of cartonGroups.values()) {
      if (cartonGroup.is_carton_separated) {
        finalGroups.push({
          type: 'separated_carton',
          carton_serial: cartonGroup.carton_serial,
          pack_type: cartonGroup.pack_type,
          cartons: [cartonGroup],
        });
      } else {
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
            
            const group = normalVariantGroups.get(variantKey);
            const existingCarton = group.cartons.find(c => c.carton_serial === cartonGroup.carton_serial);
            if (!existingCarton) {
              group.cartons.push(cartonGroup);
            }
          }
        } else if (cartonGroup.pack_type === "POTTED_PLANT") {
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
                items: [],
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
    
    for (const group of normalVariantGroups.values()) {
      finalGroups.push(group);
    }
    
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

  // جداسازی کل کارتن
  const separateCarton = (cartonSerial) => {
    setPricingItems((prev) => 
      prev.map((item) => 
        item.carton_serial === cartonSerial 
          ? { ...item, is_carton_separated: true }
          : item
      )
    );
    
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

  // Scanner controls (همانند قبل)
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

    // POTTED_PLANT items
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

  const handleUpdate = async () => {
    try {
      const values = form.getFieldsValue();
      
      // ساخت ops برای به‌روزرسانی آیتم‌ها
      const ops = [];
      
      // برای آیتم‌های موجود، عملیات update
      // ابتدا داده‌های فعلی فاکتور را دریافت می‌کنیم
      const invoiceData = await getInvoiceDetails(id);
      const existingItems = invoiceData?.items || [];
      
      // برای هر آیتم موجود، یک عملیات update می‌سازیم
      existingItems.forEach(existingItem => {
        // پیدا کردن آیتم‌های متناظر در pricingItems
        const matchingItems = pricingItems.filter(item => 
          item.product_id === existingItem.product_id && 
          item.product_variation_id === existingItem.product_variation_id &&
          item.pack_type === existingItem.pack_type
        );
        
        // اگر آیتم‌های متناظر وجود دارند
        if (matchingItems.length > 0) {
          // محاسبه مقادیر جدید
          let totalFlowers = 0;
          let totalDeducted = 0;
          let unitSerials = [];
          let cartonBarcodes = [];
          
          matchingItems.forEach(item => {
            if (item.pack_type === "CUT_FLOWER") {
              const unitPrice = parseNumber(values[`price_${item.id}`] || existingItem.unit_price);
              const deducted = Number(values[`deducted_${item.id}`] || 0);
              const isDamaged = values[`damaged_${item.id}`] || false;
              const damagedDesc = values[`damaged_desc_${item.id}`] || "";
              
              totalFlowers += item.flowers;
              totalDeducted += deducted;
              
              if (item.carton_serial && !cartonBarcodes.includes(item.carton_serial)) {
                cartonBarcodes.push(item.carton_serial);
              }
              
              // اضافه کردن عملیات update برای این آیتم
              ops.push({
                op: 'update',
                item_id: existingItem.id,
                data: {
                  unit_price: unitPrice,
                  flower_total: item.flowers - deducted,
                  deducted_count: deducted > 0 ? deducted : undefined,
                  carton_barcodes: cartonBarcodes,
                  adjustment: isDamaged ? {
                    reason_type: "damaged",
                    description: damagedDesc || "کارتن آسیب دیده",
                  } : undefined
                }
              });
              
            } else if (item.pack_type === "POTTED_PLANT") {
              const unitPrice = parseNumber(values[`price_potted_${item.product_id}_${item.product_variation_id}`] || existingItem.unit_price);
              
              if (item.unit_serials && item.unit_serials.length > 0) {
                unitSerials = [...unitSerials, ...item.unit_serials];
              }
              
              if (item.carton_serial && !cartonBarcodes.includes(item.carton_serial)) {
                cartonBarcodes.push(item.carton_serial);
              }
              
              ops.push({
                op: 'update',
                item_id: existingItem.id,
                data: {
                  unit_price: unitPrice,
                  unit_serials: unitSerials,
                  carton_barcodes: cartonBarcodes
                }
              });
            }
          });
        }
      });
      
      // برای single stems
      const single_stems = singleStems.map((stem) => ({
        product_id: stem.product_id,
        product_variation_id: stem.product_variation_id,
        stems_count: stem.stems_count,
        flowers_per_stem: stem.flowers_per_stem,
        unit_price: stem.unit_price,
        cartons: stem.cartons.length > 0 ? stem.cartons : null,
      }));

      const payload = { ops };
      if (single_stems.length > 0) {
        payload.single_stems = single_stems;
      }

      setUpdating(true);
      await updateInvoiceItems({ invoiceId: id, ...payload });
      message.success("قیمت‌گذاری فاکتور با موفقیت به‌روزرسانی شد");
      navigate(`/invoices/${id}`);
    } catch (error) {
      const errorResult = UnifiedErrorHandler.handleApiError(error, form, {
        showValidationMessages: true,
        showGeneralMessages: true,
        defaultMessage: "خطا در به‌روزرسانی قیمت‌گذاری فاکتور",
      });
      message.error(errorResult.message);
      console.error(errorResult);
    } finally {
      setUpdating(false);
    }
  };

  if (loadingInvoice) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" tip="در حال بارگذاری اطلاعات فاکتور..." />
      </div>
    );
  }

  return (
    <div dir="rtl" style={{ padding: 16 }}>
      <Space style={{ marginBottom: 12 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(`/invoices/${id}`)}>بازگشت</Button>
        <Title level={4} style={{ margin: 0 }}>
          <EditOutlined /> ویرایش قیمت‌گذاری فاکتور #{id}
        </Title>
      </Space>

      {/* بخش اسکن */}
      <Card style={{ marginBottom: 16 }} title="افزودن سریال کارتن یا گلدان جدید">
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
            <Text type="secondary">سریال‌های موجود:</Text>
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
              <span>کارتن‌های موجود</span>
              <Badge count={addedSerials.length} style={{ backgroundColor: "#52c41a" }} />
            </Space>
          }
          style={{ marginBottom: 16 }}
        >
          {pricingItems.length === 0 ? (
            <Alert
              message="هیچ کارتن‌ای یافت نشد"
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

              {/* گروه‌های گلدانی */}
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
            <Text type="secondary">هیچ فروش شاخه‌ای ثبت نشده است.</Text>
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

        {/* به‌روزرسانی */}
        <Card>
          <div style={{ padding: 16, backgroundColor: "#e6f7ff", borderRadius: 8, marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Text strong style={{ fontSize: 18 }}>مجموع قیمت:</Text>
              <Text strong style={{ fontSize: 20, color: "#1677ff" }}>
                {formatNumber(calculateTotalPrice())} تومان
              </Text>
            </div>
          </div>
          <Space>
            <Button
              icon={<DeleteOutlined />}
              danger
              disabled={pricingItems.length === 0 && singleStems.length === 0}
              onClick={() => {
                if (window.confirm("آیا از حذف همه آیتم‌ها اطمینان دارید؟")) {
                  serialSetRef.current = new Set();
                  setAddedSerials([]);
                  setRawItems([]);
                  setPricingItems([]);
                  setSingleStems([]);
                  form.resetFields();
                }
              }}
            >
              حذف همه
            </Button>
            <Button
              type="primary"
              icon={<CheckCircleOutlined />}
              onClick={handleUpdate}
              loading={updating}
              disabled={pricingItems.length === 0 && singleStems.length === 0}
            >
              به‌روزرسانی قیمت‌گذاری
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
                      key={selectedProductId || 'no-product'}
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

export default InvoiceEditPricingPage;