import { useEffect, useState } from 'react';

const API_BASE = 'http://localhost:4000/api/tickets';

function TicketRow({ ticket, onRequest, onReady }) {
  return (
    <tr>
      <td>{ticket.id}</td>
      <td>{ticket.plateNumber}</td>
      <td>{ticket.spotCode}</td>
      <td>{ticket.status}</td>
      <td>
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
      setError(data.error?.message || 'failed to create ticket');
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
      setError(data.error?.message || 'failed to update status');
      return;
    }

    refresh();
  }

  return (
    <main style={{ fontFamily: 'sans-serif', margin: '2rem' }}>
      <h1>Smart Valet Dashboard</h1>

      <form onSubmit={createTicket} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        <input
          value={plateNumber}
          onChange={(event) => setPlateNumber(event.target.value)}
          placeholder="Plate number"
        />
        <input
          value={spotCode}
          onChange={(event) => setSpotCode(event.target.value)}
          placeholder="Spot code"
        />
        <button type="submit">Park Vehicle</button>
      </form>

      {error ? <p style={{ color: 'crimson' }}>{error}</p> : null}

      <table cellPadding="8" style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr>
            <th align="left">Ticket</th>
            <th align="left">Plate</th>
            <th align="left">Spot</th>
            <th align="left">Status</th>
            <th align="left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {tickets.map((ticket) => (
            <TicketRow
              key={ticket.id}
              ticket={ticket}
              onRequest={(id) => updateStatus(id, 'request')}
              onReady={(id) => updateStatus(id, 'ready')}
            />
          ))}
        </tbody>
      </table>
    </main>
  );
}
