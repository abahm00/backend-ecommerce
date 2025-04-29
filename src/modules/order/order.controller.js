import Stripe from "stripe";
import { Cart } from "../../../database/models/cart.model.js";
import { Order } from "../../../database/models/order.model.js";
import { Product } from "../../../database/models/product.model.js";
import { handleError } from "../../middlewares/catchError.js";
const stripe = new Stripe();

export const createCashOrder = handleError(async (req, res, next) => {
  let cart = await Cart.findById(req.params.id);
  if (!cart) {
    return next(new Error("cart not found"));
  }
  let totalOrderPrice = cart.totalPriceAfterDiscount || cart.totalPrice;
  let order = new Order({
    user: req.user._id,
    orderItems: cart.cartItems,
    totalOrderPrice,
    shippingAddress: req.body.shippingAddress,
  });
  await order.save();

  let options = cart.cartItems.map((item) => {
    return {
      updateOne: {
        filter: { _id: { $in: item.product } },
        update: {
          $inc: {
            stock: -item.quantity,
            sold: item.quantity,
          },
        },
      },
    };
  });

  await Product.bulkWrite(options);

  await Cart.findByIdAndDelete(cart._id);

  res.json({ message: "order created", order });
});

export const createCheckoutSession = handleError(async (req, res, next) => {
  let cart = await Cart.findById(req.params.id);
  if (!cart) {
    return next(new Error("cart not found"));
  }

  let totalOrderPrice = cart.totalPriceAfterDiscount || cart.totalPrice;

  let session = await stripe.checkout.sessions.create({
    line_items: [
      {
        price_data: {
          currency: "usd",
          unit_amount: totalOrderPrice * 100,
          product_data: {
            name: req.user.name,
          },
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: "http://localhost:3001/success",
    cancel_url: "http://localhost:3001/cancel",
    customer_email: req.user.email,
    client_reference_id: req.params.id,
    metadata: req.body.shippingAddress,
  });
  res.json({ message: "order created successfuly", session });
});

export const getOrderHistory = handleError(async (req, res, next) => {
  const orders = await Order.find({ user: req.user._id }).sort({
    createdAt: -1,
  });
  if (!orders.length) {
    return res.status(200).json({ message: "No orders found", orders: [] });
  }
  res.json({ results: orders.length, orders });
});
