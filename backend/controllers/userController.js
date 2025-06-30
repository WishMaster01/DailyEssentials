import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// REGISTER USER : /api/user/register
export const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.json({ success: false, message: 'MISSING DETAILS' });
        }

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.json({ success: false, message: 'USER ALREADY EXISTS' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({ name, email, password: hashedPassword });

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.cookie('token', token, {
            httpOnly: true, // PREVENT JAVASCRIPT TO ACCESS COOKIE
            secure: process.env.NODE_ENV === 'production', // USE SECURE COOKIE IN PRODUCTION
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict', // CSRF PROTECTION
            maxAge: 7 * 24 * 60 * 60 * 1000, // COOKIE EXPIRATION TIME
        })

        return res.json({ success: true, user: { email: user.email, name: user.name } });
    }
    catch (error) {
        console.log('ERROR OCCURED DURING REGISTERING USER', error.message);
        res.json({ success: false, message: error.message });
    }
}


// LOGIN USER: /api/user/login
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.json({ success: false, message: 'EMAIL AND PASSWORD ARE REQUIRED' });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.json({ success: false, message: 'INVALID EMAIL OR PASSWORD' });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.json({ success: false, message: 'INVALID EMAIL OR PASSWORD' });
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        })

        return res.json({ success: true, user: { email: user.email, name: user.name } });
    }
    catch (error) {
        console.log('ERROR OCCURED DURING LOGIN USER', error.message);
        res.json({ success: false, message: error.message });
    }
}

// CHECK AUTHORIZATION : /api/user/is-auth
// controllers/userController.js
export const isAuth = async (req, res) => {
    try {
        if (req.user) {
            return res.status(200).json({
                success: true,
                user: {
                    _id: req.user._id,
                    email: req.user.email,
                    cartItems: req.user.cartItems || {},
                },
                message: "User is authenticated."
            });
        } else {
            return res.status(401).json({
                success: false,
                user: null,
                message: "User not authenticated."
            });
        }
    } catch (error) {
        console.error('ERROR OCCURED IN isAuth controller:', error.message);
        res.status(500).json({
            success: false,
            message: process.env.NODE_ENV === 'development' ? error.message : 'Server error during authentication check'
        });
    }
};

// LOGOUT USER: /api/user/logout
export const logout = async (req, res) => {
    try {
        res.clearCookie('token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
        });

        return res.json({success: true, message: 'LOGGED OUT SUCCESSFULLY'});
    } 
    catch (error) {
        console.log('ERROR OCCURED DURING LOGGING OUT USER', error.message);
        res.json({ success: false, message: error.message });
    }
}
