import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAppContext } from '../context/AppContext';

const Loading = () => {
    const { user } = useAppContext();
    const navigate = useNavigate();
    const { search } = useLocation();

    const query = new URLSearchParams(search);
    const sessionId = query.get('session_id');
    const paymentSuccess = query.get('payment_success');

    useEffect(() => {
        const verifyPaymentAndRedirect = async () => {
            try {
                // Verify payment with backend
                const { data } = await axios.post('/api/order/verify', {
                    session_id: sessionId,
                    userId: user._id
                });

                if (data.success && data.paid) {
                    // Payment successful, redirect to my-orders with success state
                    navigate('/my-orders', {
                        state: {
                            paymentSuccess: true,
                            message: 'Payment successful! Your order has been placed.',
                            orderId: data.orderId
                        }
                    });
                } else {
                    // Payment verification failed
                    navigate('/cart', {
                        state: {
                            error: 'Payment verification failed. Please check your orders or contact support.'
                        }
                    });
                }
            } catch (error) {
                console.error('Payment verification error:', error);
                navigate('/cart', {
                    state: {
                        error: 'Error verifying your payment. Please contact support.'
                    }
                });
            }
        };

        if (sessionId && paymentSuccess) {
            // This is a Stripe payment return - verify payment
            verifyPaymentAndRedirect();
        } else {
            // If no session_id but payment_success=true, something went wrong
            navigate('/cart', {
                state: {
                    error: 'Invalid payment return URL. Please check your orders.'
                }
            });
        }
    }, [sessionId, paymentSuccess, navigate, user._id]);

    return (
        <div className='flex flex-col justify-center items-center h-screen'>
            <div className='animate-spin rounded-full h-24 w-24 border-4 border-gray-300 border-t-primary mb-4'></div>
            <p className='text-lg font-medium text-gray-700'>
                Verifying your payment...
            </p>
            <p className='text-sm text-gray-500 mt-2'>
                Please wait while we confirm your transaction
            </p>
        </div>
    );
};

export default Loading;
