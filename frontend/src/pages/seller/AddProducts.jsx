import React, { useState } from 'react'
import { assets, categories } from '../../assets/assets'
import { useAppContext } from '../../context/AppContext'
import toast from 'react-hot-toast'

const AddProducts = () => {
    const [files, setFiles] = useState([])
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [category, setCategory] = useState('')
    const [price, setPrice] = useState('')
    const [offerPrice, setOfferPrice] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    const { axios } = useAppContext()

    const onSubmitHandler = async (event) => {
        event.preventDefault()
        setIsSubmitting(true)

        try {
            // Validate required fields
            if (!name || !price || !category) {
                throw new Error('Name, price, and category are required')
            }

            // Prepare product data
            const productData = {
                name,
                description: description.split('\n').filter(line => line.trim() !== ''),
                category: category.toLowerCase().trim(),
                price: parseFloat(price),
                offerPrice: offerPrice ? parseFloat(offerPrice) : undefined,
            }

            // Prepare form data
            const formData = new FormData()
            
            // Append product data as JSON string
            formData.append('productData', JSON.stringify(productData))
            
            // Append each image file with proper field name
            files.forEach((file, index) => {
                if (file) {
                    formData.append('images', file)
                }
            })

            // Set proper headers
            const config = {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                withCredentials: true
            }

            // Make the request
            const { data } = await axios.post('/api/product/add', formData, config)

            if (data.success) {
                toast.success(data.message)
                // Reset form
                setName('')
                setDescription('')
                setCategory('')
                setPrice('')
                setOfferPrice('')
                setFiles([])
            } else {
                throw new Error(data.message || 'Failed to add product')
            }
        } catch (error) {
            console.error('Add product error:', error)
            // Show detailed error message from server if available
            const errorMessage = error.response?.data?.message || 
                              error.message || 
                              'Failed to add product'
            toast.error(errorMessage)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="no-scrollbar flex-1 h-[95vh] overflow-y-scroll flex flex-col justify-between">
            <form onSubmit={onSubmitHandler} className="md:p-10 p-4 space-y-5 max-w-lg">
                <div>
                    <p className="text-base font-medium">Product Image</p>
                    <div className="flex flex-wrap items-center gap-3 mt-2">
                        {Array(4).fill('').map((_, index) => (
                            <label key={index} htmlFor={`image${index}`}>
                                <input 
                                    onChange={(e) => {
                                        const updatedFiles = [...files]
                                        updatedFiles[index] = e.target.files[0]
                                        setFiles(updatedFiles)
                                    }}
                                    type="file" 
                                    id={`image${index}`} 
                                    hidden 
                                    accept="image/*"
                                />
                                <img 
                                    src={files[index] ? URL.createObjectURL(files[index]) : assets.upload_area} 
                                    alt="uploadArea" 
                                    className='max-w-24 cursor-pointer' 
                                />
                            </label>
                        ))}
                    </div>
                </div>
                <div className="flex flex-col gap-1 max-w-md">
                    <label className="text-base font-medium" htmlFor="product-name">Product Name</label>
                    <input 
                        onChange={(e) => setName(e.target.value)} 
                        value={name} 
                        id="product-name" 
                        type="text" 
                        placeholder="Type Product Name here" 
                        className="outline-none md:py-2.5 py-2 px-3 rounded border border-gray-500/40" 
                        required 
                    />
                </div>
                <div className="flex flex-col gap-1 max-w-md">
                    <label className="text-base font-medium" htmlFor="product-description">Product Description</label>
                    <textarea 
                        onChange={(e) => setDescription(e.target.value)} 
                        value={description} 
                        id="product-description" 
                        rows={4} 
                        className="outline-none md:py-2.5 py-2 px-3 rounded border border-gray-500/40 resize-none" 
                        placeholder="Type Product Description here"
                    ></textarea>
                </div>
                <div className="w-full flex flex-col gap-1">
                    <label className="text-base font-medium" htmlFor="category">Category</label>
                    <select 
                        onChange={(e) => setCategory(e.target.value)} 
                        value={category} 
                        id="category" 
                        className="outline-none md:py-2.5 py-2 px-3 rounded border border-gray-500/40"
                        required
                    >
                        <option value="">Select Category</option>
                        {categories.map((item, index) => (
                            <option key={index} value={item.path}>{item.text}</option>
                        ))}
                    </select>
                </div>
                <div className="flex items-center gap-5 flex-wrap">
                    <div className="flex-1 flex flex-col gap-1 w-32">
                        <label className="text-base font-medium" htmlFor="product-price">Product Price</label>
                        <input 
                            onChange={(e) => setPrice(e.target.value)} 
                            value={price} 
                            id="product-price" 
                            type="number" 
                            min="0" 
                            step="0.01" 
                            placeholder="0" 
                            className="outline-none md:py-2.5 py-2 px-3 rounded border border-gray-500/40" 
                            required 
                        />
                    </div>
                    <div className="flex-1 flex flex-col gap-1 w-32">
                        <label className="text-base font-medium" htmlFor="offer-price">Offer Price</label>
                        <input 
                            onChange={(e) => setOfferPrice(e.target.value)} 
                            value={offerPrice} 
                            id="offer-price" 
                            type="number" 
                            min="0" 
                            step="0.01" 
                            placeholder="0" 
                            className="outline-none md:py-2.5 py-2 px-3 rounded border border-gray-500/40" 
                        />
                    </div>
                </div>
                <button 
                    type="submit" 
                    className="px-8 py-2.5 bg-primary hover:bg-primary-dull text-white font-medium rounded cursor-pointer disabled:opacity-50" 
                    disabled={isSubmitting}
                >
                    {isSubmitting ? 'Adding...' : 'ADD PRODUCT'}
                </button>
            </form>
        </div>
    )
}

export default AddProducts
