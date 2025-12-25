import React from "react";
import { Button } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

const BackButton = ({ to, children, style, className }) => {
  const navigate = useNavigate();
  const handleClick = () => {
    if (to) navigate(to);
    else navigate(-1);
  };

  return (
    <Button
      icon={<ArrowLeftOutlined />}
      onClick={handleClick}
      className={className}
      style={style}
    >
      {children || "بازگشت"}
    </Button>
  );
};

export default BackButton;


