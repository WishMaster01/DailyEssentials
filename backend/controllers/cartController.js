// UPDATE USER CARTDATA : /api/cart/update
import User from "../models/User.js";
import mongoose from "mongoose";

export const updateCart = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // 1. Verify authentication through middleware
        if (!req.user) {
            await session.abortTransaction();
            return res.status(401).json({ 
                success: false, 
                message: 'Authentication required' 
            });
        }

        // 2. Validate request body
        if (!req.body.cartItems || typeof req.body.cartItems !== 'object') {
            await session.abortTransaction();
            return res.status(400).json({
                success: false,
                message: 'Invalid cart data format'
            });
        }

        // 3. Validate each cart item
        for (const [productId, quantity] of Object.entries(req.body.cartItems)) {
            if (!mongoose.Types.ObjectId.isValid(productId)) {
                await session.abortTransaction();
                return res.status(400).json({
                    success: false,
                    message: `Invalid product ID format: ${productId}`
                });
            }
            if (typeof quantity !== 'number' || quantity < 0 || !Number.isInteger(quantity)) {
                await session.abortTransaction();
                return res.status(400).json({
                    success: false,
                    message: `Invalid quantity for product ${productId}`
                });
            }
        }

        // 4. Update cart with transaction
        const updatedUser = await User.findByIdAndUpdate(
            req.user._id,
            { cartItems: req.body.cartItems },
            { 
                new: true,
                runValidators: true,
                session 
            }
        ).select('-password');

        if (!updatedUser) {
            await session.abortTransaction();
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        await session.commitTransaction();
        res.json({
            success: true,
            message: 'Cart updated successfully',
            cartItems: updatedUser.cartItems
        });

    } catch (error) {
        await session.abortTransaction();
        console.error('Cart update error:', {
            error: error.message,
            stack: error.stack,
            body: req.body,
            user: req.user
        });
        
        res.status(500).json({
            success: false,
            message: process.env.NODE_ENV === 'development' 
                ? `Server error: ${error.message}`
                : 'Failed to update cart due to server error'
        });
    } finally {
        session.endSession();
    }
};
