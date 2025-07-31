import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { analyticsOperations, plankOperations, joiningPlaningOperations, cutLogOperations } from '../data/supabaseOperations';
import { startOfDay, endOfDay, subDays, subYears, format } from 'date-fns';

const { FiBarChart3, FiCalendar, FiDownload, FiLayers, FiPackage, FiLink, FiTool, FiPercent, FiTrendingDown } = FiIcons;

// Function to calculate plank volume
const calculatePlankVolume = (width, height, length, quantity) => {
  const widthM = width / 1000;
  const heightM = height / 1000;
  return widthM * heightM * length * quantity;
};

const Reports = () => {
  const [reportType, setReportType] = useState('current-day');
  const [customDate, setCustomDate] = useState('');
  const [reportData, setReportData] = useState(null);
  const [dailySummaries, setDailySummaries] = useState(null);
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
      const { logs, cutLogs, planks, takenPlanks, joinedPlanks, planedPlanks } = await analyticsOperations.getProductionSummary(
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

      // Calculate plank statistics
      const totalPlanks = planks.reduce((sum, plank) => sum + parseInt(plank.quantity), 0);

      // Calculate taken plank statistics
      const totalTakenPlanks = takenPlanks.reduce((sum, plank) => sum + parseInt(plank.quantity), 0);
      const totalTakenVolume = takenPlanks.reduce((sum, plank) => sum + parseFloat(plank.volume), 0);

      // Calculate joined plank statistics
      const totalJoinedPlanks = joinedPlanks.reduce((sum, plank) => sum + parseInt(plank.quantity), 0);
      const totalJoinedVolume = joinedPlanks.reduce((sum, plank) => sum + parseFloat(plank.volume), 0);

      // Calculate planed plank statistics
      const totalPlanedPlanks = planedPlanks.reduce((sum, plank) => sum + parseInt(plank.quantity), 0);
      const totalPlanedVolume = planedPlanks.reduce((sum, plank) => sum + parseFloat(plank.volume), 0);

      // Calculate waste
      const joiningWaste = Math.max(0, totalTakenVolume - totalJoinedVolume);
      const planingWaste = Math.max(0, totalJoinedVolume - totalPlanedVolume);
      const totalWaste = joiningWaste + planingWaste;

      // Group planks by size and length
      const plankStats = {};
      planks.forEach(plank => {
        const sizeKey = `${plank.width}x${plank.height}`;
        const lengthKey = plank.length.toString();
        if (!plankStats[sizeKey]) {
          plankStats[sizeKey] = {};
        }
        if (!plankStats[sizeKey][lengthKey]) {
          plankStats[sizeKey][lengthKey] = 0;
        }
        plankStats[sizeKey][lengthKey] += plank.quantity;
      });

      // Group taken planks by size and length
      const takenPlankStats = {};
      takenPlanks.forEach(plank => {
        const sizeKey = `${plank.width}x${plank.height}`;
        const lengthKey = plank.length.toString();
        if (!takenPlankStats[sizeKey]) {
          takenPlankStats[sizeKey] = {};
        }
        if (!takenPlankStats[sizeKey][lengthKey]) {
          takenPlankStats[sizeKey][lengthKey] = { quantity: 0, volume: 0 };
        }
        takenPlankStats[sizeKey][lengthKey].quantity += plank.quantity;
        takenPlankStats[sizeKey][lengthKey].volume += plank.volume;
      });

      // Group joined planks by size and length
      const joinedPlankStats = {};
      joinedPlanks.forEach(plank => {
        const sizeKey = `${plank.width}x${plank.height}`;
        const lengthKey = plank.length.toString();
        if (!joinedPlankStats[sizeKey]) {
          joinedPlankStats[sizeKey] = {};
        }
        if (!joinedPlankStats[sizeKey][lengthKey]) {
          joinedPlankStats[sizeKey][lengthKey] = { quantity: 0, volume: 0 };
        }
        joinedPlankStats[sizeKey][lengthKey].quantity += plank.quantity;
        joinedPlankStats[sizeKey][lengthKey].volume += plank.volume;
      });

      // Group planed planks by size and length
      const planedPlankStats = {};
      planedPlanks.forEach(plank => {
        const sizeKey = `${plank.width}x${plank.height}`;
        const lengthKey = plank.length.toString();
        if (!planedPlankStats[sizeKey]) {
          planedPlankStats[sizeKey] = {};
        }
        if (!planedPlankStats[sizeKey][lengthKey]) {
          planedPlankStats[sizeKey][lengthKey] = { quantity: 0, volume: 0 };
        }
        planedPlankStats[sizeKey][lengthKey].quantity += plank.quantity;
        planedPlankStats[sizeKey][lengthKey].volume += plank.volume;
      });

      // Group by supplier
      const supplierStats = {};
      logs.forEach(log => {
        if (!supplierStats[log.supplier]) {
          supplierStats[log.supplier] = { received: 0, volume: 0, cut: 0, cutVolume: 0 };
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

      // Calculate recovery percentages (for single day reports)
      let recoveryData = null;
      if (reportType === 'current-day' || reportType === 'custom-day') {
        const totalPlanksVolume = planks.reduce((sum, plank) => {
          return sum + calculatePlankVolume(plank.width, plank.height, plank.length, plank.quantity);
        }, 0);

        const totalCutLogsVolume = cutLogs.reduce((sum, log) => sum + parseFloat(log.volume), 0);

        const longsVolume = planks
          .filter(plank => plank.length >= 6.0)
          .reduce((sum, plank) => {
            return sum + calculatePlankVolume(plank.width, plank.height, plank.length, plank.quantity);
          }, 0);

        const shortsVolume = planks
          .filter(plank => plank.length < 6.0)
          .reduce((sum, plank) => {
            return sum + calculatePlankVolume(plank.width, plank.height, plank.length, plank.quantity);
          }, 0);

        const longsRecovery = totalCutLogsVolume > 0 ? (longsVolume / totalCutLogsVolume) * 100 : 0;
        const shortsRecovery = totalCutLogsVolume > 0 ? (shortsVolume / totalCutLogsVolume) * 100 : 0;
        const totalRecovery = totalCutLogsVolume > 0 ? (totalPlanksVolume / totalCutLogsVolume) * 100 : 0;

        recoveryData = {
          totalPlanksVolume,
          totalCutLogsVolume,
          longsVolume,
          shortsVolume,
          longsRecovery,
          shortsRecovery,
          totalRecovery
        };
      }

      setReportData({
        dateRange,
        totalLogsReceived,
        totalVolumeReceived,
        totalLogsCut,
        totalVolumeCut,
        totalPlanks,
        totalTakenPlanks,
        totalTakenVolume,
        totalJoinedPlanks,
        totalJoinedVolume,
        totalPlanedPlanks,
        totalPlanedVolume,
        joiningWaste,
        planingWaste,
        totalWaste,
        supplierStats,
        plankStats,
        takenPlankStats,
        joinedPlankStats,
        planedPlankStats,
        rampStats,
        availableLogs: totalLogsReceived - totalLogsCut,
        availableVolume: totalVolumeReceived - totalVolumeCut,
        recoveryData
      });

      // Generate daily summaries for single day reports
      if (reportType === 'current-day' || reportType === 'custom-day') {
        const targetDate = reportType === 'current-day' ? format(now, 'yyyy-MM-dd') : customDate;
        await generateDailySummaries(targetDate);
      } else {
        setDailySummaries(null);
      }

    } catch (error) {
      console.error('Error generating report:', error);
      alert('Error generating report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const generateDailySummaries = async (date) => {
    try {
      // Get all daily data
      const planksData = await plankOperations.getPlanksByDate(date);
      const takenData = await joiningPlaningOperations.getTakenPlanksByDate(date);
      const joinedData = await joiningPlaningOperations.getJoinedPlanksByDate(date);
      const planedData = await joiningPlaningOperations.getPlanedPlanksByDate(date);
      const cutLogsData = await cutLogOperations.getCutLogs({
        dateFrom: date + 'T00:00:00.000Z',
        dateTo: date + 'T23:59:59.999Z'
      });

      // Process plank production summary
      const plankProductionStats = {};
      let totalPlanksProduced = 0;
      let totalPlankVolume = 0;

      planksData.forEach(plank => {
        const sizeKey = `${plank.width}x${plank.height}`;
        const lengthKey = plank.length.toString();
        const volume = calculatePlankVolume(plank.width, plank.height, plank.length, plank.quantity);

        if (!plankProductionStats[sizeKey]) {
          plankProductionStats[sizeKey] = {};
        }
        if (!plankProductionStats[sizeKey][lengthKey]) {
          plankProductionStats[sizeKey][lengthKey] = { quantity: 0, volume: 0 };
        }

        plankProductionStats[sizeKey][lengthKey].quantity += plank.quantity;
        plankProductionStats[sizeKey][lengthKey].volume += volume;
        totalPlanksProduced += plank.quantity;
        totalPlankVolume += volume;
      });

      // Process taken planks summary
      const takenStats = {};
      let totalTaken = 0;
      let totalTakenVolume = 0;

      takenData.forEach(plank => {
        const sizeKey = `${plank.width}x${plank.height}`;
        const lengthKey = plank.length.toString();
        const volume = calculatePlankVolume(plank.width, plank.height, plank.length, plank.quantity);

        if (!takenStats[sizeKey]) {
          takenStats[sizeKey] = {};
        }
        if (!takenStats[sizeKey][lengthKey]) {
          takenStats[sizeKey][lengthKey] = { quantity: 0, volume: 0 };
        }

        takenStats[sizeKey][lengthKey].quantity += plank.quantity;
        takenStats[sizeKey][lengthKey].volume += volume;
        totalTaken += plank.quantity;
        totalTakenVolume += volume;
      });

      // Process joined planks summary
      const joinedStats = {};
      let totalJoined = 0;
      let totalJoinedVolume = 0;

      joinedData.forEach(plank => {
        const sizeKey = `${plank.width}x${plank.height}`;
        const lengthKey = plank.length.toString();
        const volume = calculatePlankVolume(plank.width, plank.height, plank.length, plank.quantity);

        if (!joinedStats[sizeKey]) {
          joinedStats[sizeKey] = {};
        }
        if (!joinedStats[sizeKey][lengthKey]) {
          joinedStats[sizeKey][lengthKey] = { quantity: 0, volume: 0 };
        }

        joinedStats[sizeKey][lengthKey].quantity += plank.quantity;
        joinedStats[sizeKey][lengthKey].volume += volume;
        totalJoined += plank.quantity;
        totalJoinedVolume += volume;
      });

      // Process planed planks summary
      const planedStats = {};
      let totalPlaned = 0;
      let totalPlanedVolume = 0;

      planedData.forEach(plank => {
        const sizeKey = `${plank.width}x${plank.height}`;
        const lengthKey = plank.length.toString();
        const volume = calculatePlankVolume(plank.width, plank.height, plank.length, plank.quantity);

        if (!planedStats[sizeKey]) {
          planedStats[sizeKey] = {};
        }
        if (!planedStats[sizeKey][lengthKey]) {
          planedStats[sizeKey][lengthKey] = { quantity: 0, volume: 0 };
        }

        planedStats[sizeKey][lengthKey].quantity += plank.quantity;
        planedStats[sizeKey][lengthKey].volume += volume;
        totalPlaned += plank.quantity;
        totalPlanedVolume += volume;
      });

      // Calculate waste
      const joiningWaste = Math.max(0, totalTakenVolume - totalJoinedVolume);
      const planingWaste = Math.max(0, totalJoinedVolume - totalPlanedVolume);
      const totalWaste = joiningWaste + planingWaste;

      setDailySummaries({
        date,
        plankProduction: {
          stats: plankProductionStats,
          totalPlanks: totalPlanksProduced,
          totalVolume: totalPlankVolume
        },
        takenPlanks: {
          stats: takenStats,
          totalTaken,
          totalTakenVolume
        },
        joinedPlanks: {
          stats: joinedStats,
          totalJoined,
          totalJoinedVolume,
          joiningWaste
        },
        planedPlanks: {
          stats: planedStats,
          totalPlaned,
          totalPlanedVolume,
          planingWaste
        },
        totalWaste
      });

    } catch (error) {
      console.error('Error generating daily summaries:', error);
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
      ['Total Planks Produced', reportData.totalPlanks],
      ['Total Planks Taken', reportData.totalTakenPlanks],
      ['Total Taken Volume (m³)', reportData.totalTakenVolume.toFixed(4)],
      ['Total Joined Planks', reportData.totalJoinedPlanks],
      ['Total Joined Volume (m³)', reportData.totalJoinedVolume.toFixed(4)],
      ['Total Planed Planks', reportData.totalPlanedPlanks],
      ['Total Planed Volume (m³)', reportData.totalPlanedVolume.toFixed(4)],
      ['Joining Waste (m³)', reportData.joiningWaste.toFixed(4)],
      ['Planing Waste (m³)', reportData.planingWaste.toFixed(4)],
      ['Total Waste (m³)', reportData.totalWaste.toFixed(4)],
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

  const renderSummaryTable = (stats, title, showVolume = true) => {
    if (!stats || Object.keys(stats).length === 0) {
      return (
        <p className="text-center py-4 text-gray-500">No {title.toLowerCase()} data recorded for this date</p>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Length</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
              {showVolume && (
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Volume (m³)</th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {Object.entries(stats).flatMap(([sizeKey, lengths]) =>
              Object.entries(lengths).map(([lengthKey, data], index) => (
                <tr key={`${sizeKey}-${lengthKey}`} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                    {index === 0 ? sizeKey + 'mm' : ''}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {lengthKey === '2.1' ? 'Under 2.4m' : `${lengthKey}m`}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    {showVolume ? data.quantity : data}
                  </td>
                  {showVolume && (
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {data.volume ? data.volume.toFixed(4) : '0.0000'}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto p-6 bg-white rounded-xl shadow-lg"
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

          {/* Recovery Percentages for single day reports */}
          {reportData.recoveryData && (
            <div className="mb-6 p-4 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <SafeIcon icon={FiPercent} className="text-xl text-green-600" />
                <h4 className="text-lg font-semibold text-green-800">Recovery Percentages</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div className="p-3 bg-white rounded-lg shadow-sm">
                  <p className="text-sm font-medium text-gray-600">Planks Volume</p>
                  <p className="text-xl font-bold text-green-700">{reportData.recoveryData.totalPlanksVolume.toFixed(4)} m³</p>
                </div>
                <div className="p-3 bg-white rounded-lg shadow-sm">
                  <p className="text-sm font-medium text-gray-600">Cut Logs Volume</p>
                  <p className="text-xl font-bold text-blue-700">{reportData.recoveryData.totalCutLogsVolume.toFixed(4)} m³</p>
                </div>
                <div className="p-3 bg-white rounded-lg shadow-sm">
                  <p className="text-sm font-medium text-gray-600">Longs Volume (≥6m)</p>
                  <p className="text-xl font-bold text-purple-700">{reportData.recoveryData.longsVolume.toFixed(4)} m³</p>
                </div>
                <div className="p-3 bg-white rounded-lg shadow-sm">
                  <p className="text-sm font-medium text-gray-600">Shorts Volume (&lt;6m)</p>
                  <p className="text-xl font-bold text-orange-700">{reportData.recoveryData.shortsVolume.toFixed(4)} m³</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-gradient-to-r from-green-100 to-green-200 rounded-lg">
                  <h5 className="text-sm font-medium text-green-700 mb-1">Longs Recovery</h5>
                  <p className="text-2xl font-bold text-green-800">{reportData.recoveryData.longsRecovery.toFixed(2)}%</p>
                  <p className="text-xs text-green-600 mt-1">6m & 6.6m planks vs cut logs</p>
                </div>
                <div className="p-4 bg-gradient-to-r from-orange-100 to-orange-200 rounded-lg">
                  <h5 className="text-sm font-medium text-orange-700 mb-1">Shorts Recovery</h5>
                  <p className="text-2xl font-bold text-orange-800">{reportData.recoveryData.shortsRecovery.toFixed(2)}%</p>
                  <p className="text-xs text-orange-600 mt-1">Under 6m planks vs cut logs</p>
                </div>
                <div className="p-4 bg-gradient-to-r from-blue-100 to-blue-200 rounded-lg">
                  <h5 className="text-sm font-medium text-blue-700 mb-1">Total Recovery</h5>
                  <p className="text-2xl font-bold text-blue-800">{reportData.recoveryData.totalRecovery.toFixed(2)}%</p>
                  <p className="text-xs text-blue-600 mt-1">All planks vs cut logs</p>
                </div>
              </div>
            </div>
          )}

          {/* Summary Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
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
            <div className="p-4 bg-cyan-50 rounded-lg">
              <h4 className="text-sm font-medium text-cyan-600 mb-1">Planks Produced</h4>
              <p className="text-2xl font-bold text-cyan-800">{reportData.totalPlanks}</p>
            </div>
          </div>

          {/* Processing Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-indigo-50 rounded-lg">
              <h4 className="text-sm font-medium text-indigo-600 mb-1">Planks Taken</h4>
              <p className="text-2xl font-bold text-indigo-800">{reportData.totalTakenPlanks}</p>
              <p className="text-xs text-indigo-600 mt-1">{reportData.totalTakenVolume.toFixed(4)} m³</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <h4 className="text-sm font-medium text-purple-600 mb-1">Joined Planks</h4>
              <p className="text-2xl font-bold text-purple-800">{reportData.totalJoinedPlanks}</p>
              <p className="text-xs text-purple-600 mt-1">{reportData.totalJoinedVolume.toFixed(4)} m³</p>
            </div>
            <div className="p-4 bg-teal-50 rounded-lg">
              <h4 className="text-sm font-medium text-teal-600 mb-1">Planed Planks</h4>
              <p className="text-2xl font-bold text-teal-800">{reportData.totalPlanedPlanks}</p>
              <p className="text-xs text-teal-600 mt-1">{reportData.totalPlanedVolume.toFixed(4)} m³</p>
            </div>
            <div className="p-4 bg-red-100 rounded-lg">
              <h4 className="text-sm font-medium text-red-700 mb-1">Total Waste</h4>
              <p className="text-2xl font-bold text-red-900">{reportData.totalWaste.toFixed(4)} m³</p>
              <p className="text-xs text-red-600 mt-1">
                Join: {reportData.joiningWaste.toFixed(4)} | Plan: {reportData.planingWaste.toFixed(4)}
              </p>
            </div>
          </div>

          {/* Daily Summaries for single day reports */}
          {dailySummaries && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-800">
                Daily Summaries - {format(new Date(dailySummaries.date), 'MMMM d, yyyy')}
              </h3>

              {/* Plank Production Summary */}
              <div className="p-4 bg-cyan-50 rounded-lg">
                <div className="flex items-center gap-2 mb-4">
                  <SafeIcon icon={FiLayers} className="text-xl text-cyan-600" />
                  <h4 className="text-lg font-semibold text-cyan-800">Plank Production Summary</h4>
                </div>
                <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <p className="text-sm font-medium text-cyan-600">
                    Total planks produced: <span className="text-lg font-bold text-cyan-700">{dailySummaries.plankProduction.totalPlanks}</span>
                  </p>
                  <p className="text-sm font-medium text-cyan-600">
                    Total volume: <span className="text-lg font-bold text-cyan-700">{dailySummaries.plankProduction.totalVolume.toFixed(4)} m³</span>
                  </p>
                </div>
                {renderSummaryTable(dailySummaries.plankProduction.stats, 'Plank Production')}
              </div>

              {/* Taken Planks Summary */}
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2 mb-4">
                  <SafeIcon icon={FiPackage} className="text-xl text-blue-600" />
                  <h4 className="text-lg font-semibold text-blue-800">Planks Taken Summary</h4>
                </div>
                <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <p className="text-sm font-medium text-blue-600">
                    Total planks taken: <span className="text-lg font-bold text-blue-700">{dailySummaries.takenPlanks.totalTaken}</span>
                  </p>
                  <p className="text-sm font-medium text-blue-600">
                    Total volume taken: <span className="text-lg font-bold text-blue-700">{dailySummaries.takenPlanks.totalTakenVolume.toFixed(4)} m³</span>
                  </p>
                </div>
                {renderSummaryTable(dailySummaries.takenPlanks.stats, 'Taken Planks')}
              </div>

              {/* Joined Planks Summary */}
              <div className="p-4 bg-indigo-50 rounded-lg">
                <div className="flex items-center gap-2 mb-4">
                  <SafeIcon icon={FiLink} className="text-xl text-indigo-600" />
                  <h4 className="text-lg font-semibold text-indigo-800">Joining Summary</h4>
                </div>
                <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-3 bg-white rounded-lg">
                    <p className="text-sm font-medium text-indigo-600">Planks Joined</p>
                    <p className="text-xl font-bold text-indigo-800">{dailySummaries.joinedPlanks.totalJoined}</p>
                  </div>
                  <div className="p-3 bg-white rounded-lg">
                    <p className="text-sm font-medium text-indigo-600">Joined Volume</p>
                    <p className="text-xl font-bold text-indigo-800">{dailySummaries.joinedPlanks.totalJoinedVolume.toFixed(4)} m³</p>
                  </div>
                  <div className="p-3 bg-red-50 rounded-lg">
                    <p className="text-sm font-medium text-red-600">Joining Waste</p>
                    <p className="text-xl font-bold text-red-800">{dailySummaries.joinedPlanks.joiningWaste.toFixed(4)} m³</p>
                  </div>
                </div>
                {renderSummaryTable(dailySummaries.joinedPlanks.stats, 'Joined Planks')}
              </div>

              {/* Planed Planks Summary */}
              <div className="p-4 bg-purple-50 rounded-lg">
                <div className="flex items-center gap-2 mb-4">
                  <SafeIcon icon={FiTool} className="text-xl text-purple-600" />
                  <h4 className="text-lg font-semibold text-purple-800">Planing Summary</h4>
                </div>
                <div className="mb-4 grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="p-3 bg-white rounded-lg">
                    <p className="text-sm font-medium text-purple-600">Planks Planed</p>
                    <p className="text-xl font-bold text-purple-800">{dailySummaries.planedPlanks.totalPlaned}</p>
                  </div>
                  <div className="p-3 bg-white rounded-lg">
                    <p className="text-sm font-medium text-purple-600">Planed Volume</p>
                    <p className="text-xl font-bold text-purple-800">{dailySummaries.planedPlanks.totalPlanedVolume.toFixed(4)} m³</p>
                  </div>
                  <div className="p-3 bg-orange-50 rounded-lg">
                    <p className="text-sm font-medium text-orange-600">Planing Waste</p>
                    <p className="text-xl font-bold text-orange-800">{dailySummaries.planedPlanks.planingWaste.toFixed(4)} m³</p>
                  </div>
                  <div className="p-3 bg-red-50 rounded-lg">
                    <p className="text-sm font-medium text-red-600">Total Waste</p>
                    <p className="text-xl font-bold text-red-800">{dailySummaries.totalWaste.toFixed(4)} m³</p>
                  </div>
                </div>
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <h5 className="text-sm font-medium text-gray-600 mb-2">Waste Breakdown:</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <SafeIcon icon={FiTrendingDown} className="text-red-500" />
                      <span>Joining Waste: {dailySummaries.joinedPlanks.joiningWaste.toFixed(4)} m³</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <SafeIcon icon={FiTrendingDown} className="text-orange-500" />
                      <span>Planing Waste: {dailySummaries.planedPlanks.planingWaste.toFixed(4)} m³</span>
                    </div>
                  </div>
                </div>
                {renderSummaryTable(dailySummaries.planedPlanks.stats, 'Planed Planks')}
              </div>
            </div>
          )}

          {/* Supplier and Ramp Breakdown */}
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

          {/* Inventory Status */}
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

          {/* Waste Analysis */}
          <div className="p-4 bg-red-50 rounded-lg">
            <h4 className="text-lg font-semibold text-red-800 mb-3">Waste Analysis</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-3 bg-white rounded">
                <p className="text-sm font-medium text-gray-600">Joining Waste</p>
                <p className="text-xl font-bold text-red-600">{reportData.joiningWaste.toFixed(4)} m³</p>
                <p className="text-xs text-gray-500">
                  {reportData.totalTakenVolume > 0
                    ? `${((reportData.joiningWaste / reportData.totalTakenVolume) * 100).toFixed(1)}% of taken volume`
                    : '0% of taken volume'}
                </p>
              </div>
              <div className="p-3 bg-white rounded">
                <p className="text-sm font-medium text-gray-600">Planing Waste</p>
                <p className="text-xl font-bold text-orange-600">{reportData.planingWaste.toFixed(4)} m³</p>
                <p className="text-xs text-gray-500">
                  {reportData.totalJoinedVolume > 0
                    ? `${((reportData.planingWaste / reportData.totalJoinedVolume) * 100).toFixed(1)}% of joined volume`
                    : '0% of joined volume'}
                </p>
              </div>
              <div className="p-3 bg-white rounded">
                <p className="text-sm font-medium text-gray-600">Total Waste</p>
                <p className="text-xl font-bold text-red-800">{reportData.totalWaste.toFixed(4)} m³</p>
                <p className="text-xs text-gray-500">
                  {reportData.totalTakenVolume > 0
                    ? `${((reportData.totalWaste / reportData.totalTakenVolume) * 100).toFixed(1)}% of taken volume`
                    : '0% of taken volume'}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      ) : null}
    </motion.div>
  );
};

export default Reports;