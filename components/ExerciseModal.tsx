
import React, { useState, useRef, useEffect } from 'react';
import { Exercise } from '../types';

interface ExerciseModalProps {
  exercises: Exercise[];
  onComplete?: (answers: Record<number, string>) => void;
  onClose: () => void;
  title: string;
  initialAnswers?: Record<number, string>;
  isReviewMode?: boolean;
}

const ExerciseModal: React.FC<ExerciseModalProps> = ({ 
  exercises, 
  onComplete, 
  onClose, 
  title, 
  initialAnswers = {}, 
  isReviewMode = false 
}) => {
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>(initialAnswers);
  const [submitted, setSubmitted] = useState(isReviewMode);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleSelect = (idx: number, ans: string) => {
    if (submitted) return;
    setUserAnswers(prev => ({ ...prev, [idx]: ans }));
  };

  const allAnswered = Object.keys(userAnswers).length === exercises.length;

  const handleSubmit = () => {
    if (!submitted) {
      setSubmitted(true);
      scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      onComplete?.(userAnswers);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-white w-full max-w-xl rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col max-h-[95vh] animate-in zoom-in-95 duration-300">
        <div className="bg-orange-500 p-6 text-white flex justify-between items-center shrink-0 shadow-lg">
          <div>
            <h3 className="text-xl font-fun font-bold leading-tight">{isReviewMode ? `Histórico: ${title}` : title}</h3>
            <p className="text-[10px] font-bold opacity-80 uppercase tracking-widest mt-0.5">
              {isReviewMode ? 'Modo de Visualização / 查看模式' : 'Check-in de Questões / 题目打卡'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-orange-600 rounded-full transition-colors">✕</button>
        </div>

        <div 
          ref={scrollContainerRef}
          className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-10 pb-32"
        >
          {exercises.map((ex, idx) => (
            <div key={idx} className="space-y-4 animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: `${idx * 100}ms` }}>
              <div className="flex gap-4">
                <span className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg transition-all ${submitted ? (userAnswers[idx] === ex.answer ? 'bg-green-500 text-white' : 'bg-red-500 text-white') : 'bg-blue-100 text-blue-600'}`}>
                  {idx + 1}
                </span>
                <div className="flex-1">
                  <h4 className="text-lg font-bold text-slate-800 leading-snug">
                    {ex.question}
                  </h4>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2.5 ml-14">
                {ex.options?.map((opt, oIdx) => {
                  const isSelected = userAnswers[idx] === opt;
                  const isCorrect = opt === ex.answer;
                  
                  let stateStyle = "border-blue-50 bg-white hover:border-blue-200";
                  let textStyle = "text-slate-600";

                  if (submitted) {
                    if (isCorrect) {
                      stateStyle = "border-green-500 bg-green-50 shadow-sm";
                      textStyle = "text-green-700 font-bold";
                    } else if (isSelected) {
                      stateStyle = "border-red-400 bg-red-50";
                      textStyle = "text-red-700 font-bold";
                    }
                  } else if (isSelected) {
                    stateStyle = "border-orange-500 bg-orange-50 ring-2 ring-orange-100";
                    textStyle = "text-orange-700 font-bold";
                  }

                  return (
                    <button
                      key={oIdx}
                      disabled={submitted}
                      onClick={() => handleSelect(idx, opt)}
                      className={`w-full text-left p-4 rounded-2xl border-2 transition-all active:scale-[0.98] flex justify-between items-center ${stateStyle} ${textStyle}`}
                    >
                      <span className="flex-1 text-sm">{opt}</span>
                      {submitted && isCorrect && <span className="text-green-600 text-xl">✓</span>}
                      {submitted && isSelected && !isCorrect && <span className="text-red-500 text-xl">✕</span>}
                    </button>
                  );
                })}
              </div>

              {submitted && (
                <div className="ml-14 bg-blue-50 p-5 rounded-[1.5rem] border-2 border-blue-100 animate-in fade-in zoom-in-95 duration-300">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-blue-600 text-white text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest">Análise / 解析</span>
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed font-medium">
                    {ex.explanation}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="p-6 bg-white/80 backdrop-blur-md border-t sticky bottom-0 z-10">
          <button 
            disabled={!allAnswered}
            onClick={handleSubmit}
            className={`w-full py-5 rounded-2xl font-bold text-white text-lg shadow-xl transition-all active:scale-95 ${
              !allAnswered ? 'bg-gray-300 shadow-none grayscale' : 'bg-orange-500 shadow-orange-100'
            }`}
          >
            {isReviewMode ? 'Fechar / 关闭' : (submitted ? 'Finalizar Check-in / 完成打卡' : 'Confirmar e Ver Análise / 提交并查看解析')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExerciseModal;
