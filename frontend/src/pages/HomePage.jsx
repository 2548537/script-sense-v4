import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Folder } from 'lucide-react';

const HomePage = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen p-4 md:p-8">
            {/* Header */}
            <header className="mb-8 md:mb-12">
                <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
                    <div className="p-4 bg-gradient-to-br from-primary-500 to-accent-500 rounded-2xl pulse-glow w-fit">
                        <GraduationCap className="w-8 h-8 md:w-10 md:h-10 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold gradient-text flex items-center gap-2">
                            ScriptSense v3
                        </h1>
                        <p className="text-gray-400 text-base md:text-lg">AI-Powered Handwriting Recognition & Grading</p>
                    </div>
                </div>

            </header>

            {/* Main Action Hub */}
            <main className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl">
                <div onClick={() => navigate('/subjects')} className="group p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-blue-500/50 transition-all cursor-pointer hover:bg-white/10">
                    <div className="p-4 bg-blue-500/10 rounded-2xl w-fit mb-6 group-hover:bg-blue-500/20 transition-colors">
                        <Folder className="w-8 h-8 text-blue-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Subject Folder Dashboard</h2>
                    <p className="text-gray-400">Manage your classes, subjects, and all evaluation documents in one place.</p>
                </div>

                <div onClick={() => navigate('/results')} className="group p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-green-500/50 transition-all cursor-pointer hover:bg-white/10">
                    <div className="p-4 bg-green-500/10 rounded-2xl w-fit mb-6 group-hover:bg-green-500/20 transition-colors">
                        <GraduationCap className="w-8 h-8 text-green-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Results Library</h2>
                    <p className="text-gray-400">View scores, track student progress, and export marks cards for each subject.</p>
                </div>
            </main>
        </div>
    );
};

export default HomePage;
