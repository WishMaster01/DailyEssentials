// middleware/authUser.js (or authMiddleware.js)
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const authUser = async (req, res, next) => {
    const { token } = req.cookies; 

    if (!token) {
        return res.status(401).json({ success: false, message: 'Unauthorized. No token provided.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id || decoded._id).select("-password");

        if (!user) {
            return res.status(401).json({ success: false, message: 'Unauthorized. User not found.' });
        }

        req.user = user; 
        next(); 

    } catch (error) {
        console.error('Authentication Error:', error.message);
        return res.status(401).json({ success: false, message: 'Unauthorized. Invalid token.' });
    }
};

export default authUser;
