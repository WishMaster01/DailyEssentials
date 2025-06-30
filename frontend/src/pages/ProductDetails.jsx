import { useEffect, useState } from "react";
import { useAppContext } from "../context/AppContext";
import { Link, useParams, useNavigate } from "react-router-dom";
import { assets } from "../assets/assets";
import ProductCard from "../components/ProductCard";
import LoadingSpinner from "../components/LoadingSpinner";

const ProductDetails = () => {
    const { products, currency, addToCart, isLoadingProducts } = useAppContext();
    const { id } = useParams();
    const navigate = useNavigate();

    const [relatedProducts, setRelatedProducts] = useState([]);
    const [thumbnail, setThumbnail] = useState(assets.placeholder_image); // Fallback image
    const [isLoading, setIsLoading] = useState(true);

    // Find the product with error handling
    const product = products?.find((item) => item?._id === id);

    useEffect(() => {
        if (products && products.length > 0) {
            setIsLoading(false);

            // Set related products
            if (product) {
                const sameCategoryProducts = products.filter(
                    (item) => item?.category === product?.category && item?._id !== product?._id
                );
                setRelatedProducts(sameCategoryProducts.slice(0, 5));

                // Set thumbnail
                if (product?.image?.length > 0) {
                    setThumbnail(product.image[0]);
                }
            }
        }
    }, [products, product]);

    // Loading state
    if (isLoadingProducts || isLoading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <LoadingSpinner />
            </div>
        );
    }

    // Product not found state
    if (!product) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh]">
                <p className="text-xl font-medium">Product not found</p>
                <button
                    onClick={() => navigate("/products")}
                    className="mt-4 px-6 py-2 bg-primary text-white rounded"
                >
                    Browse Products
                </button>
            </div>
        );
    }

    return (
        <div className="mt-12 px-4 md:px-8">
            {/* Breadcrumb Navigation */}
            <div className="text-sm">
                <Link to="/" className="hover:text-primary">Home</Link> /
                <Link to="/products" className="hover:text-primary"> Products</Link> /
                <Link
                    to={`/products/${product.category?.toLowerCase()}`}
                    className="hover:text-primary"
                >
                    {product.category}
                </Link> /
                <span className="text-primary"> {product.name}</span>
            </div>

            {/* Product Main Section */}
            <div className="flex flex-col md:flex-row gap-8 mt-6">
                {/* Product Images */}
                <div className="flex flex-col md:flex-row gap-4 w-full md:w-1/2">
                    {/* Thumbnails */}
                    <div className="flex md:flex-col gap-2 order-2 md:order-1">
                        {product.image?.map((image, index) => (
                            <div
                                key={`thumb-${index}`}
                                onClick={() => setThumbnail(image)}
                                className={`border rounded overflow-hidden cursor-pointer w-16 h-16 ${thumbnail === image ? "border-primary border-2" : "border-gray-300"
                                    }`}
                            >
                                <img
                                    src={image}
                                    alt={`Thumbnail ${index + 1}`}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        e.target.src = assets.placeholder_image;
                                    }}
                                />
                            </div>
                        ))}
                    </div>

                    {/* Main Image */}
                    <div className="border border-gray-300 rounded-lg overflow-hidden w-full order-1 md:order-2">
                        <img
                            src={thumbnail}
                            alt={product.name}
                            className="w-full h-auto max-h-[500px] object-contain"
                            onError={(e) => {
                                e.target.src = assets.placeholder_image;
                            }}
                        />
                    </div>
                </div>

                {/* Product Info */}
                <div className="w-full md:w-1/2 mt-6 md:mt-0">
                    <h1 className="text-2xl md:text-3xl font-bold">{product.name}</h1>

                    {/* Ratings */}
                    <div className="flex items-center mt-2">
                        {Array(5).fill(0).map((_, i) => (
                            <img
                                key={`star-${i}`}
                                src={i < 4 ? assets.star_icon : assets.star_dull_icon}
                                alt="Rating star"
                                className="w-4 h-4"
                            />
                        ))}
                        <span className="text-sm ml-2">(4 reviews)</span>
                    </div>

                    {/* Pricing */}
                    <div className="mt-6">
                        {product.offerPrice < product.price && (
                            <p className="text-gray-500 line-through">
                                {currency}{product.price.toFixed(2)}
                            </p>
                        )}
                        <p className="text-2xl font-bold text-primary">
                            {currency}{product.offerPrice.toFixed(2)}
                        </p>
                        <p className="text-sm text-gray-500">(Inclusive of all taxes)</p>
                    </div>

                    {/* Description */}
                    <div className="mt-6">
                        <h2 className="text-lg font-semibold">About this product</h2>
                        <ul className="mt-2 list-disc pl-5 space-y-1">
                            {product.description?.map((desc, i) => (
                                <li key={`desc-${i}`} className="text-gray-700">{desc}</li>
                            ))}
                        </ul>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-8 flex flex-col sm:flex-row gap-4">
                        <button
                            onClick={() => addToCart(product._id)}
                            className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg font-medium transition"
                        >
                            Add to Cart
                        </button>
                        <button
                            onClick={() => {
                                addToCart(product._id);
                                navigate("/cart");
                            }}
                            className="px-6 py-3 bg-primary hover:bg-primary-dull text-white rounded-lg font-medium transition"
                        >
                            Buy Now
                        </button>
                    </div>
                </div>
            </div>

            {/* Related Products */}
            {relatedProducts && relatedProducts.length > 0 ? (
                <div className="mt-16">
                    <div className="flex flex-col items-center mb-8">
                        <h2 className="text-2xl font-bold">Related Products</h2>
                        <div className="w-20 h-0.5 bg-primary rounded-full mt-2"></div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {relatedProducts
                            .filter(p => p.inStock !== false) // More robust check
                            .map((product) => (
                                <ProductCard
                                    key={product._id}
                                    product={product}
                                />
                            ))
                        }
                    </div>

                    <div className="text-center mt-8">
                        <button
                            onClick={() => {
                                navigate(`/products/${product.category.toLowerCase()}`);
                                window.scrollTo(0, 0);
                            }}
                            className="px-8 py-2 border border-primary text-primary hover:bg-primary/10 rounded-lg transition"
                        >
                            View More in {product.category}
                        </button>
                    </div>
                </div>
            ) : (
                <div className="mt-16 text-center">
                    <p className="text-gray-500">No related products found</p>
                    <button
                        onClick={() => {
                            navigate("/products");
                            window.scrollTo(0, 0);
                        }}
                        className="mt-4 px-8 py-2 border border-primary text-primary hover:bg-primary/10 rounded-lg transition"
                    >
                        Browse All Products
                    </button>
                </div>
            )}
        </div>
    );
};

export default ProductDetails;
