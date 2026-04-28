import React, { useEffect, useMemo, useRef, useState } from 'react';
import QRCode from 'qrcode.react';

const API_BASE = 'http://localhost:4000/api/tickets';
const CUSTOMER_PATH = '/customer-ticket';
const CUSTOMER_QR_BASE_URL = 'http://localhost:5173/customer-ticket';

function CustomerTicketPage({ ticketId }) {
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [requestMessage, setRequestMessage] = useState('');
  const [requesting, setRequesting] = useState(false);

  async function loadTicket() {
    if (!ticketId) {
      setError('Missing ticket id');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');
      const res = await fetch(`${API_BASE}/${ticketId}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || 'Failed to load ticket');
      }

      setTicket(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTicket();
  }, [ticketId]);

  async function requestVehicle() {
    if (!ticket?.id) return;

    try {
      setRequesting(true);
      setRequestMessage('');
      setError('');

      const res = await fetch(`${API_BASE}/${ticket.id}/request`, { method: 'PATCH' });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || 'Failed to request vehicle');
      }

      setTicket(data);
      setRequestMessage('Your vehicle has been requested.');
    } catch (err) {
      setError(err.message);
    } finally {
      setRequesting(false);
    }
  }

  return (
    <div className="customer-page">
      <div className="customer-panel">
        <h2>Smart Valet Ticket</h2>

        {loading && <p>Loading ticket...</p>}

        {!loading && ticket && (
          <>
            <p><strong>Ticket ID:</strong> {ticket.id}</p>
            <p><strong>Plate Number:</strong> {ticket.plateNumber}</p>
            <p>
              <strong>Current Status:</strong>{' '}
              <span className={`badge ${ticket.status}`}>{ticket.status}</span>
            </p>

            <button
              className="customer-request-btn"
              disabled={ticket.status !== 'parked' || requesting}
              onClick={requestVehicle}
            >
              {requesting ? 'Requesting...' : 'Request Vehicle'}
            </button>

            {requestMessage && <p className="success">{requestMessage}</p>}
          </>
        )}

        {error && <p className="error">{error}</p>}
      </div>
    </div>
  );
}

function ValetDashboard() {
  const [tickets, setTickets] = useState([]);
  const [plateNumber, setPlateNumber] = useState('');
  const [spotCode, setSpotCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [activeView, setActiveView] = useState('dashboard');
  const [visibleQrId, setVisibleQrId] = useState(null);
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

  const stats = useMemo(() => ({
    total: tickets.length,
    parked: tickets.filter((t) => t.status === 'parked').length,
    requested: tickets.filter((t) => t.status === 'requested').length,
    ready: tickets.filter((t) => t.status === 'ready').length,
  }), [tickets]);

  const activeTickets = useMemo(
    () => tickets.filter((ticket) => ticket.status !== 'closed'),
    [tickets]
  );

  function getCustomerUrl(ticketId) {
    return `${CUSTOMER_QR_BASE_URL}?id=${encodeURIComponent(ticketId)}`;
  }

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

      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plateNumber, spotCode }),
      });

      if (!res.ok) {
        throw new Error('Failed to create ticket');
      }

      setPlateNumber('');
      setSpotCode('');
      loadTickets();
    } catch (err) {
      setError(err.message);
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
              onChange={(e) => setPlateNumber(e.target.value)}
            />

            <input
              placeholder="Spot Code"
              value={spotCode}
              onChange={(e) => setSpotCode(e.target.value)}
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
                {activeTickets.map((t) => (
                  <React.Fragment key={t.id}>
                    <tr>
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

                        <button
                          className="action-btn"
                          onClick={() => setVisibleQrId(visibleQrId === t.id ? null : t.id)}
                        >
                          {visibleQrId === t.id ? 'Hide QR' : 'Show QR'}
                        </button>
                      </td>
                    </tr>

                    {visibleQrId === t.id && (
                      <tr>
                        <td colSpan={5}>
                          <div className="qr-row">
                            <QRCode value={getCustomerUrl(t.id)} size={140} />
                            <div className="qr-links">
                              <a href={getCustomerUrl(t.id)} target="_blank" rel="noreferrer">
                                Open customer ticket page
                              </a>
                              <code>{getCustomerUrl(t.id)}</code>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>

            {loading && <p className="table-note">Refreshing tickets...</p>}
          </div>
        </div>

        {error && <p className="error">{error}</p>}
      </main>
    </div>
  );
}

export default function App() {
  const pathName = window.location.pathname;
  const query = new URLSearchParams(window.location.search);
  const ticketId = query.get('id') || '';

  if (pathName === CUSTOMER_PATH) {
    return <CustomerTicketPage ticketId={ticketId} />;
  }

  return <ValetDashboard />;
}
