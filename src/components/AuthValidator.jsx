import React, { useEffect, useState } from "react";
import { Spin } from "antd";
import api from "../api";

// Validates token by requesting current user info. On 401, global interceptor logs out.
const AuthValidator = ({ children }) => {
  const [validating, setValidating] = useState(true);

  useEffect(() => {
    let mounted = true;
    const token = localStorage.getItem("token");
    if (!token) {
      // No token; let existing routing redirect to /login
      setValidating(false);
      return;
    }
    (async () => {
      try {
        // Any 401 here will trigger api interceptor -> logout + redirect
        await api.get("/panel/user/info");
      } catch (e) {
        // Interceptor handles redirect; just stop validating
      } finally {
        if (mounted) setValidating(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  if (validating) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
        <Spin size="large" />
      </div>
    );
  }

  return children;
};

export default AuthValidator;



