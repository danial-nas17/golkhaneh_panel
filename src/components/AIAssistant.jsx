import React, { useState } from 'react';
import { 
  FloatButton, 
  Drawer, 
  Card, 
  Input, 
  Button, 
  Typography, 
  Space, 
  Alert, 
  Divider,
  Spin,
  Select,
  message,
  Image,
  Row,
  Col
} from 'antd';
import { RobotOutlined, EditOutlined, BulbOutlined, PictureOutlined, CopyOutlined, DeleteOutlined } from '@ant-design/icons';
import { useGemini } from '../components/useGemini';

const { Title, Paragraph, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const useUnsplash = () => {
//   const UNSPLASH_ACCESS_KEY = process.env.REACT_APP_UNSPLASH_ACCESS_KEY;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const searchImages = async (query, count = 4) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${count}`,
        {
          headers: {
            'Authorization': `Client-ID FrCWtGSQGUMgOlGsff2uapUd01lU08K5VQBhrYG7d8M`
          }
        }
      );
      if (!response.ok) {
        throw new Error('Failed to fetch images');
      }
      const data = await response.json();
      return data.results.map(img => ({
        url: img.urls.regular,
        thumb: img.urls.thumb,
        alt: img.alt_description,
        photographer: img.user.name,
        photographerUrl: img.user.links.html
      }));
    } catch (err) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  };

  return { searchImages, loading, error };
};

const AIAssistant = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');
  const [contentType, setContentType] = useState('blog');
  const [images, setImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  
  const { generateContent, loading, error } = useGemini();
  const { searchImages, loading: imageLoading, error: imageError } = useUnsplash();

  const generatePrompt = () => {
    const prompts = {
      blog: `Write a blog post with the following title: ${title}
             Additional context: ${content}
             Please provide a well-structured blog post with:
             
             1. Introduction
             2. Main content with subheadings
             3. Conclusion`,
      
      seo: `Generate SEO optimization content for: ${title}
            Context: ${content}
            Please provide:
            1. Meta title (under 60 characters)
            2. Meta description (under 160 characters)
            3. Focus keywords
            4. SEO-optimized headings (H1, H2, H3)
            5. URL slug suggestion
            6. Image alt text suggestions`,
      
      product: `Create a product description for: ${title}
                Product details: ${content}
                Please provide:
                1. Short description (2-3 sentences)
                2. Detailed description
                3. Key features (bullet points)
                4. Technical specifications
                5. SEO-friendly product title`,
      
      social: `Create social media content for: ${title}
               Context: ${content}
               Please provide:
               1. Twitter post (280 characters)
               2. LinkedIn post
               3. Instagram caption with hashtags
               4. Facebook post
               5. Key hashtags to use`,
    };

    return prompts[contentType] || prompts.blog;
  };

  const handleGenerate = async () => {
    if (!title.trim()) {
      message.error('Please enter a title');
      return;
    }

    const prompt = generatePrompt();
    const result = await generateContent(prompt);
    if (result) {
      setGeneratedContent(result);
      message.success(`${contentType.charAt(0).toUpperCase() + contentType.slice(1)} content generated successfully!`);
    }
  };

  const handleGenerateImages = async () => {
    if (!title.trim()) {
      message.error('Please enter a title');
      return;
    }

    const fetchedImages = await searchImages(title);
    if (fetchedImages.length > 0) {
      setImages(fetchedImages);
      message.success('Images generated successfully!');
    } else {
      message.error('No images found');
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedContent);
    message.success('Content copied to clipboard!');
  };

  const handleReset = () => {
    setTitle('');
    setContent('');
    setGeneratedContent('');
    setImages([]);
    setSelectedImage(null);
    message.success('All content cleared!');
  };

  return (
    <>
      <FloatButton
        icon={<RobotOutlined />}
        type="primary"
        tooltip="AI Assistant"
        onClick={() => setIsDrawerOpen(true)}
        style={{ right: 24 }}
      />

      <Drawer
        title={
          <Space>
            <BulbOutlined />
            <span>AI Content Assistant</span>
          </Space>
        }
        placement="right"
        width={720}
        onClose={() => setIsDrawerOpen(false)}
        open={isDrawerOpen}
        extra={
          <Button onClick={handleReset} icon={<DeleteOutlined />} danger>
            Reset
          </Button>
        }
      >
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Card bordered={false} style={{ background: '#f5f5f5' }}>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <div>
                <Text strong>Content Type</Text>
                <Select
                  style={{ width: '100%' }}
                  value={contentType}
                  onChange={setContentType}
                  size="large"
                >
                  <Option value="blog">Blog Post</Option>
                  <Option value="seo">SEO Content</Option>
                  <Option value="product">Product Description</Option>
                  <Option value="social">Social Media Content</Option>
                </Select>
              </div>

              <div>
                <Text strong>Title</Text>
                <Input
                  size="large"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter title"
                  prefix={<EditOutlined />}
                  allowClear
                />
              </div>

              <div>
                <Text strong>Additional Context</Text>
                <TextArea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Enter any additional context or requirements"
                  autoSize={{ minRows: 4, maxRows: 8 }}
                  allowClear
                />
              </div>

              <Space style={{ width: '100%' }}>
                <Button
                  type="primary"
                  size="large"
                  onClick={handleGenerate}
                  disabled={loading}
                  icon={<RobotOutlined />}
                  style={{ flex: 1 }}
                >
                  {loading ? 'Generating...' : 'Generate Content'}
                </Button>
                <Button
                  type="default"
                  size="large"
                  onClick={handleGenerateImages}
                  disabled={imageLoading}
                  icon={<PictureOutlined />}
                >
                  Generate Images
                </Button>
              </Space>
            </Space>
          </Card>

          {(error || imageError) && (
            <Alert
              message="Error"
              description={error || imageError}
              type="error"
              showIcon
              closable
            />
          )}

          {(loading || imageLoading) && (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <Spin size="large" tip="Processing..." />
            </div>
          )}

          {images.length > 0 && (
            <Card title="Generated Images" bordered={false}>
              <Row gutter={[16, 16]}>
                {images.map((image, index) => (
                  <Col span={12} key={index}>
                    <Card
                      hoverable
                      cover={
                        <Image
                          src={image.thumb}
                          alt={image.alt}
                          style={{ height: 150, objectFit: 'cover' }}
                        />
                      }
                      onClick={() => setSelectedImage(image)}
                      className={selectedImage?.url === image.url ? 'selected-image' : ''}
                    >
                      <Card.Meta
                        title={`Photo by ${image.photographer}`}
                        description={
                          <a href={image.photographerUrl} target="_blank" rel="noopener noreferrer">
                            View on Unsplash
                          </a>
                        }
                      />
                    </Card>
                  </Col>
                ))}
              </Row>
            </Card>
          )}

          {generatedContent && (
            <Card
              title={
                <Space>
                  <EditOutlined />
                  <span>Generated Content</span>
                </Space>
              }
              extra={
                <Button type="primary" onClick={handleCopy} icon={<CopyOutlined />}>
                  Copy to Clipboard
                </Button>
              }
              bordered={false}
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
      </Drawer>

      <style jsx>{`
        .selected-image {
          border: 2px solid #1890ff;
        }
        .ant-card-hoverable:hover {
          transform: scale(1.02);
          transition: transform 0.2s ease;
        }
      `}</style>
    </>
  );
};

export default AIAssistant;