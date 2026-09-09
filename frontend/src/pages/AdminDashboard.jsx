import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Layers, PlusCircle, CheckCircle, AlertCircle, Loader2, FileText, Users, BarChart3 } from 'lucide-react';
import { fetchApi } from '../api';
import NotificationBell from '../components/NotificationBell';

/**
 * Admin Dashboard Component.
 * Provides interfaces for generating quizzes, viewing users, and reviewing exam evidence.
 */
export default function AdminDashboard({ user, setUser }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('generator'); // Controls the active sidebar tab
  
  // States for the Quiz Generator tab
  const [numQuestions, setNumQuestions] = useState(10);
  const [quizTitle, setQuizTitle] = useState('');
  const [loadingGen, setLoadingGen] = useState(false);
  const [message, setMessage] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // States for the Management tables (Quizzes, Users, Results)
  const [quizzes, setQuizzes] = useState([]);
  const [users, setUsers] = useState([]);
  const [results, setResults] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  
  // States for the Exam Evidence Modal
  const [modalData, setModalData] = useState(null);
  const [modalQuizData, setModalQuizData] = useState(null);

  /**
   * Opens the Exam Evidence modal and fetches the original quiz structure
   * to overlay the user's answers visually.
   */
  const handleViewDetails = async (r) => {
    setModalData(r); // Set the raw exam result (contains the JSONB evidence)
    setModalQuizData(null); // Reset the quiz structure
    try {
      // Fetch the full quiz structure including correct answers
      const quiz = await fetchApi(`/quizzes/${r.quizId}`);
      setModalQuizData(quiz);
    } catch (err) {
      console.error(err);
    }
  };

  /**
   * Refetch data whenever the admin switches tabs.
   */
  useEffect(() => {
    setCurrentPage(1);
    if (activeTab === 'quizzes') fetchData('/quizzes', setQuizzes);
    if (activeTab === 'users') fetchData('/users', setUsers);
    if (activeTab === 'results') fetchData('/exams/results', setResults);
  }, [activeTab]);

  /**
   * Generic data fetcher for the admin tables.
   */
  const fetchData = async (endpoint, setter) => {
    setLoadingData(true);
    try {
      const data = await fetchApi(endpoint);
      setter(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingData(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    setUser(null);
    navigate('/login');
  };

  /**
   * Generates a mock quiz by randomly selecting questions from an English pool.
   * Leverages PostgreSQL's JSONB dynamically through the backend.
   */
  const handleGenerate = async (e) => {
    e.preventDefault();
    setLoadingGen(true);
    setMessage('');

    const englishQuestionsPool = [
      { q: "What is the past tense of 'run'?", options: ["ran", "runned", "running", "rans"], a: "ran" },
      { q: "Which word is an adjective?", options: ["Quickly", "Happiness", "Beautiful", "Run"], a: "Beautiful" },
      { q: "She ___ to the store yesterday.", options: ["goes", "went", "going", "gone"], a: "went" },
      { q: "I have been living here ___ 5 years.", options: ["since", "for", "in", "at"], a: "for" },
      { q: "What is the synonym of 'happy'?", options: ["Sad", "Angry", "Joyful", "Tired"], a: "Joyful" },
      { q: "He is the ___ person in the room.", options: ["tall", "taller", "tallest", "most tall"], a: "tallest" },
      { q: "___ you like a cup of tea?", options: ["Would", "Do", "Are", "Have"], a: "Would" },
      { q: "The book is ___ the table.", options: ["in", "on", "at", "by"], a: "on" },
      { q: "They ___ playing football now.", options: ["is", "are", "do", "does"], a: "are" },
      { q: "I don't have ___ money left.", options: ["some", "any", "many", "a few"], a: "any" }
    ];

    try {
      const questions = Array.from({ length: numQuestions }).map((_, i) => {
        const item = englishQuestionsPool[Math.floor(Math.random() * englishQuestionsPool.length)];
        // Đảo thứ tự nhẹ hoặc để nguyên, ở đây ta lấy ngẫu nhiên từ Pool
        return {
          details: {
            keyword: item.q,
            options: item.options
          },
          type: 'MULTIPLE_CHOICE',
          correctAnswer: item.a
        };
      });

      const payload = {
        title: quizTitle.trim() !== '' ? quizTitle : `English Proficiency Test - ${numQuestions} Questions`,
        description: `Auto-generated test focusing on grammar and vocabulary.`,
        questions
      };

      await fetchApi('/quizzes', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      setMessage(`Successfully generated a quiz with ${numQuestions} questions!`);
    } catch (err) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setLoadingGen(false);
    }
  };

  const renderPaginationControls = (totalItems) => {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    if (totalPages <= 1) return null;
    return (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, padding: '0 12px' }}>
        <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
          Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} entries
        </span>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button 
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(prev => prev - 1)}
            style={{ padding: '6px 12px', background: 'transparent', border: '1px solid var(--border-color)', color: currentPage === 1 ? 'var(--text-secondary)' : 'var(--text-main)', borderRadius: 6, cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
          >
            Previous
          </button>
          <span style={{ fontSize: 13, fontWeight: 'bold' }}>{currentPage} / {totalPages}</span>
          <button 
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(prev => prev + 1)}
            style={{ padding: '6px 12px', background: 'transparent', border: '1px solid var(--border-color)', color: currentPage === totalPages ? 'var(--text-secondary)' : 'var(--text-main)', borderRadius: 6, cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
          >
            Next
          </button>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    if (activeTab === 'generator') {
      return (
        <div className="glass-panel" style={{ maxWidth: 600 }}>
          <h2 style={{ marginBottom: 16 }}>Bulk Generate Quizzes</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
            Instantly create a new quiz filled with AI-generated questions. Perfect for testing system load.
          </p>
          <form onSubmit={handleGenerate}>
            <div className="form-group">
              <label>Quiz Title (Optional)</label>
              <input 
                type="text" className="input-field" 
                placeholder="Leave blank to auto-generate"
                value={quizTitle} onChange={e => setQuizTitle(e.target.value)} 
              />
            </div>
            <div className="form-group">
              <label>Number of Questions</label>
              <input 
                type="number" min="1" max="1000" className="input-field" 
                value={numQuestions} onChange={e => setNumQuestions(Number(e.target.value))} required 
              />
            </div>
            <button type="submit" className="btn-primary" disabled={loadingGen}>
              {loadingGen ? <Loader2 className="lucide-spin" size={18} /> : <PlusCircle size={18} />}
              {loadingGen ? 'Generating...' : `Generate Quiz with ${numQuestions} Questions`}
            </button>
          </form>
          {message && (
            <div className="badge" style={{ 
              marginTop: 20, padding: 16, width: '100%', 
              backgroundColor: message.startsWith('Error') ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
              color: message.startsWith('Error') ? '#ef4444' : '#10B981'
            }}>
              {message.startsWith('Error') ? <AlertCircle size={18} /> : <CheckCircle size={18} />}
              {message}
            </div>
          )}
        </div>
      );
    }

    if (loadingData) return <Loader2 className="lucide-spin" size={40} color="white" />;

    if (activeTab === 'quizzes') {
      return (
        <div className="glass-panel">
          <h2 style={{ marginBottom: 20 }}>Manage Quizzes</h2>
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                <th style={{ padding: 12 }}>ID</th>
                <th style={{ padding: 12 }}>Title</th>
                <th style={{ padding: 12 }}>Questions</th>
                <th style={{ padding: 12 }}>Created At</th>
              </tr>
            </thead>
            <tbody>
              {quizzes.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map(q => (
                <tr key={q.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: 12 }}>{q.id}</td>
                  <td style={{ padding: 12, fontWeight: 500 }}>{q.title}</td>
                  <td style={{ padding: 12 }}>{q.questions?.length || 0}</td>
                  <td style={{ padding: 12, color: 'var(--text-secondary)' }}>{new Date(q.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {renderPaginationControls(quizzes.length)}
        </div>
      );
    }

    if (activeTab === 'users') {
      return (
        <div className="glass-panel">
          <h2 style={{ marginBottom: 20 }}>Manage Users</h2>
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                <th style={{ padding: 12 }}>ID</th>
                <th style={{ padding: 12 }}>Username</th>
                <th style={{ padding: 12 }}>Role</th>
              </tr>
            </thead>
            <tbody>
              {users.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map(u => (
                <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: 12 }}>{u.id}</td>
                  <td style={{ padding: 12, fontWeight: 500 }}>{u.username}</td>
                  <td style={{ padding: 12 }}>
                    <span className={`badge ${u.role === 'ADMIN' ? 'admin' : ''}`}>{u.role}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {renderPaginationControls(users.length)}
        </div>
      );
    }

    if (activeTab === 'results') {
      return (
        <div className="glass-panel">
          <h2 style={{ marginBottom: 20 }}>Exam Results</h2>
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                <th style={{ padding: 12 }}>Result ID</th>
                <th style={{ padding: 12 }}>User ID</th>
                <th style={{ padding: 12 }}>Quiz ID</th>
                <th style={{ padding: 12 }}>Score</th>
                <th style={{ padding: 12 }}>Evidence</th>
                <th style={{ padding: 12 }}>Submitted At</th>
              </tr>
            </thead>
            <tbody>
              {results.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map(r => {
                // Determine attempt number
                const userQuizResults = results
                  .filter(res => res.userId === r.userId && res.quizId === r.quizId)
                  .sort((a, b) => new Date(a.submittedAt) - new Date(b.submittedAt));
                const attemptNumber = userQuizResults.findIndex(res => res.id === r.id) + 1;
                const isRetake = attemptNumber > 1;

                return (
                <tr key={r.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: 12 }}>{r.id}</td>
                  <td style={{ padding: 12 }}>User #{r.userId}</td>
                  <td style={{ padding: 12 }}>
                    Quiz #{r.quizId}
                    {isRetake && (
                      <span style={{ 
                        marginLeft: 8, 
                        fontSize: 10, 
                        padding: '2px 6px', 
                        borderRadius: 4, 
                        background: 'rgba(245, 158, 11, 0.1)', 
                        color: '#f59e0b', 
                        border: '1px solid rgba(245, 158, 11, 0.2)',
                        fontWeight: 'bold'
                      }}>
                        Retake #{attemptNumber - 1}
                      </span>
                    )}
                  </td>
                  <td style={{ padding: 12, fontWeight: 'bold', color: 'var(--accent-color)' }}>{r.score} points</td>
                  <td style={{ padding: 12 }}>
                    <button 
                      className="btn-primary" 
                      style={{ padding: '6px 12px', fontSize: 12 }} 
                      onClick={() => handleViewDetails(r)}
                    >
                      View Details
                    </button>
                  </td>
                  <td style={{ padding: 12, color: 'var(--text-secondary)' }}>{new Date(r.submittedAt).toLocaleString()}</td>
                </tr>
              )})}
            </tbody>
          </table>
          {renderPaginationControls(results.length)}
        </div>
      );
    }
  };

  return (
    <div className="dashboard-layout">
      <div className="sidebar">
        <div className="sidebar-brand">
          <Layers color="#7C3AED" />
          QuizMaster Pro
        </div>
        
        <div className="sidebar-nav">
          <button className={`nav-item ${activeTab === 'generator' ? 'active' : ''}`} onClick={() => setActiveTab('generator')}>
            <PlusCircle size={20} /> Bulk Generator
          </button>
          <button className={`nav-item ${activeTab === 'quizzes' ? 'active' : ''}`} onClick={() => setActiveTab('quizzes')}>
            <FileText size={20} /> Manage Quizzes
          </button>
          <button className={`nav-item ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>
            <Users size={20} /> Manage Users
          </button>
          <button className={`nav-item ${activeTab === 'results' ? 'active' : ''}`} onClick={() => setActiveTab('results')}>
            <BarChart3 size={20} /> Exam Results
          </button>
        </div>

        <div style={{ marginTop: 'auto' }}>
          <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, #7C3AED, #10B981)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: 'white' }}>
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight: 600 }}>{user.username}</div>
              <div className="badge admin">ADMIN</div>
            </div>
          </div>
          <button className="nav-item" onClick={handleLogout} style={{ color: '#ef4444' }}>
            <LogOut size={20} /> Logout
          </button>
        </div>
      </div>

      <div className="main-content">
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 className="title">Admin Dashboard</h1>
            <p className="subtitle">Manage system resources and view statistics.</p>
          </div>
          <NotificationBell />
        </div>

        {renderContent()}
      </div>

      {modalData && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="glass-panel" style={{ width: 800, maxHeight: '80vh', display: 'flex', flexDirection: 'column', padding: 0, border: '1px solid var(--primary-color)', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.1)', background: 'rgba(15, 17, 26, 0.5)' }}>
              <h2 style={{ color: 'var(--primary-color)', margin: 0 }}>Exam Evidence</h2>
              <button onClick={() => setModalData(null)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', fontSize: 28, lineHeight: 1 }}>&times;</button>
            </div>
            
            <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
              {!modalQuizData ? (
                <p style={{ color: 'var(--text-secondary)' }}>Loading exam details...</p>
              ) : (
              <div className="questions-list">
                {modalQuizData.questions.map((q, index) => {
                  const userAnswer = modalData.evidence ? modalData.evidence[q.id] : null;
                  const isCorrect = userAnswer === q.correctAnswer;
                  
                  return (
                    <div key={q.id} className="glass-panel" style={{ marginBottom: 16, padding: 20, background: 'rgba(255,255,255,0.02)' }}>
                      <h4 style={{ marginBottom: 16, fontSize: 16 }}>
                        <span style={{ color: 'var(--primary-color)', marginRight: 8 }}>Q{index + 1}.</span> 
                        {q.details.keyword}
                      </h4>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 10 }}>
                        {q.details.options.map((opt, i) => {
                          let bg = 'rgba(255,255,255,0.05)';
                          let border = '1px solid rgba(255,255,255,0.1)';
                          let color = 'white';
                          
                          if (opt === q.correctAnswer) {
                            bg = 'rgba(16, 185, 129, 0.2)';
                            border = '1px solid #10B981';
                            color = '#10B981';
                          } else if (opt === userAnswer && !isCorrect) {
                            bg = 'rgba(239, 68, 68, 0.2)';
                            border = '1px solid #ef4444';
                            color = '#ef4444';
                          }
                          
                          return (
                            <div key={i} style={{ padding: '12px 16px', borderRadius: 8, background: bg, border: border, color: color }}>
                              {opt}
                              {opt === userAnswer && <span style={{ marginLeft: 10, fontSize: 12, opacity: 0.8 }}>(Selected)</span>}
                              {opt === q.correctAnswer && <span style={{ marginLeft: 10, fontSize: 12, opacity: 0.8 }}>(Correct Answer)</span>}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
