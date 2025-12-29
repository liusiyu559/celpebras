
import React from 'react';
import { DailySentence } from '../types';

interface DailySentenceCardProps {
  sentence: DailySentence | null;
  onPractice: () => void;
  loading: boolean;
}

const DailySentenceCard: React.FC<DailySentenceCardProps> = ({ sentence, onPractice, loading }) => {
  if (loading) {
    return (
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-blue-50 animate-pulse">
        <div className="h-6 w-32 bg-gray-200 rounded-full mb-4"></div>
        <div className="h-10 w-full bg-gray-100 rounded-lg mb-4"></div>
        <div className="h-20 w-full bg-gray-50 rounded-lg"></div>
      </div>
    );
  }

  if (!sentence) return null;

  return (
    <div className="bg-white overflow-hidden rounded-3xl shadow-lg border border-orange-100 relative group transition-all hover:shadow-xl">
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      </div>

      <div className="p-6 relative z-10">
        <div className="flex items-center gap-2 mb-3">
          <span className="bg-orange-100 text-orange-600 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest">Padrão de Escrita</span>
        </div>
        
        <h3 className="text-2xl font-bold text-slate-800 mb-2 font-fun">{sentence.pattern}</h3>
        <p className="text-slate-500 italic mb-4">{sentence.meaning}</p>
        
        <div className="bg-blue-50 p-4 rounded-2xl mb-6 border-l-4 border-blue-400">
          <p className="text-blue-800 font-medium">Exemplo:</p>
          <p className="text-slate-700">{sentence.example}</p>
        </div>

        <button 
          onClick={onPractice}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white py-4 rounded-2xl font-bold transition-all shadow-lg shadow-orange-200 active:scale-[0.98]"
        >
          Praticar Agora
        </button>
      </div>
    </div>
  );
};

export default DailySentenceCard;
