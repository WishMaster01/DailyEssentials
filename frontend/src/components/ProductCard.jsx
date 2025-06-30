import React, { useState, useEffect } from "react";
import { assets } from "../assets/assets"; // Adjust path as per your project structure
import { useAppContext } from "../context/AppContext"; // Adjust path as per your project structure
import toast from "react-hot-toast";

const ProductCard = ({ product }) => {
    // Destructure necessary values from AppContext
    const {
        currency,
        user,
        setShowUserLogin,
        axios,
        cartItems,
        fetchUser, // Used to refresh cartItems after successful update
        navigate // Used for navigating to product details
    } = useAppContext();

    // State to manage loading/updating status for cart actions
    const [isUpdating, setIsUpdating] = useState(false);

    // Handler for navigating to product detail page
    const handleProductClick = () => {
        if (navigate && product?._id) {
            navigate(`/product/${product._id}`);
        } else {
            console.warn("Navigation function or product ID not available.");
        }
    };

    // Unified cart handler for adding, incrementing, decrementing items
    const handleCartAction = async (action) => {
        // Prevent action if an update is already in progress
        if (isUpdating) return;

        // Check for user login
        if (!user || !user._id) {
            setShowUserLogin(true);
            toast.error("Please login to modify your cart");
            return;
        }

        setIsUpdating(true); // Set loading state

        let newQuantity;
        const currentQuantity = cartItems[product._id] || 0;

        // Determine the new quantity based on the action
        if (action === 'add' || action === 'increment') {
            newQuantity = currentQuantity + 1;
        } else if (action === 'decrement') {
            newQuantity = currentQuantity - 1;
        } else {
            console.error("Unknown cart action:", action);
            setIsUpdating(false);
            return;
        }

        try {
            // Create a copy of the current cart items
            const updatedCart = { ...cartItems };
            if (newQuantity < 1) {
                // If quantity goes below 1, remove the item
                delete updatedCart[product._id];
            } else {
                // Otherwise, set the new quantity
                updatedCart[product._id] = newQuantity;
            }

            // Make the API call to update the cart on the backend
            const { data } = await axios.post('/api/cart/update',
                { cartItems: updatedCart },
                {
                    withCredentials: true, // Ensure cookies are sent
                    timeout: 5000 // 5 second timeout for the request
                }
            );

            if (!data.success) {
                // If backend reports failure, throw an error
                throw new Error(data.message || "Cart update failed on server.");
            }

            // After successful backend update, refresh the user data (which includes cartItems)
            // This ensures the AppContext's cartItems state is fully in sync with the backend
            await fetchUser();

            // Provide user feedback
            if (newQuantity === 0) {
                toast.success("Product removed from cart.");
            } else {
                toast.success("Cart updated successfully.");
            }
        } catch (error) {
            console.error("Cart update failed:", {
                error: error.response?.data || error.message,
                productId: product._id,
                currentCart: cartItems // Log current cart for debugging
            });

            toast.error(
                error.response?.data?.message ||
                "Failed to update cart. Please try again."
            );
        } finally {
            setIsUpdating(false); // Reset loading state
        }
    };


    return (
        <div
            // onClick handler for the entire card to navigate to product details
            onClick={handleProductClick}
            className="border border-gray-500/20 rounded-md md:px-4 px-3 py-2 bg-white min-w-56 max-w-56 w-full hover:shadow-md transition-shadow cursor-pointer"
        >
            {/* Product Image Section */}
            <div className="group flex items-center justify-center px-2 h-40 overflow-hidden">
                <img
                    className="group-hover:scale-105 transition max-w-26 md:max-w-36 h-full object-contain"
                    src={product.image?.[0] || assets.placeholder_image} // Use first image or placeholder
                    alt={product.name}
                    onError={(e) => {
                        e.target.src = assets.placeholder_image; // Fallback for broken image URLs
                    }}
                />
            </div>

            {/* Product Info Section */}
            <div className="text-gray-500/60 text-sm mt-3">
                <p className="capitalize">{product.category}</p>
                <p className="text-gray-700 font-medium text-lg truncate w-full">{product.name}</p>

                {/* Ratings Section (Static for now, consider dynamic implementation) */}
                <div className="flex items-center gap-0.5 mt-1">
                    {Array(5).fill('').map((_, i) => (
                        <img
                            key={i}
                            src={i < 4 ? assets.star_icon : assets.star_dull_icon}
                            alt="star rating"
                            className="md:w-3.5 w-3"
                        />
                    ))}
                    <span className="ml-1 text-sm">(4)</span> {/* Static rating display */}
                </div>

                {/* Price and Cart Actions Section */}
                <div className="flex items-end justify-between mt-3">
                    <div>
                        <p className="md:text-xl text-base font-medium text-primary">
                            {currency}{product.offerPrice}
                        </p>
                        {product.offerPrice < product.price && ( // Show original price if there's an offer
                            <p className="text-gray-500/60 md:text-sm text-xs line-through">
                                {currency}{product.price}
                            </p>
                        )}
                    </div>

                    {/* Cart Action Buttons */}
                    <div onClick={(e) => e.stopPropagation()}> {/* Prevent card click when clicking buttons */}
                        {!cartItems[product._id] ? (
                            // "Add" button when item is not in cart
                            <button
                                onClick={() => handleCartAction('add')}
                                disabled={isUpdating} // Disable when an update is in progress
                                className={`flex items-center justify-center gap-1 bg-primary/10 border border-primary/40 md:w-[80px] w-[64px] h-[34px] rounded text-primary font-medium hover:bg-primary/20 transition-colors ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {isUpdating ? (
                                    <span className="loading-spinner"></span> // Show spinner while updating
                                ) : (
                                    <>
                                        <img src={assets.cart_icon} alt="cart icon" className="w-4" />
                                        Add
                                    </>
                                )}
                            </button>
                        ) : (
                            // Increment/Decrement buttons when item is in cart
                            <div className={`flex items-center justify-center gap-2 md:w-20 w-16 h-[34px] bg-primary/25 rounded ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                <button
                                    onClick={() => handleCartAction('decrement')}
                                    disabled={isUpdating} // Disable when an update is in progress
                                    className="cursor-pointer text-md px-2 h-full flex items-center hover:text-red-500 disabled:cursor-not-allowed"
                                >
                                    -
                                </button>
                                <span className="w-5 text-center">{cartItems[product._id]}</span> {/* Display quantity */}
                                <button
                                    onClick={() => handleCartAction('increment')}
                                    disabled={isUpdating} // Disable when an update is in progress
                                    className="cursor-pointer text-md px-2 h-full flex items-center hover:text-green-500 disabled:cursor-not-allowed"
                                >
                                    +
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductCard;
