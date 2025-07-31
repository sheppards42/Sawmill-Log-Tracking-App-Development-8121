import supabase from '../lib/supabase';

// Table names
export const TABLES = {
  LOGS: 'logs_sawmill_2024',
  CUT_LOGS: 'cut_logs_sawmill_2024',
  SUPPLIERS: 'suppliers_sawmill_2024',
  LOG_SHEETS: 'log_sheets_sawmill_2024'
};

// Log operations
export const logOperations = {
  // Create a new log entry
  async createLog(logData) {
    const { data, error } = await supabase
      .from(TABLES.LOGS)
      .insert([logData])
      .select();
    
    if (error) throw error;
    return data[0];
  },

  // Get all logs with optional filters
  async getLogs(filters = {}) {
    let query = supabase.from(TABLES.LOGS).select('*');
    
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.supplier) {
      query = query.eq('supplier', filters.supplier);
    }
    if (filters.dateFrom) {
      query = query.gte('timestamp', filters.dateFrom);
    }
    if (filters.dateTo) {
      query = query.lte('timestamp', filters.dateTo);
    }
    
    query = query.order('timestamp', { ascending: false });
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  // Update log status
  async updateLogStatus(logId, status) {
    const { data, error } = await supabase
      .from(TABLES.LOGS)
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', logId)
      .select();
    
    if (error) throw error;
    return data[0];
  },

  // Get logs by status
  async getLogsByStatus(status) {
    const { data, error } = await supabase
      .from(TABLES.LOGS)
      .select('*')
      .eq('status', status)
      .order('timestamp', { ascending: false });
    
    if (error) throw error;
    return data;
  }
};

// Cut log operations
export const cutLogOperations = {
  // Create a cut log record
  async createCutLog(cutLogData) {
    const { data, error } = await supabase
      .from(TABLES.CUT_LOGS)
      .insert([cutLogData])
      .select();
    
    if (error) throw error;
    return data[0];
  },

  // Get all cut logs with optional filters
  async getCutLogs(filters = {}) {
    let query = supabase.from(TABLES.CUT_LOGS).select('*');
    
    if (filters.ramp) {
      query = query.eq('ramp', filters.ramp);
    }
    if (filters.supplier) {
      query = query.eq('supplier', filters.supplier);
    }
    if (filters.dateFrom) {
      query = query.gte('cut_timestamp', filters.dateFrom);
    }
    if (filters.dateTo) {
      query = query.lte('cut_timestamp', filters.dateTo);
    }
    
    query = query.order('cut_timestamp', { ascending: false });
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  // Get cut logs by ramp
  async getCutLogsByRamp(ramp) {
    const { data, error } = await supabase
      .from(TABLES.CUT_LOGS)
      .select('*')
      .eq('ramp', ramp)
      .order('cut_timestamp', { ascending: false });
    
    if (error) throw error;
    return data;
  }
};

// Supplier operations
export const supplierOperations = {
  // Get all suppliers
  async getSuppliers() {
    const { data, error } = await supabase
      .from(TABLES.SUPPLIERS)
      .select('*')
      .eq('active', true)
      .order('name');
    
    if (error) throw error;
    return data;
  },

  // Create a new supplier
  async createSupplier(supplierData) {
    const { data, error } = await supabase
      .from(TABLES.SUPPLIERS)
      .insert([supplierData])
      .select();
    
    if (error) throw error;
    return data[0];
  },

  // Update supplier statistics
  async updateSupplierStats(supplierName, logsCount, volumeAmount) {
    const { data, error } = await supabase
      .from(TABLES.SUPPLIERS)
      .update({
        total_logs_delivered: logsCount,
        total_volume_delivered: volumeAmount,
        updated_at: new Date().toISOString()
      })
      .eq('name', supplierName)
      .select();
    
    if (error) throw error;
    return data[0];
  }
};

// Log sheet operations
export const logSheetOperations = {
  // Create a new log sheet
  async createLogSheet(logSheetData) {
    const { data, error } = await supabase
      .from(TABLES.LOG_SHEETS)
      .insert([logSheetData])
      .select();
    
    if (error) throw error;
    return data[0];
  },

  // Get all log sheets
  async getLogSheets() {
    const { data, error } = await supabase
      .from(TABLES.LOG_SHEETS)
      .select(`
        *,
        suppliers_sawmill_2024(name, contact_person)
      `)
      .order('delivery_date', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Update log sheet totals
  async updateLogSheetTotals(logSheetNumber, totalLogs, totalVolume) {
    const { data, error } = await supabase
      .from(TABLES.LOG_SHEETS)
      .update({
        total_logs: totalLogs,
        total_volume: totalVolume,
        updated_at: new Date().toISOString()
      })
      .eq('log_sheet_number', logSheetNumber)
      .select();
    
    if (error) throw error;
    return data[0];
  }
};

// Analytics operations
export const analyticsOperations = {
  // Get production summary for date range
  async getProductionSummary(dateFrom, dateTo) {
    const logsPromise = supabase
      .from(TABLES.LOGS)
      .select('*')
      .gte('timestamp', dateFrom)
      .lte('timestamp', dateTo);

    const cutLogsPromise = supabase
      .from(TABLES.CUT_LOGS)
      .select('*')
      .gte('cut_timestamp', dateFrom)
      .lte('cut_timestamp', dateTo);

    const [logsResult, cutLogsResult] = await Promise.all([logsPromise, cutLogsPromise]);

    if (logsResult.error) throw logsResult.error;
    if (cutLogsResult.error) throw cutLogsResult.error;

    return {
      logs: logsResult.data,
      cutLogs: cutLogsResult.data
    };
  },

  // Get supplier performance
  async getSupplierPerformance() {
    const { data, error } = await supabase
      .from(TABLES.SUPPLIERS)
      .select('name, total_logs_delivered, total_volume_delivered')
      .eq('active', true)
      .order('total_volume_delivered', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Get ramp utilization
  async getRampUtilization(dateFrom, dateTo) {
    const { data, error } = await supabase
      .from(TABLES.CUT_LOGS)
      .select('ramp')
      .gte('cut_timestamp', dateFrom)
      .lte('cut_timestamp', dateTo);

    if (error) throw error;
    
    const rampStats = { 1: 0, 2: 0, 3: 0 };
    data.forEach(log => {
      if (Object.prototype.hasOwnProperty.call(rampStats, log.ramp)) {
        rampStats[log.ramp]++;
      }
    });

    return rampStats;
  }
};

// Utility function to test connection
export const testConnection = async () => {
  try {
    const { data, error } = await supabase
      .from(TABLES.LOGS)
      .select('count(*)')
      .limit(1);
    
    if (error) throw error;
    console.log('Supabase: Connected successfully');
    return true;
  } catch (error) {
    console.error('Supabase connection error:', error);
    return false;
  }
};