/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Trash2, 
  Car, 
  Trophy, 
  HandHelping, 
  AlertTriangle, 
  RotateCcw,
  Settings,
  Users,
  Check,
  X,
  Upload,
  UserPlus,
  LogIn
} from 'lucide-react';
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  writeBatch 
} from 'firebase/firestore';
import { db, auth } from './firebase';

// --- Helpers ---

const generateId = () => {
  try {
    return crypto.randomUUID();
  } catch (e) {
    return Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
  }
};

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

type BehaviorStatus = 'green' | 'yellow' | 'red' | 'excellence' | 'helper';

interface ClassGroup {
  id: string;
  name: string;
}

interface Student {
  id: string;
  name: string;
  classId: string;
  status: BehaviorStatus;
  carColor: string;
}

const CAR_COLORS = [
  { name: 'Vermelho', value: '#ef4444' },
  { name: 'Laranja', value: '#f97316' },
  { name: 'Amarelo', value: '#f59e0b' },
  { name: 'Verde', value: '#10b981' },
  { name: 'Ciano', value: '#06b6d4' },
  { name: 'Azul', value: '#3b82f6' },
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Roxo', value: '#8b5cf6' },
  { name: 'Rosa', value: '#d946ef' },
  { name: 'Cinza', value: '#475569' },
];

// --- Components ---

const ColorPicker = ({ selected, onSelect }: { selected: string, onSelect: (color: string) => void }) => (
  <div className="flex flex-wrap gap-2">
    {CAR_COLORS.map(color => (
      <button
        key={color.value}
        type="button"
        onClick={() => onSelect(color.value)}
        className={`w-6 h-6 rounded-full border-2 transition-all ${selected === color.value ? 'border-sky-500 scale-125 shadow-md' : 'border-white opacity-60 hover:opacity-100'}`}
        style={{ backgroundColor: color.value }}
        title={color.name}
      />
    ))}
  </div>
);

