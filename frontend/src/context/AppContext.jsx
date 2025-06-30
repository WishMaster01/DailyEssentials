import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useNavigate } from 'react-router-dom';
import toast from "react-hot-toast";
import axios from "axios";

axios.defaults.withCredentials = true;
axios.defaults.baseURL = import.meta.env.VITE_BACKEND_URL;
axios.defaults.headers.common['Content-Type'] = 'application/json';

export const AppContext = createContext();

export const AppContextProvider = ({ children }) => {
    const currency = import.meta.env.VITE_CURRENCY;
    const navigate = useNavigate();

    const [user, setUser] = useState(null);
    const [isSeller, setIsSeller] = useState(false);
    const [isLoadingSeller, setIsLoadingSeller] = useState(true);
    const [isLoadingProducts, setIsLoadingProducts] = useState(true);
    const [isLoadingUser, setIsLoadingUser] = useState(true);
    const [showUserLogin, setShowUserLogin] = useState(false);
    const [products, setProducts] = useState([]);
    const [cartItems, setCartItems] = useState({});
    const [searchQuery, setSearchQuery] = useState({});

    const [currentCategory, setCurrentCategory] = useState(null);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [initialLoadComplete, setInitialLoadComplete] = useState(false);

    const fetchSeller = useCallback(async () => {
        setIsLoadingSeller(true);
        try {
            console.log("Fetching seller status from:", `${axios.defaults.baseURL}/api/seller/is-auth`);
            const { data } = await axios.get('/api/seller/is-auth');
            console.log("Seller status response:", data);

            setIsSeller(data.success);
            if (data.success && data.user) {
                setUser(prevUser => ({ ...prevUser, ...data.user }));
                console.log("User updated from seller status:", data.user);
            }
        } catch (error) {
            console.error("Error checking seller status:", error);
            if (error.response?.status !== 401) {
                toast.error(error.response?.data?.message || "Failed to fetch seller status.");
            }
            setIsSeller(false);
        } finally {
            setIsLoadingSeller(false);
            console.log("Finished fetching seller status.");
        }
    }, []);

    const fetchUser = useCallback(async () => {
        setIsLoadingUser(true);
        try {
            const { data } = await axios.get('/api/user/is-auth');

            if (data.success && data.user) {
                setUser(data.user);
                // Initialize cartItems with user's cart or empty object
                setCartItems(data.user.cartItems || {});
            } else {
                setUser(null);
                setCartItems({});
            }
        } catch (error) {
            console.error("User fetch error:", error);
            setUser(null);
            setCartItems({});
        } finally {
            setIsLoadingUser(false);
        }
    }, []);

    const fetchProducts = useCallback(async () => {
        console.log("fetchProducts: START");
        setIsLoadingProducts(true);

        try {
            const { data: responseData } = await axios.get('/api/product/list');
            console.log("API Response:", responseData);
            console.log("Products received:", responseData.data?.products);

            if (responseData.success) {
                setProducts(responseData.data.products || []);
                console.log("fetchProducts: Products SET. Count:", (responseData.data.products || []).length);
            } else {
                toast.error(responseData.message || "Failed to load products.");
                setProducts([]);
                console.log("fetchProducts: Products fetch NOT successful:", responseData.message);
            }
        } catch (error) {
            console.error("fetchProducts: ERROR:", error);
            console.error("Error details:", {
                message: error.message,
                response: error.response?.data,
                stack: error.stack
            });
            toast.error(error.response?.data?.message || error.message || "Failed to load products.");
            setProducts([]);
        } finally {
            setIsLoadingProducts(false);
            console.log("fetchProducts: FINISHED. isLoadingProducts:", false);
        }
    }, []);

    const filterProductsByCategory = useCallback((category) => {
        console.log("Filtering products for category:", category);
        setCurrentCategory(category);

        if (!category) {
            setFilteredProducts(products);
            return;
        }

        if (!products || !Array.isArray(products)) {
            console.error("Products not loaded or not an array");
            setFilteredProducts([]);
            return;
        }

        const filtered = products.filter(product => {
            if (!product || !product.category) {
                console.warn("Invalid product or missing category", product);
                return false;
            }
            return product.category.toLowerCase() === category.toLowerCase();
        });

        console.log("Filtered products:", filtered);
        setFilteredProducts(filtered);
    }, [products]);

    useEffect(() => {
        console.log("AppContext useEffect: Initializing app data...");
        const initializeApp = async () => {
            try {
                await Promise.all([fetchUser(), fetchSeller(), fetchProducts()]);
                console.log("AppContext: All initial fetches completed successfully.");
            } catch (error) {
                console.error("AppContext Initialization error caught by Promise.all:", error);
                toast.error("Failed to initialize application data.");
            } finally {
                setInitialLoadComplete(true);
            }
        };
        initializeApp();
    }, [fetchUser, fetchSeller, fetchProducts]);

    useEffect(() => {
        const updateCartInDB = async () => {
            // Only update if we have a valid user and cart items
            if (!user?._id || Object.keys(cartItems).length === 0) {
                return;
            }

            try {
                const { data } = await axios.post('/api/cart/update', {
                    userId: user._id,
                    cartItems
                });

                if (!data.success) {
                    console.error("Cart update failed:", data.message);
                }
            } catch (error) {
                console.error("Cart update error:", error);
                toast.error("Failed to save cart changes");
            }
        };

        // Only update after initial load and if we have a user
        if (initialLoadComplete && user?._id) {
            const timer = setTimeout(() => {
                updateCartInDB();
            }, 500); // Small delay to batch rapid changes

            return () => clearTimeout(timer);
        }
    }, [cartItems, user, initialLoadComplete]);

    const addToCart = useCallback((itemId) => {
        if (!products || !Array.isArray(products)) {
            toast.error("Products not loaded yet.");
            return;
        }

        if (!user || !user._id) {
            setShowUserLogin(true);
            toast.error("Please login to add items to cart");
            return;
        }

        const cartData = structuredClone(cartItems);
        cartData[itemId] = (cartData[itemId] || 0) + 1;
        setCartItems(cartData);
        toast.success("Added to cart");
    }, [products, cartItems, user]);

    const updateCartItem = useCallback((itemId, quantity) => {
        const cartData = structuredClone(cartItems);
        if (quantity <= 0) {
            delete cartData[itemId];
        } else {
            cartData[itemId] = quantity;
        }
        setCartItems(cartData);
        toast.success("Cart Updated");
    }, [cartItems]);

    const persistCartItems = (items) => {
        localStorage.setItem("cartItems", JSON.stringify(items));  // This line keeps localStorage in sync
        setCartItems(items);
    };


    const removeFromCart = useCallback((itemId) => {
        const cartData = structuredClone(cartItems);
        if (cartData[itemId]) {
            delete cartData[itemId];
            setCartItems(cartData);
            toast.success("Product Removed From Cart");
        }
    }, [cartItems]);

    const getCartCount = useCallback(() => {
        return Object.values(cartItems).reduce((sum, quantity) => sum + quantity, 0);
    }, [cartItems]);

    const getCartAmount = useCallback(() => {
        if (!products || !Array.isArray(products) || products.length === 0) {
            return "0.00";
        }
        return Object.entries(cartItems).reduce((total, [itemId, quantity]) => {
            const itemInfo = products.find((product) => product._id === itemId);
            return itemInfo ? total + (itemInfo.offerPrice * quantity) : total;
        }, 0).toFixed(2);
    }, [products, cartItems]);

    const value = {
        navigate,
        user,
        setUser,
        isSeller,
        setIsSeller,
        isLoadingSeller,
        isLoadingUser,
        isLoadingProducts,
        showUserLogin,
        setShowUserLogin,
        products,
        currency,
        addToCart,
        updateCartItem,
        removeFromCart,
        cartItems,
        searchQuery,
        setSearchQuery,
        getCartAmount,
        getCartCount,
        axios,
        fetchSeller,
        fetchProducts,
        fetchUser,
        currentCategory,
        filteredProducts,
        filterProductsByCategory,
        setCartItems: persistCartItems,
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => useContext(AppContext);
