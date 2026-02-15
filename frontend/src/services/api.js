import axios from 'axios';

const getApiBaseUrl = () => {
    // We now use Vercel/Vite Proxies for everything
    // This allows the browser to think it's talking to the same domain, bypassing CORS entirely
    return '/api/';
};

export const DIRECT_RENDER_URL = import.meta.env.VITE_API_URL
    ? (import.meta.env.VITE_API_URL.endsWith('/') ? import.meta.env.VITE_API_URL : `${import.meta.env.VITE_API_URL}/`)
    : null;

const API_BASE_URL = getApiBaseUrl();

console.log("🚀 ScriptSense Final API URL:", API_BASE_URL);
console.log("🌍 Environment:", import.meta.env.MODE);
console.log("📡 Production API defined:", !!import.meta.env.VITE_API_URL);

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 120000, // 2 minutes timeout for slow mobile uploads
});

// Add error logging interceptor
api.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error('🌐 API Error:', {
            url: error.config?.url,
            method: error.config?.method,
            status: error.response?.status,
            data: error.response?.data,
            message: error.message
        });
        return Promise.reject(error);
    }
);

// Upload services
export const uploadQuestionPaper = async (file, title, totalQuestions, onProgress) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);
    formData.append('total_questions', totalQuestions);

    const response = await api.post('upload/question-paper', formData, {
        onUploadProgress: onProgress
    });
    return response.data;
};

export const uploadAnswerSheet = async (file, studentName, questionPaperId, onProgress) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('student_name', studentName);
    if (questionPaperId) formData.append('question_paper_id', questionPaperId);

    const response = await api.post('upload/answer-sheet', formData, {
        onUploadProgress: onProgress
    });
    return response.data;
};

export const uploadRubric = async (file, title, onProgress) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);

    const response = await api.post('upload/rubric', formData, {
        onUploadProgress: onProgress
    });
    return response.data;
};

export const getFiles = async (type = 'all') => {
    const response = await api.get(`upload/files?type=${type}`);
    return response.data;
};

export const getFileUrl = (fileId, type) => {
    return `${API_BASE_URL}/upload/files/${fileId}/view?type=${type}`.replace('//upload', '/upload');
};

export const getThumbnailUrl = (fileId, type) => {
    return `${API_BASE_URL}/upload/files/${fileId}/thumbnail?type=${type}`.replace('//upload', '/upload');
};

// Evaluation services
export const autoScanPage = async (answersheetId, page) => {
    const response = await api.post('evaluate/auto-scan', {
        answersheetId,
        page
    });
    return response.data;
};

export const transcribeRegion = async (answersheetId, page, coordinates) => {
    const response = await api.post('evaluate/transcribe', {
        answersheetId,
        page,
        coordinates
    });
    return response.data;
};

export const extractDiagram = async (answersheetId, page, coordinates) => {
    const response = await api.post('evaluate/extract-diagram', {
        answersheetId,
        page,
        coordinates
    });
    return response.data;
};

export const saveMarks = async (answersheetId, questionPaperId, questionNumber, marksAwarded, maxMarks) => {
    const response = await api.post('evaluate/marks', {
        answersheetId,
        questionPaperId,
        questionNumber,
        marksAwarded,
        maxMarks
    });
    return response.data;
};

export const getMarks = async (answersheetId) => {
    const response = await api.get(`evaluate/marks/${answersheetId}`);
    return response.data;
};

export const getTotalMarks = async (answersheetId) => {
    const response = await api.get(`evaluate/marks/${answersheetId}/total`);
    return response.data;
};

export const getPdfInfo = async (answersheetId) => {
    const response = await api.get(`evaluate/pdf-info/${answersheetId}`);
    return response.data;
};

export const saveReport = async (answersheetId, remarks) => {
    const response = await api.post('evaluate/save-report', {
        answersheetId,
        remarks
    });
    return response.data;
};

export const deleteFile = async (fileId, type) => {
    const response = await api.delete(`upload/files/${fileId}?type=${type}`);
    return response.data;
};

export const zoomRegion = async (answersheetId, page, coordinates) => {
    const response = await api.post('evaluate/zoom', {
        answersheetId,
        page,
        coordinates
    });
    return response.data;
};

export default api;
