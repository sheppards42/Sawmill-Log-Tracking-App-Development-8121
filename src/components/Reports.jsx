import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { analyticsOperations } from '../data/supabaseOperations';
import { startOfDay, endOfDay, subDays, subYears, format } from 'date-fns';

const { FiBarChart3, FiCalendar, FiDownload } = FiIcons;

const Reports = () => {
  const [reportType, setReportType] = useState('current-day');
  const [customDate, setCustomDate] = useState('');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    generateReport();
  }, [reportType, customDate]);

  const generateReport = async () => {
    setLoading(true);
    
    try {
      let dateFrom, dateTo, dateRange;
      const now = new Date();

      switch (reportType) {
        case 'last-hour':
          dateFrom = new Date(now.getTime() - 60 * 60 * 1000);
          dateTo = now;
          dateRange = 'Last Hour';
          break;
        case 'current-day':
          dateFrom = startOfDay(now);
          dateTo = endOfDay(now);
          dateRange = 'Today';
          break;
        case 'custom-day':
          if (customDate) {
            const selectedDate = new Date(customDate);
            dateFrom = startOfDay(selectedDate);
            dateTo = endOfDay(selectedDate);
            dateRange = format(selectedDate, 'MMM dd, yyyy');
          } else {
            setLoading(false);
            return;
          }
          break;
        case '7-days':
          dateFrom = subDays(now, 7);
          dateTo = now;
          dateRange = 'Last 7 Days';
          break;
        case '30-days':
          dateFrom = subDays(now, 30);
          dateTo = now;
          dateRange = 'Last 30 Days';
          break;
        case '90-days':
          dateFrom = subDays(now, 90);
          dateTo = now;
          dateRange = 'Last 90 Days';
          break;
        case 'last-year':
          dateFrom = subYears(now, 1);
          dateTo = now;
          dateRange = 'Last Year';
          break;
        default:
          dateFrom = new Date('2020-01-01');
          dateTo = now;
          dateRange = 'All Time';
      }

      // Get data from Supabase
      const { logs, cutLogs } = await analyticsOperations.getProductionSummary(
        dateFrom.toISOString(),
        dateTo.toISOString()
      );

      const rampStats = await analyticsOperations.getRampUtilization(
        dateFrom.toISOString(),
        dateTo.toISOString()
      );

      // Calculate statistics
      const totalLogsReceived = logs.length;
      const totalVolumeReceived = logs.reduce((sum, log) => sum + parseFloat(log.volume), 0);
      const totalLogsCut = cutLogs.length;
      const totalVolumeCut = cutLogs.reduce((sum, log) => sum + parseFloat(log.volume), 0);

      // Group by supplier
      const supplierStats = {};
      logs.forEach(log => {
        if (!supplierStats[log.supplier]) {
          supplierStats[log.supplier] = {
            received: 0,
            volume: 0,
            cut: 0,
            cutVolume: 0
          };
        }
        supplierStats[log.supplier].received++;
        supplierStats[log.supplier].volume += parseFloat(log.volume);
      });

      cutLogs.forEach(log => {
        if (supplierStats[log.supplier]) {
          supplierStats[log.supplier].cut++;
          supplierStats[log.supplier].cutVolume += parseFloat(log.volume);
        }
      });

      setReportData({
        dateRange,
        totalLogsReceived,
        totalVolumeReceived,
        totalLogsCut,
        totalVolumeCut,
        supplierStats,
        rampStats,
        availableLogs: totalLogsReceived - totalLogsCut,
        availableVolume: totalVolumeReceived - totalVolumeCut
      });
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Error generating report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const exportReport = () => {
    if (!reportData) return;

    const csvContent = [
      ['Sawmill Report', reportData.dateRange],
      [''],
      ['Summary'],
      ['Total Logs Received', reportData.totalLogsReceived],
      ['Total Volume Received (m³)', reportData.totalVolumeReceived.toFixed(3)],
      ['Total Logs Cut', reportData.totalLogsCut],
      ['Total Volume Cut (m³)', reportData.totalVolumeCut.toFixed(3)],
      ['Available Logs', reportData.availableLogs],
      ['Available Volume (m³)', reportData.availableVolume.toFixed(3)],
      [''],
      ['Supplier Breakdown'],
      ['Supplier', 'Logs Received', 'Volume Received (m³)', 'Logs Cut', 'Volume Cut (m³)'],
      ...Object.entries(reportData.supplierStats).map(([supplier, stats]) => [
        supplier,
        stats.received,
        stats.volume.toFixed(3),
        stats.cut,
        stats.cutVolume.toFixed(3)
      ]),
      [''],
      ['Ramp Usage'],
      ['Ramp 1', reportData.rampStats[1]],
      ['Ramp 2', reportData.rampStats[2]],
      ['Ramp 3', reportData.rampStats[3]]
    ];

    const csvString = csvContent.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sawmill-report-${reportData.dateRange.toLowerCase().replace(/\s+/g, '-')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-6xl mx-auto p-6 bg-white rounded-xl shadow-lg"
    >
      <div className="flex items-center gap-3 mb-6">
        <SafeIcon icon={FiBarChart3} className="text-2xl text-purple-600" />
        <h2 className="text-2xl font-bold text-gray-800">Reports & Analytics</h2>
        <div className="ml-auto text-sm text-green-600">
          Database Connected
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Report Period
          </label>
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="last-hour">Last Hour</option>
            <option value="current-day">Current Day</option>
            <option value="custom-day">Custom Day</option>
            <option value="7-days">Last 7 Days</option>
            <option value="30-days">Last 30 Days</option>
            <option value="90-days">Last 90 Days</option>
            <option value="last-year">Last Year</option>
          </select>
        </div>

        {reportType === 'custom-day' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Date
            </label>
            <input
              type="date"
              value={customDate}
              onChange={(e) => setCustomDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="text-purple-600"
          >
            <SafeIcon icon={FiBarChart3} className="text-3xl" />
          </motion.div>
          <span className="ml-3 text-lg text-gray-600">Generating report from database...</span>
        </div>
      ) : reportData ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-gray-800">
              Report for {reportData.dateRange}
            </h3>
            <button
              onClick={exportReport}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <SafeIcon icon={FiDownload} />
              Export CSV
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="text-sm font-medium text-blue-600 mb-1">Logs Received</h4>
              <p className="text-2xl font-bold text-blue-800">{reportData.totalLogsReceived}</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="text-sm font-medium text-green-600 mb-1">Volume Received</h4>
              <p className="text-2xl font-bold text-green-800">{reportData.totalVolumeReceived.toFixed(3)} m³</p>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg">
              <h4 className="text-sm font-medium text-orange-600 mb-1">Logs Cut</h4>
              <p className="text-2xl font-bold text-orange-800">{reportData.totalLogsCut}</p>
            </div>
            <div className="p-4 bg-red-50 rounded-lg">
              <h4 className="text-sm font-medium text-red-600 mb-1">Volume Cut</h4>
              <p className="text-2xl font-bold text-red-800">{reportData.totalVolumeCut.toFixed(3)} m³</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="text-lg font-semibold text-gray-800 mb-3">Supplier Breakdown</h4>
              <div className="space-y-2">
                {Object.entries(reportData.supplierStats).map(([supplier, stats]) => (
                  <div key={supplier} className="flex justify-between items-center p-2 bg-white rounded">
                    <span className="font-medium">{supplier}</span>
                    <div className="text-sm text-gray-600">
                      {stats.received} logs ({stats.volume.toFixed(3)} m³)
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="text-lg font-semibold text-gray-800 mb-3">Ramp Usage</h4>
              <div className="space-y-2">
                {Object.entries(reportData.rampStats).map(([ramp, count]) => (
                  <div key={ramp} className="flex justify-between items-center p-2 bg-white rounded">
                    <span className="font-medium">Ramp {ramp}</span>
                    <span className="text-lg font-bold text-orange-600">{count} cuts</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="p-4 bg-yellow-50 rounded-lg">
            <h4 className="text-lg font-semibold text-yellow-800 mb-2">Inventory Status</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-sm font-medium text-yellow-600">Available Logs:</span>
                <p className="text-xl font-bold text-yellow-800">{reportData.availableLogs}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-yellow-600">Available Volume:</span>
                <p className="text-xl font-bold text-yellow-800">{reportData.availableVolume.toFixed(3)} m³</p>
              </div>
            </div>
          </div>
        </motion.div>
      ) : null}
    </motion.div>
  );
};

export default Reports;