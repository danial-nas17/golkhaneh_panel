import React, { useEffect, useState } from "react";
import { Select, Button, Table, InputNumber, Tag, message } from "antd";
import axios from "axios";
import api from "../../../api";

const ProductAttributesForm = () => {
  const [attributes, setAttributes] = useState([]);
  const [selectedAttributes, setSelectedAttributes] = useState([]);
  const [combinations, setCombinations] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchAttributes = async () => {
      try {
        setLoading(true);
        const response = await api.get("/panel/attribute?includes[]=values");
        setAttributes(response.data.data);
      } catch (error) {
        message.error("Error fetching attributes");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchAttributes();
  }, []);

  const handleAttributeChange = (attributeId, values) => {
    setSelectedAttributes((prev) => {
      const existing = prev.find((attr) => attr.id === attributeId);
      if (existing) {
        existing.values = values;
        return [...prev];
      }
      const attribute = attributes.find((attr) => attr.id === attributeId);
      return [...prev, { ...attribute, values }];
    });
  };

  const removeAttribute = (attributeId) => {
    setSelectedAttributes((prev) => prev.filter((attr) => attr.id !== attributeId));
  };

  const generateCombinations = () => {
    const attributeValues = selectedAttributes.map((attr) => attr.values);
    const allCombinations = attributeValues.reduce(
      (acc, values) => acc.flatMap((combo) => values.map((val) => [...combo, val])),
      [[]]
    );
    setCombinations(
      allCombinations.map((combo, index) => ({
        key: index,
        combination: combo.map((id) => {
          const attr = selectedAttributes.find((attr) => attr.values.includes(id));
          const value = attr.values.find((val) => val === id);
          return `${attr.key}: ${attributes
            .find((a) => a.id === attr.id)
            ?.values.find((v) => v.id === value)?.value}`;
        }),
        price: 0,
        stock: 0,
        discount: 0,
      }))
    );
  };

  const updateCombination = (key, field, value) => {
    setCombinations((prev) =>
      prev.map((combo) => (combo.key === key ? { ...combo, [field]: value } : combo))
    );
  };

  const handleSubmit = () => {
    const payload = {
      attributes: selectedAttributes.map((attr) => ({
        id: attr.id,
        values: attr.values,
      })),
      combinations,
    };
    console.log("Payload:", payload);
    message.success("Attributes and combinations prepared for submission!");
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Product Attributes</h1>

      {loading ? (
        <p>Loading attributes...</p>
      ) : (
        <>
          <div className="mb-6">
            {attributes.map((attribute) => (
              <div key={attribute.id} className="mb-4">
                <label className="font-semibold">{attribute.key}</label>
                <Select
                  mode="multiple"
                  placeholder={`Select values for ${attribute.key}`}
                  options={attribute.values.map((value) => ({
                    label: value.value,
                    value: value.id,
                  }))}
                  onChange={(values) => handleAttributeChange(attribute.id, values)}
                  style={{ width: "100%" }}
                />
                <Button
                  type="danger"
                  className="mt-2"
                  onClick={() => removeAttribute(attribute.id)}
                >
                  Remove Attribute
                </Button>
              </div>
            ))}
          </div>

          <Button
            type="primary"
            className="mb-6"
            onClick={generateCombinations}
            disabled={selectedAttributes.length === 0}
          >
            Generate Combinations
          </Button>

          <Table
            columns={[
              {
                title: "Combination",
                dataIndex: "combination",
                key: "combination",
                render: (combo) => (
                  <div className="flex flex-wrap gap-2">
                    {combo.map((item, index) => (
                      <Tag color="blue" key={index}>
                        {item}
                      </Tag>
                    ))}
                  </div>
                ),
              },
              {
                title: "Price",
                dataIndex: "price",
                key: "price",
                render: (_, record) => (
                  <InputNumber
                    min={0}
                    value={record.price}
                    onChange={(value) => updateCombination(record.key, "price", value)}
                  />
                ),
              },
              {
                title: "Stock",
                dataIndex: "stock",
                key: "stock",
                render: (_, record) => (
                  <InputNumber
                    min={0}
                    value={record.stock}
                    onChange={(value) => updateCombination(record.key, "stock", value)}
                  />
                ),
              },
              {
                title: "Discount",
                dataIndex: "discount",
                key: "discount",
                render: (_, record) => (
                  <InputNumber
                    min={0}
                    value={record.discount}
                    onChange={(value) => updateCombination(record.key, "discount", value)}
                  />
                ),
              },
            ]}
            dataSource={combinations}
            rowKey="key"
            pagination={false}
          />

          <div className="mt-6">
            <Button type="primary" onClick={handleSubmit}>
              Submit Attributes
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default ProductAttributesForm;
