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

  const message = await messagingService.sendMessage(
    matchId,
    req.user.id,
    req.body,
  );
  res.status(201).json(message);
};

export const uploadAttachment = async (req, res) => {
  const { matchId } = req.params;

  // express.raw leaves an empty buffer when the Content-Type isn't in the
  // allowlist — treat that as an unsupported media type.
  if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
    return res.status(415).json({ error: "Unsupported or empty file" });
  }

  const mimetype = req.headers["content-type"];
  const rawName = req.headers["x-file-name"];
  const filename = rawName ? decodeURIComponent(rawName) : undefined;

  const result = await messagingService.uploadAttachment(
    matchId,
    req.user.id,
    req.body,
    mimetype,
    filename,
  );
  res.status(201).json(result);
};

export const getInbox = async (req, res) => {
  const inbox = await messagingService.getInbox(req.user.id);
  res.json(inbox);
};

export const setMute = async (req, res) => {
  const { matchId } = req.params;
  const { muted } = req.body;

  const state = await messagingService.setMatchMuted(
    matchId,
    req.user.id,
    muted,
  );
  res.json(state);
};

export const setHidden = async (req, res) => {
  const { matchId } = req.params;
  const { hidden } = req.body;

  const state = await messagingService.setMatchHidden(
    matchId,
    req.user.id,
    hidden,
  );
  res.json(state);
};

export const markRead = async (req, res) => {
  const { matchId } = req.params;
  const result = await messagingService.markMatchRead(matchId, req.user.id);
  res.json(result);
};
