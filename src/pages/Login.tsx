import { useState, FormEvent, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, Store, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

let deferredPrompt: any = null

export default function Login() {
  const navigate = useNavigate();
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const isAndroid = /Android/i.test(navigator.userAgent)
  const [showInstall, setShowInstall] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [shopName, setShopName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
  const handler = (e: any) => {
    e.preventDefault()
    deferredPrompt = e

    // show floating notification
    setShowInstall(true)

    // auto hide after 5 seconds
    setTimeout(() => {
      setShowInstall(false)
    }, 5000)
  }

  window.addEventListener('beforeinstallprompt', handler)

  return () => {
    window.removeEventListener('beforeinstallprompt', handler)
  }
}, [])


  
  const handleSubmit = async (e: FormEvent) => {
  e.preventDefault();
  setError('');
  setLoading(true);

  try {
    if (isSignUp) {
      if (!shopName.trim()) {
        setError('Shop name is required');
        return;
      }

      // 🔥 ADD name & phone HERE
      await signUp(
        email,
        password,
        shopName.trim(),
        name.trim(),
        phone.trim()
      );
    } else {
      await signIn(email, password);
    }

    navigate('/');
  } catch (error: any) {
    console.error('Authentication error:', error);
    setError(error.message || 'Authentication failed');
  } finally {
    setLoading(false);
  }
  };
  const handleInstall = async () => {
  if (!deferredPrompt) return
  deferredPrompt.prompt()
  await deferredPrompt.userChoice
  deferredPrompt = null
  setShowInstall(false)
}

return (
  <div className="min-h-screen bg-white flex items-center justify-center p-4">
    <div className="w-full max-w-md">

      {/* 🔥 Floating PWA Install Toast */}
{isAndroid && showInstall && (
  <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50">
    <div className="flex items-center gap-3 px-4 py-3 bg-black/80 backdrop-blur-md text-white rounded-xl shadow-2xl border border-white/20">
      <span className="text-sm font-medium flex-1 cursor-pointer" onClick={handleInstall}>
        Install BillWeave
      </span>
      <button
        onClick={() => setShowInstall(false)}
        className="text-white hover:bg-white/20 p-1 rounded transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  </div>
)}


      {/* Form Card */}
      <div className="bg-white rounded-3xl p-8 shadow-2xl border border-gray-100">

        {/* Logo */}
        <div className="text-center mb-8">
          <img
            src="/icons/lo.png"
            alt="BillWeave"
            className="w-30 h-20 mx-auto mb-0"
          />
        </div>
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-black mb-2">
              {isSignUp ? 'Create Account' : 'Welcome Back'}
            </h2>
            <p className="text-gray-600">
              {isSignUp 
                ? 'Set up your tailor shop account' 
                : 'Sign in to manage your tailor shop'
              }
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
  {isSignUp && (
    <>
      {/* User Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          User Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required={isSignUp}
          className="mobile-input-field"
          placeholder="Enter your name"
        />
      </div>

      {/* Mobile Number */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Mobile Number <span className="text-red-500">*</span>
        </label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required={isSignUp}
          className="mobile-input-field"
          placeholder="mobile number, Country code +91"
        />
      </div>

      {/* Shop Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Shop Name <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <Store className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={shopName}
            onChange={(e) => setShopName(e.target.value)}
            required={isSignUp}
            className="mobile-input-field pl-10"
            placeholder="Enter your shop name"
          />
        </div>
      </div>
    </>
  )}

  {/* Email */}
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">
      Email Address
    </label>
    <div className="relative">
      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className="mobile-input-field pl-10"
        placeholder="Enter your email"
      />
    </div>
  </div>

  {/* Password */}
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">
      Password
    </label>
    <div className="relative">
      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
      <input
        type={showPassword ? 'text' : 'password'}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        className="mobile-input-field pl-10 pr-10"
        placeholder="Enter your password"
      />
      <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
      >
        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
      </button>
    </div>
  </div>

  <button
    type="submit"
    disabled={loading}
    className="mobile-btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
  >
    {loading ? (
      <div className="flex items-center justify-center gap-2">
        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
        {isSignUp ? 'Creating Account...' : 'Signing In...'}
      </div>
    ) : (
      isSignUp ? 'Create Account' : 'Sign In'
    )}
  </button>
          </form>
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError('');
                setShopName('');
              }}
              className="text-black hover:text-gray-700 font-medium"
            >
              {isSignUp 
                ? 'Already have an account? Sign in' 
                : "Don't have an account? Sign up"
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}