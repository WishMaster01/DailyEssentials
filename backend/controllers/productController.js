import mongoose from "mongoose";
import { v2 as cloudinary } from "cloudinary";
import Product from "../models/Product.js";

// ADD PRODUCT
export const addProduct = async (req, res) => {
  try {
    // Validate request
    if (!req.files || !req.body.productData) {
      return res.status(400).json({
        success: false,
        message: 'Product data and images are required'
      });
    }

    const productData = JSON.parse(req.body.productData);
    
    // Basic validation
    if (!productData.name || !productData.price) {
      return res.status(400).json({
        success: false,
        message: 'Required fields are missing'
      });
    }

    // Upload images to Cloudinary
    const imagesURL = await Promise.all(
      req.files.map(async (file) => {
        try {
          const result = await cloudinary.uploader.upload(file.path, {
            folder: 'products',
            resource_type: 'image'
          });
          return result.secure_url;
        } catch (uploadError) {
          console.error('Image upload error:', uploadError);
          throw new Error('Failed to upload some images');
        }
      })
    );

    // Create product with validation
    const product = await Product.create({
      ...productData,
      image: imagesURL,
      inStock: productData.inStock !== false // Default to true
    });

    res.status(201).json({
      success: true,
      message: 'Product added successfully',
      productId: product._id
    });

  } catch (error) {
    console.error('Product addition error:', error);
    res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === 'development' 
        ? error.message 
        : 'Failed to add product'
    });
  }
};

// GET PRODUCT LIST (with pagination and filtering)
export const productList = async (req, res) => {
  try {
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Filtering
    const filter = {};
    if (req.query.category) {
      filter.category = req.query.category;
    }
    if (req.query.inStock) {
      filter.inStock = req.query.inStock === 'true';
    }

    // Sorting
    const sort = {};
    if (req.query.sortBy) {
      sort[req.query.sortBy] = req.query.sortOrder === 'desc' ? -1 : 1;
    }

    const [products, total] = await Promise.all([
      Product.find(filter)
        .select('name price offerPrice image category inStock')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: {
        products,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Product listing error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products'
    });
  }
};

// GET SINGLE PRODUCT
export const productById = async (req, res) => {
  try {
    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID'
      });
    }

    const product = await Product.findById(req.params.id).lean();

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      product
    });

  } catch (error) {
    console.error('Product fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch product'
    });
  }
};

// GET PRODUCTS BY CATEGORY: /api/product/category/:category
export const productByCategory = async (req, res) => {
  try {
    const { category } = req.params;

    const products = await Product.find({
      category: category.toLowerCase()
    }).lean();

    if (!products.length) {
      return res.json({ success: true, products: [] });
    }

    res.json({ success: true, products });
  } catch (error) {
    console.error('Category fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products by category'
    });
  }
};


// UPDATE PRODUCT STOCK
export const changeStock = async (req, res) => {
  try {
    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID'
      });
    }

    const { inStock } = req.body;

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { inStock },
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      message: 'Product stock updated',
      inStock: product.inStock
    });

  } catch (error) {
    console.error('Stock update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update product stock'
    });
  }
};
