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
  const [now, setNow] = useState(new Date());

  // Fetch available quizzes and user's results when the component mounts
  useEffect(() => {
    Promise.all([fetchQuizzes(), fetchMyResults()]).finally(() => setLoading(false));
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
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
            {quizzes.filter(q => q.isActive).map(quiz => {
              // Find all results for this quiz
              const resultsForQuiz = myResults.filter(r => r.quizId === quiz.id);
              // Get the most recent result if any
              const latestResult = resultsForQuiz.length > 0 
                ? resultsForQuiz.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))[0] 
                : null;
              
              const isTaken = !!latestResult;
              const cardStyle = isTaken ? { border: '1px solid #10B981', background: 'rgba(16, 185, 129, 0.05)' } : {};

              return (
                <div key={quiz.id} className="glass-panel quiz-card" style={{ ...cardStyle, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 12 }}>
                    <strong style={{ color: '#f1f5f9', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                      {quiz.title}
                      {isTaken && <CheckCircle2 color="#10B981" size={18} />}
                    </strong>
                    
                    {(() => {
                        let isLocked = false;
                        let lockReason = "";
                        let timerText = "";
                        let isDanger = false;
                        let isReady = false;

                        if (quiz.startTime && now < new Date(quiz.startTime)) {
                            isLocked = true;
                            lockReason = "Coming Soon";
                        } else if (quiz.endTime && now > new Date(quiz.endTime)) {
                            isLocked = true;
                            lockReason = "Ended";
                        } else if (quiz.endTime) {
                            isReady = true;
                            const diff = new Date(quiz.endTime) - now;
                            const totalSeconds = Math.floor(diff / 1000);
                            const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
                            const s = (totalSeconds % 60).toString().padStart(2, '0');
                            timerText = `${m}:${s} left`;
                            isDanger = diff < 60000; // Less than 1 minute
                        } else {
                            isReady = true;
                            timerText = "Ready";
                        }

                        if (isLocked) {
                            return null; // Will show at the bottom instead
                        } else if (isReady && timerText !== "Ready") {
                             return (
                                <div style={{ background: isDanger ? 'rgba(239, 68, 68, 0.2)' : 'rgba(59, 130, 246, 0.2)', color: isDanger ? '#f87171' : '#60a5fa', padding: '6px 10px', borderRadius: 12, fontSize: '0.8rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 5, animation: isDanger ? 'pulse 1s infinite' : 'none' }}>
                                    <i className="fa-regular fa-clock"></i> {timerText}
                                </div>
                             );
                        } else {
                             return (
                                <div style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10B981', padding: '6px 10px', borderRadius: 12, fontSize: '0.8rem', fontWeight: 'bold' }}>
                                    Ready
                                </div>
                             );
                        }
                    })()}
                  </div>

                  <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: '0 0 15px 0' }}>{quiz.description}</p>
                  
                  {isTaken && (
                    <div style={{ padding: '8px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold', color: '#10B981' }}>
                      Highest Score: {Math.max(...resultsForQuiz.map(r => r.score))} / {quiz.questions?.length * 10}
                      <br/>
                      <span style={{ fontSize: '11px', fontWeight: 'normal', color: 'var(--text-secondary)' }}>
                        Last taken: {new Date(latestResult.submittedAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}

                  {(quiz.startTime || quiz.endTime) && (
                    <div style={{ marginTop: 10 }}>
                      <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                        {quiz.startTime ? `Open: ${new Date(quiz.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} ${new Date(quiz.startTime).toLocaleDateString()}` : ''} 
                        {quiz.startTime && quiz.endTime ? ' | ' : ''}
                        {quiz.endTime ? `Close: ${new Date(quiz.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} ${new Date(quiz.endTime).toLocaleDateString()}` : ''}
                      </div>
                      
                      {quiz.startTime && quiz.endTime && now >= new Date(quiz.startTime) && now <= new Date(quiz.endTime) && (
                        <div style={{ marginTop: 10, height: 8, background: '#334155', borderRadius: 4, overflow: 'hidden' }}>
                           {(() => {
                               const start = new Date(quiz.startTime).getTime();
                               const end = new Date(quiz.endTime).getTime();
                               const total = end - start;
                               const current = now.getTime() - start;
                               const percent = Math.min(100, Math.max(0, (current / total) * 100));
                               return <div style={{ height: '100%', width: `${percent}%`, background: 'var(--primary-color)', transition: 'width 1s linear' }}></div>
                           })()}
                        </div>
                      )}
                    </div>
                  )}

                  <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 20 }}>
                    <span style={{ padding: '6px 12px', background: 'rgba(16, 185, 129, 0.1)', color: '#10B981', borderRadius: 8, fontSize: '0.85rem', fontWeight: 600 }}>
                      {quiz.questions?.length || 0} Questions
                    </span>
                    
                    {(() => {
                      let isLocked = false;
                      let lockReason = "";
                      if (quiz.startTime && now < new Date(quiz.startTime)) {
                          isLocked = true;
                          lockReason = "Coming Soon";
                      }
                      if (quiz.endTime && now > new Date(quiz.endTime)) {
                          isLocked = true;
                          lockReason = "Ended";
                      }

                      if (isLocked) {
                        return (
                          <div style={{ padding: '6px 16px', fontSize: '0.9rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: 8, fontWeight: 'bold' }}>
                            {lockReason}
                          </div>
                        );
                      }

                      return (
                        <button 
                          onClick={() => navigate(`/quiz/${quiz.id}`)} 
                          style={{ 
                            padding: '8px 20px', 
                            background: '#10B981',
                            border: 'none',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            cursor: 'pointer',
                            borderRadius: '8px',
                            fontWeight: 'bold',
                            fontSize: '0.9rem',
                            transition: 'all 0.2s ease',
                            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                          }}
                          onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                          onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
                          >
                          {isTaken ? (
                            <><RotateCcw size={16} /> Retake</>
                          ) : (
                            <><PlayCircle size={16} /> Start</>
                          )}
                        </button>
                      );
                    })()}
                  </div>
                </div>
              );
            })}
            
            {quizzes.filter(q => q.isActive).length === 0 && (
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
