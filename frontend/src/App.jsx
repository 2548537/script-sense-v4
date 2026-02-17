import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import EvaluationPage from './pages/EvaluationPage';
import SubjectsPage from './pages/SubjectsPage';
import ResultsPage from './pages/ResultsPage';

function App() {
    return (
        <div className="min-h-screen">
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/subjects" element={<SubjectsPage />} />
                <Route path="/results" element={<ResultsPage />} />
                <Route path="/evaluate/:answersheetId" element={<EvaluationPage />} />
            </Routes>
        </div>
    );
}

export default App;
