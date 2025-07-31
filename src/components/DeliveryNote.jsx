import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { format } from 'date-fns';
import { loadOperations, deliveryNoteOperations } from '../data/supabaseOperations';

const { FiFileText, FiUser, FiMail, FiCheck, FiSend, FiDownload, FiEdit3 } = FiIcons;

const DeliveryNote = ({ loadId, onClose }) => {
  const [load, setLoad] = useState(null);
  const [loadItems, setLoadItems] = useState([]);
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [isSigning, setIsSigning] = useState(false);
  const [signature, setSignature] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    if (loadId) {
      loadDeliveryNoteData();
    }
  }, [loadId]);

  const loadDeliveryNoteData = async () => {
    try {
      const loadData = await loadOperations.getLoadById(loadId);
      const itemsData = await loadOperations.getLoadItems(loadId);
      
      setLoad(loadData);
      setLoadItems(itemsData);
    } catch (error) {
      console.error('Error loading delivery note data:', error);
      alert('Error loading delivery note data');
    }
  };

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
    setSignature(signatureData);
    setIsSigning(false);
  };

  const submitDeliveryNote = async () => {
    if (!customerEmail || !customerName || !signature) {
      alert('Please fill in all fields and provide a signature');
      return;
    }

    setIsSubmitting(true);
    try {
      const deliveryNoteData = {
        load_id: loadId,
        customer_email: customerEmail,
        customer_name: customerName,
        signature_data: signature,
        signed_at: new Date().toISOString(),
        status: 'signed'
      };

      const deliveryNote = await deliveryNoteOperations.createDeliveryNote(deliveryNoteData);
      
      // Update load status to delivered
      await loadOperations.updateLoadStatus(loadId, 'delivered');

      // Send email (this would be handled by a serverless function or API)
      await sendDeliveryNoteEmail(deliveryNote);

      alert('Delivery note signed and sent successfully!');
      onClose();
    } catch (error) {
      console.error('Error submitting delivery note:', error);
      alert('Error submitting delivery note. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const sendDeliveryNoteEmail = async (deliveryNote) => {
    // This would typically call a serverless function or API endpoint
    // For demo purposes, we'll just log it
    console.log('Sending delivery note email to:', customerEmail, 'and sean@loggingheads.co.za');
    
    // In a real implementation, you would call an API like:
    // await fetch('/api/send-delivery-note-email', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     deliveryNote,
    //     recipients: [customerEmail, 'sean@loggingheads.co.za']
    //   })
    // });
  };

  const generatePDF = () => {
    // This would generate a PDF of the delivery note
    alert('PDF generation would be implemented here');
  };

  if (!load) {
    return (
      <div className="flex items-center justify-center py-12">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="text-blue-600"
        >
          <SafeIcon icon={FiFileText} className="text-3xl" />
        </motion.div>
        <span className="ml-3 text-lg text-gray-600">Loading delivery note...</span>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-lg"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <SafeIcon icon={FiFileText} className="text-2xl text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-800">Delivery Note</h2>
        </div>
        <div className="flex gap-2">
          <button
            onClick={generatePDF}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <SafeIcon icon={FiDownload} />
            PDF
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
          >
            Close
          </button>
        </div>
      </div>

      {/* Delivery Note Header */}
      <div className="border-2 border-gray-200 rounded-lg p-6 mb-6">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">DELIVERY NOTE</h1>
          <p className="text-lg text-gray-600">Sawmill Management System</p>
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
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Delivery Details</h3>
            <div className="space-y-2 text-sm">
              <p><strong>Load Number:</strong> {load.load_number}</p>
              <p><strong>Date:</strong> {format(new Date(load.date), 'MMMM dd, yyyy')}</p>
              <p><strong>Truck Registration:</strong> {load.truck_registration}</p>
              <p><strong>Inventory Type:</strong> 
                <span className={`ml-2 inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${
                  load.inventory_type === 'wet' 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-orange-100 text-orange-800'
                }`}>
                  {load.inventory_type === 'wet' ? 'Wet' : 'Dry'}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Items Delivered</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Size
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Length
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Volume (m³)
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loadItems.map((item, index) => (
                  <tr key={index}>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      Timber Planks
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.width}×{item.height}mm
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.length === 2.1 ? 'Under 2.4m' : `${item.length}m`}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.quantity}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {parseFloat(item.volume).toFixed(4)}
                    </td>
                  </tr>
                ))}
                <tr className="bg-gray-50 font-semibold">
                  <td colSpan="3" className="px-4 py-4 text-sm text-gray-900">
                    TOTAL
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {load.total_quantity}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {parseFloat(load.total_volume).toFixed(4)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Customer Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Customer Name <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <SafeIcon icon={FiUser} className="absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Enter customer name"
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Customer Email <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <SafeIcon icon={FiMail} className="absolute left-3 top-2.5 text-gray-400" />
            <input
              type="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              placeholder="Enter customer email"
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Signature Section */}
      <div className="border-2 border-gray-200 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Customer Signature</h3>
        
        {!signature ? (
          <div>
            {!isSigning ? (
              <button
                onClick={() => setIsSigning(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
                    onClick={saveSignature}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <SafeIcon icon={FiCheck} />
                    Save Signature
                  </button>
                  <button
                    onClick={clearSignature}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Clear
                  </button>
                  <button
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
            <img src={signature} alt="Customer Signature" className="border border-gray-200 rounded mb-3" />
            <button
              onClick={() => {
                setSignature('');
                setIsSigning(true);
              }}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              Change Signature
            </button>
          </div>
        )}
      </div>

      {/* Submit Button */}
      <div className="flex justify-center">
        <button
          onClick={submitDeliveryNote}
          disabled={isSubmitting || !customerEmail || !customerName || !signature}
          className="flex items-center gap-2 px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed text-lg font-semibold"
        >
          <SafeIcon icon={FiSend} />
          {isSubmitting ? 'Submitting...' : 'Submit & Send Delivery Note'}
        </button>
      </div>

      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> Once submitted, this delivery note will be emailed to the customer and sean@loggingheads.co.za.
          The load status will be updated to "Delivered".
        </p>
      </div>
    </motion.div>
  );
};

export default DeliveryNote;