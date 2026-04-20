import { useEffect, useMemo, useState } from 'react';
import './App.css';

const API_BASE = '/api/tickets';

const STATUS_ORDER = ['parked', 'requested', 'ready'];

function statusCountMap(tickets) {
  return tickets.reduce(
    (acc, ticket) => {
      acc[ticket.status] = (acc[ticket.status] || 0) + 1;
      return acc;
    },
    { parked: 0, requested: 0, ready: 0 }
  );
}

function TicketRow({ ticket, onRequest, onReady }) {
  return (
    <tr>
      <td className="mono">{ticket.id}</td>
      <td>{ticket.plateNumber}</td>
      <td>{ticket.spotCode}</td>
      <td>
        <span className={`status status-${ticket.status}`}>{ticket.status}</span>
      </td>
      <td className="actions">
        <button onClick={() => onRequest(ticket.id)} disabled={ticket.status !== 'parked'}>
          Request
        </button>
        <button onClick={() => onReady(ticket.id)} disabled={ticket.status !== 'requested'}>
          Ready
        </button>
      </td>
    </tr>
  );
}

export default function App() {
  const [tickets, setTickets] = useState([]);
  const [plateNumber, setPlateNumber] = useState('');
  const [spotCode, setSpotCode] = useState('');
  const [error, setError] = useState('');

  const counts = useMemo(() => statusCountMap(tickets), [tickets]);

  async function refresh() {
    const res = await fetch(API_BASE);
    const data = await res.json();
    setTickets(data.items || []);
  }

  useEffect(() => {
    refresh();
  }, []);

  async function createTicket(event) {
    event.preventDefault();
    setError('');

    const res = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plateNumber, spotCode })
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error?.message || 'Failed to create ticket');
      return;
    }

    setPlateNumber('');
    setSpotCode('');
    refresh();
  }

  async function updateStatus(id, action) {
    setError('');

    const res = await fetch(`${API_BASE}/${id}/${action}`, { method: 'PATCH' });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error?.message || 'Failed to update status');
      return;
    }

    refresh();
  }

  return (
    <main className="page">
      <header className="page-header">
        <h1>Smart Valet Dashboard</h1>
        <p>Track valet tickets and advance lifecycle status quickly.</p>
      </header>

      <section className="summary-grid">
        {STATUS_ORDER.map((status) => (
          <article key={status} className={`summary-card summary-${status}`}>
            <h2>{status}</h2>
            <strong>{counts[status]}</strong>
          </article>
        ))}
      </section>

      <section className="panel">
        <h2>Park Vehicle</h2>
        <form onSubmit={createTicket} className="ticket-form">
          <label>
            Plate Number
            <input
              value={plateNumber}
              onChange={(event) => setPlateNumber(event.target.value)}
              placeholder="ABC-1234"
            />
          </label>
          <label>
            Spot Code
            <input
              value={spotCode}
              onChange={(event) => setSpotCode(event.target.value)}
              placeholder="B2-17"
            />
          </label>
          <button type="submit">Create Ticket</button>
        </form>
        {error ? <p className="error">{error}</p> : null}
      </section>

      <section className="panel">
        <div className="panel-header">
          <h2>Tickets</h2>
          <button onClick={refresh}>Refresh</button>
        </div>
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
                    No active tickets yet.
                  </td>
                </tr>
              ) : (
                tickets.map((ticket) => (
                  <TicketRow
                    key={ticket.id}
                    ticket={ticket}
                    onRequest={(nextId) => updateStatus(nextId, 'request')}
                    onReady={(nextId) => updateStatus(nextId, 'ready')}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
