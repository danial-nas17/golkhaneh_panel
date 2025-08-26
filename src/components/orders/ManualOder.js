import React, { useState } from 'react';
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
} from 'antd';
import {
  PlusOutlined,
  MinusOutlined,
  SaveOutlined,
  DeleteOutlined,
  ShoppingCartOutlined,
  GiftOutlined,
  SendOutlined,
} from '@ant-design/icons';
import axios from 'axios';

const { Title, Text } = Typography;
const { Option } = Select;

const ManualOrderPanel = () => {
  const [boxes, setBoxes] = useState([]);
  const [loading, setLoading] = useState({});

  const api = axios.create({
    baseURL: 'https://api.healfit.ae/api/v2',
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    },
  });

  // Add new box
  const addNewBox = () => {
    const newBox = {
      id: Date.now(), // temporary ID for local state
      name: `Box ${boxes.length + 1}`,
      rows: [],
      status: 'draft' // draft, saved
    };
    setBoxes([...boxes, newBox]);
    message.success('New box added');
  };

  // Remove box
  const removeBox = (boxId) => {
    setBoxes(boxes.filter(box => box.id !== boxId));
    message.success('Box removed');
  };

  // Add row to specific box
  const addRowToBox = (boxId) => {
    setBoxes(boxes.map(box => {
      if (box.id === boxId) {
        const newRow = {
          id: Date.now() + Math.random(), // temporary ID
          type: '', // 'cut_flower' or 'pot'
          // For cut flowers
          stem_count: 1,
          flower_count: 1,
          // For pots
          pot_serial: '',
          pot_count: 1
        };
        return {
          ...box,
          rows: [...box.rows, newRow]
        };
      }
      return box;
    }));
  };

  // Remove row from box
  const removeRowFromBox = (boxId, rowId) => {
    setBoxes(boxes.map(box => {
      if (box.id === boxId) {
        return {
          ...box,
          rows: box.rows.filter(row => row.id !== rowId)
        };
      }
      return box;
    }));
  };

  // Update row data
  const updateRowData = (boxId, rowId, field, value) => {
    setBoxes(boxes.map(box => {
      if (box.id === boxId) {
        return {
          ...box,
          rows: box.rows.map(row => {
            if (row.id === rowId) {
              return { ...row, [field]: value };
            }
            return row;
          })
        };
      }
      return box;
    }));
  };

  // Update box name
  const updateBoxName = (boxId, name) => {
    setBoxes(boxes.map(box => {
      if (box.id === boxId) {
        return { ...box, name };
      }
      return box;
    }));
  };

  // Save box data to backend
  const saveBoxData = async (boxId) => {
    const box = boxes.find(b => b.id === boxId);
    if (!box || box.rows.length === 0) {
      message.warning('Please add at least one row to the box');
      return;
    }

    // Validate rows
    const invalidRows = box.rows.filter(row => {
      if (!row.type) return true;
      if (row.type === 'pot' && (!row.pot_serial || row.pot_count < 1)) return true;
      if (row.type === 'cut_flower' && (row.stem_count < 1 || row.flower_count < 1)) return true;
      return false;
    });

    if (invalidRows.length > 0) {
      message.error('Please fill all required fields for each row');
      return;
    }

    try {
      setLoading(prev => ({ ...prev, [boxId]: true }));
      
      const payload = {
        name: box.name,
        rows: box.rows.map(row => ({
          type: row.type,
          ...(row.type === 'cut_flower' ? {
            stem_count: row.stem_count,
            flower_count: row.flower_count
          } : {
            pot_serial: row.pot_serial,
            pot_count: row.pot_count
          })
        }))
      };

      await api.post('/admin/manual-order/box/', payload);
      
      // Update box status to saved
      setBoxes(boxes.map(b => {
        if (b.id === boxId) {
          return { ...b, status: 'saved' };
        }
        return b;
      }));
      
      message.success(`${box.name} saved successfully`);
    } catch (error) {
      message.error('Failed to save box data');
      console.error('Error saving box:', error);
    } finally {
      setLoading(prev => ({ ...prev, [boxId]: false }));
    }
  };

  const renderRowFields = (box, row) => {
    if (!row.type) {
      return (
        <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
          Please select a type first
        </div>
      );
    }

    if (row.type === 'cut_flower') {
      return (
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="Number of Stems">
              <InputNumber
                min={1}
                value={row.stem_count}
                onChange={(value) => updateRowData(box.id, row.id, 'stem_count', value)}
                placeholder="Enter stem count"
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Number of Flowers">
              <InputNumber
                min={1}
                value={row.flower_count}
                onChange={(value) => updateRowData(box.id, row.id, 'flower_count', value)}
                placeholder="Enter flower count"
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Col>
        </Row>
      );
    }

    if (row.type === 'pot') {
      return (
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="Pot Serial">
              <Input
                value={row.pot_serial}
                onChange={(e) => updateRowData(box.id, row.id, 'pot_serial', e.target.value)}
                placeholder="Enter pot serial number"
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Number of Pots">
              <InputNumber
                min={1}
                value={row.pot_count}
                onChange={(value) => updateRowData(box.id, row.id, 'pot_count', value)}
                placeholder="Enter pot count"
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Col>
        </Row>
      );
    }
  };

  const getRowSummary = (row) => {
    if (row.type === 'cut_flower') {
      return `${row.stem_count} stems, ${row.flower_count} flowers`;
    }
    if (row.type === 'pot') {
      return `${row.pot_count} pots (Serial: ${row.pot_serial || 'Not set'})`;
    }
    return 'Not configured';
  };

  return (
    <div style={{ padding: '24px', backgroundColor: '#f5f7fa', minHeight: '100vh' }}>
      <Card 
        title={
          <Space>
            <ShoppingCartOutlined />
            <Title level={3} style={{ margin: 0 }}>Manual Order Panel</Title>
          </Space>
        }
        bordered={false}
        style={{ marginBottom: 24 }}
      >
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={addNewBox}
          size="large"
        >
          Add New Box
        </Button>
      </Card>

      {boxes.map((box, boxIndex) => (
        <Card
          key={box.id}
          className="box-card"
          style={{ marginBottom: 24 }}
          title={
            <Space>
              <GiftOutlined />
              <Input
                value={box.name}
                onChange={(e) => updateBoxName(box.id, e.target.value)}
                style={{ width: 200 }}
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
                loading={loading[box.id]}
              >
                Save Box
              </Button>
              <Popconfirm
                title="Are you sure you want to delete this box?"
                onConfirm={() => removeBox(box.id)}
                okText="Yes"
                cancelText="No"
              >
                <Button 
                  danger 
                  icon={<DeleteOutlined />}
                >
                  Delete Box
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
                <Space>
                  <Badge count={rowIndex + 1} style={{ backgroundColor: '#52c41a' }} />
                  <Text strong>Row {rowIndex + 1}</Text>
                  {row.type && (
                    <Text type="secondary" style={{ fontSize: '12px' }}>
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
                  Remove Row
                </Button>
              }
            >
              <Row gutter={16} style={{ marginBottom: 16 }}>
                <Col span={24}>
                  <Form.Item label="Product Type">
                    <Select
                      value={row.type}
                      onChange={(value) => updateRowData(box.id, row.id, 'type', value)}
                      placeholder="Select product type"
                      style={{ width: '100%' }}
                    >
                      <Option value="cut_flower">Cut Flower (گل شاخه بریده)</Option>
                      <Option value="pot">Pot (گلدان)</Option>
                    </Select>
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
            Add Row to {box.name}
          </Button>

          {box.rows.length > 0 && (
            <>
              <Divider />
              <div style={{ textAlign: 'center' }}>
                <Text type="secondary">
                  Total Rows: {box.rows.length} | 
                  Cut Flowers: {box.rows.filter(r => r.type === 'cut_flower').length} | 
                  Pots: {box.rows.filter(r => r.type === 'pot').length}
                </Text>
              </div>
            </>
          )}
        </Card>
      ))}

      {boxes.length === 0 && (
        <Card style={{ textAlign: 'center', padding: '40px' }}>
          <GiftOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />
          <Title level={4} style={{ color: '#999', marginTop: 16 }}>
            No boxes created yet
          </Title>
          <Text style={{ color: '#999' }}>
            Click "Add New Box" to create your first manual order box
          </Text>
        </Card>
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