'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { 
  BarChart3, Settings, Video, Upload, Shield, 
  Trash2, Plus, Sparkles, Sliders, Users, 
  Activity, Clock, ShieldAlert, GraduationCap, Building, Loader2, Pencil,
  Search, Filter, CheckCircle, AlertTriangle, FileText, Download, UserCheck, Key, Eye, HelpCircle, Coins, FolderOpen, Archive, LogOut, ChevronUp, X, MapPin
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

const INITIAL_CLASSES = {
  '8': ['A', 'B'],
  '9': ['A', 'B'],
  '10': ['A', 'B', 'C'],
  '11': ['Science-A', 'Commerce-A'],
  '12': ['Science-A', 'Commerce-A']
};

const INITIAL_TEACHERS = [
  { email: 'teacher1@dav.edu', classes: ['10-A', '9-A'] },
  { email: 'teacher2@dav.edu', classes: ['12-Science-A'] }
];

const INITIAL_SCHOOLS = [
  { id: 'sch1', name: 'DAV Public School', board: 'CBSE', location: 'Bengaluru, Karnataka', contact: 'principal@dav.edu', active: true, totalCredits: 500, usedCredits: 180 },
  { id: 'sch2', name: 'Delhi Public School', board: 'CBSE', location: 'New Delhi, Delhi', contact: 'admin@dps.edu', active: true, totalCredits: 300, usedCredits: 98 },
  { id: 'sch3', name: 'Jamnabai Narsee School', board: 'ICSE', location: 'Mumbai, Maharashtra', contact: 'contact@jamnabai.edu', active: false, totalCredits: 100, usedCredits: 100 }
];

