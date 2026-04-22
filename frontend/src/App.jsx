import { useEffect, useState } from 'react';
import './App.css';

const API_BASE = 'http://localhost:4000/api/tickets';

function parseErrorMessage(data, fallback) {
  if (data && typeof data === 'object') {
    if (typeof data.message === 'string') return data.message;
    if (data.error && typeof data.error.message === 'string') return data.error.message;
  }
  return fallback;
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
  const [loading, setLoading] = useState(false);

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
    <main className="page">
      <header className="page-header">
        <h1>Smart Valet Dashboard</h1>
        <p>Create tickets and move them from parked → requested → ready.</p>
      </header>

      <section className="panel">
        <h2>Park Vehicle</h2>
        <form onSubmit={handleCreateTicket} className="ticket-form">
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
      </section>

      <section className="panel">
        <div className="panel-header">
          <h2>Tickets</h2>
          <button onClick={refreshTickets} disabled={loading}>
            {loading ? 'Loading…' : 'Refresh'}
          </button>
        </div>

        {error ? <p className="error">{error}</p> : null}

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
      </section>
    </main>
  );
}
