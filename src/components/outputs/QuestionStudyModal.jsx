import { useMemo, useState } from 'react';
import { Button, Modal, Progress, Segmented, Tag, Typography } from 'antd';
import { BookOpen, CheckCircle2, ChevronLeft, ChevronRight, Layers, ListChecks, RotateCcw, XCircle } from 'lucide-react';

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

function normalizeCorrectIndex(question) {
  const value = question?.correct_answer ?? question?.correctIndex ?? question?.correct_index ?? 0;
  if (Number.isInteger(value)) return value;
  const parsed = Number(value);
  if (Number.isInteger(parsed)) return parsed;
  const letterIndex = LETTERS.indexOf(String(value || '').trim().toUpperCase());
  return letterIndex >= 0 ? letterIndex : 0;
}

function normalizeOptions(question) {
  if (Array.isArray(question?.options)) return question.options;
  if (Array.isArray(question?.choices)) return question.choices.map((choice) => choice?.text || choice);
  return [];
}

function normalizeQuestion(question = {}) {
  return {
    ...question,
    question_text: question.question_text || question.question || question.prompt || '',
    options: normalizeOptions(question),
    correct_answer: normalizeCorrectIndex(question),
    explanation: question.explanation || question.rationale || '',
    bloom_level: question.bloom_level || question.bloomLevel || '',
  };
}

