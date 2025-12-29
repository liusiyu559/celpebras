
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Task, TaskType, UserProfile, DailySentence, Exercise } from './types';
import { generateDailySentence, generateExercises, generatePlanFromAI } from './geminiService';
import DailySentenceCard from './components/DailySentenceCard';
import ExerciseModal from './components/ExerciseModal';

const EXAM_DATE = '2026-03-10';
const TOTAL_DAYS = 71;
const ESTIMATED_TASKS_PER_DAY = 4;
const TOTAL_TASKS_GOAL = TOTAL_DAYS * ESTIMATED_TASKS_PER_DAY;

const getDaysLeft = () => {
  const diff = new Date(EXAM_DATE).getTime() - new Date().getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};

const STAGE_BOUNDARIES = {
  FOUNDATION_END: '2026-01-20',
  SPECIALIZATION_END: '2026-02-20',
};

const getStageForDate = (dateStr: string) => {
  if (dateStr <= STAGE_BOUNDARIES.FOUNDATION_END) return { stage: 'Fundação / 基础夯实阶段', color: 'bg-blue-500', icon: '🌱' };
  if (dateStr <= STAGE_BOUNDARIES.SPECIALIZATION_END) return { stage: 'Superação / 专项突破阶段', color: 'bg-orange-500', icon: '🚀' };
  return { stage: 'Simulado / 冲刺模考阶段', color: 'bg-red-500', icon: '🏆' };
};

