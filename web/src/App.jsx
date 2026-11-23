import { useEffect, useMemo, useState } from 'react';

const API = import.meta.env.VITE_API_URL || '';
const CATEGORIES = ['Todas', 'Reciclaje', 'Huerto', 'Movilidad', 'Limpieza', 'Educación'];
const icons = { Reciclaje: '♻', Huerto: '✿', Movilidad: '↗', Limpieza: '✦', Educación: '☼' };

export default function App() {
  const [activities, setActivities] = useState([]);
  const [summary, setSummary] = useState({ points: 0, count: 0, categories: {} });
  const [filter, setFilter] = useState('Todas');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ title: '', author: '', category: 'Reciclaje', description: '' });

  async function loadActivities(category = filter) {
    setLoading(true);
    try {
      const query = category === 'Todas' ? '' : `?category=${encodeURIComponent(category)}`;
      const response = await fetch(`${API}/api/activities${query}`);
      if (!response.ok) throw new Error('No pudimos cargar las actividades.');
      const data = await response.json(); setActivities(data.activities); setSummary(data.summary); setError('');
    } catch { setError('No se pudo conectar con el servidor. Intenta de nuevo en un momento.'); }
    finally { setLoading(false); }
  }
  useEffect(() => { loadActivities('Todas'); }, []);

  const topCategory = useMemo(() => Object.entries(summary.categories).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—', [summary]);
  async function submit(event) {
    event.preventDefault(); setSent(false); setError('');
    try {
      const response = await fetch(`${API}/api/activities`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      if (!response.ok) { const data = await response.json(); throw new Error(data.error || 'No se pudo guardar la actividad.'); }
      setForm({ title: '', author: '', category: 'Reciclaje', description: '' }); setSent(true); await loadActivities(filter);
    } catch (err) { setError(err.message); }
  }

  return <div className="app-shell">
    <header className="topbar"><a className="brand" href="#inicio" aria-label="Barrio Vivo inicio"><span className="brand-mark">b.</span><span>BARRIO<span className="brand-light">VIVO</span></span></a><nav><a href="#muro">El muro</a><a href="#sumate">Súmate</a><span className="nav-neighborhood"><i /> La Floresta, Quito</span></nav></header>
    <main id="inicio">
      <section className="hero"><div className="hero-copy"><div className="eyebrow"><span /> UNA COMUNIDAD, MIL POSIBILIDADES</div><h1>El cambio empieza<br />en <em>tu cuadra.</em></h1><p>Las pequeñas acciones hacen un barrio más verde, unido y lleno de vida. Comparte lo que haces e inspira a alguien más.</p><a className="button button-dark" href="#sumate">Comparte tu acción <span>↗</span></a><div className="hero-note"><span className="avatar-stack"><i>🌿</i><i>☀️</i><i>🌼</i></span><span>Una comunidad que ya se está moviendo</span></div></div><div className="hero-art"><div className="sun" /><div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="art-label">un barrio<br /><b>más vivo</b></div><div className="art-stat"><span>✳</span><div><strong>{summary.count}</strong><small>acciones<br />compartidas</small></div></div><div className="leaf leaf-one">✦</div><div className="leaf leaf-two">✿</div><div className="leaf leaf-three">⌁</div><div className="hill hill-back" /><div className="hill hill-front" /><div className="house house-one"><div /></div><div className="house house-two"><div /></div><div className="tree tree-one"><i /><b /></div><div className="tree tree-two"><i /><b /></div><div className="path" /></div></section>
      <section className="impact-strip" aria-label="Impacto de la comunidad"><div className="impact-intro">LO QUE LOGRAMOS<br />EN COMUNIDAD <span>↘</span></div><div className="metric"><strong>{summary.points.toLocaleString('es')}</strong><span>puntos de<br />impacto</span></div><div className="metric"><strong>{summary.count}</strong><span>acciones<br />compartidas</span></div><div className="metric"><strong>{topCategory}</strong><span>actividad favorita<br />del barrio</span></div><div className="metric tiny">Un gesto a la vez,<br />vamos más lejos <b>✳</b></div></section>
      <section className="board section" id="muro"><div className="section-heading"><div><div className="eyebrow">EL MURO DEL BARRIO <span>✳</span></div><h2>Buenas ideas<br /><em>se contagian.</em></h2></div><p>Un vistazo a todo lo bueno que está pasando cerca de ti. ¿Te animas a sumar la próxima?</p></div><div className="filter-row" aria-label="Filtrar actividades">{CATEGORIES.map(category => <button key={category} className={filter === category ? 'filter active' : 'filter'} onClick={() => { setFilter(category); loadActivities(category); }}>{category}</button>)}</div>
        {error && <p className="notice error" role="alert">{error}</p>}
        {loading ? <div className="empty-state">Cargando lo que hace vibrar al barrio…</div> : activities.length ? <div className="activity-grid">{activities.map((activity, index) => <article className={`activity-card card-${index % 3}`} key={activity.id}><div className="card-top"><span className="card-icon">{icons[activity.category] || '✳'}</span><span className="card-category">{activity.category}</span><span className="card-points">+{activity.points} pts</span></div><h3>{activity.title}</h3><p>{activity.description}</p><div className="card-footer"><span className="author-avatar">{activity.author.slice(0, 1).toUpperCase()}</span><span>{activity.author}</span><time>{new Date(activity.createdAt).toLocaleDateString('es', { day: 'numeric', month: 'short' })}</time></div></article>)}</div> : <div className="empty-state">Todavía no hay acciones aquí. Sé la primera persona en compartir una ✿</div>}
      </section>
      <section className="join section" id="sumate"><div className="join-copy"><div className="eyebrow">TU TURNO, VECINA/O <span>✳</span></div><h2>Una buena acción<br />merece ser <em>contada.</em></h2><p>¿Qué hiciste por tu comunidad esta semana? Cuéntanos y deja que tu energía inspire a alguien más.</p><div className="join-doodle">✳</div></div><form className="activity-form" onSubmit={submit}><label>¿Qué hiciste?<input aria-label="¿Qué hiciste?" required minLength="3" maxLength="80" placeholder="Ej. Plantamos flores en la esquina" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></label><div className="form-row"><label>Tu nombre<input aria-label="Tu nombre" required minLength="2" maxLength="40" placeholder="¿Cómo te llamas?" value={form.author} onChange={e => setForm({ ...form, author: e.target.value })} /></label><label>Tipo de acción<select aria-label="Tipo de acción" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>{CATEGORIES.slice(1).map(category => <option key={category}>{category}</option>)}</select></label></div><label>Cuéntanos un poquito más<textarea aria-label="Cuéntanos un poquito más" required minLength="8" maxLength="500" rows="3" placeholder="¿Cómo fue? ¿Quiénes participaron?" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></label><button className="button button-dark submit" type="submit">Compartir acción <span>↗</span></button>{sent && <p className="notice success" role="status">¡Gracias por hacer más vivo el barrio! Tu acción ya está en el muro. ✿</p>}{error && <p className="notice error" role="alert">{error}</p>}</form></section>
      <section className="closing"><span>✳</span><p>Lo que hacemos juntos<br /><em>se siente distinto.</em></p><span>✳</span></section>
    </main><footer><a className="brand" href="#inicio"><span className="brand-mark">b.</span><span>BARRIO<span className="brand-light">VIVO</span></span></a><span>Hecho con cariño para la vida de barrio.</span><span>Quito, Ecuador · 2026</span></footer>
  </div>;
}
