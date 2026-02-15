import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, FileText, Search, Eye } from 'lucide-react';
import api from '../services/api';

const ResultsPage = () => {
    const navigate = useNavigate();
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadResults();
    }, []);

    const loadResults = async () => {
        try {
            setLoading(true);
            const response = await api.get('/evaluate/results');
            setResults(response.data.results || []);
        } catch (error) {
            console.error('Failed to load results:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async () => {
        try {
            const response = await api.get('/evaluate/results/export', {
                responseType: 'blob',
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'class_results.csv');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Failed to export results:', error);
            alert('Failed to export results');
        }
    };

    const filteredResults = results.filter(r =>
        r.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.question_paper.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/')}
                        className="btn btn-ghost p-3"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold gradient-text">Results Library</h1>
                        <p className="text-gray-400">View and manage evaluated answer sheets</p>
                    </div>
                </div>

                <button
                    onClick={handleExport}
                    disabled={results.length === 0}
                    className="btn btn-primary flex items-center gap-2"
                >
                    <Download className="w-4 h-4" />
                    Export CSV
                </button>
            </div>

            {/* Search */}
            <div className="mb-6 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                    type="text"
                    placeholder="Search by student name or question paper..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-white bg-opacity-5 border border-white border-opacity-10 rounded-xl outline-none focus:border-primary-500 transition-colors"
                />
            </div>

            {/* Results Table */}
            <div className="glass-strong rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white bg-opacity-5 border-b border-white border-opacity-10 text-gray-300">
                                <th className="p-4 font-semibold">Student Name</th>
                                <th className="p-4 font-semibold">Question Paper</th>
                                <th className="p-4 font-semibold text-right">Score</th>
                                <th className="p-4 font-semibold text-right">Percentage</th>
                                <th className="p-4 font-semibold">Remarks</th>
                                <th className="p-4 font-semibold text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="p-8 text-center text-gray-400">
                                        Loading results...
                                    </td>
                                </tr>
                            ) : filteredResults.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="p-8 text-center text-gray-400">
                                        No results found.
                                    </td>
                                </tr>
                            ) : (
                                filteredResults.map((result) => (
                                    <tr key={result.id} className="border-b border-white border-opacity-5 hover:bg-white hover:bg-opacity-5 transition-colors">
                                        <td className="p-4 font-medium">{result.student_name}</td>
                                        <td className="p-4 text-gray-400">{result.question_paper}</td>
                                        <td className="p-4 text-right font-bold text-accent-300">
                                            {result.total_awarded} <span className="text-gray-500 font-normal">/ {result.total_max}</span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <span className={`px-2 py-1 rounded text-xs font-semibold ${result.percentage >= 70 ? 'bg-green-500 bg-opacity-20 text-green-300' :
                                                result.percentage >= 40 ? 'bg-yellow-500 bg-opacity-20 text-yellow-300' :
                                                    'bg-red-500 bg-opacity-20 text-red-300'
                                                }`}>
                                                {result.percentage}%
                                            </span>
                                        </td>
                                        <td className="p-4 text-gray-400 max-w-xs truncate">
                                            {result.remarks || '-'}
                                        </td>
                                        <td className="p-4 text-center">
                                            <button
                                                onClick={() => navigate(`/evaluate/${result.id}`)}
                                                className="flex items-center justify-center gap-1.5 mx-auto px-3 py-1.5 hover:bg-white hover:bg-opacity-10 rounded text-primary-300 transition-all text-xs font-medium"
                                                title="View Marks Card"
                                            >
                                                <Eye className="w-4 h-4" />
                                                View Details
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ResultsPage;
