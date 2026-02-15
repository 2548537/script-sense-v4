import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GraduationCap, RefreshCw } from 'lucide-react';
import FileUploader from '../components/FileUploader';
import FileGrid from '../components/FileGrid';
import { uploadQuestionPaper, uploadAnswerSheet, uploadRubric, getFiles } from '../services/api';

const HomePage = () => {
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    const loadFiles = async () => {
        try {
            setLoading(true);
            const data = await getFiles(filter);
            setFiles(data.files || []);
        } catch (error) {
            console.error('Failed to load files:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadFiles();
    }, [filter]);

    const handleUploadQuestionPaper = async (file, metadata, onProgress) => {
        await uploadQuestionPaper(file, metadata.title, metadata.totalQuestions, onProgress);
        loadFiles();
    };

    const handleUploadAnswerSheet = async (file, metadata, onProgress) => {
        await uploadAnswerSheet(file, metadata.studentName, null, onProgress);
        loadFiles();
    };

    const handleUploadRubric = async (file, metadata, onProgress) => {
        await uploadRubric(file, metadata.title, onProgress);
        loadFiles();
    };

    return (
        <div className="min-h-screen p-4 md:p-8">
            {/* Header */}
            <header className="mb-8 md:mb-12">
                <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
                    <div className="p-4 bg-gradient-to-br from-primary-500 to-accent-500 rounded-2xl pulse-glow w-fit">
                        <GraduationCap className="w-8 h-8 md:w-10 md:h-10 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold gradient-text flex items-center gap-2">
                            ScriptSense
                            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary-500/20 text-primary-400 border border-primary-500/30">v2.6</span>
                        </h1>
                        <p className="text-gray-400 text-base md:text-lg">AI-Powered Handwriting Recognition & Grading</p>
                    </div>
                </div>

                <Link to="/results" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white bg-opacity-10 hover:bg-opacity-20 transition-all border border-white border-opacity-10 text-sm md:text-base">
                    <span className="font-semibold">View Results Library</span>
                </Link>
            </header>

            {/* Upload Section */}
            <section className="mb-12">
                <h2 className="text-2xl font-semibold mb-6 flex items-center gap-3">
                    <span className="gradient-text">Upload Documents</span>
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FileUploader
                        type="question"
                        title="Question Papers"
                        onUpload={handleUploadQuestionPaper}
                    />
                    <FileUploader
                        type="answer"
                        title="Answer Sheets"
                        onUpload={handleUploadAnswerSheet}
                    />
                    <FileUploader
                        type="rubric"
                        title="Evaluation Rubrics"
                        onUpload={handleUploadRubric}
                    />
                </div>
            </section>

            {/* Files Section */}
            <section>
                <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 gap-4">
                    <h2 className="text-2xl font-semibold gradient-text">Uploaded Files</h2>

                    <div className="flex items-center gap-3 overflow-x-auto lg:overflow-visible pb-2 md:pb-0 no-scrollbar">
                        {/* Filter - Segmented Control Style */}
                        <div className="flex bg-white/5 p-1 rounded-xl backdrop-blur-md border border-white/10 shrink-0">
                            {['all', 'question', 'answer', 'rubric'].map(f => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={`px-4 md:px-6 py-2 rounded-lg text-sm md:text-base font-semibold transition-all duration-300 ${filter === f
                                        ? 'bg-primary-500 text-white shadow-lg'
                                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                                        }`}
                                >
                                    {f.charAt(0).toUpperCase() + f.slice(1)}
                                </button>
                            ))}
                        </div>

                        {/* Refresh */}
                        <button
                            onClick={loadFiles}
                            className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all shadow-lg shrink-0"
                            disabled={loading}
                        >
                            <RefreshCw className={`w-5 h-5 text-gray-400 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="spinner"></div>
                    </div>
                ) : (
                    <FileGrid files={files} onRefresh={loadFiles} />
                )}
            </section>
        </div>
    );
};

export default HomePage;
