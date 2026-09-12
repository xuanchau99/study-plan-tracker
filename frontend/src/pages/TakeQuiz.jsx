import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchApi } from '../api';
import { ArrowLeft, CheckCircle, Clock, Save, Loader2 } from 'lucide-react';

/**
 * Exam Interface Component.
 * Displays questions and handles the ultra-fast auto-saving mechanism via Redis.
 */
export default function TakeQuiz({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    loadQuiz();
  }, [id]);

  useEffect(() => {
    if (!quiz) return;
    
    // Initial check
    const now = new Date();
    if (quiz.startTime && now < new Date(quiz.startTime)) {
      setIsLocked(true);
      setError("Quiz has not started yet.");
      return;
    }
    if (quiz.endTime && now > new Date(quiz.endTime)) {
      setIsLocked(true);
      setError("Quiz has already ended.");
      return;
    }

    // Set up timer if endTime exists
    if (quiz.endTime) {
      const timer = setInterval(() => {
        const currentTime = new Date();
        const end = new Date(quiz.endTime);
        const diff = end - currentTime;
        
        if (diff <= 0) {
          clearInterval(timer);
          setTimeLeft(0);
          setIsLocked(true);
          // Auto submit
          if (!submitted && !submitting) {
             handleSubmit();
          }
        } else {
          setTimeLeft(diff);
        }
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [quiz, submitted, submitting]);

  const formatTime = (ms) => {
    if (ms === null) return null;
    if (ms <= 0) return "00:00";
    const totalSeconds = Math.floor(ms / 1000);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    return h > 0 ? `${h}:${m}:${s}` : `${m}:${s}`;
  };

  const loadQuiz = async () => {
    try {
      const data = await fetchApi(`/quizzes/${id}`);
      setQuiz(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fires every time a user clicks an option.
   * Hits the Redis auto-save API instead of updating the main database.
   */
  const handleSelectOption = async (questionId, option) => {
    if (isLocked) return;
    // Update local state for immediate UI feedback
    setAnswers(prev => ({ ...prev, [questionId]: option }));
    
    // Call Auto-save API (Redis) - non-blocking
    try {
      await fetchApi(`/exams/${id}/questions/${questionId}/answers`, {
        method: 'POST',
        body: JSON.stringify({ answer: option })
      });
      console.log(`Auto-saved answer for Q${questionId}`);
    } catch (err) {
      console.error('Auto-save failed:', err);
    }
  };

  /**
   * Submits the final exam to the message queue.
   */
  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await fetchApi(`/exams/${id}/submit`, {
        method: 'POST'
      });
      // Backend responds immediately with 202 ACCEPTED (RabbitMQ handles grading)
      setSubmitted(true);
    } catch (err) {
      alert('Submit failed: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="auth-container"><Loader2 className="lucide-spin" size={40} color="white" /></div>;
  }

  if (error) {
    return (
      <div className="auth-container">
        <div className="glass-panel" style={{ textAlign: 'center' }}>
          <h2 style={{ color: '#ef4444' }}>Oops!</h2>
          <p>{error}</p>
          <button className="btn-primary" onClick={() => navigate('/user')} style={{ marginTop: 20 }}>Go Back</button>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="auth-container">
        <div className="glass-panel" style={{ textAlign: 'center', maxWidth: 400 }}>
          <CheckCircle size={60} color="#10B981" style={{ margin: '0 auto 20px' }} />
          <h2 style={{ marginBottom: 16 }}>Exam Submitted!</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
            Your exam has been submitted to the queue. The grading processor is working on it.
          </p>
          <button className="btn-primary" onClick={() => navigate('/user')}>Return to Dashboard</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 20px' }}>
      <button className="btn-primary" style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', marginBottom: 24 }} onClick={() => navigate(-1)}>
        <ArrowLeft size={18} /> Back
      </button>

      <div className="page-header">
        <div>
          <h1 className="title">{quiz.title}</h1>
          <p className="subtitle">{quiz.description}</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-end' }}>
          {timeLeft !== null && (
            <div className="badge" style={{ background: timeLeft < 60000 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(59, 130, 246, 0.2)', color: timeLeft < 60000 ? '#f87171' : '#60a5fa', fontSize: 16, padding: '8px 16px' }}>
              <Clock size={18} style={{ marginRight: 8 }} />
              {formatTime(timeLeft)}
            </div>
          )}
          <div className="badge">
            <CheckCircle size={14} style={{ marginRight: 6 }} /> Auto-saving enabled
          </div>
        </div>
      </div>

      <div className="questions-list" style={{ position: 'relative' }}>
        {isLocked && timeLeft === 0 && (
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(2px)', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 16 }}>
             <div style={{ background: 'rgba(239, 68, 68, 0.9)', padding: '20px 40px', borderRadius: 12, textAlign: 'center', boxShadow: '0 10px 25px rgba(239, 68, 68, 0.3)' }}>
               <i className="fa-solid fa-lock" style={{ fontSize: 32, marginBottom: 10 }}></i>
               <h2 style={{ margin: 0 }}>Time's Up!</h2>
               <p style={{ margin: '5px 0 0 0' }}>Auto-submitting your exam...</p>
             </div>
          </div>
        )}
        {quiz.questions.map((q, index) => (
          <div key={q.id} className="glass-panel question-container">
            <h3 style={{ marginBottom: 16 }}>
              <span style={{ color: 'var(--primary-color)', marginRight: 8 }}>Q{index + 1}.</span> 
              {q.details.questionText || q.details.keyword}
            </h3>
            
            {q.details.imageUrl && (
              <img src={q.details.imageUrl} alt="hint" style={{ width: '100%', maxHeight: 300, objectFit: 'cover', borderRadius: 8, marginBottom: 16 }} />
            )}

            <div className="options-grid">
              {q.details.options.map((opt, i) => {
                const isSelected = answers[q.id] === opt;
                return (
                  <div 
                    key={i} 
                    className={`option-row ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleSelectOption(q.id, opt)}
                  >
                    <div style={{ 
                      width: 20, height: 20, borderRadius: '50%', 
                      border: `2px solid ${isSelected ? 'var(--primary-color)' : 'var(--text-secondary)'}`,
                      background: isSelected ? 'var(--primary-color)' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      {isSelected && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'white' }} />}
                    </div>
                    <span>{opt}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="glass-panel flex-between" style={{ position: 'sticky', bottom: 20, marginTop: 40, background: 'rgba(15, 17, 26, 0.9)' }}>
        <div>
          <div style={{ fontWeight: 600 }}>Ready to finish?</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Make sure you answered everything.</div>
        </div>
        <button className="btn-accent" onClick={handleSubmit} disabled={submitting}>
          {submitting ? <Loader2 className="lucide-spin" size={18} /> : <Save size={18} />}
          {submitting ? 'Submitting...' : 'Submit Exam'}
        </button>
      </div>
    </div>
  );
}
