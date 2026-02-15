import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight, Save, Eye, FileText, Sparkles } from 'lucide-react';
import PDFViewer from '../components/PDFViewer';
import TranscriptionPanel from '../components/TranscriptionPanel';
import GradingPanel from '../components/GradingPanel';
import DocumentModal from '../components/DocumentModal';
import ZoomModal from '../components/ZoomModal';
import { getFiles, getPdfInfo, zoomRegion } from '../services/api';

const EvaluationPage = () => {
    const { answersheetId } = useParams();
    const navigate = useNavigate();

    const [answerSheet, setAnswerSheet] = useState(null);
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [selectedRegion, setSelectedRegion] = useState(null);
    const [transcription, setTranscription] = useState(null);
    const [showQuestionPaper, setShowQuestionPaper] = useState(false);
    const [showRubric, setShowRubric] = useState(false);
    const [questionPapers, setQuestionPapers] = useState([]);
    const [rubrics, setRubrics] = useState([]);
    const [activeTab, setActiveTab] = useState('pdf'); // 'pdf', 'transcription', 'grading'
    const [zoomImageUrl, setZoomImageUrl] = useState(null);

    useEffect(() => {
        loadAnswerSheet();
        loadQuestionPapersAndRubrics();
    }, [answersheetId]);

    const loadAnswerSheet = async () => {
        try {
            const filesData = await getFiles('answer');
            const sheet = filesData.files.find(f => f.id === parseInt(answersheetId));
            setAnswerSheet(sheet);

            const pdfInfo = await getPdfInfo(answersheetId);
            setTotalPages(pdfInfo.page_count);
        } catch (error) {
            console.error('Failed to load answer sheet:', error);
        }
    };

    const loadQuestionPapersAndRubrics = async () => {
        try {
            const qpData = await getFiles('question');
            const rubricData = await getFiles('rubric');
            setQuestionPapers(qpData.files || []);
            setRubrics(rubricData.files || []);
        } catch (error) {
            console.error('Failed to load documents:', error);
        }
    };

    const handleRegionSelect = async (region) => {
        setSelectedRegion(region);
        try {
            const result = await zoomRegion(answersheetId, currentPage, region);
            if (result.success) {
                setZoomImageUrl(result.image);
            }
        } catch (error) {
            console.error('Zoom failed:', error);
        }
    };

    const handlePageChange = (direction) => {
        if (direction === 'next' && currentPage < totalPages - 1) {
            setCurrentPage(currentPage + 1);
            setSelectedRegion(null);
            setTranscription(null);
        } else if (direction === 'prev' && currentPage > 0) {
            setCurrentPage(currentPage - 1);
            setSelectedRegion(null);
            setTranscription(null);
        }
    };

    return (
        <div className="min-h-screen p-4 md:p-6 flex flex-col">
            {/* Header */}
            <header className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/')}
                        className="btn btn-ghost p-3"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold gradient-text truncate max-w-[200px] md:max-w-none">
                            {answerSheet?.student_name || 'Loading...'}
                        </h1>
                        <p className="text-xs md:text-sm text-gray-400">
                            Page {currentPage + 1} of {totalPages}
                        </p>
                    </div>
                </div>

                <div className="flex gap-1 md:gap-2">
                    <button
                        onClick={() => handlePageChange('prev')}
                        disabled={currentPage === 0}
                        className="btn btn-ghost p-2 md:p-3"
                    >
                        <ChevronLeft className="w-4 h-4 md:w-5 md:h-5" />
                    </button>
                    <button
                        onClick={() => handlePageChange('next')}
                        disabled={currentPage >= totalPages - 1}
                        className="btn btn-ghost p-2 md:p-3"
                    >
                        <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
                    </button>
                </div>
            </header>

            {/* Mobile Tab Switcher */}
            <div className="flex lg:hidden glass mb-4 p-1">
                {[
                    { id: 'pdf', label: 'Script', icon: Eye },
                    { id: 'transcription', label: 'AI Review', icon: Sparkles },
                    { id: 'grading', label: 'Grading', icon: FileText }
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id
                            ? 'bg-primary-500 text-white shadow-lg'
                            : 'text-gray-400 hover:text-white'
                            }`}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Main Content - Responsive Layout */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 min-h-0 overflow-hidden lg:h-[calc(100vh-180px)]">
                {/* Left Panel - PDF Viewer */}
                <div className={`${activeTab === 'pdf' ? 'block' : 'hidden lg:block'} lg:col-span-3 h-full overflow-hidden`}>
                    <PDFViewer
                        answersheetId={answersheetId}
                        currentPage={currentPage}
                        onPageSelect={setCurrentPage}
                        onRegionSelect={handleRegionSelect}
                    />
                </div>

                {/* Center Panel - Transcription */}
                <div className={`${activeTab === 'transcription' ? 'block' : 'hidden lg:block'} lg:col-span-6 h-full overflow-hidden`}>
                    <TranscriptionPanel
                        answersheetId={answersheetId}
                        page={currentPage}
                        region={selectedRegion}
                        onTranscriptionComplete={setTranscription}
                    />
                </div>

                {/* Right Panel - Grading */}
                <div className={`${activeTab === 'grading' ? 'block' : 'hidden lg:block'} lg:col-span-3 h-full overflow-hidden`}>
                    <GradingPanel
                        answersheetId={answersheetId}
                        answerSheet={answerSheet}
                        questionPapers={questionPapers}
                        rubrics={rubrics}
                        onViewQuestionPaper={() => setShowQuestionPaper(true)}
                        onViewRubric={() => setShowRubric(true)}
                    />
                </div>
            </div>

            {/* Modals */}
            {showQuestionPaper && questionPapers.length > 0 && (
                <DocumentModal
                    file={questionPapers[0]}
                    onClose={() => setShowQuestionPaper(false)}
                    title="Question Paper"
                />
            )}

            {showRubric && rubrics.length > 0 && (
                <DocumentModal
                    file={rubrics[0]}
                    onClose={() => setShowRubric(false)}
                    title="Evaluation Rubric"
                />
            )}

            {/* Zoom Modal */}
            {zoomImageUrl && (
                <ZoomModal
                    imageUrl={zoomImageUrl}
                    onClose={() => setZoomImageUrl(null)}
                />
            )}
        </div>
    );
};

export default EvaluationPage;
