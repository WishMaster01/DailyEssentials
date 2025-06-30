import React, { useEffect, useState } from 'react'
import { useAppContext } from '../../context/AppContext'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

const SellerLogin = () => {

    const { isSeller, setIsSeller, axios, isLoadingSeller } = useAppContext()
    const navigate = useNavigate();

    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")

    const onSubmitHandler = async (event) => {
        try {
            event.preventDefault();
            const { data } = await axios.post('/api/seller/login', { email, password })

            if (data.success) {
                setIsSeller(true)
                toast.success(data.message || "Logged in successfully!")
                navigate('/seller')
            } else {
                toast.error(data.message)
            }
        }
        catch (error) {
            toast.error(error.response?.data?.message || error.message || "An error occurred during login.")
        }
    }

    useEffect(() => {
        if (!isLoadingSeller && isSeller) {
            navigate("/seller")
        }
    }, [isSeller, isLoadingSeller, navigate])

    if (isLoadingSeller) {
        return (
            <div className="min-h-screen flex items-center justify-center text-xl text-gray-500">
                Checking seller status...
            </div>
        )
    }

    if (isSeller) {
        return null;
    }

    return (
        <form onSubmit={onSubmitHandler} className='min-h-screen flex items-center text-sm text-gray-600'>
            <div className='flex flex-col gap-5 m-auto items-start p-8 py-12 min-w-80 sm:min-w-88 rounded-lg shadow-xl border border-gray-200'>
                <p className='text-2xl font-medium m-auto'><span className='text-primary'>Seller</span> Login</p>

                <div className='w-full'>
                    <p>EMAIL: </p>
                    <input onChange={(e) => setEmail(e.target.value)} value={email} type="email" placeholder='ENTER YOUR EMAIL' className='border border-gray-200 rounded w-full p-2 mt-1 outline-primary' required />
                </div>
                <div className='w-full'>
                    <p>PASSWORD: </p>
                    <input onChange={(e) => setPassword(e.target.value)} value={password} type="password" placeholder='ENTER YOUR PASSWORD' className='border border-gray-200 rounded w-full p-2 mt-1 outline-primary' required />
                </div>

                <button className='bg-primary hover:bg-primary-dull text-white w-full py-2 rounded-md cursor-pointer'>LOGIN</button>

            </div>
        </form>
    )
}

export default SellerLogin
