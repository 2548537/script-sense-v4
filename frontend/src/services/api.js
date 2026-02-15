import axios from 'axios';

const getApiBaseUrl = () => {
    // 1. Check if an explicit API URL is provided (Vercel/Production)
    if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;

    // 2. Handle Local / Network access
    const { hostname, protocol } = window.location;

    // If we are on a local machine or network IP, use port 5000 on the same machine
    if (hostname === 'localhost' || hostname.match(/^127\.|^192\.|^172\.|^10\./)) {
        return `${protocol}//${hostname}:5000/api`;
    }

    // 3. Fallback to localhost if no other cues are available
    return 'http://localhost:5000/api';
};

const API_BASE_URL = getApiBaseUrl();

console.log("🚀 ScriptSense Final API URL:", API_BASE_URL);

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Upload services
export const uploadQuestionPaper = async (file, title, totalQuestions) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);
    formData.append('total_questions', totalQuestions);

    const response = await api.post('/upload/question-paper', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
};

export const uploadAnswerSheet = async (file, studentName, questionPaperId) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('student_name', studentName);
    if (questionPaperId) formData.append('question_paper_id', questionPaperId);

    const response = await api.post('/upload/answer-sheet', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
};

export const uploadRubric = async (file, title) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);

    const response = await api.post('/upload/rubric', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
};

export const getFiles = async (type = 'all') => {
    const response = await api.get(`/upload/files?type=${type}`);
    return response.data;
};

export const getFileUrl = (fileId, type) => {
    return `${API_BASE_URL}/upload/files/${fileId}/view?type=${type}`;
};

export const getThumbnailUrl = (fileId, type) => {
    return `${API_BASE_URL}/upload/files/${fileId}/thumbnail?type=${type}`;
};

// Evaluation services
export const autoScanPage = async (answersheetId, page) => {
    const response = await api.post('/evaluate/auto-scan', {
        answersheetId,
        page
    });
    return response.data;
};

export const transcribeRegion = async (answersheetId, page, coordinates) => {
    const response = await api.post('/evaluate/transcribe', {
        answersheetId,
        page,
        coordinates
    });
    return response.data;
};

export const extractDiagram = async (answersheetId, page, coordinates) => {
    const response = await api.post('/evaluate/extract-diagram', {
        answersheetId,
        page,
        coordinates
    });
    return response.data;
};

export const saveMarks = async (answersheetId, questionPaperId, questionNumber, marksAwarded, maxMarks) => {
    const response = await api.post('/evaluate/marks', {
        answersheetId,
        questionPaperId,
        questionNumber,
        marksAwarded,
        maxMarks
    });
    return response.data;
};

export const getMarks = async (answersheetId) => {
    const response = await api.get(`/evaluate/marks/${answersheetId}`);
    return response.data;
};

export const getTotalMarks = async (answersheetId) => {
    const response = await api.get(`/evaluate/marks/${answersheetId}/total`);
    return response.data;
};

export const getPdfInfo = async (answersheetId) => {
    const response = await api.get(`/evaluate/pdf-info/${answersheetId}`);
    return response.data;
};

export const saveReport = async (answersheetId, remarks) => {
    const response = await api.post('/evaluate/save-report', {
        answersheetId,
        remarks
    });
    return response.data;
};

export const deleteFile = async (fileId, type) => {
    const response = await api.delete(`/upload/files/${fileId}?type=${type}`);
    return response.data;
};

export const zoomRegion = async (answersheetId, page, coordinates) => {
    const response = await api.post('/evaluate/zoom', {
        answersheetId,
        page,
        coordinates
    });
    return response.data;
};

export default api;
