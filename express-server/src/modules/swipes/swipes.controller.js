import * as swipesService from "./swipes.service.js";

export const createSwipe = async (req, res) => {
  const { receiver_id, direction } = req.body;

  if (receiver_id === req.user.id) {
    return res.status(400).json({ error: "You cannot swipe on yourself" });
  }

  const result = await swipesService.recordSwipe(req.user.id, receiver_id, direction);
  res.status(201).json(result);
};
