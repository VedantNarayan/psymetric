'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { 
  BarChart3, Settings, Video, Upload, Shield, 
  Trash2, Plus, Sparkles, Sliders, Users, 
  Activity, Clock, ShieldAlert, GraduationCap, Building, Loader2, Pencil,
  Search, Filter, CheckCircle, AlertTriangle, FileText, Download, UserCheck, Key, Eye, HelpCircle, Coins
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { fallbackScenarios } from '@/lib/supabase/fallbackData';

// Seed initial mock student profiles for the explorer
const INITIAL_STUDENTS = [
  { id: 's1', name: 'Vedant Narayan', class: '10', section: 'A', stream: '', trait: 'The Thinker', score: 88, status: 'Completed', codesRemaining: 0, tags: ['High Creative', 'Needs Math Support'] },
  { id: 's2', name: 'Priya Sharma', class: '12', section: 'Science-A', stream: 'Science', trait: 'The Creator', score: 94, status: 'Completed', codesRemaining: 0, tags: ['Leadership Potential'] },
  { id: 's3', name: 'Rahul Gupta', class: '11', section: 'Commerce-B', stream: 'Commerce', trait: 'The Leader', score: 85, status: 'In Progress', codesRemaining: 1, tags: ['High Creative'] },
  { id: 's4', name: 'Anjali Verma', class: '9', section: 'C', stream: '', trait: 'The Organizer', score: 79, status: 'Completed', codesRemaining: 0, tags: ['Needs Support'] },
  { id: 's5', name: 'Amit Patel', class: '10', section: 'B', stream: '', trait: 'The Connector', score: 82, status: 'Not Started', codesRemaining: 2, tags: [] },
  { id: 's6', name: 'Siddharth Rao', class: '12', section: 'Humanities-A', stream: 'Humanities', trait: 'The Builder', score: 90, status: 'Completed', codesRemaining: 0, tags: ['High Creative'] }
];

const INITIAL_USERS = [
  { 
    id: 'u1', 
    name: 'Vedant Narayan', 
    email: 'vedant@psy.com', 
    role: 'Student',
    schoolName: 'DAV Public School',
    class: '10', 
    section: 'A',
    sessions: [
      {
        id: 'sess_1',
        createdAt: '2025-01-15T10:00:00Z',
        setNumber: 1,
        isCompleted: true,
        thetaVector: { R: 2.7, I: 4.8, A: 1.2, S: 0.8, E: 3.2, C: 0.5 },
        responses: [
          { scenarioTitle: 'Autonomous Drone Assembly Lab', questionText: 'The autonomous drone motor calibration fails. How do you address the hardware malfunction?', selectedLetter: 'A', selectedText: 'Manually disassemble the carbon-fiber shell and rewire the brushless motor leads directly.', timeMs: 45000 },
          { scenarioTitle: 'Bio-Genetics Computing Center', questionText: 'You isolate a novel gene sequence expressing an unknown protein. What is your scientific strategy?', selectedLetter: 'A', selectedText: 'Conduct a statistical analysis of gene transcription rates using multi-variate statistical models.', timeMs: 32000 },
          { scenarioTitle: 'Mixed-Reality Creative Loft', questionText: 'Your spatial Virtual Reality sculpture lacks emotional impact and depth. How do you redesign it?', selectedLetter: 'B', selectedText: 'Consult cognitive response studies to map which shapes cause calming neurological sensations.', timeMs: 28000 }
        ]
      },
      {
        id: 'sess_2',
        createdAt: '2026-05-20T11:30:00Z',
        setNumber: 2,
        isCompleted: true,
        thetaVector: { R: 1.8, I: 5.6, A: 2.0, S: 0.9, E: 2.4, C: 1.0 },
        responses: [
          { scenarioTitle: 'Autonomous Drone Assembly Lab', questionText: 'The autonomous drone motor calibration fails (Alternate Scenario)?', selectedLetter: 'B', selectedText: 'Run an algorithmic frequency sweep to plot electromagnetic interference patterns on a chart (Refined method).', timeMs: 25000 },
          { scenarioTitle: 'Bio-Genetics Computing Center', questionText: 'You isolate a novel gene sequence expressing an unknown protein (Alternate Scenario)?', selectedLetter: 'A', selectedText: 'Conduct a statistical analysis of gene transcription rates using multi-variate statistical models (Refined method).', timeMs: 18000 }
        ]
      }
    ]
  },
  { 
    id: 'u2', 
    name: 'Priya Sharma', 
    email: 'priya@example.com', 
    role: 'Student',
    schoolName: 'Delhi Public School',
    class: '12', 
    section: 'Science-A',
    sessions: [
      {
        id: 'sess_3',
        createdAt: '2025-09-10T14:20:00Z',
        setNumber: 1,
        isCompleted: true,
        thetaVector: { R: 0.8, I: 1.2, A: 5.4, S: 3.5, E: 1.0, C: 0.8 },
        responses: [
          { scenarioTitle: 'Mixed-Reality Creative Loft', questionText: 'Your spatial Virtual Reality sculpture lacks emotional impact and depth. How do you redesign it?', selectedLetter: 'A', selectedText: 'Sculpt abstract fluid textures and project glowing neon volumetric lighting to evoke emotional discomfort.', timeMs: 51000 },
          { scenarioTitle: 'Collaborative Study Incubator', questionText: 'Two junior team members are locked in a heated disagreement over coding responsibilities. How do you arbitrate?', selectedLetter: 'A', selectedText: 'Facilitate a structured active-listening session to let both parties voice feelings and repair collaboration.', timeMs: 34000 }
        ]
      }
    ]
  },
  { 
    id: 'u3', 
    name: 'Rahul Gupta', 
    email: 'rahul@gmail.com', 
    role: 'Student',
    schoolName: 'Jamnabai Narsee School',
    class: '11', 
    section: 'Commerce-B',
    sessions: []
  }
];

