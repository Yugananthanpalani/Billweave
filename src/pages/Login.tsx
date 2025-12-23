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


  const handleGoogleSignIn = async () => {  
    setError('');
    setLoading(true);
    try {
      await signInWithGoogle();
      navigate('/');
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      setError(error.message || 'Google sign-in failed');
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

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="mobile-btn-google w-full mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </button>
          </div>

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