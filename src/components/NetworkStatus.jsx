import React, { useState, useEffect } from 'react';
import { Alert, notification } from 'antd';
import { WifiOutlined, DisconnectOutlined } from '@ant-design/icons';

/**
 * Component to monitor network status and show notifications
 */
const NetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showAlert, setShowAlert] = useState(false);
  const notificationKey = 'network-status';

  useEffect(() => {
    // Set initial state
    setIsOnline(navigator.onLine);
    setShowAlert(!navigator.onLine);

    // Handle online event
    const handleOnline = () => {
      setIsOnline(true);
      setShowAlert(false);
      
      // Show success notification when connection is restored
      notification.success({
        key: notificationKey,
        message: 'اتصال اینترنت برقرار شد',
        description: 'اتصال اینترنت شما دوباره برقرار شده است.',
        duration: 3,
        placement: 'topRight',
        icon: <WifiOutlined style={{ color: '#52c41a' }} />,
      });
    };

    // Handle offline event
    const handleOffline = () => {
      setIsOnline(false);
      setShowAlert(true);
      
      // Show error notification when connection is lost
      notification.error({
        key: notificationKey,
        message: 'اتصال اینترنت قطع شده است',
        description: 'لطفاً اتصال اینترنت خود را بررسی کنید.',
        duration: 0, // Don't auto-close
        placement: 'topRight',
        icon: <DisconnectOutlined style={{ color: '#ff4d4f' }} />,
      });
    };

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Don't render anything if online
  if (isOnline) {
    return null;
  }

  // Show alert banner when offline
  return (
    <Alert
      message="اتصال اینترنت قطع شده است"
      description="لطفاً اتصال اینترنت خود را بررسی کنید. برخی عملکردها ممکن است در دسترس نباشند."
      type="error"
      icon={<DisconnectOutlined />}
      showIcon
      closable
      onClose={() => setShowAlert(false)}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        borderRadius: 0,
        direction: 'rtl',
        fontFamily: 'MyCustomFont, sans-serif',
      }}
      banner
    />
  );
};

export default NetworkStatus;





