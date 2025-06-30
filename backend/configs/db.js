import mongoose from "mongoose";

const connectDB = async () => {
    try {
        mongoose.connection.on('connected', () => {
            console.log('DATABASE CONNECTED!!');
        });

        mongoose.connection.on('error', (err) => {
            console.error('MONGOOSE CONNECTION ERROR:', err);
        });

        mongoose.connection.on('disconnected', () => {
            console.log('DATABASE DISCONNECTED!!');
        });

        await mongoose.connect(`${process.env.MONGODB_URL}/dailyessentials`);

    }
    catch (error) {
        console.error('AN ERROR OCCURED DURING MONGOOSE CONNECTION IN CATCH BLOCK.', error);
    }
}

export default connectDB;