import React, { useEffect, useMemo, useRef, useState } from 'react';

const API_BASE = 'http://localhost:4000/api/tickets';

export default function App() {
  const [tickets, setTickets] = useState([]);
  const [plateNumber, setPlateNumber] = useState('');
  const [spotCode, setSpotCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [activeView, setActiveView] = useState('dashboard');
  const addSectionRef = useRef(null);
  const ticketsSectionRef = useRef(null);

  async function loadTickets() {
    try {
      setLoading(true);
      setError('');

      const res = await fetch(API_BASE);
      const data = await res.json();

      if (!res.ok) throw new Error('Failed to load tickets');

      setTickets(Array.isArray(data) ? data : data.items || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTickets();
  }, []);

  const activeTickets = useMemo(
    () => tickets.filter(t => t.status !== 'closed'),
    [tickets],
  );

  const stats = useMemo(() => ({
    total: activeTickets.length,
    parked: activeTickets.filter(t => t.status === 'parked').length,
    requested: activeTickets.filter(t => t.status === 'requested').length,
    ready: activeTickets.filter(t => t.status === 'ready').length,
    closed: tickets.filter(t => t.status === 'closed').length,
  }), [activeTickets, tickets]);


  function focusSection(view) {
    setActiveView(view);

    if (view === 'dashboard') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const target = view === 'tickets' ? ticketsSectionRef.current : addSectionRef.current;
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  async function createTicket(e) {
    e.preventDefault();

    if (!plateNumber || !spotCode) return;

    try {
      setSubmitting(true);

      await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plateNumber, spotCode }),
      });

      setPlateNumber('');
      setSpotCode('');
      loadTickets();
    } finally {
      setSubmitting(false);
    }
  }

  async function updateStatus(id, action) {
    await fetch(`${API_BASE}/${id}/${action}`, { method: 'PATCH' });
    loadTickets();
  }

  const isDashboardView = view === 'dashboard';
  const isTicketsView = view === 'tickets';
  const isAddView = view === 'add';

  return (
    <div className="app">
      <aside className="sidebar">
        <h2>🚗 Smart Valet</h2>
        <nav>
          <button
            className={activeView === 'dashboard' ? 'active' : ''}
            onClick={() => focusSection('dashboard')}
          >
            Dashboard
          </button>
          <button
            className={activeView === 'tickets' ? 'active' : ''}
            onClick={() => focusSection('tickets')}
          >
            Tickets
          </button>
          <button
            className={activeView === 'add' ? 'active' : ''}
            onClick={() => focusSection('add')}
          >
            Add
          </button>
        </nav>
      </aside>

      <main className="main">
        <header className="main-header">
          <h1>Dashboard</h1>
          <p>Operations snapshot for live parking activity.</p>
        </header>

        <div className="stats">
          <div className="card total">
            <span>Total Tickets</span>
            <strong>{stats.total}</strong>
          </div>
          <div className="card green">
            <span>Parked</span>
            <strong>{stats.parked}</strong>
          </div>
          <div className="card orange">
            <span>Requested</span>
            <strong>{stats.requested}</strong>
          </div>
          <div className="card purple">
            <span>Ready</span>
            <strong>{stats.ready}</strong>
          </div>
        </div>

        <div className="content">
          <form ref={addSectionRef} onSubmit={createTicket} className="panel form-panel">
            <h3>Add Vehicle</h3>

            <input
              placeholder="Plate Number"
              value={plateNumber}
              onChange={e => setPlateNumber(e.target.value)}
            />

            <input
              placeholder="Spot Code"
              value={spotCode}
              onChange={e => setSpotCode(e.target.value)}
            />

            <button disabled={submitting}>
              {submitting ? 'Saving...' : 'Add'}
            </button>
          </form>

          <div ref={ticketsSectionRef} className="panel table-panel">
            <h3>Tickets</h3>

            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Plate</th>
                  <th>Spot</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {tickets.map(t => (
                  <tr key={t.id}>
                    <td>{t.id}</td>
                    <td>{t.plateNumber}</td>
                    <td>{t.spotCode}</td>
                    <td>
                      <span className={`badge ${t.status}`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="actions-cell">
                      <button
                        className="action-btn"
                        disabled={t.status !== 'parked'}
                        onClick={() => updateStatus(t.id, 'request')}
                      >
                        Request
                      </button>

                      <button
                        className="action-btn"
                        disabled={t.status !== 'requested'}
                        onClick={() => updateStatus(t.id, 'ready')}
                      >
                        Ready
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {loading && <p className="table-note">Refreshing tickets...</p>}
          </div>
        )}

        <div className={`content ${isDashboardView ? '' : 'single-view'}`.trim()}>
          {(isDashboardView || isAddView) && (
            <form onSubmit={createTicket} className="panel form-panel">
              <h3>Add Vehicle</h3>

              <input
                placeholder="Plate Number"
                value={plateNumber}
                onChange={e => setPlateNumber(e.target.value)}
              />

              <input
                placeholder="Spot Code"
                value={spotCode}
                onChange={e => setSpotCode(e.target.value)}
              />

              <button disabled={submitting}>
                {submitting ? 'Saving...' : 'Add'}
              </button>
            </form>
          )}

          {(isDashboardView || isTicketsView) && (
            <div className="panel table-panel">
              <h3>Tickets</h3>

              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Plate</th>
                    <th>Spot</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {activeTickets.map(t => (
                    <tr key={t.id}>
                      <td>{t.id}</td>
                      <td>{t.plateNumber}</td>
                      <td>{t.spotCode}</td>
                      <td>
                        <span className={`badge ${t.status}`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="actions-cell">
                        <button
                          className="action-btn"
                          disabled={t.status !== 'parked'}
                          onClick={() => updateStatus(t.id, 'request')}
                        >
                          Request
                        </button>

                        <button
                          className="action-btn"
                          disabled={t.status !== 'requested'}
                          onClick={() => updateStatus(t.id, 'ready')}
                        >
                          Ready
                        </button>

                        {t.status === 'ready' && (
                          <button
                            className="action-btn"
                            onClick={() => updateStatus(t.id, 'handover')}
                          >
                            Handover
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {loading && <p className="table-note">Refreshing tickets...</p>}
            </div>
          )}
        </div>

        {error && <p className="error">{error}</p>}
      </main>
    </div>
  );
}
