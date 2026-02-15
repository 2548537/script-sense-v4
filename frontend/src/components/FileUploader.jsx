import React, { useState, useCallback } from 'react';
import { Upload, X, FileText, Globe, Zap } from 'lucide-react';
import { uploadQuestionPaper, uploadAnswerSheet, uploadRubric, DIRECT_RENDER_URL } from '../services/api';
import axios from 'axios';

const FileUploader = ({ type, onUploadSuccess, questionPaperId }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [file, setFile] = useState(null);
    const [title, setTitle] = useState('');
    const [studentName, setStudentName] = useState('');
    const [totalQuestions, setTotalQuestions] = useState(1);
    const [uploading, setUploading] = useState(false);
    const [useDirectMode, setUseDirectMode] = useState(false);

    const handleDrag = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setIsDragging(true);
        } else if (e.type === 'dragleave') {
            setIsDragging(false);
        }
    }, []);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const files = e.dataTransfer.files;
        if (files && files[0] && (files[0].type === 'application/pdf' || files[0].name.toLowerCase().endsWith('.pdf'))) {
            setFile(files[0]);
        }
    }, []);

    const handleFileSelect = (e) => {
        const selectedFile = e.target.files[0];
        if (!selectedFile) return;

        const isPdf = selectedFile.type === 'application/pdf' ||
            selectedFile.name.toLowerCase().endsWith('.pdf');

        if (isPdf) {
            setFile(selectedFile);
        } else {
            alert('Please select a valid PDF file.');
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setUploading(true);
        try {
            let responseData;
            const onProgress = (progressEvent) => {
                const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                console.log(`📤 Upload Progress: ${percentCompleted}%`);
            };

            // Use direct Axios call if in Direct Mode to bypass Vercel limits
            if (useDirectMode && DIRECT_RENDER_URL) {
                const formData = new FormData();
                formData.append('file', file);

                let endpoint = '';
                if (type === 'question') {
                    formData.append('title', title);
                    formData.append('total_questions', totalQuestions);
                    endpoint = 'upload/question-paper';
                } else if (type === 'answer') {
                    formData.append('student_name', studentName);
                    if (questionPaperId) formData.append('question_paper_id', questionPaperId);
                    endpoint = 'upload/answer-sheet';
                } else if (type === 'rubric') {
                    formData.append('title', title);
                    endpoint = 'upload/rubric';
                }

                const response = await axios.post(`${DIRECT_RENDER_URL}${endpoint}`, formData, {
                    onUploadProgress: onProgress,
                    timeout: 120000
                });
                responseData = response.data;
            } else {
                // Use the standard service (Vercel Proxy)
                if (type === 'question') {
                    responseData = await uploadQuestionPaper(file, title, totalQuestions, onProgress);
                } else if (type === 'answer') {
                    responseData = await uploadAnswerSheet(file, studentName, questionPaperId, onProgress);
                } else if (type === 'rubric') {
                    responseData = await uploadRubric(file, title, onProgress);
                }
            }

            setFile(null);
            setTitle('');
            setStudentName('');
            setTotalQuestions(1);
            alert('File uploaded successfully!');
            if (onUploadSuccess) onUploadSuccess(responseData);
        } catch (error) {
            console.error('Upload failed:', error);
            const status = error.response?.status;
            let errorMessage = error.response?.data?.error || error.message || 'Unknown error';

            if (error.message === 'Network Error') {
                const isProduction = !useDirectMode && DIRECT_RENDER_URL;
                errorMessage = isProduction
                    ? 'Network Error: Vercel might be blocking this large upload. Try switching to "Direct Mode" below.'
                    : 'Network Error: The backend is unreachable. Check your connection.';
            }

            const targetUrl = error.config ? `\nTarget: ${error.config.baseURL || ''}${error.config.url}` : '';
            alert(`Upload failed: ${errorMessage}${targetUrl}\nStatus: ${status || 'N/A'}`);
        } finally {
            setUploading(false);
        }
    };

    const removeFile = () => {
        setFile(null);
    };

    return (
        <div className="glass p-6 rounded-xl">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold gradient-text">
                    {type === 'question' ? 'Question Paper' : type === 'answer' ? 'Answer Sheet' : 'Evaluation Rubric'}
                </h3>

                {DIRECT_RENDER_URL && (
                    <button
                        onClick={() => setUseDirectMode(!useDirectMode)}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all ${useDirectMode
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                : 'bg-primary-500/10 text-primary-400 border border-primary-500/20'
                            }`}
                        title={useDirectMode ? "Talking directly to Render (Bypassing Vercel)" : "Talking to Vercel Proxy"}
                    >
                        {useDirectMode ? <Zap size={14} /> : <Globe size={14} />}
                        {useDirectMode ? 'Direct Mode ON' : 'Proxy Mode'}
                    </button>
                )}
            </div>

            <div
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${isDragging ? 'drag-active border-primary-500 bg-primary-500/10' : 'border-white border-opacity-20'
                    }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
            >
                <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileSelect}
                    className="hidden"
                    id={`file-input-${type}`}
                />

                {!file ? (
                    <label htmlFor={`file-input-${type}`} className="cursor-pointer">
                        <Upload className="w-12 h-12 mx-auto mb-4 text-primary-400" />
                        <p className="text-lg mb-2">Drop PDF here or click to browse</p>
                        <p className="text-sm text-gray-400">Only PDF files are accepted</p>
                    </label>
                ) : (
                    <div className="flex items-center justify-center gap-4">
                        <FileText className="w-8 h-8 text-primary-400" />
                        <span className="flex-1 text-left line-clamp-1">{file.name}</span>
                        <button
                            onClick={removeFile}
                            className="p-2 hover:bg-red-500 hover:bg-opacity-20 rounded-lg"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                )}
            </div>

            {file && (
                <div className="mt-4 space-y-3">
                    {type === 'question' && (
                        <>
                            <input
                                type="text"
                                placeholder="Question Paper Title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full px-4 py-2 bg-white bg-opacity-10 rounded-lg border border-white border-opacity-20 focus:border-primary-500 outline-none"
                            />
                            <input
                                type="number"
                                placeholder="Total Questions"
                                value={totalQuestions}
                                onChange={(e) => setTotalQuestions(parseInt(e.target.value, 10) || 1)}
                                className="w-full px-4 py-2 bg-white bg-opacity-10 rounded-lg border border-white border-opacity-20 focus:border-primary-500 outline-none"
                            />
                        </>
                    )}

                    {type === 'answer' && (
                        <input
                            type="text"
                            placeholder="Student Name"
                            value={studentName}
                            onChange={(e) => setStudentName(e.target.value)}
                            className="w-full px-4 py-2 bg-white bg-opacity-10 rounded-lg border border-white border-opacity-20 focus:border-primary-500 outline-none"
                        />
                    )}

                    {type === 'rubric' && (
                        <input
                            type="text"
                            placeholder="Rubric Title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-4 py-2 bg-white bg-opacity-10 rounded-lg border border-white border-opacity-20 focus:border-primary-500 outline-none"
                        />
                    )}

                    <button
                        onClick={handleUpload}
                        disabled={uploading}
                        className="btn btn-primary w-full"
                    >
                        {uploading ? 'Uploading...' : 'Upload'}
                    </button>

                    {useDirectMode && (
                        <p className="text-[10px] text-amber-400 text-center animate-pulse">
                            ⚠️ Direct Mode bypasses Vercel limits. Recommended for large files.
                        </p>
                    )}
                </div>
            )}
        </div>
    );
};

export default FileUploader;
