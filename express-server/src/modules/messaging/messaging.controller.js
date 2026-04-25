import * as messagingService from "./messaging.service.js";

export const getMessages = async (req, res) => {
  const { matchId } = req.params;
  const from = parseInt(req.query.from) || 0;
  const to = parseInt(req.query.to) || 49;

  const messages = await messagingService.getMessages(
    matchId,
    req.user.id,
    from,
    to,
  );
  res.json(messages);
};

export const sendMessage = async (req, res) => {
  const { matchId } = req.params;
  const { content } = req.body;

  const message = await messagingService.sendMessage(
    matchId,
    req.user.id,
    content,
  );
  res.status(201).json(message);
};

export const getInbox = async (req, res) => {
  const inbox = await messagingService.getInbox(req.user.id);
  res.json(inbox);
};
