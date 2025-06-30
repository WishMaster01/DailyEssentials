import React from 'react';
import { useAppContext } from '../context/AppContext';
import toast from 'react-hot-toast';

const Login = ({ onClose }) => {
    const { setShowUserLogin, setUser, axios, navigate } = useAppContext();
    const [state, setState] = React.useState("login");
    const [name, setName] = React.useState("");
    const [email, setEmail] = React.useState("");
    const [password, setPassword] = React.useState("");
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const formRef = React.useRef(null);

    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const validateForm = () => {
        if (!email || !password) {
            toast.error("Please fill in all required fields");
            return false;
        }
        if (state === "register" && !name) {
            toast.error("Please enter your name");
            return false;
        }
        if (password.length < 6) {
            toast.error("Password must be at least 6 characters");
            return false;
        }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) return;
        if (isSubmitting) return;
        
        setIsSubmitting(true);

        try {
            const { data } = await axios.post(`/api/user/${state}`, {
                name, email, password
            }, {
                timeout: 10000 // 10 second timeout
            });

            if (data.success) {
                toast.success(`Welcome ${data.user?.name || ''}!`);
                navigate('/');
                setUser(data.user);
                setShowUserLogin(false);
                // Reset form
                setName("");
                setEmail("");
                setPassword("");
            } else {
                toast.error(data.message || "Login failed");
            }
        } catch (error) {
            console.error("Login error:", error);
            
            // Handle different error types appropriately
            if (error.code === "ECONNABORTED") {
                toast.error("Request timed out. Please try again.");
            } else if (error.response) {
                // Server responded with error status
                toast.error(error.response.data?.message || "Login failed");
            } else if (error.request) {
                // Request was made but no response
                toast.error("Network error. Please check your connection.");
            } else {
                // Other errors
                toast.error("Something went wrong. Please try again.");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div
            onClick={handleOverlayClick}
            className='inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm'
        >
            <form
                onSubmit={handleSubmit}
                onClick={(e) => e.stopPropagation()}
                className="flex flex-col gap-5 p-8 py-10 w-80 sm:w-[380px] rounded-xl shadow-2xl border border-gray-100 bg-white relative mx-4"
                style={{ transform: 'translateZ(0)' }}
                ref={formRef}
            >
                {/* Close Button */}
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 transition-colors duration-200"
                    aria-label="Close"
                    disabled={isSubmitting}
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>

                <p className="text-3xl font-bold text-center text-gray-800 mt-2">
                    <span className="text-primary-dull">User</span> {state === "login" ? "Login" : "Sign Up"}
                </p>

                {state === "register" && (
                    <div className="w-full">
                        <label htmlFor="name" className="text-base font-medium text-gray-700 mb-1 block">Name</label>
                        <input
                            id="name"
                            onChange={(e) => setName(e.target.value)}
                            value={name}
                            placeholder="Your full name"
                            className="border border-gray-300 rounded-md w-full p-3 focus:outline-none focus:ring-2 focus:ring-primary transition-all text-base"
                            type="text"
                            required
                            disabled={isSubmitting}
                        />
                    </div>
                )}

                <div className="w-full">
                    <label htmlFor="email" className="text-base font-medium text-gray-700 mb-1 block">Email</label>
                    <input
                        id="email"
                        onChange={(e) => setEmail(e.target.value)}
                        value={email}
                        placeholder="your@example.com"
                        className="border border-gray-300 rounded-md w-full p-3 focus:outline-none focus:ring-2 focus:ring-primary transition-all text-base"
                        type="email"
                        required
                        disabled={isSubmitting}
                    />
                </div>

                <div className="w-full">
                    <label htmlFor="password" className="text-base font-medium text-gray-700 mb-1 block">Password</label>
                    <input
                        id="password"
                        onChange={(e) => setPassword(e.target.value)}
                        value={password}
                        placeholder="Minimum 6 characters"
                        className="border border-gray-300 rounded-md w-full p-3 focus:outline-none focus:ring-2 focus:ring-primary transition-all text-base"
                        type="password"
                        required
                        disabled={isSubmitting}
                    />
                </div>

                {state === "register" ? (
                    <p className="text-sm text-gray-600">
                        Already have an account? <span onClick={() => setState("login")} className="text-primary hover:text-primary--dull font-medium cursor-pointer transition-colors">Log In here</span>
                    </p>
                ) : (
                    <p className="text-sm text-gray-600">
                        Don't have an account? <span onClick={() => setState("register")} className="text-primary-dull hover:text-primary-dull font-medium cursor-pointer transition-colors">Sign Up here</span>
                    </p>
                )}

                <button
                    type="submit"
                    className={`bg-primary-dull hover:bg-primary-dull text-white w-full py-3 rounded-lg text-lg font-semibold shadow-md hover:shadow-lg transition-all ${
                        isSubmitting ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'
                    }`}
                    disabled={isSubmitting}
                >
                    {isSubmitting ? (
                        <span className="flex items-center justify-center gap-2">
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Processing...
                        </span>
                    ) : (
                        state === "register" ? "Create Account" : "Login"
                    )}
                </button>

                {state === "register" && (
                    <div className="flex items-center gap-2 mt-2">
                        <input type="checkbox" id="terms" className="form-checkbox h-4 w-4 text-primary-dull rounded" required disabled={isSubmitting} />
                        <label htmlFor="terms" className="text-xs text-gray-600 select-none">
                            By continuing, I agree to the <span className="text-primary-dull hover:underline cursor-pointer">terms of use</span> & <span className="text-primary-dull hover:underline cursor-pointer">privacy policy</span>.
                        </label>
                    </div>
                )}
            </form>
        </div>
    );
}

export default Login;
