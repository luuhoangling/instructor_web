import React, { useState, useEffect } from 'react';
import {
  Form,
  Input,
  Button,
  Space,
  Card,
  Select,
  InputNumber,
  message,
  Divider,
  Row,
  Col
} from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { createQuiz, updateQuiz, getQuestions, updateQuestion, deleteQuestion } from '../../services/api';

const { TextArea } = Input;
const { Option } = Select;

const QuizForm = ({ lessonId, quiz, onSuccess, onCancel }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState([]);

  const isEditing = !!quiz;

  useEffect(() => {
    if (quiz) {
      form.setFieldsValue({
        title: quiz.title,
        description: quiz.description
      });
      // Fetch questions for the quiz from API
      const fetchQuestions = async () => {
        try {
          console.debug('Fetching questions for quiz', quiz.id);
          const res = await getQuestions(quiz.id, { _limit: 100 });
          setQuestions(res.data || []);
          console.debug('Fetched questions:', res.data);
        } catch (err) {
          console.error('Error fetching questions:', err);
          setQuestions([]);
        }
      };
      fetchQuestions();
    } else {
      // Initialize with one empty question
      setQuestions([{
        question_text: '',
        options: ['', '', '', ''],
        correct_option: 0,
        explanation: '',
        order_index: 1
      }]);
    }
  }, [quiz, form]);

  const handleSubmit = async (values) => {
    // Cho phép cập nhật quiz không cần câu hỏi khi chỉnh sửa
    if (!isEditing && questions.length === 0) {
      message.error('Vui lòng thêm ít nhất một câu hỏi');
      return;
    }

    const invalidQuestions = questions.filter(q =>
      !q.question_text.trim() ||
      q.options.some(opt => !opt.trim()) ||
      q.correct_option < 0 ||
      q.correct_option >= q.options.length
    );
    if (!isEditing && invalidQuestions.length > 0) {
      message.error('Vui lòng điền đầy đủ thông tin cho tất cả câu hỏi');
      return;
    }

    setLoading(true);
    try {
      const quizData = {
        ...values,
        lesson_id: lessonId,
        questions: questions.map((q, index) => ({
          ...q,
          order_index: index + 1
        }))
      };

      console.debug('QUIZ DATA TO SAVE:', quizData);
      if (isEditing) {
        await updateQuiz(quiz.id, quizData);
        message.success('Cập nhật quiz thành công');
      } else {
        await createQuiz(lessonId, quizData);
        message.success('Tạo quiz thành công');
      }
      onSuccess();
    } catch (error) {
      console.error('Failed to save quiz:', error);
      message.error('Không thể lưu quiz: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const addQuestion = () => {
    setQuestions([...questions, {
      question_text: '',
      options: ['', '', '', ''],
      correct_option: 0,
      explanation: '',
      order_index: questions.length + 1
    }]);
  };

  const removeQuestion = (index) => {
    const newQuestions = questions.filter((_, i) => i !== index);
    setQuestions(newQuestions.map((q, i) => ({ ...q, order_index: i + 1 })));
  };

  const updateQuestion = (index, field, value) => {
    const newQuestions = [...questions];
    if (field === 'options') {
      newQuestions[index].options = value;
    } else {
      newQuestions[index][field] = value;
    }
    setQuestions(newQuestions);
  };

  const updateOption = (questionIndex, optionIndex, value) => {
    const newQuestions = [...questions];
    newQuestions[questionIndex].options[optionIndex] = value;
    setQuestions(newQuestions);
  };

  // Xóa câu hỏi qua API hoặc local nếu chưa có id
  const handleDeleteQuestion = async (questionIndex) => {
    const question = questions[questionIndex];
    if (!question.id) {
      // Nếu là câu hỏi mới chưa lưu, chỉ xóa local
      removeQuestion(questionIndex);
      return;
    }
    setLoading(true);
    try {
      await deleteQuestion(question.id);
      removeQuestion(questionIndex);
      message.success('Đã xóa câu hỏi');
    } catch (error) {
      message.error('Không thể xóa câu hỏi: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
    >
      <Form.Item
        name="title"
        label="Tiêu đề quiz"
        rules={[
          { required: true, message: 'Vui lòng nhập tiêu đề quiz' },
          { max: 200, message: 'Tiêu đề không được quá 200 ký tự' }
        ]}
      >
        <Input placeholder="Ví dụ: Kiểm tra kiến thức Flutter cơ bản" />
      </Form.Item>

      <Form.Item
        name="description"
        label="Mô tả quiz"
        rules={[
          { max: 500, message: 'Mô tả không được quá 500 ký tự' }
        ]}
      >
        <TextArea
          rows={2}
          placeholder="Mô tả ngắn gọn về quiz này..."
        />
      </Form.Item>

      <Divider orientation="left">
        Câu hỏi ({questions.length})
      </Divider>

      {questions.map((question, questionIndex) => (
        <Card
          key={questionIndex}
          title={`Câu hỏi ${questionIndex + 1}`}
          style={{ marginBottom: 16 }}
        >
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteQuestion(questionIndex)}
            loading={loading}
            style={{ float: 'right', marginBottom: 8 }}
          >
            Xóa câu hỏi
          </Button>

          <Form.Item
            label="Nội dung câu hỏi"
            required
          >
            <Input
              value={question.question_text}
              onChange={(e) => updateQuestion(questionIndex, 'question_text', e.target.value)}
              placeholder="Nhập nội dung câu hỏi..."
            />
          </Form.Item>

          <Form.Item label="Các lựa chọn" required>
            {question.options.map((option, optionIndex) => (
              <Row key={optionIndex} gutter={8} style={{ marginBottom: 8 }}>
                <Col span={20}>
                  <Input
                    value={option}
                    onChange={(e) => updateOption(questionIndex, optionIndex, e.target.value)}
                    placeholder={`Lựa chọn ${String.fromCharCode(65 + optionIndex)}`}
                  />
                </Col>
                <Col span={4}>
                  {question.correct_option === optionIndex && (
                    <Button type="primary" size="small" style={{ width: '100%' }}>
                      Đúng
                    </Button>
                  )}
                </Col>
              </Row>
            ))}
          </Form.Item>

          <Form.Item label="Đáp án đúng" required>
            <Select
              value={question.correct_option}
              onChange={(value) => updateQuestion(questionIndex, 'correct_option', value)}
              style={{ width: '100%' }}
            >
              {question.options.map((option, index) => (
                <Option key={index} value={index}>
                  {String.fromCharCode(65 + index)}: {option || `Lựa chọn ${index + 1}`}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label="Giải thích (tùy chọn)">
            <TextArea
              value={question.explanation}
              onChange={(e) => updateQuestion(questionIndex, 'explanation', e.target.value)}
              rows={2}
              placeholder="Giải thích tại sao đây là đáp án đúng..."
            />
          </Form.Item>
        </Card>
      ))}

      <Button
        type="dashed"
        icon={<PlusOutlined />}
        onClick={addQuestion}
        style={{ width: '100%', marginBottom: 16 }}
      >
        Thêm câu hỏi
      </Button>

      <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
        <Space>
          <Button onClick={onCancel}>
            Hủy
          </Button>
          <Button type="primary" htmlType="submit" loading={loading}>
            {isEditing ? 'Cập nhật' : 'Tạo mới'}
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );
};

export default QuizForm;