// Helper to generate RFC4122 v4 UUIDs
const generateUUID = () => {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// UUID format validator: must be exactly 8-4-4-4-12 hex characters
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isValidUUID = (id: string | null | undefined): boolean => {
  return !!id && UUID_REGEX.test(id);
};

export default function AdminConsole() {
  const router = useRouter();
  
  // Auth & View Roles
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentRole, setCurrentRole] = useState<'super_admin' | 'school_admin'>('super_admin');

  // User Profile States
  const [profileData, setProfileData] = useState<any>(null);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [profileSettingsModalOpen, setProfileSettingsModalOpen] = useState(false);

  // Impersonation states
  const [impersonatingSchool, setImpersonatingSchool] = useState<any>(null);
  const [showSchoolPicker, setShowSchoolPicker] = useState(false);
  
  // Form states for profile edit modal
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editFullName, setEditFullName] = useState('');
  const [editGender, setEditGender] = useState('');
  const [editDateOfBirth, setEditDateOfBirth] = useState('');
  const [editAvatarUrl, setEditAvatarUrl] = useState('');

  // Active School ID state for database operations
  const [activeSchoolId, setActiveSchoolId] = useState<string>('sch1');
  
  // Tab Navigation
  const [activeTab, setActiveTab] = useState<'mission_control' | 'explorer' | 'roster_manager' | 'scenarios' | 'school_settings' | 'schools' | 'users'>('scenarios');

  // School Specific Info
  const [schoolLogo, setSchoolLogo] = useState<string>('/psymetric-icon.png');
  const [logoExplanationShown, setLogoExplanationShown] = useState(false);
  const [schoolBoard, setSchoolBoard] = useState('CBSE'); // CBSE, ICSE, State Board
  const [schoolName, setSchoolName] = useState('DAV Public School');

  // Academic Structure state
  const [academicClasses, setAcademicClasses] = useState<Record<string, string[]>>({});
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
  const [teachers, setTeachers] = useState<any[]>([]);
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
  const [schoolsList, setSchoolsList] = useState<any[]>([]);

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
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [editQForm, setEditQForm] = useState<any>(null);
  const [qSetQuestions, setQSetQuestions] = useState<any[]>([
    {
      question_text: '',
      show_at_seconds: 5,
      timer_duration: 15,
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

  const handleQuestionTimerChange = (qIdx: number, val: number) => {
    setQSetQuestions(prev => {
      const copy = [...prev];
      copy[qIdx] = { ...copy[qIdx], timer_duration: val };
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
        timer_duration: 15,
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
  const [scenarios, setScenarios] = useState<any[]>([]);

  // Scenario matrix manager state
  const [scenActiveView, setScenActiveView] = useState<'grid' | 'matrix' | 'analytics' | 'schema' | 'simulator' | 'versions'>('grid');
  
  // Versions & Backups states
  const [commitsList, setCommitsList] = useState<any[]>([]);
  const [backupsList, setBackupsList] = useState<any[]>([]);
  const [archivedResponses, setArchivedResponses] = useState<any[]>([]);
  const [archiveSearchQuery, setArchiveSearchQuery] = useState<string>('');
  const [commitDescription, setCommitDescription] = useState<string>('');
  const [isCommiting, setIsCommiting] = useState<boolean>(false);
  const [isBackingUp, setIsBackingUp] = useState<boolean>(false);
  const [isRestoring, setIsRestoring] = useState<boolean>(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [selectedCommitSnapshot, setSelectedCommitSnapshot] = useState<any | null>(null);
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

  // Video upload states
  const [uploadingVideo, setUploadingVideo] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [showManualUrl, setShowManualUrl] = useState<boolean>(false);

  const handleVideoUpload = async (file: File) => {
    if (!file) return;
    
    // Validate file type
    const validTypes = ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-matroska'];
    if (!validTypes.includes(file.type) && !file.name.endsWith('.mp4') && !file.name.endsWith('.mov') && !file.name.endsWith('.webm') && !file.name.endsWith('.mkv')) {
      setUploadError('Invalid format. Please upload an MP4, MOV, WebM or MKV video.');
      return;
    }

    // Validate size (500MB max)
    const maxSize = 500 * 1024 * 1024;
    if (file.size > maxSize) {
      setUploadError('File is too large. Max allowed size is 500MB.');
      return;
    }

    setUploadingVideo(true);
    setUploadProgress(0);
    setUploadError(null);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { data, error } = await supabase.storage
        .from('videos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          // @ts-ignore
          onUploadProgress: (progress: any) => {
            const percentage = (progress.loaded / progress.total) * 100;
            setUploadProgress(Math.round(percentage));
          }
        } as any);

      if (error) {
        throw error;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('videos')
        .getPublicUrl(filePath);

      setScenarioVideoUrl(publicUrl);
      setUploadProgress(100);
      setTimeout(() => {
        setUploadingVideo(false);
      }, 800);
    } catch (err: any) {
      console.error('Error uploading video:', err);
      setUploadError(err.message || 'Failed to upload video. Please try again.');
      setUploadingVideo(false);
    }
  };

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

  const syncBulkScenariosToSupabase = async (parsed: any[], description?: string) => {
    alert("Applying scenario matrix updates to Supabase... Please wait.");
    try {
      // 1. Fetch current scenarios, questions, and options from database to match and reuse IDs
      const { data: dbScens, error: fetchErr } = await supabase
        .from('scenarios')
        .select('*, questions(*, options(*))');

      if (fetchErr) {
        console.warn('Could not fetch existing database records for ID matching:', fetchErr);
      }
      const dbScenarios = dbScens || [];

      // 2. Assign and match IDs
      const dimensionMap: Record<string, string> = {
        'R': 'The Builder',
        'Realistic': 'The Builder',
        'I': 'The Thinker',
        'Investigative': 'The Thinker',
        'A': 'The Creator',
        'Artistic': 'The Creator',
        'S': 'The Connector',
        'Social': 'The Connector',
        'E': 'The Leader',
        'Enterprising': 'The Leader',
        'C': 'The Organizer',
        'Conventional': 'The Organizer'
      };

      const assignedIds = new Set<string>();

      const parsedScenarios = parsed.map((s: any) => {
        // Find existing scenario by ID or by Title
        let sId = s.id;
        const existingScen = dbScenarios.find((x: any) => x.id === s.id || x.title === s.title);
        if (existingScen && !assignedIds.has(existingScen.id)) {
          sId = existingScen.id;
        } else if (isValidUUID(sId) && !assignedIds.has(sId)) {
          // Keep JSON ID if valid UUID and unique
        } else {
          if (sId && !isValidUUID(sId)) console.warn(`Scenario has invalid UUID "${sId}", generating new one.`);
          sId = generateUUID();
        }
        assignedIds.add(sId);

        const questions = (s.questions || []).map((q: any) => {
          // Find existing question by ID, or by sequence_order + question_text
          let qId = q.id;
          let existingQ = null;
          if (existingScen && existingScen.questions) {
            existingQ = existingScen.questions.find((x: any) => 
              x.id === q.id || 
              (x.sequence_order === q.sequence_order && x.question_text === q.question_text)
            );
          }
          
          if (existingQ && !assignedIds.has(existingQ.id)) {
            qId = existingQ.id;
          } else if (isValidUUID(qId) && !qId.startsWith('temp_') && !qId.startsWith('q_') && !assignedIds.has(qId)) {
            // Keep JSON ID if valid UUID and unique
          } else {
            if (qId && !isValidUUID(qId)) console.warn(`Question has invalid UUID "${qId}", generating new one.`);
            qId = generateUUID();
          }
          assignedIds.add(qId);

          const options = (q.options || []).map((o: any) => {
            // Find existing option by ID, or by option_letter
            let oId = o.id;
            let existingO = null;
            if (existingQ && existingQ.options) {
              existingO = existingQ.options.find((x: any) => 
                x.id === o.id || 
                x.option_letter === o.option_letter
              );
            }
            
            if (existingO && !assignedIds.has(existingO.id)) {
              oId = existingO.id;
            } else if (isValidUUID(oId) && !oId.startsWith('temp_') && !oId.startsWith('opt_') && !assignedIds.has(oId)) {
              // Keep JSON ID if valid UUID and unique
            } else {
              if (oId && !isValidUUID(oId)) console.warn(`Option has invalid UUID "${oId}", generating new one.`);
              oId = generateUUID();
            }
            assignedIds.add(oId);

            // Normalize target dimension
            let target_dimension = o.target_dimension;
            if (target_dimension) {
              target_dimension = target_dimension.split(',')
                .map((d: string) => {
                  const trimmed = d.trim();
                  return dimensionMap[trimmed] || trimmed;
                })
                .join(', ');
            }

            return {
              ...o,
              id: oId,
              target_dimension
            };
          });

          return {
            ...q,
            id: qId,
            timer_duration: q.timer_duration || 15,
            options
          };
        });

        return {
          ...s,
          id: sId,
          questions
        };
      });

      // 3. Call the atomic transactional stored procedure (RPC)
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      
      const { data: rpcResult, error: rpcError } = await supabase.rpc('sync_scenarios_snapshot', {
        p_scenarios: parsedScenarios,
        p_description: description || `Auto-Commit: Bulk sync of ${parsedScenarios.length} scenarios`,
        p_user_id: user?.id || null
      });

      if (rpcError) throw rpcError;

      // 4. Update state variables and fetch versions
      await fetchVersionsAndBackups();

      setScenarios(parsedScenarios);
      setBulkJsonText(JSON.stringify(parsedScenarios, null, 2));
      setBulkJsonError(null);
      alert(`Successfully applied and synchronized all scenarios to Supabase! (Created Auto-Commit [${rpcResult?.commit_hash || 'unknown'}])`);
      return true;
    } catch (err: any) {
      console.error('Error in syncBulkScenariosToSupabase:', err);
      alert("Error syncing bulk changes to Supabase: " + err.message);
      return false;
    }
  };

  const handleImportScenarios = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed)) {
          if (confirm(`Are you sure you want to import ${parsed.length} scenarios? This will replace your diagnostic scenario bank in bulk and sync it to Supabase.`)) {
            await syncBulkScenariosToSupabase(parsed, `Auto-Commit: Bulk import from file [${file.name}]`);
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

  const openProfileSettingsModal = () => {
    if (!profileData) return;
    setEditFirstName(profileData.first_name || '');
    setEditLastName(profileData.last_name || '');
    setEditFullName(profileData.full_name || '');
    setEditGender(profileData.gender || 'Prefer not to say');
    setEditDateOfBirth(profileData.date_of_birth || '');
    setEditAvatarUrl(profileData.avatar_url || '');
    setProfileSettingsModalOpen(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileData) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const updatedFields = {
        first_name: editFirstName.trim(),
        last_name: editLastName.trim(),
        full_name: editFullName.trim() || `${editFirstName.trim()} ${editLastName.trim()}`.trim(),
        gender: editGender,
        date_of_birth: editDateOfBirth || null,
        avatar_url: editAvatarUrl
      };

      const { data, error } = await supabase
        .from('profiles')
        .update(updatedFields)
        .eq('id', session.user.id)
        .select()
        .single();

      if (error) throw error;

      setProfileData(data);
      alert('Profile updated successfully!');
      setProfileSettingsModalOpen(false);
    } catch (err: any) {
      console.error('Error saving profile:', err);
      alert('Failed to update profile: ' + err.message);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.push('/auth');
    } catch (err: any) {
      console.error('Logout error:', err);
      alert('Failed to log out: ' + err.message);
    }
  };

  const fetchVersionsAndBackups = async () => {
    try {
      const { data: commitsData } = await supabase
        .from('scenario_commits')
        .select('*')
        .order('created_at', { ascending: false });
      if (commitsData) setCommitsList(commitsData);

      const { data: backupsData } = await supabase
        .from('system_backups')
        .select('*')
        .order('created_at', { ascending: false });
      if (backupsData) setBackupsList(backupsData);

      const { data: archiveData } = await supabase
        .from('archived_candidate_responses')
        .select('*')
        .order('archived_at', { ascending: false });
      if (archiveData) setArchivedResponses(archiveData);
    } catch (e) {
      console.error('Error loading commits and backups:', e);
    }
  };

  const handleCreateCommit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commitDescription.trim()) return;

    setIsCommiting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) throw new Error('Not authenticated');

      const commitHash = Math.random().toString(36).substring(2, 8); // 6-char short hash
      const snapshot = scenarios;

      const { error } = await supabase
        .from('scenario_commits')
        .insert({
          commit_hash: commitHash,
          description: commitDescription.trim(),
          scenarios_snapshot: snapshot,
          created_by: user.id
        });

      if (error) throw error;

      alert(`Successfully created scenario commit [${commitHash}]!`);
      setCommitDescription('');
      await fetchVersionsAndBackups();
    } catch (err: any) {
      console.error('Error creating scenario commit:', err);
      alert('Failed to create version commit: ' + err.message);
    } finally {
      setIsCommiting(false);
    }
  };

  const handleRevertCommit = async (commit: any) => {
    if (
      !confirm(
        `WARNING: Reverting to commit [${commit.commit_hash}] will overwrite your current scenario matrix. If any active questions are deleted, associated student answers will be lost. Do you want to proceed?`
      )
    ) {
      return;
    }

    setIsRestoring(true);
    try {
      const snapshot = commit.scenarios_snapshot;
      const success = await syncBulkScenariosToSupabase(snapshot);
      if (success) {
        alert(`Successfully reverted scenario database to version [${commit.commit_hash}]!`);
      }
    } catch (err: any) {
      console.error('Error reverting commit:', err);
      alert('Failed to revert: ' + err.message);
    } finally {
      setIsRestoring(false);
    }
  };

  const handleTriggerBackup = async () => {
    setIsBackingUp(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error('Not authenticated');

      const res = await fetch('/api/admin/backup', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to execute backup');

      alert(`Successfully triggered manual backup [${result.file}]!`);
      await fetchVersionsAndBackups();
    } catch (err: any) {
      console.error('Error triggering manual backup:', err);
      alert('Backup failed: ' + err.message);
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleRestoreBackup = async (backup: any) => {
    const typedConfirm = prompt(
      `CRITICAL WARNING: Restoring the system from [${backup.backup_name}] will truncate ALL database tables and insert old records. To prevent mistakes, please type "RESTORE" to confirm.`
    );
    if (typedConfirm !== 'RESTORE') {
      if (typedConfirm !== null) alert('Incorrect confirmation. Restoration aborted.');
      return;
    }

    setIsRestoring(true);
    setRestoringId(backup.id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error('Not authenticated');

      const res = await fetch('/api/admin/backup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ filePath: backup.file_path })
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Restoration failed');

      alert('System successfully restored! Reloading database entries...');
      window.location.reload();
    } catch (err: any) {
      console.error('Restoration error:', err);
      alert('Restoration failed: ' + err.message);
    } finally {
      setIsRestoring(false);
      setRestoringId(null);
    }
  };

  const handleDeleteBackup = async (backup: any) => {
    if (!confirm(`Are you sure you want to permanently delete backup file [${backup.backup_name}]? This action is irreversible.`)) {
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error('Not authenticated');

      const res = await fetch('/api/admin/backup', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ id: backup.id, filePath: backup.file_path })
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Deletion failed');

      await fetchVersionsAndBackups();
    } catch (err: any) {
      console.error('Delete backup error:', err);
      alert('Failed to delete backup: ' + err.message);
    }
  };

  const handleDeleteArchivedResponse = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this archived response? This action is irreversible.')) return;
    try {
      const { error } = await supabase
        .from('archived_candidate_responses')
        .delete()
        .eq('id', id);
      if (error) throw error;
      await fetchVersionsAndBackups();
    } catch (err: any) {
      console.error('Error deleting archived response:', err);
      alert('Failed to delete archived response: ' + err.message);
    }
  };

  const handleOpenQuestionSetFromMatrix = (scenarioId: string, setNum: number) => {
    setQSetSelectedScenarioId(scenarioId);
    setQSetSetNumber(setNum);
    setIsQuestionSetModalOpen(true);
  };

  // Helper to sync scenario questions and options to Supabase
  const syncScenarioToSupabase = async (scenId: string, updatedList?: any[]) => {
    const list = updatedList || scenarios;
    const scen = list.find(s => s.id === scenId);
    await syncBulkScenariosToSupabase(list, `Auto-Commit: Updated scenario "${scen?.title || 'Unknown'}"`);
  };

  // Save school name/board/logo to Supabase when changed
  useEffect(() => {
    const saveSchoolSettings = async () => {
      if (supabase && typeof window !== 'undefined') {
        const { data: { session } } = await supabase.auth.getSession();
        if (session && activeSchoolId && activeSchoolId !== 'sch1') {
          try {
            await supabase
              .from('schools')
              .update({ name: schoolName, board: schoolBoard, logo_url: schoolLogo })
              .eq('id', activeSchoolId);
          } catch (e) {
            console.error('Error updating school settings in Supabase:', e);
          }
        }
      }
    };
    saveSchoolSettings();
  }, [schoolName, schoolBoard, schoolLogo, activeSchoolId]);

  useEffect(() => {
    // Check authentication and load Supabase data
    const checkAuthAndLoad = async () => {
      setLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        // Enforce session check on Vercel/Production
        if (!session) {
          router.push('/auth');
          return;
        }

        let profile = null;
        try {
          const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          profile = data;
          // Merge session email as fallback if profiles.email is null
          setProfileData({ ...data, email: data?.email || session.user.email });
        } catch (err) {
          console.warn('Failed to retrieve profile:', err);
          // Still set minimal profile data from the session so the UI renders
          setProfileData({ email: session.user.email, full_name: session.user.email?.split('@')[0] });
        }

        if (profile?.user_type === 'super_admin' || profile?.is_admin) {
          setIsAdmin(true);
          setCurrentRole('super_admin');
        } else if (profile?.user_type === 'school_admin') {
          setIsAdmin(true);
          setCurrentRole('school_admin');
        } else {
          router.push('/assessment');
          return;
        }

        // Save active school ID
        if (profile?.school_id) {
          setActiveSchoolId(profile.school_id);
          const { data: school } = await supabase
            .from('schools')
            .select('*')
            .eq('id', profile.school_id)
            .single();
          if (school) {
            setSchoolName(school.name);
            setSchoolBoard(school.board);
            if (school.logo_url) {
              setSchoolLogo(school.logo_url);
            }
          }
        }

        // Load data from Supabase
        // 1. Fetch Scenarios
        const { data: scenData, error: scenError } = await supabase
          .from('scenarios')
          .select('*, questions(*, options(*))')
          .order('created_at', { ascending: true });

        if (scenError) {
          console.warn('Scenarios fetch error:', scenError);
          setScenarios(fallbackScenarios);
        } else if (scenData && scenData.length > 0) {
          const mappedScenarios = scenData.map((s: any) => ({
            id: s.id,
            title: s.title,
            video_url: s.video_url,
            target_age_group: s.target_age_group,
            is_active: s.is_active,
            is_backup: s.is_backup,
            status: s.status || 'Published',
            expected_time: s.expected_time || 60,
            focus_category: s.focus_category || 'STEM',
            questions: (s.questions || []).map((q: any) => ({
              id: q.id,
              sequence_order: q.sequence_order,
              question_text: q.question_text,
              show_at_seconds: q.show_at_seconds || 0,
              timer_duration: q.timer_duration || 15,
              options: (q.options || []).map((o: any) => ({
                id: o.id,
                option_letter: o.option_letter,
                option_text: o.option_text,
                target_dimension: o.target_dimension,
                intensity_weight: o.intensity_weight
              })).sort((a: any, b: any) => a.option_letter.localeCompare(b.option_letter))
            })).sort((a: any, b: any) => a.sequence_order - b.sequence_order)
          }));
          setScenarios(mappedScenarios);
        } else {
          setScenarios([]);
        }

        // 2. Fetch Enrolled Schools
        const { data: schoolsData } = await supabase
          .from('schools')
          .select('*');
        if (schoolsData && schoolsData.length > 0) {
          setSchoolsList(schoolsData.map((s: any) => ({
            id: s.id,
            name: s.name,
            board: s.board,
            location: s.address || 'Unknown Address',
            contact: s.contact_email || 'No email',
            active: s.is_active,
            totalCredits: 500,
            usedCredits: 100
          })));
        } else {
          setSchoolsList([]);
        }

        // 3. Fetch Classes
        const { data: classesData } = await supabase
          .from('school_classes')
          .select('*');
        if (classesData && classesData.length > 0) {
          const classesMap: Record<string, string[]> = {};
          classesData.forEach((c: any) => {
            if (!classesMap[c.class_name]) {
              classesMap[c.class_name] = [];
            }
            if (!classesMap[c.class_name].includes(c.section_name)) {
              classesMap[c.class_name].push(c.section_name);
            }
          });
          setAcademicClasses(classesMap);
        } else {
          setAcademicClasses({});
        }

        // 4. Fetch Teachers
        const { data: teachersData } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_type', 'teacher');
        if (teachersData && teachersData.length > 0) {
          const mappedTeachers = [];
          for (const t of teachersData) {
            const { data: accessData } = await supabase
              .from('teacher_class_access')
              .select('class_id, school_classes(class_name, section_name)')
              .eq('teacher_id', t.id);
            
            const classesList = (accessData || []).map((a: any) => 
              a.school_classes ? `${a.school_classes.class_name}-${a.school_classes.section_name}` : null
            ).filter(Boolean);

            mappedTeachers.push({
              email: t.email || `${t.full_name.toLowerCase().replace(/\s/g, '')}@psy.com`,
              classes: classesList
            });
          }
          setTeachers(mappedTeachers);
        } else {
          setTeachers([]);
        }

        // 5. Fetch commits and backups
        await fetchVersionsAndBackups();

      } catch (err) {
        console.error('Admin verification error:', err);
        // Load offline fallback data
        setScenarios(fallbackScenarios);
        setSchoolsList(INITIAL_SCHOOLS);
        setTeachers(INITIAL_TEACHERS);
        setAcademicClasses(INITIAL_CLASSES);
      } finally {
        setLoading(false);
      }
    };
    checkAuthAndLoad();
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
          timer_duration: q.timer_duration || 15,
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
        timer_duration: 15,
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

    const syncClassAddition = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          for (const sec of sectionsToAdd) {
            await supabase.from('school_classes').insert({
              school_id: activeSchoolId,
              class_name: newSectionClass,
              section_name: sec
            });
          }
        }
      } catch (err) {
        console.error('Error inserting classes in Supabase:', err);
      }
    };
    syncClassAddition();
    setNewSectionName('');
  };

  const handleRemoveSection = (cls: string, sec: string) => {
    setAcademicClasses(prev => ({
      ...prev,
      [cls]: prev[cls].filter(s => s !== sec)
    }));

    const syncClassDeletion = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          await supabase.from('school_classes')
            .delete()
            .eq('school_id', activeSchoolId)
            .eq('class_name', cls)
            .eq('section_name', sec);
        }
      } catch (err) {
        console.error('Error deleting class in Supabase:', err);
      }
    };
    syncClassDeletion();
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
    
    // Reset video upload states
    setUploadingVideo(false);
    setUploadProgress(0);
    setUploadError(null);
    setIsDragOver(false);
    setShowManualUrl(false);
    
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
    
    // Reset video upload states
    setUploadingVideo(false);
    setUploadProgress(0);
    setUploadError(null);
    setIsDragOver(false);
    setShowManualUrl(false);
    
    setIsScenarioModalOpen(true);
  };

  const handleSaveScenario = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scenarioTitle.trim() || !scenarioVideoUrl.trim()) return;

    let targetScenId = '';
    let updatedList: any[] = [];

    if (editingScenario) {
      targetScenId = editingScenario.id;
      const updatedScen = {
        ...editingScenario,
        title: scenarioTitle,
        video_url: scenarioVideoUrl,
        target_age_group: scenarioAgeGroup,
        status: scenarioStatus,
        expected_time: scenarioExpectedTime,
        focus_category: scenarioFocusCategory,
        questions: scenarioQuestions
      };
      updatedList = scenarios.map(s => s.id === editingScenario.id ? updatedScen : s);
      setScenarios(updatedList);
    } else {
      targetScenId = generateUUID();
      const newScen = {
        id: targetScenId,
        title: scenarioTitle,
        video_url: scenarioVideoUrl,
        target_age_group: scenarioAgeGroup,
        status: scenarioStatus,
        expected_time: scenarioExpectedTime,
        focus_category: scenarioFocusCategory,
        is_active: true,
        questions: [] // No questions initialised on creation
      };
      updatedList = [...scenarios, newScen];
      setScenarios(updatedList);
    }
    
    // Sync to Supabase
    try {
      await syncScenarioToSupabase(targetScenId, updatedList);
    } catch (err: any) {
      alert("Failed to sync scenario changes: " + err.message);
    }
    setIsScenarioModalOpen(false);
  };

  const handleDeleteScenario = async (id: string) => {
    if (confirm('Are you sure you want to delete this scenario?')) {
      const scen = scenarios.find(s => s.id === id);
      const updatedList = scenarios.filter(s => s.id !== id);
      await syncBulkScenariosToSupabase(updatedList, `Auto-Commit: Deleted scenario "${scen?.title || 'Unknown'}"`);
    }
  };

  const [seedingLoading, setSeedingLoading] = useState(false);

  const handleSeedDefaultScenarios = async () => {
    if (!confirm('Are you sure you want to seed the default 18 baseline scenarios to the database?')) return;
    setSeedingLoading(true);
    try {
      const success = await syncBulkScenariosToSupabase(fallbackScenarios, "Auto-Commit: Seeded default baseline scenarios");
      if (success) {
        alert('Successfully seeded 18 baseline scenarios to Supabase!');
        window.location.reload();
      }
    } catch (err: any) {
      alert('Error seeding default scenarios: ' + err.message);
    } finally {
      setSeedingLoading(false);
    }
  };

  const handleCloneQuestionSet = async (fromScenarioId: string, fromSetNum: number, toScenarioId: string, toSetNum: number) => {
    const fromScen = scenarios.find(s => s.id === fromScenarioId);
    if (!fromScen) return;
    const questionsToClone = fromScen.questions 
      ? fromScen.questions.filter((q: any) => q.sequence_order === fromSetNum)
      : [];

    if (questionsToClone.length === 0) {
      alert("No questions found in this set to clone.");
      return;
    }

    const updatedList = scenarios.map(s => {
      if (s.id === toScenarioId) {
        const otherQuestions = s.questions ? s.questions.filter((q: any) => q.sequence_order !== toSetNum) : [];
        const cloned = questionsToClone.map((q: any) => ({
          ...JSON.parse(JSON.stringify(q)),
          id: generateUUID(),
          sequence_order: toSetNum,
          options: q.options ? q.options.map((opt: any) => ({
            ...opt,
            id: generateUUID()
          })) : []
        }));
        const questionsList = [...otherQuestions, ...cloned];
        questionsList.sort((a: any, b: any) => a.sequence_order - b.sequence_order);
        return { ...s, questions: questionsList };
      }
      return s;
    });

    setScenarios(updatedList);
    try {
      await syncScenarioToSupabase(toScenarioId, updatedList);
      alert(`Successfully cloned questions from Set ${fromSetNum} to Set ${toSetNum}!`);
    } catch (err: any) {
      alert("Failed to clone questions in database: " + err.message);
    }
    setSelectedMatrixCell(null);
  };

  const handleClearQuestionSet = async (scenarioId: string, setNum: number) => {
    if (confirm(`Are you sure you want to clear all questions in Set ${setNum} for this scenario?`)) {
      const updatedList = scenarios.map(s => {
        if (s.id === scenarioId) {
          const questionsList = s.questions ? s.questions.filter((q: any) => q.sequence_order !== setNum) : [];
          return { ...s, questions: questionsList };
        }
        return s;
      });
      setScenarios(updatedList);
      try {
        await syncScenarioToSupabase(scenarioId, updatedList);
      } catch (err: any) {
        alert("Failed to clear questions in database: " + err.message);
      }
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

  const handleApplyBulkChanges = async () => {
    if (handleValidateBulkJson(bulkJsonText)) {
      const parsedScenarios = JSON.parse(bulkJsonText);
      await syncBulkScenariosToSupabase(parsedScenarios, "Auto-Commit: Inline schema editor update");
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
        timer_duration: 15,
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

  const handleSaveQuestionSet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qSetSelectedScenarioId) return;

    let updatedScen: any = null;
    const updatedList = scenarios.map(s => {
      if (s.id === qSetSelectedScenarioId) {
        const otherQuestions = s.questions ? s.questions.filter((q: any) => q.sequence_order !== qSetSetNumber) : [];

        const newQs = qSetQuestions.map((q: any) => {
          const mappedOptions = q.options.map((opt: any) => ({
            ...opt,
            id: opt.id && !opt.id.startsWith('opt_') && opt.id.length > 10 ? opt.id : generateUUID()
          }));
          return {
            id: q.id && !q.id.startsWith('q_') && q.id.length > 10 ? q.id : generateUUID(),
            sequence_order: qSetSetNumber,
            question_text: q.question_text,
            show_at_seconds: q.show_at_seconds || 0,
            timer_duration: q.timer_duration || 15,
            options: mappedOptions
          };
        });

        const questionsList = [...otherQuestions, ...newQs];
        questionsList.sort((a: any, b: any) => a.sequence_order - b.sequence_order);

        updatedScen = {
          ...s,
          questions: questionsList
        };
        return updatedScen;
      }
      return s;
    });

    setScenarios(updatedList);
    if (updatedScen) {
      try {
        await syncScenarioToSupabase(qSetSelectedScenarioId, updatedList);
      } catch (err: any) {
        alert("Failed to save question set changes in database: " + err.message);
      }
    }
    setIsQuestionSetModalOpen(false);
  };

  const handleInlineSaveQuestion = async (scenId: string) => {
    if (!editQForm) return;

    if (!editQForm.question_text.trim()) {
      alert('Question prompt cannot be empty.');
      return;
    }

    const updatedList = scenarios.map(s => {
      if (s.id === scenId) {
        const questionsList = s.questions.map((q: any) => {
          if (q.id === editQForm.id) {
            return {
              ...editQForm,
              question_text: editQForm.question_text.trim()
            };
          }
          return q;
        });

        return {
          ...s,
          questions: questionsList
        };
      }
      return s;
    });

    setScenarios(updatedList);
    setEditingQuestionId(null);
    setEditQForm(null);

    try {
      await syncScenarioToSupabase(scenId, updatedList);
    } catch (err: any) {
      alert("Failed to save question changes in database: " + err.message);
    }
  };

  const handleCreateSchool = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSchoolName.trim()) return;
    const newSchoolId = generateUUID();
    const newSchool = {
      id: newSchoolId,
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
    
    // Sync with Supabase
    const syncSchoolCreation = async () => {
      try {
        await supabase.from('schools').insert({
          id: newSchoolId,
          name: newSchoolName,
          board: newSchoolBoard,
          address: newSchoolLocation,
          contact_email: newSchoolContact,
          is_active: true
        });
      } catch (err) {
        console.error('Error inserting school in Supabase:', err);
      }
    };
    syncSchoolCreation();
    
    // Clear forms
    setNewSchoolName('');
    setNewSchoolLocation('');
    setNewSchoolContact('');
    setNewSchoolCredits(100);
  };

  const handleToggleSchoolActive = (id: string) => {
    setSchoolsList(prev => prev.map(s => {
      if (s.id === id) {
        const nextActive = !s.active;
        supabase.from('schools')
          .update({ is_active: nextActive })
          .eq('id', id)
          .then(({ error }) => {
            if (error) console.error('Error toggling school active:', error);
          });
        return { ...s, active: nextActive };
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
      supabase.from('schools')
        .delete()
        .eq('id', id)
        .then(({ error }) => {
          if (error) console.error('Error deleting school in Supabase:', error);
        });
    }
  };

  const handleImpersonateSchool = async (sch: any) => {
    setImpersonatingSchool(sch);
    setSchoolName(sch.name);
    setSchoolBoard(sch.board || 'CBSE');
    setActiveSchoolId(sch.id);
    setShowSchoolPicker(false);

    // Load school-specific data from DB
    try {
      // Fetch school logo
      const { data: schoolRow } = await supabase
        .from('schools')
        .select('*')
        .eq('id', sch.id)
        .single();
      if (schoolRow?.logo_url) setSchoolLogo(schoolRow.logo_url);

      // Fetch classes for this school
      const { data: classesData } = await supabase
        .from('school_classes')
        .select('*')
        .eq('school_id', sch.id);
      if (classesData && classesData.length > 0) {
        const classesMap: Record<string, string[]> = {};
        classesData.forEach((c: any) => {
          if (!classesMap[c.class_name]) classesMap[c.class_name] = [];
          if (!classesMap[c.class_name].includes(c.section_name)) classesMap[c.class_name].push(c.section_name);
        });
        setAcademicClasses(classesMap);
        setStats(prev => ({ ...prev, activeClasses: classesData.length }));
      } else {
        setAcademicClasses({});
        setStats(prev => ({ ...prev, activeClasses: 0 }));
      }

      // Fetch student roster for this school
      const { data: rosterData } = await supabase
        .from('student_roster')
        .select('*')
        .eq('school_id', sch.id);
      setStats(prev => ({ ...prev, totalStudents: rosterData?.length || 0 }));

      // Fetch assessment sessions count
      const { data: sessionsData } = await supabase
        .from('assessment_sessions')
        .select('id')
        .eq('school_id', sch.id);
      setStats(prev => ({ ...prev, evaluationsDone: sessionsData?.length || 0 }));

      // Fetch credits
      const { data: creditsData } = await supabase
        .from('assessment_credits')
        .select('*')
        .eq('school_id', sch.id);
      const totalCr = creditsData?.reduce((sum: number, c: any) => sum + (c.total_credits || 0), 0) || 0;
      const usedCr = creditsData?.reduce((sum: number, c: any) => sum + (c.used_credits || 0), 0) || 0;
      setStats(prev => ({ ...prev, creditsLeft: totalCr - usedCr }));
    } catch (err) {
      console.warn('Error loading impersonated school data:', err);
    }

    // Switch to school admin view
    setCurrentRole('school_admin');
    setActiveTab('mission_control');
  };

  const handleExitImpersonation = () => {
    setImpersonatingSchool(null);
    setCurrentRole('super_admin');
    setActiveTab('scenarios');
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
  const handleDelegateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeacherEmail.trim()) return;

    const newT = { email: newTeacherEmail, classes: newTeacherClasses };
    setTeachers(prev => [
      ...prev,
      newT
    ]);
    
    // Sync with Supabase
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // Check if profile exists for teacher email or create one
        const { data: teacherProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', newTeacherEmail)
          .single();
        
        let teacherId = teacherProfile?.id;
        if (!teacherId) {
          const { data: newProfile } = await supabase
            .from('profiles')
            .insert({
              id: generateUUID(),
              full_name: newTeacherEmail.split('@')[0],
              email: newTeacherEmail,
              user_type: 'teacher',
              age_tier: 'College (18+)',
              institution_type: 'School'
            })
            .select()
            .single();
          teacherId = newProfile?.id;
        }
        
        if (teacherId) {
          // Assign class access in teacher_class_access
          for (const clsSec of newTeacherClasses) {
            const [cls, sec] = clsSec.split('-');
            const { data: schClass } = await supabase
              .from('school_classes')
              .select('id')
              .eq('school_id', activeSchoolId)
              .eq('class_name', cls)
              .eq('section_name', sec)
              .limit(1)
              .single();
            
            if (schClass) {
              await supabase
                .from('teacher_class_access')
                .upsert({
                  teacher_id: teacherId,
                  class_id: schClass.id,
                  granted_by: session.user.id
                });
            }
          }
        }
      }
    } catch (err) {
      console.error('Error delegating teacher in Supabase:', err);
    }
    
    setNewTeacherEmail('');
    setNewTeacherClasses([]);
  };

  const handleDeleteTeacher = async (email: string) => {
    setTeachers(prev => prev.filter(x => x.email !== email));
    
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single();
      if (profile) {
        await supabase
          .from('teacher_class_access')
          .delete()
          .eq('teacher_id', profile.id);
      }
    } catch (err) {
      console.error('Error deleting teacher class access in Supabase:', err);
    }
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

          {/* Operational Mode Badge */}
          {impersonatingSchool ? (
            <div className="p-3 bg-teal-950/30 border border-teal-800/40 rounded-2xl space-y-2">
              <span className="text-[9px] font-bold text-teal-500/70 uppercase tracking-widest block">Impersonating School</span>
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-teal-400" />
                <span className="text-xs font-black text-teal-300 truncate">{impersonatingSchool.name}</span>
              </div>
              <button
                onClick={handleExitImpersonation}
                className="w-full py-1.5 text-[10px] font-extrabold rounded-lg bg-red-950/40 border border-red-900/30 text-red-400 hover:bg-red-900/30 hover:text-red-300 transition-all flex items-center justify-center gap-1.5"
              >
                <X className="w-3 h-3" /> Exit Impersonation
              </button>
            </div>
          ) : (
            <div className="p-3 bg-zinc-900/40 border border-zinc-800 rounded-2xl space-y-2">
              <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block">Operational Mode</span>
              <div className="flex items-center gap-2 py-1">
                <div className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_6px_rgba(168,85,247,0.5)]"></div>
                <span className="text-[11px] font-black text-purple-300">Super Admin</span>
              </div>
            </div>
          )}

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
                  onClick={() => setShowSchoolPicker(true)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900 transition-all"
                >
                  <Eye className="w-4 h-4" /> Impersonate School
                </button>
              </>
            )}
          </nav>
        </div>

        {/* User Profile & Workspace controls */}
        <div className="space-y-3 mt-auto w-full pt-4 border-t border-zinc-900">
          {profileData && (
            <div className="relative">
              {/* Dropdown Menu */}
              {profileDropdownOpen && (
                <div className="absolute bottom-full left-0 w-full mb-2 bg-zinc-950 border border-zinc-850 rounded-2xl p-1.5 shadow-[0_4px_20px_rgba(0,0,0,0.5)] z-50 animate-fade-in space-y-1">
                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      openProfileSettingsModal();
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-zinc-300 hover:bg-zinc-900 hover:text-white transition-all flex items-center gap-2"
                  >
                    <Settings className="w-3.5 h-3.5 text-zinc-400" /> Profile Settings
                  </button>
                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      handleLogout();
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-red-400 hover:bg-red-950/20 hover:text-red-300 transition-all flex items-center gap-2"
                  >
                    <LogOut className="w-3.5 h-3.5 text-red-400" /> Log Out
                  </button>
                </div>
              )}

              {/* Profile trigger button */}
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="w-full text-left p-2 rounded-xl bg-zinc-900/20 border border-zinc-900 hover:border-zinc-800 hover:bg-zinc-900/40 transition-all flex items-center gap-2.5 active:scale-98"
              >
                {/* Avatar */}
                <div className={`shrink-0 rounded-lg ${currentRole === 'super_admin' ? 'p-[2px]' : ''}`}
                  style={currentRole === 'super_admin' ? {
                    background: 'linear-gradient(135deg, #FFD700, #F5A623, #FFD700, #FFC107)',
                    boxShadow: '0 0 8px rgba(255,215,0,0.35)',
                  } : undefined}
                >
                  <div className={`w-8 h-8 rounded-[6px] flex items-center justify-center text-[10px] font-black text-white ${
                    profileData.avatar_url && profileData.avatar_url.startsWith('bg-') 
                      ? profileData.avatar_url 
                      : 'bg-gradient-to-tr from-purple-600 to-indigo-600 shadow-[0_0_10px_rgba(168,85,247,0.2)]'
                  }`}>
                    {profileData.avatar_url && !profileData.avatar_url.startsWith('bg-') ? (
                      <img src={profileData.avatar_url} alt="Avatar" className="w-full h-full object-cover rounded-[6px]" />
                    ) : (
                      <span className="text-[11px] font-black uppercase">
                        {(profileData.first_name?.[0] || '') + (profileData.last_name?.[0] || profileData.email?.[0] || 'U')}
                      </span>
                    )}
                  </div>
                </div>

                {/* Profile Text */}
                <div className="flex-1 min-w-0">
                  <span className="text-[11px] font-black text-white block truncate leading-tight">
                    {profileData.full_name || `${profileData.first_name || ''} ${profileData.last_name || ''}`.trim() || 'User Profile'}
                  </span>
                  <span className="text-[9px] font-bold text-zinc-500 truncate block">
                    {profileData.email || 'Admin Profile'}
                  </span>
                </div>
                
                {/* Chevron icon */}
                <ChevronUp className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
              </button>
            </div>
          )}

          <button 
            onClick={() => router.push('/assessment')}
            className="w-full bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-xs font-semibold py-2.5 rounded-xl transition-all"
          >
            View Student Workspace
          </button>
        </div>
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
                  { id: 'schema', label: 'Bulk Schema Sync' },
                  { id: 'versions', label: 'Versions & Backups' }
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
                  {filteredScenarios.length === 0 ? (
                    <div className="text-center py-16 px-4 rounded-3xl bg-zinc-950 border border-zinc-900 space-y-4">
                      <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-500 flex items-center justify-center mx-auto">
                        <FolderOpen className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-white">No Scenarios Found</h4>
                        <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                          Your active cohort database contains 0 scenarios. Seed the baseline library or create one manually to start.
                        </p>
                      </div>
                      <div className="flex justify-center gap-3 pt-2">
                        <button
                          onClick={handleSeedDefaultScenarios}
                          disabled={seedingLoading}
                          className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold text-xs transition-all active:scale-95 flex items-center gap-1.5"
                        >
                          {seedingLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                          <span>Seed Default Library</span>
                        </button>
                        <button
                          onClick={() => setScenActiveView('schema')}
                          className="px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 font-bold text-xs transition-all active:scale-95"
                        >
                          Import Schema
                        </button>
                      </div>
                    </div>
                  ) : (
                    filteredScenarios.map((scen) => {
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

                                if (editingQuestionId === q.id) {
                                  return (
                                    <div key={q.id || qIdx} className="p-5 rounded-2xl bg-zinc-905 border border-purple-500/40 space-y-4 shadow-xl text-left">
                                      <div className="flex justify-between items-center text-[10px] text-zinc-500 font-bold">
                                        <span>Set {q.sequence_order} • Q{qIdx + 1} (Editing Inline)</span>
                                      </div>

                                      {/* Question Prompt */}
                                      <div className="space-y-1">
                                        <label className="text-[10px] text-zinc-500 font-bold uppercase block">Question Prompt</label>
                                        <textarea
                                          value={editQForm.question_text}
                                          onChange={(e) => setEditQForm({ ...editQForm, question_text: e.target.value })}
                                          rows={2}
                                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2 px-3 text-xs focus:outline-none text-white focus:border-purple-500"
                                        />
                                      </div>

                                      {/* Trigger Time & Timer Duration */}
                                      <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                          <label className="text-[10px] text-zinc-500 font-bold uppercase block">Trigger time (sec)</label>
                                          <input
                                            type="number"
                                            required
                                            min="0"
                                            value={editQForm.show_at_seconds}
                                            onChange={(e) => setEditQForm({ ...editQForm, show_at_seconds: Number(e.target.value) })}
                                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2 px-3 text-xs focus:outline-none text-white focus:border-purple-500"
                                          />
                                        </div>
                                        <div className="space-y-1">
                                          <label className="text-[10px] text-zinc-500 font-bold uppercase block">Overlay Timer (sec)</label>
                                          <input
                                            type="number"
                                            required
                                            min="1"
                                            value={editQForm.timer_duration || 15}
                                            onChange={(e) => setEditQForm({ ...editQForm, timer_duration: Number(e.target.value) })}
                                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2 px-3 text-xs focus:outline-none text-white focus:border-purple-500"
                                          />
                                        </div>
                                      </div>

                                      {/* Option choices */}
                                      <div className="space-y-3 pt-3 border-t border-zinc-800/80">
                                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Choices & Dimension Weight Mappings</span>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                          {editQForm.options.map((opt: any, oIdx: number) => {
                                            const dimensionsList = [
                                              'The Builder', 'The Thinker', 'The Creator',
                                              'The Connector', 'The Leader', 'The Organizer'
                                            ];
                                            const activeDims = (opt.target_dimension || '').split(',').map((d: any) => d.trim()).filter(Boolean);

                                            return (
                                              <div key={oIdx} className="p-3.5 rounded-xl bg-zinc-950/65 border border-zinc-850 space-y-3">
                                                <div className="flex justify-between items-center">
                                                  <span className="text-[10px] font-extrabold text-teal-400">Choice Option {opt.option_letter}</span>
                                                </div>
                                                <input
                                                  type="text"
                                                  required
                                                  placeholder="Choice text"
                                                  value={opt.option_text}
                                                  onChange={(e) => {
                                                    const copy = [...editQForm.options];
                                                    copy[oIdx] = { ...copy[oIdx], option_text: e.target.value };
                                                    setEditQForm({ ...editQForm, options: copy });
                                                  }}
                                                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-1.5 px-3 text-xs focus:outline-none text-white focus:border-teal-500"
                                                />
                                                {/* Dimension weights and toggle buttons */}
                                                <div className="space-y-2">
                                                  <div className="flex justify-between items-center text-[8px] text-zinc-500">
                                                    <span className="font-bold uppercase tracking-wider">Target Dimension</span>
                                                    <div className="flex items-center gap-1">
                                                      <span>Weight:</span>
                                                      <input
                                                        type="number"
                                                        step="0.05"
                                                        min="0.0"
                                                        max="1.0"
                                                        value={opt.intensity_weight}
                                                        onChange={(e) => {
                                                          const copy = [...editQForm.options];
                                                          copy[oIdx] = { ...copy[oIdx], intensity_weight: parseFloat(e.target.value) || 0.8 };
                                                          setEditQForm({ ...editQForm, options: copy });
                                                        }}
                                                        className="w-10 bg-zinc-900 border border-zinc-800 rounded px-1 py-0.5 text-[8px] text-center text-white focus:outline-none focus:border-teal-500 font-mono"
                                                      />
                                                    </div>
                                                  </div>
                                                  <div className="grid grid-cols-3 gap-1">
                                                    {dimensionsList.map((dimName) => {
                                                      const isActive = activeDims.includes(dimName);
                                                      return (
                                                        <button
                                                          key={dimName}
                                                          type="button"
                                                          onClick={() => {
                                                            const newDims = isActive
                                                              ? activeDims.filter((d: any) => d !== dimName)
                                                              : [...activeDims, dimName];
                                                            const copy = [...editQForm.options];
                                                            copy[oIdx] = { ...copy[oIdx], target_dimension: newDims.join(', ') };
                                                            setEditQForm({ ...editQForm, options: copy });
                                                          }}
                                                          className={`py-1 px-1.5 rounded text-[8px] font-bold transition-all border ${
                                                            isActive
                                                              ? 'bg-teal-500/10 border-teal-500/30 text-teal-400'
                                                              : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700 text-zinc-500 hover:text-zinc-300'
                                                          }`}
                                                        >
                                                          {dimName.replace('The ', '')}
                                                        </button>
                                                      );
                                                    })}
                                                  </div>
                                                </div>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </div>

                                      {/* Form Actions */}
                                      <div className="flex justify-end gap-2 pt-2">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setEditingQuestionId(null);
                                            setEditQForm(null);
                                          }}
                                          className="px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 hover:bg-zinc-900 text-zinc-400 hover:text-white transition-all text-xs font-bold"
                                        >
                                          Cancel
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleInlineSaveQuestion(scen.id)}
                                          className="px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white transition-all text-xs font-bold"
                                        >
                                          Save Changes
                                        </button>
                                      </div>
                                    </div>
                                  );
                                }

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
                                        <span className="font-bold text-teal-400">Timer: {q.timer_duration || 15}s</span>
                                        <button
                                          onClick={() => {
                                            setEditingQuestionId(q.id);
                                            setEditQForm(JSON.parse(JSON.stringify(q)));
                                          }}
                                          className="p-1 px-2 rounded bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 text-purple-400 hover:text-purple-300 transition-all font-bold flex items-center gap-1 text-[8px] uppercase tracking-wider"
                                          title="Edit Question Inline"
                                        >
                                          <Pencil className="w-2.5 h-2.5 text-purple-400" />
                                          <span>Edit</span>
                                        </button>
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
                    })
                  )}
                </div>
              )}

              {/* View 2: Set Matrix Diagnostic Grid */}
              {scenActiveView === 'matrix' && (
                <div className="overflow-x-auto rounded-3xl border border-zinc-900 bg-zinc-950 shadow-2xl">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead>
                      <tr className="bg-zinc-900/40 border-b border-zinc-900 text-zinc-500 font-bold uppercase tracking-wider">
                        <th className="p-4">Scenario Backdrop</th>
                        <th className="p-4 text-center">Set 1</th>
                        <th className="p-4 text-center">Set 2</th>
                        <th className="p-4 text-center">Set 3</th>
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
                            <option value={1}>Set 1</option>
                            <option value={2}>Set 2</option>
                            <option value={3}>Set 3</option>
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

              {/* View 6: Versions & Backups */}
              {scenActiveView === 'versions' && (
                <div className="space-y-8 text-left max-w-5xl mx-auto">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    
                    {/* Left Column: Version Control (Git-style) */}
                    <div className="lg:col-span-7 space-y-6">
                      <div className="p-6 rounded-3xl bg-zinc-950 border border-zinc-900 space-y-5">
                        <div>
                          <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                            <Sliders className="w-5 h-5 text-purple-400" /> Scenario Version Ledger
                          </h3>
                          <p className="text-xs text-zinc-500 mt-1">Snapshot the active scenario matrix state and roll back to previous versions if needed.</p>
                        </div>

                        {/* Snapshot active state */}
                        <form onSubmit={handleCreateCommit} className="p-4 rounded-2xl bg-zinc-900/40 border border-zinc-900 space-y-3">
                          <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Commit Description</label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              required
                              placeholder="e.g. Added CBSE grade-10 science questions..."
                              value={commitDescription}
                              onChange={(e) => setCommitDescription(e.target.value)}
                              className="flex-1 bg-black border border-zinc-850 rounded-xl py-2 px-3 text-xs focus:outline-none text-white focus:border-purple-500/50"
                              disabled={isCommiting}
                            />
                            <button
                              type="submit"
                              disabled={isCommiting || !commitDescription.trim()}
                              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs shadow-lg shadow-purple-600/20 disabled:opacity-40 disabled:hover:bg-purple-600 transition-all flex items-center gap-1.5"
                            >
                              {isCommiting ? (
                                <>
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Commiting...
                                </>
                              ) : (
                                "Push Commit"
                              )}
                            </button>
                          </div>
                        </form>

                        {/* Timeline */}
                        <div className="relative pl-6 border-l border-zinc-900 space-y-6 max-h-[500px] overflow-y-auto pr-2">
                          {commitsList.length === 0 ? (
                            <div className="py-8 text-center text-zinc-500 text-xs">
                              No version commits recorded yet. Push a commit above to snapshot your matrix.
                            </div>
                          ) : (
                            commitsList.map((commit) => (
                              <div key={commit.id} className="relative group text-left">
                                {/* Dot Indicator */}
                                <div className="absolute -left-[30px] top-1.5 w-2 h-2 rounded-full bg-purple-500 border border-black shadow-[0_0_8px_rgba(168,85,247,0.8)] group-hover:scale-125 transition-all" />
                                
                                <div className="p-4 rounded-2xl border border-zinc-900 bg-zinc-900/10 hover:border-zinc-850 hover:bg-zinc-900/20 transition-all space-y-2">
                                  <div className="flex justify-between items-start flex-wrap gap-2">
                                    <div>
                                      <span className="font-mono text-[10px] bg-purple-950/40 text-purple-300 border border-purple-900/40 rounded px-1.5 py-0.5 font-bold uppercase mr-2 select-all">
                                        commit {commit.commit_hash}
                                      </span>
                                      <span className="text-[10px] text-zinc-500">
                                        {new Date(commit.created_at).toLocaleString()}
                                      </span>
                                    </div>
                                    <button
                                      onClick={() => handleRevertCommit(commit)}
                                      disabled={isRestoring}
                                      className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 text-teal-400 hover:text-teal-300 border border-zinc-800 rounded-lg text-[9px] font-extrabold transition-all cursor-pointer"
                                    >
                                      Revert to This
                                    </button>
                                  </div>
                                  
                                  <p className="text-xs font-bold text-zinc-200">{commit.description}</p>
                                  
                                  {/* Snapshot metadata summary */}
                                  <div className="pt-2 border-t border-zinc-900 flex justify-between items-center text-[10px] text-zinc-500">
                                    <span>Snapshots: {Array.isArray(commit.scenarios_snapshot) ? commit.scenarios_snapshot.length : 0} Scenarios</span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSelectedCommitSnapshot(selectedCommitSnapshot?.id === commit.id ? null : commit);
                                      }}
                                      className="text-purple-400 hover:underline hover:text-purple-300 font-bold"
                                    >
                                      {selectedCommitSnapshot?.id === commit.id ? "Hide Details" : "Show Details"}
                                    </button>
                                  </div>

                                  {selectedCommitSnapshot?.id === commit.id && (
                                    <div className="p-3 bg-black rounded-lg border border-zinc-900 space-y-1 font-mono text-[9px] text-zinc-400 max-h-32 overflow-y-auto leading-relaxed select-all">
                                      {commit.scenarios_snapshot.map((s: any, idx: number) => (
                                        <div key={idx} className="truncate">
                                          ➔ {s.title} ({s.questions ? s.questions.length : 0} Qs) - {s.target_age_group}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Database Backups */}
                    <div className="lg:col-span-5 space-y-6">
                      <div className="p-6 rounded-3xl bg-zinc-950 border border-zinc-900 space-y-5">
                        <div>
                          <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                            <Activity className="w-5 h-5 text-teal-400" /> Database Backup Hub
                          </h3>
                          <p className="text-xs text-zinc-500 mt-1">Export, list, and schedule system-wide backups of users, institutional structures, and answers.</p>
                        </div>

                        {/* Trigger manual backup card */}
                        <div className="p-4 rounded-2xl bg-zinc-900/40 border border-zinc-900 space-y-4 text-center">
                          <p className="text-[10px] text-zinc-400 leading-relaxed">
                            Scheduled backups run automatically **every night at midnight** via Vercel Cron. You can also trigger a manual cold-storage snapshot right now.
                          </p>
                          <button
                            type="button"
                            onClick={handleTriggerBackup}
                            disabled={isBackingUp}
                            className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-black font-black text-xs shadow-lg shadow-teal-600/10 disabled:opacity-40 disabled:hover:bg-teal-600 transition-all flex items-center justify-center gap-1.5"
                          >
                            {isBackingUp ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin text-black" /> Creating Backup...
                              </>
                            ) : (
                              <>
                                <Activity className="w-4 h-4 text-black" /> Trigger Manual Backup
                              </>
                            )}
                          </button>
                        </div>

                        {/* Backups log list */}
                        <div className="space-y-3 max-h-[360px] overflow-y-auto pr-2">
                          <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block text-left">Backup Logs &amp; Registry</label>
                          {backupsList.length === 0 ? (
                            <div className="py-6 text-center text-zinc-500 text-xs">
                              No backup records found. Trigger one above or wait for cron.
                            </div>
                          ) : (
                            backupsList.map((backup) => (
                              <div key={backup.id} className="p-3 rounded-2xl border border-zinc-900 bg-zinc-900/10 space-y-3 relative group">
                                <div className="flex justify-between items-start flex-wrap gap-2 text-left">
                                  <div className="space-y-1">
                                    <div className="text-[11px] font-black text-white font-mono truncate max-w-[200px]" title={backup.backup_name}>
                                      {backup.backup_name}
                                    </div>
                                    <div className="text-[9px] text-zinc-500">
                                      {new Date(backup.created_at).toLocaleString()}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded border ${
                                      backup.status === 'Success' 
                                        ? 'bg-emerald-950/40 text-emerald-450 border-emerald-900/40' 
                                        : 'bg-red-950/40 text-red-400 border-red-900/40'
                                    }`}>
                                      {backup.status}
                                    </span>
                                    <span className="text-[8px] font-bold uppercase px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
                                      {backup.backup_type}
                                    </span>
                                  </div>
                                </div>

                                {/* Counts Grid */}
                                <div className="grid grid-cols-5 gap-1.5 py-1.5 border-y border-zinc-900/80 text-[8px] font-bold text-center text-zinc-400 font-mono">
                                  <div className="space-y-0.5">
                                    <div className="text-zinc-500 text-[7px] uppercase font-sans">User</div>
                                    <div className="text-white">{backup.profiles_count}</div>
                                  </div>
                                  <div className="space-y-0.5">
                                    <div className="text-zinc-500 text-[7px] uppercase font-sans">Schl</div>
                                    <div className="text-white">{backup.schools_count}</div>
                                  </div>
                                  <div className="space-y-0.5">
                                    <div className="text-zinc-500 text-[7px] uppercase font-sans">Rstr</div>
                                    <div className="text-white">{backup.roster_count}</div>
                                  </div>
                                  <div className="space-y-0.5">
                                    <div className="text-zinc-500 text-[7px] uppercase font-sans">Scen</div>
                                    <div className="text-white">{backup.scenarios_count}</div>
                                  </div>
                                  <div className="space-y-0.5">
                                    <div className="text-zinc-500 text-[7px] uppercase font-sans">Ques</div>
                                    <div className="text-white">{backup.questions_count}</div>
                                  </div>
                                </div>

                                <div className="flex justify-between items-center pt-1">
                                  <button
                                    onClick={() => handleRestoreBackup(backup)}
                                    disabled={isRestoring || backup.status !== 'Success'}
                                    className="px-2 py-1 rounded-md bg-red-950/40 hover:bg-red-900/30 text-red-400 hover:text-red-300 border border-red-900/30 text-[9px] font-extrabold transition-all cursor-pointer"
                                  >
                                    {isRestoring && restoringId === backup.id ? (
                                      <>
                                        <Loader2 className="w-2.5 h-2.5 animate-spin mr-1 inline-block" /> Restoring...
                                      </>
                                    ) : (
                                      "Restore System"
                                    )}
                                  </button>

                                  <button
                                    onClick={() => handleDeleteBackup(backup)}
                                    className="p-1 rounded text-zinc-500 hover:text-red-400 hover:bg-red-950/25 border border-transparent hover:border-red-900/30 transition-all cursor-pointer"
                                    title="Delete backup log and file"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Cold-Storage Response Archive */}
                  <div className="p-6 rounded-3xl bg-zinc-950 border border-zinc-900 space-y-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                          <Archive className="w-5 h-5 text-emerald-400" /> Cold-Storage Response Archive
                        </h3>
                        <p className="text-xs text-zinc-500 mt-1">
                          Browse student response trails automatically preserved during scenario database changes or database rollbacks.
                        </p>
                      </div>
                      
                      {/* Search Bar */}
                      <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
                        <input
                          type="text"
                          placeholder="Search by student name or email..."
                          value={archiveSearchQuery}
                          onChange={(e) => setArchiveSearchQuery(e.target.value)}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2 pl-9 pr-4 text-xs text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>

                    {/* Filtered responses list */}
                    {(() => {
                      const filtered = archivedResponses.filter(r => 
                        !archiveSearchQuery || 
                        (r.student_name && r.student_name.toLowerCase().includes(archiveSearchQuery.toLowerCase())) ||
                        (r.student_email && r.student_email.toLowerCase().includes(archiveSearchQuery.toLowerCase())) ||
                        (r.scenario_title && r.scenario_title.toLowerCase().includes(archiveSearchQuery.toLowerCase()))
                      );

                      if (filtered.length === 0) {
                        return (
                          <div className="py-8 text-center text-zinc-500 text-xs border border-dashed border-zinc-900 rounded-2xl">
                            {archivedResponses.length === 0 
                              ? "No response trails archived in cold-storage yet." 
                              : "No matching archived responses found."}
                          </div>
                        );
                      }

                      return (
                        <div className="overflow-x-auto border border-zinc-900 rounded-2xl bg-zinc-900/10">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="border-b border-zinc-900 text-zinc-400 font-bold uppercase tracking-wider text-[10px] bg-zinc-950/40">
                                <th className="p-3">Student</th>
                                <th className="p-3">Scenario &amp; Question</th>
                                <th className="p-3">Chosen Option</th>
                                <th className="p-3 text-center">Dimension / Weight</th>
                                <th className="p-3">Archived At</th>
                                <th className="p-3 text-center">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-900/40">
                              {filtered.map((r) => (
                                <tr key={r.id} className="hover:bg-zinc-900/20 transition-all text-zinc-300">
                                  <td className="p-3 space-y-0.5">
                                    <div className="font-bold text-white">{r.student_name}</div>
                                    <div className="text-[10px] text-zinc-500 font-mono">{r.student_email}</div>
                                  </td>
                                  <td className="p-3 space-y-0.5 max-w-xs">
                                    <div className="text-teal-400 font-semibold truncate" title={r.scenario_title}>
                                      {r.scenario_title}
                                    </div>
                                    <div className="text-[10px] text-zinc-400 line-clamp-1" title={r.question_text}>
                                      {r.question_text}
                                    </div>
                                  </td>
                                  <td className="p-3 space-y-0.5 max-w-xs">
                                    <div className="font-bold text-white">
                                      Option {r.selected_option_letter}
                                    </div>
                                    <div className="text-[10px] text-zinc-400 line-clamp-1" title={r.selected_option_text}>
                                      {r.selected_option_text}
                                    </div>
                                  </td>
                                  <td className="p-3 text-center space-y-0.5">
                                    <span className="px-1.5 py-0.5 rounded bg-zinc-900 text-[10px] text-purple-400 border border-zinc-800 font-bold">
                                      {r.target_dimension}
                                    </span>
                                    <div className="text-[10px] text-zinc-500 font-mono">w: {r.intensity_weight}</div>
                                  </td>
                                  <td className="p-3 text-zinc-500 font-mono text-[10px]">
                                    {new Date(r.archived_at).toLocaleString()}
                                  </td>
                                  <td className="p-3 text-center">
                                    <button
                                      onClick={() => handleDeleteArchivedResponse(r.id)}
                                      className="p-1 rounded text-zinc-600 hover:text-red-400 hover:bg-red-950/20 border border-transparent hover:border-red-900/20 transition-all cursor-pointer"
                                      title="Permanently purge from archive"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      );
                    })()}
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
                          onClick={() => handleDeleteTeacher(t.email)}
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
                  {/* Metadata Row 1: Target Cohort Age & Focus Domain */}
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

                    <div className="space-y-1 relative text-left">
                      <label className="text-[10px] text-zinc-500 font-bold uppercase block">Focus Domain</label>
                      <button
                        type="button"
                        onClick={() => setIsFocusDropdownOpen(!isFocusDropdownOpen)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-2 px-3 text-xs focus:outline-none text-white text-left flex justify-between items-center hover:border-zinc-700 transition-all h-[34px]"
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

                  {/* Metadata Row 2: Status & Expected Time */}
                  <div className="grid grid-cols-2 gap-3 text-left">
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
                  </div>

                  {/* Scenario Video Asset Upload Zone */}
                  <div className="space-y-2 text-left">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] text-zinc-500 font-bold uppercase block">Scenario Video Asset</label>
                      <button
                        type="button"
                        onClick={() => setShowManualUrl(!showManualUrl)}
                        className="text-[10px] text-purple-400 hover:text-purple-300 font-bold transition-all"
                      >
                        {showManualUrl ? "✕ Hide Manual URL" : "✎ Paste direct URL"}
                      </button>
                    </div>

                    {/* Drag and Drop Zone */}
                    {!showManualUrl && (
                      <div
                        onDragOver={(e) => {
                          e.preventDefault();
                          setIsDragOver(true);
                        }}
                        onDragLeave={() => setIsDragOver(false)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setIsDragOver(false);
                          if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                            handleVideoUpload(e.dataTransfer.files[0]);
                          }
                        }}
                        className={`relative border border-dashed rounded-2xl p-6 transition-all duration-300 text-center flex flex-col items-center justify-center min-h-[140px] ${
                          isDragOver 
                            ? 'border-purple-500 bg-purple-500/5 shadow-inner scale-[0.99]' 
                            : scenarioVideoUrl 
                              ? 'border-zinc-850 bg-zinc-950/45' 
                              : 'border-zinc-850 hover:border-zinc-750 bg-zinc-900/40 hover:bg-zinc-900/70'
                        }`}
                      >
                        <input
                          type="file"
                          accept="video/mp4,video/quicktime,video/webm"
                          onChange={(e) => {
                            if (e.target.files && e.target.files.length > 0) {
                              handleVideoUpload(e.target.files[0]);
                            }
                          }}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                          disabled={uploadingVideo}
                        />

                        {uploadingVideo ? (
                          <div className="w-full space-y-3 flex flex-col items-center py-2">
                            <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
                            <div className="space-y-1.5 w-full max-w-[200px] text-center">
                              <p className="text-[11px] font-extrabold text-zinc-300">Uploading Video...</p>
                              <div className="w-full bg-zinc-900 rounded-full h-1.5 overflow-hidden border border-zinc-850">
                                <div 
                                  className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full rounded-full transition-all duration-300"
                                  style={{ width: `${uploadProgress}%` }}
                                />
                              </div>
                              <p className="text-[9px] text-zinc-500 font-bold">{uploadProgress}% Complete</p>
                            </div>
                          </div>
                        ) : scenarioVideoUrl ? (
                          <div className="w-full flex flex-col sm:flex-row items-center gap-4 py-1 text-left relative z-20">
                            <div className="relative w-full sm:w-36 h-20 bg-black rounded-lg overflow-hidden border border-zinc-850 flex items-center justify-center group shrink-0">
                              <video
                                src={scenarioVideoUrl}
                                muted
                                loop
                                autoPlay
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                                <span className="text-[9px] font-extrabold text-white bg-zinc-900/80 px-2 py-1 rounded-md">Preview</span>
                              </div>
                            </div>
                            <div className="flex-1 space-y-2 w-full">
                              <div>
                                <div className="flex items-center gap-1.5 text-teal-400 font-extrabold text-xs">
                                  <CheckCircle className="w-3.5 h-3.5" />
                                  <span>Video Ready</span>
                                </div>
                                <p className="text-[10px] text-zinc-500 font-mono mt-1 select-all break-all overflow-hidden line-clamp-1 max-w-[220px]">
                                  {scenarioVideoUrl.split('/').pop()}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setScenarioVideoUrl('');
                                }}
                                className="px-2.5 py-1 bg-red-950/40 hover:bg-red-900/30 text-red-400 hover:text-red-300 border border-red-900/30 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                              >
                                <Trash2 className="w-3 h-3" /> Remove Video
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2 py-2 flex flex-col items-center pointer-events-none">
                            <div className="p-3 bg-zinc-900/80 border border-zinc-800 rounded-full text-zinc-400">
                              <Video className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-zinc-300">
                                Drag &amp; drop video file or <span className="text-purple-400 underline decoration-dashed">browse</span>
                              </p>
                              <p className="text-[9px] text-zinc-500 mt-0.5">MP4, MOV, WebM or MKV formats (Max 500MB)</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Manual Paste Direct URL */}
                    {(showManualUrl || (!scenarioVideoUrl && !uploadingVideo)) && (
                      <div className={`space-y-1 transition-all duration-300 ${!showManualUrl ? 'hidden sm:block' : ''}`}>
                        {!showManualUrl && (
                          <div className="text-[9px] text-zinc-600 font-bold uppercase tracking-wider">Alternative: Direct MP4 Link</div>
                        )}
                        <input 
                          type="text"
                          placeholder="e.g. https://domain.com/videos/scene.mp4"
                          value={scenarioVideoUrl}
                          onChange={(e) => setScenarioVideoUrl(e.target.value)}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-2 px-3 text-xs focus:outline-none text-white font-mono"
                        />
                      </div>
                    )}

                    {uploadError && (
                      <div className="flex items-center gap-1.5 bg-red-950/20 border border-red-900/30 rounded-lg p-2.5 text-red-400 text-[9px] font-bold">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        <span>{uploadError}</span>
                      </div>
                    )}
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
                      <option value={1}>Set 1</option>
                      <option value={2}>Set 2</option>
                      <option value={3}>Set 3</option>
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
                        <div className="md:col-span-2 space-y-1">
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
                        <div className="space-y-1">
                          <label className="text-[10px] text-zinc-500 font-bold uppercase block">Overlay Timer (sec)</label>
                          <input 
                            type="number"
                            required
                            min="1"
                            placeholder="15"
                            value={q.timer_duration || 15}
                            onChange={(e) => handleQuestionTimerChange(qIdx, Number(e.target.value))}
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
                            <span>Trigger: {q.show_at_seconds || 5}s • Timer: {q.timer_duration || 15}s</span>
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

        {/* Profile Settings Modal */}
        {profileSettingsModalOpen && (
          <div className="fixed inset-0 z-55 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setProfileSettingsModalOpen(false)}
              className="fixed inset-0 bg-black/85 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-zinc-950 border border-zinc-850 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl p-6 my-8 space-y-6 max-h-[85vh] overflow-y-auto z-10"
            >
              <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-teal-500 via-purple-500 to-indigo-500" />
              
              <div className="flex justify-between items-start">
                <div className="text-left">
                  <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                    <Settings className="w-5 h-5 text-teal-400" /> Edit My Profile
                  </h3>
                  <p className="text-xs text-zinc-500 mt-1 font-semibold">Update your profile settings and avatar gradient theme.</p>
                </div>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-4 text-left">
                {/* Email (Read Only) */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-wider block">Email Address (Read-Only)</label>
                  <input
                    type="email"
                    value={profileData?.email || ''}
                    disabled
                    className="w-full bg-zinc-900/30 border border-zinc-900 text-zinc-650 px-4 py-2.5 rounded-xl text-xs outline-none cursor-not-allowed font-semibold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* First Name */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-wider block">First Name</label>
                    <input
                      type="text"
                      required
                      value={editFirstName}
                      onChange={(e) => setEditFirstName(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-850 hover:border-zinc-800 focus:border-teal-500/50 text-white px-4 py-2.5 rounded-xl text-xs outline-none transition-all font-semibold"
                    />
                  </div>

                  {/* Last Name */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-wider block">Last Name</label>
                    <input
                      type="text"
                      required
                      value={editLastName}
                      onChange={(e) => setEditLastName(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-850 hover:border-zinc-800 focus:border-teal-500/50 text-white px-4 py-2.5 rounded-xl text-xs outline-none transition-all font-semibold"
                    />
                  </div>
                </div>

                {/* Display Name */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-wider block">Display Name</label>
                  <input
                    type="text"
                    value={editFullName}
                    onChange={(e) => setEditFullName(e.target.value)}
                    placeholder={`${editFirstName} ${editLastName}`.trim()}
                    className="w-full bg-zinc-900 border border-zinc-850 hover:border-zinc-800 focus:border-teal-500/50 text-white px-4 py-2.5 rounded-xl text-xs outline-none transition-all font-semibold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Gender */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-wider block">Gender</label>
                    <select
                      value={editGender}
                      onChange={(e) => setEditGender(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-850 hover:border-zinc-800 focus:border-teal-500/50 text-white px-4 py-2.5 rounded-xl text-xs outline-none transition-all font-semibold"
                    >
                      <option value="Prefer not to say">Prefer not to say</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Non-binary">Non-binary</option>
                    </select>
                  </div>

                  {/* Date of Birth */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-wider block">Date of Birth</label>
                    <input
                      type="date"
                      value={editDateOfBirth}
                      onChange={(e) => setEditDateOfBirth(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-850 hover:border-zinc-800 focus:border-teal-500/50 text-white px-4 py-2.5 rounded-xl text-xs outline-none transition-all font-semibold"
                    />
                  </div>
                </div>

                {/* Avatar Style Picker */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-wider block">Avatar Gradient Theme</label>
                  
                  {/* Preset list */}
                  <div className="grid grid-cols-6 gap-2">
                    {[
                      { name: 'Purple/Indigo', class: 'bg-gradient-to-tr from-purple-600 to-indigo-600' },
                      { name: 'Teal/Green', class: 'bg-gradient-to-tr from-teal-500 to-emerald-500' },
                      { name: 'Sunset Orange', class: 'bg-gradient-to-tr from-orange-500 to-rose-500' },
                      { name: 'Pink Cyberpunk', class: 'bg-gradient-to-tr from-pink-500 to-purple-600' },
                      { name: 'Ocean Blue', class: 'bg-gradient-to-tr from-blue-600 to-cyan-500' },
                      { name: 'Golden Glow', class: 'bg-gradient-to-tr from-yellow-500 to-amber-600' }
                    ].map((theme) => (
                      <button
                        key={theme.name}
                        type="button"
                        onClick={() => setEditAvatarUrl(theme.class)}
                        title={theme.name}
                        className={`w-full aspect-square rounded-xl transition-all border-2 relative ${theme.class} ${
                          editAvatarUrl === theme.class 
                            ? 'border-white scale-105 shadow-[0_0_12px_rgba(255,255,255,0.3)]' 
                            : 'border-transparent hover:scale-102 hover:border-zinc-700'
                        }`}
                      >
                        {editAvatarUrl === theme.class && (
                          <span className="absolute inset-0 m-auto w-1.5 h-1.5 rounded-full bg-white shadow-md" />
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Or Custom URL */}
                  <div className="space-y-1 pt-1">
                    <label className="text-[9px] text-zinc-500 font-bold uppercase block">Or Custom Image URL</label>
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/photo-..."
                      value={editAvatarUrl.startsWith('bg-') ? '' : editAvatarUrl}
                      onChange={(e) => setEditAvatarUrl(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-850 hover:border-zinc-800 focus:border-teal-500/50 text-white px-4 py-2 rounded-xl text-[11px] outline-none transition-all font-semibold"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-zinc-900">
                  <button
                    type="button"
                    onClick={() => setProfileSettingsModalOpen(false)}
                    className="px-5 py-2 rounded-xl bg-zinc-900 border border-zinc-850 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-all text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-black font-black transition-all text-xs"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* School Picker Modal for Impersonation */}
        {showSchoolPicker && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={() => setShowSchoolPicker(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-lg max-h-[75vh] flex flex-col shadow-2xl"
            >
              {/* Header */}
              <div className="p-5 border-b border-zinc-800 flex items-center justify-between shrink-0">
                <div>
                  <h2 className="text-lg font-black text-white flex items-center gap-2">
                    <Eye className="w-5 h-5 text-teal-400" /> Impersonate School
                  </h2>
                  <p className="text-xs text-zinc-500 mt-0.5">Select a school to view its dashboard and data as a School Admin.</p>
                </div>
                <button
                  onClick={() => setShowSchoolPicker(false)}
                  className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* School List */}
              <div className="p-4 overflow-y-auto flex-1 space-y-2">
                {schoolsList.length === 0 ? (
                  <div className="text-center py-12">
                    <Building className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
                    <p className="text-sm text-zinc-500 font-bold">No enrolled schools found.</p>
                    <p className="text-xs text-zinc-600 mt-1">Enroll a school first from the Enrolled Schools tab.</p>
                  </div>
                ) : (
                  schoolsList.map((sch: any) => (
                    <button
                      key={sch.id}
                      onClick={() => handleImpersonateSchool(sch)}
                      className="w-full text-left p-4 rounded-xl bg-zinc-900/50 border border-zinc-800 hover:border-teal-800/50 hover:bg-teal-950/20 transition-all group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-600 to-emerald-700 flex items-center justify-center text-white font-black text-sm shrink-0 shadow-lg">
                            {sch.name?.[0] || 'S'}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-sm font-extrabold text-white truncate group-hover:text-teal-300 transition-colors">{sch.name}</h4>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] font-bold text-zinc-500 flex items-center gap-1">
                                <MapPin className="w-3 h-3" /> {sch.location}
                              </span>
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">{sch.board}</span>
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${sch.active ? 'bg-emerald-950/50 text-emerald-400' : 'bg-red-950/50 text-red-400'}`}>
                                {sch.active ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <Eye className="w-4 h-4 text-zinc-700 group-hover:text-teal-400 transition-colors shrink-0" />
                      </div>
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
