import mongoose from "mongoose";
import Product from "./Product.js";

const orderSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User', // Changed to match typical Mongoose convention
    },
    items: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'Product',
        },
        quantity: {
            type: Number, // Changed from String to Number
            required: true,
            min: [1, 'Quantity must be at least 1']
        },
    }],
    amount: {
        type: Number,
        required: true,
        min: [0, 'Amount cannot be negative']
    },
    address: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Address',
    },
    status: {
        type: String,
        default: 'ORDER PLACED',
        enum: {
            values: [
                'ORDER PLACED', 
                'PROCESSING', 
                'SHIPPED', 
                'DELIVERED', 
                'CANCELLED'
            ],
            message: 'Invalid order status'
        }
    },
    paymentType: {
        type: String,
        required: true,
        enum: ['COD', 'ONLINE', 'WALLET'] // Example payment types
    },
    isPaid: {
        type: Boolean,
        default: function() {
            // Automatically set to false for COD, true for other payment methods
            return this.paymentType !== 'COD';
        }
    },
    paymentId: {
        type: String,
        required: function() {
            return this.paymentType !== 'COD';
        }
    }
}, { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Add index for better query performance
orderSchema.index({ userId: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });

const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);

export default Order;
