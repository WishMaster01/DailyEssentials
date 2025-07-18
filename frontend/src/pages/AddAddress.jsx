import React, { useEffect, useState } from 'react'
import { assets } from '../assets/assets'
import { useAppContext } from '../context/AppContext'
import toast from 'react-hot-toast'

// INPUT FIELD COMPONENTS
const InputField = ({ type, placeholder, name, handlechange, address }) => (
    <input className='w-full px-2 pu-2.5 border border-gray-500/30 rounded outline-none text-gray-500 focus:border-primary transition'
        type={type} 
        placeholder={placeholder}
        name={name}
        value={address[name]}
        onChange={handlechange}
        required
    />
)

const AddAddress = () => {

    const { axios, user, navigate } = useAppContext();

    const [address, setAddress] =useState({
        firstName: '',
        lastName: '',
        email: '',
        street: '',
        city: '',
        state: '',
        zipcode: '',
        country: '',
        phone: '',
    })

    const handlechange = (e) => {
        const { name, value } = e.target;

        setAddress((prevAddress) => ({
            ...prevAddress,
            [name]: value,
        }))
    }

    const onSubmitHandler = async (e) => {
        e.preventDefault();
        try {
            const {data} = await axios.post('/api/address/add', {address, userId: user._id});

            if(data.success) {
                toast.success(data.message)
                navigate('/cart')
            }
            else {
                toast.error(data.message)
            }
        } 
        catch (error) {
            toast.error(error.message)    
        }
    }

    useEffect(() => {
        if(!user) {
            navigate('/cart')
        }
    }, []);

    return (
        <div className='mt-16 pb-16'>
            <p className='text-2xl md:text-3xl text-gray-500'>Add Shipping <span className='font-semibold text-primary'>Address</span></p>
            <div className='flex flex-col-reverse md:flex-row justify-between mt-10'>
                <div className='flex-1 max-w-md'>
                    <form onSubmit={onSubmitHandler} className='space-y-3 mt-6 text-sm'>

                        <div className='grid grid-cols-2 gap-4'>
                            <InputField handlechange={handlechange} address={address} name='firstName' type="text" placeholder="FIRST NAME" />
                            <InputField handlechange={handlechange} address={address} name='lastName' type="text" placeholder="LAST NAME" />
                        </div>

                        <InputField handlechange={handlechange} address={address} name='email' type="email" placeholder="E-MAIL ADDRESS" />
                        <InputField handlechange={handlechange} address={address} name='street' type="text" placeholder="STREET" />
                        
                        <div className='grid grid-cols-2 gap-4'>
                            <InputField handlechange={handlechange} address={address} name='city' type="text" placeholder="CITY" />
                            <InputField handlechange={handlechange} address={address} name='state' type="text" placeholder="STATE" />
                        </div>

                        <div className='grid grid-cols-2 gap-4'>
                            <InputField handlechange={handlechange} address={address} name='zipcode' type="number" placeholder="ZIP CODE" />
                            <InputField handlechange={handlechange} address={address} name='country' type="text" placeholder="COUNTRY" /> 
                        </div>

                        <InputField handlechange={handlechange} address={address} name='phone' type="text" placeholder="PHONE NUMBER" />

                        <button className='w-full mt-6 bg-primary text-white py-3 hover:bg-primary-dull transition cursor-pointer uppercase'>
                            SAVE ADDRESS
                        </button>

                    </form>
                </div>
                <img src={assets.add_address_iamge} alt="add-address" className='md:mr-16 mb-16 md:mt-0' />
            </div>
        </div>
    )
}

export default AddAddress
