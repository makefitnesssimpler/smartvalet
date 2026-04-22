// Dashboard UI implementation
import { useEffect, useMemo, useState } from 'react';
import './App.css';

const API_BASE = 'http://localhost:4000/api/tickets';

function parseErrorMessage(data, fallback) {
  if (data && typeof data === 'object') {
    if (typeof data.message === 'string') return data.message;
    if (data.error && typeof data.error.message === 'string') return data.error.message;
  }
  return fallback;
}

function getCounts(tickets) {
  return tickets.reduce(
    (acc, ticket) => {
      acc.total += 1;
      if (ticket.status === 'parked') acc.parked += 1;
      if (ticket.status === 'requested') acc.requested += 1;
      if (ticket.status === 'ready') acc.ready += 1;
      return acc;
    },
    { total: 0, parked: 0, requested: 0, ready: 0 }
  );
}

function StatusBadge({ status }) {
  return <span className={`status-badge status-${status}`}>{status}</span>;
}

function TicketRow({ ticket, onRequest, onReady }) {
  return (
    <tr>
      <td className="mono">{ticket.id}</td>
      <td>{ticket.plateNumber}</td>
      <td>{ticket.spotCode}</td>
      <td>
        <StatusBadge status={ticket.status} />
      </td>
      <td>
        <div className="table-actions">
          <button
            type="button"
            className="btn btn-outline-blue"
            onClick={() => onRequest(ticket.id)}
            disabled={ticket.status !== 'parked'}
          >
            Request
          </button>
          <button
            type="button"
            className="btn btn-outline-orange"
            onClick={() => onReady(ticket.id)}
            disabled={ticket.status !== 'requested'}
          >
            Ready
          </button>
        </div>
      </td>
    </tr>
  );
}

function StatCard({ label, value, tone }) {
  return (
    <article className={`stat-card stat-${tone}`}>
      <p>{label}</p>
      <strong>{value}</strong>
    </article>
  );
}

export default function App() {
  const [tickets, setTickets] = useState([]);
  const [plateNumber, setPlateNumber] = useState('');
  const [spotCode, setSpotCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const counts = useMemo(() => getCounts(tickets), [tickets]);
  const now = useMemo(
    () =>
      new Date().toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short'
      }),
    [tickets.length]
  );

  async function refreshTickets() {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(API_BASE);
      const data = await response.json();

      if (!response.ok) {
        setError(parseErrorMessage(data, 'Failed to load tickets.'));
        return;
      }

      setTickets(Array.isArray(data.items) ? data.items : []);
    } catch (_err) {
      setError('Could not connect to backend at http://localhost:4000.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refreshTickets();
  }, []);

  async function handleCreateTicket(event) {
    event.preventDefault();
    setError('');

    if (!plateNumber.trim() || !spotCode.trim()) {
      setError('Plate number and spot code are required.');
      return;
    }

    try {
      const response = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plateNumber: plateNumber.trim(),
          spotCode: spotCode.trim()
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(parseErrorMessage(data, 'Failed to create ticket.'));
        return;
      }

      setPlateNumber('');
      setSpotCode('');
      refreshTickets();
    } catch (_err) {
      setError('Could not connect to backend at http://localhost:4000.');
    }
  }

  async function handleMoveStatus(ticketId, action) {
    setError('');

    try {
      const response = await fetch(`${API_BASE}/${ticketId}/${action}`, {
        method: 'PATCH'
      });

      const data = await response.json();

      if (!response.ok) {
        setError(parseErrorMessage(data, 'Failed to update ticket status.'));
        return;
      }

      refreshTickets();
    } catch (_err) {
      setError('Could not connect to backend at http://localhost:4000.');
    }
  }

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div>
          <div className="brand">
            <div className="brand-dot" />
            <div>
              <h1>Smart Valet</h1>
              <p>Operations Suite</p>
            </div>
          </div>

          <nav className="nav-list" aria-label="Dashboard navigation">
            <button type="button" className="nav-item nav-active">
              Overview
            </button>
            <button type="button" className="nav-item">
              Tickets
            </button>
            <button type="button" className="nav-item">
              Add Ticket
            </button>
            <button type="button" className="nav-item">
              About
            </button>
          </nav>
        </div>

        <div className="sidebar-info">
          <h3>Need a faster flow?</h3>
          <p>
            Use <strong>Refresh</strong> after each valet action to keep dispatch status synced in real time.
          </p>
        </div>
      </aside>

      <main className="content">
        <header className="content-header">
          <div>
            <h2>Dashboard Overview</h2>
            <p>Monitor vehicle handoff status and dispatch updates.</p>
          </div>
          <div className="datetime-card">
            <span>Current Time</span>
            <strong>{now}</strong>
          </div>
        </header>

        <section className="stats-grid">
          <StatCard label="Total Tickets" value={counts.total} tone="total" />
          <StatCard label="Parked" value={counts.parked} tone="parked" />
          <StatCard label="Requested" value={counts.requested} tone="requested" />
          <StatCard label="Ready" value={counts.ready} tone="ready" />
        </section>

        <section className="panel-grid">
          <div className="panel card-form">
            <div className="panel-title">
              <h3>Park New Vehicle</h3>
              <p>Create a ticket with plate and parking spot.</p>
            </div>

            <form onSubmit={handleCreateTicket} className="ticket-form">
              <label htmlFor="plateNumber">Plate Number</label>
              <input
                id="plateNumber"
                value={plateNumber}
                onChange={(event) => setPlateNumber(event.target.value)}
                placeholder="ABC-1234"
              />

              <label htmlFor="spotCode">Spot Code</label>
              <input
                id="spotCode"
                value={spotCode}
                onChange={(event) => setSpotCode(event.target.value)}
                placeholder="B2-17"
              />

              <button type="submit" className="btn btn-gradient">
                Park Vehicle
              </button>
            </form>

            <div className="tips-card">
              <h4>Quick Tips</h4>
              <ul>
                <li>Use standardized plate formats for easier lookup.</li>
                <li>Double-check spot code before saving each ticket.</li>
                <li>Move tickets quickly to avoid pickup queue delays.</li>
              </ul>
            </div>
          </div>

          <div className="panel card-table">
            <div className="panel-title panel-title-row">
              <div>
                <h3>All Tickets</h3>
                <p>Track statuses and process next actions.</p>
              </div>
              <button type="button" className="btn btn-outline-blue" onClick={refreshTickets} disabled={loading}>
                {loading ? 'Loading…' : 'Refresh'}
              </button>
            </div>

            {error ? <p className="error-banner">{error}</p> : null}

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Ticket ID</th>
                    <th>Plate</th>
                    <th>Spot</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="empty-state">
                        {loading ? 'Loading tickets…' : 'No tickets yet.'}
                      </td>
                    </tr>
                  ) : (
                    tickets.map((ticket) => (
                      <TicketRow
                        key={ticket.id}
                        ticket={ticket}
                        onRequest={(id) => handleMoveStatus(id, 'request')}
                        onReady={(id) => handleMoveStatus(id, 'ready')}
                      />
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
