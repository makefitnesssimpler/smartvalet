const tickets = [];

export function getAllTickets() {
  return tickets;
}

export function addTicket(ticket) {
  tickets.push(ticket);
  return ticket;
}

export function getTicketById(id) {
  return tickets.find((ticket) => ticket.id === id) || null;
}

export function updateTicket(id, patch) {
  const ticket = getTicketById(id);
  if (!ticket) return null;

  Object.assign(ticket, patch);
  return ticket;
}
