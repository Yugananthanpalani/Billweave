import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, FileText, Filter, Calendar, MessageCircle, Download } from 'lucide-react';
import { getAllBills } from '../lib/firestore';
import { Bill } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { generatePDF, generatePDFBlob } from '../lib/pdfGenerator';

export default function Bills() {
  const { appUser, user } = useAuth();
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadBills();
  }, []);

  const loadBills = async () => {
    if (!appUser?.id) return;
    try {
      const data = await getAllBills(appUser.id);
      setBills(data);
    } catch (error) {
      console.error('Error loading bills:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredBills = bills.filter(
    (bill) =>
      bill.billNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bill.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bill.customerPhone.includes(searchQuery)
  );

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'status-paid';
      case 'pending':
        return 'status-pending';
      case 'partial':
        return 'status-partial';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleShareWhatsApp = (bill: Bill, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const shopInfo = {
      shopName: appUser?.shopName || 'BillWeave Tailor Shop',
      name: appUser?.name || 'Owner',
      phone: appUser?.phone || 'N/A',
      email: user?.email || 'contact@billweave.com'

    };
    
    // Generate PDF blob
    const pdfBlob = generatePDFBlob(bill, shopInfo);
    
    // Create a temporary URL for the PDF
    const pdfUrl = URL.createObjectURL(pdfBlob);
    
    // Create a temporary download link for the PDF
    const downloadLink = document.createElement('a');
    downloadLink.href = pdfUrl;
    downloadLink.download = `${bill.billNumber}.pdf`;
    
    const message = `Hi ${bill.customerName}! 

Your bill is ready:
📋 Bill Number: ${bill.billNumber}
💰 Total Amount: ₹${bill.total.toFixed(2)}
💳 Amount Paid: ₹${bill.amountPaid.toFixed(2)}
${bill.amountDue > 0 ? `⚠️ Amount Due: ₹${bill.amountDue.toFixed(2)}` : '✅ Fully Paid'}

Payment Status: ${bill.paymentStatus.toUpperCase()}

Thank you for choosing ${shopInfo.shopName}!

📎 Invoice PDF is attached for your records.`;

    const encodedMessage = encodeURIComponent(message);
    
    // Check if we're on mobile or desktop
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile && navigator.share) {
      // Use Web Share API on mobile if available
      navigator.share({
        title: `Invoice ${bill.billNumber}`,
        text: message,
        files: [new File([pdfBlob], `${bill.billNumber}.pdf`, { type: 'application/pdf' })]
      }).catch((error) => {
        console.log('Error sharing:', error);
        // Fallback to WhatsApp Web
        fallbackToWhatsAppWeb();
      });
    } else {
      // Fallback for desktop or when Web Share API is not available
      fallbackToWhatsAppWeb();
    }
    
    function fallbackToWhatsAppWeb() {
      // Download PDF first
      downloadLink.click();
      
      // Then open WhatsApp with message
      setTimeout(() => {
        const whatsappUrl = `https://wa.me/${bill.customerPhone.replace(/[^0-9]/g, '')}?text=${encodedMessage}`;
        window.open(whatsappUrl, '_blank');
        
        // Show instruction to user
        alert('PDF downloaded! Please attach it manually to your WhatsApp message.');
      }, 500);
    }
    
    // Clean up the temporary URL after a delay
    setTimeout(() => {
      URL.revokeObjectURL(pdfUrl);
    }, 10000);
  };

  const handleDownloadPDF = (bill: Bill, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const shopInfo = {
      shopName: appUser?.shopName || 'BillWeave Tailor Shop',
      name: appUser?.name || 'Owner',
      phone: appUser?.phone || 'N/A',
      email: user?.email || 'contact@billweave.com'
    };
    generatePDF(bill, shopInfo, 'download');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-gray-500">Loading bills...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Bills</h1>
          <p className="text-gray-600 mt-1">{bills.length} total bills</p>
        </div>
        <Link
          to="/bills/new"
          className="btn-primary flex items-center gap-2 justify-center sm:w-auto"
        >
          <Plus className="w-5 h-5" />
          New Bill
        </Link>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl p-4 card-shadow">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search bills..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button className="p-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
            <Filter className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Bills List */}
      <div className="space-y-3">
        {filteredBills.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 md:p-12 text-center card-shadow">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchQuery ? 'No bills found' : 'No bills yet'}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchQuery 
                ? 'Try adjusting your search terms' 
                : 'Create your first bill to get started'
              }
            </p>
            {!searchQuery && (
              <Link
                to="/bills/new"
                className="btn-primary inline-flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Create Bill
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredBills.map((bill) => (
              <Link
                key={bill.id}
                to={`/bills/${bill.id}`}
                className="block bg-white rounded-2xl p-4 md:p-6 card-shadow hover:card-shadow-lg transition-all duration-200 group"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold text-blue-600 text-base md:text-lg">
                        {bill.billNumber}
                      </span>
                      <span className={`status-badge ${getPaymentStatusColor(bill.paymentStatus)}`}>
                        {bill.paymentStatus.toUpperCase()}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <Link
                        to={`/customers/${bill.customerId}`}
                        onClick={(e) => e.stopPropagation()}
                        className="font-medium text-gray-900 hover:text-blue-600 text-sm md:text-base transition-colors block w-fit"
                      >
                        {bill.customerName}
                      </Link>
                      <p className="text-sm text-gray-600">{bill.customerPhone}</p>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(bill.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right ml-4 flex-shrink-0">
                    <p className="font-bold text-gray-900 text-base md:text-lg">₹{bill.total.toFixed(2)}</p>
                    {bill.amountDue > 0 && (
                      <p className="text-sm text-red-600">Due: ₹{bill.amountDue.toFixed(2)}</p>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => handleDownloadPDF(bill, e)}
                      className="touch-target p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors md:flex md:items-center md:gap-1 md:px-3 md:py-1 md:rounded-md"
                      title="Download PDF"
                    >
                      <Download className="w-4 h-4 md:w-3 md:h-3" />
                      <span className="hidden md:inline text-xs">PDF</span>
                    </button>
                  <button
                    onClick={(e) => handleShareWhatsApp(bill, e)}
                    className="touch-target p-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors md:flex md:items-center md:gap-1 md:px-3 md:py-1 md:rounded-md"
                    title="Share on WhatsApp"
                  >
                    <MessageCircle className="w-4 h-4 md:w-3 md:h-3" />
                    <span className="hidden md:inline text-xs">WhatsApp</span>
                  </button>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Floating Action Button for Mobile */}
      <Link to="/bills/new" className="floating-action-btn md:hidden">
        <Plus className="w-6 h-6" />
      </Link>
    </div>
  );
}