const StudentCar = ({ 
  student, 
  onStatusChange, 
  onDelete,
  isSelected = false
}: { 
  student: Student, 
  onStatusChange: (id: string, status: BehaviorStatus) => void,
  onDelete: (id: string) => void,
  isSelected?: boolean,
  key?: React.Key
}) => {
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);

  const getBorderColor = () => {
    switch (student.status) {
      case 'green': return 'border-emerald-400';
      case 'yellow': return 'border-amber-400';
      case 'red': return 'border-rose-400';
      case 'excellence': return 'border-indigo-300';
      case 'helper': return 'border-purple-300';
      default: return 'border-gray-200';
    }
  };

  const getBgColor = () => {
    if (student.status === 'excellence') return 'bg-indigo-900/50';
    if (student.status === 'helper') return 'bg-purple-900/50';
    return isSelected ? 'bg-sky-50' : 'bg-white';
  };

  const getTextColor = () => {
    if (student.status === 'excellence' || student.status === 'helper') return 'text-white';
    return 'text-gray-700';
  };

  return (
    <motion.div
      layoutId={student.id}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      className={`relative group flex flex-col items-center p-2 rounded-xl shadow-sm border-b-4 ${getBorderColor()} ${getBgColor()} transition-all hover:shadow-md cursor-pointer`}
      onClick={() => setIsOptionsOpen(!isOptionsOpen)}
    >
      <div style={{ color: student.carColor }}>
        <Car size={32} fill={student.carColor} fillOpacity={0.2} strokeWidth={2.5} />
      </div>
      <span className={`text-[10px] font-black mt-1 max-w-[70px] truncate text-center ${getTextColor()}`}>
        {student.name}
      </span>

      <AnimatePresence>
        {isOptionsOpen && (
          <>
            <div className="fixed inset-0 z-50" onClick={(e) => { e.stopPropagation(); setIsOptionsOpen(false); }} />
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute bottom-full mb-2 z-[60] bg-white shadow-2xl rounded-2xl p-2 border-2 border-sky-100 flex gap-2"
              onClick={(e) => e.stopPropagation()}
            >
              <button onClick={() => { onStatusChange(student.id, 'green'); setIsOptionsOpen(false); }} className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center hover:scale-110 shadow-sm"><Check size={14} /></button>
              <button onClick={() => { onStatusChange(student.id, 'yellow'); setIsOptionsOpen(false); }} className="w-8 h-8 rounded-full bg-amber-400 text-white flex items-center justify-center hover:scale-110 shadow-sm"><AlertTriangle size={14} /></button>
              <button onClick={() => { onStatusChange(student.id, 'red'); setIsOptionsOpen(false); }} className="w-8 h-8 rounded-full bg-rose-500 text-white flex items-center justify-center hover:scale-110 shadow-sm"><X size={14} /></button>
              <div className="w-px bg-gray-200 mx-1" />
              <button onClick={() => { onStatusChange(student.id, 'excellence'); setIsOptionsOpen(false); }} className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center hover:scale-110 shadow-sm"><Trophy size={14} /></button>
              <button onClick={() => { onStatusChange(student.id, 'helper'); setIsOptionsOpen(false); }} className="w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center hover:scale-110 shadow-sm"><HandHelping size={14} /></button>
              <div className="w-px bg-gray-200 mx-1" />
              <button onClick={() => { onDelete(student.id); setIsOptionsOpen(false); }} className="w-8 h-8 rounded-full bg-gray-100 text-red-500 flex items-center justify-center hover:bg-red-50 shadow-sm"><Trash2 size={14} /></button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default function App() {
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>(() => {
    return localStorage.getItem('semaforo_selected_class') || 'all';
  });
  const [isSaving, setIsSaving] = useState(false);
  const [showClassesModal, setShowClassesModal] = useState(false);
  const [showBulkAdd, setShowBulkAdd] = useState(false);
  const [bulkAddSuccess, setBulkAddSuccess] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(CAR_COLORS[3].value);
  const [bulkText, setBulkText] = useState('');
  const [bulkClassName, setBulkClassName] = useState('');
  const [showAlert, setShowAlert] = useState<{name: string} | null>(null);

  // Firestore Sync
  useEffect(() => {
    localStorage.setItem('semaforo_selected_class', selectedClassId);
  }, [selectedClassId]);

  useEffect(() => {
    let classesDone = false;
    let studentsDone = false;

    const checkDone = () => {
      if (classesDone && studentsDone) {
        setLoading(false);
      }
    };

    const unsubClasses = onSnapshot(collection(db, 'classes'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ClassGroup));
      setClasses(data);
      classesDone = true;
      checkDone();
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'classes');
      classesDone = true;
      checkDone();
    });

    const unsubStudents = onSnapshot(collection(db, 'students'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student));
      setStudents(data);
      studentsDone = true;
      checkDone();
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'students');
      studentsDone = true;
      checkDone();
    });

    return () => {
      unsubClasses();
      unsubStudents();
    };
  }, []);

  const addStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || selectedClassId === 'all') return;
    
    setIsSaving(true);
    const id = generateId();
    const newStudent: Student = {
      id,
      name: newName,
      classId: selectedClassId,
      status: 'green',
      carColor: newColor
    };
    
    try {
      await setDoc(doc(db, 'students', id), newStudent);
      setNewName('');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `students/${id}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleBulkAdd = async () => {
    if (!bulkText.trim() || !bulkClassName.trim()) return;
    
    setIsSaving(true);
    try {
      const batch = writeBatch(db);
      let targetClassId = '';
      const existingClass = classes.find(c => c.name.toLowerCase() === bulkClassName.trim().toLowerCase());
      
      if (existingClass) {
        targetClassId = existingClass.id;
      } else {
        targetClassId = generateId();
        const newClass = { id: targetClassId, name: bulkClassName.trim() };
        batch.set(doc(db, 'classes', targetClassId), newClass);
      }

      const names = bulkText.split(/[\n,]/).map(n => n.trim()).filter(n => n.length > 0);
      names.forEach(name => {
        const studentId = generateId();
        batch.set(doc(db, 'students', studentId), {
          id: studentId,
          name,
          classId: targetClassId,
          status: 'green',
          carColor: CAR_COLORS[Math.floor(Math.random() * CAR_COLORS.length)].value
        });
      });
      
      await batch.commit();
      
      // Success feedback
      setSelectedClassId(targetClassId);
      setBulkText('');
      setBulkClassName('');
      setBulkAddSuccess(true);
      
      // Wait for the UI to feel "confirmed"
      setTimeout(() => {
        setBulkAddSuccess(false);
        setShowBulkAdd(false);
      }, 1500);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'batch-bulk-add');
    } finally {
      setIsSaving(false);
    }
  };

  const updateStatus = async (id: string, status: BehaviorStatus) => {
    const student = students.find(s => s.id === id);
    if (!student) return;

    if (status === 'red') setShowAlert({ name: student.name });

    try {
      setIsSaving(true);
      await updateDoc(doc(db, 'students', id), { status });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `students/${id}`);
    } finally {
      setIsSaving(false);
    }
  };

  const deleteStudent = async (id: string) => {
    try {
      setIsSaving(true);
      await deleteDoc(doc(db, 'students', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `students/${id}`);
    } finally {
      setIsSaving(false);
    }
  };

  const resetAll = async () => {
    if (!confirm('Deseja mover todos os carros desta turma de volta para o sinal Verde?')) return;
    
    setIsSaving(true);
    try {
      const batch = writeBatch(db);
      const toReset = currentStudents.filter(s => s.status !== 'green');
      
      toReset.forEach(s => {
        batch.update(doc(db, 'students', s.id), { status: 'green' });
      });
      
      await batch.commit();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'batch-reset');
    } finally {
      setIsSaving(false);
    }
  };

  const addClass = async (name: string) => {
    if (!name.trim()) return;
    setIsSaving(true);
    const id = generateId();
    try {
      await setDoc(doc(db, 'classes', id), { id, name: name.trim() });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `classes/${id}`);
    } finally {
      setIsSaving(false);
    }
  };

  const deleteClass = async (id: string) => {
    if (!confirm('Isso apagará a turma e todos os alunos dela. Confirmar?')) return;
    
    setIsSaving(true);
    try {
      const batch = writeBatch(db);
      const studentsToDelete = students.filter(s => s.classId === id);
      
      studentsToDelete.forEach(s => {
        batch.delete(doc(db, 'students', s.id));
      });
      batch.delete(doc(db, 'classes', id));
      
      await batch.commit();
      if (selectedClassId === id) setSelectedClassId('all');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'batch-delete-class');
    } finally {
      setIsSaving(false);
    }
  };

  const currentStudents = useMemo(() => 
    selectedClassId === 'all' ? students : students.filter(s => s.classId === selectedClassId)
  , [students, selectedClassId]);

  const grouped = {
    green: currentStudents.filter(s => s.status === 'green'),
    yellow: currentStudents.filter(s => s.status === 'yellow'),
    red: currentStudents.filter(s => s.status === 'red'),
    excellence: currentStudents.filter(s => s.status === 'excellence'),
    helper: currentStudents.filter(s => s.status === 'helper'),
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-8 overflow-hidden">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="relative w-full max-w-md h-48 flex flex-col justify-center items-center gap-6"
        >
          {/* Race Track Lines */}
          <div className="absolute inset-0 flex flex-col justify-around opacity-10">
            <div className="h-0.5 w-[200%] bg-white border-t-2 border-dashed border-white animate-[move-track_2s_linear_infinite]" />
            <div className="h-0.5 w-[200%] bg-white border-t-2 border-dashed border-white animate-[move-track_2s_linear_infinite_reverse]" />
          </div>

          <div className="flex gap-4 items-end mb-4">
            {[
              { color: "#ef4444", delay: 0 },
              { color: "#10b981", delay: 0.2 },
              { color: "#3b82f6", delay: 0.4 },
              { color: "#f59e0b", delay: 0.1 }
            ].map((config, i) => (
              <motion.div
                key={i}
                animate={{ 
                  x: [-20, 20, -20],
                  y: [0, -10, 0],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ 
                  duration: 0.6, 
                  repeat: Infinity, 
                  delay: config.delay,
                  ease: "easeInOut"
                }}
                style={{ color: config.color }}
              >
                <Car size={48} fill={config.color} fillOpacity={0.2} strokeWidth={3} />
              </motion.div>
            ))}
          </div>

          <div className="text-center z-10">
            <motion.p 
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="text-sky-400 font-black text-2xl uppercase italic tracking-[0.3em]"
            >
              Aquecendo Motores...
            </motion.p>
            <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest mt-2">Sincronizando com o Grid de Largada</p>
          </div>
        </motion.div>

        <style>{`
          @keyframes move-track {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sky-50 font-sans text-gray-900 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b-4 border-sky-200 shadow-sm p-4 md:px-8">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-6">
          <div>
            <h1 className="text-2xl font-black text-sky-600 tracking-tight flex items-center gap-3">
              <span className="text-3xl">🏎️</span> SEMÁFORO DA TURMINHA
            </h1>
            <div className="flex items-center gap-3 mt-1">
              <select 
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="bg-sky-50 px-3 py-1.5 rounded-xl border-2 border-sky-200 outline-none text-xs font-black text-sky-700 cursor-pointer hover:bg-sky-100 transition-colors shadow-sm"
              >
                <option value="all">Ver Todas as Turmas</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <button 
                onClick={() => setShowClassesModal(true)}
                className="text-sky-400 hover:text-sky-600 transition-colors"
                title="Editar Turmas"
              >
                <Settings size={18} />
              </button>
              {isSaving && (
                <motion.span 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-[8px] font-black text-emerald-500 uppercase tracking-widest animate-pulse"
                >
                  Salvando...
                </motion.span>
              )}
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-4">
            <div className="bg-amber-100 px-6 py-2 rounded-2xl border-2 border-amber-300 hidden sm:block">
              <span className="text-amber-700 font-bold text-lg">Pilotos: {currentStudents.length}</span>
            </div>

            <button 
              onClick={() => setShowBulkAdd(true)}
              className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-black flex items-center gap-2 shadow-md transition-all active:scale-95 border-b-4 border-indigo-700"
            >
              <Upload size={18} />+ Turma Inteira
            </button>

            <button 
              onClick={resetAll}
              className="bg-white border-2 border-sky-100 p-2 rounded-xl text-sky-400 hover:bg-sky-50 transition-all shadow-sm active:scale-95"
              title="Resetar Turma"
            >
              <RotateCcw size={20} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-8 mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
        
        {/* ACTION PANEL */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* Add Student Form */}
          {selectedClassId !== 'all' ? (
            <form onSubmit={addStudent} className="bg-white p-6 rounded-[2rem] border-4 border-sky-100 shadow-sm flex flex-col md:flex-row gap-6 items-center">
              <div className="flex-1 flex flex-col gap-2 w-full">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Adicionar Novo Piloto:</label>
                <input 
                  type="text" 
                  placeholder="Nome completo..." 
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-gray-50 px-6 py-3 rounded-2xl border-2 border-transparent focus:border-sky-400 outline-none text-sm font-black shadow-inner"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2 text-center">Cor do Carro:</label>
                <ColorPicker selected={newColor} onSelect={setNewColor} />
              </div>
              <button 
                type="submit"
                className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-3 rounded-2xl font-black shadow-lg transition-all active:scale-95 flex items-center gap-2 border-b-4 border-emerald-700 self-end md:self-center"
              >
                <Plus size={24} /> Adicionar
              </button>
            </form>
          ) : (
            <div className="bg-sky-100 p-6 rounded-[2rem] border-2 border-dashed border-sky-300 text-center">
              <p className="text-sky-600 font-black uppercase italic tracking-widest">
                Selecione uma turma específica acima para adicionar alunos!
              </p>
            </div>
          )}

          {/* BEHAVIOR ZONES */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* GREEN ZONE */}
            <div className="bg-emerald-100 rounded-[40px] p-6 flex flex-col border-4 border-emerald-300 shadow-inner min-h-[450px]">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-emerald-500 rounded-full border-4 border-white shadow-md flex items-center justify-center text-white font-black italic">GO</div>
                <h2 className="font-black text-emerald-700 text-xl uppercase italic tracking-tight">Pista Livre</h2>
              </div>
              <div className="grid grid-cols-2 gap-3 pb-8">
                <AnimatePresence>
                  {grouped.green.map(s => (
                    <StudentCar key={s.id} student={s} onStatusChange={updateStatus} onDelete={deleteStudent} />
                  ))}
                </AnimatePresence>
              </div>
              <p className="mt-auto text-[10px] text-emerald-600 font-black uppercase text-center py-2 bg-emerald-50 rounded-full">Pilotos Comportados ✨</p>
            </div>

            {/* YELLOW ZONE */}
            <div className="bg-amber-100 rounded-[40px] p-6 flex flex-col border-4 border-amber-300 shadow-inner min-h-[450px]">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-amber-400 rounded-full border-4 border-white shadow-md flex items-center justify-center text-white font-black">!</div>
                <h2 className="font-black text-amber-700 text-xl uppercase italic tracking-tight">Atenção</h2>
              </div>
              <div className="grid grid-cols-2 gap-3 pb-8">
                <AnimatePresence>
                  {grouped.yellow.map(s => (
                    <StudentCar key={s.id} student={s} onStatusChange={updateStatus} onDelete={deleteStudent} />
                  ))}
                </AnimatePresence>
              </div>
              <p className="mt-auto text-[10px] text-amber-600 font-black uppercase text-center py-2 bg-amber-50 rounded-full">Reduza a Velocidade! ⚠️</p>
            </div>

            {/* RED ZONE */}
            <div className="bg-rose-100 rounded-[40px] p-6 flex flex-col border-4 border-rose-300 shadow-inner min-h-[450px]">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-rose-500 rounded-full border-4 border-white shadow-md flex items-center justify-center text-white font-black italic">STOP</div>
                <h2 className="font-black text-rose-700 text-xl uppercase italic tracking-tight">Pare</h2>
              </div>
              <div className="grid grid-cols-2 gap-3 pb-8">
                <AnimatePresence>
                  {grouped.red.map(s => (
                    <StudentCar key={s.id} student={s} onStatusChange={updateStatus} onDelete={deleteStudent} />
                  ))}
                </AnimatePresence>
              </div>
              <div className="mt-auto p-4 bg-rose-500 rounded-2xl border-2 border-rose-600 shadow-md">
                <p className="text-[10px] text-white font-black uppercase text-center leading-tight">⚠️ SAÍDA DE PISTA: Conversar no Box (Coordenação)</p>
              </div>
            </div>
          </div>
        </div>

        {/* VIP PARKING AREA */}
        <div className="lg:col-span-4 bg-slate-900 rounded-[3rem] p-8 flex flex-col border-[12px] border-slate-800 shadow-2xl sticky lg:top-24 max-h-[calc(100vh-140px)] overflow-hidden">
          <div className="text-center mb-8">
            <div className="text-5xl mb-3 animate-pulse">🏆</div>
            <h2 className="text-sky-100 font-black text-2xl uppercase tracking-[0.2em] italic leading-none">PÁTIO VIP</h2>
            <p className="text-sky-400 text-xs font-black mt-2 uppercase tracking-tighter">Estacionamento de Excelência</p>
          </div>
          
          <div className="flex-1 space-y-10 overflow-y-auto pr-2 custom-scrollbar lg:pb-10">
            {/* Excellence Area */}
            <div className="relative border-x-4 border-dashed border-slate-700 pt-6 pb-2 min-h-[200px]">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-900 px-4">
                 <span className="text-[10px] font-black text-yellow-400 uppercase tracking-[0.3em] italic">Vagas Premium</span>
              </div>
              <div className="grid grid-cols-2 gap-6 items-center place-items-center mb-4">
                <AnimatePresence>
                  {grouped.excellence.length > 0 ? (
                    grouped.excellence.map(s => (
                      <StudentCar key={s.id} student={s} onStatusChange={updateStatus} onDelete={deleteStudent} isSelected />
                    ))
                  ) : null}
                  {grouped.excellence.length % 2 !== 0 || grouped.excellence.length === 0 ? (
                    <div className="w-20 h-28 border-4 border-dashed border-slate-700/50 rounded-2xl flex flex-col items-center justify-center opacity-40 gap-2 scale-90">
                       <span className="text-[12px] font-black text-slate-500 tracking-widest -rotate-90 origin-center">VAGA</span>
                       <div className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                    </div>
                  ) : null}
                </AnimatePresence>
              </div>
            </div>

            {/* Helper Area */}
            <div className="relative border-x-4 border-dashed border-slate-700 pt-6 pb-2 min-h-[200px]">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-900 px-4">
                 <span className="text-[10px] font-black text-purple-400 uppercase tracking-[0.3em] italic">Ajudantes do Dia</span>
              </div>
              <div className="grid grid-cols-2 gap-6 items-center place-items-center mb-4">
                <AnimatePresence>
                  {grouped.helper.map(s => (
                    <StudentCar key={s.id} student={s} onStatusChange={updateStatus} onDelete={deleteStudent} isSelected />
                  ))}
                  {grouped.helper.length % 2 !== 0 || grouped.helper.length === 0 ? (
                    <div className="w-20 h-28 border-4 border-dashed border-slate-700/50 rounded-2xl flex flex-col items-center justify-center opacity-40 gap-2 scale-90">
                       <span className="text-[12px] font-black text-slate-500 tracking-widest -rotate-90 origin-center">VAGA</span>
                       <div className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                    </div>
                  ) : null}
                </AnimatePresence>
              </div>
            </div>
          </div>

          <div className="mt-auto pt-6 border-t border-slate-800 text-center">
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest leading-tight">
              🏁 Respeite as leis de trânsito escolares!
            </p>
          </div>
        </div>
      </main>

      {/* --- MODALS --- */}

      {/* Classes Modal */}
      <AnimatePresence>
        {showClassesModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[3rem] p-8 max-w-sm w-full shadow-2xl border-8 border-sky-100"
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-xl font-black text-gray-900 uppercase italic">Minhas Turmas</h2>
                <button onClick={() => setShowClassesModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400"><X/></button>
              </div>
              
              <div className="space-y-3 max-h-[300px] overflow-y-auto mb-8 pr-2 custom-scrollbar">
                {classes.map(c => (
                  <div key={c.id} className="flex items-center justify-between bg-sky-50 p-4 rounded-2xl border-2 border-sky-100 group">
                    <span className="font-black text-sky-700 tracking-tight">{c.name}</span>
                    <button onClick={() => deleteClass(c.id)} className="text-rose-400 opacity-0 group-hover:opacity-100 hover:text-rose-600 transition-all p-1"><Trash2 size={16}/></button>
                  </div>
                ))}
              </div>

              <div className="pt-6 border-t-2 border-gray-100">
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Ex: 1º Ano A..." 
                    id="new-class-input"
                    className="flex-1 bg-gray-50 px-4 py-3 rounded-2xl border-2 border-transparent focus:border-sky-400 outline-none text-xs font-black"
                  />
                  <button 
                    onClick={() => {
                      const input = document.getElementById('new-class-input') as HTMLInputElement;
                      addClass(input.value);
                      input.value = '';
                    }}
                    className="bg-sky-500 text-white p-3 rounded-2xl hover:bg-sky-600 transition-all shadow-md"
                  >
                    <Plus size={20}/>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Bulk Add Modal */}
      <AnimatePresence>
        {showBulkAdd && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-indigo-900/80 backdrop-blur-sm">
            <motion.div 
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="bg-white rounded-[3rem] p-8 max-w-lg w-full shadow-2xl border-8 border-indigo-100"
            >
              <h2 className="text-2xl font-black text-indigo-900 uppercase italic mb-2">Importar Turma Inteira</h2>
              <p className="text-gray-500 text-[10px] font-bold mb-8 uppercase tracking-widest">Adicione os nomes (um por linha) e escolha a turma.</p>
              
              {bulkAddSuccess ? (
                <motion.div 
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex flex-col items-center justify-center py-20 gap-4"
                >
                  <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-xl">
                    <Check size={48} strokeWidth={4} />
                  </div>
                  <p className="text-emerald-600 font-black uppercase italic tracking-widest text-xl">Pilotos na Pista!</p>
                </motion.div>
              ) : (
                <div className="space-y-6">
                  <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Nome da Turma:</label>
                  <input 
                    type="text"
                    placeholder="Ex: 1ºA, 2ºB..."
                    value={bulkClassName}
                    onChange={(e) => setBulkClassName(e.target.value)}
                    className="w-full bg-slate-50 px-6 py-4 rounded-2xl border-2 border-indigo-100 outline-none font-black text-indigo-700 shadow-inner"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Lista de Nomes:</label>
                  <textarea 
                    rows={6}
                    placeholder="Ex: João Silva, Maria Oliveira, Pedro Santos..."
                    value={bulkText}
                    onChange={(e) => setBulkText(e.target.value)}
                    className="w-full bg-slate-50 p-6 rounded-[2rem] border-2 border-transparent focus:border-indigo-400 outline-none text-sm font-black shadow-inner resize-none custom-scrollbar"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button onClick={() => setShowBulkAdd(false)} className="flex-1 bg-gray-100 text-gray-500 py-4 rounded-2xl font-black uppercase tracking-[0.2em] hover:bg-gray-200 transition-all italic">Cancelar</button>
                  <button 
                    onClick={handleBulkAdd}
                    disabled={!bulkText.trim() || !bulkClassName.trim() || isSaving}
                    className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl hover:bg-indigo-700 transition-all disabled:opacity-50 italic flex items-center justify-center gap-2"
                  >
                    {isSaving ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        >
                          <Settings size={20} />
                        </motion.div>
                        PROCESSANDO...
                      </>
                    ) : (
                      'LARGADA! 🏁'
                    )}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Red Alert Modal */}
      <AnimatePresence>
        {showAlert && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-rose-900/90 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white rounded-[3rem] border-8 border-rose-500 p-8 max-w-sm w-full shadow-2xl text-center"
            >
              <div className="bg-rose-100 text-rose-600 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                <AlertTriangle size={64} />
              </div>
              <h2 className="text-4xl font-black text-gray-900 mb-2 uppercase italic tracking-tighter">Bandeira Vermelha!</h2>
              <p className="text-xl font-black text-gray-600 mb-8 border-b-4 border-rose-50 pb-4 inline-block tracking-tight italic">
                O piloto <span className="text-rose-600">{showAlert.name}</span> parou.
              </p>
              <div className="bg-rose-50 p-6 rounded-[2rem] mb-10 border-2 border-rose-100">
                <p className="text-lg font-black text-gray-800 leading-tight uppercase underline decoration-rose-300 decoration-4">
                  Dirigir-se ao Box (Coordenação) agora!
                </p>
              </div>
              <button 
                onClick={() => setShowAlert(null)}
                className="w-full bg-rose-500 hover:bg-rose-600 text-white font-black py-5 rounded-2xl shadow-xl transition-all active:scale-95 text-xl uppercase italic tracking-[0.2em] border-b-4 border-rose-800"
              >
                Copiado 🏁
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Helper Legend */}
      <footer className="mt-8 mb-4 max-w-7xl mx-auto px-8 flex flex-wrap justify-between items-center text-sky-600/60 font-black text-[10px] uppercase tracking-[0.2em] gap-4">
        <div className="flex items-center gap-2">
          <span>🏁 Pilotando com Respeito e Atenção</span>
          <span className="w-1 h-1 rounded-full bg-emerald-400"></span>
          <span className="text-[8px]">Nuvem Sincronizada</span>
        </div>
        <div className="flex gap-4">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm"></span> Bom Trabalho</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-sm"></span> Atenção</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm"></span> Parada no Box</span>
        </div>
      </footer>

      {/* Global CSS for Custom Scrollbar */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0,0,0,0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(14, 165, 233, 0.2);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(14, 165, 233, 0.4);
        }
      `}</style>
    </div>
  );
}
