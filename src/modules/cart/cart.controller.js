import { Cart } from "../../../database/models/cart.model.js";
import { Coupon } from "../../../database/models/coupon.model.js";
import { Product } from "../../../database/models/product.model.js";
import { handleError } from "../../middlewares/catchError.js";

function calTotalPrice(cart) {
  cart.totalPrice = cart.cartItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );
}

export const addToCart = handleError(async (req, res, next) => {
  let isCartExist = await Cart.findOne({ user: req.user._id });

  let product = await Product.findById(req.body.product);

  if (!isCartExist) {
    let cart = new Cart({ user: req.user._id, cartItems: [req.body] });
    calTotalPrice(cart);
    await cart.save();
    res.json({ message: "added to cart", cart });
  } else {
    let item = isCartExist.cartItems.find(
      (item) => item.product == req.body.product
    );

    if (item) {
      item.quantity += req.body.quantity;
      if (item.quantity > product.stock) {
        return next(new Error("out of stock"));
      }
    }
    if (!item) {
      isCartExist.cartItems.push(req.body);
    }
    calTotalPrice(isCartExist);
    await isCartExist.save();

    res.json({ message: "added to cart", cart: isCartExist });
  }
});

export const updateQuantity = handleError(async (req, res, next) => {
  let cart = await Cart.findOne({ user: req.user._id });
  let item = cart.cartItems.find((item) => item._id == req.body.product);

  if (!item) {
    return next(new Error("item not found"));
  }
  item.quantity = req.body.quantity;
  calTotalPrice(cart);

  await cart.save();
  res.json({ message: "updated", cart });
});

export const removeFromCart = handleError(async (req, res, next) => {
  let cart = await Cart.findOne({ user: req.user._id });
  let item = cart.cartItems.find((item) => item._id == req.body.product);
  if (!item) {
    return next(new Error("item not found"));
  }
  cart.cartItems.pull(item);
  calTotalPrice(cart);
  await cart.save();
  res.json({ message: "removed", cart });
});

export const getCart = handleError(async (req, res) => {
  let cart = await Cart.findOne({ user: req.user._id });
  res.json({ cart });
});

export const applyCoupon = handleError(async (req, res, next) => {
  let coupon = await Coupon.findOne({
    code: req.body.code,
    expires: { $gt: Date.now() },
  });
  if (!coupon) {
    return next(new Error("coupon invalid"));
  }
  let cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    return next(new Error("cart not found"));
  }
  cart.coupon = coupon;
  cart.totalPriceAfterDiscount =
    cart.totalPrice - (cart.totalPrice * coupon.discount) / 100;
  cart.discount = coupon.discount;
  await cart.save();
  res.json({ message: "coupon applied", cart });
});
