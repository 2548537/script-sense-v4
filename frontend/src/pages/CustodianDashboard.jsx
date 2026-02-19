import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Users, BookOpen, Plus, UserCheck, LogOut, ChevronRight,
    AlertCircle, CheckCircle, Clock, Shield, X, Save
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
    getSubjects, createSubject, getFacultyList, assignEvaluators
} from '../services/api';

export default function CustodianDashboard() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [subjects, setSubjects] = useState([]);
    const [faculty, setFaculty] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Create subject modal state
    const [showCreate, setShowCreate] = useState(false);
    const [creating, setCreating] = useState(false);
    const [newSubject, setNewSubject] = useState({
        name: '', className: '', academicYear: '',
        firstEvaluatorId: '', secondEvaluatorId: ''
    });

    // Assign evaluators modal state
    const [assignModal, setAssignModal] = useState(null); // subject object
    const [assignForm, setAssignForm] = useState({ firstEvaluatorId: '', secondEvaluatorId: '' });
    const [assigning, setAssigning] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [subjectsData, facultyData] = await Promise.all([
                getSubjects(),
                getFacultyList(user?.id)
            ]);
            setSubjects(subjectsData.subjects || []);
            setFaculty(facultyData.faculty || []);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateSubject = async (e) => {
        e.preventDefault();
        if (!newSubject.name.trim()) return;
        setCreating(true);
        try {
            await createSubject(
                newSubject.name,
                newSubject.className,
                newSubject.academicYear,
                newSubject.firstEvaluatorId || null,
                newSubject.secondEvaluatorId || null,
                user.id
            );
            setShowCreate(false);
            setNewSubject({ name: '', className: '', academicYear: '', firstEvaluatorId: '', secondEvaluatorId: '' });
            await loadData();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to create subject');
        } finally {
            setCreating(false);
        }
    };

    const openAssignModal = (subject) => {
        setAssignModal(subject);
        setAssignForm({
            firstEvaluatorId: subject.first_evaluator_id || '',
            secondEvaluatorId: subject.second_evaluator_id || ''
        });
    };

    const handleAssignEvaluators = async (e) => {
        e.preventDefault();
        setAssigning(true);
        try {
            await assignEvaluators(
                assignModal.id,
                assignForm.firstEvaluatorId || null,
                assignForm.secondEvaluatorId || null
            );
            setAssignModal(null);
            await loadData();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to assign evaluators');
        } finally {
            setAssigning(false);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const getFacultyName = (id) => {
        const f = faculty.find(f => f.id === id);
        return f ? f.name : '—';
    };

    return (
        <div className="min-h-screen bg-gray-950 text-white">
            {/* Header */}
            <header className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-purple-600 rounded-lg flex items-center justify-center">
                        <Shield className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="font-bold text-white">Custodian Dashboard</h1>
                        <p className="text-xs text-gray-400">{user?.name}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('/subjects')}
                        className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                    >
                        Full Subject Manager →
                    </button>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 text-sm text-gray-400 hover:text-red-400 transition-colors"
                    >
                        <LogOut className="w-4 h-4" />
                        Logout
                    </button>
                </div>
            </header>

            <div className="max-w-6xl mx-auto px-6 py-8">
                {error && (
                    <div className="flex items-center gap-2 bg-red-900/40 border border-red-700/50 rounded-lg px-4 py-3 mb-6 text-red-300 text-sm">
                        <AlertCircle className="w-4 h-4" />
                        {error}
                        <button onClick={() => setError('')} className="ml-auto"><X className="w-4 h-4" /></button>
                    </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                        <p className="text-gray-400 text-sm mb-1">Total Subjects</p>
                        <p className="text-3xl font-bold text-white">{subjects.length}</p>
                    </div>
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                        <p className="text-gray-400 text-sm mb-1">Faculty Members</p>
                        <p className="text-3xl font-bold text-white">{faculty.length}</p>
                    </div>
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                        <p className="text-gray-400 text-sm mb-1">Fully Assigned</p>
                        <p className="text-3xl font-bold text-green-400">
                            {subjects.filter(s => s.first_evaluator_id && s.second_evaluator_id).length}
                        </p>
                    </div>
                </div>

                {/* Two-column layout */}
                <div className="grid md:grid-cols-3 gap-6">
                    {/* Faculty List */}
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                        <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
                            <Users className="w-4 h-4 text-blue-400" />
                            Registered Faculty ({faculty.length})
                        </h2>
                        {loading ? (
                            <p className="text-gray-500 text-sm">Loading...</p>
                        ) : faculty.length === 0 ? (
                            <p className="text-gray-500 text-sm">No faculty registered yet.</p>
                        ) : (
                            <ul className="space-y-2">
                                {faculty.map(f => (
                                    <li key={f.id} className="flex items-center gap-3 py-2 border-b border-gray-800 last:border-0">
                                        <div className="w-8 h-8 bg-blue-900/50 rounded-full flex items-center justify-center text-blue-300 text-sm font-medium">
                                            {f.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="text-sm text-white font-medium">{f.name}</p>
                                            <p className="text-xs text-gray-500">{f.email}</p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* Subjects */}
                    <div className="md:col-span-2 bg-gray-900 border border-gray-800 rounded-xl p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="font-semibold text-white flex items-center gap-2">
                                <BookOpen className="w-4 h-4 text-purple-400" />
                                Subjects
                            </h2>
                            <button
                                onClick={() => setShowCreate(true)}
                                className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-500 text-white text-sm px-3 py-1.5 rounded-lg transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                                New Subject
                            </button>
                        </div>

                        {loading ? (
                            <p className="text-gray-500 text-sm">Loading...</p>
                        ) : subjects.length === 0 ? (
                            <p className="text-gray-500 text-sm">No subjects yet. Create one to get started.</p>
                        ) : (
                            <div className="space-y-3">
                                {subjects.map(s => (
                                    <div key={s.id} className="border border-gray-700/50 rounded-lg p-4 hover:border-gray-600 transition-colors">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h3 className="font-medium text-white">{s.name}</h3>
                                                <p className="text-xs text-gray-400 mt-0.5">
                                                    {s.class_name && `${s.class_name} · `}{s.academic_year}
                                                </p>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => openAssignModal(s)}
                                                    className="text-xs bg-blue-900/50 hover:bg-blue-800/50 text-blue-300 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1"
                                                >
                                                    <UserCheck className="w-3 h-3" />
                                                    Assign
                                                </button>
                                                <button
                                                    onClick={() => navigate(`/subjects`)}
                                                    className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1"
                                                >
                                                    <ChevronRight className="w-3 h-3" />
                                                    Manage
                                                </button>
                                            </div>
                                        </div>
                                        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                                            <div className="flex items-center gap-1.5">
                                                {s.first_evaluator_id ? (
                                                    <CheckCircle className="w-3 h-3 text-green-400" />
                                                ) : (
                                                    <Clock className="w-3 h-3 text-yellow-400" />
                                                )}
                                                <span className="text-gray-400">1st Eval: </span>
                                                <span className="text-gray-200">{s.first_evaluator_name || 'Unassigned'}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                {s.second_evaluator_id ? (
                                                    <CheckCircle className="w-3 h-3 text-green-400" />
                                                ) : (
                                                    <Clock className="w-3 h-3 text-yellow-400" />
                                                )}
                                                <span className="text-gray-400">2nd Eval: </span>
                                                <span className="text-gray-200">{s.second_evaluator_name || 'Unassigned'}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Create Subject Modal */}
            {showCreate && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="font-semibold text-white text-lg">Create New Subject</h3>
                            <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleCreateSubject} className="space-y-4">
                            <div>
                                <label className="block text-sm text-gray-300 mb-1">Subject Name *</label>
                                <input
                                    type="text"
                                    value={newSubject.name}
                                    onChange={e => setNewSubject({ ...newSubject, name: e.target.value })}
                                    placeholder="e.g., Physics 101"
                                    className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm text-gray-300 mb-1">Class</label>
                                    <input
                                        type="text"
                                        value={newSubject.className}
                                        onChange={e => setNewSubject({ ...newSubject, className: e.target.value })}
                                        placeholder="e.g., Class 12A"
                                        className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-300 mb-1">Academic Year</label>
                                    <input
                                        type="text"
                                        value={newSubject.academicYear}
                                        onChange={e => setNewSubject({ ...newSubject, academicYear: e.target.value })}
                                        placeholder="2025-2026"
                                        className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm text-gray-300 mb-1">First Evaluator (Teacher)</label>
                                <select
                                    value={newSubject.firstEvaluatorId}
                                    onChange={e => setNewSubject({ ...newSubject, firstEvaluatorId: e.target.value })}
                                    className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                                >
                                    <option value="">— Select faculty —</option>
                                    {faculty.map(f => (
                                        <option key={f.id} value={f.id}>{f.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm text-gray-300 mb-1">Second Evaluator (External)</label>
                                <select
                                    value={newSubject.secondEvaluatorId}
                                    onChange={e => setNewSubject({ ...newSubject, secondEvaluatorId: e.target.value })}
                                    className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                                >
                                    <option value="">— Select faculty —</option>
                                    {faculty.map(f => (
                                        <option key={f.id} value={f.id}>{f.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowCreate(false)}
                                    className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 py-2.5 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={creating}
                                    className="flex-1 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-800 text-white py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
                                >
                                    {creating ? (
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <><Save className="w-4 h-4" /> Create</>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Assign Evaluators Modal */}
            {assignModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="font-semibold text-white text-lg">Assign Evaluators</h3>
                            <button onClick={() => setAssignModal(null)} className="text-gray-400 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <p className="text-sm text-gray-400 mb-4">Subject: <span className="text-white">{assignModal.name}</span></p>
                        <form onSubmit={handleAssignEvaluators} className="space-y-4">
                            <div>
                                <label className="block text-sm text-gray-300 mb-1">First Evaluator (Teacher)</label>
                                <select
                                    value={assignForm.firstEvaluatorId}
                                    onChange={e => setAssignForm({ ...assignForm, firstEvaluatorId: e.target.value })}
                                    className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                                >
                                    <option value="">— Unassigned —</option>
                                    {faculty.map(f => (
                                        <option key={f.id} value={f.id}>{f.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm text-gray-300 mb-1">Second Evaluator (External)</label>
                                <select
                                    value={assignForm.secondEvaluatorId}
                                    onChange={e => setAssignForm({ ...assignForm, secondEvaluatorId: e.target.value })}
                                    className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                                >
                                    <option value="">— Unassigned —</option>
                                    {faculty.map(f => (
                                        <option key={f.id} value={f.id}>{f.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setAssignModal(null)}
                                    className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 py-2.5 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={assigning}
                                    className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
                                >
                                    {assigning ? (
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <><UserCheck className="w-4 h-4" /> Save</>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
