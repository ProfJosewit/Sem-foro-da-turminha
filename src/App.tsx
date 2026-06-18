/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence, Reorder } from 'motion/react';
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
  LogIn,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  writeBatch,
  serverTimestamp 
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
  series: string;
  updatedAt?: any;
}

interface Student {
  id: string;
  name: string;
  classId: string;
  status: BehaviorStatus;
  carColor: string;
  order: number;
  updatedAt?: any;
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

const RacingCar = ({ color = '#94a3b8', size = 32, className = "", showExhaust = false }: { color?: string, size?: number, className?: string, showExhaust?: boolean }) => {
  const poleColor = color || '#94a3b8';
  return (
    <div 
      className={`relative ${className}`} 
      style={{ width: size, height: size * 0.8 }}
    >
      <svg 
        viewBox="0 0 100 80" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-2xl overflow-visible"
      >
        <defs>
          <linearGradient id="flag-green" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00b046" />
            <stop offset="100%" stopColor="#007a30" />
          </linearGradient>
          <linearGradient id="flag-yellow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffee1a" />
            <stop offset="100%" stopColor="#e5c100" />
          </linearGradient>
          <linearGradient id="flag-blue" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2b50f6" />
            <stop offset="100%" stopColor="#001c76" />
          </linearGradient>
          <linearGradient id={`pole-${poleColor.replace('#','')}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={poleColor} />
            <stop offset="30%" stopColor="#ffffff" stopOpacity="0.6" />
            <stop offset="70%" stopColor={poleColor} />
            <stop offset="100%" stopColor="black" stopOpacity="0.4" />
          </linearGradient>
          <filter id="shadow-effect" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="1" dy="3" stdDeviation="1.5" floodOpacity="0.25" />
          </filter>
        </defs>

        {/* Flagpole Base */}
        <ellipse cx="20" cy="74" rx="12" ry="3.5" fill="rgba(0,0,0,0.15)" />
        <path d="M12 74 L28 74 L25 77 L15 77 Z" fill="#64748b" />

        {/* Flagpole with customizable team/class color */}
        <rect x="18" y="6" width="4" height="68" rx="1" fill={`url(#pole-${poleColor.replace('#','')})`} />
        <circle cx="20" cy="5" r="3" fill="#f1f5f9" stroke={poleColor} strokeWidth="1" />

        {/* Elegant colorful tassel hanging from the pole */}
        <path d="M18 12 Q8 14 13 22 Q18 30 10 36" stroke={poleColor} strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.9" />

        {/* Waving Brazil Flag */}
        <g filter="url(#shadow-effect)">
          {/* Main Flag Canvas - Green fabric with waving bezier contour */}
          <path 
            d="M22 12 
               Q38 8, 54 12 
               T86 12 
               L86 48 
               Q70 44, 54 48 
               T22 48 Z" 
            fill="url(#flag-green)" 
            stroke="#00521c"
            strokeWidth="1.5"
          />

          {/* Yellow Diamond */}
          <path 
            d="M30 30 
               Q38 20, 54 20
               Q70 20, 78 30
               Q70 40, 54 40
               Q38 40, 30 30 Z" 
            fill="url(#flag-yellow)" 
          />

          {/* Central Blue Globe */}
          <circle cx="54" cy="30" r="7.5" fill="url(#flag-blue)" />

          {/* White arch (recursively mimicking ORDEM E PROGRESSO) */}
          <path 
            d="M48 33 Q54 28 60 29" 
            stroke="#ffffff" 
            strokeWidth="1.2" 
            strokeLinecap="round" 
            fill="none" 
          />
          
          {/* Constellation stars */}
          <circle cx="51" cy="34" r="0.4" fill="#ffffff" />
          <circle cx="55" cy="33" r="0.4" fill="#ffffff" />
          <circle cx="57" cy="32" r="0.4" fill="#ffffff" />
          <circle cx="53" cy="31" r="0.4" fill="#ffffff" />
          <circle cx="56" cy="35" r="0.3" fill="#ffffff" />
        </g>
      </svg>

      {/* Flag Sparkles/Stars */}
      {showExhaust && (
        <div className="absolute -right-4 top-[20%] -translate-y-1/2 flex flex-col gap-1">
          {[...Array(3)].map((_, i) => (
            <motion.div 
              key={i}
              initial={{ scale: 0, opacity: 0.8 }}
              animate={{ 
                scale: [0.4, 1.2, 0], 
                opacity: [1, 0.7, 0], 
                x: [0, 20, 35],
                y: [0, i * 4 - 4, i * 8 - 8]
              }}
              transition={{ 
                duration: 1.2, 
                repeat: Infinity, 
                delay: i * 0.3,
                ease: "easeOut"
              }}
              className="w-2 h-2 text-amber-400 font-bold select-none pointer-events-none"
            >
              ✨
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

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
  isSaving = false,
  isSelected = false,
  isDraggingCurrently = false,
  onDragStartCustom,
  onDragEndCustom
}: { 
  student: Student, 
  onStatusChange: (id: string, status: BehaviorStatus) => void,
  onDelete: (id: string) => void,
  isSaving?: boolean,
  isSelected?: boolean,
  isDraggingCurrently?: boolean,
  onDragStartCustom?: () => void,
  onDragEndCustom?: () => void,
  key?: React.Key
}) => {
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const getBorderColor = () => {
    switch (student.status) {
      case 'green': return 'border-emerald-500 shadow-emerald-500/20';
      case 'yellow': return 'border-yellow-500 shadow-yellow-500/20';
      case 'red': return 'border-rose-500 shadow-rose-500/20';
      case 'excellence': return 'border-indigo-400 shadow-indigo-400/20';
      case 'helper': return 'border-yellow-400 shadow-yellow-400/30';
      default: return 'border-slate-800';
    }
  };

  const getBgColor = () => {
    if (student.status === 'excellence') return 'bg-gradient-to-br from-indigo-950/80 to-slate-900/90';
    if (student.status === 'helper') return 'bg-gradient-to-br from-yellow-950/50 via-purple-900/70 to-slate-950/90';
    return 'bg-gradient-to-br from-slate-900/90 to-slate-950/95';
  };

  return (
    <motion.div
      layoutId={student.id}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      whileHover={{ y: -6, scale: 1.02 }}
      whileDrag={{ scale: 1.05, shadow: "0 25px 30px -5px rgb(0 0 0 / 0.5)", zIndex: 100 }}
      className={`relative group flex flex-col items-center p-5 rounded-[2.5rem] shadow-xl border-t-2 border-x-2 border-b-[14px] ${getBorderColor()} ${getBgColor()} transition-all hover:shadow-2xl cursor-grab active:cursor-grabbing overflow-visible ${isOptionsOpen ? 'z-50 ring-4 ring-yellow-400 scale-105 shadow-2xl' : 'z-10 hover:z-20'} ${isDraggingCurrently ? 'opacity-30 scale-90 border-dashed border-yellow-400' : ''}`}
      onClick={() => setIsOptionsOpen(!isOptionsOpen)}
      draggable
      onDragStart={(e) => {
        setIsOptionsOpen(false);
        e.dataTransfer.setData("studentId", student.id);
        e.dataTransfer.effectAllowed = "move";
        if (onDragStartCustom) onDragStartCustom();
      }}
      onDragEnd={() => {
        if (onDragEndCustom) onDragEndCustom();
      }}
    >
      <RacingCar 
        color={student.status === 'helper' ? '#FFD700' : student.carColor} 
        size={56} 
        className="mb-3 pointer-events-none" 
        showExhaust={student.status === 'green' || student.status === 'excellence'} 
      />
      <div className="flex flex-col items-center gap-1 pointer-events-none w-full">
        <span className="text-[11px] font-black max-w-[110px] truncate text-center text-white tracking-tight uppercase italic drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
          {student.name}
        </span>
        {student.status === 'helper' && (
          <span className="text-[8px] bg-yellow-400 text-slate-950 font-black px-2 py-0.5 rounded-full uppercase tracking-widest italic scale-90">
            👑 CAPITÃO
          </span>
        )}
      </div>

      <AnimatePresence>
        {isOptionsOpen && (
          <>
            <div className="fixed inset-0 z-50" onClick={(e) => { e.stopPropagation(); setIsOptionsOpen(false); }} />
            <motion.div 
              initial={{ opacity: 0, y: 15, scale: 0.85 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.85 }}
              className="absolute top-full mt-4 z-[60] bg-slate-950/95 shadow-[0_20px_40px_rgba(0,0,0,0.8)] rounded-[2.5rem] p-5 border-4 border-yellow-400/80 flex flex-col items-center gap-4 left-1/2 -translate-x-1/2 whitespace-nowrap min-w-[280px]"
              onClick={(e) => e.stopPropagation()}
            >
              <span className="text-[10px] font-black text-yellow-400 uppercase tracking-widest italic border-b border-slate-800 pb-2 w-full text-center">
                🏆 ALTERAR POSIÇÃO NO PÓDIO
              </span>

              {/* Champion Podium Selector */}
              <div className="flex items-end gap-3 justify-center h-28 px-1 pb-1">
                {/* 2o Lugar - Reservas */}
                <div className="flex flex-col items-center">
                  <span className="text-[8px] font-black text-amber-500 uppercase italic mb-0.5">2º Lugar</span>
                  <button 
                    title="Mudar para Reservas" 
                    onClick={() => { onStatusChange(student.id, 'yellow'); setIsOptionsOpen(false); }} 
                    className="w-16 h-16 rounded-t-xl bg-gradient-to-b from-yellow-400 via-amber-500 to-amber-700 text-slate-950 font-extrabold flex flex-col items-center justify-between py-2 hover:scale-105 shadow-md transition-transform active:scale-95 border border-white/20"
                  >
                    <span className="text-sm">🥈</span>
                    <span className="text-[8px] uppercase tracking-tighter">RESERVA</span>
                  </button>
                </div>

                {/* 1o Lugar - Titulares */}
                <div className="flex flex-col items-center">
                  <span className="text-[9px] font-black text-yellow-400 uppercase italic mb-0.5 animate-pulse">1º Lugar</span>
                  <button 
                    title="Mudar para Titulares" 
                    onClick={() => { onStatusChange(student.id, 'green'); setIsOptionsOpen(false); }} 
                    className="w-20 h-20 rounded-t-xl bg-gradient-to-b from-emerald-400 via-green-500 to-green-700 text-white font-extrabold flex flex-col items-center justify-between py-2 hover:scale-105 shadow-xl transition-transform active:scale-95 border-2 border-yellow-400"
                  >
                    <span className="text-base">🥇</span>
                    <span className="text-[9px] uppercase tracking-tighter">TITULAR</span>
                  </button>
                </div>

                {/* 3o Lugar - Área Técnica */}
                <div className="flex flex-col items-center">
                  <span className="text-[8px] font-black text-rose-400 uppercase italic mb-0.5">3º Lugar</span>
                  <button 
                    title="Mudar para Área Técnica" 
                    onClick={() => { onStatusChange(student.id, 'red'); setIsOptionsOpen(false); }} 
                    className="w-16.5 h-12 rounded-t-xl bg-gradient-to-b from-rose-500 via-red-600 to-red-800 text-white font-extrabold flex flex-col items-center justify-between py-1.5 hover:scale-105 shadow-md transition-transform active:scale-95 border border-white/25"
                  >
                    <span className="text-xs">🥉</span>
                    <span className="text-[8px] uppercase tracking-tighter">TÉCNICO</span>
                  </button>
                </div>
              </div>

              {/* Extras and Actions */}
              <div className="flex items-center gap-2.5 w-full border-t border-slate-900 pt-3">
                <button 
                  title="Tornar Capitão do Time" 
                  onClick={() => { onStatusChange(student.id, 'helper'); setIsOptionsOpen(false); }} 
                  className="flex-1 h-9 px-3 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-[9px] font-black uppercase italic shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5"
                >
                  👑 CAPITÃO
                </button>
                
                <button 
                  title="Excluir Jogador" 
                  disabled={isSaving}
                  onClick={() => setConfirmDelete(!confirmDelete)} 
                  className={`w-9 h-9 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95 disabled:opacity-50 ${confirmDelete ? 'bg-rose-600 text-white animate-pulse' : 'bg-slate-800 text-rose-400 hover:bg-slate-700'}`}
                >
                  {isSaving && confirmDelete ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Trash2 size={15} strokeWidth={3} />
                  )}
                </button>

                {confirmDelete && (
                  <button 
                    onClick={() => { onDelete(student.id); setIsOptionsOpen(false); setConfirmDelete(false); }}
                    className="bg-rose-600 text-white text-[8px] font-black px-3 py-2 rounded-full uppercase italic animate-pulse"
                  >
                    OK?
                  </button>
                )}
              </div>
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
  const [selectedSeries, setSelectedSeries] = useState<string>('all');
  const [isSaving, setIsSaving] = useState(false);
  const [showClassesModal, setShowClassesModal] = useState(false);
  const [showBulkAdd, setShowBulkAdd] = useState(false);
  const [bulkAddSuccess, setBulkAddSuccess] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(CAR_COLORS[3].value);
  const [bulkText, setBulkText] = useState('');
  const [bulkClassName, setBulkClassName] = useState('');
  const [bulkSeries, setBulkSeries] = useState('');
  const [newClassSeries, setNewClassSeries] = useState('');
  const [showAlert, setShowAlert] = useState<{name: string} | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [dragOverZone, setDragOverZone] = useState<'green' | 'yellow' | 'red' | 'helper' | null>(null);

  const [confirmingDeleteClass, setConfirmingDeleteClass] = useState<string | null>(null);
  const [confirmingDeleteAll, setConfirmingDeleteAll] = useState(false);
  const [confirmingReset, setConfirmingReset] = useState(false);

  // Auto-fix stale selected class
  useEffect(() => {
    if (selectedClassId !== 'all' && classes.length > 0) {
      if (!classes.some(c => c.id === selectedClassId)) {
        console.log("Fixing stale class selection");
        setSelectedClassId('all');
      }
    }
  }, [classes, selectedClassId]);

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
      console.error("Firestore Classes Error:", err);
      setGlobalError("Erro ao carregar turmas.");
      classesDone = true;
      checkDone();
    });

    const unsubStudents = onSnapshot(collection(db, 'students'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student));
      setStudents(data);
      studentsDone = true;
      checkDone();
    }, (err) => {
      console.error("Firestore Students Error:", err);
      setGlobalError("Erro ao carregar estudantes.");
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
      carColor: newColor,
      order: students.length,
      updatedAt: serverTimestamp()
    };
    
    try {
      await setDoc(doc(db, 'students', id), newStudent);
      setNewName('');
      setGlobalError(null);
    } catch (err) {
      setGlobalError("Erro ao salvar estudante. Verifique a conexão.");
      handleFirestoreError(err, OperationType.WRITE, `students/${id}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleBulkAdd = async () => {
    const classNameClean = bulkClassName.trim();
    const seriesClean = bulkSeries.trim() || 'Geral';
    const textClean = bulkText.trim();

    if (!classNameClean) {
      setGlobalError("Por favor, digite o nome da turma.");
      return;
    }
    if (!textClean) {
      setGlobalError("Por favor, digite a lista de nomes.");
      return;
    }
    
    setIsSaving(true);
    setGlobalError(null);
    
    try {
      const batch = writeBatch(db);
      let targetClassId = '';
      
      const existingClass = classes.find(c => 
        c.name.toLowerCase() === classNameClean.toLowerCase() && 
        (c.series?.toLowerCase() === seriesClean.toLowerCase())
      );
      
      if (existingClass) {
        targetClassId = existingClass.id;
      } else {
        targetClassId = generateId();
        const newClass = { 
          id: targetClassId, 
          name: classNameClean, 
          series: seriesClean,
          updatedAt: serverTimestamp()
        };
        batch.set(doc(db, 'classes', targetClassId), newClass);
      }

      // splitting by new line, comma, semicolon or tab
      const names = textClean.split(/[\n,;\t]/).map(n => n.trim()).filter(n => n.length > 0);
      
      if (names.length === 0) {
        throw new Error("Nenhum nome válido encontrado na lista.");
      }

      names.forEach((name, index) => {
        const studentId = generateId();
        batch.set(doc(db, 'students', studentId), {
          id: studentId,
          name: name,
          classId: targetClassId,
          status: 'green',
          carColor: CAR_COLORS[Math.floor(Math.random() * CAR_COLORS.length)].value,
          order: students.length + index,
          updatedAt: serverTimestamp()
        });
      });

      await batch.commit();
      
      setBulkText('');
      setBulkClassName('');
      setBulkSeries('');
      setSelectedSeries(seriesClean);
      setSelectedClassId(targetClassId);
      setShowBulkAdd(false);
      
    } catch (err) {
      console.error("Erro no Bulk Add:", err);
      setGlobalError("Erro ao salvar! Verifique se os nomes estão corretos.");
      handleFirestoreError(err, OperationType.WRITE, 'bulk-add');
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
      setGlobalError(null);
      await updateDoc(doc(db, 'students', id), { 
        status,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      setGlobalError("Erro ao atualizar status.");
      handleFirestoreError(err, OperationType.UPDATE, `students/${id}`);
    } finally {
      setIsSaving(false);
    }
  };

  const deleteStudent = async (id: string) => {
    try {
      setIsSaving(true);
      setGlobalError(null);
      await deleteDoc(doc(db, 'students', id));
    } catch (err: any) {
      console.error("Erro ao excluir estudante:", err);
      setGlobalError("Erro ao remover estudante. Tente novamente.");
      handleFirestoreError(err, OperationType.DELETE, `students/${id}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReorder = async (newList: Student[]) => {
    const batch = writeBatch(db);
    let changed = false;
    
    newList.forEach((s, idx) => {
      if (s.order !== idx) {
        batch.update(doc(db, 'students', s.id), { 
          order: idx,
          updatedAt: serverTimestamp() 
        });
        changed = true;
      }
    });

    if (changed) {
      try {
        await batch.commit();
      } catch (err) {
        console.error("Erro ao salvar nova ordem:", err);
      }
    }
  };

  const resetAll = async () => {
    setIsSaving(true);
    setGlobalError(null);
    try {
      const batch = writeBatch(db);
      const toReset = currentStudents.filter(s => s.status !== 'green');
      
      toReset.forEach(s => {
        batch.update(doc(db, 'students', s.id), { 
          status: 'green',
          updatedAt: serverTimestamp() 
        });
      });
      
      await batch.commit();
      setConfirmingReset(false);
    } catch (err: any) {
      console.error("Erro ao resetar:", err);
      setGlobalError("Erro ao reiniciar a turma. Tente novamente.");
      handleFirestoreError(err, OperationType.WRITE, 'batch-reset');
    } finally {
      setIsSaving(false);
    }
  };

  const addClass = async (name: string, series: string) => {
    if (!name.trim()) {
      setGlobalError("Nome da turma é obrigatório.");
      return;
    }
    const finalSeries = series.trim() || 'Geral';
    setIsSaving(true);
    const id = generateId();
    try {
      await setDoc(doc(db, 'classes', id), { 
        id, 
        name: name.trim(), 
        series: finalSeries,
        updatedAt: serverTimestamp()
      });
      setGlobalError(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `classes/${id}`);
    } finally {
      setIsSaving(false);
    }
  };

  const deleteClass = async (id: string) => {
    setIsSaving(true);
    setGlobalError(null);
    try {
      const batch = writeBatch(db);
      const studentsToDelete = students.filter(s => s.classId === id);
      
      studentsToDelete.forEach(s => {
        batch.delete(doc(db, 'students', s.id));
      });
      batch.delete(doc(db, 'classes', id));
      
      await batch.commit();
      setConfirmingDeleteClass(null);
      if (selectedClassId === id) setSelectedClassId('all');
    } catch (err: any) {
      console.error("Erro ao excluir turma:", err);
      setGlobalError("Erro ao excluir turma. Verifique sua conexão.");
      handleFirestoreError(err, OperationType.WRITE, 'batch-delete-class');
    } finally {
      setIsSaving(false);
    }
  };

  const deleteAllData = async () => {
    setIsSaving(true);
    setGlobalError(null);
    try {
      const batch = writeBatch(db);
      students.forEach(s => batch.delete(doc(db, 'students', s.id)));
      classes.forEach(c => batch.delete(doc(db, 'classes', c.id)));
      await batch.commit();
      setConfirmingDeleteAll(false);
      setSelectedClassId('all');
      setSelectedSeries('all');
      setShowClassesModal(false);
    } catch (err: any) {
      console.error("Erro ao apagar tudo:", err);
      setGlobalError("Erro ao apagar todos os dados.");
      handleFirestoreError(err, OperationType.WRITE, 'bulk-delete-all');
    } finally {
      setIsSaving(false);
    }
  };

  const seriesList = useMemo(() => {
    const s = new Set<string>();
    classes.forEach(c => {
      if (c.series) s.add(c.series);
    });
    return Array.from(s).sort();
  }, [classes]);

  const currentStudents = useMemo(() => {
    let filtered = students;
    if (selectedSeries !== 'all') {
      const classIdsInSeries = classes.filter(c => c.series === selectedSeries).map(c => c.id);
      filtered = filtered.filter(s => classIdsInSeries.includes(s.classId));
    }
    if (selectedClassId !== 'all') {
      filtered = filtered.filter(s => s.classId === selectedClassId);
    }
    return filtered.sort((a, b) => {
      const orderA = a.order ?? 0;
      const orderB = b.order ?? 0;
      if (orderA !== orderB) return orderA - orderB;
      return a.name.localeCompare(b.name);
    });
  }, [students, selectedClassId, selectedSeries, classes]);

  const grouped = {
    green: currentStudents.filter(s => s.status === 'green'),
    yellow: currentStudents.filter(s => s.status === 'yellow'),
    red: currentStudents.filter(s => s.status === 'red'),
    excellence: currentStudents.filter(s => s.status === 'excellence'),
    helper: currentStudents.filter(s => s.status === 'helper'),
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-tr from-sky-950 via-slate-900 to-emerald-950 flex flex-col items-center justify-center p-8 overflow-hidden">
        {/* Animated Background Atmosphere */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 blur-[120px] rounded-full animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-yellow-500/10 blur-[120px] rounded-full animate-pulse delay-700" />
        </div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="relative w-full max-w-2xl h-80 flex flex-col justify-center items-center gap-12"
        >
          {/* Sky Board Frame */}
          <div className="absolute inset-0 bg-gradient-to-b from-sky-900/60 to-slate-900/40 rounded-[3rem] border-8 border-sky-500/20 shadow-2xl overflow-hidden flex flex-col justify-center">
            {/* Soft Sun/Stars Glow in Loading */}
            <div className="absolute top-8 left-12 w-24 h-24 bg-yellow-300/10 rounded-full blur-2xl" />
            
            {/* Animated Clouds */}
            <motion.div 
              animate={{ x: [-120, 680] }}
              transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
              className="absolute text-5xl opacity-10 select-none pointer-events-none"
              style={{ top: '15%' }}
            >
              ☁️
            </motion.div>
            <motion.div 
              animate={{ x: [680, -120] }}
              transition={{ duration: 24, repeat: Infinity, ease: "linear" }}
              className="absolute text-6xl opacity-10 select-none pointer-events-none"
              style={{ bottom: '20%' }}
            >
              ☁️
            </motion.div>
          </div>

          {/* Majestic Waving Large Brazil Flag */}
          <div className="relative z-10 w-full flex justify-center mt-6">
             <motion.div
               animate={{ 
                 y: [0, -6, 6, 0],
                 rotate: [0, 1.5, -1.5, 0]
               }}
               transition={{ 
                 y: { duration: 2.2, repeat: Infinity, ease: "easeInOut" },
                 rotate: { duration: 1.8, repeat: Infinity, ease: "easeInOut" }
               }}
             >
                <RacingCar color="#10b981" size={130} showExhaust={true} />
             </motion.div>
          </div>

          <div className="text-center z-10">
            <motion.div 
              animate={{ opacity: [0.7, 1, 0.7], y: [0, -2, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="flex flex-col items-center gap-3"
            >
              <h2 className="text-white font-black text-3xl uppercase italic tracking-[0.2em] drop-shadow-2xl flex items-center gap-3">
                <span className="text-yellow-400">Pátria</span> Educadora
              </h2>
              <div className="flex gap-1.5 mt-1">
                 {[...Array(4)].map((_, i) => (
                   <motion.div 
                    key={i}
                    animate={{ scale: [1, 1.6, 1], opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
                    className="w-2.5 h-2.5 rounded-full bg-emerald-400 border border-emerald-300"
                   />
                 ))}
              </div>
            </motion.div>
            <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.4em] mt-6 opacity-75">Hasteando as Atividades...</p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-950 via-slate-900 to-black font-sans text-slate-100 pb-20 relative overflow-hidden">
      {/* Stadium Pitch Lines Overlays */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none select-none overflow-hidden">
        {/* Field center circle */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border-8 border-white" />
        {/* Center line */}
        <div className="absolute top-1/2 left-0 right-0 h-2 bg-white -translate-y-1/2" />
        {/* Penalty areas */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[200px] border-b-8 border-x-8 border-white" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[200px] border-t-8 border-x-8 border-white" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 bg-gradient-to-r from-emerald-900 via-emerald-950 to-slate-950 border-b-6 border-yellow-500 shadow-2xl p-4 md:px-8">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-green-400 to-sky-400 tracking-tighter flex items-center gap-3 italic">
              <span className="text-3xl animate-bounce">⚽</span> COPA DO MUNDO DA TURMINHA
            </h1>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <select 
                value={selectedSeries}
                onChange={(e) => {
                  setSelectedSeries(e.target.value);
                  setSelectedClassId('all');
                }}
                className="bg-emerald-900/60 px-3 py-1.5 rounded-xl border-2 border-emerald-500 outline-none text-xs font-black text-yellow-300 cursor-pointer hover:bg-emerald-800 transition-colors shadow-sm"
              >
                <option value="all">Série: Todas</option>
                {seriesList.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <select 
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="bg-emerald-950/80 px-3 py-1.5 rounded-xl border-2 border-emerald-500 outline-none text-xs font-black text-white cursor-pointer hover:bg-emerald-900 transition-colors shadow-sm"
              >
                <option value="all">Escalar Turma: Todas</option>
                {classes.filter(c => selectedSeries === 'all' || c.series === selectedSeries).map(c => (
                  <option key={c.id} value={c.id}>{c.name} {c.series ? `(${c.series})` : ''}</option>
                ))}
              </select>
              <button 
                onClick={() => setShowClassesModal(true)}
                className="text-yellow-400 hover:text-yellow-500 hover:scale-110 transition-transform"
                title="Editar Turmas / Times"
              >
                <Settings size={18} />
              </button>
              {isSaving && (
                <motion.span 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-[10px] font-black text-yellow-400 uppercase tracking-widest animate-pulse"
                >
                  Gravando tática...
                </motion.span>
              )}
              {globalError && (
                <motion.span 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-[10px] font-black text-rose-400 uppercase tracking-widest"
                >
                  {globalError}
                </motion.span>
              )}
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-4">
            <div className="bg-yellow-400/10 px-5 py-2 rounded-2xl border-2 border-yellow-500/50 hidden sm:flex items-center gap-2">
              <span className="text-yellow-400 font-extrabold text-sm uppercase tracking-wider">Jogadores:</span>
              <span className="text-white font-black text-lg">{currentStudents.length}</span>
            </div>
 
            <button 
              onClick={() => setShowBulkAdd(true)}
              className="bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-slate-950 px-4 py-2 rounded-xl text-sm font-black flex items-center gap-2 shadow-lg transition-all active:scale-95 border-b-4 border-amber-800"
            >
              <Upload size={18} />+ Convocar Turma
            </button>
 
            <button 
              onClick={() => setConfirmingReset(!confirmingReset)}
              className={`border-2 p-2 rounded-xl transition-all shadow-sm active:scale-95 flex items-center gap-2 overflow-hidden ${confirmingReset ? 'bg-amber-500 border-amber-600 text-white px-4' : 'bg-slate-800/80 border-emerald-500/30 text-yellow-400 hover:bg-slate-700'}`}
              title="Apito Final (Resetar Partida)"
            >
              <RotateCcw size={20} className={confirmingReset ? 'animate-spin' : ''} />
              {confirmingReset && <span onClick={(e) => { e.stopPropagation(); resetAll(); }} className="text-[10px] font-black uppercase">Apito Inicial (Reset)?</span>}
            </button>
 
            {selectedClassId !== 'all' && (
              <button 
                onClick={() => setConfirmingDeleteClass(confirmingDeleteClass === selectedClassId ? null : selectedClassId)}
                disabled={isSaving}
                className={`border-2 p-2 rounded-xl transition-all shadow-sm active:scale-95 disabled:opacity-50 flex items-center gap-2 overflow-hidden ${confirmingDeleteClass === selectedClassId ? 'bg-rose-900 border-rose-700 text-white px-4' : 'bg-rose-950/50 border-rose-900/40 text-rose-400 hover:bg-rose-900/30'}`}
                title="Dispensar Time"
              >
                {isSaving && confirmingDeleteClass === selectedClassId ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Trash2 size={20} />
                    {confirmingDeleteClass === selectedClassId && (
                      <span onClick={(e) => { e.stopPropagation(); deleteClass(selectedClassId); }} className="text-[10px] font-black uppercase whitespace-nowrap">Dispensar Time?</span>
                    )}
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </header>
 
      <main className="max-w-7xl mx-auto px-4 md:px-8 mt-8 flex flex-col gap-8 relative z-10">
        
        {/* TOP HONORS: CAPITÃES E CONVOCADOS DO DIA */}
        <section className="w-full">
          <div 
            onDragOver={(e) => e.preventDefault()}
            onDragEnter={() => setDragOverZone('helper')}
            onDragLeave={() => setDragOverZone(null)}
            onDrop={async (e) => {
              e.preventDefault();
              setDragOverZone(null);
              const studentId = e.dataTransfer.getData("studentId");
              if (studentId) {
                await updateStatus(studentId, 'helper');
              }
            }}
            className={`bg-gradient-to-b from-slate-900 to-emerald-950 rounded-[3rem] p-8 flex flex-col border-[12px] shadow-3xl relative overflow-hidden text-white transition-all duration-300 ${dragOverZone === 'helper' ? 'border-yellow-500 shadow-[0_0_40px_rgba(234,179,8,0.3)]' : 'border-slate-800'}`}
          >
            {/* Background Decorative Elements */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-yellow-500/10 blur-[120px] rounded-full translate-y-1/2 -translate-x-1/2" />
            
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8 relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-amber-600 rounded-2xl flex items-center justify-center shadow-lg transform rotate-3 hover:rotate-0 transition-transform duration-300 ring-4 ring-yellow-400/30">
                  <Trophy size={32} className="text-slate-950" />
                </div>
                <div className="flex flex-col">
                  <h2 className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-amber-400 font-black text-3xl uppercase tracking-tighter italic leading-none">CAPITÃES E AUXILIARES</h2>
                  <p className="text-emerald-400 text-xs font-black mt-2 uppercase tracking-widest italic">Os Grandes Medalhistas e Líderes da Aula</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 bg-emerald-950/60 px-6 py-3 rounded-2xl border border-emerald-500/20 backdrop-blur-sm">
                <div className="text-yellow-400 animate-pulse">🏆</div>
                <span className="text-[10px] font-black text-emerald-300 uppercase tracking-[0.2em] italic">Ordem Tática / Atividades</span>
                <div className="text-yellow-400 animate-pulse">🏆</div>
              </div>
            </div>
            
            <div className="relative border-y-4 border-dashed border-emerald-500/20 py-8 min-h-[220px] bg-slate-950/60 rounded-[2rem] shadow-inner">
              <div className="w-full overflow-x-auto pb-4 px-6 custom-scrollbar">
                {selectedClassId === 'all' ? (
                  <div className="flex gap-12 items-start py-4">
                    {classes.map(cls => {
                      const classHelpers = grouped.helper.filter(h => h.classId === cls.id);
                      if (classHelpers.length === 0) return null;
                      return (
                        <div key={cls.id} className="flex flex-col gap-6 items-center shrink-0 min-w-[200px] border-r-2 border-dashed border-emerald-800 pr-12 last:pr-0">
                          <span className="bg-emerald-900 border border-emerald-600 px-4 py-1.5 rounded-full text-[10px] font-black text-yellow-300 uppercase tracking-widest italic shadow-sm">{cls.name}</span>
                          <Reorder.Group axis="x" values={classHelpers} onReorder={handleReorder} className="flex gap-6 items-center">
                            <AnimatePresence mode="popLayout">
                              {classHelpers.map(s => (
                                <Reorder.Item 
                                  key={s.id} 
                                  value={s} 
                                  initial={{ opacity: 0, scale: 0.8 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.8 }}
                                >
                                  <StudentCar 
                                    student={s} 
                                    onStatusChange={updateStatus} 
                                    onDelete={deleteStudent} 
                                    isSaving={isSaving}
                                    isSelected 
                                    isDraggingCurrently={activeDragId === s.id}
                                    onDragStartCustom={() => setActiveDragId(s.id)}
                                    onDragEndCustom={() => setActiveDragId(null)}
                                  />
                                </Reorder.Item>
                              ))}
                            </AnimatePresence>
                          </Reorder.Group>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <Reorder.Group axis="x" values={grouped.helper} onReorder={handleReorder} className="flex gap-8 items-center py-4 px-4 overflow-x-auto min-h-[160px]">
                    <AnimatePresence mode="popLayout">
                      {grouped.helper.map(s => (
                        <Reorder.Item 
                          key={s.id} 
                          value={s}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                        >
                          <StudentCar 
                            student={s} 
                            onStatusChange={updateStatus} 
                            onDelete={deleteStudent} 
                            isSaving={isSaving}
                            isSelected 
                            isDraggingCurrently={activeDragId === s.id}
                            onDragStartCustom={() => setActiveDragId(s.id)}
                            onDragEndCustom={() => setActiveDragId(null)}
                          />
                        </Reorder.Item>
                      ))}
                    </AnimatePresence>
                  </Reorder.Group>
                )}
                
                {grouped.helper.length === 0 && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.1 }}
                    className="flex flex-col items-center justify-center p-12 w-full"
                  >
                    <HandHelping size={64} className="mb-4" />
                    <p className="text-xl font-black uppercase italic tracking-widest">Nenhum ajudante escalado hoje</p>
                  </motion.div>
                )}
              </div>
            </div>
            
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 px-4">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                <p className="text-[10px] text-purple-300 font-black uppercase italic tracking-widest">
                  ✨ Estrelas da Classe: Prontos para colaborar!
                </p>
              </div>
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-tight italic">
                🏁 Arraste para mudar a ordem dos ajudantes
              </p>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ACTION PANEL */}
          <div className="lg:col-span-12 flex flex-col gap-8">
            {/* Add Student Form */}
            {selectedClassId !== 'all' ? (
              <form onSubmit={addStudent} className="bg-slate-900/80 p-8 rounded-[3rem] border-4 border-emerald-500/30 shadow-2xl flex flex-col lg:flex-row gap-8 items-center relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full translate-x-1/2 -translate-y-1/2 group-hover:scale-110 transition-transform duration-500" />
                
                <div className="flex-1 flex flex-col gap-3 w-full relative z-10">
                  <div className="flex items-center gap-2 px-2 text-yellow-400">
                    <UserPlus size={16} />
                    <label className="text-[10px] font-black uppercase tracking-widest text-emerald-300">Convocar Novo Craque para a Seleção:</label>
                  </div>
                  <input 
                    type="text" 
                    placeholder="Ex: Neymar Jr. / Marta Vieira..." 
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full bg-slate-950/80 text-white placeholder-slate-500 px-6 py-4 rounded-[1.5rem] border-2 border-emerald-500/20 focus:border-yellow-400 outline-none text-base font-black shadow-inner transition-all"
                  />
                </div>
                <div className="flex flex-col gap-3 relative z-10 shrink-0">
                  <label className="text-[10px] font-black text-emerald-300 uppercase tracking-widest text-center">Cor da Bandeira:</label>
                  <div className="p-3 bg-slate-950/80 rounded-[1.5rem] border border-emerald-500/20">
                    <ColorPicker selected={newColor} onSelect={setNewColor} />
                  </div>
                </div>
                <button 
                  type="submit"
                  disabled={!newName.trim() || isSaving}
                  className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 disabled:opacity-50 text-white px-10 py-5 rounded-[1.5rem] font-black shadow-lg hover:shadow-emerald-900/50 transition-all active:scale-95 flex items-center gap-3 border-b-6 border-emerald-700 self-stretch lg:self-end mt-4 lg:mt-0 relative z-10"
                >
                  <Plus size={28} strokeWidth={3} /> <span className="text-lg">CORES EM CAMPO! ⚽</span>
                </button>
              </form>
            ) : (
              <div className="bg-emerald-950/20 p-8 rounded-[3rem] border-4 border-dashed border-emerald-500/20 text-center flex flex-col items-center gap-4">
                <Users size={32} className="text-yellow-400" />
                <p className="text-emerald-400 font-black text-base uppercase italic tracking-[0.1em]">
                  ⚽ Selecione uma turma ou time no cabeçalho para gerenciar os craques convocados!
                </p>
              </div>
            )}

            {/* BEHAVIOR ZONES (MAIN TRACKS) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* GREEN ZONE */}
              <div 
                onDragOver={(e) => e.preventDefault()}
                onDragEnter={() => setDragOverZone('green')}
                onDragLeave={() => setDragOverZone(null)}
                onDrop={async (e) => {
                  e.preventDefault();
                  setDragOverZone(null);
                  const studentId = e.dataTransfer.getData("studentId");
                  if (studentId) {
                    await updateStatus(studentId, 'green');
                  }
                }}
                className={`bg-gradient-to-b from-emerald-950/60 via-slate-900/80 to-slate-950/90 rounded-[3rem] p-8 flex flex-col border-4 shadow-xl min-h-[600px] transition-all duration-300 relative overflow-visible group ${dragOverZone === 'green' ? 'border-emerald-400 ring-4 ring-emerald-500/35 scale-[1.01] shadow-[0_0_35px_rgba(16,185,129,0.4)] bg-emerald-900/30' : 'border-emerald-500'}`}
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full pointer-events-none" />
                <div className="flex items-center justify-between mb-8 relative z-10">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl border-4 border-white shadow-[0_8px_0_0_rgb(16,185,129)] flex items-center justify-center text-white font-black italic text-2xl">🟢</div>
                    <div>
                      <h2 className="font-black text-emerald-400 text-2xl uppercase italic tracking-tight leading-none">TITULARES</h2>
                      <p className="text-emerald-300/60 text-[10px] font-black mt-1 uppercase italic">Foco Total & Fair Play</p>
                    </div>
                  </div>
                  <span className="text-2xl opacity-60">🏆</span>
                </div>
                <div className="grid grid-cols-2 gap-5 pb-8 flex-1 content-start relative z-10">
                  <AnimatePresence mode="popLayout">
                    {grouped.green.map(s => (
                      <StudentCar 
                        key={s.id} 
                        student={s} 
                        onStatusChange={updateStatus} 
                        onDelete={deleteStudent} 
                        isSaving={isSaving}
                        isDraggingCurrently={activeDragId === s.id}
                        onDragStartCustom={() => setActiveDragId(s.id)}
                        onDragEndCustom={() => setActiveDragId(null)}
                      />
                    ))}
                  </AnimatePresence>
                </div>
                <div className="mt-auto space-y-4 relative z-10">
                  <div className="h-1 bg-emerald-500/20 w-full rounded-full" />
                  <p className="text-[11px] text-emerald-400 font-extrabold uppercase text-center py-3 bg-emerald-950/60 rounded-[1.5rem] border-2 border-emerald-500/30 tracking-tight shadow-sm">
                    ⭐ Jogadores com conduta exemplar em campo!
                  </p>
                </div>
              </div>

              {/* YELLOW ZONE */}
              <div 
                onDragOver={(e) => e.preventDefault()}
                onDragEnter={() => setDragOverZone('yellow')}
                onDragLeave={() => setDragOverZone(null)}
                onDrop={async (e) => {
                  e.preventDefault();
                  setDragOverZone(null);
                  const studentId = e.dataTransfer.getData("studentId");
                  if (studentId) {
                    await updateStatus(studentId, 'yellow');
                  }
                }}
                className={`bg-gradient-to-b from-amber-950/60 via-slate-900/80 to-slate-950/90 rounded-[3rem] p-8 flex flex-col border-4 shadow-xl min-h-[600px] transition-all duration-300 relative overflow-visible ${dragOverZone === 'yellow' ? 'border-yellow-400 ring-4 ring-yellow-500/35 scale-[1.01] shadow-[0_0_35px_rgba(245,158,11,0.4)] bg-amber-950/30' : 'border-yellow-500'}`}
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/5 rounded-full pointer-events-none" />
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-2xl border-4 border-white shadow-[0_8px_0_0_rgb(245,158,11)] flex items-center justify-center text-slate-950 font-black italic text-2xl">🟨</div>
                    <div>
                      <h2 className="font-black text-yellow-400 text-2xl uppercase italic tracking-tight leading-none">RESERVAS</h2>
                      <p className="text-yellow-300/60 text-[10px] font-black mt-1 uppercase italic">Atenção e Concentração</p>
                    </div>
                  </div>
                  <span className="text-2xl opacity-60">⚠️</span>
                </div>
                <div className="grid grid-cols-2 gap-5 pb-8 flex-1 content-start">
                  <AnimatePresence mode="popLayout">
                    {grouped.yellow.map(s => (
                      <StudentCar 
                        key={s.id} 
                        student={s} 
                        onStatusChange={updateStatus} 
                        onDelete={deleteStudent} 
                        isSaving={isSaving}
                        isDraggingCurrently={activeDragId === s.id}
                        onDragStartCustom={() => setActiveDragId(s.id)}
                        onDragEndCustom={() => setActiveDragId(null)}
                      />
                    ))}
                  </AnimatePresence>
                </div>
                <div className="mt-auto space-y-4">
                  <div className="h-1 bg-yellow-500/20 w-full rounded-full" />
                  <p className="text-[11px] text-yellow-400 font-extrabold uppercase text-center py-3 bg-slate-900/60 rounded-[1.5rem] border-2 border-yellow-500/30 tracking-tight shadow-sm">
                    🟨 Alerta! Foco no treino para voltar ao jogo.
                  </p>
                </div>
              </div>

              {/* RED ZONE */}
              <div 
                onDragOver={(e) => e.preventDefault()}
                onDragEnter={() => setDragOverZone('red')}
                onDragLeave={() => setDragOverZone(null)}
                onDrop={async (e) => {
                  e.preventDefault();
                  setDragOverZone(null);
                  const studentId = e.dataTransfer.getData("studentId");
                  if (studentId) {
                    await updateStatus(studentId, 'red');
                  }
                }}
                className={`bg-gradient-to-b from-rose-950/60 via-slate-900/80 to-slate-950/90 rounded-[3rem] p-8 flex flex-col border-4 shadow-xl min-h-[600px] transition-all duration-300 relative overflow-visible ${dragOverZone === 'red' ? 'border-rose-400 ring-4 ring-rose-500/35 scale-[1.01] shadow-[0_0_35px_rgba(225,29,72,0.4)] bg-rose-950/30' : 'border-rose-500'}`}
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full pointer-events-none" />
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-rose-500 to-rose-600 rounded-2xl border-4 border-white shadow-[0_8px_0_0_rgb(225,29,72)] flex items-center justify-center text-white font-black italic text-2xl">🟥</div>
                    <div>
                      <h2 className="font-black text-rose-400 text-2xl uppercase italic tracking-tight leading-none">ÁREA TÉCNICA</h2>
                      <p className="text-rose-300/60 text-[10px] font-black mt-1 uppercase italic">Recuperando Energia</p>
                    </div>
                  </div>
                  <span className="text-2xl opacity-60">🚨</span>
                </div>
                <div className="grid grid-cols-2 gap-5 pb-8 flex-1 content-start">
                  <AnimatePresence mode="popLayout">
                    {grouped.red.map(s => (
                      <StudentCar 
                        key={s.id} 
                        student={s} 
                        onStatusChange={updateStatus} 
                        onDelete={deleteStudent} 
                        isSaving={isSaving}
                        isDraggingCurrently={activeDragId === s.id}
                        onDragStartCustom={() => setActiveDragId(s.id)}
                        onDragEndCustom={() => setActiveDragId(null)}
                      />
                    ))}
                  </AnimatePresence>
                </div>
                <div className="mt-auto space-y-4">
                  <div className="h-1 bg-rose-500/20 w-full rounded-full" />
                  <div className="p-4 bg-rose-700 rounded-[1.5rem] border-b-6 border-rose-900 shadow-lg">
                    <p className="text-[10px] text-white font-black uppercase text-center leading-tight">
                      🚨 CARTÃO VERMELHO: Apresentar-se à Coordenação agora!
                    </p>
                  </div>
                </div>
              </div>
            </div>
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
                  <div key={c.id} className="flex flex-col bg-sky-50 p-4 rounded-2xl border-2 border-sky-100 group gap-2">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="font-black text-sky-700 tracking-tight">{c.name}</span>
                        <span className="text-[10px] text-sky-400 font-bold uppercase">{c.series}</span>
                      </div>
                      <button 
                        onClick={() => setConfirmingDeleteClass(confirmingDeleteClass === c.id ? null : c.id)} 
                        disabled={isSaving}
                        className="text-rose-400 hover:text-rose-600 transition-all p-2 bg-white rounded-xl border border-rose-100 shadow-sm disabled:opacity-50"
                      >
                        {isSaving && confirmingDeleteClass === c.id ? (
                          <div className="w-4 h-4 border-2 border-rose-400 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Trash2 size={16}/>
                        )}
                      </button>
                    </div>
                    {confirmingDeleteClass === c.id && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="flex flex-col gap-2 mt-2 pt-2 border-t border-rose-100"
                      >
                        <p className="text-[9px] font-bold text-rose-600 uppercase text-center">Apagar turma e alunos?</p>
                        <div className="flex gap-2">
                          <button onClick={() => deleteClass(c.id)} className="flex-1 bg-rose-500 text-white text-[10px] font-black py-2 rounded-lg shadow-md hover:bg-rose-600">SIM, EXCLUIR</button>
                          <button onClick={() => setConfirmingDeleteClass(null)} className="flex-1 bg-slate-200 text-slate-600 text-[10px] font-black py-2 rounded-lg">CALCELAR</button>
                        </div>
                      </motion.div>
                    )}
                  </div>
                ))}
              </div>

              <div className="p-4 bg-rose-50 rounded-3xl border-2 border-rose-100 mb-8 overflow-hidden">
                <h3 className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <AlertTriangle size={12}/> Zona de Perigo
                </h3>
                {confirmingDeleteAll ? (
                  <div className="space-y-4">
                    <p className="text-[9px] font-bold text-rose-700 text-center uppercase leading-tight italic">
                      ⚠️ Você irá apagar TODAS as turmas e TODOS os alunos. Esta ação é definitiva. Deseja continuar?
                    </p>
                    <div className="flex gap-2">
                      <button 
                        onClick={deleteAllData}
                        className="flex-1 bg-rose-600 text-white text-[10px] font-black py-3 rounded-xl shadow-lg animate-shake"
                      >
                        SIM, LIMPAR TUDO! 🏎️💥
                      </button>
                      <button 
                        onClick={() => setConfirmingDeleteAll(false)}
                        className="flex-1 bg-white text-slate-600 text-[10px] font-black py-3 rounded-xl border border-rose-200"
                      >
                        CANCELAR
                      </button>
                    </div>
                  </div>
                ) : (
                  <button 
                    onClick={() => setConfirmingDeleteAll(true)}
                    className="w-full bg-white text-rose-500 py-3 rounded-2xl text-[10px] font-black border-2 border-rose-200 hover:bg-rose-500 hover:text-white transition-all uppercase tracking-widest"
                  >
                    Apagar Todo App 🏁
                  </button>
                )}
              </div>

              <div className="pt-6 border-t-2 border-gray-100 space-y-3">
                <div className="space-y-1">
                  <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest px-1">Série/Ano:</label>
                  <input 
                    type="text" 
                    placeholder="Ex: 1º Ano..." 
                    value={newClassSeries}
                    onChange={(e) => setNewClassSeries(e.target.value)}
                    className="w-full bg-gray-50 px-4 py-2 rounded-xl border-2 border-transparent focus:border-sky-400 outline-none text-xs font-black"
                  />
                </div>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Nome da Turma..." 
                    id="new-class-input"
                    className="flex-1 bg-gray-50 px-4 py-3 rounded-2xl border-2 border-transparent focus:border-sky-400 outline-none text-xs font-black"
                  />
                  <button 
                    onClick={() => {
                      const input = document.getElementById('new-class-input') as HTMLInputElement;
                      addClass(input.value, newClassSeries);
                      input.value = '';
                      setNewClassSeries('');
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
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Série/Ano (Ex: 1º Ano):</label>
                    <input 
                      type="text"
                      placeholder="Ex: 1º Ano Junior..."
                      value={bulkSeries}
                      onChange={(e) => setBulkSeries(e.target.value)}
                      className="w-full bg-slate-50 px-6 py-4 rounded-2xl border-2 border-indigo-100 outline-none font-black text-indigo-700 shadow-inner"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Turma/Identificação (Ex: A):</label>
                    <input 
                      type="text"
                      placeholder="Ex: Turma A, 101..."
                      value={bulkClassName}
                      onChange={(e) => setBulkClassName(e.target.value)}
                      className="w-full bg-slate-50 px-6 py-4 rounded-2xl border-2 border-indigo-100 outline-none font-black text-indigo-700 shadow-inner"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Nomes Completos (um por linha):</label>
                  <textarea 
                    rows={6}
                    placeholder="João Silva&#10;Maria Oliveira&#10;Pedro Santos..."
                    value={bulkText}
                    onChange={(e) => setBulkText(e.target.value)}
                    className="w-full bg-slate-50 p-6 rounded-[2rem] border-2 border-transparent focus:border-indigo-400 outline-none text-sm font-black shadow-inner resize-none custom-scrollbar"
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    onClick={() => {
                      setShowBulkAdd(false);
                      setGlobalError(null);
                    }} 
                    className="flex-1 bg-slate-100 text-slate-500 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-200 transition-all border-b-4 border-slate-300 active:border-b-0 active:translate-y-1 shadow-sm"
                  >
                    CANCELAR
                  </button>
                  <button 
                    onClick={handleBulkAdd}
                    disabled={isSaving}
                    className="flex-1 bg-emerald-500 text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-lg hover:bg-emerald-600 transition-all disabled:opacity-50 border-b-4 border-emerald-700 active:border-b-0 active:translate-y-1 flex items-center justify-center gap-2"
                  >
                    {isSaving ? (
                      <>
                        <div className="w-5 h-5 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                        SALVANDO...
                      </>
                    ) : (
                      'OK, ADICIONAR TURMA! ✅'
                    )}
                  </button>
                </div>
              </div>
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
                O estudante <span className="text-rose-600">{showAlert.name}</span> parou.
              </p>
              <div className="bg-rose-50 p-6 rounded-[2rem] mb-10 border-2 border-rose-100">
                <p className="text-lg font-black text-gray-800 leading-tight uppercase underline decoration-rose-300 decoration-4">
                  Apresentar-se à Coordenação agora!
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
          <span>🏁 Estudando com Respeito e Atenção</span>
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
