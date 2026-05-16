import React, { useState } from 'react';
import { Download } from 'lucide-react';

const QuizExporter = ({ quizData }) => {
  const [format, setFormat] = useState('json');

  if (!quizData || !quizData.questions) return null;

  const handleExport = () => {
    let outputStr = '';
    let mimeType = 'text/plain';
    let fileExt = 'txt';

    if (format === 'json') {
      outputStr = JSON.stringify(quizData, null, 2);
      mimeType = 'application/json';
      fileExt = 'json';
    } else if (format === 'csv') {
      outputStr = 'Question,Option_A,Option_B,Option_C,Option_D,Correct_Answer\n';
      quizData.questions.forEach(q => {
        const opts = q.options.map(o => `"${o.replace(/"/g, '""')}"`).join(',');
        outputStr += `"${q.question.replace(/"/g, '""')}",${opts},"${q.correctAnswer}"\n`;
      });
      mimeType = 'text/csv';
      fileExt = 'csv';
    }

    const blob = new Blob([outputStr], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quiz_export.${fileExt}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-lumiere-bg-secondary border border-lumiere-border rounded-xl p-4 flex flex-col gap-4">
      <h4 className="font-semibold text-lumiere-text-primary text-sm flex items-center justify-between">
        Bộ test: {quizData.title || 'Bài kiểm tra'}
        <span className="text-xs bg-purple-500/10 text-purple-600 px-2 py-0.5 rounded-full font-mono font-medium border border-purple-500/20">
          {quizData.questions.length} CH
        </span>
      </h4>
      
      <div className="flex items-center gap-3">
        <select 
          className="text-xs bg-lumiere-bg-primary border border-lumiere-border rounded-lg px-2 py-1.5 focus:outline-none"
          value={format}
          onChange={(e) => setFormat(e.target.value)}
        >
          <option value="json">LMS JSON (Moodle/Canvas)</option>
          <option value="csv">CSV (Excel/Kahoot)</option>
        </select>
        
        <button 
          onClick={handleExport}
          className="flex-1 flex items-center justify-center gap-2 bg-lumiere-brand hover:bg-lumiere-brand/90 text-white text-xs font-semibold py-1.5 px-3 rounded-lg transition-colors"
        >
          <Download size={14} /> Tải file import
        </button>
      </div>
    </div>
  );
};

export default QuizExporter;
