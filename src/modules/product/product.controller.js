import { handleError } from "./../../middlewares/catchError.js";
import slugify from "slugify";
import { Product } from "../../../database/models/product.model.js";
import { Category } from "../../../database/models/category.model.js";

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

export const getAllProducts = handleError(async (req, res, next) => {
  let pageNum = req.query.page * 1 || 1;
  let limit = req.query.pageNum * 1 || 10;
  if (pageNum < 1) pageNum = 1;
  const skip = (pageNum - 1) * limit;

  let filterObj = {};

  if (req.query.category) {
    const category = await Category.findOne({ name: req.query.category });
    if (!category) {
      return next(new Error("Category not found"));
    }
    filterObj.category = category._id;
  }

  if (req.query.price) {
    const priceRange = req.query.price.split("-");
    if (priceRange.length === 2) {
      const minPrice = parseFloat(priceRange[0]);
      const maxPrice = parseFloat(priceRange[1]);
      if (!isNaN(minPrice) && !isNaN(maxPrice)) {
        filterObj.price = { $gte: minPrice, $lte: maxPrice };
      } else {
        return next(new Error("Invalid price range"));
      }
    } else {
      return next(new Error("Price range should be in the format 'min-max'"));
    }
  }

  if (req.query.rating) {
    filterObj.rateAvg = { $gte: parseFloat(req.query.rating) };
  }

  const excludedParams = [
    "page",
    "pageNum",
    "sort",
    "category",
    "price",
    "rating",
  ];
  const queryCopy = { ...req.query };
  excludedParams.forEach((param) => delete queryCopy[param]);

  let filterString = JSON.stringify(queryCopy);
  filterString = filterString.replace(
    /\b(gt|gte|lt|lte)\b/g,
    (match) => `$${match}`
  );
  const additionalFilters = JSON.parse(filterString);
  filterObj = { ...filterObj, ...additionalFilters };

  let sortBy = req.query.sort
    ? req.query.sort.split(",").join(" ")
    : "-createdAt";

  let products = await Product.find(filterObj)
    .skip(skip)
    .limit(limit)
    .sort(sortBy)
    .populate("category", "name");

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
