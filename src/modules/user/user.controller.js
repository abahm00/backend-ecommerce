import { handleError } from "../../middlewares/catchError.js";
import { User } from "./../../../database/models/user.model.js";

export const getUsers = handleError(async (req, res) => {
  let users = await User.find();
  res.json({ users });
});

export const updateUser = handleError(async (req, res) => {
  let user = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });
  res.json({ message: "updated", user });
});

export const deleteUser = handleError(async (req, res) => {
  let user = await User.findByIdAndDelete(req.params.id);
  res.json({ message: "deleted", user });
});
