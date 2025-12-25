import React from "react";
import { Result, Button } from "antd";
import { usePermissions } from "../hook/usePermissions";

const RequirePermission = ({ permission, children }) => {
  const { hasPermission } = usePermissions();

  if (!permission) return children;
  if (hasPermission(permission)) return children;

  return (
    <Result
      status="403"
      title="403"
      subTitle="شما مجوز دسترسی به این بخش را ندارید."
      extra={<Button type="primary" onClick={() => window.history.back()}>بازگشت</Button>}
    />
  );
};

export default RequirePermission;