export default function AdminConsole() {
  const router = useRouter();
  
  // Auth & View Roles
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentRole, setCurrentRole] = useState<'super_admin' | 'school_admin'>('school_admin');
  
  // Tab Navigation
  const [activeTab, setActiveTab] = useState<'mission_control' | 'explorer' | 'roster_manager' | 'scenarios' | 'school_settings' | 'schools' | 'users'>('mission_control');

  // School Specific Info
  const [schoolLogo, setSchoolLogo] = useState<string>('/psymetric-icon.png');
  const [logoExplanationShown, setLogoExplanationShown] = useState(false);
  const [schoolBoard, setSchoolBoard] = useState('CBSE'); // CBSE, ICSE, State Board
  const [schoolName, setSchoolName] = useState('DAV Public School');

  // Academic Structure state
  const [academicClasses, setAcademicClasses] = useState<Record<string, string[]>>({
    '8': ['A', 'B'],
    '9': ['A', 'B'],
    '10': ['A', 'B', 'C'],
    '11': ['Science-A', 'Commerce-A'],
    '12': ['Science-A', 'Commerce-A']
  });
  const [newSectionClass, setNewSectionClass] = useState('10');
  const [newSectionName, setNewSectionName] = useState('');

  // Roster CSV paste/upload state
  const [csvText, setCsvText] = useState('');
  const [rosterRows, setRosterRows] = useState<any[]>([]);
  const [generatedCodes, setGeneratedCodes] = useState<any[]>([]);

  // Explorer states
  const [studentsList, setStudentsList] = useState(INITIAL_STUDENTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterClass, setFilterClass] = useState('All');
  const [filterSection, setFilterSection] = useState('All');
  const [filterTrait, setFilterTrait] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [selectedStudent, setSelectedStudent] = useState<any>(null);

  // Teacher delegation states
  const [teachers, setTeachers] = useState<any[]>([
    { email: 'teacher1@dav.edu', classes: ['10-A', '9-A'] },
    { email: 'teacher2@dav.edu', classes: ['12-Science-A'] }
  ]);
  const [newTeacherEmail, setNewTeacherEmail] = useState('');
  const [newTeacherClasses, setNewTeacherClasses] = useState<string[]>([]);

  // Analytics mock
  const [stats, setStats] = useState({
    totalStudents: 147,
    completedCount: 98,
    activeClasses: 5,
    creditsLeft: 320,
    avgScore: 84
  });

  // Super Admin: Enrolled Schools state
  const [schoolsList, setSchoolsList] = useState<any[]>([
    { id: 'sch1', name: 'DAV Public School', board: 'CBSE', location: 'Bengaluru, Karnataka', contact: 'principal@dav.edu', active: true, totalCredits: 500, usedCredits: 180 },
    { id: 'sch2', name: 'Delhi Public School', board: 'CBSE', location: 'New Delhi, Delhi', contact: 'admin@dps.edu', active: true, totalCredits: 300, usedCredits: 98 },
    { id: 'sch3', name: 'Jamnabai Narsee School', board: 'ICSE', location: 'Mumbai, Maharashtra', contact: 'contact@jamnabai.edu', active: false, totalCredits: 100, usedCredits: 100 }
  ]);

  // Super Admin: Users List state
  const [usersList, setUsersList] = useState<any[]>(INITIAL_USERS);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);

  // Modals & Forms states
  const [isScenarioModalOpen, setIsScenarioModalOpen] = useState(false);
  const [editingScenario, setEditingScenario] = useState<any | null>(null);
  
  const [scenarioTitle, setScenarioTitle] = useState('');
  const [scenarioVideoUrl, setScenarioVideoUrl] = useState('');
  const [scenarioAgeGroup, setScenarioAgeGroup] = useState('All');
  const [scenarioQuestions, setScenarioQuestions] = useState<any[]>([]);

  // Question Set Modal states
  const [isQuestionSetModalOpen, setIsQuestionSetModalOpen] = useState(false);
  const [qSetSelectedScenarioId, setQSetSelectedScenarioId] = useState('');
  const [qSetSetNumber, setQSetSetNumber] = useState(1);
  const [qSetQuestions, setQSetQuestions] = useState<any[]>([
    {
      question_text: '',
      show_at_seconds: 5,
      options: [
        { option_letter: 'A', option_text: '', target_dimension: 'The Thinker', intensity_weight: 0.8 },
        { option_letter: 'B', option_text: '', target_dimension: 'The Creator', intensity_weight: 0.8 },
        { option_letter: 'C', option_text: '', target_dimension: 'The Leader', intensity_weight: 0.8 },
        { option_letter: 'D', option_text: '', target_dimension: 'The Organizer', intensity_weight: 0.8 }
      ]
    }
  ]);

  const handleQuestionTextChange = (qIdx: number, val: string) => {
    setQSetQuestions(prev => {
      const copy = [...prev];
      copy[qIdx] = { ...copy[qIdx], question_text: val };
      return copy;
    });
  };

  const handleQuestionSecondsChange = (qIdx: number, val: number) => {
    setQSetQuestions(prev => {
      const copy = [...prev];
      copy[qIdx] = { ...copy[qIdx], show_at_seconds: val };
      return copy;
    });
  };

  const handleOptionTextChange = (qIdx: number, oIdx: number, val: string) => {
    setQSetQuestions(prev => {
      const copy = [...prev];
      const qCopy = { ...copy[qIdx] };
      const optsCopy = [...qCopy.options];
      optsCopy[oIdx] = { ...optsCopy[oIdx], option_text: val };
      qCopy.options = optsCopy;
      copy[qIdx] = qCopy;
      return copy;
    });
  };

  const toggleDimensionForOption = (qIdx: number, oIdx: number, dimLabel: string) => {
    setQSetQuestions(prev => {
      const copy = [...prev];
      const qCopy = { ...copy[qIdx] };
      const optsCopy = [...qCopy.options];
      const opt = optsCopy[oIdx];
      
      const currentDims = opt.target_dimension
        ? opt.target_dimension.split(',').map((s: string) => s.trim()).filter(Boolean)
        : [];
        
      let newDims;
      if (currentDims.includes(dimLabel)) {
        newDims = currentDims.filter((d: string) => d !== dimLabel);
      } else {
        newDims = [...currentDims, dimLabel];
      }
      
      optsCopy[oIdx] = {
        ...opt,
        target_dimension: newDims.join(', ')
      };
      qCopy.options = optsCopy;
      copy[qIdx] = qCopy;
      return copy;
    });
  };

  const handleOptionWeightChange = (qIdx: number, oIdx: number, val: number) => {
    setQSetQuestions(prev => {
      const copy = [...prev];
      const qCopy = { ...copy[qIdx] };
      const optsCopy = [...qCopy.options];
      optsCopy[oIdx] = { ...optsCopy[oIdx], intensity_weight: val };
      qCopy.options = optsCopy;
      copy[qIdx] = qCopy;
      return copy;
    });
  };

  const handleAddQuestionToSet = () => {
    setQSetQuestions(prev => [
      ...prev,
      {
        question_text: '',
        show_at_seconds: 5,
        options: [
          { option_letter: 'A', option_text: '', target_dimension: 'The Thinker', intensity_weight: 0.8 },
          { option_letter: 'B', option_text: '', target_dimension: 'The Creator', intensity_weight: 0.8 },
          { option_letter: 'C', option_text: '', target_dimension: 'The Leader', intensity_weight: 0.8 },
          { option_letter: 'D', option_text: '', target_dimension: 'The Organizer', intensity_weight: 0.8 }
        ]
      }
    ]);
  };

  const handleRemoveQuestionFromSet = (qIdx: number) => {
    setQSetQuestions(prev => prev.filter((_, idx) => idx !== qIdx));
  };


  const [isSchoolModalOpen, setIsSchoolModalOpen] = useState(false);
  const [newSchoolName, setNewSchoolName] = useState('');
  const [newSchoolBoard, setNewSchoolBoard] = useState('CBSE');
  const [newSchoolLocation, setNewSchoolLocation] = useState('');
  const [newSchoolContact, setNewSchoolContact] = useState('');
  const [newSchoolCredits, setNewSchoolCredits] = useState(100);

  const [isCreditModalOpen, setIsCreditModalOpen] = useState(false);
  const [creditSelectedSchool, setCreditSelectedSchool] = useState<any | null>(null);
  const [creditAmount, setCreditAmount] = useState(100);

  // Question editing scenario list
  const [scenarios, setScenarios] = useState<any[]>(fallbackScenarios);

  // Scenario matrix manager state
  const [scenActiveView, setScenActiveView] = useState<'grid' | 'matrix' | 'analytics' | 'schema' | 'simulator'>('grid');
  const [scenSearchQuery, setScenSearchQuery] = useState('');
  const [scenAgeFilter, setScenAgeFilter] = useState('All');
  const [scenDimensionFilter, setScenDimensionFilter] = useState('All');
  const [scenCompletenessFilter, setScenCompletenessFilter] = useState('All');
  const [scenSortBy, setScenSortBy] = useState<'title' | 'questions' | 'age' | 'completeness'>('title');
  const [scenStatusFilter, setScenStatusFilter] = useState<'All' | 'Draft' | 'Published' | 'Archived'>('All');

  // Interactive matrix cell action popover state
  const [selectedMatrixCell, setSelectedMatrixCell] = useState<{ scenarioId: string; setNum: number } | null>(null);

  // Scenario additional metadata fields for creation/edit
  const [scenarioStatus, setScenarioStatus] = useState<'Draft' | 'Published' | 'Archived'>('Published');
  const [scenarioExpectedTime, setScenarioExpectedTime] = useState<number>(60);
  const [scenarioFocusCategory, setScenarioFocusCategory] = useState<string>('STEM');
  const [isFocusDropdownOpen, setIsFocusDropdownOpen] = useState<boolean>(false);

  // Simulator state variables
  const [simScenarioId, setSimScenarioId] = useState<string>('');
  const [simSetNumber, setSimSetNumber] = useState<number>(1);
  const [simIsRunning, setSimIsRunning] = useState<boolean>(false);
  const [simCurrentTime, setSimCurrentTime] = useState<number>(0);
  const [simQuestions, setSimQuestions] = useState<any[]>([]);
  const [simCurrentQIndex, setSimCurrentQIndex] = useState<number>(0);
  const [simAnsweredCount, setSimAnsweredCount] = useState<number>(0);
  const [simThetaVector, setSimThetaVector] = useState<Record<string, number>>({ R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 });
  const [simLogs, setSimLogs] = useState<string[]>([]);
  const [simSelectedOption, setSimSelectedOption] = useState<string | null>(null);
  const [simShowOverlay, setSimShowOverlay] = useState<boolean>(false);
  const [simCompleted, setSimCompleted] = useState<boolean>(false);

  // Bulk schema editor text state
  const [bulkJsonText, setBulkJsonText] = useState<string>('');
  const [bulkJsonError, setBulkJsonError] = useState<string | null>(null);

  const handleExportScenarios = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(scenarios, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href",     dataStr);
    downloadAnchor.setAttribute("download", `psymetric_scenario_matrix_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportScenarios = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed)) {
          if (confirm(`Are you sure you want to import ${parsed.length} scenarios? This will override current session scenarios.`)) {
            setScenarios(parsed);
          }
        } else {
          alert("Invalid scenario schema. Must be a JSON array of scenarios.");
        }
      } catch (err) {
        alert("Failed to parse JSON file.");
      }
    };
    reader.readAsText(file);
  };

  const handleOpenQuestionSetFromMatrix = (scenarioId: string, setNum: number) => {
    setQSetSelectedScenarioId(scenarioId);
    setQSetSetNumber(setNum);
    setIsQuestionSetModalOpen(true);
  };

  useEffect(() => {
    // Check authentication
    const checkAuth = async () => {
      setLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        // Sandbox mock bypass check
        if (!session) {
          setIsAdmin(true); // Allow sandbox bypass for viewing
          setLoading(false);
          return;
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profile?.user_type === 'super_admin' || profile?.is_admin) {
          setIsAdmin(true);
          setCurrentRole('super_admin');
        } else if (profile?.user_type === 'school_admin') {
          setIsAdmin(true);
          setCurrentRole('school_admin');
        } else {
          router.push('/assessment');
        }
      } catch (err) {
        console.error('Admin verification error:', err);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, [router]);

  // Synchronize question set form fields when scenario/set selection changes
  useEffect(() => {
    if (!qSetSelectedScenarioId) return;
    const scen = scenarios.find(s => s.id === qSetSelectedScenarioId);
    if (scen && scen.questions) {
      const existingQs = scen.questions.filter((q: any) => q.sequence_order === qSetSetNumber);
      if (existingQs.length > 0) {
        setQSetQuestions(existingQs.map((q: any) => ({
          id: q.id,
          question_text: q.question_text,
          show_at_seconds: q.show_at_seconds || 5,
          options: q.options ? JSON.parse(JSON.stringify(q.options)) : [
            { option_letter: 'A', option_text: '', target_dimension: 'The Thinker', intensity_weight: 0.8 },
            { option_letter: 'B', option_text: '', target_dimension: 'The Creator', intensity_weight: 0.8 },
            { option_letter: 'C', option_text: '', target_dimension: 'The Leader', intensity_weight: 0.8 },
            { option_letter: 'D', option_text: '', target_dimension: 'The Organizer', intensity_weight: 0.8 }
          ]
        })));
        return;
      }
    }
    setQSetQuestions([
      {
        question_text: '',
        show_at_seconds: 5,
        options: [
          { option_letter: 'A', option_text: '', target_dimension: 'The Thinker', intensity_weight: 0.8 },
          { option_letter: 'B', option_text: '', target_dimension: 'The Creator', intensity_weight: 0.8 },
          { option_letter: 'C', option_text: '', target_dimension: 'The Leader', intensity_weight: 0.8 },
          { option_letter: 'D', option_text: '', target_dimension: 'The Organizer', intensity_weight: 0.8 }
        ]
      }
    ]);
  }, [qSetSelectedScenarioId, qSetSetNumber, scenarios]);


  const handleAddSection = () => {
    if (!newSectionName.trim()) return;
    const sectionsToAdd = newSectionName
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    if (sectionsToAdd.length === 0) return;

    setAcademicClasses(prev => {
      const current = prev[newSectionClass] || [];
      const updated = [...current];
      sectionsToAdd.forEach(sec => {
        if (!updated.includes(sec)) {
          updated.push(sec);
        }
      });
      return {
        ...prev,
        [newSectionClass]: updated
      };
    });
    setNewSectionName('');
  };

  const handleRemoveSection = (cls: string, sec: string) => {
    setAcademicClasses(prev => ({
      ...prev,
      [cls]: prev[cls].filter(s => s !== sec)
    }));
  };

  // Load scenario details for editing
  const handleEditScenarioClick = (scen: any) => {
    setEditingScenario(scen);
    setScenarioTitle(scen.title);
    setScenarioVideoUrl(scen.video_url);
    setScenarioAgeGroup(scen.target_age_group || 'All');
    setScenarioStatus(scen.status || 'Published');
    setScenarioExpectedTime(scen.expected_time || 60);
    setScenarioFocusCategory(scen.focus_category || 'STEM');
    setScenarioQuestions(scen.questions ? JSON.parse(JSON.stringify(scen.questions)) : []);
    setIsScenarioModalOpen(true);
  };

  const handleCreateScenarioClick = () => {
    setEditingScenario(null);
    setScenarioTitle('');
    setScenarioVideoUrl('');
    setScenarioAgeGroup('All');
    setScenarioStatus('Published');
    setScenarioExpectedTime(60);
    setScenarioFocusCategory('STEM');
    setScenarioQuestions([]); // Initialize questions list as empty on creation
    setIsScenarioModalOpen(true);
  };

  const handleSaveScenario = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scenarioTitle.trim() || !scenarioVideoUrl.trim()) return;

    if (editingScenario) {
      setScenarios(prev => prev.map(s => {
        if (s.id === editingScenario.id) {
          return {
            ...s,
            title: scenarioTitle,
            video_url: scenarioVideoUrl,
            target_age_group: scenarioAgeGroup,
            status: scenarioStatus,
            expected_time: scenarioExpectedTime,
            focus_category: scenarioFocusCategory,
            questions: scenarioQuestions
          };
        }
        return s;
      }));
    } else {
      const newScen = {
        id: 'scen_' + Math.random().toString(36).substring(2, 9),
        title: scenarioTitle,
        video_url: scenarioVideoUrl,
        target_age_group: scenarioAgeGroup,
        status: scenarioStatus,
        expected_time: scenarioExpectedTime,
        focus_category: scenarioFocusCategory,
        is_active: true,
        questions: [] // No questions initialised on creation
      };
      setScenarios(prev => [...prev, newScen]);
    }
    setIsScenarioModalOpen(false);
  };

  const handleDeleteScenario = (id: string) => {
    if (confirm('Are you sure you want to delete this scenario?')) {
      setScenarios(prev => prev.filter(s => s.id !== id));
    }
  };

  const handleCloneQuestionSet = (fromScenarioId: string, fromSetNum: number, toScenarioId: string, toSetNum: number) => {
    const fromScen = scenarios.find(s => s.id === fromScenarioId);
    if (!fromScen) return;
    const questionsToClone = fromScen.questions 
      ? fromScen.questions.filter((q: any) => q.sequence_order === fromSetNum)
      : [];

    if (questionsToClone.length === 0) {
      alert("No questions found in this set to clone.");
      return;
    }

    setScenarios(prev => prev.map(s => {
      if (s.id === toScenarioId) {
        const otherQuestions = s.questions ? s.questions.filter((q: any) => q.sequence_order !== toSetNum) : [];
        const cloned = questionsToClone.map((q: any) => ({
          ...JSON.parse(JSON.stringify(q)),
          id: 'q_' + Math.random().toString(36).substring(2, 9),
          sequence_order: toSetNum,
          options: q.options ? q.options.map((opt: any) => ({
            ...opt,
            id: 'opt_' + Math.random().toString(36).substring(2, 9)
          })) : []
        }));
        const questionsList = [...otherQuestions, ...cloned];
        questionsList.sort((a: any, b: any) => a.sequence_order - b.sequence_order);
        return { ...s, questions: questionsList };
      }
      return s;
    }));

    setSelectedMatrixCell(null);
    alert(`Successfully cloned questions from Set ${fromSetNum} to Set ${toSetNum}!`);
  };

  const handleClearQuestionSet = (scenarioId: string, setNum: number) => {
    if (confirm(`Are you sure you want to clear all questions in Set ${setNum} for this scenario?`)) {
      setScenarios(prev => prev.map(s => {
        if (s.id === scenarioId) {
          const questionsList = s.questions ? s.questions.filter((q: any) => q.sequence_order !== setNum) : [];
          return { ...s, questions: questionsList };
        }
        return s;
      }));
      setSelectedMatrixCell(null);
    }
  };

  const handleValidateBulkJson = (text: string) => {
    setBulkJsonText(text);
    try {
      const parsed = JSON.parse(text);
      if (!Array.isArray(parsed)) {
        setBulkJsonError("Schema error: Root must be a JSON array of scenarios.");
        return false;
      }
      for (let i = 0; i < parsed.length; i++) {
        const s = parsed[i];
        if (!s.id) {
          setBulkJsonError(`Scenario at index ${i} is missing 'id'.`);
          return false;
        }
        if (!s.title) {
          setBulkJsonError(`Scenario '${s.id}' is missing 'title'.`);
          return false;
        }
        if (s.questions) {
          for (let j = 0; j < s.questions.length; j++) {
            const q = s.questions[j];
            if (!q.question_text) {
              setBulkJsonError(`Scenario '${s.title}' -> Question at index ${j} is missing 'question_text'.`);
              return false;
            }
            if (q.options) {
              if (q.options.length !== 4) {
                setBulkJsonError(`Scenario '${s.title}' -> Question '${q.question_text.slice(0, 20)}...' must have exactly 4 options (A, B, C, D).`);
                return false;
              }
              for (let k = 0; k < q.options.length; k++) {
                const opt = q.options[k];
                if (!opt.option_letter) {
                  setBulkJsonError(`Scenario '${s.title}' -> Option at index ${k} is missing 'option_letter'.`);
                  return false;
                }
                if (!opt.option_text) {
                  setBulkJsonError(`Scenario '${s.title}' -> Option ${opt.option_letter} is missing 'option_text'.`);
                  return false;
                }
              }
            }
          }
        }
      }
      setBulkJsonError(null);
      return true;
    } catch (err: any) {
      setBulkJsonError(`JSON Syntax Error: ${err.message}`);
      return false;
    }
  };

  const handleApplyBulkChanges = () => {
    if (handleValidateBulkJson(bulkJsonText)) {
      setScenarios(JSON.parse(bulkJsonText));
      alert("Successfully applied scenario matrix updates from raw JSON schema!");
    } else {
      alert("Cannot apply changes. Please fix the validation errors first.");
    }
  };

  const startSimulatorSession = (scenId: string, setNum: number) => {
    const scen = scenarios.find(s => s.id === scenId);
    const qs = scen && scen.questions ? scen.questions.filter((q: any) => q.sequence_order === setNum) : [];
    
    setSimScenarioId(scenId);
    setSimSetNumber(setNum);
    setSimQuestions(qs);
    setSimCurrentQIndex(0);
    setSimAnsweredCount(0);
    setSimCurrentTime(0);
    setSimThetaVector({ R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 });
    setSimLogs([
      `[00:00] Simulation initialized for "${scen?.title || 'Unknown'}" (Set ${setNum})`,
      `[00:00] Loaded ${qs.length} configured diagnostic questions.`
    ]);
    setSimShowOverlay(false);
    setSimCompleted(false);
    setSimIsRunning(true);
    setScenActiveView('simulator');
  };

  const handleCreateQuestionSetClick = () => {
    if (scenarios.length === 0) {
      alert('Please create at least one scenario first before creating question sets.');
      return;
    }
    setQSetSelectedScenarioId(scenarios[0].id);
    setQSetSetNumber(1);
    setQSetQuestions([
      {
        question_text: '',
        show_at_seconds: 5,
        options: [
          { option_letter: 'A', option_text: '', target_dimension: 'The Thinker', intensity_weight: 0.8 },
          { option_letter: 'B', option_text: '', target_dimension: 'The Creator', intensity_weight: 0.8 },
          { option_letter: 'C', option_text: '', target_dimension: 'The Leader', intensity_weight: 0.8 },
          { option_letter: 'D', option_text: '', target_dimension: 'The Organizer', intensity_weight: 0.8 }
        ]
      }
    ]);
    setIsQuestionSetModalOpen(true);
  };

  const handleSaveQuestionSet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qSetSelectedScenarioId) return;

    setScenarios(prev => prev.map(s => {
      if (s.id === qSetSelectedScenarioId) {
        const otherQuestions = s.questions ? s.questions.filter((q: any) => q.sequence_order !== qSetSetNumber) : [];

        const newQs = qSetQuestions.map((q: any) => {
          const mappedOptions = q.options.map((opt: any) => ({
            ...opt,
            id: opt.id || 'opt_' + opt.option_letter.toLowerCase() + '_' + Math.random().toString(36).substring(2, 9)
          }));
          return {
            id: q.id || 'q_' + Math.random().toString(36).substring(2, 9),
            sequence_order: qSetSetNumber,
            question_text: q.question_text,
            show_at_seconds: q.show_at_seconds,
            options: mappedOptions
          };
        });

        const questionsList = [...otherQuestions, ...newQs];
        questionsList.sort((a: any, b: any) => a.sequence_order - b.sequence_order);

        return {
          ...s,
          questions: questionsList
        };
      }
      return s;
    }));

    setIsQuestionSetModalOpen(false);
  };

  const handleCreateSchool = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSchoolName.trim()) return;
    const newSchool = {
      id: 'sch_' + Math.random().toString(36).substring(2, 9),
      name: newSchoolName,
      board: newSchoolBoard,
      location: newSchoolLocation,
      contact: newSchoolContact,
      active: true,
      totalCredits: newSchoolCredits,
      usedCredits: 0
    };
    setSchoolsList(prev => [...prev, newSchool]);
    setIsSchoolModalOpen(false);
    
    // Clear forms
    setNewSchoolName('');
    setNewSchoolLocation('');
    setNewSchoolContact('');
    setNewSchoolCredits(100);
  };

  const handleToggleSchoolActive = (id: string) => {
    setSchoolsList(prev => prev.map(s => {
      if (s.id === id) {
        return { ...s, active: !s.active };
      }
      return s;
    }));
  };

  const handleAllocateCreditsSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!creditSelectedSchool) return;
    setSchoolsList(prev => prev.map(s => {
      if (s.id === creditSelectedSchool.id) {
        return { ...s, totalCredits: Number(s.totalCredits) + Number(creditAmount) };
      }
      return s;
    }));
    setIsCreditModalOpen(false);
  };

  const handleDeleteSchool = (id: string) => {
    if (confirm('Are you sure you want to delete this school? This will cascade delete its roster and credits.')) {
      setSchoolsList(prev => prev.filter(s => s.id !== id));
    }
  };

  const handleImpersonateSchool = (sch: any) => {
    setSchoolName(sch.name);
    setSchoolBoard(sch.board);
    // Switch to school admin view
    setCurrentRole('school_admin');
    setActiveTab('mission_control');
    // Also mock credit statistics
    setStats(prev => ({
      ...prev,
      creditsLeft: sch.totalCredits - sch.usedCredits
    }));
  };

  // Parse roster CSV data
  const handleParseRoster = () => {
    if (!csvText.trim()) return;
    const lines = csvText.split('\n');
    const rows = lines.map((line, index) => {
      const parts = line.split(',');
      if (parts.length < 4) return null;
      
      const adminNo = parts[0].trim();
      const first = parts[1].trim();
      const last = parts[2].trim();
      const cls = parts[3].trim();
      const sec = parts[4] ? parts[4].trim() : 'A';

      // Validation check
      const classExists = academicClasses[cls] !== undefined;
      const sectionExists = classExists && academicClasses[cls].some(s => s.includes(sec));
      
      let isValid = true;
      let error = '';
      if (!classExists) {
        isValid = false;
        error = `Class ${cls} is not in registered academic structure.`;
      } else if (!sectionExists) {
        isValid = false;
        error = `Section ${sec} is not registered under Class ${cls}.`;
      }

      return {
        id: index,
        adminNo,
        firstName: first,
        lastName: last,
        className: cls,
        sectionName: sec,
        isValid,
        error
      };
    }).filter(Boolean);

    setRosterRows(rows);

    // Generate codes for valid ones
    const codes = rows.map((r: any) => {
      if (!r.isValid) return null;
      const schoolCode = schoolName.slice(0, 3).toUpperCase();
      return {
        name: `${r.firstName} ${r.lastName}`,
        classSec: `${r.className}-${r.sectionName}`,
        code: `PSY-${schoolCode}-${r.className}${r.sectionName}-${r.adminNo.slice(-3)}`
      };
    }).filter(Boolean);

    setGeneratedCodes(codes);
  };

  // Delegate teacher permissions
  const handleDelegateTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeacherEmail.trim()) return;
    setTeachers(prev => [
      ...prev,
      { email: newTeacherEmail, classes: newTeacherClasses }
    ]);
    setNewTeacherEmail('');
    setNewTeacherClasses([]);
  };

  // Logo upload simulation
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const url = URL.createObjectURL(file);
      setSchoolLogo(url);
    }
  };

  // Filter student directory search
  const filteredStudents = studentsList.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesClass = filterClass === 'All' || s.class === filterClass;
    const matchesSection = filterClass === 'All' || filterSection === 'All' || s.section === filterSection;
    const matchesTrait = filterTrait === 'All' || s.trait === filterTrait;
    const matchesStatus = filterStatus === 'All' || s.status === filterStatus;
    return matchesSearch && matchesClass && matchesSection && matchesTrait && matchesStatus;
  });

  return (
    <div className="relative min-h-screen bg-[#030303] text-white flex flex-col lg:flex-row overflow-hidden">
      
      {/* ──── LEFT SIDEBAR DASHBOARD NAVIGATION ──── */}
      <div className="w-full lg:w-64 bg-zinc-950 border-r border-zinc-900 p-6 flex flex-col justify-between shrink-0">
        <div className="space-y-8">
          
          {/* Brand Logo Home click */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push('/')}>
            <img 
              src="/psymetric-logo.png" 
              alt="PsyMetric Logo" 
              className="h-9 w-auto object-contain"
            />
          </div>

          {/* Sandbox Role Switcher */}
          <div className="p-3 bg-zinc-900/40 border border-zinc-800 rounded-2xl space-y-2">
            <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block">Operational Mode</span>
            <div className="grid grid-cols-2 gap-1.5 text-center">
              <button
                onClick={() => { setCurrentRole('school_admin'); setActiveTab('mission_control'); }}
                className={`py-1.5 text-[10px] font-extrabold rounded-lg transition-all ${
                  currentRole === 'school_admin' ? 'bg-teal-500 text-black font-black' : 'text-zinc-400 hover:bg-zinc-800'
                }`}
              >
                School Admin
              </button>
              <button
                onClick={() => { setCurrentRole('super_admin'); setActiveTab('scenarios'); }}
                className={`py-1.5 text-[10px] font-extrabold rounded-lg transition-all ${
                  currentRole === 'super_admin' ? 'bg-purple-600 text-white font-black shadow-[0_0_10px_rgba(168,85,247,0.3)]' : 'text-zinc-400 hover:bg-zinc-800'
                }`}
              >
                Super Admin
              </button>
            </div>
          </div>

          {/* Tab Button Lists */}
          <nav className="space-y-2">
            {currentRole === 'school_admin' ? (
              <>
                <button
                  onClick={() => setActiveTab('mission_control')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'mission_control' ? 'bg-teal-500/10 border border-teal-500/20 text-teal-400' : 'text-zinc-400 hover:bg-zinc-900'
                  }`}
                >
                  <Activity className="w-4 h-4" /> Mission Control
                </button>
                <button
                  onClick={() => setActiveTab('explorer')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'explorer' ? 'bg-teal-500/10 border border-teal-500/20 text-teal-400' : 'text-zinc-400 hover:bg-zinc-900'
                  }`}
                >
                  <Search className="w-4 h-4" /> Student Explorer
                </button>
                <button
                  onClick={() => setActiveTab('roster_manager')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'roster_manager' ? 'bg-teal-500/10 border border-teal-500/20 text-teal-400' : 'text-zinc-400 hover:bg-zinc-900'
                  }`}
                >
                  <Upload className="w-4 h-4" /> Roster CSV Manager
                </button>
                <button
                  onClick={() => setActiveTab('school_settings')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'school_settings' ? 'bg-teal-500/10 border border-teal-500/20 text-teal-400' : 'text-zinc-400 hover:bg-zinc-900'
                  }`}
                >
                  <Settings className="w-4 h-4" /> School Profiles
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setActiveTab('scenarios')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'scenarios' ? 'bg-purple-600/10 border border-purple-500/20 text-purple-400' : 'text-zinc-400 hover:bg-zinc-900'
                  }`}
                >
                  <Video className="w-4 h-4" /> Scenario Matrix
                </button>
                <button
                  onClick={() => setActiveTab('schools')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'schools' ? 'bg-purple-600/10 border border-purple-500/20 text-purple-400' : 'text-zinc-400 hover:bg-zinc-900'
                  }`}
                >
                  <Building className="w-4 h-4" /> Enrolled Schools
                </button>
                <button
                  onClick={() => setActiveTab('users')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'users' ? 'bg-purple-600/10 border border-purple-500/20 text-purple-400' : 'text-zinc-400 hover:bg-zinc-900'
                  }`}
                >
                  <Users className="w-4 h-4" /> User Directory
                </button>
                <button
                  onClick={() => { setCurrentRole('school_admin'); setActiveTab('mission_control'); }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold text-zinc-500 hover:text-zinc-300"
                >
                  <Eye className="w-4 h-4" /> Impersonate School
                </button>
              </>
            )}
          </nav>
        </div>

        <button 
          onClick={() => router.push('/assessment')}
          className="w-full bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-xs font-semibold py-2.5 rounded-xl transition-all"
        >
          View Student Workspace
        </button>
      </div>

      {/* ──── MAIN CONTENT WORKSPACE AREA ──── */}
      <main className="flex-1 p-8 overflow-y-auto max-h-screen">
        
        {/* TAB 1: SCHOOL ADMIN MISSION CONTROL */}
        {activeTab === 'mission_control' && (
          <div className="space-y-8">
            <div className="flex justify-between items-center border-b border-zinc-900 pb-6">
              <div>
                <h1 className="text-2xl font-black tracking-tight text-white mb-1">Mission Control</h1>
                <p className="text-zinc-400 text-xs">{schoolName} • {schoolBoard} Board Directory</p>
              </div>
              
              {/* Logo display co-branding */}
              <div className="flex items-center gap-3 bg-zinc-900/30 p-2.5 rounded-2xl border border-zinc-900">
                <img src={schoolLogo} alt="School Logo" className="w-9 h-9 object-contain rounded-lg bg-zinc-950" />
                <div className="text-xs">
                  <span className="font-bold block text-white">{schoolName}</span>
                  <span className="text-[10px] text-zinc-500">Co-Branded Active</span>
                </div>
              </div>
            </div>

            {/* Metrics cards grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="glassmorphism p-5 rounded-2xl flex items-center gap-4 border border-teal-500/10">
                <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-400 shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block">Student Roster</span>
                  <span className="text-xl font-bold font-mono text-white">{stats.totalStudents}</span>
                </div>
              </div>

              <div className="glassmorphism p-5 rounded-2xl flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 shrink-0">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block">Evaluations Done</span>
                  <span className="text-xl font-bold font-mono text-white">{stats.completedCount}</span>
                </div>
              </div>

              <div className="glassmorphism p-5 rounded-2xl flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center text-zinc-400 shrink-0">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block">Active Classes</span>
                  <span className="text-xl font-bold font-mono text-white">{stats.activeClasses}</span>
                </div>
              </div>

              <div className="glassmorphism p-5 rounded-2xl flex items-center gap-4 border border-purple-500/10">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 shrink-0">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block">Credits Left</span>
                  <span className="text-xl font-bold font-mono text-white">{stats.creditsLeft}</span>
                </div>
              </div>
            </div>

            {/* Graphics & Leaderboards section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Talent Radar Bubble Chart representation */}
              <div className="glassmorphism p-6 rounded-3xl lg:col-span-2 space-y-4">
                <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                  <Sparkles className="w-4.5 h-4.5 text-teal-400" /> Talent Radar (Collective Skill Clusters)
                </h3>
                
                {/* Visualizing 3 key bubbles */}
                <div className="relative min-h-[220px] bg-black/40 border border-zinc-900 rounded-2xl p-6 flex flex-wrap items-center justify-around gap-4">
                  <div className="w-28 h-28 rounded-full bg-blue-500/10 border border-blue-500/30 flex flex-col items-center justify-center text-center shadow-[0_0_20px_rgba(59,130,246,0.1)]">
                    <span className="text-xl">🔬</span>
                    <span className="text-xs font-black text-white mt-1">Thinker</span>
                    <span className="text-[10px] text-zinc-500">42 Students</span>
                  </div>
                  <div className="w-32 h-32 rounded-full bg-purple-500/10 border border-purple-500/30 flex flex-col items-center justify-center text-center shadow-[0_0_25px_rgba(168,85,247,0.15)]">
                    <span className="text-xl">🎨</span>
                    <span className="text-xs font-black text-white mt-1">Creator</span>
                    <span className="text-[10px] text-zinc-500">54 Students</span>
                  </div>
                  <div className="w-24 h-24 rounded-full bg-teal-500/10 border border-teal-500/30 flex flex-col items-center justify-center text-center shadow-[0_0_15px_rgba(20,184,166,0.1)]">
                    <span className="text-xl">📊</span>
                    <span className="text-xs font-black text-white mt-1">Organizer</span>
                    <span className="text-[10px] text-zinc-500">22 Students</span>
                  </div>
                </div>
              </div>

              {/* Leaderboards */}
              <div className="glassmorphism p-6 rounded-3xl space-y-4">
                <h3 className="text-sm font-black text-white">Class Leaderboards</h3>
                <div className="space-y-4">
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-zinc-400">Class 12-Science-A</span>
                      <span className="text-teal-400 font-bold">92% Done</span>
                    </div>
                    <div className="w-full h-2 bg-zinc-950 rounded-full overflow-hidden">
                      <div className="h-full bg-teal-400" style={{ width: '92%' }} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-zinc-400">Class 10-A</span>
                      <span className="text-purple-400 font-bold">84% Done</span>
                    </div>
                    <div className="w-full h-2 bg-zinc-950 rounded-full overflow-hidden">
                      <div className="h-full bg-purple-500" style={{ width: '84%' }} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-zinc-400">Class 11-Commerce-A</span>
                      <span className="text-zinc-500">48% Done</span>
                    </div>
                    <div className="w-full h-2 bg-zinc-950 rounded-full overflow-hidden">
                      <div className="h-full bg-zinc-700" style={{ width: '48%' }} />
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* TAB 2: STUDENT EXPLORER */}
        {activeTab === 'explorer' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-white mb-1">Student Explorer</h1>
              <p className="text-zinc-400 text-xs">Fuzzy match search engine with multi-parameter filter chips</p>
            </div>

            {/* Fuzzy Search Panel */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className={filterClass !== 'All' ? "md:col-span-4 relative" : "md:col-span-6 relative"}>
                <Search className="absolute left-3.5 top-3.5 w-5 h-5 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Fuzzy search student name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 pl-11 pr-4 text-white focus:outline-none focus:border-teal-500"
                />
              </div>
              
              <div className="md:col-span-2">
                <select
                  value={filterClass}
                  onChange={(e) => {
                    setFilterClass(e.target.value);
                    setFilterSection('All');
                  }}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 px-4 text-xs text-white"
                >
                  <option value="All">Class: All</option>
                  <option value="8">Class 8</option>
                  <option value="9">Class 9</option>
                  <option value="10">Class 10</option>
                  <option value="11">Class 11</option>
                  <option value="12">Class 12</option>
                </select>
              </div>

              {filterClass !== 'All' && academicClasses[filterClass] && (
                <div className="md:col-span-2 animate-fadeIn">
                  <select
                    value={filterSection}
                    onChange={(e) => setFilterSection(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 px-4 text-xs text-white"
                  >
                    <option value="All">Section: All</option>
                    {academicClasses[filterClass].map(sec => (
                      <option key={sec} value={sec}>Section: {sec}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="md:col-span-2">
                <select
                  value={filterTrait}
                  onChange={(e) => setFilterTrait(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 px-4 text-xs text-white"
                >
                  <option value="All">Dominant Trait: All</option>
                  <option value="The Thinker">The Thinker</option>
                  <option value="The Creator">The Creator</option>
                  <option value="The Leader">The Leader</option>
                  <option value="The Organizer">The Organizer</option>
                  <option value="The Connector">The Connector</option>
                  <option value="The Builder">The Builder</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 px-4 text-xs text-white"
                >
                  <option value="All">Status: All</option>
                  <option value="Completed">Completed</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Not Started">Not Started</option>
                </select>
              </div>
            </div>

            {/* Results cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredStudents.map(student => (
                <div 
                  key={student.id}
                  onClick={() => setSelectedStudent(student)}
                  className="glassmorphism p-5 rounded-2xl border border-zinc-900 hover:border-teal-500/20 cursor-pointer transition-all space-y-4"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-white text-sm">{student.name}</h4>
                      <span className="text-[10px] text-zinc-500">Class {student.class}-{student.section}</span>
                    </div>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                      student.status === 'Completed' ? 'bg-teal-500/10 text-teal-400' :
                      student.status === 'In Progress' ? 'bg-amber-500/10 text-amber-400' : 'bg-zinc-800 text-zinc-500'
                    }`}>
                      {student.status}
                    </span>
                  </div>

                  {student.status === 'Completed' && (
                    <div className="flex items-center justify-between text-xs border-t border-zinc-900 pt-3">
                      <span className="text-zinc-500">Dominant Trait:</span>
                      <span className="text-teal-400 font-extrabold">{student.trait}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Drill down Player Profile Modal overlay */}
            <AnimatePresence>
              {selectedStudent && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                >
                  <motion.div 
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.9, y: 20 }}
                    className="w-full max-w-2xl bg-zinc-950 border border-zinc-900 rounded-3xl p-8 relative space-y-6 max-h-[90vh] overflow-y-auto"
                  >
                    <button 
                      onClick={() => setSelectedStudent(null)}
                      className="absolute top-4 right-4 text-zinc-500 hover:text-white"
                    >
                      ✕
                    </button>

                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-400">
                        <Users className="w-6 h-6" />
                      </div>
                      <div>
                        <h2 className="text-xl font-black text-white">{selectedStudent.name}</h2>
                        <p className="text-xs text-zinc-500">Class {selectedStudent.class}-{selectedStudent.section} Profile drill-down</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-zinc-900">
                      <div className="space-y-4">
                        <span className="text-[10px] font-bold text-teal-400 uppercase tracking-widest block">Character traits</span>
                        <div className="p-4 rounded-xl bg-black/40 border border-zinc-900 space-y-2 text-xs">
                          <p><strong className="text-zinc-400">Status:</strong> {selectedStudent.status}</p>
                          <p><strong className="text-zinc-400">Primary Core Alignment:</strong> {selectedStudent.trait}</p>
                          <p><strong className="text-zinc-400">Score Intensity:</strong> {selectedStudent.score}%</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <span className="text-[10px] font-bold text-teal-400 uppercase tracking-widest block">Special Tags</span>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedStudent.tags.map((t: string) => (
                            <span key={t} className="px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[9px] font-bold">
                              {t}
                            </span>
                          ))}
                          {selectedStudent.tags.length === 0 && <span className="text-xs text-zinc-600">No active flags</span>}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* TAB 3: ROSTER CSV MANAGER */}
        {activeTab === 'roster_manager' && (
          <div className="space-y-8">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-white mb-1">Roster CSV & Access Code Generator</h1>
              <p className="text-zinc-400 text-xs">Upload student rosters to generate claiming access codes</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* CSV input */}
              <div className="lg:col-span-6 space-y-4">
                <span className="text-xs font-bold text-zinc-400 uppercase block">Paste Roster Lines (CSV Format)</span>
                <p className="text-[10px] text-zinc-500">Format: admission_no, first_name, last_name, class, section</p>
                <textarea
                  rows={8}
                  placeholder="2024001, John, Doe, 10, A&#10;2024002, Jane, Smith, 11, Science-A"
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-xs font-mono text-white focus:outline-none focus:border-teal-500"
                />

                <div className="flex gap-4">
                  <button
                    onClick={handleParseRoster}
                    className="flex-1 bg-teal-500 hover:bg-teal-400 text-black font-bold py-2.5 rounded-xl text-xs transition-all"
                  >
                    Validate & Parse Roster
                  </button>
                  <button
                    onClick={() => setCsvText('2024001, Vedant, Narayan, 10, A\n2024002, Priya, Sharma, 12, Science-A\n2024003, Invalid, Student, 17, X')}
                    className="bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 px-4 py-2.5 rounded-xl text-xs font-semibold text-zinc-300"
                  >
                    Load Sample CSV
                  </button>
                </div>
              </div>

              {/* Roster validation table */}
              <div className="lg:col-span-6 space-y-4">
                <span className="text-xs font-bold text-zinc-400 uppercase block">Validation Feedback</span>
                
                <div className="bg-black/30 border border-zinc-900 rounded-2xl p-4 min-h-[150px] max-h-60 overflow-y-auto space-y-3">
                  {rosterRows.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center text-zinc-600 gap-2">
                      <FileText className="w-8 h-8" />
                      <p className="text-xs">No roster lines parsed yet.</p>
                    </div>
                  ) : (
                    rosterRows.map(row => (
                      <div 
                        key={row.id} 
                        className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                          row.isValid ? 'bg-green-500/5 border-green-500/20 text-green-300' : 'bg-red-500/5 border-red-500/20 text-red-300'
                        }`}
                      >
                        <div>
                          <span className="font-bold block">{row.firstName} {row.lastName} ({row.adminNo})</span>
                          <span className="text-[10px] text-zinc-500">Class {row.className}-{row.sectionName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {row.isValid ? (
                            <>
                              <CheckCircle className="w-4 h-4 text-green-400" />
                              <span className="text-[10px] font-bold uppercase">Valid</span>
                            </>
                          ) : (
                            <>
                              <AlertTriangle className="w-4 h-4 text-red-400" />
                              <span className="text-[10px] font-bold uppercase block max-w-[150px] truncate">{row.error}</span>
                            </>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Generated Codes */}
            {generatedCodes.length > 0 && (
              <div className="space-y-4 pt-6 border-t border-zinc-900">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold text-white">Generated claiming Access Codes</h3>
                  <button 
                    onClick={() => alert('Downloaded PDF cards (tear-off format) & CSV list.')}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-[10px] font-bold"
                  >
                    <Download className="w-3.5 h-3.5" /> Export PDF Tear-off Cards
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {generatedCodes.map((c, idx) => (
                    <div key={idx} className="p-4 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-3 text-left">
                      <div className="flex justify-between items-start">
                        <div>
                          <h5 className="text-xs font-bold text-white">{c.name}</h5>
                          <span className="text-[9px] text-zinc-500">Class {c.classSec}</span>
                        </div>
                        <img src={schoolLogo} className="h-6 w-auto object-contain bg-zinc-900 rounded" />
                      </div>
                      <div className="p-2.5 rounded-lg bg-zinc-900 text-center font-mono font-black text-teal-400 text-sm border border-zinc-800 tracking-wider">
                        {c.code}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: SCENARIOS (SUPER ADMIN MATRIX EDITOR) */}
        {activeTab === 'scenarios' && (() => {
          // Compute filtered and sorted scenarios
          const filteredScenarios = scenarios.filter(scen => {
            const matchesSearch = scen.title.toLowerCase().includes(scenSearchQuery.toLowerCase()) ||
              (scen.questions && scen.questions.some((q: any) => q.question_text.toLowerCase().includes(scenSearchQuery.toLowerCase())));
            
            const matchesAge = scenAgeFilter === 'All' || scen.target_age_group === scenAgeFilter;
            
            const matchesDimension = scenDimensionFilter === 'All' || (
              scen.questions && scen.questions.some((q: any) => 
                q.options && q.options.some((o: any) => o.target_dimension && o.target_dimension.includes(scenDimensionFilter))
              )
            );
            
            const setsConfigured = new Set(scen.questions ? scen.questions.map((q: any) => q.sequence_order) : []);
            const hasSet1 = setsConfigured.has(1);
            const hasSet2 = setsConfigured.has(2);
            const hasSet3 = setsConfigured.has(3);
            const isFullyConfigured = hasSet1 && hasSet2 && hasSet3;
            
            const matchesCompleteness = scenCompletenessFilter === 'All' ||
              (scenCompletenessFilter === 'Complete' && isFullyConfigured) ||
              (scenCompletenessFilter === 'Incomplete' && !isFullyConfigured);
              
            const matchesStatus = scenStatusFilter === 'All' || 
              (scen.status || 'Published') === scenStatusFilter;
              
            return matchesSearch && matchesAge && matchesDimension && matchesCompleteness && matchesStatus;
          });

          // Sort scenarios
          filteredScenarios.sort((a, b) => {
            if (scenSortBy === 'title') {
              return a.title.localeCompare(b.title);
            }
            if (scenSortBy === 'questions') {
              const aCount = a.questions ? a.questions.length : 0;
              const bCount = b.questions ? b.questions.length : 0;
              return bCount - aCount;
            }
            if (scenSortBy === 'age') {
              const aAge = a.target_age_group || 'All';
              const bAge = b.target_age_group || 'All';
              return aAge.localeCompare(bAge);
            }
            if (scenSortBy === 'completeness') {
              const getCompleteness = (scen: any) => {
                const sets = new Set(scen.questions ? scen.questions.map((q: any) => q.sequence_order) : []);
                let score = 0;
                if (sets.has(1)) score++;
                if (sets.has(2)) score++;
                if (sets.has(3)) score++;
                return score;
              };
              return getCompleteness(b) - getCompleteness(a);
            }
            return 0;
          });

          // Compute analytics metrics
          const dimensionCounts: Record<string, number> = {
            'The Builder': 0,
            'The Thinker': 0,
            'The Creator': 0,
            'The Connector': 0,
            'The Leader': 0,
            'The Organizer': 0
          };
          
          const dimensionWeightsTotal: Record<string, number> = {
            'The Builder': 0,
            'The Thinker': 0,
            'The Creator': 0,
            'The Connector': 0,
            'The Leader': 0,
            'The Organizer': 0
          };

          let totalMappedOptions = 0;
          scenarios.forEach(scen => {
            if (scen.questions) {
              scen.questions.forEach((q: any) => {
                if (q.options) {
                  q.options.forEach((o: any) => {
                    if (o.target_dimension) {
                      o.target_dimension.split(',').forEach((d: string) => {
                        const trimmed = d.trim();
                        if (dimensionCounts[trimmed] !== undefined) {
                          dimensionCounts[trimmed]++;
                          dimensionWeightsTotal[trimmed] += (o.intensity_weight || 0.8);
                          totalMappedOptions++;
                        }
                      });
                    }
                  });
                }
              });
            }
          });

          const totalScenarios = scenarios.length;
          const fullyConfiguredCount = scenarios.filter(scen => {
            const sets = new Set(scen.questions ? scen.questions.map((q: any) => q.sequence_order) : []);
            return sets.has(1) && sets.has(2) && sets.has(3);
          }).length;

          // Estimate Readability for all questions
          const estimateReadability = (text: string) => {
            if (!text) return { score: 100, level: 'Easy', grade: 'Grades 8-9', warnings: [] };
            const words = text.split(/\s+/).filter(Boolean);
            const wordCount = words.length;
            if (wordCount < 3) return { score: 100, level: 'Easy', grade: 'Grades 8-9', warnings: [] };
            
            const sentenceCount = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length || 1;
            
            let syllablesCount = 0;
            words.forEach(w => {
              let cleanWord = w.toLowerCase().replace(/[^a-z]/g, '');
              if (cleanWord.endsWith('e')) cleanWord = cleanWord.slice(0, -1);
              const matches = cleanWord.match(/[aeiouy]{1,2}/g);
              syllablesCount += matches ? matches.length : 1;
            });

            const avgSentenceLength = wordCount / sentenceCount;
            const avgSyllablesPerWord = syllablesCount / wordCount;
            
            const score = 206.835 - (1.015 * avgSentenceLength) - (84.6 * avgSyllablesPerWord);
            
            let level = 'Easy';
            let grade = 'Grades 8-10';
            if (score < 55) {
              level = 'Complex';
              grade = 'College / Advanced';
            } else if (score < 75) {
              level = 'Moderate';
              grade = 'Grades 11-12';
            }

            const warnings: string[] = [];
            if (avgSentenceLength > 18) {
              warnings.push("Long sentences (high cognitive load)");
            }
            if (wordCount > 30) {
              warnings.push("High word count");
            }

            return {
              score: Math.max(0, Math.min(100, score)),
              level,
              grade,
              warnings
            };
          };

          // Run a checklist scan
          const auditLogs: any[] = [];
          scenarios.forEach(s => {
            const issues: string[] = [];
            if (!s.video_url || s.video_url.includes('placeholder') || !s.video_url.endsWith('.mp4')) {
              issues.push("Placeholder or invalid video loop format");
            }
            if (s.questions) {
              s.questions.forEach((q: any) => {
                const read = estimateReadability(q.question_text);
                if (read.level === 'Complex') {
                  issues.push(`QSet ${q.sequence_order}: Reading level is too complex for general assessment`);
                }
                if (read.warnings.length > 0) {
                  read.warnings.forEach(w => issues.push(`QSet ${q.sequence_order}: ${w}`));
                }
                if (!q.options || q.options.length !== 4) {
                  issues.push(`QSet ${q.sequence_order}: Does not have exactly 4 choices`);
                } else {
                  q.options.forEach((o: any) => {
                    if (!o.target_dimension) {
                      issues.push(`QSet ${q.sequence_order} (Option ${o.option_letter}): Missing target dimension`);
                    }
                    if (o.intensity_weight > 1.0 || o.intensity_weight < 0.1) {
                      issues.push(`QSet ${q.sequence_order} (Option ${o.option_letter}): Weight is out of bounds (0.1 - 1.0)`);
                    }
                  });
                }
              });
            }
            if (issues.length > 0) {
              auditLogs.push({ id: s.id, title: s.title, issues });
            }
          });

          return (
            <div className="space-y-6">
              {/* Header section */}
              <div className="flex justify-between items-center flex-wrap gap-4">
                <div>
                  <h1 className="text-2xl font-black tracking-tight text-white mb-1">Scenario Matrix Manager</h1>
                  <p className="text-zinc-400 text-xs">Analyze diagnostic coverage, test items balance, and coordinate cinematic assets</p>
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={handleCreateScenarioClick}
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-[0_0_15px_rgba(168,85,247,0.25)] transition-all"
                  >
                    <Plus className="w-4 h-4" /> Create Scenario
                  </button>
                  <button 
                    onClick={handleCreateQuestionSetClick}
                    className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-[0_0_15px_rgba(20,184,166,0.25)] transition-all"
                  >
                    <Plus className="w-4 h-4" /> Add Question Set
                  </button>
                </div>
              </div>

              {/* Sub-navigation tabs */}
              <div className="flex border-b border-zinc-900 gap-4">
                {[
                  { id: 'grid', label: 'Scenario Library' },
                  { id: 'matrix', label: 'Diagnostic Coverage Grid' },
                  { id: 'analytics', label: 'Balance Analytics' },
                  { id: 'simulator', label: 'Simulator Sandbox' },
                  { id: 'schema', label: 'Bulk Schema Sync' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setScenActiveView(tab.id as any)}
                    className={`pb-3 text-xs font-bold transition-all relative ${
                      scenActiveView === tab.id 
                        ? 'text-teal-400 border-b-2 border-teal-500' 
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Toolbar Filters (visible for Library and Matrix views) */}
              {(scenActiveView === 'grid' || scenActiveView === 'matrix') && (
                <div className="p-4 rounded-2xl bg-zinc-950/40 border border-zinc-900/80 flex flex-wrap gap-4 justify-between items-center text-left">
                  <div className="flex flex-wrap gap-3 items-center w-full md:w-auto">
                    <div className="relative w-full sm:w-64">
                      <input 
                        type="text"
                        placeholder="Search Title or Question Prompt..."
                        value={scenSearchQuery}
                        onChange={(e) => setScenSearchQuery(e.target.value)}
                        className="w-full bg-zinc-900/60 border border-zinc-800 rounded-xl py-2 px-3 pl-8 text-xs focus:outline-none text-white focus:border-teal-500/50 transition-all"
                      />
                      <span className="absolute left-2.5 top-2.5 text-zinc-500 text-xs">🔍</span>
                    </div>

                    <select
                      value={scenAgeFilter}
                      onChange={(e) => setScenAgeFilter(e.target.value)}
                      className="bg-zinc-900 border border-zinc-800 rounded-xl py-2 px-3 text-xs focus:outline-none text-white focus:border-teal-500/50"
                    >
                      <option value="All">All Grades</option>
                      <option value="All Grades (8-12)">All Grades (8-12)</option>
                      <option value="8-10">Middle School (8-10)</option>
                      <option value="11-12">High School (11-12)</option>
                    </select>

                    <select
                      value={scenStatusFilter}
                      onChange={(e) => setScenStatusFilter(e.target.value as any)}
                      className="bg-zinc-900 border border-zinc-800 rounded-xl py-2 px-3 text-xs focus:outline-none text-white focus:border-teal-500/50"
                    >
                      <option value="All">All Statuses</option>
                      <option value="Draft">Drafts Only</option>
                      <option value="Published">Published Only</option>
                      <option value="Archived">Archived Only</option>
                    </select>

                    <select
                      value={scenCompletenessFilter}
                      onChange={(e) => setScenCompletenessFilter(e.target.value)}
                      className="bg-zinc-900 border border-zinc-800 rounded-xl py-2 px-3 text-xs focus:outline-none text-white focus:border-teal-500/50"
                    >
                      <option value="All">All Completeness</option>
                      <option value="Complete">Complete (Sets 1-3)</option>
                      <option value="Incomplete">Needs Attention</option>
                    </select>

                    <select
                      value={scenSortBy}
                      onChange={(e) => setScenSortBy(e.target.value as any)}
                      className="bg-zinc-900 border border-zinc-800 rounded-xl py-2 px-3 text-xs focus:outline-none text-white focus:border-teal-500/50"
                    >
                      <option value="title">Sort by Title (A-Z)</option>
                      <option value="questions">Sort by Question Count</option>
                      <option value="age">Sort by Grade Group</option>
                      <option value="completeness">Sort by Completeness</option>
                    </select>
                  </div>
                  <div className="text-[10px] font-bold text-zinc-500">
                    Showing {filteredScenarios.length} of {totalScenarios} Scenarios
                  </div>
                </div>
              )}

              {/* View 1: Scenario Library (Cards) */}
              {scenActiveView === 'grid' && (
                <div className="grid grid-cols-1 gap-6">
                  {filteredScenarios.map((scen) => {
                    const sets = new Set(scen.questions ? scen.questions.map((q: any) => q.sequence_order) : []);
                    const isComplete = sets.has(1) && sets.has(2) && sets.has(3);

                    return (
                      <div key={scen.id} className="p-6 rounded-3xl bg-zinc-950 border border-zinc-900 space-y-4 text-left relative overflow-hidden">
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-[9px] font-bold text-purple-400 uppercase tracking-wider">
                                {scen.target_age_group === 'All' ? 'All Grades' : `Grades ${scen.target_age_group}`}
                              </span>
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${
                                isComplete 
                                  ? 'bg-teal-500/10 border-teal-500/20 text-teal-400' 
                                  : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                              }`}>
                                {isComplete ? 'Fully Configured' : 'Needs Config'}
                              </span>
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${
                                (scen.status || 'Published') === 'Published'
                                  ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-450'
                                  : (scen.status || 'Published') === 'Draft'
                                  ? 'bg-blue-500/10 border-blue-500/25 text-blue-450'
                                  : 'bg-zinc-800 border-zinc-700 text-zinc-400'
                              }`}>
                                {scen.status || 'Published'}
                              </span>
                              {(scen.focus_category || 'STEM').split(',').map((cat: string) => (
                                <span key={cat.trim()} className="px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-[9px] text-zinc-400 uppercase tracking-wider font-mono">
                                  {cat.trim()}
                                </span>
                              ))}
                              <span className="text-zinc-500 text-[10px]">ID: {scen.id}</span>
                            </div>
                            <h4 className="text-base font-extrabold text-white flex items-center gap-2">
                              {scen.title}
                              <span className="text-zinc-500 text-xs font-normal">({scen.expected_time || 60}s clip)</span>
                            </h4>
                            <p className="text-xs text-zinc-500 font-mono">{scen.video_url}</p>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 self-end sm:self-start">
                            <button 
                              onClick={() => handleEditScenarioClick(scen)}
                              className="p-2 px-3 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-all text-xs font-bold flex items-center gap-1"
                            >
                              <Pencil className="w-3.5 h-3.5 text-purple-400" /> Edit Backdrop
                            </button>
                            <button 
                              onClick={() => handleDeleteScenario(scen.id)}
                              className="p-2 px-3 rounded-xl bg-red-950/20 border border-red-900/30 hover:bg-red-900/20 text-red-400 hover:text-red-300 transition-all text-xs font-bold flex items-center gap-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Delete
                            </button>
                          </div>
                        </div>

                        {/* Render questions inside scenario */}
                        <div className="space-y-3 pt-3 border-t border-zinc-900/60">
                          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Scored Questions</span>
                          {scen.questions && scen.questions.length > 0 ? (
                            scen.questions.map((q: any, qIdx: number) => {
                              const readability = estimateReadability(q.question_text);
                              return (
                                <div key={q.id || qIdx} className="p-4 rounded-2xl bg-zinc-900/40 border border-zinc-900 space-y-2">
                                  <div className="flex flex-wrap justify-between items-center text-[10px] text-zinc-500 gap-2">
                                    <span className="font-bold">Set {q.sequence_order} • Q{qIdx + 1}</span>
                                    <div className="flex items-center gap-2">
                                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                                        readability.level === 'Complex' ? 'bg-amber-950/40 text-amber-400 border border-amber-900/50' : 'bg-zinc-900 text-zinc-500'
                                      }`}>
                                        Readability: {readability.grade} ({readability.level})
                                      </span>
                                      <span className="font-bold text-amber-500">Trigger: {q.show_at_seconds || 5}s</span>
                                    </div>
                                  </div>
                                  <p className="text-xs text-zinc-200 font-semibold">{q.question_text}</p>
                                  {readability.warnings.length > 0 && (
                                    <div className="text-[9px] text-amber-400/90 font-medium">
                                      ⚠️ {readability.warnings.join(', ')}
                                    </div>
                                  )}
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                                    {q.options && q.options.map((opt: any, oIdx: number) => (
                                      <div key={opt.id || oIdx} className="p-2.5 rounded-xl bg-black/40 border border-zinc-900/60 text-[10px] space-y-1">
                                        <span className="font-bold text-teal-400 font-mono">Option {opt.option_letter}:</span>
                                        <p className="text-zinc-400 line-clamp-1">{opt.option_text}</p>
                                        <div className="flex justify-between text-[8px] text-zinc-650 pt-1 border-t border-zinc-900/40">
                                          <span>Spectrum: <strong className="text-zinc-400">{opt.target_dimension || 'None'}</strong></span>
                                          <span>Weight: <strong className="text-zinc-400 font-mono">{opt.intensity_weight}</strong></span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            })
                          ) : (
                            <p className="text-xs text-zinc-600 italic">No questions added to this scenario yet.</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* View 2: Set Matrix Diagnostic Grid */}
              {scenActiveView === 'matrix' && (
                <div className="overflow-x-auto rounded-3xl border border-zinc-900 bg-zinc-950 shadow-2xl">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead>
                      <tr className="bg-zinc-900/40 border-b border-zinc-900 text-zinc-500 font-bold uppercase tracking-wider">
                        <th className="p-4">Scenario Backdrop</th>
                        <th className="p-4 text-center">Set 1 (Initial Year)</th>
                        <th className="p-4 text-center">Set 2 (Year 2)</th>
                        <th className="p-4 text-center">Set 3 (Year 3)</th>
                        <th className="p-4 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-900">
                      {filteredScenarios.map((scen) => {
                        const qs = scen.questions || [];
                        const set1Count = qs.filter((q: any) => q.sequence_order === 1).length;
                        const set2Count = qs.filter((q: any) => q.sequence_order === 2).length;
                        const set3Count = qs.filter((q: any) => q.sequence_order === 3).length;

                        const isComplete = set1Count > 0 && set2Count > 0 && set3Count > 0;

                        return (
                          <tr key={scen.id} className="hover:bg-zinc-900/20 transition-all">
                            <td className="p-4 font-bold text-zinc-200">
                              <div>{scen.title}</div>
                              <div className="text-[10px] text-zinc-500 font-mono mt-0.5 flex items-center gap-1.5">
                                <span>{scen.target_age_group === 'All' ? 'All Grades' : `Grades ${scen.target_age_group}`}</span>
                                <span>•</span>
                                <span className="text-zinc-600 uppercase">
                                  {(scen.focus_category || 'STEM').split(',').map((c: string) => c.trim()).join(' | ')}
                                </span>
                              </div>
                            </td>

                            {/* Set 1 Cell */}
                            <td className="p-4 text-center">
                              <button
                                onClick={() => setSelectedMatrixCell({ scenarioId: scen.id, setNum: 1 })}
                                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                                  set1Count > 0 
                                    ? 'bg-teal-500/10 border border-teal-500/30 text-teal-400 hover:bg-teal-500/20' 
                                    : 'border border-dashed border-zinc-800 text-zinc-500 hover:text-zinc-400 hover:border-zinc-700'
                                }`}
                              >
                                {set1Count > 0 ? `⚙️ Set 1 (${set1Count} Qs)` : '+ Configure'}
                              </button>
                            </td>

                            {/* Set 2 Cell */}
                            <td className="p-4 text-center">
                              <button
                                onClick={() => setSelectedMatrixCell({ scenarioId: scen.id, setNum: 2 })}
                                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                                  set2Count > 0 
                                    ? 'bg-teal-500/10 border border-teal-500/30 text-teal-400 hover:bg-teal-500/20' 
                                    : 'border border-dashed border-zinc-800 text-zinc-500 hover:text-zinc-400 hover:border-zinc-700'
                                }`}
                              >
                                {set2Count > 0 ? `⚙️ Set 2 (${set2Count} Qs)` : '+ Configure'}
                              </button>
                            </td>

                            {/* Set 3 Cell */}
                            <td className="p-4 text-center">
                              <button
                                onClick={() => setSelectedMatrixCell({ scenarioId: scen.id, setNum: 3 })}
                                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                                  set3Count > 0 
                                    ? 'bg-teal-500/10 border border-teal-500/30 text-teal-400 hover:bg-teal-500/20' 
                                    : 'border border-dashed border-zinc-800 text-zinc-500 hover:text-zinc-400 hover:border-zinc-700'
                                }`}
                              >
                                {set3Count > 0 ? `⚙️ Set 3 (${set3Count} Qs)` : '+ Configure'}
                              </button>
                            </td>

                            {/* Completeness Cell */}
                            <td className="p-4 text-center font-bold">
                              <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-mono ${
                                isComplete 
                                  ? 'bg-teal-550/15 border border-teal-500/20 text-teal-450' 
                                  : 'bg-amber-550/15 border border-amber-500/20 text-amber-450'
                              }`}>
                                {isComplete ? '100% COMPLETE' : 'INCOMPLETE'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* View 3: Balance Analytics Panel */}
              {scenActiveView === 'analytics' && (
                <div className="space-y-6 text-left">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Item Balance chart */}
                    <div className="p-6 rounded-3xl bg-zinc-950 border border-zinc-900 space-y-4">
                      <h3 className="text-base font-extrabold text-white">Diagnostic Trait Representation</h3>
                      <p className="text-xs text-zinc-500">Distribution of dimension scoring triggers across options in all active scenarios.</p>

                      <div className="space-y-3 pt-2">
                        {Object.entries(dimensionCounts).map(([dimension, count]) => {
                          const pct = totalMappedOptions > 0 ? (count / totalMappedOptions) * 100 : 0;
                          const isUnderRepresented = pct < 12; // warn if less than 12% share
                          const avgWeight = count > 0 ? (dimensionWeightsTotal[dimension] / count) : 0;
                          
                          return (
                            <div key={dimension} className="space-y-1">
                              <div className="flex justify-between text-[10px] font-bold">
                                <span className="text-zinc-300">{dimension}</span>
                                <span className={`${isUnderRepresented ? 'text-amber-450' : 'text-zinc-500'}`}>
                                  {count} triggers ({pct.toFixed(1)}%) • Avg Weight: {avgWeight.toFixed(2)}
                                </span>
                              </div>
                              <div className="h-2 rounded-full bg-zinc-900 overflow-hidden relative">
                                <div 
                                  className={`h-full rounded-full transition-all ${
                                    isUnderRepresented ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.3)]' : 'bg-teal-500'
                                  }`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Grade Level & Focus Category Distributions */}
                    <div className="p-6 rounded-3xl bg-zinc-950 border border-zinc-900 space-y-4">
                      <h3 className="text-base font-extrabold text-white">Focus Category & Grade Distribution</h3>
                      <p className="text-xs text-zinc-500">Aggregated metadata checking diversity of test contents.</p>

                      <div className="space-y-4 pt-2">
                        {/* Grades */}
                        <div className="space-y-2">
                          <span className="text-[10px] font-bold text-zinc-500 uppercase block tracking-wider">Target Cohorts</span>
                          <div className="grid grid-cols-3 gap-2">
                            {['All', '8-10', '11-12'].map(g => {
                              const count = scenarios.filter(s => s.target_age_group === g || (g === 'All' && !s.target_age_group)).length;
                              const pct = scenarios.length > 0 ? (count / scenarios.length) * 100 : 0;
                              return (
                                <div key={g} className="p-2.5 bg-zinc-900/40 rounded-xl border border-zinc-900 text-center">
                                  <span className="text-[9px] text-zinc-500 block uppercase font-bold">{g === 'All' ? 'All Grades' : `Grades ${g}`}</span>
                                  <span className="text-xs font-black text-white font-mono">{count} ({pct.toFixed(0)}%)</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Focus Areas */}
                        <div className="space-y-2">
                          <span className="text-[10px] font-bold text-zinc-500 uppercase block tracking-wider">Focus Domains</span>
                          <div className="grid grid-cols-2 gap-2">
                            {['STEM', 'Creative Arts', 'Leadership', 'Interpersonal Care', 'Systems & Logic'].map(cat => {
                              const count = scenarios.filter(s => {
                                const cats = (s.focus_category || 'STEM').split(',').map((c: string) => c.trim());
                                return cats.includes(cat);
                              }).length;
                              return (
                                <div key={cat} className="flex justify-between items-center p-2 px-3 bg-zinc-900/40 border border-zinc-900 rounded-xl text-xs">
                                  <span className="text-zinc-400 font-medium">{cat}</span>
                                  <strong className="text-white font-mono">{count}</strong>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Psychometric Audit & Video Health Checks */}
                  <div className="p-6 rounded-3xl bg-zinc-950 border border-zinc-900 space-y-4">
                    <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                      Psychometric Health & Quality Audits
                      {auditLogs.length > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/25 text-[9px] text-red-400 font-mono font-bold animate-pulse">
                          {auditLogs.length} Scenarios Flagged
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-zinc-500">Live scanning of text complexity, choice boundaries, and loop asset formats.</p>

                    {auditLogs.length > 0 ? (
                      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                        {auditLogs.map((log) => (
                          <div key={log.id} className="p-4 rounded-2xl bg-zinc-900/25 border border-zinc-900 text-xs space-y-1.5">
                            <span className="font-extrabold text-teal-400 block">{log.title} (ID: {log.id})</span>
                            <ul className="space-y-1 pl-4 list-disc text-zinc-400 text-[10px]">
                              {log.issues.map((iss: string, idx: number) => (
                                <li key={idx} className="leading-relaxed text-zinc-400">
                                  <span className="text-amber-500 font-bold">⚠️</span> {iss}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-6 rounded-2xl bg-teal-950/10 border border-teal-500/15 text-center text-xs text-teal-400 font-semibold">
                        ✓ All scenarios and questions pass the psychometric cognitive complexity and video asset health checks!
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* View 4: Live Simulator Sandbox */}
              {scenActiveView === 'simulator' && (
                <div className="space-y-6 text-left">
                  <div className="p-6 rounded-3xl bg-zinc-950 border border-zinc-900 space-y-6">
                    <div>
                      <h3 className="text-base font-extrabold text-white">Immersive Assessment Simulation Sandbox</h3>
                      <p className="text-xs text-zinc-500 mt-1">Select a scenario and set to preview the visual overlays and mathematical scoring delta calculations.</p>
                    </div>

                    {!simIsRunning ? (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                        <div className="space-y-1">
                          <label className="text-[10px] text-zinc-500 font-bold uppercase">Select Scenario Backdrop</label>
                          <select
                            value={simScenarioId}
                            onChange={(e) => setSimScenarioId(e.target.value)}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2 px-3 text-xs focus:outline-none text-white focus:border-purple-500/50"
                          >
                            <option value="">-- Choose Scenario --</option>
                            {scenarios.map(s => (
                              <option key={s.id} value={s.id}>{s.title} ({s.questions ? s.questions.length : 0} Qs total)</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] text-zinc-500 font-bold uppercase">Assessment Set Number</label>
                          <select
                            value={simSetNumber}
                            onChange={(e) => setSimSetNumber(Number(e.target.value))}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2 px-3 text-xs focus:outline-none text-white focus:border-purple-500/50"
                          >
                            <option value={1}>Set 1 (Initial Year)</option>
                            <option value={2}>Set 2 (Year 2)</option>
                            <option value={3}>Set 3 (Year 3)</option>
                          </select>
                        </div>
                        <button
                          disabled={!simScenarioId}
                          onClick={() => startSimulatorSession(simScenarioId, simSetNumber)}
                          className="w-full px-4 py-2 bg-teal-600 hover:bg-teal-500 disabled:opacity-40 disabled:hover:bg-teal-600 text-black font-extrabold text-xs rounded-xl shadow-[0_0_15px_rgba(20,184,166,0.2)] transition-all h-[36px]"
                        >
                          Launch Simulator Session
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        
                        {/* Simulation Screen Box */}
                        <div className="lg:col-span-8 flex flex-col space-y-4">
                          <div className="relative aspect-video rounded-2xl bg-[#0a0a0a] border border-zinc-800 flex flex-col items-center justify-center overflow-hidden shadow-inner p-4 text-center">
                            
                            {/* Complete State */}
                            {simCompleted ? (
                              <div className="space-y-4 max-w-md animate-scaleUp">
                                <span className="text-4xl">🏆</span>
                                <h4 className="text-base font-black text-teal-400">Simulation Complete!</h4>
                                <p className="text-[11px] text-zinc-400">The assessment set has been successfully simulated. Review the final score vector in the status dashboard.</p>
                                <button
                                  onClick={() => setSimIsRunning(false)}
                                  className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-bold text-xs rounded-lg border border-zinc-800"
                                >
                                  End Simulation
                                </button>
                              </div>
                            ) : (
                              <>
                                {/* Overlay Question State */}
                                {simShowOverlay && simQuestions[simCurrentQIndex] ? (
                                  <div className="absolute inset-0 z-10 flex items-center justify-center p-6 bg-black/60 backdrop-blur-md animate-fadeIn">
                                    <div className="bg-zinc-950/80 border border-zinc-850 p-6 rounded-3xl w-full max-w-lg space-y-4 text-left shadow-2xl relative overflow-hidden">
                                      <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-teal-500 to-indigo-500" />
                                      <span className="text-[9px] font-bold text-teal-400 uppercase tracking-widest block font-mono">Question Overlay Triggered</span>
                                      <h5 className="text-xs font-bold text-white leading-relaxed">{simQuestions[simCurrentQIndex].question_text}</h5>
                                      
                                      <div className="space-y-2 pt-2">
                                        {simQuestions[simCurrentQIndex].options && simQuestions[simCurrentQIndex].options.map((opt: any) => {
                                          const isSelected = simSelectedOption === opt.option_letter;
                                          return (
                                            <button
                                              key={opt.option_letter}
                                              disabled={simSelectedOption !== null}
                                              onClick={() => {
                                                setSimSelectedOption(opt.option_letter);
                                                
                                                // Calculate scoring delta
                                                const updatedTheta = { ...simThetaVector };
                                                const dims = opt.target_dimension || '';
                                                const w = opt.intensity_weight || 0.8;
                                                
                                                const simDimensionMap: Record<string, string> = {
                                                  'Realistic': 'R',
                                                  'The Builder': 'R',
                                                  'Investigative': 'I',
                                                  'The Thinker': 'I',
                                                  'Artistic': 'A',
                                                  'The Creator': 'A',
                                                  'Social': 'S',
                                                  'The Connector': 'S',
                                                  'Enterprising': 'E',
                                                  'The Leader': 'E',
                                                  'Conventional': 'C',
                                                  'The Organizer': 'C'
                                                };
                                                dims.split(',').forEach((d: string) => {
                                                  const name = d.trim();
                                                  const code = simDimensionMap[name];
                                                  if (code) {
                                                    updatedTheta[code] = Number((updatedTheta[code] + w).toFixed(2));
                                                  }
                                                });

                                                setSimLogs(prev => [
                                                  ...prev,
                                                  `[00:${simCurrentTime < 10 ? '0' + simCurrentTime : simCurrentTime}] Option ${opt.option_letter} clicked -> Dimension [${dims}] weight: +${w}`
                                                ]);
                                                
                                                setTimeout(() => {
                                                  setSimThetaVector(updatedTheta);
                                                  setSimSelectedOption(null);
                                                  setSimShowOverlay(false);
                                                  
                                                  const nextQIdx = simCurrentQIndex + 1;
                                                  setSimAnsweredCount(nextQIdx);
                                                  if (nextQIdx >= simQuestions.length) {
                                                    setSimCompleted(true);
                                                    setSimLogs(prev => [
                                                      ...prev,
                                                      `[00:${simCurrentTime < 10 ? '0' + simCurrentTime : simCurrentTime}] Simulation complete. Final scores applied.`
                                                    ]);
                                                  } else {
                                                    setSimCurrentQIndex(nextQIdx);
                                                    setSimLogs(prev => [
                                                      ...prev,
                                                      `[00:${simCurrentTime < 10 ? '0' + simCurrentTime : simCurrentTime}] Resuming backdrop playback.`
                                                    ]);
                                                  }
                                                }, 800);
                                              }}
                                              className={`w-full p-3 rounded-xl border text-[10px] text-left transition-all block relative ${
                                                isSelected 
                                                  ? 'bg-teal-950/40 border-teal-500 text-teal-400 shadow-[0_0_12px_rgba(20,184,166,0.2)]'
                                                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-850 hover:text-white'
                                              }`}
                                            >
                                              <span className="font-extrabold text-teal-400 font-mono mr-2">{opt.option_letter}.</span>
                                              {opt.option_text}
                                              
                                              {/* Admin insight: target dimension hover display */}
                                              <span className="absolute right-3 top-2.5 px-1.5 py-0.5 rounded bg-zinc-950 text-[8px] text-zinc-500 font-semibold uppercase font-mono group-hover:block border border-zinc-800">
                                                {opt.target_dimension} (+{opt.intensity_weight})
                                              </span>
                                            </button>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  /* Playback mockup animation */
                                  <div className="space-y-4">
                                    <div className="flex gap-1.5 justify-center items-center">
                                      <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" />
                                      <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-extrabold font-mono">BACKDROP PLAYING</span>
                                    </div>
                                    <h4 className="text-sm font-extrabold text-white">Simulating MP4 Backdrop Video</h4>
                                    <div className="flex gap-2 justify-center pt-2">
                                      {Array.from({ length: 5 }).map((_, i) => (
                                        <div 
                                          key={i} 
                                          className="w-1.5 h-6 bg-teal-500/35 rounded-full transition-all duration-300"
                                          style={{ 
                                            height: `${12 + Math.sin((simCurrentTime + i) * 1.5) * 12}px`,
                                            opacity: 0.3 + (i * 0.15)
                                          }}
                                        />
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </>
                            )}

                          </div>

                          {/* Simulation Playback controls */}
                          <div className="p-3 bg-zinc-950 border border-zinc-900 rounded-2xl flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                              <button
                                disabled={simCompleted}
                                onClick={() => {
                                  // Simple tick playback timer toggle
                                  if (simIsRunning && !simShowOverlay) {
                                    // Start timeline tick loop simulation
                                    const interval = setInterval(() => {
                                      setSimCurrentTime(t => {
                                        const nextTime = t + 1;
                                        // Check if a question triggers
                                        const qIndex = simQuestions.findIndex(q => q.show_at_seconds === nextTime);
                                        if (qIndex !== -1) {
                                          clearInterval(interval);
                                          setSimShowOverlay(true);
                                          setSimCurrentQIndex(qIndex);
                                          setSimLogs(prev => [
                                            ...prev,
                                            `[00:${nextTime < 10 ? '0' + nextTime : nextTime}] Auto-paused. Question #${qIndex + 1} Overlay triggered.`
                                          ]);
                                        }
                                        if (nextTime >= 60) {
                                          clearInterval(interval);
                                          setSimCompleted(true);
                                        }
                                        return nextTime;
                                      });
                                    }, 1000);

                                    // Store interval on window to clear easily
                                    (window as any).simInterval = interval;
                                    setSimLogs(prev => [...prev, `[00:${simCurrentTime < 10 ? '0' + simCurrentTime : simCurrentTime}] Backdrop playback resumed.`]);
                                  }
                                }}
                                className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 text-[10px] rounded-lg text-zinc-300 hover:text-white font-bold"
                              >
                                Play Timer
                              </button>
                              <button
                                onClick={() => {
                                  if ((window as any).simInterval) {
                                    clearInterval((window as any).simInterval);
                                    setSimLogs(prev => [...prev, `[00:${simCurrentTime < 10 ? '0' + simCurrentTime : simCurrentTime}] Paused by admin.`]);
                                  }
                                }}
                                className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 text-[10px] rounded-lg text-zinc-300 hover:text-white font-bold"
                              >
                                Pause
                              </button>
                            </div>

                            <div className="text-[10px] text-zinc-500 font-mono">
                              Timeline: 00:{simCurrentTime < 10 ? '0' + simCurrentTime : simCurrentTime} / 00:60
                            </div>

                            <button
                              onClick={() => {
                                if ((window as any).simInterval) clearInterval((window as any).simInterval);
                                setSimIsRunning(false);
                              }}
                              className="px-3 py-1.5 bg-red-950/20 border border-red-900/30 text-[10px] rounded-lg text-red-400 font-bold"
                            >
                              Exit Simulation
                            </button>
                          </div>
                        </div>

                        {/* Status Dashboard Side panel */}
                        <div className="lg:col-span-4 flex flex-col space-y-4 text-left">
                          
                          {/* Live Scores */}
                          <div className="p-5 bg-zinc-950 border border-zinc-900 rounded-3xl space-y-4">
                            <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block font-mono">Live Scoring vector</span>
                            
                            <div className="space-y-2.5">
                              {[
                                { key: 'R', label: 'The Builder' },
                                { key: 'I', label: 'The Thinker' },
                                { key: 'A', label: 'The Creator' },
                                { key: 'S', label: 'The Connector' },
                                { key: 'E', label: 'The Leader' },
                                { key: 'C', label: 'The Organizer' }
                              ].map((dim) => {
                                const score = simThetaVector[dim.key] || 0;
                                return (
                                  <div key={dim.key} className="space-y-1 text-xs">
                                    <div className="flex justify-between font-semibold">
                                      <span className="text-zinc-400">{dim.label} ({dim.key})</span>
                                      <span className="text-teal-400 font-mono">+{score.toFixed(1)}</span>
                                    </div>
                                    <div className="h-1 rounded bg-zinc-900 overflow-hidden">
                                      <div 
                                        className="h-full bg-teal-500 transition-all duration-300"
                                        style={{ width: `${Math.min(100, score * 25)}%` }}
                                      />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Simulation log console */}
                          <div className="p-4 bg-black border border-zinc-900 rounded-2xl flex flex-col space-y-2 flex-1 min-h-[180px]">
                            <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider block font-mono">Logs Console</span>
                            <div className="flex-1 overflow-y-auto text-[9px] font-mono text-zinc-400 space-y-1 max-h-[180px]">
                              {simLogs.map((log, idx) => (
                                <div key={idx} className="leading-normal">
                                  {log}
                                </div>
                              ))}
                            </div>
                          </div>

                        </div>

                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* View 5: Bulk Schema Sync */}
              {scenActiveView === 'schema' && (
                <div className="space-y-6 text-left max-w-4xl mx-auto">
                  <div className="p-6 rounded-3xl bg-zinc-950 border border-zinc-900 space-y-4">
                    <div>
                      <h3 className="text-base font-extrabold text-white">Scenario Matrix Data Schema</h3>
                      <p className="text-xs text-zinc-500 mt-1">Export your entire scenario backdrop matrix configuration as a single JSON file, or edit the active JSON schema inline below.</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <button
                        onClick={handleExportScenarios}
                        className="p-4 rounded-2xl border border-zinc-850 bg-zinc-900/30 hover:bg-zinc-900/60 transition-all space-y-2 text-left"
                      >
                        <div className="text-xs font-bold text-white">Export Scenarios JSON</div>
                        <p className="text-[10px] text-zinc-500">Download the complete JSON schema containing all configured backdrops, questions, trigger frames, options, weights, and dimension keys.</p>
                      </button>

                      <label className="p-4 rounded-2xl border border-zinc-850 bg-zinc-900/30 hover:bg-zinc-900/60 transition-all space-y-2 text-left cursor-pointer block">
                        <div className="text-xs font-bold text-white">Import Scenarios JSON File</div>
                        <p className="text-[10px] text-zinc-500">Upload a JSON array schema file to replace or seed your diagnostic scenario bank in bulk. Files will be parsed and validated immediately.</p>
                        <input 
                          type="file"
                          accept=".json"
                          onChange={handleImportScenarios}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Inline JSON Schema editor */}
                  <div className="p-6 rounded-3xl bg-zinc-950 border border-zinc-900 space-y-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider block">Interactive Inline Schema Editor</h4>
                        <span className="text-[9px] text-zinc-500">Edit JSON schema tags directly. Changes will commit to platform state on apply.</span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            try {
                              const parsed = JSON.parse(bulkJsonText);
                              setBulkJsonText(JSON.stringify(parsed, null, 2));
                              setBulkJsonError(null);
                            } catch (e: any) {
                              setBulkJsonError(`Formatting Error: ${e.message}`);
                            }
                          }}
                          className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-[10px] font-bold text-zinc-400 hover:text-white"
                        >
                          Prettify JSON
                        </button>
                        <button
                          onClick={handleApplyBulkChanges}
                          className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-black font-extrabold text-[10px]"
                        >
                          Apply Changes
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <textarea
                        value={bulkJsonText}
                        onChange={(e) => handleValidateBulkJson(e.target.value)}
                        className="w-full h-[350px] bg-black font-mono text-[10px] p-4 border border-zinc-900 rounded-2xl focus:outline-none focus:border-teal-500/50 text-zinc-300 leading-relaxed overflow-y-auto"
                        placeholder="Paste scenario array JSON here..."
                      />
                      {bulkJsonError ? (
                        <div className="p-3.5 bg-red-950/20 border border-red-900/30 text-red-400 rounded-xl text-[10px] font-mono leading-relaxed">
                          ❌ {bulkJsonError}
                        </div>
                      ) : (
                        <div className="text-[10px] text-emerald-450 font-bold">
                          ✓ Schema JSON syntax is valid and structure is clean!
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* TAB 6: SCHOOLS DIRECTORY (SUPER ADMIN SCHOOLS MANAGER) */}
        {activeTab === 'schools' && (
          <div className="space-y-8">
            <div className="flex justify-between items-center flex-wrap gap-4">
              <div>
                <h1 className="text-2xl font-black tracking-tight text-white mb-1">Enrolled School Directory</h1>
                <p className="text-zinc-400 text-xs">Register partner institutions, toggle statuses, and allocate credit balances</p>
              </div>
              <button 
                onClick={() => setIsSchoolModalOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-[0_0_15px_rgba(168,85,247,0.25)] transition-all"
              >
                <Plus className="w-4.5 h-4.5" /> Enroll New School
              </button>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {schoolsList.map((sch) => (
                <div key={sch.id} className="p-6 rounded-3xl bg-zinc-950 border border-zinc-900 space-y-4 text-left relative overflow-hidden">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full bg-teal-500/10 border border-teal-500/20 text-[9px] font-bold text-teal-400 uppercase tracking-wider">
                          Board: {sch.board}
                        </span>
                        <span className="text-zinc-500 text-[10px]">ID: {sch.id}</span>
                      </div>
                      <h4 className="text-base font-extrabold text-white">{sch.name}</h4>
                      <p className="text-xs text-zinc-400">{sch.location} • {sch.contact}</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <button 
                        onClick={() => handleImpersonateSchool(sch)}
                        className="px-3.5 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-black text-xs font-extrabold flex items-center gap-1 transition-all"
                      >
                        <Eye className="w-3.5 h-3.5" /> Impersonate
                      </button>
                      <button 
                        onClick={() => {
                          setCreditSelectedSchool(sch);
                          setCreditAmount(100);
                          setIsCreditModalOpen(true);
                        }}
                        className="px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 text-zinc-300 text-xs font-bold flex items-center gap-1 transition-all"
                      >
                        <Coins className="w-3.5 h-3.5 text-amber-500" /> Allocate Credits
                      </button>
                      <button 
                        onClick={() => handleDeleteSchool(sch.id)}
                        className="p-2 rounded-xl bg-red-950/20 border border-red-900/30 hover:bg-red-900/20 text-red-400 hover:text-red-300 transition-all text-xs font-bold"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Stats & Credit balance */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-zinc-900/60">
                    <div className="p-3 bg-zinc-900/40 border border-zinc-900 rounded-2xl text-center">
                      <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest block">Total Allocated Credits</span>
                      <span className="text-base font-black text-white block mt-0.5">{sch.totalCredits}</span>
                    </div>
                    <div className="p-3 bg-zinc-900/40 border border-zinc-900 rounded-2xl text-center">
                      <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest block">Consumed Credits</span>
                      <span className="text-base font-black text-teal-400 block mt-0.5">{sch.usedCredits}</span>
                    </div>
                    <div className="p-3 bg-zinc-900/40 border border-zinc-900 rounded-2xl text-center">
                      <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest block">Remaining Balance</span>
                      <span className="text-base font-black text-amber-400 block mt-0.5">{sch.totalCredits - sch.usedCredits}</span>
                    </div>
                    <div className="p-3 bg-zinc-900/40 border border-zinc-900 rounded-2xl flex flex-col items-center justify-center gap-1">
                      <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest block">System Status</span>
                      <div className="flex items-center gap-2">
                        <input 
                          type="checkbox"
                          checked={sch.active}
                          onChange={() => handleToggleSchoolActive(sch.id)}
                          className="w-3.5 h-3.5 rounded text-purple-600 focus:ring-purple-500 bg-zinc-900 border-zinc-800"
                        />
                        <span className={`text-[10px] font-extrabold uppercase ${sch.active ? 'text-green-400' : 'text-zinc-500'}`}>
                          {sch.active ? 'Active' : 'Suspended'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 7: USER DIRECTORY (SUPER ADMIN AUDIT VIEW) */}
        {activeTab === 'users' && (
          <div className="space-y-8 animate-fadeIn">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-white mb-1">User Management & Audit Directory</h1>
              <p className="text-zinc-400 text-xs">Track user progress, view taken scenarios, question sets, timestamps, and answer logs</p>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {usersList.map((user) => (
                <div key={user.id} className="p-6 rounded-3xl bg-zinc-950 border border-zinc-900 space-y-4 text-left relative overflow-hidden">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-[9px] font-bold text-purple-400 uppercase tracking-wider">
                          Role: {user.role}
                        </span>
                        <span className="text-zinc-500 text-[10px]">ID: {user.id}</span>
                      </div>
                      <h4 className="text-base font-extrabold text-white">{user.name}</h4>
                      <p className="text-xs text-zinc-400">{user.email} • {user.schoolName} (Class {user.class}-{user.section})</p>
                    </div>

                    <button 
                      onClick={() => {
                        setSelectedUser(user);
                        setIsUserModalOpen(true);
                      }}
                      className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-extrabold flex items-center gap-1.5 transition-all self-end sm:self-start shadow-[0_0_15px_rgba(168,85,247,0.2)]"
                    >
                      <FileText className="w-3.5 h-3.5" /> View Audit History
                    </button>
                  </div>

                  <div className="flex gap-6 pt-4 border-t border-zinc-900/60 text-xs text-zinc-400">
                    <div>
                      Total Assessments: <strong className="text-white font-mono">{user.sessions?.length || 0}</strong>
                    </div>
                    <div>
                      Last Active: <strong className="text-white font-mono">
                        {user.sessions && user.sessions.length > 0 
                          ? new Date(user.sessions[user.sessions.length - 1].createdAt).toLocaleDateString()
                          : 'Never'
                        }
                      </strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: SCHOOL PROFILE CONFIGURATION */}
        {activeTab === 'school_settings' && (
          <div className="space-y-8">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-white mb-1">School Profile Settings</h1>
              <p className="text-zinc-400 text-xs">Manage your school identities and co-branding assets</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Profile details */}
              <div className="lg:col-span-7 space-y-6">
                
                {/* Logo uploader with explanation */}
                <div className="p-6 rounded-3xl bg-zinc-950 border border-zinc-900 space-y-4">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">School Logo Asset</span>
                    <button 
                      onClick={() => setLogoExplanationShown(!logoExplanationShown)}
                      className="text-teal-400 hover:text-teal-300 text-[10px] font-bold"
                    >
                      Why do we ask for this?
                    </button>
                  </div>

                  <AnimatePresence>
                    {logoExplanationShown && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="p-4 rounded-xl bg-teal-500/5 border border-teal-500/10 text-[10px] text-teal-300 leading-relaxed"
                      >
                        Your school logo is used to co-brand the student quest dashboard and PDF reports. This ensures your students receive a personalized and familiar dashboard experience that aligns with your school crest.
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-xl bg-zinc-900 flex items-center justify-center overflow-hidden border border-zinc-800">
                      <img src={schoolLogo} alt="Logo preview" className="w-full h-full object-contain" />
                    </div>
                    <div>
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="text-xs text-zinc-400 file:bg-zinc-900 file:border-0 file:text-white file:px-3 file:py-1.5 file:rounded-lg file:mr-3 file:cursor-pointer hover:file:bg-zinc-800"
                      />
                      <p className="text-[9px] text-zinc-600 mt-1">Recommended size: Square PNG, transparent backdrop.</p>
                    </div>
                  </div>
                </div>

                {/* Edit metadata */}
                <div className="p-6 rounded-3xl bg-zinc-950 border border-zinc-900 space-y-4">
                  <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">Cohort Information</span>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] text-zinc-500 font-bold uppercase">School Name</label>
                      <input 
                        type="text" 
                        value={schoolName}
                        onChange={(e) => setSchoolName(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-2 px-3 text-xs focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-zinc-500 font-bold uppercase">Board Affiliation</label>
                      <select 
                        value={schoolBoard}
                        onChange={(e) => setSchoolBoard(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-2 px-3 text-xs focus:outline-none"
                      >
                        <option value="CBSE">CBSE</option>
                        <option value="ICSE">ICSE</option>
                        <option value="State Board">State Board</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Academic Structure manager */}
                <div className="p-6 rounded-3xl bg-zinc-950 border border-zinc-900 space-y-4">
                  <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">Academic Structure Layout</span>
                  
                  <div className="space-y-3">
                    {Object.entries(academicClasses).map(([cls, sections]) => (
                      <div key={cls} className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-zinc-900 text-xs">
                        <span className="font-bold text-teal-400">Class {cls}</span>
                        <div className="flex flex-wrap gap-1.5">
                          {sections.map(sec => (
                            <span 
                              key={sec} 
                              onClick={() => handleRemoveSection(cls, sec)}
                              className="px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 flex items-center gap-1 cursor-pointer hover:border-red-500/30 hover:text-red-400"
                            >
                              {sec} <span className="text-[9px] opacity-40">✕</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add section builder */}
                  <div className="flex gap-3 pt-3 border-t border-zinc-900">
                    <select
                      value={newSectionClass}
                      onChange={(e) => setNewSectionClass(e.target.value)}
                      className="bg-zinc-900 border border-zinc-800 rounded-lg py-1.5 px-3 text-xs focus:outline-none"
                    >
                      <option value="8">Class 8</option>
                      <option value="9">Class 9</option>
                      <option value="10">Class 10</option>
                      <option value="11">Class 11</option>
                      <option value="12">Class 12</option>
                    </select>

                    <div className="flex-1 flex flex-col gap-1">
                      <input 
                        type="text"
                        placeholder="e.g. A, B, C or Science-B"
                        value={newSectionName}
                        onChange={(e) => setNewSectionName(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-1.5 px-3 text-xs focus:outline-none"
                      />
                      <span className="text-[9px] text-zinc-500">Separate multiple sections with commas (e.g. A, B, C)</span>
                    </div>

                    <button
                      onClick={handleAddSection}
                      className="px-4 py-1.5 rounded-lg bg-teal-500 hover:bg-teal-400 text-black font-bold text-xs self-start"
                    >
                      + Add Section
                    </button>
                  </div>
                </div>

              </div>

              {/* Teacher access manager */}
              <div className="lg:col-span-5 space-y-6">
                <div className="p-6 rounded-3xl bg-zinc-950 border border-zinc-900 space-y-4">
                  <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">Teacher Access Manager</span>
                  
                  <div className="space-y-3">
                    {teachers.map(t => (
                      <div key={t.email} className="p-3 rounded-xl bg-black/40 border border-zinc-900 text-xs flex justify-between items-start">
                        <div>
                          <span className="font-bold text-zinc-300 block">{t.email}</span>
                          <span className="text-[10px] text-zinc-500">Access: {t.classes.join(', ')}</span>
                        </div>
                        <button 
                          onClick={() => setTeachers(prev => prev.filter(x => x.email !== t.email))}
                          className="text-red-400 hover:text-red-300 font-bold text-[10px]"
                        >
                          Revoke
                        </button>
                      </div>
                    ))}
                  </div>

                  <form onSubmit={handleDelegateTeacher} className="space-y-3 pt-3 border-t border-zinc-900">
                    <div className="space-y-1">
                      <label className="text-[9px] text-zinc-500 font-bold uppercase">Invite Email</label>
                      <input 
                        type="email"
                        required
                        placeholder="teacher@dav.edu"
                        value={newTeacherEmail}
                        onChange={(e) => setNewTeacherEmail(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-2 px-3 text-xs focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] text-zinc-500 font-bold uppercase block">Classes to Delegate</label>
                      <div className="flex flex-wrap gap-1.5">
                        {['10-A', '12-Science-A', '9-A'].map(cls => (
                          <button
                            type="button"
                            key={cls}
                            onClick={() => setNewTeacherClasses(prev => 
                              prev.includes(cls) ? prev.filter(c => c !== cls) : [...prev, cls]
                            )}
                            className={`px-2 py-1 rounded text-[10px] font-bold ${
                              newTeacherClasses.includes(cls) ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30' : 'bg-zinc-900 text-zinc-500 border border-zinc-800'
                            }`}
                          >
                            {cls}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-teal-500 hover:bg-teal-400 text-black font-bold py-2 rounded-xl text-xs"
                    >
                      Delegate Access Rights
                    </button>
                  </form>
                </div>
              </div>

            </div>
          </div>
        )}

      </main>

      {/* ──── SUPER ADMIN MODAL PANELS ──── */}
      <AnimatePresence>
        {/* Scenario Creator / Editor Modal */}
        {isScenarioModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsScenarioModalOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-zinc-950 border border-zinc-850 w-full max-w-xl rounded-3xl overflow-hidden shadow-2xl p-6 my-8 space-y-6 max-h-[85vh] overflow-y-auto"
            >
              <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-purple-500 to-indigo-500" />
              
              <div className="flex justify-between items-start">
                <div className="text-left">
                  <h3 className="text-lg font-extrabold text-white">
                    {editingScenario ? 'Edit Scenario Matrix' : 'Create Immersive Scenario'}
                  </h3>
                  <p className="text-xs text-zinc-500 mt-1">Configure MP4 video loops and map scoring metrics.</p>
                </div>
                <button 
                  onClick={() => setIsScenarioModalOpen(false)}
                  className="text-zinc-500 hover:text-white text-xs font-bold p-1"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveScenario} className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] text-zinc-500 font-bold uppercase block text-left">Scenario Title</label>
                    <input 
                      type="text"
                      required
                      placeholder="e.g. Bio-Genetics Lab"
                      value={scenarioTitle}
                      onChange={(e) => setScenarioTitle(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-2 px-3 text-xs focus:outline-none text-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-left">
                    <div className="space-y-1">
                      <label className="text-[10px] text-zinc-500 font-bold uppercase block">Target Cohort Age</label>
                      <select 
                        value={scenarioAgeGroup}
                        onChange={(e) => setScenarioAgeGroup(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-2 px-3 text-xs focus:outline-none text-white"
                      >
                        <option value="All">All Grades (8-12)</option>
                        <option value="8-10">Middle School (8-10)</option>
                        <option value="11-12">High School (11-12)</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-zinc-500 font-bold uppercase block">Video URL (.mp4)</label>
                      <input 
                        type="text"
                        required
                        placeholder="e.g. /videos/assembly.mp4"
                        value={scenarioVideoUrl}
                        onChange={(e) => setScenarioVideoUrl(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-2 px-3 text-xs focus:outline-none text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-left">
                    <div className="space-y-1">
                      <label className="text-[10px] text-zinc-500 font-bold uppercase block">Status</label>
                      <select 
                        value={scenarioStatus}
                        onChange={(e) => setScenarioStatus(e.target.value as any)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-2 px-3 text-xs focus:outline-none text-white"
                      >
                        <option value="Published">Published</option>
                        <option value="Draft">Draft</option>
                        <option value="Archived">Archived</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-zinc-500 font-bold uppercase block">Expected Time (sec)</label>
                      <input 
                        type="number"
                        required
                        min="10"
                        max="300"
                        value={scenarioExpectedTime}
                        onChange={(e) => setScenarioExpectedTime(Number(e.target.value))}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-2 px-3 text-xs focus:outline-none text-white"
                      />
                    </div>
                    <div className="space-y-1 relative text-left">
                      <label className="text-[10px] text-zinc-500 font-bold uppercase block">Focus Domain</label>
                      <button
                        type="button"
                        onClick={() => setIsFocusDropdownOpen(!isFocusDropdownOpen)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-2 px-3 text-xs focus:outline-none text-white text-left flex justify-between items-center hover:border-zinc-700 transition-all"
                      >
                        <span className="truncate">
                          {scenarioFocusCategory || 'Select focus domain...'}
                        </span>
                        <span className="text-[10px] text-zinc-500">▼</span>
                      </button>
                      
                      {isFocusDropdownOpen && (
                        <>
                          <div 
                            className="fixed inset-0 z-45" 
                            onClick={() => setIsFocusDropdownOpen(false)} 
                          />
                          <div className="absolute z-50 left-0 right-0 mt-1 bg-zinc-950 border border-zinc-800 rounded-xl p-1.5 shadow-2xl space-y-0.5 max-h-48 overflow-y-auto">
                            {['STEM', 'Creative Arts', 'Leadership', 'Interpersonal Care', 'Systems & Logic'].map((dom) => {
                              const selectedDomains = scenarioFocusCategory
                                ? scenarioFocusCategory.split(',').map((s: string) => s.trim()).filter(Boolean)
                                : [];
                              const isSelected = selectedDomains.includes(dom);
                              return (
                                <button
                                  key={dom}
                                  type="button"
                                  onClick={() => {
                                    let newSelected;
                                    if (isSelected) {
                                      newSelected = selectedDomains.filter(d => d !== dom);
                                    } else {
                                      newSelected = [...selectedDomains, dom];
                                    }
                                    if (newSelected.length === 0) newSelected = ['STEM'];
                                    setScenarioFocusCategory(newSelected.join(', '));
                                  }}
                                  className="w-full flex items-center justify-between px-3 py-2 text-left text-xs text-zinc-300 hover:text-white hover:bg-zinc-900 rounded-lg transition-all"
                                >
                                  <span>{dom}</span>
                                  {isSelected && (
                                    <span className="text-teal-400 font-extrabold text-xs">✓</span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-zinc-900">
                  <button
                    type="button"
                    onClick={() => setIsScenarioModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-850 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-all text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs shadow-[0_0_15px_rgba(168,85,247,0.3)] transition-all"
                  >
                    Save Scenario
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Question Set Creator / Editor Modal */}
        {isQuestionSetModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsQuestionSetModalOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-zinc-950 border border-zinc-850 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl p-6 my-8 space-y-6 max-h-[85vh] overflow-y-auto"
            >
              <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-teal-500 to-indigo-500" />
              
              <div className="flex justify-between items-start">
                <div className="text-left">
                  <h3 className="text-lg font-extrabold text-white">Create/Update Question Set</h3>
                  <p className="text-xs text-zinc-500 mt-1">Assign a question set to a specific cinematic scenario backdrop.</p>
                </div>
                <button 
                  onClick={() => setIsQuestionSetModalOpen(false)}
                  className="text-zinc-500 hover:text-white text-xs font-bold p-1"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveQuestionSet} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                  <div className="space-y-1">
                    <label className="text-[10px] text-zinc-500 font-bold uppercase block">Select Scenario</label>
                    <select
                      value={qSetSelectedScenarioId}
                      onChange={(e) => setQSetSelectedScenarioId(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-2 px-3 text-xs focus:outline-none text-white"
                    >
                      {scenarios.map(s => (
                        <option key={s.id} value={s.id}>{s.title}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-zinc-500 font-bold uppercase block">Assessment Set</label>
                    <select
                      value={qSetSetNumber}
                      onChange={(e) => setQSetSetNumber(Number(e.target.value))}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-2 px-3 text-xs focus:outline-none text-white"
                    >
                      <option value={1}>Set 1 (Initial Year)</option>
                      <option value={2}>Set 2 (Year 2 Tracking)</option>
                      <option value={3}>Set 3 (Year 3 Tracking)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-6 max-h-[50vh] overflow-y-auto pr-1">
                  {qSetQuestions.map((q: any, qIdx: number) => (
                    <div key={qIdx} className="space-y-4 p-4 rounded-2xl border border-zinc-900 bg-zinc-900/10 text-left relative">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-teal-400">Question #{qIdx + 1}</span>
                        {qSetQuestions.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveQuestionFromSet(qIdx)}
                            className="text-red-500 hover:text-red-400 text-[10px] font-bold px-2 py-0.5 rounded bg-red-950/20 border border-red-900/30"
                          >
                            Remove Question
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="md:col-span-3 space-y-1">
                          <label className="text-[10px] text-zinc-500 font-bold uppercase block">Question Prompt</label>
                          <input 
                            type="text"
                            required
                            placeholder="e.g. The flight controls fail. What is your mechanical strategy?"
                            value={q.question_text}
                            onChange={(e) => handleQuestionTextChange(qIdx, e.target.value)}
                            className="w-full bg-zinc-900 border border-zinc-805 rounded-lg py-2 px-3 text-xs focus:outline-none text-white"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] text-zinc-500 font-bold uppercase block">Trigger time (sec)</label>
                          <input 
                            type="number"
                            required
                            min="0"
                            value={q.show_at_seconds}
                            onChange={(e) => handleQuestionSecondsChange(qIdx, Number(e.target.value))}
                            className="w-full bg-zinc-900 border border-zinc-805 rounded-lg py-2 px-3 text-xs focus:outline-none text-white"
                          />
                        </div>
                      </div>

                      <div className="space-y-3 pt-3 border-t border-zinc-900/60">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block text-left">Choices & Dimension Weight Mappings</span>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {q.options.map((opt: any, oIdx: number) => (
                            <div key={oIdx} className="p-3.5 rounded-2xl bg-zinc-900/50 border border-zinc-900 space-y-2.5 text-left">
                              <span className="text-[10px] font-extrabold text-teal-400 block">Choice Option {opt.option_letter}</span>
                              <input 
                                type="text"
                                required
                                placeholder="Choice text"
                                value={opt.option_text}
                                onChange={(e) => handleOptionTextChange(qIdx, oIdx, e.target.value)}
                                className="w-full bg-zinc-900 border border-zinc-800 rounded py-1 px-2 text-[10px] focus:outline-none text-zinc-300"
                              />
                              
                              <div className="space-y-3 pt-2">
                                <div className="space-y-1.5">
                                  <label className="text-[8px] text-zinc-650 block font-bold uppercase tracking-wider">Target Spectrum Dimensions</label>
                                  <div className="grid grid-cols-2 gap-1">
                                    {[
                                      { label: 'The Builder', short: 'Builder' },
                                      { label: 'The Thinker', short: 'Thinker' },
                                      { label: 'The Creator', short: 'Creator' },
                                      { label: 'The Connector', short: 'Connector' },
                                      { label: 'The Leader', short: 'Leader' },
                                      { label: 'The Organizer', short: 'Organizer' }
                                    ].map((dim) => {
                                      const currentDims = opt.target_dimension
                                        ? opt.target_dimension.split(',').map((s: string) => s.trim())
                                        : [];
                                      const isSelected = currentDims.includes(dim.label);
                                      return (
                                        <button
                                          key={dim.label}
                                          type="button"
                                          onClick={() => toggleDimensionForOption(qIdx, oIdx, dim.label)}
                                          className={`py-1 px-1.5 rounded-lg border text-[8px] font-extrabold text-center transition-all ${
                                            isSelected
                                              ? 'bg-teal-950/40 border-teal-500 text-teal-400 shadow-[0_0_8px_rgba(20,184,166,0.15)]'
                                              : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-400 hover:border-zinc-700'
                                          }`}
                                        >
                                          {dim.short}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[8px] text-zinc-650 block font-bold uppercase tracking-wider">INTENSITY WEIGHT</label>
                                  <input 
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    max="1"
                                    required
                                    value={opt.intensity_weight}
                                    onChange={(e) => handleOptionWeightChange(qIdx, oIdx, Number(e.target.value))}
                                    className="w-full bg-zinc-900 border border-zinc-800 rounded py-1 px-2 text-[10px] focus:outline-none text-zinc-350 text-center"
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}

                  <div className="flex justify-start pt-2">
                    <button
                      type="button"
                      onClick={handleAddQuestionToSet}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-955/20 hover:bg-teal-955/45 border border-teal-900/40 text-teal-400 text-xs font-bold transition-all shadow-[0_0_10px_rgba(20,184,166,0.05)] hover:shadow-[0_0_15px_rgba(20,184,166,0.1)]"
                    >
                      <span className="text-sm font-extrabold">+</span> Add More Questions
                    </button>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-zinc-900">
                  <button
                    type="button"
                    onClick={() => setIsQuestionSetModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-850 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-all text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-extrabold text-xs shadow-[0_0_15px_rgba(20,184,166,0.3)] transition-all"
                  >
                    Save Question Set
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Matrix Cell Action Popover Modal */}
        {selectedMatrixCell && (() => {
          const scen = scenarios.find(s => s.id === selectedMatrixCell.scenarioId);
          if (!scen) return null;
          const questions = scen.questions ? scen.questions.filter((q: any) => q.sequence_order === selectedMatrixCell.setNum) : [];
          
          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedMatrixCell(null)}
                className="fixed inset-0 bg-black/85 backdrop-blur-sm"
              />
              
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative bg-zinc-950 border border-zinc-855 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl p-6 space-y-6 text-left"
              >
                <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-teal-500 via-purple-500 to-indigo-500" />
                
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-base font-extrabold text-white">Diagnostic Cell Operations</h3>
                    <p className="text-xs text-zinc-400 mt-0.5">Scenario: <strong className="text-zinc-200">{scen.title}</strong> • Set {selectedMatrixCell.setNum}</p>
                  </div>
                  <button 
                    onClick={() => setSelectedMatrixCell(null)}
                    className="text-zinc-500 hover:text-white text-xs font-bold p-1"
                  >
                    ✕
                  </button>
                </div>

                {/* Question Details Snippet */}
                <div className="space-y-3">
                  <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block font-mono">Set Questions Preview</span>
                  {questions.length > 0 ? (
                    <div className="space-y-3 max-h-[160px] overflow-y-auto pr-1">
                      {questions.map((q: any, qIdx: number) => (
                        <div key={q.id || qIdx} className="p-3 bg-zinc-900/40 border border-zinc-900 rounded-xl space-y-1">
                          <div className="flex justify-between text-[8px] text-zinc-500 font-bold">
                            <span>Question #{qIdx + 1}</span>
                            <span>Trigger: {q.show_at_seconds || 5}s</span>
                          </div>
                          <p className="text-[11px] text-zinc-200 font-medium line-clamp-2">{q.question_text}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 bg-zinc-900/25 border border-zinc-900 border-dashed rounded-2xl text-center text-zinc-650 text-xs italic">
                      No questions configured in this cell set yet.
                    </div>
                  )}
                </div>

                {/* Operations Actions Grid */}
                <div className="space-y-3 pt-3 border-t border-zinc-900/60">
                  <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block font-mono">Available Cell Actions</span>
                  <div className="grid grid-cols-2 gap-3">
                    
                    <button
                      onClick={() => {
                        handleOpenQuestionSetFromMatrix(selectedMatrixCell.scenarioId, selectedMatrixCell.setNum);
                        setSelectedMatrixCell(null);
                      }}
                      className="p-3 rounded-2xl border border-zinc-850 bg-zinc-900/30 hover:bg-zinc-900/60 text-left transition-all space-y-1"
                    >
                      <strong className="text-xs text-white block">⚙️ Configure Set</strong>
                      <p className="text-[9px] text-zinc-500 leading-normal">Open the full question set editor wizard to modify or append choices.</p>
                    </button>

                    <button
                      disabled={questions.length === 0}
                      onClick={() => startSimulatorSession(selectedMatrixCell.scenarioId, selectedMatrixCell.setNum)}
                      className="p-3 rounded-2xl border border-zinc-850 bg-zinc-900/30 hover:bg-zinc-900/60 disabled:opacity-40 disabled:hover:bg-zinc-905/30 text-left transition-all space-y-1"
                    >
                      <strong className="text-xs text-teal-400 block">⚡ Run Simulator</strong>
                      <p className="text-[9px] text-zinc-500 leading-normal">Pre-screen the student experience timeline and score delta logic.</p>
                    </button>

                    <button
                      disabled={questions.length === 0}
                      onClick={() => {
                        const targetSet = selectedMatrixCell.setNum === 1 ? 2 : selectedMatrixCell.setNum === 2 ? 3 : 1;
                        if (confirm(`Do you want to clone this set into Set ${targetSet} of this scenario?`)) {
                          handleCloneQuestionSet(selectedMatrixCell.scenarioId, selectedMatrixCell.setNum, selectedMatrixCell.scenarioId, targetSet);
                        }
                      }}
                      className="p-3 rounded-2xl border border-zinc-850 bg-zinc-900/30 hover:bg-zinc-900/60 disabled:opacity-40 disabled:hover:bg-zinc-905/30 text-left transition-all space-y-1"
                    >
                      <strong className="text-xs text-purple-400 block">📋 Clone Set</strong>
                      <p className="text-[9px] text-zinc-500 leading-normal">Duplicate all questions and options into the next alternate year slot.</p>
                    </button>

                    <button
                      disabled={questions.length === 0}
                      onClick={() => handleClearQuestionSet(selectedMatrixCell.scenarioId, selectedMatrixCell.setNum)}
                      className="p-3 rounded-2xl border border-zinc-850 hover:bg-red-955/15 border-zinc-900 bg-zinc-900/30 text-left transition-all space-y-1 group"
                    >
                      <strong className="text-xs text-red-500 block">🗑️ Clear Set</strong>
                      <p className="text-[9px] text-zinc-500 leading-normal group-hover:text-red-400/80">Erase all questions, parameters, and option points in this cell.</p>
                    </button>
                    
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => setSelectedMatrixCell(null)}
                    className="px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-850 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-all text-xs font-bold"
                  >
                    Close
                  </button>
                </div>
              </motion.div>
            </div>
          );
        })()}

        {/* Enroll Partner School Modal */}
        {isSchoolModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSchoolModalOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-zinc-950 border border-zinc-850 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl p-6 space-y-6"
            >
              <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-purple-500 to-indigo-500" />
              
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-extrabold text-white">Enroll Partner School</h3>
                  <p className="text-xs text-zinc-500 mt-1">Register institutional cohort to create credentials.</p>
                </div>
                <button 
                  onClick={() => setIsSchoolModalOpen(false)}
                  className="text-zinc-500 hover:text-white text-xs font-bold p-1"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateSchool} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-500 font-bold uppercase block">School Name</label>
                  <input 
                    type="text"
                    required
                    placeholder="e.g. Ryan International School"
                    value={newSchoolName}
                    onChange={(e) => setNewSchoolName(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-2.5 px-3 text-xs focus:outline-none text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] text-zinc-500 font-bold uppercase block">Board</label>
                    <select
                      value={newSchoolBoard}
                      onChange={(e) => setNewSchoolBoard(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-2.5 px-3 text-xs focus:outline-none text-white"
                    >
                      <option value="CBSE">CBSE</option>
                      <option value="ICSE">ICSE</option>
                      <option value="State Board">State Board</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-zinc-500 font-bold uppercase block">Location</label>
                    <input 
                      type="text"
                      required
                      placeholder="e.g. Pune, Maharashtra"
                      value={newSchoolLocation}
                      onChange={(e) => setNewSchoolLocation(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-2.5 px-3 text-xs focus:outline-none text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] text-zinc-500 font-bold uppercase block">Contact Email</label>
                    <input 
                      type="email"
                      required
                      placeholder="e.g. info@ryan.edu"
                      value={newSchoolContact}
                      onChange={(e) => setNewSchoolContact(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-2.5 px-3 text-xs focus:outline-none text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-zinc-500 font-bold uppercase block">Assessment Credits</label>
                    <input 
                      type="number"
                      required
                      min="1"
                      value={newSchoolCredits}
                      onChange={(e) => setNewSchoolCredits(Number(e.target.value))}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-2.5 px-3 text-xs focus:outline-none text-white"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-zinc-900">
                  <button
                    type="button"
                    onClick={() => setIsSchoolModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-850 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-all text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs shadow-[0_0_15px_rgba(168,85,247,0.3)] transition-all"
                  >
                    Enroll School
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Allocate Credits Modal */}
        {isCreditModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCreditModalOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-zinc-950 border border-zinc-850 w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl p-6 space-y-6"
            >
              <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-amber-500 to-yellow-500" />
              
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-extrabold text-white">Allocate Assessment Credits</h3>
                  <p className="text-xs text-zinc-500 mt-1">School: <strong className="text-zinc-300">{creditSelectedSchool?.name}</strong></p>
                </div>
                <button 
                  onClick={() => setIsCreditModalOpen(false)}
                  className="text-zinc-500 hover:text-white text-xs font-bold p-1"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleAllocateCreditsSave} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-500 font-bold uppercase block">Add Credits Amount</label>
                  <input 
                    type="number"
                    required
                    min="1"
                    value={creditAmount}
                    onChange={(e) => setCreditAmount(Number(e.target.value))}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-2.5 px-3 text-xs focus:outline-none text-zinc-300"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-zinc-900">
                  <button
                    type="button"
                    onClick={() => setIsCreditModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-850 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-all text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-black font-extrabold text-xs shadow-[0_0_15px_rgba(245,158,11,0.3)] transition-all"
                  >
                    Add Credits
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* User Audit History Details Modal */}
        {isUserModalOpen && selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsUserModalOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-zinc-950 border border-zinc-850 w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl p-6 my-8 space-y-6 max-h-[85vh] overflow-y-auto text-left"
            >
              <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-purple-500 to-indigo-500" />
              
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-extrabold text-white">Assessment & Answer Audit Trail</h3>
                  <p className="text-xs text-zinc-500 mt-1">User: <strong className="text-zinc-300">{selectedUser.name}</strong> • {selectedUser.email}</p>
                </div>
                <button 
                  onClick={() => setIsUserModalOpen(false)}
                  className="text-zinc-500 hover:text-white text-xs font-bold p-1"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-6">
                {selectedUser.sessions && selectedUser.sessions.length > 0 ? (
                  selectedUser.sessions.map((sess: any, sIdx: number) => (
                    <div key={sess.id || sIdx} className="p-5 rounded-2xl bg-zinc-900/40 border border-zinc-900 space-y-4">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-zinc-800 pb-3 gap-2">
                        <div>
                          <span className="px-2 py-0.5 rounded-full bg-teal-500/10 border border-teal-500/20 text-[9px] font-bold text-teal-400 uppercase tracking-wider">
                            Assessment Set #{sess.setNumber}
                          </span>
                          <span className="text-[10px] text-zinc-500 ml-2">Session ID: {sess.id}</span>
                        </div>
                        <span className="text-[10px] text-zinc-400 font-mono">
                          Completed: {new Date(sess.createdAt).toLocaleString()}
                        </span>
                      </div>

                      {/* Score Vector */}
                      <div className="bg-black/30 p-3 rounded-xl border border-zinc-900/60">
                        <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Calculated Dimension Strengths</span>
                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center">
                          {Object.entries(sess.thetaVector || {}).map(([dim, val]: any) => (
                            <div key={dim} className="p-2 bg-zinc-950/40 rounded border border-zinc-900 text-xs">
                              <span className="text-[9px] text-zinc-500 block uppercase font-bold">{dim}</span>
                              <strong className="text-white font-mono text-xs">{val.toFixed(1)}</strong>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Question Response List */}
                      <div className="space-y-3">
                        <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block">Detailed Responses</span>
                        {sess.responses && sess.responses.length > 0 ? (
                          sess.responses.map((resp: any, rIdx: number) => (
                            <div key={rIdx} className="p-3 bg-black/20 border border-zinc-900/60 rounded-xl space-y-1.5 text-xs text-left">
                              <div className="flex justify-between items-center text-[10px] text-zinc-500 font-semibold">
                                <span>Scenario: <strong className="text-zinc-300">{resp.scenarioTitle}</strong></span>
                                <span>Time: {((resp.timeMs || 0) / 1000).toFixed(1)}s</span>
                              </div>
                              <p className="text-zinc-300 font-medium font-bold">Q: {resp.questionText}</p>
                              <div className="p-2.5 rounded-lg bg-purple-950/10 border border-purple-500/10">
                                <span className="font-extrabold text-[10px] text-purple-400 block mb-0.5">Selected Option {resp.selectedLetter}</span>
                                <p className="text-zinc-400 text-[10px] leading-relaxed">{resp.selectedText}</p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-zinc-650 italic">No responses logged for this session.</p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 rounded-2xl bg-zinc-900/20 border border-zinc-900 text-center text-zinc-500 text-xs">
                    This user has not completed any assessments yet.
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-4 border-t border-zinc-900">
                <button
                  onClick={() => setIsUserModalOpen(false)}
                  className="px-5 py-2 rounded-xl bg-zinc-900 border border-zinc-850 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-all text-xs font-bold"
                >
                  Close Audit
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
