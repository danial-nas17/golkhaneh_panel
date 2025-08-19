// import React from 'react';

// const Content = () => {
//   return (
//     <div>
//       <h2>Content Management</h2>
//       {/* Add form or content for managing the main content */}
//     </div>
//   );
// };

// export default Content;

// src/components/BlogGenerator.jsx
import React, { useState } from 'react';
import { 
  Card, 
  Input, 
  Button, 
  Typography, 
  Space, 
  Alert, 
  Divider,
  Spin
} from 'antd';
import { RobotOutlined, EditOutlined } from '@ant-design/icons';
import { useGemini } from '../../../components/useGemini';

const { Title, Paragraph } = Typography;
const { TextArea } = Input;

const Content = () => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');
  const { generateContent, loading, error } = useGemini();

  const handleGenerate = async () => {
    const prompt = `Write a blog post with the following title: ${title}
                   Additional context: ${content}
                   Please provide a well-structured blog post with:
                   1. Introduction
                   2. Main content with subheadings
                   3. Conclusion`;

    const result = await generateContent(prompt);
    if (result) {
      setGeneratedContent(result);
    }
  };

  return (
    <div className="p-4">
      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Space align="center">
            <RobotOutlined style={{ fontSize: '24px' }} />
            <Title level={2} style={{ margin: 0 }}>AI Blog Generator</Title>
          </Space>

          <Card
            bordered={false}
            className="site-card-border-less-wrapper"
            style={{ background: '#f5f5f5' }}
          >
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <div>
                <Typography.Text strong>Blog Title</Typography.Text>
                <Input
                  size="large"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter blog title"
                  prefix={<EditOutlined />}
                  allowClear
                />
              </div>

              <div>
                <Typography.Text strong>Additional Context</Typography.Text>
                <TextArea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Enter any additional context or keywords"
                  autoSize={{ minRows: 4, maxRows: 8 }}
                  allowClear
                />
              </div>

              <Button
                type="primary"
                size="large"
                onClick={handleGenerate}
                disabled={loading}
                icon={<RobotOutlined />}
                block
              >
                {loading ? 'Generating...' : 'Generate Blog'}
              </Button>
            </Space>
          </Card>

          {error && (
            <Alert
              message="Error"
              description={error}
              type="error"
              showIcon
              closable
            />
          )}

          {loading && (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <Spin size="large" tip="Generating content..." />
            </div>
          )}

          {generatedContent && (
            <Card
              title={
                <Space>
                  <EditOutlined />
                  <span>Generated Content</span>
                </Space>
              }
              bordered={false}
              style={{ background: '#fff' }}
            >
              <Typography>
                {generatedContent.split('\n').map((line, index) => (
                  <React.Fragment key={index}>
                    {line.startsWith('#') || line.length === 0 ? (
                      <Title level={4}>{line.replace(/#/g, '')}</Title>
                    ) : (
                      <Paragraph>{line}</Paragraph>
                    )}
                    {line.length === 0 && <Divider />}
                  </React.Fragment>
                ))}
              </Typography>
            </Card>
          )}
        </Space>
      </Card>
    </div>
  );
};

export default Content;