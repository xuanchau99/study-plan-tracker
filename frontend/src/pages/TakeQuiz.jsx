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

  useEffect(() => {
    loadQuiz();
  }, [id]);

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
        <div className="badge">
          <Clock size={16} /> Auto-saving enabled
        </div>
      </div>

      <div className="questions-list">
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
