import Order from "../models/Order.js";
import Product from "../models/Product.js";
import User from "../models/User.js";
import Address from "../models/Address.js";
import mongoose from "mongoose";
import stripePackage from "stripe";

const stripe = stripePackage(process.env.STRIPE_SECRET_KEY);

// PLACE ORDER COD : /api/order/cod
export const placeOrderCOD = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { userId, items, address } = req.body;

        // Validate input
        if (!userId || !address || !items || items.length === 0) {
            await session.abortTransaction();
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        // Calculate amount
        let amount = 0;
        for (const item of items) {
            const product = await Product.findById(item.product).session(session);
            if (!product) {
                await session.abortTransaction();
                return res.status(404).json({
                    success: false,
                    message: `Product ${item.product} not found`
                });
            }
            amount += product.offerPrice * item.quantity;
        }

        // Add tax (2%)
        amount += Math.floor(amount * 0.02);

        // Create order
        const order = await Order.create([{
            userId,
            items,
            amount,
            address,
            paymentType: "COD",
            isPaid: false
        }], { session });

        // Clear user's cart
        await User.findByIdAndUpdate(
            userId,
            { $set: { cartItems: {} } },
            { session }
        );

        await session.commitTransaction();

        return res.json({
            success: true,
            message: 'COD order placed successfully',
            orderId: order[0]._id
        });

    } catch (error) {
        await session.abortTransaction();
        console.error("COD Order placement error:", error);
        res.status(500).json({
            success: false,
            message: 'Failed to place COD order',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    } finally {
        session.endSession();
    }
};

// PLACE ORDER USING STRIPE : /api/order/stripe
export const placeOrderStripe = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { userId, items, address } = req.body;
        const { origin } = req.headers;

        // Validate input
        if (!userId || !address || !items || items.length === 0 || !origin) {
            await session.abortTransaction();
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        let productData = [];
        let amount = 0;

        // Calculate amount and prepare product data
        for (const item of items) {
            const product = await Product.findById(item.product).session(session);
            if (!product) {
                await session.abortTransaction();
                return res.status(404).json({
                    success: false,
                    message: `Product ${item.product} not found`
                });
            }

            productData.push({
                name: product.name,
                price: product.offerPrice,
                quantity: item.quantity,
            });
            amount += product.offerPrice * item.quantity;
        }

        // Add tax (2%)
        amount += Math.floor(amount * 0.02);

        // Create Stripe checkout session
        const line_items = productData.map((item) => {
            return {
                price_data: {
                    currency: "usd",
                    product_data: {
                        name: item.name,
                    },
                    unit_amount: Math.floor(item.price * 1.02) * 100 // Price with 2% tax
                },
                quantity: item.quantity,
            }
        });

        const stripeSession = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items,
            mode: "payment",
            success_url: `${origin}/loading?session_id={CHECKOUT_SESSION_ID}&payment_success=true`,
            cancel_url: `${origin}/cart`,
            metadata: {
                userId: userId.toString(),
                orderItems: JSON.stringify(items)
            }
        });

        // Create order with Stripe session ID as paymentId
        const order = await Order.create([{
            userId,
            items,
            amount,
            address,
            paymentType: "ONLINE",
            isPaid: false,
            paymentId: stripeSession.id
        }], { session });

        // Clear user's cart
        await User.findByIdAndUpdate(
            userId,
            { $set: { cartItems: {} } },
            { session }
        );

        await session.commitTransaction();

        return res.json({
            success: true,
            url: stripeSession.url,
            orderId: order[0]._id
        });

    } catch (error) {
        await session.abortTransaction();
        console.error("Stripe Order placement error:", error);
        res.status(500).json({
            success: false,
            message: 'Failed to place Stripe order',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    } finally {
        session.endSession();
    }
};

// STRIPE WEBHOOK : /api/order/webhook
export const stripeWebhook = async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
        console.error(`Webhook Error: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the checkout.session.completed event
    switch (event.type) {
        case "payment_intent.succeeded": {
            const paymentIntent = event.data.object;
            const paymentIntentId = paymentIntent.id;

            // GETTING SESSION METADATA
            const session = await stripe.checkout.sessions.list({
                payment_intent: paymentIntentId,
            });

            const { orderId, userId } = session.data[0].metadata;

            // MARK PAYMENT AS PAID
            await Order.findByIdAndUpdate(orderId, {isPaid: true});
            // CLEAR USER CART
            await User.findByIdAndUpdate(userId, {cartItems: {}});
            break;
        }
        case "payment_intent.failed": {
            const paymentIntent = event.data.object;
            const paymentIntentId = paymentIntent.id;

            // GETTING SESSION METADATA
            const session = await stripe.checkout.sessions.list({
                payment_intent: paymentIntentId,
            });

            const { orderId, userId } = session.data[0].metadata;
            await Order.findByIdAndDelete(orderId);
            break;
        }
        default:
            console.error(`UNHANDLED EVENT TYPE ${event.type}`);
            break;
    }
    res.json({received: true});
};
//     if (event.type === 'checkout.session.completed') {
//         const session = event.data.object;

//         try {
//             // Update the order in your database
//             await Order.findOneAndUpdate(
//                 { paymentId: session.id },
//                 {
//                     isPaid: true,
//                     status: 'PROCESSING'
//                 }
//             );
//             console.log(`Order with paymentId ${session.id} marked as paid`);
//         } catch (error) {
//             console.error(`Error updating order for paymentId ${session.id}:`, error);
//         }
//     }

//     res.json({ received: true });

// GET ORDERS BY USER ID : /api/order/user
export const getUserOrder = async (req, res) => {
    try {
        const { userId } = req.query;

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID format'
            });
        }

        const orders = await Order.find({
            userId,
            $or: [{ paymentType: "COD" }, { isPaid: true }]
        })
            .populate({
                path: 'items.product',
                model: 'Product'
            })
            .populate({
                path: 'address',
                model: 'Address'
            })
            .sort({ createdAt: -1 });

        if (!orders.length) {
            return res.json({
                success: true,
                message: 'No orders found',
                orders: []
            });
        }

        res.json({ success: true, orders });
    } catch (error) {
        console.error("Order fetch error:", error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch orders',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// GET ALL ORDERS (FOR SELLER/ADMIN) : /api/order/seller
export const getAllOrder = async (req, res) => {
    try {
        const orders = await Order.find({
            $or: [{ paymentType: "COD" }, { isPaid: true }]
        })
        .populate({
            path: 'items.product',
            model: 'Product'
        })
        .populate({
            path: 'address',
            model: 'Address'
        })
        .populate({
            path: 'userId',
            model: 'User',
            select: 'name email' // Only include necessary fields
        })
        .sort({ createdAt: -1 });
        
        res.json({ 
            success: true, 
            orders 
        });
    } catch (error) {
        console.error("Error getting all orders:", error.message);
        res.status(500).json({ 
            success: false, 
            message: 'Error occurred during getting all orders',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// VERIFY ORDER PAYMENT : /api/order/verify
export const verifyOrderPayment = async (req, res) => {
    try {
        const { session_id, userId } = req.body;
        
        if (!session_id || !userId) {
            return res.status(400).json({
                success: false,
                message: 'Session ID and User ID are required'
            });
        }

        // Retrieve the Stripe session
        const stripeSession = await stripe.checkout.sessions.retrieve(session_id, {
            expand: ['payment_intent']
        });
        
        if (stripeSession.payment_status === 'paid') {
            // Find and update the order
            const order = await Order.findOneAndUpdate(
                { 
                    paymentId: session_id,
                    userId: userId,
                    isPaid: false 
                },
                { 
                    isPaid: true,
                    status: 'PROCESSING',
                    paymentDetails: {
                        paymentMethod: stripeSession.payment_intent?.payment_method_types?.[0],
                        amountPaid: stripeSession.amount_total / 100,
                        currency: stripeSession.currency
                    }
                },
                { new: true }
            );
            
            if (!order) {
                return res.status(404).json({
                    success: false,
                    message: 'Order not found or already paid'
                });
            }

            return res.json({
                success: true,
                paid: true,
                orderId: order._id,
                amount: order.amount,
                paymentStatus: 'completed'
            });
        }

        return res.json({
            success: true,
            paid: false,
            paymentStatus: stripeSession.payment_status || 'unknown'
        });

    } catch (error) {
        console.error("Payment verification error:", error);
        res.status(500).json({
            success: false,
            message: 'Failed to verify payment',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};
