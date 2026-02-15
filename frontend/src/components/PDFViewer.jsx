import React, { useState, useEffect, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { ZoomIn, ZoomOut, Maximize, Minimize, ChevronLeft, ChevronRight } from 'lucide-react';
import { getFileUrl } from '../services/api';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Configure PDF.js worker to use CDN
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const PDFViewer = ({ answersheetId, currentPage, onPageSelect, onRegionSelect }) => {
    const [numPages, setNumPages] = useState(0);
    const [scale, setScale] = useState(1.0);
    const [fitToPage, setFitToPage] = useState(true);
    const [selection, setSelection] = useState({ start: null, end: null, active: false });
    const containerRef = useRef(null);
    const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

    const pdfUrl = getFileUrl(answersheetId, 'answer');

    // Handle container resize
    useEffect(() => {
        const observer = new ResizeObserver(entries => {
            const { width, height } = entries[0].contentRect;
            setContainerSize({ width, height });
        });

        if (containerRef.current) {
            observer.observe(containerRef.current);
        }

        return () => observer.disconnect();
    }, []);

    // Auto-fit logic
    useEffect(() => {
        if (fitToPage && containerSize.height > 0) {
            // We can't set scale directly without knowing page dimensions
            // But we can let Page component handle it using height prop?
            // React-pdf Page component doesn't auto-scale by prop if scale is set?
            // Actually, if we pass height, it calculates scale.
            // But we handle scale manually for zoom.
            // Let's rely on Page onLoad to get dimensions and set scale.
        }
    }, [fitToPage, containerSize]);

    const onDocumentLoadSuccess = ({ numPages }) => {
        setNumPages(numPages);
    };

    const onPageLoadSuccess = ({ width, height, originalWidth, originalHeight }) => {
        if (fitToPage && containerSize.height > 0) {
            const availableHeight = containerSize.height - 40; // padding
            const availableWidth = containerSize.width - 40;

            const scaleHeight = availableHeight / originalHeight;
            const scaleWidth = availableWidth / originalWidth;

            // Fit to page means fitting the whole page in view (min of scales)
            const newScale = Math.min(scaleHeight, scaleWidth);
            setScale(newScale);
        }
    };

    const toggleFit = () => {
        setFitToPage(!fitToPage);
        if (!fitToPage) {
            // Enabling fit - logic handles it in render/onPageLoad? 
            // We need to trigger a recalc. 
            // Better to just set a flag and let the effect or render logic handle it.
            // Since we use scale for rendering, we need to calculate it.
            // We can't get originalHeight easily here unless we stored it.
            // But Page onLoadSuccess gives it.
            // Let's just reset scale to 1 if disabling fit, or keep current.
        } else {
            setScale(1.0);
        }
    };

    const handleZoom = (direction) => {
        setFitToPage(false);
        setScale(prev => {
            const newScale = direction === 'in' ? prev + 0.1 : prev - 0.1;
            return Math.max(0.2, Math.min(5.0, newScale));
        });
    };

    const handleMouseDown = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setSelection({
            start: { x: e.clientX - rect.left, y: e.clientY - rect.top },
            end: null,
            active: true
        });
    };

    const handleMouseMove = (e) => {
        if (!selection.active) return;
        const rect = e.currentTarget.getBoundingClientRect();
        setSelection(prev => ({
            ...prev,
            end: { x: e.clientX - rect.left, y: e.clientY - rect.top }
        }));
    };

    const handleTouchStart = (e) => {
        const touch = e.touches[0];
        const rect = e.currentTarget.getBoundingClientRect();
        setSelection({
            start: { x: touch.clientX - rect.left, y: touch.clientY - rect.top },
            end: null,
            active: true
        });
    };

    const handleTouchMove = (e) => {
        if (!selection.active) return;
        const touch = e.touches[0];
        const rect = e.currentTarget.getBoundingClientRect();
        setSelection(prev => ({
            ...prev,
            end: { x: touch.clientX - rect.left, y: touch.clientY - rect.top }
        }));
    };

    const handleTouchEnd = (e) => {
        handleMouseUp(e);
    };

    const handleMouseUp = (e) => {
        if (selection.start && selection.end) {
            const container = e.currentTarget;
            const canvas = container.querySelector('canvas');

            if (canvas) {
                const canvasRect = canvas.getBoundingClientRect();
                const containerRect = container.getBoundingClientRect();

                // Adjust selection to be relative to the CANVAS
                const offsetX = containerRect.left - canvasRect.left;
                const offsetY = containerRect.top - canvasRect.top;

                const startX = selection.start.x + offsetX;
                const startY = selection.start.y + offsetY;
                const endX = selection.end.x + (selection.end.x ? offsetX : 0);
                const endY = selection.end.y + (selection.end.y ? offsetY : 0);

                const x = Math.min(startX, endX);
                const y = Math.min(startY, endY);
                const width = Math.abs(endX - startX);
                const height = Math.abs(endY - startY);

                if (width > 10 && height > 10) {
                    onRegionSelect({
                        x: x / canvasRect.width,
                        y: y / canvasRect.height,
                        width: width / canvasRect.width,
                        height: height / canvasRect.height
                    });
                }
            }
        }
        setSelection({ start: null, end: null, active: false });
    };

    const getSelectionStyle = () => {
        if (!selection.start || !selection.end) return {};

        const x = Math.min(selection.start.x, selection.end.x);
        const y = Math.min(selection.start.y, selection.end.y);
        const width = Math.abs(selection.end.x - selection.start.x);
        const height = Math.abs(selection.end.y - selection.start.y);

        return {
            position: 'absolute',
            left: `${x}px`,
            top: `${y}px`,
            width: `${width}px`,
            height: `${height}px`,
            border: '2px solid #0ea5e9',
            backgroundColor: 'rgba(14, 165, 233, 0.15)',
            boxShadow: '0 0 15px rgba(14, 165, 233, 0.3)',
            borderRadius: '4px',
            pointerEvents: 'none',
            zIndex: 20
        };
    };

    return (
        <div className="glass-strong h-full rounded-xl overflow-hidden flex flex-col">
            {/* Controls */}
            <div className="p-4 border-b border-white border-opacity-10 flex items-center justify-between">
                <h3 className="font-semibold">PDF Viewer</h3>
                <div className="flex gap-2 items-center">
                    <button
                        onClick={toggleFit}
                        className={`p-2 rounded hover:bg-white hover:bg-opacity-10 ${fitToPage ? 'text-primary-400 bg-white bg-opacity-5' : ''}`}
                        title={fitToPage ? "Switch to Manual Zoom" : "Fit to Page"}
                    >
                        {fitToPage ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                    </button>
                    <div className="h-4 w-px bg-white bg-opacity-20 mx-1"></div>
                    <button
                        onClick={() => handleZoom('out')}
                        className="p-2 hover:bg-white hover:bg-opacity-10 rounded"
                        title="Zoom Out"
                    >
                        <ZoomOut className="w-4 h-4" />
                    </button>
                    <span className="text-xs text-gray-400 w-12 text-center">
                        {Math.round(scale * 100)}%
                    </span>
                    <button
                        onClick={() => handleZoom('in')}
                        className="p-2 hover:bg-white hover:bg-opacity-10 rounded"
                        title="Zoom In"
                    >
                        <ZoomIn className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* PDF Display */}
            <div className="flex-1 relative group overflow-hidden" ref={containerRef}>
                {/* Floating Navigation */}
                <div className="absolute inset-y-0 left-0 w-24 z-10 flex items-center justify-start pl-4 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={() => currentPage > 0 && onPageSelect(currentPage - 1)}
                        disabled={currentPage === 0}
                        className={`p-3 rounded-full bg-black/50 text-white backdrop-blur-md border border-white/10 hover:bg-black/70 transition-all pointer-events-auto ${currentPage === 0 ? 'opacity-30 cursor-not-allowed' : ''}`}
                        title="Previous Page"
                    >
                        <ChevronLeft className="w-8 h-8" />
                    </button>
                </div>
                <div className="absolute inset-y-0 right-0 w-24 z-10 flex items-center justify-end pr-4 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={() => currentPage < numPages - 1 && onPageSelect(currentPage + 1)}
                        disabled={currentPage === numPages - 1}
                        className={`p-3 rounded-full bg-black/50 text-white backdrop-blur-md border border-white/10 hover:bg-black/70 transition-all pointer-events-auto ${currentPage === numPages - 1 ? 'opacity-30 cursor-not-allowed' : ''}`}
                        title="Next Page"
                    >
                        <ChevronRight className="w-8 h-8" />
                    </button>
                </div>

                <div className="h-full overflow-auto p-4 flex justify-center">
                    <div
                        className="relative inline-block cursor-crosshair shadow-2xl glass rounded-lg touch-none"
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                        style={{ lineHeight: 0 }} // Remove unexpected spacing
                    >
                        <Document
                            file={pdfUrl}
                            onLoadSuccess={onDocumentLoadSuccess}
                            loading={<div className="spinner mx-auto"></div>}
                            error={<div className="text-red-400 p-4">Failed to load PDF</div>}
                        >
                            <Page
                                pageNumber={currentPage + 1}
                                scale={scale}
                                onLoadSuccess={onPageLoadSuccess}
                                renderTextLayer={false}
                                renderAnnotationLayer={false}
                                className="rounded-lg"
                                loading=""
                            />
                        </Document>

                        {selection.start && selection.end && (
                            <div style={getSelectionStyle()} />
                        )}
                    </div>
                </div>
            </div>

            {/* Page Thumbnails */}
            <div className="p-4 border-t border-white border-opacity-10 overflow-x-auto bg-black bg-opacity-20">
                <div className="flex gap-2 mx-auto justify-center min-w-min">
                    {Array.from({ length: numPages }, (_, i) => (
                        <button
                            key={i}
                            onClick={() => onPageSelect(i)}
                            className={`flex-shrink-0 border-2 rounded-md overflow-hidden transition-all transform hover:scale-105 ${i === currentPage
                                ? 'border-primary-500 shadow-md ring-2 ring-primary-500 ring-opacity-50'
                                : 'border-transparent hover:border-primary-300 opacity-70 hover:opacity-100'
                                }`}
                        >
                            <Document file={pdfUrl}>
                                <Page
                                    pageNumber={i + 1}
                                    width={60}
                                    renderTextLayer={false}
                                    renderAnnotationLayer={false}
                                />
                            </Document>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default PDFViewer;
