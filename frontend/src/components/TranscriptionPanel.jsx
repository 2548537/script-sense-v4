import React, { useState, useEffect } from 'react';
import { Sparkles, FileImage, Loader, CheckCircle } from 'lucide-react';
import { autoScanPage } from '../services/api';

const TranscriptionPanel = ({ answersheetId, page, onTranscriptionComplete }) => {
    const [transcription, setTranscription] = useState('');
    const [diagrams, setDiagrams] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (answersheetId && page !== undefined) {
            performAutoScan();
        }
    }, [answersheetId, page]);

    const performAutoScan = async () => {
        setLoading(true);
        setError(null);
        setTranscription('');
        setDiagrams([]);

        try {
            const result = await autoScanPage(answersheetId, page);

            if (result.success) {
                setTranscription(result.transcription);
                setDiagrams(result.diagrams || []);
                onTranscriptionComplete?.(result.transcription);
            } else {
                setError('Failed to scan page automatically');
            }
        } catch (err) {
            setError(err.message || 'An error occurred during automatic scanning');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="glass-strong h-full rounded-xl overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-white border-opacity-10 flex justify-between items-center">
                <h3 className="font-semibold flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary-400" />
                    Automatic AI Review
                </h3>
                {loading && <div className="text-xs text-primary-400 animate-pulse">Scanning...</div>}
                {!loading && transcription && <div className="text-xs text-green-400 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Complete</div>}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-4 md:p-6">
                {loading && (
                    <div className="flex flex-col items-center justify-center h-full">
                        <Loader className="w-12 h-12 text-primary-400 animate-spin mb-4" />
                        <p className="text-gray-400">Scanning page with Gemini AI...</p>
                        <p className="text-xs text-gray-500 mt-2">Extracting handwriting and diagrams</p>
                    </div>
                )}

                {error && (
                    <div className="bg-red-500 bg-opacity-10 border border-red-500 rounded-lg p-4">
                        <p className="text-red-400">{error}</p>
                        <button
                            onClick={performAutoScan}
                            className="mt-2 text-xs text-red-300 underline hover:text-red-200"
                        >
                            Try Again
                        </button>
                    </div>
                )}

                {!loading && !error && transcription && (
                    <div className="space-y-6">
                        {/* Transcribed Text */}
                        <div>
                            <h4 className="font-semibold text-base md:text-lg mb-2 md:mb-3 text-primary-400 flex items-center gap-2">
                                <FileImage className="w-4 h-4 text-gray-400" />
                                Transcribed Text
                            </h4>
                            <div className="bg-white bg-opacity-5 rounded-lg p-3 md:p-4 border border-white border-opacity-10 text-sm md:text-base">
                                <p className="whitespace-pre-wrap leading-relaxed">{transcription}</p>
                            </div>
                        </div>

                        {/* Diagrams Gallery */}
                        {diagrams.length > 0 && (
                            <div className="space-y-4">
                                <h4 className="font-semibold text-lg mb-3 flex items-center gap-2 text-accent-400">
                                    <Sparkles className="w-5 h-5" />
                                    Diagrams Detected ({diagrams.length})
                                </h4>
                                <div className="grid grid-cols-1 gap-4">
                                    {diagrams.map((diag, idx) => (
                                        <div key={idx} className="bg-white bg-opacity-5 rounded-lg p-3 border border-white border-opacity-10">
                                            <p className="text-xs text-gray-400 mb-2 italic">"{diag.description}"</p>
                                            <img
                                                src={diag.image}
                                                alt={`Diagram ${idx + 1}`}
                                                className="rounded-lg border border-white border-opacity-20 w-full"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {!loading && !error && !transcription && (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <Sparkles className="w-16 h-16 text-gray-500 mb-4" />
                        <h4 className="text-xl font-semibold mb-2">Ready to Scan</h4>
                        <p className="text-gray-400">
                            Automatic scanning will begin when you navigate to a page
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TranscriptionPanel;
