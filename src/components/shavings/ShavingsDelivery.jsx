import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { format } from 'date-fns';
import { shavingsCustomerOperations, shavingsBagsOperations, shavingsDeliveryOperations } from '../../data/supabaseOperations';

const { FiTruck, FiPlus, FiSave, FiX, FiUser, FiDollarSign, FiClipboard, FiCheck, FiSend, FiDownload, FiMail, FiEdit3 } = FiIcons;

const ShavingsDelivery = () => {
  const [activeTab, setActiveTab] = useState('create');
  const [customers, setCustomers] = useState([]);
  const [inventorySummary, setInventorySummary] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(false);

  // Delivery form state
  const [showDeliveryForm, setShowDeliveryForm] = useState(false);
  const [deliveryForm, setDeliveryForm] = useState({
    customer_id: '',
    quantity_delivered: 1,
    customer_packed: false,
    notes: '',
    signature_data: ''
  });
  
  // Signature state
  const [isSigning, setIsSigning] = useState(false);
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Customer details for pricing
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // Selected delivery for viewing delivery note
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [showDeliveryNote, setShowDeliveryNote] = useState(false);

  useEffect(() => {
    loadCustomers();
    loadInventorySummary();
    if (activeTab === 'view') {
      loadDeliveries();
    }
  }, [activeTab]);

  useEffect(() => {
    if (deliveryForm.customer_id) {
      loadSelectedCustomer(deliveryForm.customer_id);
    } else {
      setSelectedCustomer(null);
    }
  }, [deliveryForm.customer_id]);

  const loadCustomers = async () => {
    try {
      const data = await shavingsCustomerOperations.getShavingsCustomers();
      setCustomers(data);
    } catch (error) {
      console.error('Error loading customers:', error);
      alert('Error loading shavings customers');
    }
  };

  const loadInventorySummary = async () => {
    try {
      const data = await shavingsBagsOperations.getBagsInventorySummary();
      setInventorySummary(data);
    } catch (error) {
      console.error('Error loading inventory summary:', error);
    }
  };

  const loadDeliveries = async () => {
    setLoading(true);
    try {
      const data = await shavingsDeliveryOperations.getDeliveries();
      setDeliveries(data);
    } catch (error) {
      console.error('Error loading deliveries:', error);
      alert('Error loading shavings deliveries');
    } finally {
      setLoading(false);
    }
  };

  const loadSelectedCustomer = async (customerId) => {
    try {
      const customer = await shavingsCustomerOperations.getShavingsCustomerById(customerId);
      setSelectedCustomer(customer);
    } catch (error) {
      console.error('Error loading customer details:', error);
    }
  };

  const handleDeliverySubmit = async (e) => {
    e.preventDefault();
    
    if (!deliveryForm.signature_data) {
      alert('Please add a signature');
      return;
    }

    setLoading(true);
    try {
      // Check if enough packed bags are available
      const customerSummary = inventorySummary.find(item => item.customer_id === deliveryForm.customer_id);
      if (!customerSummary || customerSummary.available_packed < deliveryForm.quantity_delivered) {
        alert(`Not enough packed bags available. Only ${customerSummary?.available_packed || 0} bags available.`);
        setLoading(false);
        return;
      }

      // Calculate total amount
      const pricePerBag = selectedCustomer?.price_per_bag || 10;
      const packingFee = selectedCustomer?.packing_fee || 2;
      const packingTotal = deliveryForm.customer_packed ? 0 : packingFee * deliveryForm.quantity_delivered;
      const totalAmount = (pricePerBag * deliveryForm.quantity_delivered) + packingTotal;

      // Create delivery record
      const deliveryData = {
        ...deliveryForm,
        price_per_bag: pricePerBag,
        packing_fee: packingFee,
        total_amount: totalAmount
      };

      const delivery = await shavingsDeliveryOperations.createDelivery(deliveryData);
      
      // Send invoice email
      await shavingsDeliveryOperations.markInvoiceSent(delivery.id);
      
      alert('Delivery record created and invoice sent successfully!');
      resetDeliveryForm();
      loadInventorySummary();
      if (activeTab === 'view') {
        loadDeliveries();
      }
    } catch (error) {
      console.error('Error creating delivery record:', error);
      alert('Error creating delivery record. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const markPaymentReceived = async (deliveryId, paymentMethod = 'Cash') => {
    if (window.confirm('Are you sure you want to mark this invoice as paid?')) {
      setLoading(true);
      try {
        await shavingsDeliveryOperations.markPaymentReceived(deliveryId, paymentMethod);
        alert('Payment marked as received!');
        loadDeliveries();
      } catch (error) {
        console.error('Error marking payment:', error);
        alert('Error marking payment. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const resendInvoice = async (deliveryId) => {
    if (window.confirm('Are you sure you want to resend the invoice?')) {
      setLoading(true);
      try {
        await shavingsDeliveryOperations.markInvoiceSent(deliveryId);
        alert('Invoice resent successfully!');
        loadDeliveries();
      } catch (error) {
        console.error('Error resending invoice:', error);
        alert('Error resending invoice. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const viewDeliveryNote = async (deliveryId) => {
    setLoading(true);
    try {
      const delivery = await shavingsDeliveryOperations.getDeliveryById(deliveryId);
      setSelectedDelivery(delivery);
      setShowDeliveryNote(true);
    } catch (error) {
      console.error('Error loading delivery details:', error);
      alert('Error loading delivery details');
    } finally {
      setLoading(false);
    }
  };

  const resetDeliveryForm = () => {
    setDeliveryForm({
      customer_id: '',
      quantity_delivered: 1,
      customer_packed: false,
      notes: '',
      signature_data: ''
    });
    setSelectedCustomer(null);
    setShowDeliveryForm(false);
    setIsSigning(false);
    setIsDrawing(false);
  };

  // Signature canvas functions
  const startDrawing = (e) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const ctx = canvas.getContext('2d');
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    const signatureData = canvas.toDataURL();
    setDeliveryForm({ ...deliveryForm, signature_data: signatureData });
    setIsSigning(false);
  };

  // Calculate total amount
  const calculateTotal = () => {
    if (!selectedCustomer || !deliveryForm.quantity_delivered) return { bagsTotal: 0, packingTotal: 0, grandTotal: 0 };
    
    const pricePerBag = selectedCustomer.price_per_bag;
    const packingFee = selectedCustomer.packing_fee;
    const quantity = deliveryForm.quantity_delivered;
    
    const bagsTotal = pricePerBag * quantity;
    const packingTotal = deliveryForm.customer_packed ? 0 : packingFee * quantity;
    const grandTotal = bagsTotal + packingTotal;
    
    return { bagsTotal, packingTotal, grandTotal };
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto p-6 space-y-6"
    >
      {!showDeliveryNote ? (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <SafeIcon icon={FiTruck} className="text-2xl text-teal-600" />
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Shavings Delivery</h2>
                <p className="text-gray-600">Manage sh avings deliveries and invoices</p>
              </div>
            </div>
            <div className="flex gap-3">
              {activeTab === 'create' && (
                <button
                  onClick={() => setShowDeliveryForm(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                >
                  <SafeIcon icon={FiPlus} />
                  <span>Create Delivery</span>
                </button>
              )}
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex mb-6 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('create')}
              className={`flex-1 py-2 px-4 rounded-md transition-colors ${activeTab === 'create' ? 'bg-teal-600 text-white' : 'hover:bg-gray-200'}`}
            >
              <div className="flex items-center justify-center gap-2">
                <SafeIcon icon={FiPlus} />
                <span>Create Delivery</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('view')}
              className={`flex-1 py-2 px-4 rounded-md transition-colors ${activeTab === 'view' ? 'bg-teal-600 text-white' : 'hover:bg-gray-200'}`}
            >
              <div className="flex items-center justify-center gap-2">
                <SafeIcon icon={FiClipboard} />
                <span>View Deliveries</span>
              </div>
            </button>
          </div>

          {activeTab === 'create' ? (
            <div className="p-6 bg-gray-50 rounded-lg">
              <div className="text-center">
                <SafeIcon icon={FiTruck} className="text-5xl text-teal-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Create Shavings Delivery</h3>
                <p className="text-gray-600 mb-6">Record a new shavings delivery and generate an invoice</p>
                <button
                  onClick={() => setShowDeliveryForm(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                >
                  <SafeIcon icon={FiPlus} />
                  <span>Create Delivery</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Invoice #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-600 mr-2"></div>
                          <span>Loading deliveries...</span>
                        </div>
                      </td>
                    </tr>
                  ) : deliveries.length > 0 ? (
                    deliveries.map((delivery) => (
                      <tr key={delivery.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{delivery.invoice_number}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{delivery.customer_name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{delivery.quantity_delivered}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">R{delivery.total_amount.toFixed(2)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {format(new Date(delivery.delivery_date), 'MMM dd, yyyy')}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${delivery.payment_received ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                            {delivery.payment_received ? 'Paid' : 'Pending Payment'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => viewDeliveryNote(delivery.id)}
                              className="text-teal-600 hover:text-teal-900"
                              title="View Delivery Note"
                            >
                              <SafeIcon icon={FiClipboard} />
                            </button>
                            {!delivery.payment_received && (
                              <>
                                <button
                                  onClick={() => markPaymentReceived(delivery.id)}
                                  className="text-green-600 hover:text-green-900"
                                  title="Mark as Paid"
                                >
                                  <SafeIcon icon={FiCheck} />
                                </button>
                                <button
                                  onClick={() => resendInvoice(delivery.id)}
                                  className="text-blue-600 hover:text-blue-900"
                                  title="Resend Invoice"
                                >
                                  <SafeIcon icon={FiMail} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                        No deliveries found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <DeliveryNote delivery={selectedDelivery} onClose={() => setShowDeliveryNote(false)} />
      )}

      {/* Delivery Form Modal */}
      {showDeliveryForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-800">Create Shavings Delivery</h3>
                <button
                  onClick={resetDeliveryForm}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <SafeIcon icon={FiX} className="text-xl" />
                </button>
              </div>
              <form onSubmit={handleDeliverySubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Customer <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={deliveryForm.customer_id}
                    onChange={(e) => setDeliveryForm({ ...deliveryForm, customer_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select customer</option>
                    {customers.map(customer => {
                      const customerSummary = inventorySummary.find(item => item.customer_id === customer.id);
                      const availablePacked = customerSummary ? customerSummary.available_packed : 0;
                      return (
                        <option key={customer.id} value={customer.id} disabled={availablePacked <= 0}>
                          {customer.name} {availablePacked > 0 ? `(${availablePacked} packed bags)` : '(No packed bags)'}
                        </option>
                      );
                    })}
                  </select>
                </div>
                
                {selectedCustomer && (
                  <div className="p-4 bg-teal-50 rounded-lg">
                    <h4 className="font-medium text-teal-800 mb-2">Customer Pricing</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm text-teal-600">Price per bag:</span>
                        <p className="text-lg font-bold text-teal-800">R{selectedCustomer.price_per_bag.toFixed(2)}</p>
                      </div>
                      <div>
                        <span className="text-sm text-teal-600">Packing fee per bag:</span>
                        <p className="text-lg font-bold text-teal-800">R{selectedCustomer.packing_fee.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={deliveryForm.quantity_delivered}
                    onChange={(e) => setDeliveryForm({ ...deliveryForm, quantity_delivered: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    required
                  />
                  {deliveryForm.customer_id && (
                    <div className="text-sm text-gray-500 mt-1">
                      {(() => {
                        const customerSummary = inventorySummary.find(item => item.customer_id === deliveryForm.customer_id);
                        const availablePacked = customerSummary ? customerSummary.available_packed : 0;
                        if (deliveryForm.quantity_delivered > availablePacked) {
                          return <span className="text-red-600">Not enough packed bags available</span>;
                        }
                        return `${availablePacked} packed bags available`;
                      })()}
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-3 py-2">
                  <input
                    type="checkbox"
                    id="customer-packed"
                    checked={deliveryForm.customer_packed}
                    onChange={(e) => setDeliveryForm({ ...deliveryForm, customer_packed: e.target.checked })}
                    className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                  />
                  <label htmlFor="customer-packed" className="text-sm font-medium text-gray-700">
                    Bags packed by customer (no packing fee)
                  </label>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={deliveryForm.notes}
                    onChange={(e) => setDeliveryForm({ ...deliveryForm, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    rows="2"
                    placeholder="Any notes about this delivery"
                  />
                </div>
                
                {/* Invoice Preview */}
                {selectedCustomer && deliveryForm.quantity_delivered > 0 && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-800 mb-2">Invoice Preview</h4>
                    <table className="min-w-full">
                      <thead>
                        <tr className="text-left text-xs font-medium text-gray-500 uppercase">
                          <th className="py-2">Item</th>
                          <th className="py-2 text-right">Price</th>
                          <th className="py-2 text-right">Qty</th>
                          <th className="py-2 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="py-2">Shavings Bags</td>
                          <td className="py-2 text-right">R{selectedCustomer.price_per_bag.toFixed(2)}</td>
                          <td className="py-2 text-right">{deliveryForm.quantity_delivered}</td>
                          <td className="py-2 text-right">R{calculateTotal().bagsTotal.toFixed(2)}</td>
                        </tr>
                        {!deliveryForm.customer_packed && (
                          <tr>
                            <td className="py-2">Packing Fee</td>
                            <td className="py-2 text-right">R{selectedCustomer.packing_fee.toFixed(2)}</td>
                            <td className="py-2 text-right">{deliveryForm.quantity_delivered}</td>
                            <td className="py-2 text-right">R{calculateTotal().packingTotal.toFixed(2)}</td>
                          </tr>
                        )}
                        <tr className="font-bold border-t border-gray-200">
                          <td className="py-2">Total</td>
                          <td></td>
                          <td></td>
                          <td className="py-2 text-right">R{calculateTotal().grandTotal.toFixed(2)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
                
                {/* Signature Section */}
                <div className="border-2 border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Customer Signature</h3>
                  {!deliveryForm.signature_data ? (
                    <div>
                      {!isSigning ? (
                        <button
                          onClick={() => setIsSigning(true)}
                          className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                        >
                          <SafeIcon icon={FiEdit3} />
                          Add Signature
                        </button>
                      ) : (
                        <div>
                          <p className="text-sm text-gray-600 mb-3">Please sign in the box below:</p>
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 mb-4">
                            <canvas
                              ref={canvasRef}
                              width={400}
                              height={200}
                              onMouseDown={startDrawing}
                              onMouseMove={draw}
                              onMouseUp={stopDrawing}
                              onMouseLeave={stopDrawing}
                              className="border border-gray-200 rounded cursor-crosshair w-full"
                              style={{ touchAction: 'none' }}
                            />
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={saveSignature}
                              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                            >
                              <SafeIcon icon={FiCheck} />
                              Save Signature
                            </button>
                            <button
                              type="button"
                              onClick={clearSignature}
                              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                            >
                              Clear
                            </button>
                            <button
                              type="button"
                              onClick={() => setIsSigning(false)}
                              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm text-green-600 mb-3">Signature captured successfully</p>
                      <img src={deliveryForm.signature_data} alt="Customer Signature" className="border border-gray-200 rounded mb-3" />
                      <button
                        type="button"
                        onClick={() => {
                          setDeliveryForm({ ...deliveryForm, signature_data: '' });
                          setIsSigning(true);
                        }}
                        className="text-teal-600 hover:text-teal-800 text-sm"
                      >
                        Change Signature
                      </button>
                    </div>
                  )}
                </div>
                
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={resetDeliveryForm}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center gap-2 px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:bg-teal-400"
                  >
                    <SafeIcon icon={FiSave} />
                    {loading ? 'Saving...' : 'Create Delivery & Invoice'}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

// Delivery Note Component
const DeliveryNote = ({ delivery, onClose }) => {
  if (!delivery) {
    return null;
  }

  const handlePrint = () => {
    window.print();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-lg p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Delivery Note & Invoice</h2>
        <div className="flex gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
            <SafeIcon icon={FiDownload} />
            Print
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
          >
            Close
          </button>
        </div>
      </div>

      <div className="border-2 border-gray-200 rounded-lg p-6">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">DELIVERY NOTE & INVOICE</h1>
          <p className="text-xl text-gray-600">{delivery.invoice_number}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Supplier Details</h3>
            <div className="space-y-2 text-sm">
              <p><strong>Company:</strong> Logging Heads</p>
              <p><strong>Contact:</strong> Sean</p>
              <p><strong>Email:</strong> sean@loggingheads.co.za</p>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Customer Details</h3>
            <div className="space-y-2 text-sm">
              <p><strong>Customer:</strong> {delivery.customer_name}</p>
              <p><strong>Email:</strong> {delivery.customer_email}</p>
              <p><strong>Date:</strong> {format(new Date(delivery.delivery_date), 'MMMM dd, yyyy')}</p>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Items</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">Shavings Bags</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                    R{delivery.price_per_bag.toFixed(2)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                    {delivery.quantity_delivered}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                    R{(delivery.price_per_bag * delivery.quantity_delivered).toFixed(2)}
                  </td>
                </tr>
                {!delivery.customer_packed && (
                  <tr>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">Packing Fee</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                      R{delivery.packing_fee.toFixed(2)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                      {delivery.quantity_delivered}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                      R{(delivery.packing_fee * delivery.quantity_delivered).toFixed(2)}
                    </td>
                  </tr>
                )}
                <tr className="bg-gray-50 font-semibold">
                  <td colSpan="3" className="px-4 py-4 text-sm text-gray-900 text-right">
                    TOTAL
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                    R{delivery.total_amount.toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {delivery.notes && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Notes</h3>
            <p className="text-sm text-gray-700">{delivery.notes}</p>
          </div>
        )}

        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Customer Signature</h3>
          {delivery.signature_data ? (
            <img src={delivery.signature_data} alt="Customer Signature" className="border border-gray-200 rounded h-32" />
          ) : (
            <div className="text-gray-500">No signature available</div>
          )}
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Payment Status</h3>
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 text-sm font-semibold rounded-full ${delivery.payment_received ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
              {delivery.payment_received ? 'Paid' : 'Pending Payment'}
            </span>
            {delivery.payment_received && delivery.payment_date && (
              <span className="text-sm text-gray-600">
                Paid on {format(new Date(delivery.payment_date), 'MMMM dd, yyyy')}
                {delivery.payment_method && ` via ${delivery.payment_method}`}
              </span>
            )}
          </div>
        </div>

        <div className="text-center mt-8 text-gray-500 text-sm">
          <p>Thank you for your business!</p>
          <p>For any queries, please contact sean@loggingheads.co.za</p>
        </div>
      </div>
    </motion.div>
  );
};

export default ShavingsDelivery;