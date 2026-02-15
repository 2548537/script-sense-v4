import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FileText, Eye, Pencil, Trash2, Loader2 } from 'lucide-react';
import { getThumbnailUrl, deleteFile } from '../services/api';
import DocumentModal from './DocumentModal';

const FileGrid = ({ files, onRefresh }) => {
    const navigate = useNavigate();
    const [selectedFile, setSelectedFile] = useState(null);
    const [deletingId, setDeletingId] = useState(null);

    const handleEvaluate = (file) => {
        navigate(`/evaluate/${file.id}`);
    };

    const handleView = (file) => {
        setSelectedFile(file);
    };

    const handleDelete = async (file) => {
        if (window.confirm(`Are you sure you want to delete "${file.student_name || file.title}"? This action cannot be undone.`)) {
            setDeletingId(file.id);
            try {
                const type = file.type.replace('_sheet', '').replace('_paper', '');
                await deleteFile(file.id, type);
                onRefresh?.();
            } catch (error) {
                console.error('Failed to delete file:', error);
                alert('Failed to delete file');
            } finally {
                setDeletingId(null);
            }
        }
    };

    const getTypeColor = (type) => {
        switch (type) {
            case 'question_paper': return 'from-blue-500 to-blue-600';
            case 'answer_sheet': return 'from-green-500 to-green-600';
            case 'rubric': return 'from-purple-500 to-purple-600';
            default: return 'from-gray-500 to-gray-600';
        }
    };

    const getTypeLabel = (type) => {
        switch (type) {
            case 'question_paper': return 'Question Paper';
            case 'answer_sheet': return 'Answer Sheet';
            case 'rubric': return 'Rubric';
            default: return 'File';
        }
    };

    if (!files || files.length === 0) {
        return (
            <div className="glass p-12 rounded-xl text-center">
                <FileText className="w-16 h-16 mx-auto mb-4 text-gray-500" />
                <p className="text-xl text-gray-400">No files uploaded yet</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {files.map((file) => (
                <div
                    key={`${file.type}-${file.id}`}
                    className={`glass card-hover group relative overflow-hidden rounded-xl ${deletingId === file.id ? 'opacity-50 pointer-events-none' : ''}`}
                >
                    {/* Thumbnail */}
                    <div className="aspect-[3/4] bg-gray-800 relative overflow-hidden">
                        <img
                            src={getThumbnailUrl(file.id, file.type.replace('_sheet', '').replace('_paper', ''))}
                            alt={file.title || file.student_name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                                e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="280"><rect fill="%23374151" width="200" height="280"/><text x="50%" y="50%" text-anchor="middle" fill="%239CA3AF" font-size="24">PDF</text></svg>';
                            }}
                        />

                        {/* Hover overlay - Persistent visibility on mobile */}
                        <div className="absolute inset-0 bg-black bg-opacity-20 md:bg-opacity-0 group-hover:bg-opacity-70 transition-all flex items-center justify-center gap-3 opacity-100 md:opacity-0 group-hover:opacity-100">
                            <button
                                onClick={(e) => { e.stopPropagation(); handleView(file); }}
                                className="btn btn-ghost p-4 rounded-full shadow-2xl"
                                title="View PDF"
                            >
                                <Eye className="w-6 h-6" />
                            </button>
                            {file.type === 'answer_sheet' && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleEvaluate(file); }}
                                    className="btn btn-primary p-4 rounded-full shadow-2xl"
                                    title="Evaluate"
                                >
                                    <Pencil className="w-6 h-6" />
                                </button>
                            )}
                            <button
                                onClick={(e) => { e.stopPropagation(); handleDelete(file); }}
                                className="btn btn-ghost p-4 rounded-full shadow-2xl text-red-400 hover:text-red-500 hover:bg-red-500 hover:bg-opacity-10"
                                title="Delete File"
                            >
                                {deletingId === file.id ? <Loader2 className="w-6 h-6 animate-spin" /> : <Trash2 className="w-6 h-6" />}
                            </button>
                        </div>
                    </div>

                    {/* File info */}
                    <div className="p-4">
                        <div className={`inline-block px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${getTypeColor(file.type)} mb-2`}>
                            {getTypeLabel(file.type)}
                        </div>
                        <h4 className="font-semibold text-lg mb-1 truncate group-hover:text-primary-400 transition-colors">
                            {file.student_name || file.title}
                        </h4>
                        <p className="text-sm text-gray-400 mb-4">
                            {new Date(file.uploaded_at).toLocaleDateString()}
                        </p>

                        {/* Explicit Links for Mobile/Tablet */}
                        <div className="flex items-center justify-between border-t border-white border-opacity-10 pt-4">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleView(file); }}
                                    className="flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-white transition-colors"
                                >
                                    <Eye className="w-3.5 h-3.5" />
                                    View
                                </button>
                                {file.type === 'answer_sheet' && (
                                    <Link
                                        to={`/evaluate/${file.id}`}
                                        className="flex items-center gap-1.5 text-xs font-medium text-primary-400 hover:text-primary-300 transition-colors"
                                    >
                                        <Pencil className="w-3.5 h-3.5" />
                                        Evaluate
                                    </Link>
                                )}
                            </div>
                            <button
                                onClick={(e) => { e.stopPropagation(); handleDelete(file); }}
                                className="text-gray-500 hover:text-red-500 transition-colors"
                                title="Delete"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            ))}

            {selectedFile && (
                <DocumentModal
                    file={selectedFile}
                    title={selectedFile.title || selectedFile.student_name}
                    onClose={() => setSelectedFile(null)}
                />
            )}
        </div>
    );
};

export default FileGrid;
