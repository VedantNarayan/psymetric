'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { 
  BarChart3, Settings, Video, Upload, Shield, 
  Trash2, Plus, Sparkles, Sliders, Users, 
  Activity, Clock, ShieldAlert, GraduationCap, Building, Loader2, Pencil,
  Search, Filter, CheckCircle, AlertTriangle, FileText, Download, UserCheck, Key, Eye, HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Seed initial mock student profiles for the explorer
const INITIAL_STUDENTS = [
  { id: 's1', name: 'Vedant Narayan', class: '10', section: 'A', stream: '', trait: 'The Thinker', score: 88, status: 'Completed', codesRemaining: 0, tags: ['High Creative', 'Needs Math Support'] },
  { id: 's2', name: 'Priya Sharma', class: '12', section: 'Science-A', stream: 'Science', trait: 'The Creator', score: 94, status: 'Completed', codesRemaining: 0, tags: ['Leadership Potential'] },
  { id: 's3', name: 'Rahul Gupta', class: '11', section: 'Commerce-B', stream: 'Commerce', trait: 'The Leader', score: 85, status: 'In Progress', codesRemaining: 1, tags: ['High Creative'] },
  { id: 's4', name: 'Anjali Verma', class: '9', section: 'C', stream: '', trait: 'The Organizer', score: 79, status: 'Completed', codesRemaining: 0, tags: ['Needs Support'] },
  { id: 's5', name: 'Amit Patel', class: '10', section: 'B', stream: '', trait: 'The Connector', score: 82, status: 'Not Started', codesRemaining: 2, tags: [] },
  { id: 's6', name: 'Siddharth Rao', class: '12', section: 'Humanities-A', stream: 'Humanities', trait: 'The Builder', score: 90, status: 'Completed', codesRemaining: 0, tags: ['High Creative'] }
];

export default function AdminConsole() {
  const router = useRouter();
  
  // Auth & View Roles
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentRole, setCurrentRole] = useState<'super_admin' | 'school_admin'>('school_admin');
  
  // Tab Navigation
  const [activeTab, setActiveTab] = useState<'mission_control' | 'explorer' | 'roster_manager' | 'scenarios' | 'school_settings'>('mission_control');

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

  // Question editing scenario list
  const [scenarios, setScenarios] = useState<any[]>([]);

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
        {activeTab === 'scenarios' && (
          <div className="space-y-8">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-white mb-1">Scenario Matrix Creator</h1>
              <p className="text-zinc-400 text-xs">Manage MP4 loop assets and map dimension intensities</p>
            </div>

            <div className="p-6 rounded-2xl bg-purple-950/10 border border-purple-500/20 text-xs text-purple-300">
              <span className="font-bold block mb-1">Super Admin Notice</span>
              You have access to write, edit, and update the cinematic backdrops. Options map weights (0.0 to 1.0) directly into the dimension solver matrix.
            </div>

            {/* Basic fallback Scenario matrix view */}
            <div className="bg-black/40 border border-zinc-900 rounded-3xl p-6 text-center py-12 text-zinc-500 text-xs">
              <Video className="w-10 h-10 mx-auto text-zinc-700 mb-2" />
              <p>Sandbox Super Admin Scenario Database is active in memory.</p>
              <button 
                onClick={() => alert('Create scenario drawer opened.')}
                className="mt-4 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold"
              >
                + Create New Scenario
              </button>
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
    </div>
  );
}
