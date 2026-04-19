import * as matchesService from "./matches.service.js";

export const listMatches = async (req, res) => {
  const result = await matchesService.getMatches(req.user.id);
  res.json(result);
};