const INITIAL_PROFILE: UserProfile = {
  name: 'Samantha',
  targetLevel: 'Intermediário Superior',
  dailyTime: 180,
  examDate: EXAM_DATE,
  currentStage: getStageForDate(new Date().toISOString().split('T')[0]).stage,
  weeklyGoal: 'Consolidar tempos do passado / 巩固过去时态',
  personalDescription: ''
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'study' | 'plan' | 'profile'>('study');
  const [profile, setProfile] = useState<UserProfile>(INITIAL_PROFILE);
  const [allTasks, setAllTasks] = useState<Record<string, Task[]>>({});
  const [dailySentence, setDailySentence] = useState<DailySentence | null>(null);
  const [loadingDaily, setLoadingDaily] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [activeExercises, setActiveExercises] = useState<Exercise[] | null>(null);
  const [exerciseTitle, setExerciseTitle] = useState("");
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [isExerciseLoading, setIsExerciseLoading] = useState(false);
  const [reviewMode, setReviewMode] = useState<{tasks: Task, answers?: Record<number, string>} | null>(null);

  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [tempGoal, setTempGoal] = useState("");
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedProfile = localStorage.getItem('celpe_profile_v6');
    if (savedProfile) setProfile(JSON.parse(savedProfile));

    const savedTasks = localStorage.getItem('celpe_all_tasks_v4');
    if (savedTasks) {
      setAllTasks(JSON.parse(savedTasks));
    }
    loadDailyContent();
  }, []);

  useEffect(() => {
    localStorage.setItem('celpe_all_tasks_v4', JSON.stringify(allTasks));
    localStorage.setItem('celpe_profile_v6', JSON.stringify(profile));
  }, [allTasks, profile]);

  const generateSeedTasks = (date: string): Task[] => {
    const stageInfo = getStageForDate(date);
    let tasks: Task[] = [];
    if (stageInfo.stage.includes('基础')) {
      tasks = [
        { id: Math.random().toString(), type: TaskType.VOCABULARY, title: 'Vocabulário / 词汇', description: '30 palavras de alta frequência', isCompleted: false, dateAssigned: date },
        { id: Math.random().toString(), type: TaskType.GRAMMAR, title: 'Gramática / 语法', description: 'Past, Imperative & Connectors', isCompleted: false, dateAssigned: date },
        { id: Math.random().toString(), type: TaskType.WRITING, title: 'Escrita Diária / 每日写作', description: '5-8 frases usando gramática do dia', isCompleted: false, dateAssigned: date },
        { id: Math.random().toString(), type: TaskType.LISTENING, title: 'Audição / 听力', description: '15min Podcast / Rádio BR', isCompleted: false, dateAssigned: date },
      ];
    } else if (stageInfo.stage.includes('专项')) {
      tasks = [
        { id: Math.random().toString(), type: TaskType.WRITING, title: 'Escrita: Tarefa 1/2 / 专项写作', description: 'Produção a partir de áudio/vídeo', isCompleted: false, dateAssigned: date },
        { id: Math.random().toString(), type: TaskType.SPEAKING, title: 'Simulação Oral / 口试练习', description: 'Discussão de temas polêmicos', isCompleted: false, dateAssigned: date },
        { id: Math.random().toString(), type: TaskType.VOCABULARY, title: 'Vocabulário Avançado / 词汇专项', description: 'Temas sociais e políticos', isCompleted: false, dateAssigned: date },
      ];
    } else {
      tasks = [
        { id: Math.random().toString(), type: TaskType.WRITING, title: 'Simulado Completo / 全真模考', description: '3h de produção escrita (4 tarefas)', isCompleted: false, dateAssigned: date },
        { id: Math.random().toString(), type: TaskType.SPEAKING, title: 'Entrevista Final / 考前面试', description: 'Foco em fluidez e naturalidade', isCompleted: false, dateAssigned: date },
      ];
    }
    return tasks;
  };

  const currentTasks = useMemo(() => {
    if (!allTasks[selectedDate]) {
      const seed = generateSeedTasks(selectedDate);
      setAllTasks(prev => ({ ...prev, [selectedDate]: seed }));
      return seed;
    }
    return allTasks[selectedDate];
  }, [selectedDate, allTasks]);

  const totalProgressPercent = useMemo(() => {
    // Explicitly cast Object.values to Task[][] to fix 'unknown' type error on line 114 and arithmetic error on line 117
    const completedTasksCount = (Object.values(allTasks) as Task[][]).reduce(
      (count: number, tasks: Task[]) => count + tasks.filter((t: Task) => t.isCompleted).length,
      0
    );
    return Math.min(100, (completedTasksCount / TOTAL_TASKS_GOAL) * 100);
  }, [allTasks]);

  const loadDailyContent = async () => {
    setLoadingDaily(true);
    try {
      const ds = await generateDailySentence(profile);
      setDailySentence(ds);
    } catch (e) { console.error(e); }
    finally { setLoadingDaily(false); }
  };

  const handleTaskClick = async (task: Task) => {
    if (task.isCompleted) {
      if (task.exercises) {
        setReviewMode({ tasks: task, answers: task.userAnswers });
      }
      return;
    }
    setIsExerciseLoading(true);
    setActiveTaskId(task.id);
    setExerciseTitle(task.title);
    try {
      const ex = await generateExercises(task, profile);
      setActiveExercises(ex);
    } catch (e) { console.error(e); }
    finally { setIsExerciseLoading(false); }
  };

  const completeTask = (answers: Record<number, string>) => {
    if (activeTaskId && activeExercises) {
      const updatedTasks = currentTasks.map(t => 
        t.id === activeTaskId 
          ? { ...t, isCompleted: true, exercises: activeExercises, userAnswers: answers } 
          : t
      );
      setAllTasks(prev => ({ ...prev, [selectedDate]: updatedTasks }));
      if (updatedTasks.every(t => t.isCompleted) && selectedDate === new Date().toISOString().split('T')[0]) {
        setShowCelebration(true);
        setTimeout(() => setShowCelebration(false), 3000);
      }
    }
    setActiveExercises(null);
    setActiveTaskId(null);
  };

  const addCustomTask = () => {
    if (!newTaskTitle.trim()) return;
    const newTask: Task = {
      id: Math.random().toString(),
      type: TaskType.GRAMMAR,
      title: newTaskTitle,
      description: 'Tarefa personalizada / 自定义任务',
      isCompleted: false,
      dateAssigned: selectedDate
    };
    setAllTasks(prev => ({ ...prev, [selectedDate]: [...(prev[selectedDate] || []), newTask] }));
    setNewTaskTitle("");
    setIsAddingTask(false);
  };

  const deleteTask = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setAllTasks(prev => ({
      ...prev,
      [selectedDate]: prev[selectedDate].filter(t => t.id !== id)
    }));
  };

  const saveWeeklyGoal = () => {
    setProfile(prev => ({ ...prev, weeklyGoal: tempGoal }));
    setIsEditingGoal(false);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setProfile({ ...profile, avatar: reader.result as string });
      reader.readAsDataURL(file);
    }
  };

  const stageInfo = getStageForDate(selectedDate);

  const calendarDates = useMemo(() => {
    const dates = [];
    const start = new Date();
    const end = new Date(EXAM_DATE);
    let current = new Date(start);
    current.setDate(current.getDate() - 2); 
    while (current <= end) {
      dates.push(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + 1);
    }
    return dates;
  }, []);

  return (
    <div className="min-h-screen max-w-md mx-auto bg-blue-50 relative pb-28 font-sans overflow-x-hidden">
      <header className="p-6 pb-2 sticky top-0 bg-blue-50/90 backdrop-blur-md z-30">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-4">
             <div 
              onClick={() => setActiveTab('profile')} 
              className="w-14 h-14 bg-white rounded-xl shadow-md border-2 border-white overflow-hidden cursor-pointer active:scale-95 transition-all shrink-0"
             >
                {profile.avatar ? (
                  <img src={profile.avatar} className="w-full h-full object-cover" alt="Profile avatar" />
                ) : (
                  <div className="w-full h-full bg-orange-500 flex items-center justify-center text-white font-black text-2xl">
                    {profile.name[0]}
                  </div>
                )}
             </div>
             <div>
                <h1 className="text-lg font-fun font-bold text-slate-800 leading-none">Rota da {profile.name}</h1>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Celpe-Bras 2026</p>
             </div>
          </div>
          <div className="text-right bg-white px-3 py-1.5 rounded-2xl shadow-sm border border-blue-100">
             <span className="text-xl font-black text-orange-500 font-fun">{getDaysLeft()}</span>
             <p className="text-[8px] font-bold text-slate-400 uppercase leading-none">Dias / 天</p>
          </div>
        </div>
      </header>

      <main className="p-6 pt-2">
        {activeTab === 'study' && (
          <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-300">
            <div className="bg-gradient-to-br from-blue-700 to-blue-500 p-7 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4 opacity-10 text-6xl">{stageInfo.icon}</div>
               <div className="relative z-10">
                 <p className="text-[11px] font-black uppercase opacity-80 mb-1 tracking-widest">Jornada de 71 Dias / 71天备考进度</p>
                 <h2 className="text-2xl font-fun font-bold mb-4">{stageInfo.stage}</h2>
                 
                 <div className="relative pt-1">
                    <div className="flex mb-2 items-center justify-between">
                      <div>
                        <span className="text-xs font-black inline-block py-1 px-2 uppercase rounded-full bg-blue-400 text-white">
                          Nível {Math.floor(totalProgressPercent / 10) + 1}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-black inline-block text-white drop-shadow-sm">
                          {totalProgressPercent.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <div className="overflow-hidden h-3.5 mb-2 text-xs flex rounded-full bg-blue-900/30 border border-blue-400/30 p-0.5">
                      <div style={{ width: `${totalProgressPercent}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-orange-400 to-yellow-300 rounded-full transition-all duration-1000 ease-out"></div>
                    </div>
                    <p className="text-[9px] font-bold opacity-70 italic">Conclua missões diárias para evoluir sua rota!</p>
                 </div>
               </div>
            </div>

            <section>
              <h3 className="text-lg font-fun font-bold mb-4 flex items-center gap-2 text-slate-800">
                 <span className="w-1.5 h-6 bg-orange-400 rounded-full"></span>
                 Frase do Dia / 每日一句
              </h3>
              <DailySentenceCard sentence={dailySentence} loading={loadingDaily} onPractice={() => {
                  if (dailySentence) {
                    setExerciseTitle("Análise de Padrão / 句型分析");
                    setActiveExercises([dailySentence.exercise]);
                  }
                }} 
              />
            </section>
            
            {/* Quick Records summary or empty space instead of weekly goal */}
            <div className="bg-white p-6 rounded-[2rem] border border-blue-50 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                 <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Resumo de Atividade</h3>
                 <span className="text-[10px] bg-green-100 text-green-600 px-2 py-0.5 rounded-full font-bold">LIVE</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                 <div className="bg-blue-50/50 p-4 rounded-2xl">
                    <p className="text-2xl font-black text-blue-600">{(Object.values(allTasks) as Task[][]).flat().filter((t: Task) => t.isCompleted).length}</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase">Total de Missões</p>
                 </div>
                 <div className="bg-orange-50/50 p-4 rounded-2xl">
                    <p className="text-2xl font-black text-orange-600">{currentTasks.filter(t => t.isCompleted).length}</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase">Feito Hoje</p>
                 </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'plan' && (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
            <div className="bg-white p-4 rounded-[2.5rem] shadow-sm border border-blue-50 overflow-hidden">
               <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-2" ref={calendarRef}>
                  {calendarDates.map(dateStr => {
                    const date = new Date(dateStr);
                    const isSelected = selectedDate === dateStr;
                    const isToday = dateStr === new Date().toISOString().split('T')[0];
                    const tasksForThatDate = allTasks[dateStr] || [];
                    const allDone = tasksForThatDate.length > 0 && tasksForThatDate.every(t => t.isCompleted);
                    return (
                      <button 
                        key={dateStr}
                        onClick={() => setSelectedDate(dateStr)}
                        className={`flex flex-col items-center justify-center min-w-[55px] h-20 rounded-2xl transition-all relative ${isSelected ? 'bg-orange-500 text-white shadow-lg' : 'bg-blue-50/50 text-slate-400'}`}
                      >
                        <span className="text-[8px] font-black uppercase mb-1">{date.toLocaleDateString('pt-BR', {weekday: 'short'})}</span>
                        <span className={`text-xl font-bold ${isToday && !isSelected ? 'text-orange-500' : ''}`}>{date.getDate()}</span>
                        {allDone && <span className="absolute -top-1 -right-1 text-[12px] animate-bounce">✅</span>}
                      </button>
                    )
                  })}
               </div>
            </div>

            <section className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-blue-50">
               <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-xl font-fun font-bold text-slate-800">Missões ({new Date(selectedDate).toLocaleDateString('pt-BR', {day: 'numeric', month: 'short'})})</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">{getStageForDate(selectedDate).stage}</p>
                  </div>
                  <button 
                    onClick={() => setIsAddingTask(true)}
                    className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg active:scale-90 transition-all text-3xl font-bold"
                  >
                    +
                  </button>
               </div>

               {isAddingTask && (
                 <div className="mb-6 p-5 bg-blue-50 rounded-[2rem] border-2 border-blue-100 animate-in zoom-in-95 duration-200">
                   <p className="text-[10px] font-black text-blue-500 uppercase mb-3 tracking-widest">Nova Missão / 新任务</p>
                   <input 
                    autoFocus
                    className="w-full p-4 bg-white rounded-2xl mb-4 text-sm font-bold border-2 border-transparent focus:border-blue-400 outline-none shadow-sm" 
                    placeholder="O que você quer praticar hoje?" 
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addCustomTask()}
                   />
                   <div className="flex gap-2">
                     <button onClick={addCustomTask} className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold text-xs shadow-md">Adicionar / 添加</button>
                     <button onClick={() => setIsAddingTask(false)} className="px-5 py-3 bg-white text-slate-400 rounded-xl font-bold text-xs border">Cancelar</button>
                   </div>
                 </div>
               )}

               <div className="space-y-3">
                  {currentTasks.length === 0 && <p className="text-center py-10 text-slate-300 font-bold">Sem tarefas / 暂无任务</p>}
                  {currentTasks.map(task => (
                    <div 
                      key={task.id} 
                      onClick={() => handleTaskClick(task)} 
                      className={`relative w-full text-left p-5 rounded-2xl flex items-center justify-between transition-all group active:scale-[0.98] cursor-pointer border ${
                        task.isCompleted ? 'bg-gray-50 border-gray-100 shadow-inner' : 'bg-white border-blue-50 hover:bg-blue-50 hover:border-blue-100 shadow-sm'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl transition-all ${task.isCompleted ? 'text-green-500 bg-white' : 'bg-blue-50 text-blue-500 group-hover:bg-white group-hover:shadow-sm'}`}>
                          {task.isCompleted ? '✓' : (task.type.includes('词汇') ? '🔤' : task.type.includes('语法') ? '✍️' : '📝')}
                        </div>
                        <div>
                          <h4 className={`text-sm font-bold transition-all ${task.isCompleted ? 'text-slate-400' : 'text-slate-800'}`}>{task.title}</h4>
                          <p className="text-[9px] text-slate-400 font-bold leading-none mt-1 uppercase tracking-tight">{task.isCompleted ? 'Clique para ver registro / 点击查看记录' : task.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {!task.isCompleted && <span className="text-[9px] font-black text-orange-400 opacity-0 group-hover:opacity-100 translate-x-1 group-hover:translate-x-0 transition-all">CHECK-IN</span>}
                        {task.isCompleted && <span className="text-[9px] font-black text-green-500 mr-2 uppercase">Concluído</span>}
                        <button 
                          onClick={(e) => deleteTask(task.id, e)}
                          className="p-2.5 hover:bg-red-50 text-slate-200 hover:text-red-500 rounded-xl transition-all"
                          title="Remover"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
               </div>
            </section>

            <div 
              onClick={() => { setTempGoal(profile.weeklyGoal); setIsEditingGoal(true); }}
              className="bg-blue-600 p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden cursor-pointer active:scale-[0.99] transition-all hover:bg-blue-700"
            >
               <div className="absolute bottom-0 right-0 p-4 opacity-10 text-6xl">✨</div>
               <div className="flex justify-between items-start mb-2">
                 <p className="text-[10px] font-black uppercase opacity-60 tracking-widest">Meta Semanal / 每周目标</p>
                 <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-bold">EDITAR</span>
               </div>
               <p className="font-bold text-lg leading-relaxed">{profile.weeklyGoal}</p>
            </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="animate-in slide-in-from-left-4 duration-300">
             <div className="bg-white p-8 rounded-[3rem] shadow-xl text-center border border-blue-50">
                <div className="relative inline-block group mb-6">
                  <div 
                    onClick={() => fileInputRef.current?.click()} 
                    className="w-32 h-32 mx-auto bg-white rounded-3xl overflow-hidden border-4 border-white shadow-2xl cursor-pointer hover:scale-105 transition-all"
                  >
                     {profile.avatar ? <img src={profile.avatar} className="w-full h-full object-cover" alt="Profile avatar" /> : <div className="w-full h-full flex items-center justify-center text-5xl bg-orange-100 text-orange-400 font-bold">{profile.name[0]}</div>}
                  </div>
                  <div className="absolute bottom-1 right-1 bg-blue-600 text-white p-2.5 rounded-xl shadow-lg border-2 border-white cursor-pointer active:scale-90" onClick={() => fileInputRef.current?.click()}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    </svg>
                  </div>
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAvatarChange} />
                </div>
                
                <h2 className="text-2xl font-fun font-bold text-slate-800">{profile.name}</h2>
                <p className="text-slate-400 text-sm mb-8">Preparação <span className="text-orange-500 font-black tracking-tighter">CELPE-BRAS 2026</span></p>
                
                <div className="text-left space-y-4">
                   <div className="p-5 bg-blue-50/50 rounded-3xl border border-blue-100 group transition-all hover:bg-white hover:shadow-sm">
                      <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">Nome de Candidato / 姓名</p>
                      <input className="w-full bg-transparent font-bold text-slate-800 outline-none text-lg" value={profile.name} onChange={(e) => setProfile({...profile, name: e.target.value})} />
                   </div>
                   <div className="p-5 bg-blue-50/50 rounded-3xl border border-blue-100 group transition-all hover:bg-white hover:shadow-sm">
                      <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">Foco de Estudo / 每日目标</p>
                      <div className="flex items-center gap-3">
                        <input type="number" className="w-16 bg-transparent font-bold text-slate-800 outline-none text-lg" value={profile.dailyTime} onChange={(e) => setProfile({...profile, dailyTime: parseInt(e.target.value)})} />
                        <span className="text-slate-400 font-bold text-sm uppercase">minutos diários</span>
                      </div>
                   </div>
                   <div className="p-5 bg-blue-50/50 rounded-3xl border border-blue-100 group transition-all hover:bg-white hover:shadow-sm">
                      <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">Nível Alvo / 目标等级</p>
                      <select className="w-full bg-transparent font-bold text-slate-800 outline-none text-lg appearance-none cursor-pointer" value={profile.targetLevel} onChange={(e) => setProfile({...profile, targetLevel: e.target.value as any})}>
                        <option>Intermediário</option>
                        <option>Intermediário Superior</option>
                        <option>Avançado</option>
                        <option>Avançado Superior</option>
                      </select>
                   </div>
                </div>
             </div>
          </div>
        )}
      </main>

      {isEditingGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/70 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-fun font-bold text-slate-800 mb-4">Meta da Semana / 每周目标</h3>
            <textarea 
              autoFocus
              className="w-full h-32 p-4 bg-blue-50 rounded-2xl mb-6 text-sm font-bold text-slate-700 outline-none focus:ring-4 ring-blue-100 transition-all shadow-inner"
              value={tempGoal}
              onChange={(e) => setTempGoal(e.target.value)}
              placeholder="Qual sua meta para esta semana?"
            />
            <div className="flex gap-3">
              <button onClick={saveWeeklyGoal} className="flex-1 bg-orange-500 text-white py-4 rounded-2xl font-bold shadow-lg shadow-orange-100 active:scale-95 transition-all">Salvar / 保存</button>
              <button onClick={() => setIsEditingGoal(false)} className="px-6 py-4 bg-gray-100 text-slate-500 rounded-2xl font-bold active:scale-95 transition-all">Sair</button>
            </div>
          </div>
        </div>
      )}

      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white/95 backdrop-blur-xl border-t p-5 flex justify-around items-center z-40 rounded-t-[3rem] shadow-[0_-15px_50px_rgba(0,0,0,0.1)]">
        <button onClick={() => setActiveTab('study')} className={`flex flex-col items-center gap-1 transition-all active:scale-90 ${activeTab === 'study' ? 'text-blue-600 scale-110 font-bold' : 'text-slate-300'}`}>
          <span className="text-2xl">{activeTab === 'study' ? '🏠' : '🏚️'}</span>
          <span className="text-[9px] font-black uppercase tracking-widest">Início / 主页</span>
        </button>
        <button onClick={() => setActiveTab('plan')} className={`flex flex-col items-center gap-1 transition-all active:scale-90 ${activeTab === 'plan' ? 'text-blue-600 scale-110 font-bold' : 'text-slate-300'}`}>
          <span className="text-2xl font-fun">{activeTab === 'plan' ? '🗓️' : '📆'}</span>
          <span className="text-[9px] font-black uppercase tracking-widest">Plano / 计划</span>
        </button>
        <button onClick={() => setActiveTab('profile')} className={`flex flex-col items-center gap-1 transition-all active:scale-90 ${activeTab === 'profile' ? 'text-blue-600 scale-110 font-bold' : 'text-slate-300'}`}>
          <span className="text-2xl">👤</span>
          <span className="text-[9px] font-black uppercase tracking-widest">Perfil / 个人</span>
        </button>
      </nav>

      {isExerciseLoading && (
        <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-blue-50/90 backdrop-blur-md animate-in fade-in duration-300">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-blue-100 rounded-2xl animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-4 h-4 bg-orange-500 rounded-full animate-pulse" />
            </div>
          </div>
          <p className="mt-6 text-slate-800 font-fun font-bold text-lg animate-pulse">Sincronizando Rota... / 同步中...</p>
          <p className="text-blue-500 text-[10px] font-black uppercase tracking-widest">Processando Inteligência Artificial</p>
        </div>
      )}

      {activeExercises && <ExerciseModal exercises={activeExercises} title={exerciseTitle} onClose={() => setActiveExercises(null)} onComplete={completeTask} />}
      {reviewMode && <ExerciseModal exercises={reviewMode.tasks.exercises || []} title={reviewMode.tasks.title} onClose={() => setReviewMode(null)} initialAnswers={reviewMode.answers} isReviewMode={true} />}
      
      {showCelebration && (
        <div className="fixed inset-0 pointer-events-none z-[100] flex flex-col items-center justify-center bg-white/40 backdrop-blur-sm animate-in fade-in duration-500">
          <div className="text-[120px] animate-bounce">✨</div>
          <h2 className="text-4xl font-fun font-bold text-orange-500 drop-shadow-lg text-center px-6">Missão Cumprida!<br/>今日达成！</h2>
        </div>
      )}
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 0; height: 0; background: transparent; }
        input[type="number"]::-webkit-inner-spin-button, input[type="number"]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
      `}</style>
    </div>
  );
};

export default App;
