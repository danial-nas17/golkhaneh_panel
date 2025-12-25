import React from "react";
import { Navigate } from "react-router-dom";
import { usePermissions } from "../hook/usePermissions";

// Define candidate routes with their required permission key
const CANDIDATES = [
  // If user can invoice but not package, send to invoices first
  { path: "/invoices", perm: "invoice" },
  // Packaging workspace
  { path: "/orders", perm: "packaging" },
  { path: "/dashboard", perm: "dashboard" },
  { path: "/products", perm: "product" },
  { path: "/customers", perm: "customer" },
  { path: "/users", perm: "users" },
  { path: "/roles", perm: "roles" },
];

const FirstAllowedRedirect = () => {
  const { hasPermission } = usePermissions();

  const target = CANDIDATES.find(c => !c.perm || hasPermission(c.perm));
  if (target) return <Navigate to={target.path} replace />;

  // No allowed routes: fall back to 404
  return <Navigate to="/404" replace />;
};

export default FirstAllowedRedirect;



