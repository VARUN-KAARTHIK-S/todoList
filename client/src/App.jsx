import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './context/AuthContext';

const TODO_API = 'http://localhost:5000/api/todos';

function App() {
  const { user, login, register, logout, loading: authLoading, error: authError } = useAuth();

  const [todos, setTodos] = useState([]);
  const [task, setTask] = useState('');
  const [loading, setLoading] = useState(true);
  const [isRegister, setIsRegister] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [theme, setTheme] = useState(localStorage.getItem('todo-theme') || 'dark');
  const [formData, setFormData] = useState({
    username: '', password: '', email: '', year: '', Department: '', Age: ''
  });

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('todo-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(p => p === 'dark' ? 'light' : 'dark');

  /* ── Fetch todos ── */
  const fetchTodos = async () => {
    setLoading(true);
    try {
      const res = await axios.get(TODO_API);
      setTodos(res.data);
    } catch (err) {
      console.error('Fetch todos failed:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchTodos();
    else setLoading(false);
  }, [user]);

  /* ── CRUD ── */
  const handleAddTodo = async (e) => {
    e.preventDefault();
    if (!task.trim()) return;
    try {
      const res = await axios.post(TODO_API, { task });
      setTodos([res.data, ...todos]);
      setTask('');
    } catch (err) { console.error(err.message); }
  };

  const handleToggle = async (id, completed) => {
    try {
      const res = await axios.patch(`${TODO_API}/${id}`, { completed: !completed });
      setTodos(todos.map(t => t._id === id ? res.data : t));
    } catch (err) { console.error(err.message); }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${TODO_API}/${id}`);
      setTodos(todos.filter(t => t._id !== id));
    } catch (err) { console.error(err.message); }
  };

  /* ── Client-side validation (mirrors Joi schema) ── */
  const validate = () => {
    const errs = {};
    if (!formData.email.trim())                        errs.email      = 'Email is required.';
    else if (!/\S+@\S+\.\S+/.test(formData.email))    errs.email      = 'Enter a valid email address.';
    if (!formData.password)                            errs.password   = 'Password is required.';
    else if (formData.password.length < 6)             errs.password   = 'Password must be at least 6 characters.';
    if (isRegister) {
      if (!formData.username.trim())                   errs.username   = 'Username is required.';
      else if (formData.username.trim().length < 3)    errs.username   = 'Username must be at least 3 characters.';
      if (!formData.Department.trim())                 errs.Department = 'Department is required.';
      const yr  = Number(formData.year);
      const age = Number(formData.Age);
      if (!formData.year || isNaN(yr))                 errs.year       = 'Year is required.';
      if (!formData.Age  || isNaN(age) || age < 1)     errs.Age        = 'Age must be at least 1.';
    }
    return errs;
  };

  /* ── Auth submit ── */
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    const errs = validate();
    if (Object.keys(errs).length > 0) { setFieldErrors(errs); return; }
    setFieldErrors({});
    setIsSubmitting(true);

    try {
      if (isRegister) {
        const payload = {
          ...formData,
          year: Number(formData.year),
          Age:  Number(formData.Age),
        };
        console.log('[Register payload]', payload); // debug
        await register(payload);
      } else {
        console.log('[Login]', formData.email);     // debug
        await login(formData.email, formData.password);
      }
    } catch (_) {}
    finally { setIsSubmitting(false); }
  };

  /* ── Session check loading ── */
  if (authLoading) {
    return (
      <div style={{ textAlign: 'center' }}>
        <div className="spinner" style={{ margin: '0 auto 16px' }} />
        <p style={{ fontSize: '0.72rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(248,248,255,0.2)' }}>
          Restoring session
        </p>
      </div>
    );
  }

  /* ════════════════════════════════════════
     UNAUTHENTICATED — Auth Card
  ════════════════════════════════════════ */
  if (!user) {
    return (
      <>
        <button 
          onClick={toggleTheme}
          style={{
            position: 'fixed', top: '24px', right: '24px',
            width: '44px', height: '44px', borderRadius: '50%',
            background: 'var(--card)', border: '1px solid var(--input-border)',
            color: 'var(--text-primary)', cursor: 'pointer', zIndex: 100,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }}
        >
          {theme === 'dark' ? '☀' : '☾'}
        </button>

        <div className="card auth-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '32px' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '12px',
              background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 20px rgba(248,248,255,0.1)'
            }}>
              <span style={{ fontSize: '18px', color: 'var(--accent-text)' }}>✦</span>
            </div>
          </div>

          <h1 style={{
            fontSize: '1.6rem', fontWeight: 800, textAlign: 'center',
            color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: '6px'
          }}>
            {isRegister ? 'Create account' : 'Welcome back'}
          </h1>
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.82rem', marginBottom: '32px' }}>
            {isRegister ? 'Fill in the fields below to get started' : 'Sign in to access your tasks'}
          </p>

          <form onSubmit={handleAuthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {isRegister && (
              <>
                <div>
                  <input
                    type="text" placeholder="Username" className="input-field"
                    value={formData.username}
                    onChange={e => { setFormData({ ...formData, username: e.target.value }); setFieldErrors(p => ({...p, username: ''})); }}
                  />
                  {fieldErrors.username && <FieldErr msg={fieldErrors.username} />}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <input
                      type="number" placeholder="Year" className="input-field"
                      value={formData.year}
                      onChange={e => { setFormData({ ...formData, year: e.target.value }); setFieldErrors(p => ({...p, year: ''})); }}
                    />
                    {fieldErrors.year && <FieldErr msg={fieldErrors.year} />}
                  </div>
                  <div>
                    <input
                      type="number" placeholder="Age" className="input-field"
                      value={formData.Age}
                      onChange={e => { setFormData({ ...formData, Age: e.target.value }); setFieldErrors(p => ({...p, Age: ''})); }}
                    />
                    {fieldErrors.Age && <FieldErr msg={fieldErrors.Age} />}
                  </div>
                </div>
                <div>
                  <input
                    type="text" placeholder="Department" className="input-field"
                    value={formData.Department}
                    onChange={e => { setFormData({ ...formData, Department: e.target.value }); setFieldErrors(p => ({...p, Department: ''})); }}
                  />
                  {fieldErrors.Department && <FieldErr msg={fieldErrors.Department} />}
                </div>
              </>
            )}

            <div>
              <input
                type="email" placeholder="Email address" className="input-field"
                value={formData.email}
                onChange={e => { setFormData({ ...formData, email: e.target.value }); setFieldErrors(p => ({...p, email: ''})); }}
              />
              {fieldErrors.email && <FieldErr msg={fieldErrors.email} />}
            </div>
            <div>
              <input
                type="password" placeholder="Password" className="input-field"
                value={formData.password}
                onChange={e => { setFormData({ ...formData, password: e.target.value }); setFieldErrors(p => ({...p, password: ''})); }}
              />
              {fieldErrors.password && <FieldErr msg={fieldErrors.password} />}
            </div>

            {authError && <div className="error-box">{authError}</div>}

            <button type="submit" className="btn-snow" disabled={isSubmitting} style={{ marginTop: '12px' }}>
              {isSubmitting ? 'Processing…' : (isRegister ? 'Register' : 'Sign In')}
            </button>
          </form>

          <div className="divider" style={{ margin: '24px 0' }} />
          <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            {isRegister ? 'Already have an account?' : 'New here?'}
            <button onClick={() => setIsRegister(!isRegister)} style={{ background: 'none', border: 'none', color: 'var(--text-primary)', fontWeight: 700, marginLeft: '6px', cursor: 'pointer', textDecoration: 'underline' }}>
              {isRegister ? 'Sign In' : 'Create Account'}
            </button>
          </p>
        </div>
      </>
    );
  }

  /* ════════════════════════════════════════
     AUTHENTICATED — Todo Card
  ════════════════════════════════════════ */
  const done = todos.filter(t => t.completed).length;
  const pct  = todos.length ? (done / todos.length) * 100 : 0;

  return (
    <>
      <button 
        onClick={toggleTheme}
        style={{
          position: 'fixed', top: '24px', right: '24px',
          width: '44px', height: '44px', borderRadius: '50%',
          background: 'var(--card)', border: '1px solid var(--input-border)',
          color: 'var(--text-primary)', cursor: 'pointer', zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}
      >
        {theme === 'dark' ? '☀' : '☾'}
      </button>

      <div className="card todo-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '14px', color: 'var(--accent-text)' }}>✦</span>
              </div>
              <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Task Center</h1>
            </div>
            <div className="badge">{user.username}</div>
          </div>
          <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'flex-end' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px', color: 'var(--text-primary)' }}>
              <span style={{ fontSize: '2rem', fontWeight: 900 }}>{done}</span>
              <span style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>/{todos.length}</span>
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>tasks completed</div>
            <button onClick={logout} className="btn-snow" style={{ padding: '6px 20px', width: 'auto', fontSize: '0.7rem', background: 'var(--input-bg)', color: 'var(--text-primary)', border: '1px solid var(--input-border)', minWidth: '90px' }}>Logout</button>
          </div>
        </div>

        <div className="progress-track" style={{ marginBottom: '24px' }}>
          <div className="progress-fill" style={{ width: `${pct}%` }} />
        </div>

        <form onSubmit={handleAddTodo} style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
          <input type="text" placeholder="Add a task…" className="input-field" value={task} onChange={e => setTask(e.target.value)} style={{ flex: 1 }} />
          <button type="submit" style={{ width: '46px', height: '46px', borderRadius: '12px', border: '1px solid var(--input-border)', cursor: 'pointer', background: 'var(--accent)', color: 'var(--accent-text)', fontSize: '1.4rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
        </form>

        {loading ? <div className="spinner" style={{ margin: '32px auto' }} /> : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '400px', overflowY: 'auto' }}>
            {todos.map(todo => (
              <li key={todo._id} className="todo-item">
                <div className={`cb ${todo.completed ? 'checked' : ''}`} onClick={() => handleToggle(todo._id, todo.completed)}>{todo.completed && <CheckIcon />}</div>
                <span style={{ flex: 1, fontSize: '0.9rem', color: todo.completed ? 'var(--text-secondary)' : 'var(--text-primary)', textDecoration: todo.completed ? 'line-through' : 'none' }}>{todo.task}</span>
                <button onClick={() => handleDelete(todo._id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '6px' }}><TrashIcon /></button>
              </li>
            ))}
            {todos.length === 0 && <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '32px' }}>No tasks found.</p>}
          </ul>
        )}
      </div>
    </>
  );
}

/* ── Components ── */
const FieldErr = ({ msg }) => <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '4px' }}>✕ {msg}</p>;
const CheckIcon = () => <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" strokeWidth="4" fill="none"><polyline points="20 6 9 17 4 12" /></svg>;
const TrashIcon = () => <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>;

export default App;
