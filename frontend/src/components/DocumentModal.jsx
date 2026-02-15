import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Document, Page, pdfjs } from 'react-pdf';
import { getFileUrl } from '../services/api';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url,
).toString();

const DocumentModal = ({ file, onClose, title }) => {
    const [numPages, setNumPages] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);

    const fileType = file.type.replace('_sheet', '').replace('_paper', '');
    const pdfUrl = getFileUrl(file.id, fileType);

    const onDocumentLoadSuccess = ({ numPages }) => {
        setNumPages(numPages);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-70 backdrop-blur-sm">
            <div className="glass-strong max-w-4xl w-full max-h-[90vh] rounded-2xl overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-4 border-b border-white border-opacity-10 flex items-center justify-between">
                    <h3 className="text-xl font-semibold gradient-text">{title}</h3>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white hover:bg-opacity-10 rounded-lg transition-all"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* PDF Content */}
                <div className="flex-1 overflow-auto p-2 md:p-6 bg-gray-900 border-t border-white border-opacity-10">
                    <div className="flex flex-col items-center min-h-full">
                        <Document
                            file={pdfUrl}
                            onLoadSuccess={onDocumentLoadSuccess}
                            loading={
                                <div className="flex flex-col items-center gap-4 py-20">
                                    <div className="spinner"></div>
                                    <p className="text-gray-400">Loading Document...</p>
                                </div>
                            }
                            error={
                                <div className="w-full h-[60vh] flex flex-col items-center justify-center gap-4">
                                    <p className="text-red-400 font-medium">Enhanced Viewer failed to load.</p>
                                    <iframe
                                        src={pdfUrl}
                                        className="w-full h-full border-0 rounded-xl bg-white"
                                        title="PDF Fallback"
                                    />
                                    <a
                                        href={pdfUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn btn-primary mt-4"
                                    >
                                        Open in New Tab
                                    </a>
                                </div>
                            }
                        >
                            <Page
                                pageNumber={currentPage}
                                width={Math.min(window.innerWidth - 40, 800)}
                                renderTextLayer={false}
                                renderAnnotationLayer={false}
                                className="shadow-2xl rounded-lg overflow-hidden"
                            />
                        </Document>

                        {/* Page navigation */}
                        {numPages > 1 && (
                            <div className="mt-6 flex items-center gap-4">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="btn btn-ghost px-4 py-2"
                                >
                                    Previous
                                </button>
                                <span className="text-gray-300">
                                    Page {currentPage} of {numPages}
                                </span>
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(numPages, p + 1))}
                                    disabled={currentPage === numPages}
                                    className="btn btn-ghost px-4 py-2"
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DocumentModal;