export default function QuestionStudyModal({ open, onClose, questions = [], initialIndex = 0, initialMode = 'mcq' }) {
  const normalizedQuestions = useMemo(() => questions.map(normalizeQuestion), [questions]);
  const [mode, setMode] = useState(initialMode);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [selected, setSelected] = useState(null);
  const [answered, setAnswered] = useState({});
  const [flashFlipped, setFlashFlipped] = useState(false);

  const q = normalizedQuestions[currentIndex];
  if (!q) return null;

  const correctIndex = q.correct_answer;
  const currentAnswered = answered[currentIndex];
  const score = Object.values(answered).filter((item) => item?.correct).length;
  const progress = normalizedQuestions.length ? Math.round(((currentIndex + 1) / normalizedQuestions.length) * 100) : 0;

  const resetQuestionState = () => {
    setSelected(null);
    setFlashFlipped(false);
  };

  const goTo = (nextIndex) => {
    const bounded = Math.max(0, Math.min(nextIndex, normalizedQuestions.length - 1));
    setCurrentIndex(bounded);
    resetQuestionState();
  };

  const chooseAnswer = (index) => {
    if (currentAnswered) return;
    const correct = index === correctIndex;
    setSelected(index);
    setAnswered((prev) => ({ ...prev, [currentIndex]: { selected: index, correct } }));
  };

  const resetPractice = () => {
    setAnswered({});
    setSelected(null);
    setFlashFlipped(false);
    setCurrentIndex(0);
  };

  const selectedIndex = currentAnswered?.selected ?? selected;

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={780}
      centered
      title={
        <div className="flex items-center justify-between gap-3">
          <span>Học bộ câu hỏi</span>
          {q.bloom_level && <Tag>{q.bloom_level}</Tag>}
        </div>
      }
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <Segmented
            value={mode}
            onChange={(value) => {
              setMode(value);
              resetQuestionState();
            }}
            options={[
              { label: 'Trắc nghiệm', value: 'mcq', icon: <ListChecks size={14} /> },
              { label: 'Flashcard', value: 'flashcard', icon: <Layers size={14} /> },
            ]}
          />
          <Button size="small" icon={<RotateCcw size={14} />} onClick={resetPractice}>
            Làm lại
          </Button>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <Typography.Text style={{ color: 'var(--color-text-muted)', fontSize: 12 }}>
              Câu {currentIndex + 1} / {normalizedQuestions.length}
            </Typography.Text>
            <Typography.Text style={{ color: 'var(--color-text-muted)', fontSize: 12 }}>
              Đúng {score}/{Object.keys(answered).length || 0}
            </Typography.Text>
          </div>
          <Progress percent={progress} showInfo={false} size="small" />
        </div>

        {mode === 'mcq' ? (
          <div className="space-y-4">
            <div
              className="rounded-xl border p-5"
              style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border)' }}
            >
              <Typography.Text strong style={{ color: 'var(--color-text-primary)', fontSize: 16, lineHeight: 1.5 }}>
                {q.question_text}
              </Typography.Text>
            </div>

            <div className="grid gap-2">
              {q.options.map((option, index) => {
                const isCorrect = index === correctIndex;
                const isSelected = selectedIndex === index;
                const reveal = Boolean(currentAnswered);
                const state = reveal && isCorrect ? 'correct' : reveal && isSelected ? 'wrong' : 'idle';
                return (
                  <button
                    key={`${option}-${index}`}
                    type="button"
                    onClick={() => chooseAnswer(index)}
                    className="flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left transition-colors"
                    style={{
                      background:
                        state === 'correct'
                          ? 'rgba(16,185,129,0.12)'
                          : state === 'wrong'
                            ? 'rgba(239,68,68,0.10)'
                            : 'var(--color-bg-card)',
                      borderColor:
                        state === 'correct'
                          ? '#10b981'
                          : state === 'wrong'
                            ? '#ef4444'
                            : 'var(--color-border)',
                      color: 'var(--color-text-primary)',
                      cursor: reveal ? 'default' : 'pointer',
                    }}
                    disabled={reveal}
                  >
                    <span
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                      style={{
                        background:
                          state === 'correct'
                            ? '#10b981'
                            : state === 'wrong'
                              ? '#ef4444'
                              : 'rgba(99,102,241,0.12)',
                        color: state === 'idle' ? 'var(--color-ai-accent)' : '#fff',
                      }}
                    >
                      {LETTERS[index] || index + 1}
                    </span>
                    <span className="flex-1 text-sm leading-relaxed">{option}</span>
                    {state === 'correct' && <CheckCircle2 size={18} style={{ color: '#10b981' }} />}
                    {state === 'wrong' && <XCircle size={18} style={{ color: '#ef4444' }} />}
                  </button>
                );
              })}
            </div>

            {currentAnswered && q.explanation && (
              <div
                className="rounded-xl border p-4 text-sm leading-relaxed"
                style={{
                  background: 'rgba(99,102,241,0.08)',
                  borderColor: 'rgba(99,102,241,0.18)',
                  color: 'var(--color-text-secondary)',
                }}
              >
                <div className="mb-1 flex items-center gap-2 font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                  <BookOpen size={15} />
                  Giải thích
                </div>
                {q.explanation}
              </div>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setFlashFlipped((value) => !value)}
            className="min-h-[300px] w-full rounded-2xl border p-8 text-center transition-all"
            style={{
              background: flashFlipped
                ? 'linear-gradient(135deg, rgba(16,185,129,0.14), rgba(99,102,241,0.10))'
                : 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(124,58,237,0.08))',
              borderColor: flashFlipped ? 'rgba(16,185,129,0.38)' : 'rgba(99,102,241,0.28)',
              color: 'var(--color-text-primary)',
            }}
          >
            <Typography.Text style={{ color: 'var(--color-text-muted)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {flashFlipped ? 'Mặt sau' : 'Mặt trước'}
            </Typography.Text>
            <div className="mt-6 text-xl font-semibold leading-relaxed">
              {flashFlipped ? q.options[correctIndex] || 'Đáp án chưa có' : q.question_text}
            </div>
            {flashFlipped && q.explanation && (
              <div className="mx-auto mt-5 max-w-xl text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                {q.explanation}
              </div>
            )}
            <div className="mt-8 text-xs" style={{ color: 'var(--color-text-muted)' }}>
              Nhấn để lật thẻ
            </div>
          </button>
        )}

        <div className="flex items-center justify-between pt-2">
          <Button
            icon={<ChevronLeft size={16} />}
            onClick={() => goTo(currentIndex - 1)}
            disabled={currentIndex === 0}
          >
            Trước
          </Button>
          <div className="flex gap-1">
            {normalizedQuestions.map((_, index) => (
              <button
                key={index}
                type="button"
                aria-label={`Đi đến câu ${index + 1}`}
                onClick={() => goTo(index)}
                className="h-2.5 w-2.5 rounded-full"
                style={{
                  background:
                    index === currentIndex
                      ? 'var(--color-ai-accent)'
                      : answered[index]?.correct
                        ? '#10b981'
                        : answered[index]
                          ? '#ef4444'
                          : 'var(--color-border)',
                }}
              />
            ))}
          </div>
          <Button
            icon={<ChevronRight size={16} />}
            iconPosition="end"
            onClick={() => goTo(currentIndex + 1)}
            disabled={currentIndex === normalizedQuestions.length - 1}
          >
            Sau
          </Button>
        </div>
      </div>
    </Modal>
  );
}
