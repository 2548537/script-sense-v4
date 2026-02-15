import React, { useState, useCallback } from 'react';
import { Upload, X, FileText } from 'lucide-react';

const FileUploader = ({ onUpload, type, title }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [metadata, setMetadata] = useState({
        title: '',
        studentName: '',
        totalQuestions: ''
    });

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
        if (files && files[0] && files[0].type === 'application/pdf') {
            setFile(files[0]);
        }
    }, []);

    const handleFileSelect = (e) => {
        const selectedFile = e.target.files[0];
        if (!selectedFile) return;

        // Relaxed validation: Check MIME type OR file extension
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
            await onUpload(file, metadata, (progressEvent) => {
                const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                console.log(`📤 Upload Progress: ${percentCompleted}%`);
            });
            setFile(null);
            setMetadata({ title: '', studentName: '', totalQuestions: '' });
            alert('File uploaded successfully!');
        } catch (error) {
            console.error('Upload failed:', error);
            const status = error.response?.status;
            let errorMessage = error.response?.data?.error || error.message || 'Unknown error';

            // Add helpful context for mobile/network errors
            if (error.message === 'Network Error') {
                errorMessage = 'Network Error: The backend might be unreachable. Check if you are on the same WiFi/Hotspot.';
            } else if (status === 413) {
                errorMessage = 'File too large for server limits.';
            }

            const targetUrl = error.config ? `\nTarget: ${error.config.baseURL + '/' + error.config.url}` : '';
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
            <h3 className="text-xl font-semibold mb-4 gradient-text">{title}</h3>

            <div
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${isDragging ? 'drag-active' : 'border-white border-opacity-20'
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
                        <span className="flex-1 text-left">{file.name}</span>
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
                                value={metadata.title}
                                onChange={(e) => setMetadata({ ...metadata, title: e.target.value })}
                                className="w-full px-4 py-2 bg-white bg-opacity-10 rounded-lg border border-white border-opacity-20 focus:border-primary-500 outline-none"
                            />
                            <input
                                type="number"
                                placeholder="Total Questions"
                                value={metadata.totalQuestions}
                                onChange={(e) => setMetadata({ ...metadata, totalQuestions: e.target.value })}
                                className="w-full px-4 py-2 bg-white bg-opacity-10 rounded-lg border border-white border-opacity-20 focus:border-primary-500 outline-none"
                            />
                        </>
                    )}

                    {type === 'answer' && (
                        <input
                            type="text"
                            placeholder="Student Name"
                            value={metadata.studentName}
                            onChange={(e) => setMetadata({ ...metadata, studentName: e.target.value })}
                            className="w-full px-4 py-2 bg-white bg-opacity-10 rounded-lg border border-white border-opacity-20 focus:border-primary-500 outline-none"
                        />
                    )}

                    {type === 'rubric' && (
                        <input
                            type="text"
                            placeholder="Rubric Title"
                            value={metadata.title}
                            onChange={(e) => setMetadata({ ...metadata, title: e.target.value })}
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
                </div>
            )}
        </div>
    );
};

export default FileUploader;
