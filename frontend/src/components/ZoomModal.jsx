import React from 'react';
import { X, ZoomIn, Download } from 'lucide-react';

const ZoomModal = ({ imageUrl, onClose }) => {
    if (!imageUrl) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-200">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative glass-strong rounded-2xl overflow-hidden max-w-5xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-white/20 scale-in-center">
                {/* Header */}
                <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/40">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary-500/20 rounded-lg">
                            <ZoomIn className="w-5 h-5 text-primary-400" />
                        </div>
                        <h3 className="font-semibold text-lg">Region Zoom</h3>
                    </div>
                    <div className="flex items-center gap-2">
                        <a
                            href={imageUrl}
                            download="zoom-region.png"
                            className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"
                            title="Download Image"
                        >
                            <Download className="w-5 h-5" />
                        </a>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Image Area */}
                <div className="flex-1 overflow-auto p-4 md:p-8 flex items-center justify-center bg-[#1a1c1e]">
                    <img
                        src={imageUrl}
                        alt="Zoomed region"
                        className="max-w-full h-auto rounded-lg shadow-2xl border border-white/5"
                    />
                </div>

                {/* Footer Tip */}
                <div className="p-3 text-center text-xs text-gray-500 bg-black/20 border-t border-white/5">
                    Drag the selector again to zoom into a different area.
                </div>
            </div>
        </div>
    );
};

export default ZoomModal;
