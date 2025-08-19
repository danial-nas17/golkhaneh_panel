import React, { useState } from "react";
import { Upload, Card, Pagination, Button, message } from "antd";
import { UploadOutlined, DeleteOutlined } from "@ant-design/icons";

const { Dragger } = Upload;

const MediaGallery = () => {
  const [fileList, setFileList] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6; 

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleRemove = (file) => {
    setFileList(fileList.filter((item) => item.uid !== file.uid));
    message.success("تصویر حذف شد!");
  };

  const uploadProps = {
    name: "file",
    multiple: true,
    showUploadList: false,
    beforeUpload: (file) => {
      const isImage = file.type.startsWith("image/");
      if (!isImage) {
        message.error("فقط تصاویر قابل آپلود هستند!");
        return false;
      }
      setFileList([...fileList, file]);
      return false; 
    },
  };

  const paginatedData = fileList.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="p-4">
      <Dragger {...uploadProps} className="mb-4">
        <p className="ant-upload-drag-icon">
          <UploadOutlined />
        </p>
        <p>فایل‌های خود را اینجا بکشید یا کلیک کنید</p>
      </Dragger>

      <div className="grid grid-cols-3 gap-4 mt-5">
        {paginatedData.map((file) => (
          <Card
            key={file.uid}
            cover={<img src={URL.createObjectURL(file)} alt={file.name} className="h-40 w-1/2 object-cover" />}
            actions={[
              <Button
                type="text"
                icon={<DeleteOutlined />}
                danger
                onClick={() => handleRemove(file)}
              />,
            ]}
          >
            <Card.Meta title={file.name} />
          </Card>
        ))}
      </div>

      {fileList.length > pageSize && (
        <Pagination
          className="mt-4 text-center"
          current={currentPage}
          total={fileList.length}
          pageSize={pageSize}
          onChange={handlePageChange}
        />
      )}
    </div>
  );
};

export default MediaGallery;
