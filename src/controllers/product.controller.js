import Product from "../models/product.js";

/**
 * GET /api/products
 * Ambil semua product
 */
export const listProducts = async (req, res, next) => {
  try {
    const items = await Product.find().sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/products/:id
 */
export const getProduct = async (req, res, next) => {
  try {
    const item = await Product.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json(item);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/products
 */
export const createProduct = async (req, res, next) => {
  try {
    const { name, price, image, description, stock } = req.body;

    // ✅ VALIDASI DI SINI (BENAR)
    if (!name || price == null) {
      return res
        .status(400)
        .json({ message: "Field 'name' dan 'price' wajib diisi" });
    }

    const item = await Product.create({
      name,
      price,
      image,
      description,
      stock,
    });

    res.status(201).json(item);
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/products/:id
 */
export const updateProduct = async (req, res, next) => {
  try {
    const { name, price, image, description, stock } = req.body;

    if (!name || price == null) {
      return res
        .status(400)
        .json({ message: "Field 'name' dan 'price' wajib diisi" });
    }

    const item = await Product.findByIdAndUpdate(
      req.params.id,
      { name, price, image, description, stock },
      { new: true, runValidators: true }
    );

    if (!item) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(item);
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/products/:id
 */
export const deleteProduct = async (req, res, next) => {
  try {
    const item = await Product.findByIdAndDelete(req.params.id);
    if (!item) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json({ message: "Product deleted" });
  } catch (err) {
    next(err);
  }
};
