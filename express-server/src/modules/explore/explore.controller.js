import * as exploreService from "./explore.service.js";

export const getFeed = async (req, res) => {
  const { skills, min_experience, max_experience, limit } = req.query;

  const filters = {
    skills: skills ? (Array.isArray(skills) ? skills : [skills]) : [],
    min_experience: min_experience ? parseInt(min_experience) : undefined,
    max_experience: max_experience ? parseInt(max_experience) : undefined,
    limit: limit ? parseInt(limit) : 20,
  };

  const result = await exploreService.getExploreFeed(req.user.id, filters);
  res.json(result);
};
