import React, { useEffect, useState } from 'react'
import { useAppContext } from '../../context/AppContext'
import { assets } from '../../assets/assets'
import axios from 'axios'
import toast from 'react-hot-toast'

const Orders = () => {
    const { currency } = useAppContext()
    const [orders, setOrders] = useState([])

    const fetchOrders = async () => {
        try {
            const { data } = await axios.get('/api/order/seller');
            if (data.success) {
                setOrders(data.orders)
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to fetch orders')
            console.error("Fetch orders error:", error)
        }
    };

    useEffect(() => {
        fetchOrders();
    }, [])

    return (
        <div className='flex-1 h-[95vh] overflow-y-auto bg-gray-50'>
            <div className="container mx-auto p-4 md:p-8 space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-gray-800">Order History</h2>
                    <div className="text-sm text-gray-500">
                        {orders.length} {orders.length === 1 ? 'order' : 'orders'}
                    </div>
                </div>
                
                <div className="grid gap-6">
                    {orders.map((order, index) => (
                        <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200">
                            <div className="p-6 grid grid-cols-1 md:grid-cols-5 gap-6">
                                {/* Customer Info */}
                                <div className="space-y-2">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-gray-100 p-2 rounded-full">
                                            <img 
                                                src={assets.profile_icon} 
                                                alt="profile" 
                                                className="w-8 h-8 object-contain"
                                            />
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">
                                                {order.userId?.name || 'Unknown Customer'}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                {order.userId?.email || 'No email provided'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-sm space-y-1">
                                        <p className="font-medium">Order ID:</p>
                                        <p className="text-gray-600">{order._id?.toString().substring(0, 8) || 'N/A'}</p>
                                    </div>
                                </div>

                                {/* Order Items */}
                                <div className="space-y-2">
                                    {order.items?.map((item, idx) => (
                                        <div key={idx} className="flex gap-3">
                                            <div className="flex-shrink-0 bg-gray-100 p-2 rounded-lg">
                                                <img 
                                                    src={item.product?.image || assets.box_icon} 
                                                    alt={item.product?.name} 
                                                    className="w-10 h-10 object-contain"
                                                />
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900">
                                                    {item.product?.name || 'Unknown Product'} 
                                                    <span className="text-primary ml-1">×{item.quantity}</span>
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    {item.product?.category || 'No category'}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Shipping Info */}
                                <div className="space-y-1 text-sm">
                                    <p className="font-medium text-gray-900">
                                        {order.address?.firstName || ''} {order.address?.lastName || ''}
                                    </p>
                                    <p className="text-gray-600">{order.address?.street || 'Address not available'}</p>
                                    <p className="text-gray-600">
                                        {order.address?.city || ''}, 
                                        {order.address?.state ? ` ${order.address.state}` : ''} 
                                        {order.address?.zipcode ? ` ${order.address.zipcode}` : ''}
                                    </p>
                                    <p className="text-gray-600">{order.address?.country || ''}</p>
                                    <p className="text-gray-600">{order.address?.phone || 'No phone'}</p>
                                </div>

                                {/* Payment Info */}
                                <div className="space-y-2">
                                    <div className="text-lg font-semibold text-gray-900">
                                        {currency}{order.amount?.toFixed(2) || '0.00'}
                                    </div>
                                    <div className="text-sm space-y-1">
                                        <p className="text-gray-600">
                                            <span className="font-medium">Method:</span> {order.paymentType || 'N/A'}
                                        </p>
                                        <p className="text-gray-600">
                                            <span className="font-medium">Date:</span> {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}
                                        </p>
                                        <div className="flex items-center">
                                            <span className="font-medium mr-1">Status:</span>
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                order.isPaid 
                                                    ? 'bg-green-100 text-green-800' 
                                                    : 'bg-yellow-100 text-yellow-800'
                                            }`}>
                                                {order.isPaid ? "Paid" : "Pending"}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex flex-col justify-center space-y-2">
                                    <button className="px-4 py-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition text-sm font-medium">
                                        View Details
                                    </button>
                                    {!order.isPaid && (
                                        <button className="px-4 py-2 bg-green-50 text-green-600 rounded hover:bg-green-100 transition text-sm font-medium">
                                            Mark as Paid
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {orders.length === 0 && (
                    <div className="text-center py-12">
                        <img src={assets.empty_icon} alt="No orders" className="mx-auto h-24 w-24 opacity-50" />
                        <h3 className="mt-4 text-lg font-medium text-gray-900">No orders yet</h3>
                        <p className="mt-1 text-gray-500">Your orders will appear here when customers make purchases.</p>
                    </div>
                )}
            </div>
        </div>
    )
}

export default Orders
