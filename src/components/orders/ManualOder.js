import React, { useEffect, useMemo, useState } from 'react';
import {
  Card,
  Button,
  Form,
  Select,
  InputNumber,
  Input,
  Space,
  Row,
  Col,
  Divider,
  message,
  Typography,
  Popconfirm,
  Badge,
  Spin,
  Empty,
} from 'antd';
import {
  PlusOutlined,
  MinusOutlined,
  SaveOutlined,
  DeleteOutlined,
  ShoppingCartOutlined,
  GiftOutlined,
} from '@ant-design/icons';
import axios from 'axios';

const { Title, Text } = Typography;
const { Option } = Select;

const ManualOrderPanel = () => {
  const [boxes, setBoxes] = useState([]);
  const [loading, setLoading] = useState({});
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);

  // --- APIs ---
  const api = useMemo(
    () =>
      axios.create({
        baseURL: 'https://api.healfit.ae/api/v2',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      }),
    []
  );

  const productApi = useMemo(
    () =>
      axios.create({
        baseURL: 'https://gol.digizooom.com/api/v1',
        headers: {
          // اگر توکن لازم دارید، اینجا اضافه کنید:
          // Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      }),
    []
  );

  // --- Utils ---
  const reindexBoxes = (list) => {
    // اگر نام پیش‌فرض بوده (Box N) با شماره جدید آپدیت می‌شود
    const defaultNameRegex = /^Box\s+\d+$/i;
    return list.map((b, idx) => {
      const order = idx + 1;
      const autoName =
        b.autoNamed &&
        (defaultNameRegex.test(b.name) || b.name?.trim() === '' || b.name?.startsWith('Box '));
      return {
        ...b,
        order,
        name: autoName ? `Box ${order}` : b.name,
      };
    });
  };

  const findProductById = (id) => products.find((p) => Number(p.id) === Number(id));

  // --- Load products once ---
  useEffect(() => {
    const load = async () => {
      try {
        setProductsLoading(true);
        const res = await productApi.get(
          '/panel/product?page=1&per_page=50&search=&includes[]=variants&includes[]=attributes'
        );
        const list = Array.isArray(res?.data?.data) ? res.data.data : [];
        setProducts(list);
      } catch (err) {
        console.error('Failed to load products', err);
        message.error('خطا در دریافت لیست محصولات');
      } finally {
        setProductsLoading(false);
      }
    };
    load();
  }, [productApi]);

  // --- Box ops ---
  const addNewBox = () => {
    const nextOrder = boxes.length + 1;
    const newBox = {
      id: Date.now(),
      order: nextOrder,
      name: `Box ${nextOrder}`,
      autoNamed: true, // اگر کاربر نام را ویرایش کند، false می‌شود
      rows: [],
      status: 'draft', // draft | saved
    };
    setBoxes((prev) => [...prev, newBox]);
    message.success('جعبه جدید اضافه شد');
  };

  const removeBox = (boxId) => {
    setBoxes((prev) => {
      const filtered = prev.filter((b) => b.id !== boxId);
      const reindexed = reindexBoxes(filtered);
      return reindexed;
    });
    message.success('جعبه حذف شد');
  };

  const updateBoxName = (boxId, name) => {
    setBoxes((prev) =>
      prev.map((b) => {
        if (b.id === boxId) {
          return { ...b, name, autoNamed: false };
        }
        return b;
      })
    );
  };

  // --- Row ops ---
  const addRowToBox = (boxId) => {
    setBoxes((prev) =>
      prev.map((box) => {
        if (box.id === boxId) {
          const newRow = {
            id: Date.now() + Math.random(),
            type: '', // 'cut_flower' | 'pot'
            // برای گل شاخه بریده
            stem_count: 1,
            flower_count: 1,
            // برای گلدان
            pot_serial: '',
            pot_count: 1,
            // انتخاب محصول/تنوع
            product_id: null,
            variant_id: null,
          };
          return { ...box, rows: [...box.rows, newRow] };
        }
        return box;
      })
    );
  };

  const removeRowFromBox = (boxId, rowId) => {
    setBoxes((prev) =>
      prev.map((box) => {
        if (box.id === boxId) {
          return { ...box, rows: box.rows.filter((r) => r.id !== rowId) };
        }
        return box;
      })
    );
  };

  const updateRowData = (boxId, rowId, field, value) => {
    setBoxes((prev) =>
      prev.map((box) => {
        if (box.id === boxId) {
          return {
            ...box,
            rows: box.rows.map((row) => {
              if (row.id === rowId) {
                // اگر محصول تغییر کرد، تنوع را ریست کن
                if (field === 'product_id') {
                  return { ...row, product_id: value, variant_id: null };
                }
                return { ...row, [field]: value };
              }
              return row;
            }),
          };
        }
        return box;
      })
    );
  };

  // --- Save ---
  const saveBoxData = async (boxId) => {
    const box = boxes.find((b) => b.id === boxId);
    if (!box || box.rows.length === 0) {
      message.warning('لطفاً حداقل یک ردیف به جعبه اضافه کنید');
      return;
    }

    // Validation
    const invalidRows = box.rows.filter((row) => {
      if (!row.type) return true;
      // نیازمند انتخاب محصول
      if (!row.product_id) return true;
      // اگر محصول تنوع دارد و variant_id انتخاب نشده، نامعتبر
      const p = findProductById(row.product_id);
      const hasVariants = Array.isArray(p?.variants) && p.variants.length > 0;
      if (hasVariants && !row.variant_id) return true;

      if (row.type === 'pot' && (!row.pot_serial || row.pot_count < 1)) return true;
      if (row.type === 'cut_flower' && (row.stem_count < 1 || row.flower_count < 1)) return true;
      return false;
    });

    if (invalidRows.length > 0) {
      message.error('لطفاً تمام فیلدهای لازم هر ردیف را تکمیل کنید');
      return;
    }

    try {
      setLoading((prev) => ({ ...prev, [boxId]: true }));

      const payload = {
        name: box.name,
        order: box.order,
        rows: box.rows.map((row) => {
          const base = {
            type: row.type,
            product_id: row.product_id,
            variant_id: row.variant_id, // ممکن است null باشد اگر محصول تنوع نداشت
          };
          return row.type === 'cut_flower'
            ? { ...base, stem_count: row.stem_count, flower_count: row.flower_count }
            : { ...base, pot_serial: row.pot_serial, pot_count: row.pot_count };
        }),
      };

      await api.post('/admin/manual-order/box/', payload);

      setBoxes((prev) =>
        prev.map((b) => {
          if (b.id === boxId) return { ...b, status: 'saved' };
          return b;
        })
      );

      message.success(`${box.name} با موفقیت ذخیره شد`);
    } catch (error) {
      message.error('ذخیره جعبه ناموفق بود');
      console.error('Error saving box:', error);
    } finally {
      setLoading((prev) => ({ ...prev, [boxId]: false }));
    }
  };

  // --- Render Helpers ---
  // Build readable variation label from attributes with sensible fallbacks
  const buildVariationLabel = (variation, productTitle) => {
    if (!variation) return productTitle || "تنوع";
    const attrs =
      variation.attribute_varitation ||
      variation.attribute_variation ||
      variation.attributes ||
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
    if (!parts.length && variation.SKU) {
      const m = variation.SKU.match(/درجه[_\-\s]*([A-Za-z\u0600-\u06FF]+)/);
      if (m && m[1]) parts.push(`درجه ${m[1].replace(/[_\-]/g, " ")}`);
    }
    const base = productTitle || variation.title || "محصول";
    return parts.length ? `${base} – ${parts.join(" | ")}` : base;
  };
  const renderProductSelectors = (box, row) => {
    const selectedProduct = row.product_id ? findProductById(row.product_id) : null;
    const variantList = selectedProduct?.variants || [];
    const hasVariants = Array.isArray(variantList) && variantList.length > 0;

    return (
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item label="محصول">
            <Select
              showSearch
              placeholder={productsLoading ? 'در حال بارگذاری...' : 'انتخاب محصول'}
              value={row.product_id ?? undefined}
              onChange={(val) => updateRowData(box.id, row.id, 'product_id', val)}
              optionFilterProp="label"
              loading={productsLoading}
              allowClear
            >
              {products.map((p) => (
                <Option key={p.id} value={p.id} label={p.title}>
                  {p.title}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label="تنوع (Variant)">
            <Select
              placeholder={hasVariants ? 'انتخاب تنوع' : 'بدون تنوع'}
              value={row.variant_id ?? undefined}
              onChange={(val) => updateRowData(box.id, row.id, 'variant_id', val)}
              disabled={!hasVariants}
              allowClear
            >
              {variantList.map((v) => {
                const value = v.product_variant_id ?? v.id;
                return (
                  <Option key={value} value={value}>
                    {buildVariationLabel(v, selectedProduct?.title)}
                  </Option>
                );
              })}
            </Select>
          </Form.Item>
        </Col>
      </Row>
    );
  };

  const renderRowFields = (box, row) => {
    if (!row.type) {
      return (
        <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
          ابتدا نوع کالا را انتخاب کنید
        </div>
      );
    }

    return (
      <>
        {/* انتخاب محصول/تنوع (از همان ریسپانس محصولات) */}
        {renderProductSelectors(box, row)}

        {/* فیلدهای اختصاصی هر نوع */}
        {row.type === 'cut_flower' ? (
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="تعداد ساقه">
                <InputNumber
                  min={1}
                  value={row.stem_count}
                  onChange={(value) => updateRowData(box.id, row.id, 'stem_count', value)}
                  placeholder="تعداد ساقه"
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="تعداد گل">
                <InputNumber
                  min={1}
                  value={row.flower_count}
                  onChange={(value) => updateRowData(box.id, row.id, 'flower_count', value)}
                  placeholder="تعداد گل"
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
          </Row>
        ) : (
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="سریال گلدان">
                <Input
                  value={row.pot_serial}
                  onChange={(e) => updateRowData(box.id, row.id, 'pot_serial', e.target.value)}
                  placeholder="سریال گلدان"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="تعداد گلدان">
                <InputNumber
                  min={1}
                  value={row.pot_count}
                  onChange={(value) => updateRowData(box.id, row.id, 'pot_count', value)}
                  placeholder="تعداد"
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
          </Row>
        )}
      </>
    );
  };

  const getRowSummary = (row) => {
    const p = row.product_id ? findProductById(row.product_id) : null;
    const variant =
      p && row.variant_id
        ? (p.variants || []).find(
            (v) =>
              Number(v.product_variant_id ?? v.id) === Number(row.variant_id)
          )
        : null;

    const productPart = p ? ` | محصول: ${p.title}` : '';
    const variantPart = variant
      ? ` | تنوع: ${buildVariationLabel(variant, p?.title)}`
      : '';

    if (row.type === 'cut_flower') {
      return `${row.stem_count} ساقه، ${row.flower_count} گل${productPart}${variantPart}`;
    }
    if (row.type === 'pot') {
      return `${row.pot_count} گلدان (سریال: ${row.pot_serial || 'ثبت نشده'})${productPart}${variantPart}`;
    }
    return `تنظیم نشده${productPart}${variantPart}`;
  };

  return (
    <div style={{ padding: '24px', backgroundColor: '#f5f7fa', minHeight: '100vh' }}>
      <Card
        title={
          <Space>
            <ShoppingCartOutlined />
            <Title level={3} style={{ margin: 0 }}>
              Manual Order Panel
            </Title>
          </Space>
        }
        bordered={false}
        style={{ marginBottom: 24 }}
      >
        <Button type="primary" icon={<PlusOutlined />} onClick={addNewBox} size="large">
          افزودن جعبه جدید
        </Button>
      </Card>

      {boxes.map((box) => (
        <Card
          key={box.id}
          className="box-card"
          style={{ marginBottom: 24 }}
          title={
            <Space wrap>
              <GiftOutlined />
              <Badge count={box.order} style={{ backgroundColor: '#2f54eb' }} />
              <Input
                value={box.name}
                onChange={(e) => updateBoxName(box.id, e.target.value)}
                style={{ width: 220 }}
                variant="borderless"
                size="large"
              />
              <Badge
                status={box.status === 'saved' ? 'success' : 'default'}
                text={box.status === 'saved' ? 'Saved' : 'Draft'}
              />
            </Space>
          }
          extra={
            <Space>
              <Button
                type="primary"
                icon={<SaveOutlined />}
                onClick={() => saveBoxData(box.id)}
                loading={!!loading[box.id]}
              >
                ذخیره جعبه
              </Button>
              <Popconfirm
                title="این جعبه حذف شود؟"
                onConfirm={() => removeBox(box.id)}
                okText="بله"
                cancelText="خیر"
              >
                <Button danger icon={<DeleteOutlined />}>
                  حذف جعبه
                </Button>
              </Popconfirm>
            </Space>
          }
        >
          {box.rows.map((row, rowIndex) => (
            <Card
              key={row.id}
              size="small"
              style={{ marginBottom: 16 }}
              title={
                <Space wrap>
                  <Badge count={rowIndex + 1} style={{ backgroundColor: '#52c41a' }} />
                  <Text strong>ردیف {rowIndex + 1}</Text>
                  {row.type && (
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      ({getRowSummary(row)})
                    </Text>
                  )}
                </Space>
              }
              extra={
                <Button
                  danger
                  size="small"
                  icon={<MinusOutlined />}
                  onClick={() => removeRowFromBox(box.id, row.id)}
                >
                  حذف ردیف
                </Button>
              }
            >
              <Row gutter={16} style={{ marginBottom: 16 }}>
                <Col span={24}>
                  <Form.Item label="نوع کالا">
                    <Select
                      value={row.type || undefined}
                      onChange={(value) => updateRowData(box.id, row.id, 'type', value)}
                      placeholder="انتخاب نوع کالا"
                      style={{ width: '100%' }}
                      options={[
                        { value: 'cut_flower', label: 'گل شاخه بریده' },
                        { value: 'pot', label: 'گلدان' },
                      ]}
                    />
                  </Form.Item>
                </Col>
              </Row>

              {renderRowFields(box, row)}
            </Card>
          ))}

          <Button
            type="dashed"
            icon={<PlusOutlined />}
            onClick={() => addRowToBox(box.id)}
            style={{ width: '100%', height: 50 }}
          >
            افزودن ردیف به {box.name}
          </Button>

          {box.rows.length > 0 && (
            <>
              <Divider />
              <div style={{ textAlign: 'center' }}>
                <Text type="secondary">
                  تعداد ردیف‌ها: {box.rows.length} | گل شاخه بریده:{' '}
                  {box.rows.filter((r) => r.type === 'cut_flower').length} | گلدان:{' '}
                  {box.rows.filter((r) => r.type === 'pot').length}
                </Text>
              </div>
            </>
          )}
        </Card>
      ))}

      {boxes.length === 0 && (
        <Card style={{ textAlign: 'center', padding: 40 }}>
          <GiftOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />
          <Title level={4} style={{ color: '#999', marginTop: 16 }}>
            هنوز جعبه‌ای ساخته نشده
          </Title>
          <Text style={{ color: '#999' }}>روی «افزودن جعبه جدید» کلیک کنید</Text>
        </Card>
      )}

      {/* Products loading indicator on empty rows */}
      {productsLoading && boxes.length > 0 && (
        <div style={{ textAlign: 'center', marginTop: 12 }}>
          <Spin size="small" /> <Text type="secondary">در حال دریافت محصولات...</Text>
        </div>
      )}
      {!productsLoading && products.length === 0 && boxes.length > 0 && (
        <div style={{ textAlign: 'center', marginTop: 12 }}>
          <Empty description="محصولی یافت نشد" />
        </div>
      )}

      <style jsx>{`
        .box-card {
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
          border-radius: 8px;
        }

        .box-card .ant-card-head {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .box-card .ant-card-head-title {
          color: white;
        }

        .ant-form-item-label > label {
          font-weight: 600;
        }
      `}</style>
    </div>
  );
};

export default ManualOrderPanel;
