import * as profilesService from "./profiles.service.js";

export const getMe = async (req, res) => {
  const result = await profilesService.getOwnProfile(req.user.id);
  res.json(result);
};

export const updateMe = async (req, res) => {
  const result = await profilesService.updateProfile(req.user.id, req.body);
  res.json(result);
};

export const uploadAvatar = async (req, res) => {
  const buffer = req.body;
  const mimetype = req.headers["content-type"];
  const result = await profilesService.uploadAvatar(req.user.id, buffer, mimetype);
  res.json(result);
};

export const uploadProjectMedia = async (req, res) => {
  const buffer = req.body;
  const mimetype = req.headers["content-type"];
  const result = await profilesService.uploadProjectMedia(req.user.id, buffer, mimetype);
  res.json(result);
};

export const getProfile = async (req, res) => {
  const { userId } = req.params;
  const result = await profilesService.getProfileById(userId);
  res.json(result);
};

export const searchProfiles = async (req, res) => {
  const { q, skills, min_experience, max_experience, page, limit } = req.query;

  const filters = {
    q: typeof q === "string" && q.trim() ? q.trim() : undefined,
    excludeId: req.user.id, // don't match the searcher against themselves
    skills: skills ? (Array.isArray(skills) ? skills : [skills]) : [],
    min_experience: min_experience ? parseInt(min_experience) : undefined,
    max_experience: max_experience ? parseInt(max_experience) : undefined,
    page: page ? parseInt(page) : 1,
    limit: limit ? parseInt(limit) : 10,
  };

  const result = await profilesService.searchProfiles(filters);
  res.json(result);
};
