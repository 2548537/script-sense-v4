import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    BookOpen, FileText, CheckCircle, LogOut,
    AlertCircle, X, Send, Eye, EyeOff
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getExternalSubjects, getExternalScripts, submitExternalMarks } from '../services/api';

const STATUS_BADGE = {
    FIRST_DONE: { label: 'Ready for 2nd Eval', color: 'bg-yellow-900/50 text-yellow-300 border-yellow-700/50' },
    SECOND_DONE: { label: 'Completed', color: 'bg-green-900/50 text-green-300 border-green-700/50' },
};

export default function ExternalDashboard() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [subjects, setSubjects] = useState([]);
    const [selectedSubject, setSelectedSubject] = useState(null);
    const [scripts, setScripts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [scriptsLoading, setScriptsLoading] = useState(false);
    const [error, setError] = useState('');

    // Marks submission modal
    const [markModal, setMarkModal] = useState(null);
    const [markValue, setMarkValue] = useState('');
    const [markRemarks, setMarkRemarks] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState('');

    useEffect(() => {
        loadSubjects();
    }, []);

    const loadSubjects = async () => {
        setLoading(true);
        try {
            const data = await getExternalSubjects(user?.id);
            setSubjects(data.subjects || []);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to load subjects');
        } finally {
            setLoading(false);
        }
    };

    const selectSubject = async (subject) => {
        setSelectedSubject(subject);
        setScriptsLoading(true);
        setScripts([]);
        try {
            const data = await getExternalScripts(subject.id, user?.id);
            setScripts(data.scripts || []);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to load scripts');
        } finally {
            setScriptsLoading(false);
        }
    };

    const openMarkModal = (script) => {
        setMarkModal(script);
        setMarkValue(script.external_marks !== null && script.external_marks !== undefined ? String(script.external_marks) : '');
        setMarkRemarks('');
        setSubmitSuccess('');
    };

    const handleSubmitMarks = async (e) => {
        e.preventDefault();
        if (!markValue || isNaN(parseFloat(markValue))) {
            setError('Please enter a valid mark.');
            return;
        }
        setSubmitting(true);
        try {
            const result = await submitExternalMarks(markModal.id, parseFloat(markValue), markRemarks, user?.id);
            setSubmitSuccess(`Marks saved! Final: ${result.script.final_marks}`);
            setScripts(prev => prev.map(s =>
                s.id === markModal.id
                    ? { ...s, external_marks: parseFloat(markValue), final_marks: result.script.final_marks, status: result.script.status }
                    : s
            ));
            setTimeout(() => {
                setMarkModal(null);
                setSubmitSuccess('');
            }, 1800);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to submit marks');
        } finally {
            setSubmitting(false);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const badge = (status) => {
        const b = STATUS_BADGE[status] || { label: status, color: 'bg-gray-800 text-gray-300 border-gray-700' };
        return (
            <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${b.color}`}>
                {b.label}
            </span>
        );
    };

    return (
        <div className="min-h-screen bg-gray-950 text-white">
            {/* Header */}
            <header className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-purple-600 rounded-lg flex items-center justify-center">
                        <EyeOff className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="font-bold text-white">External Evaluator Dashboard</h1>
                        <p className="text-xs text-gray-400">{user?.name} · Second Evaluator · Independent Marking</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('/teacher')}
                        className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                    >
                        Teacher View →
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

            {/* Blind evaluation notice */}
            <div className="bg-purple-950/40 border-b border-purple-800/30 px-6 py-2 flex items-center gap-2 text-purple-300 text-xs">
                <EyeOff className="w-3.5 h-3.5" />
                Blind evaluation mode — first evaluator marks are not visible to ensure independent assessment.
            </div>

            {error && (
                <div className="mx-6 mt-4 flex items-center gap-2 bg-red-900/40 border border-red-700/50 rounded-lg px-4 py-3 text-red-300 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                    <button onClick={() => setError('')} className="ml-auto"><X className="w-4 h-4" /></button>
                </div>
            )}

            <div className="max-w-6xl mx-auto px-6 py-8 flex gap-6">
                {/* Subject List */}
                <div className="w-72 flex-shrink-0">
                    <h2 className="font-semibold text-gray-300 text-sm uppercase tracking-wider mb-3">
                        Assigned Subjects
                    </h2>
                    {loading ? (
                        <p className="text-gray-500 text-sm">Loading...</p>
                    ) : subjects.length === 0 ? (
                        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 text-center">
                            <BookOpen className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                            <p className="text-gray-500 text-sm">No subjects assigned yet.</p>
                            <p className="text-gray-600 text-xs mt-1">Subjects appear here once first evaluation is complete.</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {subjects.map(s => (
                                <button
                                    key={s.id}
                                    onClick={() => selectSubject(s)}
                                    className={`w-full text-left bg-gray-900 border rounded-xl p-4 transition-all ${selectedSubject?.id === s.id
                                        ? 'border-purple-500 bg-purple-950/30'
                                        : 'border-gray-800 hover:border-gray-600'
                                        }`}
                                >
                                    <p className="font-medium text-white text-sm">{s.name}</p>
                                    <p className="text-xs text-gray-400 mt-0.5">{s.academic_year}</p>
                                    <div className="flex gap-3 mt-2 text-xs text-gray-400">
                                        <span>⏳ {s.stats?.ready_for_evaluation || 0} pending</span>
                                        <span>✅ {s.stats?.completed || 0} done</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Scripts Panel */}
                <div className="flex-1">
                    {!selectedSubject ? (
                        <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
                            <FileText className="w-12 h-12 text-gray-700 mx-auto mb-3" />
                            <p className="text-gray-500">Select a subject to view scripts</p>
                            <p className="text-gray-600 text-xs mt-1">Only scripts with completed first evaluation are shown</p>
                        </div>
                    ) : (
                        <div className="bg-gray-900 border border-gray-800 rounded-xl">
                            <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between">
                                <div>
                                    <h3 className="font-semibold text-white">{selectedSubject.name}</h3>
                                    <p className="text-xs text-gray-400">{selectedSubject.academic_year} · Scripts ready for 2nd evaluation</p>
                                </div>
                                <span className="text-sm text-gray-400">{scripts.length} scripts</span>
                            </div>

                            {scriptsLoading ? (
                                <div className="p-8 text-center text-gray-500">Loading scripts...</div>
                            ) : scripts.length === 0 ? (
                                <div className="p-8 text-center text-gray-500">
                                    No scripts ready for second evaluation yet.
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-800">
                                    {scripts.map(script => (
                                        <div key={script.id} className="px-5 py-4 flex items-center justify-between hover:bg-gray-800/30 transition-colors">
                                            <div>
                                                <p className="font-medium text-white text-sm">{script.student_name}</p>
                                                <div className="flex items-center gap-3 mt-1">
                                                    {script.roll_number && (
                                                        <span className="text-xs text-gray-400">Roll: {script.roll_number}</span>
                                                    )}
                                                    {badge(script.status)}
                                                    {/* teacher_marks intentionally NOT shown */}
                                                    {script.external_marks !== null && script.external_marks !== undefined && (
                                                        <span className="text-xs text-purple-300 font-medium">
                                                            My marks: {script.external_marks}
                                                        </span>
                                                    )}
                                                    {script.final_marks !== null && script.final_marks !== undefined && (
                                                        <span className="text-xs text-green-300 font-medium">
                                                            Final: {script.final_marks}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => openMarkModal(script)}
                                                className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs px-3 py-1.5 rounded-lg transition-colors"
                                            >
                                                <Send className="w-3 h-3" />
                                                {script.external_marks !== null ? 'Update Marks' : 'Enter Marks'}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Marks Modal */}
            {markModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-white">Submit External Marks</h3>
                            <button onClick={() => setMarkModal(null)} className="text-gray-400 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <p className="text-sm text-gray-400 mb-1">
                            Student: <span className="text-white">{markModal.student_name}</span>
                        </p>
                        <p className="text-xs text-purple-400 mb-4 flex items-center gap-1">
                            <EyeOff className="w-3 h-3" />
                            First evaluator marks are hidden for independent assessment
                        </p>

                        {submitSuccess ? (
                            <div className="flex items-center gap-2 text-green-300 py-4 justify-center">
                                <CheckCircle className="w-5 h-5" />
                                {submitSuccess}
                            </div>
                        ) : (
                            <form onSubmit={handleSubmitMarks} className="space-y-4">
                                <div>
                                    <label className="block text-sm text-gray-300 mb-1">Marks *</label>
                                    <input
                                        type="number"
                                        step="0.5"
                                        min="0"
                                        value={markValue}
                                        onChange={e => setMarkValue(e.target.value)}
                                        placeholder="e.g., 80"
                                        className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-300 mb-1">Remarks (optional)</label>
                                    <textarea
                                        value={markRemarks}
                                        onChange={e => setMarkRemarks(e.target.value)}
                                        placeholder="Any comments..."
                                        rows={2}
                                        className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 resize-none"
                                    />
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setMarkModal(null)}
                                        className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 py-2.5 rounded-lg transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="flex-1 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-800 text-white py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
                                    >
                                        {submitting ? (
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <><Send className="w-4 h-4" /> Submit</>
                                        )}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
