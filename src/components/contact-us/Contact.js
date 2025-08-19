import { Card, Col, Form, Input, InputNumber, message, Row } from "antd";
import { useForm } from "antd/es/form/Form";
import axios from "axios";
import React, { useEffect, useState } from "react";
import api from "../../api";
import TextArea from "antd/es/input/TextArea";

function Contact() {
  const [loading, setloading] = useState(true);
  const [contacts, setContacts] = useState([]);
  const [form] = useForm();

  useEffect(() =>{
    fetchContact()
  } , []);


  const fetchContact = async () => {
    try {
      const response = await api.get("api/contact");
      form.setFieldValue(response.data);
    } catch (error) {
      message.error("failed to fetch data");
    }
  };

   const onFinish = async(values) =>{
    try{
        await api.post("api/contact" , values)
        message.success("data has been sent successfully")

    }
    catch(error){
        message.error("data doesnt sent")
    }
   }


  return (
    <Card>
      <Form form={form} onFinish={onFinish} layout="vertical">

      <Row gutter={24}>
            <Col span={12}>
          <Form.Item name="email" label="Email" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          </Col>
          <Col span={12}>
          <Form.Item name="phone_number" label="Phone Number" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          </Col>
          </Row>
          <Form.Item name="description" label=" Description" rules={[{ required: true }]}>
            <TextArea rows={4} />
          </Form.Item>

      </Form>
    </Card>
  );
}

export default Contact;
