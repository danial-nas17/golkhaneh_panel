import React, { useState, useEffect } from "react";
import {
  Modal,
  Form,
  Select,
  Input,
  InputNumber,
  Button,
  Card,
  Space,
  Row,
  Col,
  message,
  Typography,
  Badge,
  Popconfirm,
  Spin,
  Divider,
} from "antd";
import {
  PlusOutlined,
  MinusOutlined,
  DeleteOutlined,
  PrinterOutlined,
  SaveOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import api from "../../api";
import { UnifiedErrorHandler } from "../../utils/unifiedErrorHandler";

const { Title, Text } = Typography;
const { Option } = Select;

const BoxEditModal = ({ visible, boxId, onCancel, onUpdated }) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [boxData, setBoxData] = useState(null);
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // --- نمایش صحیح تنوع‌ها: کش تنوع‌های هر محصول + وضعیت لود ---
  const [variationsMap, setVariationsMap] = useState({}); // { [productId]: Variation[] }
  const [loadingVariations, setLoadingVariations] = useState({}); // { [productId]: boolean }

  // State for tracking changes
  const [originalData, setOriginalData] = useState(null);
  const [currentPackType, setCurrentPackType] = useState(null);
  // removed: currentProduct, currentVariation (no longer needed for CUT_FLOWER)

  // For potted plants
  const [pots, setPots] = useState([]);
  const [potsToRemove, setPotsToRemove] = useState([]);

  // For cut flowers - هر line حالا محصول و تنوع خودش را دارد
  const [lines, setLines] = useState([]);
  const [linesToRemove, setLinesToRemove] = useState([]);

  // Delete functionality
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteReason, setDeleteReason] = useState("");
  const [deleting, setDeleting] = useState(false);

  // ---------- Helpers: برچسب خوانای تنوع ----------
  const buildVariationLabel = (variationObj, productTitle) => {
    if (!variationObj) return productTitle || "تنوع";

    const attrs =
      variationObj.attribute_varitation ||
      variationObj.attribute_variation ||
      variationObj.attributes ||
      [];

    let parts = [];
    if (Array.isArray(attrs) && attrs.length) {
      parts = attrs
        .map((a) => {
          const vals = (a.values || [])
            .map((v) => (v.name || v.value || "").toString().trim())
            .filter(Boolean)
            .join("، ");
          return vals || null;
        })
        .filter(Boolean);
    }

    // fallback: اگر ویژگی‌ها نیامده باشند، از SKU (برای درجه) حدس بزن
    if (!parts.length && variationObj.SKU) {
      const m = variationObj.SKU.match(/درجه[_\-\s]*([A-Za-z\u0600-\u06FF]+)/);
      if (m?.[1]) parts.push(`درجه ${m[1].replace(/[_\-]/g, " ")}`);
    }

    const base = productTitle || variationObj.title || "محصول";
    const attrsStr = parts.join(" | ");
    return attrsStr ? `${base} – ${attrsStr}` : base;
  };

  const variationToOption = (variation, productTitle) => ({
    value: variation.product_variant_id ?? variation.id,
    label: buildVariationLabel(variation, productTitle),
  });

  // ---------- لود تنوع‌ها با ویژگی‌ها برای یک محصول (کش + تنبل) ----------
  const ensureProductVariationsLoaded = async (productId) => {
    if (!productId) return;
    if (variationsMap[productId]) return; // قبلاً لود شده
    if (loadingVariations[productId]) return; // در حال لود

    setLoadingVariations((prev) => ({ ...prev, [productId]: true }));
    try {
      // ❗ این endpoint/پارامترها را با API واقعی‌تان هماهنگ کنید
      const res = await api.get(`/panel/product/${productId}`, {
        params: {
          "includes[]": ["variations", "variations.attribute_varitation"],
        },
      });
      const pd = res?.data?.data || {};
      const vars = pd.variations || [];

      setVariationsMap((prev) => ({ ...prev, [productId]: vars }));
    } catch (e) {
      // اگر شکست خورد، از variants موجود در لیست products استفاده کن (بدون ویژگی)
      const fallbackProduct = products.find((p) => p.id === productId);
      const vars = fallbackProduct?.variants || [];
      setVariationsMap((prev) => ({ ...prev, [productId]: vars }));
    } finally {
      setLoadingVariations((prev) => ({ ...prev, [productId]: false }));
    }
  };

  const getVariationsForProduct = (productId) => {
    if (!productId) return [];
    return variationsMap[productId] || [];
  };

  useEffect(() => {
    if (visible && boxId) {
      fetchBoxData();
      fetchProducts();
    } else if (!visible) {
      resetModal();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, boxId]);

  // وقتی مودال باز است و محصول/گلدان‌ها/خطوط تغییر کردند، variations را preload کن
  useEffect(() => {
    if (!visible) return;

    (pots || []).forEach((p) => {
      if (p.product_id) ensureProductVariationsLoaded(p.product_id);
    });
    (lines || []).forEach((l) => {
      if (l.product_id) ensureProductVariationsLoaded(l.product_id);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, pots, lines]);

  const resetModal = () => {
    setBoxData(null);
    setOriginalData(null);
    setCurrentPackType(null);
    setPots([]);
    setPotsToRemove([]);
    setLines([]);
    setLinesToRemove([]);
    setDeleteModalVisible(false);
    setDeleteReason("");
    setDeleting(false);
    // کش تنوع‌ها را پاک نکن تا بین باز/بسته کمی سریع‌تر شود؛ تمایل داشتی پاک کن:
    // setVariationsMap({});
    // setLoadingVariations({});
  };

  const fetchBoxData = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/panel/items/${boxId}`, {
        params: {
          "includes[]": ["product", "variation", "pots", "lines", "label"],
        },
      });

      const data = response.data.data;
      setBoxData(data);
      setOriginalData(data);
      setCurrentPackType(data.pack_type);

      if (data.pack_type === "POTTED_PLANT") {
        setPots(
          data.pots?.map((pot) => ({
            id: pot.id,
            serial_code: pot.serial_code,
            product_id: pot.product?.id,
            product_variation_id:
              pot.variation?.product_variant_id || pot.variation?.id,
            stems_count: pot.stems_count || null,
            flowers_total: pot.flowers_total || null,
            isNew: false,
          })) || []
        );
      } else if (data.pack_type === "CUT_FLOWER") {
        setLines(
          data.lines?.map((line) => ({
            id: line.id,
            product_id: line.product?.id || null,
            product_variation_id:
              line.product_variation_id?.product_variant_id ||
              line.variation?.product_variant_id ||
              (typeof line.product_variation_id === "number"
                ? line.product_variation_id
                : null),
            stems: line.stems_count,
            flowers_per_stem: line.flowers_per_stem,
            isNew: false,
          })) || []
        );
      }
    } catch (error) {
      UnifiedErrorHandler.handleApiError(error, null, {
        showGeneralMessages: true,
        defaultMessage: "خطا در دریافت اطلاعات جعبه"
      });
      console.error("Error fetching box data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    setLoadingProducts(true);
    try {
      const response = await api.get("/panel/product", {
        params: {
          "includes[]": ["variants"],
          per_page: 100,
        },
      });
      setProducts(response.data.data || []);
    } catch (error) {
      UnifiedErrorHandler.handleApiError(error, null, {
        showGeneralMessages: true,
        defaultMessage: "خطا در دریافت محصولات"
      });
      console.error("Error fetching products:", error);
    } finally {
      setLoadingProducts(false);
    }
  };

  // ✅ گلدان جدید
  const addNewPot = () => {
    const newPot = {
      id: `new_${Date.now()}`,
      serial_code: "",
      product_id: null,
      product_variation_id: null,
      stems_count: null,
      flowers_total: null,
      isNew: true,
    };
    setPots((prev) => [...prev, newPot]);
  };

  const removePot = (potIndex, pot) => {
    if (!pot.isNew) {
      setPotsToRemove((prev) => [...prev, pot.id]);
    }
    setPots((prev) => prev.filter((_, index) => index !== potIndex));
  };

  const updatePot = (potIndex, field, value) => {
    setPots((prev) =>
      prev.map((pot, index) =>
        index === potIndex ? { ...pot, [field]: value } : pot
      )
    );
  };

  const addNewLine = () => {
    const newLine = {
      id: `new_${Date.now()}`,
      product_id: null,
      product_variation_id: null,
      stems: 1,
      flowers_per_stem: 1,
      isNew: true,
    };
    setLines((prev) => [...prev, newLine]);
  };

  const removeLine = (lineIndex, line) => {
    if (!line.isNew) {
      setLinesToRemove((prev) => [...prev, line.id]);
    }
    setLines((prev) => prev.filter((_, index) => index !== lineIndex));
  };

  const updateLine = (lineIndex, field, value) => {
    setLines((prev) =>
      prev.map((line, index) =>
        index === lineIndex ? { ...line, [field]: value } : line
      )
    );
  };

  const handlePackTypeChange = (newPackType) => {
    setCurrentPackType(newPackType);
    if (newPackType !== originalData?.pack_type) {
      // Reset data when changing pack type
      setPots([]);
      setLines([]);
      setPotsToRemove([]);
      setLinesToRemove([]);
    }
  };

  const buildUpdatePayload = () => {
    const payload = {
      pack_type: currentPackType,
    };

    if (currentPackType === "POTTED_PLANT") {
      // Add pot_type if available from boxData, otherwise use default
      if (boxData?.pot_type) {
        payload.pot_type = boxData.pot_type;
      }

      const existingPots = pots.filter((pot) => !pot.isNew);
      const newPots = pots.filter((pot) => pot.isNew);

      if (existingPots.length > 0) {
        payload.pots_update = existingPots.map((pot) => ({
          id: pot.id,
          serial_code: pot.serial_code,
          product_id: pot.product_id,
          product_variation_id: pot.product_variation_id,
          stems_count: pot.stems_count,
        }));
      }

      if (newPots.length > 0) {
        payload.pots_add = newPots.map((pot) => ({
          serial_code: pot.serial_code,
          product_id: pot.product_id,
          product_variation_id: pot.product_variation_id,
          stems_count: pot.stems_count,
          flowers_total: pot.flowers_total,
        }));
      }

      if (potsToRemove.length > 0) {
        payload.pots_remove = potsToRemove;
      }
    } else if (currentPackType === "CUT_FLOWER") {
      const existingLines = lines.filter((line) => !line.isNew);
      const newLines = lines.filter((line) => line.isNew);

      payload.lines = [
        ...existingLines.map((line) => ({
          id: line.id,
          product_id: line.product_id,
          product_variation_id: line.product_variation_id,
          stems: line.stems,
          flowers_per_stem: line.flowers_per_stem,
        })),
        ...newLines.map((line) => ({
          product_id: line.product_id,
          product_variation_id: line.product_variation_id,
          stems: line.stems,
          flowers_per_stem: line.flowers_per_stem,
        })),
      ];

      if (linesToRemove.length > 0) {
        payload.lines_remove = linesToRemove;
      }
    }

    return payload;
  };

  const handleSave = async () => {
    // Validation
    if (currentPackType === "POTTED_PLANT") {
      const invalidPots = pots.filter(
        (pot) =>
          !pot.serial_code || 
          !pot.product_id || 
          !pot.product_variation_id ||
          pot.stems_count === null || pot.stems_count === undefined ||
          pot.flowers_total === null || pot.flowers_total === undefined
      );
      if (invalidPots.length > 0) {
        message.error("لطفا تمام فیلدهای گلدان‌ها (کد سریال، محصول، تنوع، تعداد شاخه و تعداد گل) را پر کنید");
        return;
      }
    } else if (currentPackType === "CUT_FLOWER") {
      const invalidLines = lines.filter(
        (line) =>
          !line.product_id ||
          !line.product_variation_id ||
          !line.stems ||
          !line.flowers_per_stem ||
          line.stems < 1 ||
          line.flowers_per_stem < 1
      );
      if (invalidLines.length > 0) {
        message.error("لطفا تمام فیلدهای ردیف‌ها (محصول، تنوع، شاخه و گل) را صحیح پر کنید");
        return;
      }
    }

    setSaving(true);
    try {
      const payload = buildUpdatePayload();
      await api.put(`/panel/items/${boxId}`, payload);
      message.success("جعبه با موفقیت به‌روزرسانی شد");
      onUpdated?.();
      onCancel();
    } catch (error) {
      console.error("Error updating box:", error);

      if (
        error.response?.status === 422 &&
        error.response?.data?.data?.errors
      ) {
        const validationErrors = error.response.data.data.errors;
        const errorMessages = Object.values(validationErrors).flat();
        errorMessages.forEach((errorMsg) => {
          message.error(errorMsg);
        });
      } else {
        const errorMessage =
          error.response?.data?.message || "خطا در به‌روزرسانی جعبه";
        message.error(errorMessage);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBox = async () => {
    if (!deleteReason.trim()) {
      message.error("لطفا دلیل حذف را وارد کنید");
      return;
    }

    setDeleting(true);
    try {
      await api.delete(`/panel/items/${boxId}`, {
        data: { reason: deleteReason.trim() },
      });

      message.success("جعبه با موفقیت حذف شد");
      setDeleteModalVisible(false);
      onUpdated?.();
      onCancel();
    } catch (error) {
      UnifiedErrorHandler.handleApiError(error, null, {
        showGeneralMessages: true,
        defaultMessage: "خطا در حذف جعبه"
      });
      console.error("Error deleting box:", error);
    } finally {
      setDeleting(false);
    }
  };

  const renderPottedPlantForm = () => (
    <div>
      {/* removed pot type field */}

      {pots.map((pot, index) => (
        <Card
          key={pot.id}
          size="small"
          style={{ marginBottom: 16 }}
          title={
            <Space>
              <Badge count={index + 1} style={{ backgroundColor: "#52c41a" }} />
              <Text strong>گلدان {index + 1}</Text>
              {pot.isNew && <Badge status="processing" text="جدید" />}
            </Space>
          }
          extra={
            <Popconfirm
              title="آیا از حذف این گلدان اطمینان دارید؟"
              onConfirm={() => removePot(index, pot)}
            >
              <Button danger size="small" icon={<DeleteOutlined />}>
                حذف
              </Button>
            </Popconfirm>
          }
        >
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="کد سریال">
                <Input
                  value={pot.serial_code}
                  onChange={(e) =>
                    updatePot(index, "serial_code", e.target.value)
                  }
                  placeholder="مثال: P-08163796"
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="محصول">
                <Select
                  value={pot.product_id}
                  onChange={(value) => {
                    updatePot(index, "product_id", value);
                    updatePot(index, "product_variation_id", null);
                    ensureProductVariationsLoaded(value); // ← این مهمه
                  }}
                  placeholder="انتخاب محصول"
                  loading={loadingProducts}
                  showSearch
                  style={{ width: "100%" }}
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
                  value={pot.product_variation_id || undefined}
                  onChange={(value) =>
                    updatePot(index, "product_variation_id", value)
                  }
                  placeholder="انتخاب تنوع"
                  disabled={!pot.product_id}
                  showSearch
                  optionFilterProp="label"
                  loading={!!loadingVariations[pot.product_id]}
                  style={{ width: "100%" }}
                  options={getVariationsForProduct(pot.product_id).map((v) =>
                    variationToOption(
                      v,
                      products.find((p) => p.id === pot.product_id)?.title
                    )
                  )}
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="تعداد شاخه">
                <InputNumber
                  min={0}
                  value={pot.stems_count}
                  onChange={(value) => updatePot(index, "stems_count", value)}
                  placeholder="تعداد شاخه"
                  style={{ width: "100%" }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="تعداد گل">
                <InputNumber
                  min={0}
                  value={pot.flowers_total}
                  onChange={(value) => updatePot(index, "flowers_total", value)}
                  placeholder="تعداد گل"
                  style={{ width: "100%" }}
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>
      ))}

      <Button
        type="dashed"
        icon={<PlusOutlined />}
        onClick={addNewPot}
        style={{ width: "100%", marginBottom: 16 }}
      >
        افزودن گلدان جدید
      </Button>
    </div>
  );

  const renderCutFlowerForm = () => (
    <div>
      {lines.map((line, index) => (
        <Card
          key={line.id}
          size="small"
          style={{ marginBottom: 16 }}
          title={
            <Space>
              <Badge count={index + 1} style={{ backgroundColor: "#1677ff" }} />
              <Text strong>ردیف {index + 1}</Text>
              {line.isNew && <Badge status="processing" text="جدید" />}
            </Space>
          }
          extra={
            <Popconfirm
              title="آیا از حذف این ردیف اطمینان دارید؟"
              onConfirm={() => removeLine(index, line)}
            >
              <Button danger size="small" icon={<DeleteOutlined />}>
                حذف
              </Button>
            </Popconfirm>
          }
        >
          <Row gutter={16} style={{ marginBottom: 8 }}>
          <Col span={12}>
            <Form.Item label="محصول">
              <Select
                  value={line.product_id}
                onChange={(value) => {
                    updateLine(index, "product_id", value);
                    updateLine(index, "product_variation_id", null);
                    ensureProductVariationsLoaded(value);
                }}
                placeholder="انتخاب محصول"
                loading={loadingProducts}
                showSearch
                style={{ width: "100%" }}
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
                  value={line.product_variation_id || undefined}
                  onChange={(value) =>
                    updateLine(index, "product_variation_id", value)
                  }
                placeholder="انتخاب تنوع"
                  disabled={!line.product_id}
                showSearch
                optionFilterProp="label"
                  loading={!!loadingVariations[line.product_id]}
                style={{ width: "100%" }}
                  options={getVariationsForProduct(line.product_id).map((v) =>
                  variationToOption(
                    v,
                      products.find((p) => p.id === line.product_id)?.title
                  )
                )}
              />
            </Form.Item>
          </Col>
        </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="تعداد شاخه">
                <InputNumber
                  min={1}
                  value={line.stems}
                  onChange={(value) => updateLine(index, "stems", value)}
                  placeholder="تعداد شاخه"
                  style={{ width: "100%" }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="گل در هر شاخه">
                <InputNumber
                  min={1}
                  value={line.flowers_per_stem}
                  onChange={(value) =>
                    updateLine(index, "flowers_per_stem", value)
                  }
                  placeholder="گل در هر شاخه"
                  style={{ width: "100%" }}
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>
      ))}

      <Button
        type="dashed"
        icon={<PlusOutlined />}
        onClick={addNewLine}
        style={{ width: "100%", marginBottom: 16 }}
      >
        افزودن ردیف جدید
      </Button>
    </div>
  );

  if (!boxData && loading) {
    return (
      <Modal
        title="ویرایش جعبه"
        open={visible}
        onCancel={onCancel}
        footer={null}
        width={800}
      >
        <div style={{ textAlign: "center", padding: "50px" }}>
          <Spin size="large" />
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      title={
        <Space>
          <span>ویرایش جعبه</span>
          {boxData && (
            <Badge
              count={`#${boxData.id}`}
              style={{ backgroundColor: "#faad14" }}
            />
          )}
        </Space>
      }
      open={visible}
      onCancel={onCancel}
      width={900}
      footer={
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <Space>
            <Button
              danger
              icon={<DeleteOutlined />}
              onClick={() => setDeleteModalVisible(true)}
            >
              حذف جعبه
            </Button>
          </Space>
          <Space>
            <Button onClick={onCancel}>انصراف</Button>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              loading={saving}
              onClick={handleSave}
            >
              ذخیره تغییرات
            </Button>
          </Space>
        </div>
      }
    >
      {boxData && (
        <div>
          <Card
            size="small"
            style={{ marginBottom: 16, backgroundColor: "#f9f9f9" }}
          >
            <Row gutter={16}>
              <Col span={12}>
                <Text strong>ردیف: </Text>
                <Text>{boxData.row_no}</Text>
              </Col>
              <Col span={12}>
                <Text strong>تاریخ بسته‌بندی: </Text>
                <Text>{boxData.packaged_at}</Text>
              </Col>
            </Row>
          </Card>

          <Form.Item label="نوع بسته‌بندی" style={{ marginBottom: 24 }}>
            <Select
              value={currentPackType}
              onChange={handlePackTypeChange}
              style={{ width: "100%" }}
              size="large"
            >
              <Option value="POTTED_PLANT">گلدان</Option>
              <Option value="CUT_FLOWER">شاخه بریده</Option>
            </Select>
          </Form.Item>

          <Divider />

          {currentPackType === "POTTED_PLANT" && renderPottedPlantForm()}
          {currentPackType === "CUT_FLOWER" && renderCutFlowerForm()}

          {(pots.length > 0 || lines.length > 0) && (
            <Card size="small" style={{ backgroundColor: "#f0f8ff" }}>
              <Title level={5}>خلاصه تغییرات</Title>
              {currentPackType === "POTTED_PLANT" && (
                <div>
                  <Text>
                    تعداد گلدان‌ها: <strong>{pots.length}</strong>
                  </Text>
                  {potsToRemove.length > 0 && (
                    <div style={{ marginTop: 8 }}>
                      <Text type="danger">
                        حذف شده: {potsToRemove.length} گلدان
                      </Text>
                    </div>
                  )}
                </div>
              )}
              {currentPackType === "CUT_FLOWER" && (
                <div>
                  <Text>
                    تعداد ردیف‌ها: <strong>{lines.length}</strong>
                  </Text>
                  <br />
                  <Text>
                    مجموع شاخه‌ها:{" "}
                    <strong>
                      {lines.reduce((sum, line) => sum + (line.stems || 0), 0)}
                    </strong>
                  </Text>
                  <br />
                  <Text>
                    مجموع گل‌ها:{" "}
                    <strong>
                      {lines.reduce(
                        (sum, line) =>
                          sum +
                          (line.stems || 0) * (line.flowers_per_stem || 0),
                        0
                      )}
                    </strong>
                  </Text>
                  {linesToRemove.length > 0 && (
                    <div style={{ marginTop: 8 }}>
                      <Text type="danger">
                        حذف شده: {linesToRemove.length} ردیف
                      </Text>
                    </div>
                  )}
                </div>
              )}
            </Card>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        title={
          <Space>
            <ExclamationCircleOutlined style={{ color: "#ff4d4f" }} />
            <span>تأیید حذف جعبه</span>
          </Space>
        }
        open={deleteModalVisible}
        onCancel={() => setDeleteModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setDeleteModalVisible(false)}>
            انصراف
          </Button>,
          <Button
            key="delete"
            type="primary"
            danger
            loading={deleting}
            onClick={handleDeleteBox}
          >
            حذف جعبه
          </Button>,
        ]}
        width={500}
      >
        <div style={{ marginBottom: 16 }}>
          <Text strong style={{ color: "#ff4d4f" }}>
            آیا از حذف این جعبه اطمینان دارید؟
          </Text>
          <br />
          <Text type="secondary">
            این عملیات قابل بازگشت نیست و جعبه به طور کامل حذف خواهد شد.
          </Text>
        </div>

        <Form.Item
          label="دلیل حذف"
          required
          rules={[{ required: true, message: "لطفا دلیل حذف را وارد کنید" }]}
        >
          <Input.TextArea
            value={deleteReason}
            onChange={(e) => setDeleteReason(e.target.value)}
            placeholder="دلیل حذف جعبه را وارد کنید..."
            rows={3}
            maxLength={500}
            showCount
          />
        </Form.Item>
      </Modal>
    </Modal>
  );
};

export default BoxEditModal;
