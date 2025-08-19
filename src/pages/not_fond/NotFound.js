// src/pages/NotFound.js
import React from 'react';
import { Result, Button } from 'antd';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <Result
      status="404"
      title="404"
      subTitle="صفحه مورد نظر یافت نشد."

      extra={
        <Link to="/dashboard">
          <Button type="primary"> بازگشت به داشبورد </Button>
        </Link>
      }
    />
  );
};

export default NotFound;