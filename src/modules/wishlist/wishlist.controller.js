import { User } from "../../../database/models/user.model.js";
import { handleError } from "../../middlewares/catchError.js";

export const addWishList = handleError(async (req, res) => {
  let wishList = await User.findOneAndUpdate(
    req.user._id,
    {
      $addToSet: {
        wishlist: req.body.product,
      },
    },
    {
      new: true,
    }
  );
  res.json({ message: "added to wishlist", wishList: wishList.wishlist });
});

export const removeFromWishList = handleError(async (req, res, next) => {
  let wishList = await User.findOneAndUpdate(
    req.user._id,
    {
      $pull: {
        wishlist: req.body.product,
      },
    },
    {
      new: true,
    }
  );
  if (!wishList) {
    return next(new Error("product not found"));
  }
  res.json({ message: "wishlist updated", wishList: wishList.wishlist });
});

export const getWishList = handleError(async (req, res) => {
  let wishList = await User.findById(req.user._id);
  res.json({ wishList: wishList.wishlist });
});
