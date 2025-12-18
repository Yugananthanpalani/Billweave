import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Download, Printer, Save, X, MessageCircle, Share, Mail } from 'lucide-react';
import { getBill, updateBill } from '../lib/firestore';
import { Bill } from '../types';
import { generatePDF } from '../lib/pdfGenerator';
import { useAuth } from '../contexts/AuthContext';

export default function BillDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { appUser, user } = useAuth();
  const [bill, setBill] = useState<Bill | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditingPayment, setIsEditingPayment] = useState(false);
  const [editPaymentStatus, setEditPaymentStatus] = useState<'paid' | 'pending' | 'partial'>('pending');
  const [editAmountPaid, setEditAmountPaid] = useState(0);
  const [saving, setSaving] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailAddress, setEmailAddress] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);

  useEffect(() => {
    if (id) {
      loadBill();
    }
  }, [id]);

  const loadBill = async () => {
    if (!id) return;
    try {
      const data = await getBill(id);
      setBill(data);
      if (data) {
        setEditPaymentStatus(data.paymentStatus);
        setEditAmountPaid(data.amountPaid);
      }
    } catch (error) {
      console.error('Error loading bill:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    if (bill) {
      const shopInfo = {
        shopName: appUser?.shopName || 'BillWeave Tailor Shop',
        email: user?.email || 'contact@billweave.com'
      };
      generatePDF(bill, shopInfo, 'download');
    }
  };

  const handlePrintPDF = () => {
    if (bill) {
      const shopInfo = {
        shopName: appUser?.shopName || 'BillWeave Tailor Shop',
        email: user?.email || 'contact@billweave.com'
      };
      generatePDF(bill, shopInfo, 'print');
    }
  };

  const handleEmailPDF = () => {
    if (bill) {
      // Check if customer has email
      const customerEmail = bill.customerName; // You might want to add customer email to bill data
      if (customerEmail && customerEmail.includes('@')) {
        setEmailAddress(customerEmail);
      }
      setShowEmailModal(true);
    }
  };

  const handleSendEmail = async () => {
    if (!bill || !emailAddress.trim()) return;

    setSendingEmail(true);
    try {
      const shopInfo = {
        shopName: appUser?.shopName || 'BillWeave Tailor Shop',
        email: user?.email || 'contact@billweave.com'
      };
      
      // Generate PDF as blob
      const doc = new jsPDF();
      // ... (PDF generation code would go here, similar to generatePDF but returning blob)
      
      // For now, we'll show a success message and open email client
      const subject = `Invoice ${bill.billNumber} from ${shopInfo.shopName}`;
      const body = `Dear ${bill.customerName},

Please find attached your invoice ${bill.billNumber} for ₹${bill.total.toFixed(2)}.

Payment Status: ${bill.paymentStatus.toUpperCase()}
Amount Paid: ₹${bill.amountPaid.toFixed(2)}
${bill.amountDue > 0 ? `Amount Due: ₹${bill.amountDue.toFixed(2)}` : ''}

Thank you for choosing ${shopInfo.shopName}!

Best regards,
${shopInfo.shopName}
${shopInfo.email}`;

      const mailtoLink = `mailto:${emailAddress}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.open(mailtoLink);
      
      setShowEmailModal(false);
      alert('Email client opened. Please attach the PDF manually and send the email.');
    } catch (error) {
      console.error('Error preparing email:', error);
      alert('Failed to prepare email. Please try again.');
    } finally {
      setSendingEmail(false);
    }
  };

  const handleEditPayment = () => {
    if (bill) {
      setEditPaymentStatus(bill.paymentStatus);
      setEditAmountPaid(bill.amountPaid);
      setIsEditingPayment(true);
    }
  };

  const handleCancelEdit = () => {
    setIsEditingPayment(false);
    if (bill) {
      setEditPaymentStatus(bill.paymentStatus);
      setEditAmountPaid(bill.amountPaid);
    }
  };

  const handleSavePayment = async () => {
    if (!bill || !id || !appUser?.id) return;

    setSaving(true);
    try {
      const newAmountDue = bill.total - editAmountPaid;
      
      const updatedBill = {
        paymentStatus: editPaymentStatus,
        amountPaid: editAmountPaid,
        amountDue: newAmountDue,
      };

      await updateBill(id, updatedBill, appUser.id);
      
      setBill({
        ...bill,
        ...updatedBill,
        updatedAt: new Date(),
      });
      
      setIsEditingPayment(false);
    } catch (error) {
      console.error('Error updating payment:', error);
      alert('Failed to update payment. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleShareWhatsApp = () => {
    if (bill) {
      const message = `Hi ${bill.customerName}! 

Your bill is ready:
📋 Bill Number: ${bill.billNumber}
💰 Total Amount: ₹${bill.total.toFixed(2)}
💳 Amount Paid: ₹${bill.amountPaid.toFixed(2)}
${bill.amountDue > 0 ? `⚠️ Amount Due: ₹${bill.amountDue.toFixed(2)}` : '✅ Fully Paid'}

Payment Status: ${bill.paymentStatus.toUpperCase()}

Thank you for choosing BillWeave Tailors!`;

      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `https://wa.me/${bill.customerPhone.replace(/[^0-9]/g, '')}?text=${encodedMessage}`;
      window.open(whatsappUrl, '_blank');
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-red-100 text-red-800';
      case 'partial':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading bill details...</div>
      </div>
    );
  }

  if (!bill) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Bill not found</p>
        <Link to="/bills" className="text-blue-600 hover:text-blue-700 mt-2 inline-block">
          Back to Bills
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/bills')}
            className="touch-target p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-black">{bill.billNumber}</h1>
            <p className="text-xs text-gray-600">
              {new Date(bill.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleShareWhatsApp}
            className="touch-target p-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
            title="Share on WhatsApp"
          >
            <MessageCircle className="w-5 h-5" />
          </button>
          <button
            onClick={handleDownloadPDF}
            className="touch-target p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
            title="Download PDF"
          >
            <Download className="w-5 h-5" />
          </button>
          <button
            onClick={handleEmailPDF}
            className="touch-target p-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors"
            title="Email PDF"
          >
            <Mail className="w-5 h-5" />
          </button>
          <button
            onClick={handlePrintPDF}
            className="touch-target p-2 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors"
            title="Print"
          >
            <Printer className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden md:flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/bills')}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{bill.billNumber}</h1>
            <p className="text-gray-600 mt-1">
              {new Date(bill.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleShareWhatsApp}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors flex items-center gap-2 font-medium"
          >
            <MessageCircle className="w-4 h-4" />
            WhatsApp
          </button>
          <button
            onClick={handlePrintPDF}
            className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors flex items-center gap-2 font-medium"
          >
            <Printer className="w-4 h-4" />
            Print
          </button>
          <button
            onClick={handleDownloadPDF}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium"
          >
            <Download className="w-4 h-4" />
            Download PDF
          </button>
          <button
            onClick={handleEmailPDF}
            className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors flex items-center gap-2 font-medium"
          >
            <Mail className="w-4 h-4" />
            Email PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        <div className="lg:col-span-2 space-y-4 md:space-y-6">
          <div className="bg-white rounded-2xl p-4 md:p-6 card-shadow">
            <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-4">Customer Information</h2>
            <div className="space-y-2">
              <div>
                <span className="text-gray-600">Name:</span>
                <Link
                  to={`/customers/${bill.customerId}`}
                  className="ml-2 font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                >
                  {bill.customerName}
                </Link>
              </div>
              <div>
                <span className="text-gray-600">Phone:</span>
                <span className="ml-2 font-semibold text-gray-900">{bill.customerPhone}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 md:p-6 card-shadow">
            <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-4">Items</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-gray-200">
                  <tr>
                    <th className="text-left py-2 text-xs md:text-sm font-medium text-gray-700">Item</th>
                    <th className="text-center py-2 text-xs md:text-sm font-medium text-gray-700">Qty</th>
                    <th className="text-right py-2 text-xs md:text-sm font-medium text-gray-700">Price</th>
                    <th className="text-right py-2 text-xs md:text-sm font-medium text-gray-700">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {bill.items.map((item) => (
                    <tr key={item.id}>
                      <td className="py-2 md:py-3 text-sm md:text-base text-gray-900">{item.name}</td>
                      <td className="py-2 md:py-3 text-center text-sm md:text-base text-gray-900">{item.quantity}</td>
                      <td className="py-2 md:py-3 text-right text-sm md:text-base text-gray-900">₹{item.price.toFixed(2)}</td>
                      <td className="py-2 md:py-3 text-right font-semibold text-sm md:text-base text-gray-900">
                        ₹{item.total.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="max-w-xs ml-auto space-y-2 text-sm md:text-base">
                <div className="flex justify-between text-gray-700">
                  <span>Subtotal:</span>
                  <span className="font-semibold">₹{bill.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>GST ({bill.taxPercentage}%):</span>
                  <span className="font-semibold">₹{bill.tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-base md:text-lg font-bold pt-2 border-t border-gray-200">
                  <span>Total:</span>
                  <span className="text-blue-600">₹{bill.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {bill.notes && (
            <div className="bg-white rounded-2xl p-4 md:p-6 card-shadow">
              <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-4">Notes</h2>
              <p className="text-sm md:text-base text-gray-700 whitespace-pre-wrap bg-gray-50 p-3 rounded-xl">{bill.notes}</p>
            </div>
          )}
        </div>

        <div className="space-y-4 md:space-y-6">
          <div className="bg-white rounded-2xl p-4 md:p-6 card-shadow">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg md:text-xl font-semibold text-gray-900">Payment Status</h2>
              {!isEditingPayment && (
                <button
                  onClick={handleEditPayment}
                  className="text-blue-600 hover:text-blue-700 text-xs md:text-sm font-medium px-2 md:px-3 py-1 rounded-xl hover:bg-blue-50 transition-colors"
                >
                  Edit Payment
                </button>
              )}
            </div>
            
            {isEditingPayment ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Status
                  </label>
                  <select
                    value={editPaymentStatus}
                    onChange={(e) => setEditPaymentStatus(e.target.value as 'paid' | 'pending' | 'partial')}
                    className="input-field"
                  >
                    <option value="pending">Pending</option>
                    <option value="partial">Partial</option>
                    <option value="paid">Paid</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount Paid
                  </label>
                  <input
                    type="number"
                    value={editAmountPaid}
                    onChange={(e) => setEditAmountPaid(parseFloat(e.target.value) || 0)}
                    min="0"
                    max={bill.total}
                    step="0.01"
                    className="input-field"
                  />
                </div>
                <div className="bg-gray-50 p-3 rounded-xl">
                  <div className="text-sm text-gray-600">Amount Due (Preview)</div>
                  <div className="text-base md:text-lg font-bold text-gray-900">
                    ₹{(bill.total - editAmountPaid).toFixed(2)}
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={handleSavePayment}
                    disabled={saving}
                    className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Save
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    disabled={saving}
                    className="flex-1 btn-secondary disabled:opacity-50"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <span
                    className={`status-badge ${getPaymentStatusColor(
                      bill.paymentStatus
                    )}`}
                  >
                    {bill.paymentStatus.toUpperCase()}
                  </span>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Amount Paid</div>
                  <div className="text-lg md:text-xl font-bold text-green-600">₹{bill.amountPaid.toFixed(2)}</div>
                </div>
                {bill.amountDue > 0 && (
                  <div>
                    <div className="text-sm text-gray-600">Amount Due</div>
                    <div className="text-lg md:text-xl font-bold text-red-600">₹{bill.amountDue.toFixed(2)}</div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl p-4 md:p-6 card-shadow">
            <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-4">Details</h2>
            <div className="space-y-3 text-sm">
              <div>
                <div className="text-gray-600">Bill Number</div>
                <div className="font-semibold text-gray-900">{bill.billNumber}</div>
              </div>
              <div>
                <div className="text-gray-600">Created Date</div>
                <div className="font-semibold text-gray-900">
                  {new Date(bill.createdAt).toLocaleDateString()}
                </div>
              </div>
              <div>
                <div className="text-gray-600">Last Updated</div>
                <div className="font-semibold text-gray-900">
                  {new Date(bill.updatedAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-slide-in-up">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-semibold text-gray-900">Email Invoice</h2>
              <button
                onClick={() => setShowEmailModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-xl"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={emailAddress}
                  onChange={(e) => setEmailAddress(e.target.value)}
                  required
                  className="input-field"
                  placeholder="Enter email address"
                />
              </div>

              <div className="bg-blue-50 p-4 rounded-xl">
                <h3 className="font-medium text-blue-900 mb-2">Invoice Details:</h3>
                <p className="text-sm text-blue-800">
                  Bill Number: {bill?.billNumber}<br/>
                  Customer: {bill?.customerName}<br/>
                  Amount: ₹{bill?.total.toFixed(2)}
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSendEmail}
                  disabled={sendingEmail || !emailAddress.trim()}
                  className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sendingEmail ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      Preparing...
                    </>
                  ) : (
                    <>
                      <Mail className="w-5 h-5" />
                      Send Email
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowEmailModal(false)}
                  className="flex-1 btn-secondary"
                  disabled={sendingEmail}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}