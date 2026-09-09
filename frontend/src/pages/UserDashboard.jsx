import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, BookOpen, PlayCircle, RotateCcw, Layers, Loader2, CheckCircle2 } from 'lucide-react';
import { fetchApi } from '../api';
import NotificationBell from '../components/NotificationBell';

/**
 * User Dashboard Component.
 * Displays a list of available quizzes for the user to take.
 */
export default function UserDashboard({ user, setUser }) {
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState([]);
  const [myResults, setMyResults] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch available quizzes and user's results when the component mounts
  useEffect(() => {
    Promise.all([fetchQuizzes(), fetchMyResults()]).finally(() => setLoading(false));
  }, []);

  /**
   * Retrieves the list of quizzes from the backend API.
   */
  const fetchQuizzes = async () => {
    try {
      const data = await fetchApi('/quizzes');
      setQuizzes(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMyResults = async () => {
    try {
      const data = await fetchApi('/exams/my-results');
      setMyResults(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    setUser(null);
    navigate('/login');
  };

  return (
    <div className="dashboard-layout">
      <div className="sidebar">
        <div className="sidebar-brand">
          <Layers color="#10B981" />
          QuizMaster
        </div>
        
        <div className="sidebar-nav">
          <button className="nav-item active">
            <BookOpen size={20} /> My Quizzes
          </button>
        </div>

        <div style={{ marginTop: 'auto' }}>
          <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, #10B981, #7C3AED)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: 'white' }}>
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight: 600 }}>{user.username}</div>
              <div className="badge">USER</div>
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
            <h1 className="title">Welcome, {user.username}</h1>
            <p className="subtitle">Ready to test your knowledge today?</p>
          </div>
          <NotificationBell />
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
            <Loader2 className="lucide-spin" size={40} color="white" />
          </div>
        ) : (
          <div className="quiz-grid">
            {quizzes.map(quiz => {
              // Find all results for this quiz
              const resultsForQuiz = myResults.filter(r => r.quizId === quiz.id);
              // Get the most recent result if any
              const latestResult = resultsForQuiz.length > 0 
                ? resultsForQuiz.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))[0] 
                : null;
              
              const isTaken = !!latestResult;
              const cardStyle = isTaken ? { border: '1px solid #10B981', background: 'rgba(16, 185, 129, 0.05)' } : {};

              return (
                <div key={quiz.id} className="glass-panel quiz-card" style={cardStyle}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <h3>{quiz.title}</h3>
                    {isTaken && <CheckCircle2 color="#10B981" size={20} />}
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{quiz.description}</p>
                  
                  {isTaken && (
                    <div style={{ marginTop: '8px', padding: '8px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold', color: '#10B981' }}>
                      Highest Score: {Math.max(...resultsForQuiz.map(r => r.score))} / {quiz.questions?.length * 10}
                      <br/>
                      <span style={{ fontSize: '11px', fontWeight: 'normal', color: 'var(--text-secondary)' }}>
                        Last taken: {new Date(latestResult.submittedAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}

                  <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16 }}>
                    <span className="badge">{quiz.questions?.length || 0} Questions</span>
                    <button 
                      className={isTaken ? "" : "btn-accent"} 
                      onClick={() => navigate(`/quiz/${quiz.id}`)} 
                      style={{ 
                        padding: '8px 16px', 
                        background: isTaken ? 'transparent' : undefined,
                        border: isTaken ? '1px solid #10B981' : undefined,
                        color: isTaken ? '#10B981' : undefined,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        cursor: 'pointer',
                        borderRadius: '8px'
                      }}>
                      {isTaken ? (
                        <><RotateCcw size={16} /> Retake</>
                      ) : (
                        <><PlayCircle size={16} /> Start</>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
            
            {quizzes.length === 0 && (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--text-secondary)' }}>
                No quizzes available yet. Please wait for an Admin to create some.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
