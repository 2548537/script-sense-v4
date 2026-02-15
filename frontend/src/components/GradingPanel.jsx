import React, { useState, useEffect } from 'react';
import { FileText, BookOpen, ChevronLeft, ChevronRight, Save, TrendingUp, CheckCircle, Plus } from 'lucide-react';
import { saveMarks, getMarks, getTotalMarks, saveReport } from '../services/api';

const GradingPanel = ({ answersheetId, answerSheet, questionPapers, rubrics, onViewQuestionPaper, onViewRubric }) => {
    const [currentQuestion, setCurrentQuestion] = useState(1);
    const [marksAwarded, setMarksAwarded] = useState('');
    const [maxMarks, setMaxMarks] = useState('');
    const [allMarks, setAllMarks] = useState([]);
    const [totalScore, setTotalScore] = useState(null);
    const [saving, setSaving] = useState(false);

    // New State for Enhancements
    const [activeQuestionPaper, setActiveQuestionPaper] = useState(null);
    const [activeRubric, setActiveRubric] = useState(null);
    const [remarks, setRemarks] = useState('');
    const [evaluationComplete, setEvaluationComplete] = useState(false);
    const [submittingReport, setSubmittingReport] = useState(false);

    useEffect(() => {
        if (questionPapers.length > 0 && !activeQuestionPaper) setActiveQuestionPaper(questionPapers[0]);
        if (rubrics.length > 0 && !activeRubric) setActiveRubric(rubrics[0]);
    }, [questionPapers, rubrics]);

    useEffect(() => {
        loadMarks();
        loadTotal();
    }, [answersheetId]);

    useEffect(() => {
        // Load marks for current question
        const questionMarks = allMarks.find(m => m.question_number === currentQuestion);
        if (questionMarks) {
            setMarksAwarded(questionMarks.marks_awarded.toString());
            setMaxMarks(questionMarks.max_marks.toString());
        } else {
            setMarksAwarded('');
            setMaxMarks('');
        }
    }, [currentQuestion, allMarks]);

    // Check if evaluation is complete (all questions graded)
    useEffect(() => {
        if (answerSheet?.status === 'evaluated') {
            // Maybe load remarks? We didn't fetch them in loadMarks though.
            // We'll skip pre-loading remarks for now to keep it simple, or add getAnswerSheet call?
            // props passed doesn't have details. EvaluationPage loads it.
        }
    }, [answersheetId]);

    const loadMarks = async () => {
        try {
            const data = await getMarks(answersheetId);
            setAllMarks(data.marks || []);
        } catch (error) {
            console.error('Failed to load marks:', error);
        }
    };

    const loadTotal = async () => {
        try {
            const data = await getTotalMarks(answersheetId);
            setTotalScore(data);
        } catch (error) {
            console.error('Failed to load total:', error);
        }
    };

    const handleSaveMarks = async () => {
        if (!marksAwarded || !maxMarks) {
            alert('Please enter both awarded marks and max marks');
            return;
        }

        setSaving(true);
        try {
            await saveMarks(
                answersheetId,
                activeQuestionPaper?.id,
                currentQuestion,
                parseFloat(marksAwarded),
                parseFloat(maxMarks)
            );

            await loadMarks();
            await loadTotal();

            // Auto-advance
            // If strictly within limits, go to next.
            if (activeQuestionPaper && currentQuestion < activeQuestionPaper.total_questions) {
                handleQuestionNav('next');
            } else {
                // If we are at the end, maybe prompt to finish?
                // For now, just stay on last question so user can review or click "View Marks Card"
            }
        } catch (error) {
            console.error('Failed to save marks:', error);
            alert('Failed to save marks');
        } finally {
            setSaving(false);
        }
    };

    const handleQuestionNav = (direction) => {
        if (direction === 'next') {
            setCurrentQuestion(prev => prev + 1);
            setMarksAwarded('');
            setMaxMarks('');
        } else if (direction === 'prev' && currentQuestion > 1) {
            setCurrentQuestion(prev => prev - 1);
        }
        setEvaluationComplete(false); // Hide summary if navigating back
    };

    const handleAddQuestion = () => {
        setCurrentQuestion(prev => prev + 1);
        setMarksAwarded('');
        setMaxMarks('');
        setEvaluationComplete(false);
    };

    const handleFinalize = async () => {
        setSubmittingReport(true);
        try {
            await saveReport(answersheetId, remarks);
            alert('Evaluation Report Saved Successfully!');
            setEvaluationComplete(true);
        } catch (error) {
            console.error('Failed to save report', error);
            alert('Failed to save report');
        } finally {
            setSubmittingReport(false);
        }
    };

    if (evaluationComplete) {
        return (
            <div className="glass-strong h-full rounded-xl overflow-hidden flex flex-col p-6">
                <div className="flex items-center gap-2 mb-4 md:mb-6 border-b border-white border-opacity-10 pb-4">
                    <CheckCircle className="w-5 h-5 md:w-6 md:h-6 text-green-400" />
                    <h2 className="text-lg md:text-xl font-bold">Evaluation Summary</h2>
                </div>

                <div className="flex-1 overflow-auto space-y-6">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white border-opacity-10 text-gray-400">
                                <th className="p-2">Q. No</th>
                                <th className="p-2 text-right">Marks</th>
                                <th className="p-2 text-right">Max</th>
                            </tr>
                        </thead>
                        <tbody>
                            {allMarks.sort((a, b) => a.question_number - b.question_number).map(mark => (
                                <tr key={mark.id} className="border-b border-white border-opacity-5">
                                    <td className="p-2 font-mono">{mark.question_number}</td>
                                    <td className="p-2 text-right font-bold text-accent-300">{mark.marks_awarded}</td>
                                    <td className="p-2 text-right text-gray-400">{mark.max_marks}</td>
                                </tr>
                            ))}
                            <tr className="border-t-2 border-white border-opacity-20 text-lg font-bold bg-white bg-opacity-5">
                                <td className="p-3">TOTAL</td>
                                <td className="p-3 text-right text-accent-400">{totalScore?.total_awarded}</td>
                                <td className="p-3 text-right">{totalScore?.total_max}</td>
                            </tr>
                        </tbody>
                    </table>

                    <div>
                        <label className="text-sm text-gray-400 mb-2 block">Evaluator Remarks</label>
                        <textarea
                            value={remarks}
                            onChange={(e) => setRemarks(e.target.value)}
                            placeholder="Enter overall remarks for the student..."
                            className="w-full h-32 px-4 py-3 bg-white bg-opacity-10 rounded-lg border border-white border-opacity-20 focus:border-primary-500 outline-none resize-none"
                        />
                    </div>
                </div>

                <div className="mt-6 pt-4 border-t border-white border-opacity-10 flex flex-col sm:flex-row gap-3">
                    <button
                        onClick={() => setEvaluationComplete(false)}
                        className="flex-1 btn btn-ghost py-2 md:py-3"
                    >
                        Back to Grading
                    </button>
                    <button
                        onClick={handleFinalize}
                        disabled={submittingReport}
                        className="flex-1 btn btn-primary flex items-center justify-center gap-2"
                    >
                        <Save className="w-4 h-4" />
                        {submittingReport ? 'Saving Report...' : 'Finalize & Save'}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="glass-strong h-full rounded-xl overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-white border-opacity-10 space-y-3">
                <div className="flex justify-between items-center">
                    <h3 className="font-semibold">Grading Panel</h3>
                    <button
                        onClick={() => setEvaluationComplete(true)}
                        className="text-xs btn btn-ghost px-2 py-1 text-accent-300"
                    >
                        View Marks Card
                    </button>
                </div>

                {/* selectors */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <select
                        className="bg-black bg-opacity-30 border border-white border-opacity-10 rounded px-2 py-2 text-xs outline-none"
                        value={activeQuestionPaper?.id || ''}
                        onChange={(e) => setActiveQuestionPaper(questionPapers.find(qp => qp.id === parseInt(e.target.value)))}
                    >
                        {questionPapers.map(qp => (
                            <option key={qp.id} value={qp.id}>{qp.title}</option>
                        ))}
                    </select>
                    <select
                        className="bg-black bg-opacity-30 border border-white border-opacity-10 rounded px-2 py-2 text-xs outline-none"
                        value={activeRubric?.id || ''}
                        onChange={(e) => setActiveRubric(rubrics.find(r => r.id === parseInt(e.target.value)))}
                    >
                        {rubrics.map(r => (
                            <option key={r.id} value={r.id}>{r.title}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-6 space-y-6">
                {/* View Documents */}
                <div className="space-y-3">
                    <button
                        onClick={() => onViewQuestionPaper(activeQuestionPaper)}
                        disabled={!activeQuestionPaper}
                        className="w-full btn btn-ghost flex items-center justify-center gap-2"
                    >
                        <FileText className="w-5 h-5" />
                        View Question Paper
                    </button>

                    <button
                        onClick={() => onViewRubric(activeRubric)}
                        disabled={!activeRubric}
                        className="w-full btn btn-ghost flex items-center justify-center gap-2"
                    >
                        <BookOpen className="w-5 h-5" />
                        View Rubric
                    </button>
                </div>

                <div className="border-t border-white border-opacity-10 pt-6">
                    {/* Question Navigation */}
                    <div className="mb-6">
                        <label className="text-sm text-gray-400 mb-2 block">Question Number</label>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => handleQuestionNav('prev')}
                                disabled={currentQuestion === 1}
                                className="p-2 hover:bg-white hover:bg-opacity-10 rounded disabled:opacity-30"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>

                            <div className="flex-1 text-center">
                                <span className="text-3xl font-bold gradient-text">{currentQuestion}</span>
                                {activeQuestionPaper && (
                                    <span className="text-xs text-gray-400 block">of {activeQuestionPaper.total_questions}</span>
                                )}
                            </div>

                            <button
                                onClick={() => handleQuestionNav('next')}
                                disabled={activeQuestionPaper && currentQuestion >= activeQuestionPaper.total_questions}
                                className="p-2 hover:bg-white hover:bg-opacity-10 rounded disabled:opacity-30"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>

                            <button
                                onClick={handleAddQuestion}
                                title="Add Question Manually"
                                className="p-2 hover:bg-white hover:bg-opacity-10 rounded text-accent-400"
                            >
                                <Plus className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Marks Input */}
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm text-gray-400 mb-2 block">Marks Awarded</label>
                            <input
                                type="number"
                                step="0.5"
                                value={marksAwarded}
                                onChange={(e) => setMarksAwarded(e.target.value)}
                                placeholder="0"
                                className="w-full px-4 py-2 md:py-3 bg-white bg-opacity-10 rounded-lg border border-white border-opacity-20 focus:border-primary-500 outline-none text-lg font-semibold"
                            />
                        </div>

                        <div>
                            <label className="text-sm text-gray-400 mb-2 block">Max Marks</label>
                            <input
                                type="number"
                                step="0.5"
                                value={maxMarks}
                                onChange={(e) => setMaxMarks(e.target.value)}
                                placeholder="0"
                                className="w-full px-4 py-2 md:py-3 bg-white bg-opacity-10 rounded-lg border border-white border-opacity-20 focus:border-primary-500 outline-none text-lg font-semibold"
                            />
                        </div>

                        <button
                            onClick={handleSaveMarks}
                            disabled={saving || !marksAwarded || !maxMarks}
                            className="w-full btn btn-primary flex items-center justify-center gap-2"
                        >
                            <Save className="w-5 h-5" />
                            {saving ? 'Saving...' : 'Save Marks'}
                        </button>
                    </div>
                </div>

                {/* Total Score */}
                {totalScore && (
                    <div className="border-t border-white border-opacity-10 pt-6">
                        <div className="glass p-4 rounded-lg">
                            <div className="flex items-center gap-2 mb-3">
                                <TrendingUp className="w-5 h-5 text-accent-400" />
                                <h4 className="font-semibold">Total Score</h4>
                            </div>
                            <div className="text-center">
                                <div className="text-4xl font-bold gradient-text mb-2">
                                    {totalScore.total_awarded.toFixed(1)} / {totalScore.total_max.toFixed(1)}
                                </div>
                                <div className="text-xl text-gray-400">
                                    {totalScore.percentage.toFixed(1)}%
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default GradingPanel;
