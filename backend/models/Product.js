import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Product name is required'],
        trim: true,
        maxlength: [100, 'Product name cannot exceed 100 characters']
    },
    description: {
        type: [String], 
        required: [true, 'Product description is required'],
        validate: {
            validator: function(desc) {
                return desc.length > 0;
            },
            message: 'At least one description item is required'
        }
    },
    price: {
        type: Number,
        required: [true, 'Product price is required'],
        min: [0, 'Price cannot be negative'],
        set: v => parseFloat(v.toFixed(2)) 
    },
    offerPrice: {
        type: Number,
        required: [true, 'Offer price is required'],
        min: [0, 'Offer price cannot be negative'],
        validate: {
            validator: function(value) {
                return value <= this.price;
            },
            message: 'Offer price cannot be higher than regular price'
        },
        set: v => parseFloat(v.toFixed(2))
    },
    image: {
        type: [String], 
        required: [true, 'Product images are required'],
        validate: {
            validator: function(images) {
                return images.length > 0;
            },
            message: 'At least one product image is required'
        }
    },
    category: {
        type: String,
        required: [true, 'Product category is required'],
        trim: true,
        lowercase: true
    },
    inStock: {
        type: Boolean,
        default: true
    }
}, { 
    timestamps: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes for better query performance
productSchema.index({ name: 'text', category: 1, inStock: 1 });

const Product = mongoose.models.Product || mongoose.model('Product', productSchema);

export default Product;
