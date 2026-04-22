import React, { useEffect, useMemo, useState } from 'react';

const API_BASE = 'http://localhost:4000/api/tickets';

export default function App() {
  const [tickets, setTickets] = useState([]);
  const [plateNumber, setPlateNumber] = useState('');
  const [spotCode, setSpotCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

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

  const stats = useMemo(() => ({
    total: tickets.length,
    parked: tickets.filter(t => t.status === 'parked').length,
    requested: tickets.filter(t => t.status === 'requested').length,
    ready: tickets.filter(t => t.status === 'ready').length,
  }), [tickets]);

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

  return (
    <div className="app">
      <aside className="sidebar">
        <h2>🚗 Smart Valet</h2>
        <nav>
          <button className="active">Dashboard</button>
          <button>Tickets</button>
          <button>Add</button>
        </nav>
      </aside>

      <main className="main">
        <header>
          <h1>Dashboard</h1>
        </header>

        <div className="stats">
          <div className="card">Total<br /><strong>{stats.total}</strong></div>
          <div className="card green">Parked<br /><strong>{stats.parked}</strong></div>
          <div className="card orange">Requested<br /><strong>{stats.requested}</strong></div>
          <div className="card purple">Ready<br /><strong>{stats.ready}</strong></div>
        </div>

        <div className="content">
          <form onSubmit={createTicket} className="panel">
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

          <div className="panel">
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
                    <td>
                      <button
                        disabled={t.status !== 'parked'}
                        onClick={() => updateStatus(t.id, 'request')}
                      >
                        Request
                      </button>

                      <button
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

          </div>
        </div>

        {error && <p className="error">{error}</p>}
      </main>
    </div>
  );
}
