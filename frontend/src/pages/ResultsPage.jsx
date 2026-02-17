import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, GraduationCap, Download, Users, ChevronDown, ChevronUp, BarChart3, Loader } from 'lucide-react';
import { getSubjects, getSubjectResults, exportSubjectMarks } from '../services/api';

const ResultsPage = () => {
    const navigate = useNavigate();
    const [subjects, setSubjects] = useState([]);
    const [expandedSubject, setExpandedSubject] = useState(null);
    const [results, setResults] = useState({});
    const [loading, setLoading] = useState(true);
    const [loadingResults, setLoadingResults] = useState(null);

    useEffect(() => {
        loadSubjects();
    }, []);

    const loadSubjects = async () => {
        try {
            const data = await getSubjects();
            setSubjects(data.subjects || []);
        } catch (err) {
            console.error('Failed to load subjects:', err);
        } finally {
            setLoading(false);
        }
    };

    const toggleSubject = async (subjectId) => {
        if (expandedSubject === subjectId) {
            setExpandedSubject(null);
            return;
        }
        setExpandedSubject(subjectId);

        if (!results[subjectId]) {
            setLoadingResults(subjectId);
            try {
                const data = await getSubjectResults(subjectId);
                if (data.success) {
                    setResults(prev => ({ ...prev, [subjectId]: data }));
                }
            } catch (err) {
                console.error('Failed to load results:', err);
            } finally {
                setLoadingResults(null);
            }
        }
    };

    const handleExport = async (e, subjectId) => {
        e.stopPropagation();
        try {
            await exportSubjectMarks(subjectId);
        } catch (err) {
            console.error('Export failed:', err);
            alert('Export failed');
        }
    };

    const getGradeColor = (pct) => {
        if (pct >= 80) return 'text-green-400';
        if (pct >= 60) return 'text-blue-400';
        if (pct >= 40) return 'text-yellow-400';
        return 'text-red-400';
    };

    const getStatusBadge = (status) => {
        if (status === 'evaluated') return <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">Evaluated</span>;
        return <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">Pending</span>;
    };

    return (
        <div className="min-h-screen p-4 md:p-8">
            {/* Header */}
            <header className="mb-8">
                <div className="flex items-center gap-4 mb-2">
                    <button onClick={() => navigate('/')} className="btn btn-ghost p-3">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl">
                        <BarChart3 className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold gradient-text">Results Library</h1>
                        <p className="text-gray-400 text-sm">View scores and track student progress by subject</p>
                    </div>
                </div>
            </header>

            {/* Subjects List */}
            <main className="max-w-6xl space-y-4">
                {loading && (
                    <div className="flex items-center justify-center p-12 text-gray-400">
                        <Loader className="w-6 h-6 animate-spin mr-2" />
                        Loading subjects...
                    </div>
                )}

                {!loading && subjects.length === 0 && (
                    <div className="text-center p-12 glass-strong rounded-2xl">
                        <GraduationCap className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                        <p className="text-gray-400">No subjects found. Create subjects from the Subject Folder Dashboard.</p>
                    </div>
                )}

                {subjects.map(subject => {
                    const isExpanded = expandedSubject === subject.id;
                    const subjectResults = results[subject.id];
                    const isLoading = loadingResults === subject.id;

                    return (
                        <div key={subject.id} className="glass-strong rounded-2xl overflow-hidden border border-white/10 transition-all">
                            {/* Subject Header - Clickable */}
                            <div
                                onClick={() => toggleSubject(subject.id)}
                                className="p-5 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="p-2.5 bg-primary-500/10 rounded-xl">
                                        <GraduationCap className="w-5 h-5 text-primary-400" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg">{subject.name}</h3>
                                        <p className="text-xs text-gray-400">
                                            {subject.class_name && <span>{subject.class_name}</span>}
                                            {subject.academic_year && <span className="ml-2">• {subject.academic_year}</span>}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={(e) => handleExport(e, subject.id)}
                                        className="btn btn-ghost px-3 py-1.5 text-xs flex items-center gap-1 text-accent-400 hover:text-accent-300"
                                        title="Export to Excel"
                                    >
                                        <Download className="w-3.5 h-3.5" />
                                        Export
                                    </button>
                                    {isExpanded
                                        ? <ChevronUp className="w-5 h-5 text-gray-400" />
                                        : <ChevronDown className="w-5 h-5 text-gray-400" />
                                    }
                                </div>
                            </div>

                            {/* Expanded Results Table */}
                            {isExpanded && (
                                <div className="border-t border-white/10">
                                    {isLoading && (
                                        <div className="flex items-center justify-center p-8 text-gray-400">
                                            <Loader className="w-5 h-5 animate-spin mr-2" />
                                            Loading results...
                                        </div>
                                    )}

                                    {subjectResults && subjectResults.students.length === 0 && (
                                        <div className="p-8 text-center text-gray-500">
                                            <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                                            <p className="text-sm">No students found for this subject.</p>
                                        </div>
                                    )}

                                    {subjectResults && subjectResults.students.length > 0 && (
                                        <>
                                            {/* Stats Bar */}
                                            <div className="px-5 py-3 bg-white/[0.03] flex items-center gap-6 text-xs text-gray-400 border-b border-white/5">
                                                <span className="flex items-center gap-1">
                                                    <Users className="w-3.5 h-3.5" />
                                                    {subjectResults.stats.total_students} students
                                                </span>
                                                <span className="text-green-400">
                                                    {subjectResults.stats.evaluated} evaluated
                                                </span>
                                                <span className="text-yellow-400">
                                                    {subjectResults.stats.pending} pending
                                                </span>
                                            </div>

                                            {/* Table View (Desktop) */}
                                            <div className="hidden md:block overflow-x-auto custom-scrollbar">
                                                <table className="w-full text-sm">
                                                    <thead>
                                                        <tr className="bg-white/5 text-gray-400 text-xs uppercase tracking-wider">
                                                            <th className="text-left px-4 py-3 sticky left-0 bg-[#0f1729] z-10">Roll No</th>
                                                            <th className="text-left px-4 py-3">Name</th>
                                                            {subjectResults.questions.map(q => (
                                                                <th key={q} className="text-center px-3 py-3 whitespace-nowrap font-mono">Q{q}</th>
                                                            ))}
                                                            <th className="text-center px-4 py-3">Total</th>
                                                            <th className="text-center px-4 py-3">%</th>
                                                            <th className="text-center px-4 py-3">Status</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {subjectResults.students.map((student, idx) => (
                                                            <tr
                                                                key={student.id}
                                                                className={`border-t border-white/5 hover:bg-white/5 transition-colors ${idx % 2 === 0 ? '' : 'bg-white/[0.02]'}`}
                                                            >
                                                                <td className="px-4 py-3 font-mono text-xs sticky left-0 bg-[#0f1729] z-10">{student.roll_number}</td>
                                                                <td className="px-4 py-3 whitespace-nowrap">{student.name}</td>
                                                                {subjectResults.questions.map(q => {
                                                                    const mark = student.marks[q];
                                                                    return (
                                                                        <td key={q} className="text-center px-3 py-3 font-mono text-xs">
                                                                            {mark ? (
                                                                                <span className="text-gray-300" title={`${mark.awarded}/${mark.max}`}>
                                                                                    {mark.awarded}
                                                                                </span>
                                                                            ) : (
                                                                                <span className="text-gray-600">-</span>
                                                                            )}
                                                                        </td>
                                                                    );
                                                                })}
                                                                <td className="text-center px-4 py-3 font-bold">
                                                                    {student.total_awarded}/{student.total_max}
                                                                </td>
                                                                <td className={`text-center px-4 py-3 font-bold ${getGradeColor(student.percentage)}`}>
                                                                    {student.percentage}%
                                                                </td>
                                                                <td className="text-center px-4 py-3">
                                                                    {getStatusBadge(student.status)}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>

                                            {/* Card View (Mobile) */}
                                            <div className="md:hidden divide-y divide-white/5">
                                                {subjectResults.students.map((student) => (
                                                    <div key={student.id} className="p-4 space-y-3">
                                                        <div className="flex justify-between items-start">
                                                            <div>
                                                                <p className="font-bold text-gray-100">{student.name}</p>
                                                                <p className="text-[10px] font-mono text-gray-500 uppercase">Roll: {student.roll_number}</p>
                                                            </div>
                                                            <div className="text-right">
                                                                <div className={`text-lg font-bold ${getGradeColor(student.percentage)}`}>
                                                                    {student.percentage}%
                                                                </div>
                                                                <div className="text-[10px] text-gray-500 font-bold">
                                                                    {student.total_awarded} / {student.total_max}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Marks Grid */}
                                                        <div className="grid grid-cols-5 gap-2">
                                                            {subjectResults.questions.map(q => {
                                                                const mark = student.marks[q];
                                                                return (
                                                                    <div key={q} className="bg-white/5 rounded p-2 text-center">
                                                                        <p className="text-[8px] text-gray-500 uppercase font-bold mb-1">Q{q}</p>
                                                                        <p className="text-xs font-mono text-gray-300">
                                                                            {mark ? mark.awarded : '-'}
                                                                        </p>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>

                                                        <div className="flex justify-end">
                                                            {getStatusBadge(student.status)}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </main>
        </div>
    );
};

export default ResultsPage;
