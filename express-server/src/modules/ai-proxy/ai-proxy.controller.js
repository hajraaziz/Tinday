import * as aiProxyService from "./ai-proxy.service.js";

export const recommend = async (req, res) => {
  const { skills, min_experience, max_experience, limit } = req.query;
  const filters = {
    skills: skills ? (Array.isArray(skills) ? skills : [skills]) : undefined,
    min_experience: min_experience ? parseInt(min_experience) : undefined,
    max_experience: max_experience ? parseInt(max_experience) : undefined,
    limit: limit ? parseInt(limit) : 20,
  };

  const profiles = await aiProxyService.recommend(req.user.id, filters);
  res.json(profiles);
};

export const chat = async (req, res) => {
  const { message, conversation_history } = req.body;
  await aiProxyService.chat(req.user.id, message, conversation_history, res);
};

export const shareProfile = async (req, res) => {
  const { profile_id } = req.body;
  const analysis = await aiProxyService.shareProfile(req.user.id, profile_id);
  res.json(analysis);
};
