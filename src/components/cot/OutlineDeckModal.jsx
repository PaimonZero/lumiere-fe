import React, { useState, useEffect } from 'react';
import { Modal, Input, Button, Card, Space, Popconfirm, Typography, Divider, Alert } from 'antd';
import { ArrowUp, ArrowDown, Trash2, Plus, Layout } from 'lucide-react';

const { TextArea } = Input;
const { Title, Text } = Typography;

export default function OutlineDeckModal({ open, outlineData, onConfirm, onCancel, loading }) {
  const [deckTitle, setDeckTitle] = useState("");
  const [slides, setSlides] = useState([]);
  const isFallback = outlineData?.fallback === true;

  useEffect(() => {
    if (outlineData && open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDeckTitle(outlineData.deck_title || "");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSlides(outlineData.slides || []);
    }
  }, [outlineData, open]);

  const handleSlideChange = (index, field, value) => {
    const newSlides = [...slides];
    newSlides[index] = { ...newSlides[index], [field]: value };
    setSlides(newSlides);
  };

  const moveSlide = (index, direction) => {
    if ((direction === -1 && index === 0) || (direction === 1 && index === slides.length - 1)) return;
    const newSlides = [...slides];
    const temp = newSlides[index];
    newSlides[index] = newSlides[index + direction];
    newSlides[index + direction] = temp;
    setSlides(newSlides);
  };

  const removeSlide = (index) => {
    const newSlides = [...slides];
    newSlides.splice(index, 1);
    setSlides(newSlides);
  };

  const addSlide = () => {
    setSlides([
      ...slides,
      {
        kind: "content",
        layout_id: "statement",
        title: "Slide mới",
        body: "",
        key_points: [],
        needs_image: false
      }
    ]);
  };

  const handleConfirm = () => {
    onConfirm({
      deck_title: deckTitle,
      slides: slides
    });
  };

  return (
    <Modal
      title="Duyệt Outline & Chỉnh sửa"
      open={open}
      onCancel={onCancel}
      onOk={handleConfirm}
      confirmLoading={loading}
      okText="Xác nhận & Tạo Slide"
      cancelText="Hủy"
      width={900}
      centered
      maskClosable={false}
      styles={{ body: { maxHeight: '70vh', overflowY: 'auto', padding: '16px' } }}
    >
      {isFallback && (
        <Alert
          message="Outline tạm thời (LLM thất bại)"
          description="Tất cả AI providers đều không phản hồi. Nội dung bên dưới là mẫu — bạn cần chỉnh sửa tiêu đề, nội dung và ý chính cho từng slide trước khi xác nhận."
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}
      <div className="mb-6">
        <Text strong>Tiêu đề bài giảng:</Text>
        <Input 
          size="large" 
          value={deckTitle} 
          onChange={(e) => setDeckTitle(e.target.value)} 
          className="mt-2 text-lg font-semibold"
        />
      </div>
      
      <Divider orientation="left">Danh sách Slide ({slides.length})</Divider>
      
      <div className="flex flex-col gap-4">
        {slides.map((slide, idx) => (
          <Card 
            key={idx} 
            size="small" 
            title={
              <Space>
                <span className="text-gray-500 font-mono">{idx + 1}.</span>
                <Layout size={14} className="text-blue-500" />
                <span className="text-xs uppercase font-semibold text-blue-600">{slide.kind === "quiz" ? "QUIZ" : slide.layout_id}</span>
              </Space>
            }
            extra={
              <Space>
                <Button size="small" icon={<ArrowUp size={14} />} onClick={() => moveSlide(idx, -1)} disabled={idx === 0} />
                <Button size="small" icon={<ArrowDown size={14} />} onClick={() => moveSlide(idx, 1)} disabled={idx === slides.length - 1} />
                <Popconfirm title="Xóa slide này?" onConfirm={() => removeSlide(idx)}>
                  <Button size="small" danger icon={<Trash2 size={14} />} />
                </Popconfirm>
              </Space>
            }
          >
            {slide.kind === "quiz" ? (
              <div className="flex flex-col gap-3">
                <div>
                  <Text type="secondary" className="text-xs">Câu hỏi:</Text>
                  <TextArea 
                    autoSize={{ minRows: 2 }} 
                    value={slide.quiz?.question || ""}
                    onChange={(e) => {
                      const newQuiz = { ...slide.quiz, question: e.target.value };
                      handleSlideChange(idx, 'quiz', newQuiz);
                    }}
                  />
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <div>
                  <Text type="secondary" className="text-xs">Tiêu đề:</Text>
                  <Input 
                    value={slide.title || ""} 
                    onChange={(e) => handleSlideChange(idx, 'title', e.target.value)} 
                    className="font-medium"
                  />
                </div>
                <div>
                  <Text type="secondary" className="text-xs">Nội dung giải thích (body):</Text>
                  <TextArea 
                    autoSize={{ minRows: 2 }} 
                    value={slide.body || ""} 
                    onChange={(e) => handleSlideChange(idx, 'body', e.target.value)} 
                  />
                </div>
                <div>
                  <Text type="secondary" className="text-xs">Ý chính (key_points):</Text>
                  <TextArea 
                    autoSize={{ minRows: 2 }} 
                    value={(slide.key_points || []).join('\n')} 
                    onChange={(e) => {
                      const points = e.target.value.split('\n');
                      handleSlideChange(idx, 'key_points', points);
                    }}
                    placeholder="Mỗi dòng là một ý chính"
                  />
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>
      
      <Button 
        type="dashed" 
        block 
        icon={<Plus size={16} />} 
        onClick={addSlide}
        className="mt-4 h-10"
      >
        Thêm Slide Mới
      </Button>
    </Modal>
  );
}
