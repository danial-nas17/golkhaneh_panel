import React, { useState } from "react";
import { Upload, Button, Card, message } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

const ProductImagesForm = ({ selectedColors }) => {
  const [uploadedImages, setUploadedImages] = useState({});
  const navigate = useNavigate();

  const handleUploadChange = (color, fileList) => {
    setUploadedImages((prev) => ({
      ...prev,
      [color]: fileList,
    }));
  };

  const handleSubmit = async () => {
    try {
      const formData = new FormData();
      Object.entries(uploadedImages).forEach(([color, fileList]) => {
        fileList.forEach((file) => {
          formData.append(`${color}[]`, file.originFileObj);
        });
      });

      // Replace with your API endpoint
      const response = await fetch("{{URL}}/{{Prefix}}/panel/upload-images", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Image upload failed");
      }

      message.success("Images uploaded successfully!");
      navigate("/products"); // Redirect to product list or next step
    } catch (error) {
      console.error(error);
      message.error("Failed to upload images.");
    }
  };

  return (
    <Card title="Upload Images for Colors">
      {selectedColors.map((color) => (
        <div key={color.id} className="mb-4">
          <h3>{color.name}</h3>
          <Upload
            listType="picture-card"
            multiple
            fileList={uploadedImages[color.name] || []}
            onChange={({ fileList }) => handleUploadChange(color.name, fileList)}
            beforeUpload={() => false} // Prevent auto-upload
          >
            <div>
              <PlusOutlined />
              <div style={{ marginTop: 8 }}>Upload</div>
            </div>
          </Upload>
        </div>
      ))}
      <Button type="primary" onClick={handleSubmit} disabled={!Object.keys(uploadedImages).length}>
        Submit
      </Button>
    </Card>
  );
};

export default ProductImagesForm;
