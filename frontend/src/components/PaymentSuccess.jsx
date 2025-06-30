import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const PaymentSuccess = () => {
    const { state } = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        if (!state?.paymentSuccess) {
            // If someone accesses this page directly without payment success
            navigate('/cart');
        }
    }, [state, navigate]);

    return (
        <div className="flex flex-col items-center justify-center h-screen">
            <div className="bg-green-100 rounded-full p-4 mb-4">
                <svg className="w-16 h-16 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Payment Successful!</h1>
            <p className="text-gray-600 mb-6">{state?.message || 'Your order has been placed successfully.'}</p>
            <button 
                onClick={() => navigate('/my-orders')}
                className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
            >
                View Your Orders
            </button>
        </div>
    );
};

export default PaymentSuccess;
