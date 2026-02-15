import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Upload, X, FileText, Globe, Zap, Terminal, ChevronDown, ChevronUp, Trash2, ShieldAlert } from 'lucide-react';
import { uploadQuestionPaper, uploadAnswerSheet, uploadRubric, DIRECT_RENDER_URL } from '../services/api';
import axios from 'axios';

const FileUploader = ({ type, onUploadSuccess, questionPaperId }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [file, setFile] = useState(null);
    const [title, setTitle] = useState('');
    const [studentName, setStudentName] = useState('');
    const [totalQuestions, setTotalQuestions] = useState(1);
    const [uploading, setUploading] = useState(false);
    const [testing, setTesting] = useState(false);
    const [useDirectMode, setUseDirectMode] = useState(false);

    // Debug Console State
    const [debugLogs, setDebugLogs] = useState([]);
    const [showDebug, setShowDebug] = useState(false);
    const logsEndRef = useRef(null);

    const addLog = (message, type = 'info') => {
        const timestamp = new Date().toLocaleTimeString();
        setDebugLogs(prev => [...prev.slice(-49), { timestamp, message, type }]);
    };

    useEffect(() => {
        if (logsEndRef.current) {
            logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [debugLogs]);

    // Dedicated Axios instance for Direct Mode (v2.10: NO manual Content-Type!)
    const directAxios = axios.create({
        baseURL: DIRECT_RENDER_URL,
        timeout: 120000,
        adapter: 'xhr'
    });

    directAxios.interceptors.request.use(config => {
        addLog(`📡 Request: ${config.method?.toUpperCase()} ${config.url}`, 'info');
        return config;
    });

    directAxios.interceptors.response.use(
        response => {
            addLog(`✅ Response: ${response.status} from ${response.config.url}`, 'success');
            return response;
        },
        error => {
            const errorJson = error.toJSON ? JSON.stringify(error.toJSON()) : 'No JSON detail';
            addLog(`❌ Detailed Error: ${errorJson}`, 'error');
            return Promise.reject(error);
        }
    );

    const testConnection = async () => {
        setTesting(true);
        const baseUrl = useDirectMode ? DIRECT_RENDER_URL : '/api/';
        const testUrl = `${baseUrl}test-connection`;

        addLog(`🧪 Testing connection to: ${testUrl}`, 'info');
        addLog(`🌍 Browser Context: ${window.location.href}`, 'info');

        try {
            const response = await axios.get(testUrl, {
                timeout: 15000,
                adapter: 'xhr'
            });

            // v2.10 Identity & Response Check
            const identityHeader = response.headers['x-scriptsense-server'];
            const isJson = typeof response.data === 'object' && response.data !== null;

            addLog(`📝 Content-Type: ${response.headers['content-type']}`, 'info');

            if (!isJson) {
                addLog(`⚠️ CRITICAL: Response is NOT JSON! You hit HTML.`, 'error');
                alert(`🛑 CRITICAL CONFIG ERROR!\nTarget: ${testUrl}\n\nProblem: Vercel is serving the Website instead of the API.\n\nMode: ${useDirectMode ? 'Direct Mode' : 'Proxy Mode'}`);
            } else {
                addLog(`✅ Backend Identified: ${response.data.server_identity || 'scriptsense-python'}`, 'success');
                alert(`✅ Backend Verified Successfully!\nYou are connected to the Python server.`);
            }
        } catch (error) {
            const errorJson = error.toJSON ? JSON.stringify(error.toJSON()) : 'No detail';
            addLog(`❌ Connection Failed: ${error.message}`, 'error');
            addLog(`❌ Error Detail: ${errorJson}`, 'error');
            alert(`❌ Connection Failed!\nCheck Debug Logs for specific internal error.`);
        } finally {
            setTesting(false);
        }
    };

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
            addLog(`📎 File selected: ${files[0].name}`, 'info');
        }
    }, []);

    const handleFileSelect = (e) => {
        const selectedFile = e.target.files[0];
        if (!selectedFile) return;
        if (selectedFile.type === 'application/pdf' || selectedFile.name.toLowerCase().endsWith('.pdf')) {
            setFile(selectedFile);
            addLog(`📎 File selected: ${selectedFile.name}`, 'info');
        } else {
            alert('Please select a valid PDF file.');
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setUploading(true);
        addLog(`🚀 Starting upload (${useDirectMode ? 'Direct' : 'Proxy'} Mode)...`, 'info');

        try {
            let responseData;
            const onProgress = (progressEvent) => {
                const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                if (percentCompleted % 20 === 0) addLog(`📤 Progress: ${percentCompleted}%`);
            };

            if (useDirectMode && DIRECT_RENDER_URL) {
                const formData = new FormData();
                formData.append('file', file);

                if (type === 'question') {
                    formData.append('title', title);
                    formData.append('total_questions', totalQuestions);
                } else if (type === 'answer') {
                    formData.append('student_name', studentName);
                    if (questionPaperId) formData.append('question_paper_id', questionPaperId);
                } else if (type === 'rubric') {
                    formData.append('title', title);
                }

                // v2.10: DO NOT set headers. Let browser add multipart/form-data with boundary!
                const response = await directAxios.post(
                    type === 'question' ? 'upload/question-paper' :
                        type === 'answer' ? 'upload/answer-sheet' : 'upload/rubric',
                    formData,
                    { onUploadProgress: onProgress }
                );
                responseData = response.data;
            } else {
                // Standard proxy service
                if (type === 'question') {
                    responseData = await uploadQuestionPaper(file, title, totalQuestions, onProgress);
                } else if (type === 'answer') {
                    responseData = await uploadAnswerSheet(file, studentName, questionPaperId, onProgress);
                } else if (type === 'rubric') {
                    responseData = await uploadRubric(file, title, onProgress);
                }
            }

            addLog(`✅ Upload complete!`, 'success');
            setFile(null);
            setTitle('');
            setStudentName('');
            setTotalQuestions(1);
            alert('File uploaded successfully!');
            if (onUploadSuccess) onUploadSuccess(responseData);
        } catch (error) {
            const errorJson = error.toJSON ? JSON.stringify(error.toJSON()) : 'No detail';
            addLog(`❌ Upload Failure: ${error.message}`, 'error');
            addLog(`❌ Full Debug JSON: ${errorJson}`, 'error');
            alert(`Upload failed: ${error.message}\nCheck logs for details.`);
        } finally {
            setUploading(false);
        }
    };

    const removeFile = () => setFile(null);
    const clearLogs = () => setDebugLogs([]);

    return (
        <div className="glass p-6 rounded-xl flex flex-col gap-4">
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold gradient-text">
                    {type === 'question' ? 'Question Paper' : type === 'answer' ? 'Answer Sheet' : 'Evaluation Rubric'}
                </h3>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowDebug(!showDebug)}
                        className={`p-1.5 rounded-lg transition-all ${showDebug ? 'bg-indigo-500/20 text-indigo-400' : 'bg-white/5 text-gray-500'}`}
                    >
                        <Terminal size={18} />
                    </button>

                    <button
                        onClick={testConnection}
                        disabled={testing}
                        className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400"
                    >
                        {testing ? 'Verifying...' : 'Test Connection'}
                    </button>

                    {DIRECT_RENDER_URL && (
                        <button
                            onClick={() => setUseDirectMode(!useDirectMode)}
                            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all ${useDirectMode ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-primary-500/10 text-primary-400 border border-primary-500/20'
                                }`}
                        >
                            {useDirectMode ? <Zap size={14} /> : <Globe size={14} />}
                            {useDirectMode ? 'Direct Mode ON' : 'Proxy Mode'}
                        </button>
                    )}
                </div>
            </div>

            {showDebug && (
                <div className="bg-black/80 rounded-lg p-3 font-mono text-[10px] border border-white/10 animate-in fade-in slide-in-from-top-2">
                    <div className="flex justify-between items-center mb-2 border-b border-white/10 pb-1">
                        <span className="text-indigo-400 font-bold uppercase">Debug Console v2.10</span>
                        <button onClick={clearLogs} className="text-gray-500 hover:text-red-400">
                            <Trash2 size={12} />
                        </button>
                    </div>
                    <div className="max-h-40 overflow-y-auto space-y-1">
                        {debugLogs.length === 0 ? <div className="text-gray-600">No logs...</div> :
                            debugLogs.map((log, i) => (
                                <div key={i} className="flex gap-2">
                                    <span className="text-gray-600">[{log.timestamp}]</span>
                                    <span className={log.type === 'error' ? 'text-red-400' : log.type === 'success' ? 'text-green-400' : 'text-gray-300'} style={{ wordBreak: 'break-all' }}>
                                        {log.message}
                                    </span>
                                </div>
                            ))
                        }
                        <div ref={logsEndRef} />
                    </div>
                </div>
            )}

            <div
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${isDragging ? 'border-primary-500 bg-primary-500/10' : 'border-white border-opacity-20'}`}
                onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
            >
                <input type="file" accept=".pdf" onChange={handleFileSelect} className="hidden" id={`file-input-${type}`} />
                {!file ? (
                    <label htmlFor={`file-input-${type}`} className="cursor-pointer">
                        <Upload className="w-12 h-12 mx-auto mb-4 text-primary-400" />
                        <p className="text-lg mb-2">Drop PDF here or click to browse</p>
                    </label>
                ) : (
                    <div className="flex items-center justify-center gap-4">
                        <FileText className="w-8 h-8 text-primary-400" />
                        <span className="flex-1 text-left line-clamp-1">{file.name}</span>
                        <button onClick={removeFile} className="p-2 hover:bg-red-500/20 rounded-lg">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                )}
            </div>

            {file && (
                <div className="space-y-3">
                    {type === 'question' && (
                        <>
                            <input type="text" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)}
                                className="w-full px-4 py-2 bg-white/10 rounded-lg border border-white/20 outline-none" />
                            <input type="number" placeholder="Questions" value={totalQuestions} onChange={(e) => setTotalQuestions(parseInt(e.target.value) || 1)}
                                className="w-full px-4 py-2 bg-white/10 rounded-lg border border-white/20 outline-none" />
                        </>
                    )}
                    {type === 'answer' && <input type="text" placeholder="Student Name" value={studentName} onChange={(e) => setStudentName(e.target.value)}
                        className="w-full px-4 py-2 bg-white/10 rounded-lg border border-white/20 outline-none" />}
                    {type === 'rubric' && <input type="text" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)}
                        className="w-full px-4 py-2 bg-white/10 rounded-lg border border-white/20 outline-none" />}

                    <button onClick={handleUpload} disabled={uploading} className="btn btn-primary w-full shadow-lg shadow-primary-500/20">
                        {uploading ? 'Uploading...' : 'Upload'}
                    </button>
                    {useDirectMode && <p className="text-[10px] text-amber-400 text-center animate-pulse">⚠️ Direct Mode: No Vercel limits.</p>}
                </div>
            )}
        </div>
    );
};

export default FileUploader;
