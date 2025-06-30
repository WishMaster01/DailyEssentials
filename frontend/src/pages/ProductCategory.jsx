import React, { useEffect, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { useParams } from 'react-router-dom';
import { categories } from '../assets/assets';
import ProductCard from '../components/ProductCard';
import LoadingSpinner from '../components/LoadingSpinner';

const ProductCategory = () => {
    const { 
        products,
        isLoadingProducts,
        fetchProducts,
        filteredProducts,
        filterProductsByCategory
    } = useAppContext();
    const { category } = useParams();
    const [displayProducts, setDisplayProducts] = useState([]);
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    // Find the category details
    const searchCategory = categories.find(item => 
        item.path.toLowerCase() === category?.toLowerCase()
    );

    // Load and filter products - runs only when category changes
    useEffect(() => {
        let isMounted = true;
        
        const loadAndFilterProducts = async () => {
            try {
                // Only fetch if we don't have products
                if (!products || products.length === 0) {
                    await fetchProducts();
                }
                
                if (isMounted) {
                    filterProductsByCategory(category);
                    setIsInitialLoad(false);
                }
            } catch (error) {
                console.error("Error loading products:", error);
                if (isMounted) {
                    setIsInitialLoad(false);
                }
            }
        };

        loadAndFilterProducts();

        return () => {
            isMounted = false;
        };
    }, [category]); // Only depend on category

    // Update display products when filteredProducts or products change
    useEffect(() => {
        if (filteredProducts && filteredProducts.length > 0) {
            setDisplayProducts(filteredProducts);
        } else if (products && products.length > 0 && category) {
            // Fallback filtering
            const filtered = products.filter(product => 
                product?.category?.toLowerCase() === category.toLowerCase()
            );
            setDisplayProducts(filtered);
        } else {
            setDisplayProducts([]);
        }
    }, [filteredProducts, products, category]);

    // Scroll to top when category changes
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [category]);

    if (isInitialLoad || isLoadingProducts) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <LoadingSpinner />
            </div>
        );
    }

    return (
        <div className='mt-16 px-4 md:px-8'>
            {searchCategory && (
                <div className='flex flex-col items-start mb-8'>
                    <h1 className='text-2xl md:text-3xl font-bold text-gray-800'>
                        {searchCategory.text}
                    </h1>
                    <div className='w-16 h-1 bg-primary rounded-full mt-2'></div>
                    {displayProducts.length > 0 && (
                        <p className='text-sm text-gray-500 mt-2'>
                            {displayProducts.length} {displayProducts.length === 1 ? 'item' : 'items'} found
                        </p>
                    )}
                </div>
            )}

            {displayProducts.length > 0 ? (
                <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6'>
                    {displayProducts.map(product => (
                        <ProductCard 
                            key={product._id} 
                            product={product} 
                        />
                    ))}
                </div>
            ) : (
                <div className='flex flex-col items-center justify-center h-[60vh]'>
                    <p className='text-xl md:text-2xl font-medium text-primary mb-4'>
                        No Products Found in this Category
                    </p>
                    <p className='text-primary-dull'>
                        Check back later or browse other categories
                    </p>
                </div>
            )}
        </div>
    );
};

export default ProductCategory;
