import { useState, useEffect, FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, X } from 'lucide-react';
import { addCustomer, updateCustomer, getCustomer } from '../lib/firestore';
import { Customer, Measurements } from '../types';
import { useAuth } from '../contexts/AuthContext';

export default function CustomerForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);
  const { appUser } = useAuth();

  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [showMeasurements, setShowMeasurements] = useState(false);
  const [measurements, setMeasurements] = useState<Measurements>({
    chest: undefined,
    waist: undefined,
    hips: undefined,
    shoulder: undefined,
    sleeveLengthh: undefined,
    shirtLength: undefined,
    neck: undefined,
    inseam: undefined,
    outseam: undefined,
  });

  useEffect(() => {
    if (id) {
      loadCustomer();
    }
  }, [id]);

  // Check if user is blocked
  useEffect(() => {
    if (appUser?.isBlocked) {
      alert('Your account has been blocked. You cannot modify customers.');
      navigate('/customers');
    }
  }, [appUser, navigate]);
  
  const loadCustomer = async () => {
    if (!id) return;
    try {
      const customer = await getCustomer(id);
      if (customer) {
        setName(customer.name);
        setPhone(customer.phone);
        setEmail(customer.email || '');
        setAddress(customer.address || '');
        setMeasurements(customer.measurements || {});
        // Show measurements section if customer has any measurements
        const hasMeasurements = Object.values(customer.measurements || {}).some(val => val !== undefined);
        setShowMeasurements(hasMeasurements);
      }
    } catch (error) {
      console.error('Error loading customer:', error);
    }
  };

  const handleMeasurementChange = (key: string, value: string) => {
    setMeasurements((prev) => ({
      ...prev,
      [key]: value ? parseFloat(value) : undefined,
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      alert('Please enter customer name');
      return;
    }
    
    if (!phone.trim()) {
      alert('Please enter phone number');
      return;
    }
    
    if (!appUser?.id) {
      alert('User not authenticated');
      return;
    }

    setLoading(true);

    try {
      const customerData = {
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        address: address.trim(),
        measurements: showMeasurements ? measurements : {},
      };

      if (isEditing && id) {
        await updateCustomer(id, customerData, appUser.id);
      } else {
        await addCustomer({
          ...customerData,
          createdAt: new Date(),
          updatedAt: new Date(),
        }, appUser.id);
      }

      navigate('/customers');
    } catch (error) {
      console.error('Error saving customer:', error);
      alert('Failed to save customer. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const measurementFields = [
    { key: 'chest', label: 'Chest' },
    { key: 'waist', label: 'Waist' },
    { key: 'hips', label: 'Hips' },
    { key: 'shoulder', label: 'Shoulder' },
    { key: 'sleeveLengthh', label: 'Sleeve Length' },
    { key: 'shirtLength', label: 'Shirt Length' },
    { key: 'neck', label: 'Neck' },
    { key: 'inseam', label: 'Inseam' },
    { key: 'outseam', label: 'Outseam' },
  ];

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center gap-4 mb-4">
        <button
          type="button"
          onClick={() => navigate('/customers')}
          className="touch-target p-2 hover:bg-gray-100 rounded-xl transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-black">
            {isEditing ? 'Edit Customer' : 'Add Customer'}
          </h1>
          <p className="text-xs text-gray-600">
            {isEditing ? 'Update customer details' : 'Create new customer'}
          </p>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden md:block">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/customers')}
              className="touch-target p-2 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                {isEditing ? 'Edit Customer' : 'Add Customer'}
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="space-y-4 md:space-y-6">
        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
          {/* Basic Information */}
          <div className="bg-white rounded-2xl p-4 md:p-6 card-shadow">
            <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-4">
              Basic Information
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="input-field"
                  placeholder="Enter customer's full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  className="input-field"
                  placeholder="Enter phone number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field"
                  placeholder="Enter email address (optional)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address
                </label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={3}
                  className="input-field resize-none"
                  placeholder="Enter full address (optional)"
                />
              </div>
            </div>
          </div>

          {/* Measurements Section Toggle */}
          <div className="bg-white rounded-2xl p-4 md:p-6 card-shadow">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg md:text-xl font-semibold text-gray-900">
                  Measurements
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Optional - Add customer measurements for tailoring
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowMeasurements(!showMeasurements)}
                className={`touch-target px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  showMeasurements
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {showMeasurements ? 'Hide' : 'Add'} Measurements
              </button>
            </div>

            {showMeasurements && (
              <div className="space-y-4">
                <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-xl">
                  <p className="font-medium text-blue-800 mb-1">Measurement Guide:</p>
                  <p>All measurements should be in inches. Leave blank if not applicable.</p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {measurementFields.map((field) => (
                    <div key={field.key}>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {field.label} (inches)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={measurements[field.key] || ''}
                        onChange={(e) => handleMeasurementChange(field.key, e.target.value)}
                        className="input-field"
                        placeholder="0.0"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="bg-white rounded-2xl p-4 md:p-6 card-shadow">
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    {isEditing ? 'Updating...' : 'Saving...'}
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    {isEditing ? 'Update Customer' : 'Save Customer'}
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => navigate('/customers')}
                className="btn-secondary flex-1"
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}