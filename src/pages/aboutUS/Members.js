import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import { Button, Card, Image, message, Space, Table } from "antd";
import axios from "axios";
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

function Members() {
  const [memebers, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() =>{
    fetchMembers();
  } , []);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const response = await axios.get("api/members");
      console.log(response.data);
      setMembers(response.data);
    } catch (error) {
      message.error("Failed to fetch");
    }
  };

  const handleDelete = async (id) =>{
    try{
        await axios.delete(`api/delete/${id}`)
    }
    catch(error){
        message.error("faild to delete")
    }
  }

  const columns = [
    {
        title: 'id',
        dataIndex: 'id',
        key: 'id',
      },
    
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
        title: 'Image',
        dataIndex: 'image',
        key: 'image',
        render: (image) => (
          <Image
            src={image}
            alt="Product"
            width={50}
            height={50}
          />
        ),
      },
      {
        title: 'Actions',
        key: 'actions',
        render: (text, record) => (
          <Space size="middle">
            <Link to={`/products/edit/${record.id}`}>
              <Button icon={<EditOutlined />}>Edit</Button>
            </Link>
            <Button icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)} danger>
              Delete
            </Button>
          </Space>
        ),
      }
  ]

  return (
    <Card>
        <h2>Members</h2>
        <Link to={"/members/add"}>
            <Button type="primary" >
                Add Members
            </Button>
        </Link>

        <Table
        dataSource={memebers}
        columns={columns}
        
        />
    </Card>
  );
}

export default Members;
