import { addTicket, getAllTickets, getTicketById, updateTicket } from '../data/ticketStore.js';

const VALID_TRANSITIONS = {
  parked: 'requested',
  requested: 'ready',
  ready: 'closed',
  closed: null
};

function nowIso() {
  return new Date().toISOString();
}

function nextId() {
  return `tkt_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
}

export function listTickets(status) {
  const tickets = getAllTickets();
  if (!status) return tickets;
  return tickets.filter((ticket) => ticket.status === status);
}

export function createTicket(input) {
  if (!input.plateNumber || !input.spotCode) {
    const err = new Error('plateNumber and spotCode are required');
    err.status = 400;
    throw err;
  }

  const createdAt = nowIso();
  const ticket = {
    id: nextId(),
    plateNumber: input.plateNumber,
    spotCode: input.spotCode,
    vehicleType: input.vehicleType || 'other',
    status: 'parked',
    createdAt,
    updatedAt: createdAt,
    requestedAt: null,
    readyAt: null
  };

  return addTicket(ticket);
}

export function getTicket(id) {
  const ticket = getTicketById(id);
  if (!ticket) {
    const err = new Error('ticket not found');
    err.status = 404;
    throw err;
  }
  return ticket;
}

export function moveTicketStatus(id, targetStatus) {
  const ticket = getTicket(id);
  const allowed = VALID_TRANSITIONS[ticket.status];

  if (allowed !== targetStatus) {
    const err = new Error(`invalid transition from ${ticket.status} to ${targetStatus}`);
    err.status = 409;
    throw err;
  }

  const patch = {
    status: targetStatus,
    updatedAt: nowIso()
  };

  if (targetStatus === 'requested') {
    patch.requestedAt = patch.updatedAt;
  }

  if (targetStatus === 'ready') {
    patch.readyAt = patch.updatedAt;
  }

  return updateTicket(id, patch);
}
