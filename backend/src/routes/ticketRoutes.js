import { Router } from 'express';
import { createTicket, getTicket, listTickets, moveTicketStatus } from '../services/ticketService.js';

const router = Router();

router.get('/', (req, res, next) => {
  try {
    const items = listTickets(req.query.status);
    res.json({ items });
  } catch (error) {
    next(error);
  }
});

router.post('/', (req, res, next) => {
  try {
    const ticket = createTicket(req.body);
    res.status(201).json(ticket);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', (req, res, next) => {
  try {
    const ticket = getTicket(req.params.id);
    res.json(ticket);
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/request', (req, res, next) => {
  try {
    const ticket = moveTicketStatus(req.params.id, 'requested');
    res.json(ticket);
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/ready', (req, res, next) => {
  try {
    const ticket = moveTicketStatus(req.params.id, 'ready');
    res.json(ticket);
  } catch (error) {
    next(error);
  }
});

export default router;
