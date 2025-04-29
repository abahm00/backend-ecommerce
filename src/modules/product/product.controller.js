import { handleError } from "./../../middlewares/catchError.js";
import slugify from "slugify";
import { Product } from "../../../database/models/product.model.js";

export const addProduct = handleError(async (req, res, next) => {
  req.body.createdBy = req.user._id;
  let exist = await Product.findOne({ title: req.body.title });

  if (exist) {
    return next(new Error("product already exists"));
  }

  if (!req.files?.imgCover) {
    return next(new Error("imgCover file is required"));
  }

  req.body.imgCover = req.files.imgCover[0].filename;

  if (req.files.images) {
    req.body.images = req.files.images.map((file) => file.filename);
  }

  if (req.files.images) {
    req.body.images = req.files.images.map((file) => file.filename);
  }

  req.body.slug = slugify(req.body.title);
  let product = new Product(req.body);

  await product.save();

  res.json({ message: "Product added", product });
});

export const getAllProducts = handleError(async (req, res) => {
  let pageNum = req.query.page * 1 || 1;
  let limit = req.query.pageNum * 1 || 2;
  if (pageNum < 1) pageNum = 1;

  const skip = (pageNum - 1) * limit;

  let filterObj = {};

  if (req.query.category) {
    filterObj.category = req.query.category;
  }

  if (req.query.price) {
    const priceRange = req.query.price.split("-");
    if (priceRange.length === 2) {
      const [minPrice, maxPrice] = priceRange.map(Number);
      filterObj.price = { $gte: minPrice, $lte: maxPrice };
    }
  }

  if (req.query.rating) {
    filterObj.rating = { $gte: req.query.rating * 1 };
  }

  let filterString = structuredClone(req.query);
  filterString = JSON.stringify(filterString);
  filterString = filterString.replace(
    /(gt|gte|lt|lte)/g,
    (match) => `$${match}`
  );
  filterObj = { ...filterObj, ...JSON.parse(filterString) };

  let sortBy = req.query.sort
    ? req.query.sort.split(",").join(" ")
    : "-createdAt";

  let mongoQuery = Product.find(filterObj).skip(skip).limit(limit).sort(sortBy);

  let products = await mongoQuery;

  const totalProducts = await Product.countDocuments(filterObj);
  const totalPages = Math.ceil(totalProducts / limit);

  res.json({
    products,
    pagination: {
      currentPage: pageNum,
      totalPages,
      totalProducts,
      limit,
    },
  });
});

export const updateProduct = handleError(async (req, res, next) => {
  const exists = await Product.findById(req.params.id);
  if (!exists) {
    next(new Error("doesn't exist"));
  }
  if (req.body.title) {
    req.body.slug = slugify(req.body.title);
  }
  let product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });
  res.json({ message: "updated", product });
});

export const deleteProduct = handleError(async (req, res, next) => {
  const exists = await Product.findById(req.params.id);
  if (!exists) {
    next(new Error("doesn't exist"));
  }
  let product = await Product.findByIdAndDelete(req.params.id);
  res.json({ message: "deleted", product });
});
