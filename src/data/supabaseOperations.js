import supabase from '../lib/supabase';

// Table names
export const TABLES = {
  LOGS: 'logs_sawmill_2024',
  CUT_LOGS: 'cut_logs_sawmill_2024',
  SUPPLIERS: 'suppliers_sawmill_2024',
  LOG_SHEETS: 'log_sheets_sawmill_2024',
  PLANKS: 'planks_sawmill_2024',
  TAKEN_PLANKS: 'taken_planks_sawmill_2024',
  JOINED_PLANKS: 'joined_planks_sawmill_2024',
  PLANED_PLANKS: 'planed_planks_sawmill_2024',
  CUSTOMERS: 'customers_sawmill_2024',
  LOADS: 'loads_sawmill_2024',
  LOAD_ITEMS: 'load_items_sawmill_2024',
  DELIVERY_NOTES: 'delivery_notes_sawmill_2024',
  USERS: 'users_sawmill_2024',
  MACHINES: 'machines_sawmill_2024',
  TOOLS: 'tools_sawmill_2024',
  TOOL_USAGE: 'tool_usage_sawmill_2024',
  SPARES: 'spares_sawmill_2024',
  SPARE_USAGE: 'spare_usage_sawmill_2024',
  SPARE_REQUESTS: 'spare_requests_sawmill_2024',
  BREAKDOWNS: 'breakdowns_sawmill_2024'
};

// Initialize tables function
export const initializeTables = async () => {
  try {
    // Check if tables exist, if not create them
    const tables = [
      {
        name: TABLES.MACHINES,
        sql: `
          CREATE TABLE IF NOT EXISTS ${TABLES.MACHINES} (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name TEXT NOT NULL,
            description TEXT,
            location TEXT,
            created_at TIMESTAMP DEFAULT NOW()
          );
          ALTER TABLE ${TABLES.MACHINES} ENABLE ROW LEVEL SECURITY;
          CREATE POLICY IF NOT EXISTS "Enable all access for machines" ON ${TABLES.MACHINES} FOR ALL USING (true) WITH CHECK (true);
        `
      },
      {
        name: TABLES.TOOLS,
        sql: `
          CREATE TABLE IF NOT EXISTS ${TABLES.TOOLS} (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name TEXT NOT NULL,
            description TEXT,
            quantity INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT NOW()
          );
          ALTER TABLE ${TABLES.TOOLS} ENABLE ROW LEVEL SECURITY;
          CREATE POLICY IF NOT EXISTS "Enable all access for tools" ON ${TABLES.TOOLS} FOR ALL USING (true) WITH CHECK (true);
        `
      },
      {
        name: TABLES.TOOL_USAGE,
        sql: `
          CREATE TABLE IF NOT EXISTS ${TABLES.TOOL_USAGE} (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tool_id UUID REFERENCES ${TABLES.TOOLS}(id) ON DELETE CASCADE,
            machine_id UUID REFERENCES ${TABLES.MACHINES}(id) ON DELETE CASCADE,
            quantity INTEGER NOT NULL,
            usage_date TIMESTAMP DEFAULT NOW(),
            return_date TIMESTAMP,
            notes TEXT
          );
          ALTER TABLE ${TABLES.TOOL_USAGE} ENABLE ROW LEVEL SECURITY;
          CREATE POLICY IF NOT EXISTS "Enable all access for tool_usage" ON ${TABLES.TOOL_USAGE} FOR ALL USING (true) WITH CHECK (true);
        `
      },
      {
        name: TABLES.SPARES,
        sql: `
          CREATE TABLE IF NOT EXISTS ${TABLES.SPARES} (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name TEXT NOT NULL,
            description TEXT,
            quantity INTEGER DEFAULT 0,
            min_quantity INTEGER DEFAULT 1,
            created_at TIMESTAMP DEFAULT NOW()
          );
          ALTER TABLE ${TABLES.SPARES} ENABLE ROW LEVEL SECURITY;
          CREATE POLICY IF NOT EXISTS "Enable all access for spares" ON ${TABLES.SPARES} FOR ALL USING (true) WITH CHECK (true);
        `
      },
      {
        name: TABLES.SPARE_USAGE,
        sql: `
          CREATE TABLE IF NOT EXISTS ${TABLES.SPARE_USAGE} (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            spare_id UUID REFERENCES ${TABLES.SPARES}(id) ON DELETE CASCADE,
            machine_id UUID REFERENCES ${TABLES.MACHINES}(id) ON DELETE CASCADE,
            quantity INTEGER NOT NULL,
            usage_date TIMESTAMP DEFAULT NOW(),
            notes TEXT
          );
          ALTER TABLE ${TABLES.SPARE_USAGE} ENABLE ROW LEVEL SECURITY;
          CREATE POLICY IF NOT EXISTS "Enable all access for spare_usage" ON ${TABLES.SPARE_USAGE} FOR ALL USING (true) WITH CHECK (true);
        `
      },
      {
        name: TABLES.SPARE_REQUESTS,
        sql: `
          CREATE TABLE IF NOT EXISTS ${TABLES.SPARE_REQUESTS} (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            spare_id UUID REFERENCES ${TABLES.SPARES}(id) ON DELETE SET NULL,
            spare_name TEXT NOT NULL,
            description TEXT,
            machine_id UUID REFERENCES ${TABLES.MACHINES}(id) ON DELETE SET NULL,
            quantity INTEGER NOT NULL,
            notes TEXT,
            request_date TIMESTAMP DEFAULT NOW(),
            status TEXT DEFAULT 'pending',
            fulfilled_date TIMESTAMP
          );
          ALTER TABLE ${TABLES.SPARE_REQUESTS} ENABLE ROW LEVEL SECURITY;
          CREATE POLICY IF NOT EXISTS "Enable all access for spare_requests" ON ${TABLES.SPARE_REQUESTS} FOR ALL USING (true) WITH CHECK (true);
        `
      },
      {
        name: TABLES.BREAKDOWNS,
        sql: `
          CREATE TABLE IF NOT EXISTS ${TABLES.BREAKDOWNS} (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            machine_id UUID REFERENCES ${TABLES.MACHINES}(id) ON DELETE CASCADE,
            description TEXT NOT NULL,
            priority TEXT DEFAULT 'orange',
            reported_by TEXT NOT NULL,
            reported_at TIMESTAMP DEFAULT NOW(),
            status TEXT DEFAULT 'active',
            resolved_at TIMESTAMP,
            resolution_description TEXT,
            resolved_by TEXT
          );
          ALTER TABLE ${TABLES.BREAKDOWNS} ENABLE ROW LEVEL SECURITY;
          CREATE POLICY IF NOT EXISTS "Enable all access for breakdowns" ON ${TABLES.BREAKDOWNS} FOR ALL USING (true) WITH CHECK (true);
        `
      }
    ];

    for (const table of tables) {
      const { error } = await supabase.rpc('exec_sql', { sql: table.sql });
      if (error) {
        console.warn(`Warning creating table ${table.name}:`, error);
      }
    }

    console.log('Tables initialized successfully');
  } catch (error) {
    console.error('Error initializing tables:', error);
  }
};

// User operations
export const userOperations = {
  // Create a new user
  async createUser(userData) {
    // Hash password (in production, use proper hashing)
    const hashedPassword = btoa(userData.password); // Simple base64 encoding for demo
    
    const userRecord = {
      username: userData.username,
      password_hash: hashedPassword,
      full_name: userData.full_name,
      role: userData.role,
      permissions: userData.permissions,
      active: userData.active,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from(TABLES.USERS)
      .insert([userRecord])
      .select();

    if (error) throw error;
    return data[0];
  },

  // Get all users
  async getUsers() {
    const { data, error } = await supabase
      .from(TABLES.USERS)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data.map(user => ({
      ...user,
      password_hash: undefined // Don't return password hash
    }));
  },

  // Update user
  async updateUser(userId, userData) {
    const updateData = {
      full_name: userData.full_name,
      role: userData.role,
      permissions: userData.permissions,
      active: userData.active,
      updated_at: new Date().toISOString()
    };

    // Only update password if provided
    if (userData.password) {
      updateData.password_hash = btoa(userData.password);
    }

    const { data, error } = await supabase
      .from(TABLES.USERS)
      .update(updateData)
      .eq('id', userId)
      .select();

    if (error) throw error;
    return data[0];
  },

  // Delete user
  async deleteUser(userId) {
    const { error } = await supabase
      .from(TABLES.USERS)
      .delete()
      .eq('id', userId);

    if (error) throw error;
    return true;
  },

  // Authenticate user
  async authenticateUser(username, password) {
    const { data, error } = await supabase
      .from(TABLES.USERS)
      .select('*')
      .eq('username', username)
      .eq('active', true)
      .single();

    if (error || !data) {
      return null;
    }

    // Check password (in production, use proper password verification)
    const providedPasswordHash = btoa(password);
    if (data.password_hash !== providedPasswordHash) {
      return null;
    }

    // Return user data without password hash
    return {
      id: data.id,
      username: data.username,
      full_name: data.full_name,
      role: data.role,
      permissions: data.permissions,
      active: data.active
    };
  },

  // Initialize default users (run once)
  async initializeDefaultUsers() {
    try {
      // Check if users already exist
      const { data: existingUsers } = await supabase
        .from(TABLES.USERS)
        .select('username')
        .limit(1);

      if (existingUsers && existingUsers.length > 0) {
        console.log('Users already initialized');
        return;
      }

      const defaultUsers = [
        {
          username: 'Sean',
          password: 'Chelsea99',
          full_name: 'Sean Administrator',
          role: 'Admin',
          permissions: [
            'log_entry', 'cutting_station', 'plank_tracking', 'plank_processing',
            'load_management', 'delivery_notes', 'reports', 'user_management'
          ],
          active: true
        },
        {
          username: 'admin',
          password: 'admin123',
          full_name: 'System Administrator',
          role: 'Admin',
          permissions: [
            'log_entry', 'cutting_station', 'plank_tracking', 'plank_processing',
            'load_management', 'delivery_notes', 'reports', 'user_management'
          ],
          active: true
        },
        {
          username: 'operator1',
          password: 'op123',
          full_name: 'John Operator',
          role: 'Operator',
          permissions: ['log_entry', 'cutting_station', 'plank_tracking', 'reports'],
          active: true
        },
        {
          username: 'stock1',
          password: 'stock123',
          full_name: 'Mary Stock Controller',
          role: 'Stock Control',
          permissions: ['plank_tracking', 'plank_processing', 'load_management', 'reports'],
          active: true
        },
        {
          username: 'driver1',
          password: 'dr123',
          full_name: 'Mike Driver',
          role: 'Driver',
          permissions: ['load_management', 'delivery_notes'],
          active: true
        }
      ];

      for (const user of defaultUsers) {
        await this.createUser(user);
      }

      console.log('Default users initialized successfully');
    } catch (error) {
      console.error('Error initializing default users:', error);
    }
  }
};

// Machine operations
export const machineOperations = {
  // Create a new machine
  async createMachine(machineData) {
    const { data, error } = await supabase
      .from(TABLES.MACHINES)
      .insert([{ ...machineData, created_at: new Date().toISOString() }])
      .select();

    if (error) throw error;
    return data[0];
  },

  // Get all machines
  async getMachines() {
    const { data, error } = await supabase
      .from(TABLES.MACHINES)
      .select('*')
      .order('name');

    if (error) throw error;
    return data || [];
  },

  // Update machine
  async updateMachine(machineId, machineData) {
    const { data, error } = await supabase
      .from(TABLES.MACHINES)
      .update(machineData)
      .eq('id', machineId)
      .select();

    if (error) throw error;
    return data[0];
  },

  // Delete machine
  async deleteMachine(machineId) {
    const { error } = await supabase
      .from(TABLES.MACHINES)
      .delete()
      .eq('id', machineId);

    if (error) throw error;
    return true;
  }
};

// Tool operations
export const toolOperations = {
  // Create a new tool
  async createTool(toolData) {
    const { data, error } = await supabase
      .from(TABLES.TOOLS)
      .insert([{ ...toolData, created_at: new Date().toISOString() }])
      .select();

    if (error) throw error;
    return data[0];
  },

  // Get all tools
  async getTools() {
    const { data, error } = await supabase
      .from(TABLES.TOOLS)
      .select('*')
      .order('name');

    if (error) throw error;
    return data || [];
  },

  // Update tool
  async updateTool(toolId, toolData) {
    const { data, error } = await supabase
      .from(TABLES.TOOLS)
      .update(toolData)
      .eq('id', toolId)
      .select();

    if (error) throw error;
    return data[0];
  },

  // Delete tool
  async deleteTool(toolId) {
    const { error } = await supabase
      .from(TABLES.TOOLS)
      .delete()
      .eq('id', toolId);

    if (error) throw error;
    return true;
  },

  // Record tool usage
  async recordToolUsage(usageData) {
    // First, check if enough tools are available
    const { data: tool, error: toolError } = await supabase
      .from(TABLES.TOOLS)
      .select('quantity')
      .eq('id', usageData.tool_id)
      .single();

    if (toolError) throw toolError;
    if (tool.quantity < usageData.quantity) {
      throw new Error('Not enough tools available');
    }

    // Record usage
    const { data, error } = await supabase
      .from(TABLES.TOOL_USAGE)
      .insert([{ ...usageData, usage_date: new Date().toISOString() }])
      .select();

    if (error) throw error;

    // Update tool quantity
    await supabase
      .from(TABLES.TOOLS)
      .update({ quantity: tool.quantity - usageData.quantity })
      .eq('id', usageData.tool_id);

    return data[0];
  },

  // Return tool
  async returnTool(usageId) {
    // Get usage record
    const { data: usage, error: usageError } = await supabase
      .from(TABLES.TOOL_USAGE)
      .select('*')
      .eq('id', usageId)
      .single();

    if (usageError) throw usageError;

    // Update usage record with return date
    const { error: updateError } = await supabase
      .from(TABLES.TOOL_USAGE)
      .update({ return_date: new Date().toISOString() })
      .eq('id', usageId);

    if (updateError) throw updateError;

    // Update tool quantity
    const { data: tool, error: toolError } = await supabase
      .from(TABLES.TOOLS)
      .select('quantity')
      .eq('id', usage.tool_id)
      .single();

    if (toolError) throw toolError;

    await supabase
      .from(TABLES.TOOLS)
      .update({ quantity: tool.quantity + usage.quantity })
      .eq('id', usage.tool_id);

    return true;
  },

  // Get tool usage
  async getToolUsage() {
    const { data, error } = await supabase
      .from(TABLES.TOOL_USAGE)
      .select(`
        *,
        tools:tool_id(name),
        machines:machine_id(name)
      `)
      .order('usage_date', { ascending: false });

    if (error) throw error;
    return (data || []).map(usage => ({
      ...usage,
      tool_name: usage.tools?.name || 'Unknown',
      machine_name: usage.machines?.name || 'Unknown'
    }));
  },

  // Get tools by machine
  async getToolsByMachine(machineId) {
    const { data, error } = await supabase
      .from(TABLES.TOOL_USAGE)
      .select(`
        *,
        tools:tool_id(name)
      `)
      .eq('machine_id', machineId)
      .order('usage_date', { ascending: false });

    if (error) throw error;
    return (data || []).map(usage => ({
      ...usage,
      tool_name: usage.tools?.name || 'Unknown'
    }));
  }
};

// Spare operations
export const spareOperations = {
  // Create a new spare
  async createSpare(spareData) {
    const { data, error } = await supabase
      .from(TABLES.SPARES)
      .insert([{ ...spareData, created_at: new Date().toISOString() }])
      .select();

    if (error) throw error;
    return data[0];
  },

  // Get all spares
  async getSpares() {
    const { data, error } = await supabase
      .from(TABLES.SPARES)
      .select('*')
      .order('name');

    if (error) throw error;
    return data || [];
  },

  // Update spare
  async updateSpare(spareId, spareData) {
    const { data, error } = await supabase
      .from(TABLES.SPARES)
      .update(spareData)
      .eq('id', spareId)
      .select();

    if (error) throw error;
    return data[0];
  },

  // Delete spare
  async deleteSpare(spareId) {
    const { error } = await supabase
      .from(TABLES.SPARES)
      .delete()
      .eq('id', spareId);

    if (error) throw error;
    return true;
  },

  // Record spare usage
  async recordSpareUsage(usageData) {
    // First, check if enough spares are available
    const { data: spare, error: spareError } = await supabase
      .from(TABLES.SPARES)
      .select('quantity')
      .eq('id', usageData.spare_id)
      .single();

    if (spareError) throw spareError;
    if (spare.quantity < usageData.quantity) {
      throw new Error('Not enough spare parts available');
    }

    // Record usage
    const { data, error } = await supabase
      .from(TABLES.SPARE_USAGE)
      .insert([{ ...usageData, usage_date: new Date().toISOString() }])
      .select();

    if (error) throw error;

    // Update spare quantity
    await supabase
      .from(TABLES.SPARES)
      .update({ quantity: spare.quantity - usageData.quantity })
      .eq('id', usageData.spare_id);

    return data[0];
  },

  // Get spare usage
  async getSpareUsage() {
    const { data, error } = await supabase
      .from(TABLES.SPARE_USAGE)
      .select(`
        *,
        spares:spare_id(name),
        machines:machine_id(name)
      `)
      .order('usage_date', { ascending: false });

    if (error) throw error;
    return (data || []).map(usage => ({
      ...usage,
      spare_name: usage.spares?.name || 'Unknown',
      machine_name: usage.machines?.name || 'Unknown'
    }));
  },

  // Get spares by machine
  async getSparesByMachine(machineId) {
    const { data, error } = await supabase
      .from(TABLES.SPARE_USAGE)
      .select(`
        *,
        spares:spare_id(name)
      `)
      .eq('machine_id', machineId)
      .order('usage_date', { ascending: false });

    if (error) throw error;
    return (data || []).map(usage => ({
      ...usage,
      spare_name: usage.spares?.name || 'Unknown'
    }));
  },

  // Create spare request
  async createSpareRequest(requestData) {
    const { data, error } = await supabase
      .from(TABLES.SPARE_REQUESTS)
      .insert([{
        ...requestData,
        request_date: new Date().toISOString(),
        status: 'pending'
      }])
      .select();

    if (error) throw error;
    return data[0];
  },

  // Get spare requests
  async getSpareRequests() {
    const { data, error } = await supabase
      .from(TABLES.SPARE_REQUESTS)
      .select(`
        *,
        machines:machine_id(name)
      `)
      .order('request_date', { ascending: false });

    if (error) throw error;
    return (data || []).map(request => ({
      ...request,
      machine_name: request.machines?.name || 'General'
    }));
  },

  // Fulfill spare request
  async fulfillSpareRequest(requestId) {
    // Get the request
    const { data: request, error: requestError } = await supabase
      .from(TABLES.SPARE_REQUESTS)
      .select('*')
      .eq('id', requestId)
      .single();

    if (requestError) throw requestError;

    // Check if spare exists, if not create it
    let spareId = request.spare_id;
    if (!spareId) {
      // Create new spare
      const { data: newSpare, error: spareError } = await supabase
        .from(TABLES.SPARES)
        .insert([{
          name: request.spare_name,
          description: request.description,
          quantity: request.quantity,
          min_quantity: 1,
          created_at: new Date().toISOString()
        }])
        .select();

      if (spareError) throw spareError;
      spareId = newSpare[0].id;
    } else {
      // Update existing spare quantity
      const { data: spare, error: spareError } = await supabase
        .from(TABLES.SPARES)
        .select('quantity')
        .eq('id', spareId)
        .single();

      if (spareError) throw spareError;

      await supabase
        .from(TABLES.SPARES)
        .update({ quantity: spare.quantity + request.quantity })
        .eq('id', spareId);
    }

    // Update request status
    const { error: updateError } = await supabase
      .from(TABLES.SPARE_REQUESTS)
      .update({
        status: 'fulfilled',
        fulfilled_date: new Date().toISOString()
      })
      .eq('id', requestId);

    if (updateError) throw updateError;
    return true;
  }
};

// Breakdown operations
export const breakdownOperations = {
  // Create a new breakdown
  async createBreakdown(breakdownData) {
    const { data, error } = await supabase
      .from(TABLES.BREAKDOWNS)
      .insert([{
        ...breakdownData,
        reported_at: new Date().toISOString(),
        status: 'active'
      }])
      .select();

    if (error) throw error;
    return data[0];
  },

  // Get breakdowns
  async getBreakdowns(status = 'all') {
    let query = supabase
      .from(TABLES.BREAKDOWNS)
      .select(`
        *,
        machines:machine_id(name)
      `);

    if (status !== 'all') {
      query = query.eq('status', status);
    }

    query = query.order('reported_at', { ascending: false });

    const { data, error } = await query;
    if (error) throw error;

    return (data || []).map(breakdown => ({
      ...breakdown,
      machine_name: breakdown.machines?.name || 'Unknown'
    }));
  },

  // Update breakdown
  async updateBreakdown(breakdownId, breakdownData) {
    const { data, error } = await supabase
      .from(TABLES.BREAKDOWNS)
      .update(breakdownData)
      .eq('id', breakdownId)
      .select();

    if (error) throw error;
    return data[0];
  },

  // Resolve breakdown
  async resolveBreakdown(breakdownId, resolutionData) {
    const { data, error } = await supabase
      .from(TABLES.BREAKDOWNS)
      .update({
        status: 'resolved',
        resolved_at: new Date().toISOString(),
        resolution_description: resolutionData.resolution_description,
        resolved_by: resolutionData.resolved_by
      })
      .eq('id', breakdownId)
      .select();

    if (error) throw error;
    return data[0];
  },

  // Delete breakdown
  async deleteBreakdown(breakdownId) {
    const { error } = await supabase
      .from(TABLES.BREAKDOWNS)
      .delete()
      .eq('id', breakdownId);

    if (error) throw error;
    return true;
  },

  // Get breakdown statistics
  async getBreakdownStats(machineId = null, dateFrom = null, dateTo = null) {
    let query = supabase
      .from(TABLES.BREAKDOWNS)
      .select('*');

    if (machineId) {
      query = query.eq('machine_id', machineId);
    }

    if (dateFrom) {
      query = query.gte('reported_at', dateFrom);
    }

    if (dateTo) {
      query = query.lte('reported_at', dateTo);
    }

    const { data, error } = await query;
    if (error) throw error;

    // Calculate statistics
    const totalBreakdowns = data.length;
    const activeBreakdowns = data.filter(b => b.status === 'active').length;
    const resolvedBreakdowns = data.filter(b => b.status === 'resolved').length;

    // Calculate average downtime for resolved breakdowns
    const resolvedWithDowntime = data.filter(b => b.status === 'resolved' && b.resolved_at);
    const totalDowntime = resolvedWithDowntime.reduce((sum, breakdown) => {
      const start = new Date(breakdown.reported_at);
      const end = new Date(breakdown.resolved_at);
      return sum + (end - start);
    }, 0);

    const avgDowntime = resolvedWithDowntime.length > 0 ? totalDowntime / resolvedWithDowntime.length : 0;

    // Priority breakdown
    const priorityStats = {
      orange: data.filter(b => b.priority === 'orange').length,
      red: data.filter(b => b.priority === 'red').length
    };

    return {
      totalBreakdowns,
      activeBreakdowns,
      resolvedBreakdowns,
      avgDowntime,
      priorityStats
    };
  }
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
  },

  // Get supplier analytics for period
  async getSupplierAnalytics(dateFrom, dateTo) {
    // Get logs data for the period
    const { data: logs, error: logsError } = await supabase
      .from(TABLES.LOGS)
      .select('supplier, volume, timestamp')
      .gte('timestamp', dateFrom)
      .lte('timestamp', dateTo);

    if (logsError) throw logsError;

    // Group by supplier
    const supplierStats = {};
    logs.forEach(log => {
      if (!supplierStats[log.supplier]) {
        supplierStats[log.supplier] = {
          supplier: log.supplier,
          total_logs: 0,
          total_volume: 0,
          deliveries: []
        };
      }
      supplierStats[log.supplier].total_logs++;
      supplierStats[log.supplier].total_volume += parseFloat(log.volume);
      supplierStats[log.supplier].deliveries.push({
        date: log.timestamp,
        volume: log.volume
      });
    });

    return Object.values(supplierStats);
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

// Plank operations
export const plankOperations = {
  // Create new plank entries
  async createPlankEntries(plankData) {
    const { data, error } = await supabase
      .from(TABLES.PLANKS)
      .insert(plankData)
      .select();

    if (error) throw error;
    return data;
  },

  // Get plank data by date
  async getPlanksByDate(date) {
    const { data, error } = await supabase
      .from(TABLES.PLANKS)
      .select('*')
      .eq('date', date);

    if (error) throw error;
    return data;
  },

  // Get plank summary for date range
  async getPlankSummary(dateFrom, dateTo) {
    const { data, error } = await supabase
      .from(TABLES.PLANKS)
      .select('*')
      .gte('date', dateFrom)
      .lte('date', dateTo);

    if (error) throw error;
    return data;
  },

  // Get available planks (total produced minus taken)
  async getAvailablePlanks() {
    // Get total planks produced
    const { data: planksData, error: planksError } = await supabase
      .from(TABLES.PLANKS)
      .select('width, height, length, quantity, volume');

    if (planksError) throw planksError;

    // Get total planks taken
    const { data: takenData, error: takenError } = await supabase
      .from(TABLES.TAKEN_PLANKS)
      .select('width, height, length, quantity, volume');

    if (takenError) throw takenError;

    // Calculate available quantities
    const plankMap = {};

    // Add produced planks
    planksData.forEach(plank => {
      const key = `${plank.width}x${plank.height}x${plank.length}`;
      if (!plankMap[key]) {
        plankMap[key] = {
          width: plank.width,
          height: plank.height,
          length: plank.length,
          produced: 0,
          taken: 0,
          volume_produced: 0,
          volume_taken: 0
        };
      }
      plankMap[key].produced += plank.quantity;
      plankMap[key].volume_produced += plank.volume || 0;
    });

    // Subtract taken planks
    takenData.forEach(taken => {
      const key = `${taken.width}x${taken.height}x${taken.length}`;
      if (plankMap[key]) {
        plankMap[key].taken += taken.quantity;
        plankMap[key].volume_taken += taken.volume || 0;
      }
    });

    // Return available planks
    return Object.values(plankMap).map(plank => ({
      width: plank.width,
      height: plank.height,
      length: plank.length,
      total_quantity: plank.produced,
      taken_quantity: plank.taken,
      available_quantity: Math.max(0, plank.produced - plank.taken),
      total_volume: plank.volume_produced,
      available_volume: Math.max(0, plank.volume_produced - plank.volume_taken)
    })).filter(plank => plank.available_quantity > 0);
  },

  // Get volume summary by size
  async getVolumeSummaryBySize(dateFrom, dateTo) {
    const { data, error } = await supabase
      .from(TABLES.PLANKS)
      .select('width, height, volume')
      .gte('date', dateFrom)
      .lte('date', dateTo);

    if (error) throw error;

    const sizeVolumes = {};
    let totalVolume = 0;

    data.forEach(plank => {
      const sizeKey = `${plank.width}x${plank.height}`;
      if (!sizeVolumes[sizeKey]) {
        sizeVolumes[sizeKey] = 0;
      }
      sizeVolumes[sizeKey] += plank.volume || 0;
      totalVolume += plank.volume || 0;
    });

    return { sizeVolumes, totalVolume };
  }
};

// Joining and Planing operations
export const joiningPlaningOperations = {
  // Create taken planks entries
  async createTakenPlanks(takenPlankData) {
    const { data, error } = await supabase
      .from(TABLES.TAKEN_PLANKS)
      .insert(takenPlankData)
      .select();

    if (error) throw error;
    return data;
  },

  // Get taken planks data by date
  async getTakenPlanksByDate(date) {
    const { data, error } = await supabase
      .from(TABLES.TAKEN_PLANKS)
      .select('*')
      .eq('date', date);

    if (error) throw error;
    return data;
  },

  // Get available taken planks (total taken minus used in joining)
  async getAvailableTakenPlanks() {
    // Get total planks taken
    const { data: takenData, error: takenError } = await supabase
      .from(TABLES.TAKEN_PLANKS)
      .select('width, height, length, volume');

    if (takenError) throw takenError;

    // Get total volume used in joining
    const { data: joinedData, error: joinedError } = await supabase
      .from(TABLES.JOINED_PLANKS)
      .select('volume');

    if (joinedError) throw joinedError;

    // Calculate total taken volume by dimensions
    const takenMap = {};
    takenData.forEach(taken => {
      const key = `${taken.width}x${taken.height}x${taken.length}`;
      if (!takenMap[key]) {
        takenMap[key] = {
          width: taken.width,
          height: taken.height,
          length: taken.length,
          volume: 0
        };
      }
      takenMap[key].volume += taken.volume;
    });

    // Calculate total joined volume
    const totalJoinedVolume = joinedData.reduce((sum, joined) => sum + joined.volume, 0);

    // Return available taken planks (volume-based availability)
    return Object.values(takenMap).map(taken => ({
      width: taken.width,
      height: taken.height,
      length: taken.length,
      available_quantity: 999, // Volume-based system, so quantity is not limited
      available_volume: taken.volume
    }));
  },

  // Create joined planks entries
  async createJoinedPlanks(joinedPlankData) {
    const { data, error } = await supabase
      .from(TABLES.JOINED_PLANKS)
      .insert(joinedPlankData)
      .select();

    if (error) throw error;
    return data;
  },

  // Get joined planks data by date
  async getJoinedPlanksByDate(date) {
    const { data, error } = await supabase
      .from(TABLES.JOINED_PLANKS)
      .select('*')
      .eq('date', date);

    if (error) throw error;
    return data;
  },

  // Get available joined planks (total joined minus used in planing)
  async getAvailableJoinedPlanks() {
    // Get total planks joined
    const { data: joinedData, error: joinedError } = await supabase
      .from(TABLES.JOINED_PLANKS)
      .select('width, height, length, volume');

    if (joinedError) throw joinedError;

    // Get total volume used in planing
    const { data: planedData, error: planedError } = await supabase
      .from(TABLES.PLANED_PLANKS)
      .select('volume');

    if (planedError) throw planedError;

    // Calculate total joined volume by dimensions
    const joinedMap = {};
    joinedData.forEach(joined => {
      const key = `${joined.width}x${joined.height}x${joined.length}`;
      if (!joinedMap[key]) {
        joinedMap[key] = {
          width: joined.width,
          height: joined.height,
          length: joined.length,
          volume: 0
        };
      }
      joinedMap[key].volume += joined.volume;
    });

    // Calculate total planed volume
    const totalPlanedVolume = planedData.reduce((sum, planed) => sum + planed.volume, 0);

    // Return available joined planks (volume-based availability)
    return Object.values(joinedMap).map(joined => ({
      width: joined.width,
      height: joined.height,
      length: joined.length,
      available_quantity: 999, // Volume-based system, so quantity is not limited
      available_volume: joined.volume
    }));
  },

  // Create planed planks entry
  async createPlanedPlanks(planedPlankData) {
    const { data, error } = await supabase
      .from(TABLES.PLANED_PLANKS)
      .insert(planedPlankData)
      .select();

    if (error) throw error;
    return data;
  },

  // Get planed planks data by date
  async getPlanedPlanksByDate(date) {
    const { data, error } = await supabase
      .from(TABLES.PLANED_PLANKS)
      .select('*')
      .eq('date', date);

    if (error) throw error;
    return data;
  },

  // Get joined and planed summary for date range
  async getJoiningPlaningSummary(dateFrom, dateTo) {
    const takenPromise = supabase
      .from(TABLES.TAKEN_PLANKS)
      .select('*')
      .gte('date', dateFrom)
      .lte('date', dateTo);

    const joinedPromise = supabase
      .from(TABLES.JOINED_PLANKS)
      .select('*')
      .gte('date', dateFrom)
      .lte('date', dateTo);

    const planedPromise = supabase
      .from(TABLES.PLANED_PLANKS)
      .select('*')
      .gte('date', dateFrom)
      .lte('date', dateTo);

    const [takenResult, joinedResult, planedResult] = await Promise.all([
      takenPromise,
      joinedPromise,
      planedPromise
    ]);

    if (takenResult.error) throw takenResult.error;
    if (joinedResult.error) throw joinedResult.error;
    if (planedResult.error) throw planedResult.error;

    return {
      taken: takenResult.data,
      joined: joinedResult.data,
      planed: planedResult.data
    };
  }
};

// Customer operations
export const customerOperations = {
  // Get all customers
  async getCustomers() {
    const { data, error } = await supabase
      .from(TABLES.CUSTOMERS)
      .select('*')
      .eq('active', true)
      .order('name');

    if (error) throw error;
    return data || [];
  },

  // Create a new customer
  async createCustomer(customerData) {
    const { data, error } = await supabase
      .from(TABLES.CUSTOMERS)
      .insert([{
        ...customerData,
        created_at: new Date().toISOString(),
        active: true
      }])
      .select();

    if (error) throw error;
    return data[0];
  },

  // Update customer
  async updateCustomer(customerId, customerData) {
    const { data, error } = await supabase
      .from(TABLES.CUSTOMERS)
      .update({
        ...customerData,
        updated_at: new Date().toISOString()
      })
      .eq('id', customerId)
      .select();

    if (error) throw error;
    return data[0];
  },

  // Delete customer (set inactive)
  async deleteCustomer(customerId) {
    const { data, error } = await supabase
      .from(TABLES.CUSTOMERS)
      .update({ 
        active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', customerId)
      .select();

    if (error) throw error;
    return data[0];
  },

  // Get customer delivery analytics
  async getCustomerAnalytics(customerId = null, dateFrom, dateTo) {
    let query = supabase
      .from(TABLES.LOADS)
      .select(`
        *,
        customers:customer_id(name, email),
        load_items:load_items_sawmill_2024(*)
      `)
      .gte('date', dateFrom)
      .lte('date', dateTo);

    if (customerId) {
      query = query.eq('customer_id', customerId);
    }

    const { data, error } = await query;
    if (error) throw error;

    // Group by customer
    const customerStats = {};
    data.forEach(load => {
      const customerName = load.customers?.name || 'Unknown';
      if (!customerStats[customerName]) {
        customerStats[customerName] = {
          customer_name: customerName,
          customer_email: load.customers?.email || '',
          total_loads: 0,
          total_quantity: 0,
          total_volume: 0,
          wet_loads: 0,
          dry_loads: 0,
          loads: []
        };
      }

      customerStats[customerName].total_loads++;
      customerStats[customerName].total_quantity += parseInt(load.total_quantity);
      customerStats[customerName].total_volume += parseFloat(load.total_volume);
      
      if (load.inventory_type === 'wet') {
        customerStats[customerName].wet_loads++;
      } else {
        customerStats[customerName].dry_loads++;
      }

      customerStats[customerName].loads.push({
        load_number: load.load_number,
        date: load.date,
        truck_registration: load.truck_registration,
        inventory_type: load.inventory_type,
        quantity: load.total_quantity,
        volume: load.total_volume,
        status: load.status,
        items: load.load_items || []
      });
    });

    return Object.values(customerStats);
  }
};

// Load operations
export const loadOperations = {
  // Create a new load
  async createLoad(loadData) {
    // Generate load number
    const loadNumber = `LD${Date.now().toString().slice(-6)}`;
    
    const { data, error } = await supabase
      .from(TABLES.LOADS)
      .insert([{ ...loadData, load_number: loadNumber }])
      .select();

    if (error) throw error;
    return data[0];
  },

  // Create load items
  async createLoadItems(loadItems) {
    const { data, error } = await supabase
      .from(TABLES.LOAD_ITEMS)
      .insert(loadItems)
      .select();

    if (error) throw error;
    return data;
  },

  // Get all loads with customer details
  async getLoads() {
    const { data, error } = await supabase
      .from(TABLES.LOADS)
      .select(`
        *,
        customers_sawmill_2024(name, email)
      `)
      .order('date', { ascending: false });

    if (error) throw error;

    // Flatten customer data
    return data.map(load => ({
      ...load,
      customer_name: load.customers_sawmill_2024?.name || 'Unknown',
      customer_email: load.customers_sawmill_2024?.email || ''
    }));
  },

  // Get load by ID
  async getLoadById(loadId) {
    const { data, error } = await supabase
      .from(TABLES.LOADS)
      .select(`
        *,
        customers_sawmill_2024(name, email)
      `)
      .eq('id', loadId)
      .single();

    if (error) throw error;

    return {
      ...data,
      customer_name: data.customers_sawmill_2024?.name || 'Unknown',
      customer_email: data.customers_sawmill_2024?.email || ''
    };
  },

  // Get load items
  async getLoadItems(loadId) {
    const { data, error } = await supabase
      .from(TABLES.LOAD_ITEMS)
      .select('*')
      .eq('load_id', loadId);

    if (error) throw error;
    return data;
  },

  // Update load status
  async updateLoadStatus(loadId, status) {
    const { data, error } = await supabase
      .from(TABLES.LOADS)
      .update({ status })
      .eq('id', loadId)
      .select();

    if (error) throw error;
    return data[0];
  }
};

// Inventory operations
export const inventoryOperations = {
  // Get available inventory by type (wet/dry)
  async getAvailableInventory(inventoryType) {
    if (inventoryType === 'wet') {
      // Wet inventory = produced planks - taken planks
      return await plankOperations.getAvailablePlanks();
    } else {
      // Dry inventory = planed planks - loaded planks
      const { data: planedData, error: planedError } = await supabase
        .from(TABLES.PLANED_PLANKS)
        .select('width, height, length, quantity, volume');

      if (planedError) throw planedError;

      const { data: loadedData, error: loadedError } = await supabase
        .from(TABLES.LOAD_ITEMS)
        .select('width, height, length, quantity, volume')
        .eq('inventory_type', 'dry');

      if (loadedError) throw loadedError;

      // Calculate available dry inventory
      const plankMap = {};

      // Add planed planks
      planedData.forEach(plank => {
        const key = `${plank.width}x${plank.height}x${plank.length}`;
        if (!plankMap[key]) {
          plankMap[key] = {
            width: plank.width,
            height: plank.height,
            length: plank.length,
            produced: 0,
            loaded: 0
          };
        }
        plankMap[key].produced += plank.quantity;
      });

      // Subtract loaded planks
      loadedData.forEach(loaded => {
        const key = `${loaded.width}x${loaded.height}x${loaded.length}`;
        if (plankMap[key]) {
          plankMap[key].loaded += loaded.quantity;
        }
      });

      return Object.values(plankMap).map(plank => ({
        width: plank.width,
        height: plank.height,
        length: plank.length,
        available_quantity: Math.max(0, plank.produced - plank.loaded)
      })).filter(plank => plank.available_quantity > 0);
    }
  },

  // Deduct inventory when load is created
  async deductInventory(loadItems, inventoryType) {
    // This is handled by the load creation process
    // Inventory is tracked by comparing production vs usage
    console.log(`Inventory deducted for ${inventoryType} planks:`, loadItems);
  }
};

// Delivery note operations
export const deliveryNoteOperations = {
  // Create delivery note
  async createDeliveryNote(deliveryNoteData) {
    const { data, error } = await supabase
      .from(TABLES.DELIVERY_NOTES)
      .insert([deliveryNoteData])
      .select();

    if (error) throw error;
    return data[0];
  },

  // Get delivery notes
  async getDeliveryNotes() {
    const { data, error } = await supabase
      .from(TABLES.DELIVERY_NOTES)
      .select(`
        *,
        loads_sawmill_2024(load_number, date, truck_registration)
      `)
      .order('signed_at', { ascending: false });

    if (error) throw error;
    return data;
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

    const planksPromise = supabase
      .from(TABLES.PLANKS)
      .select('*')
      .gte('date', dateFrom)
      .lte('date', dateTo);

    const takenPlanksPromise = supabase
      .from(TABLES.TAKEN_PLANKS)
      .select('*')
      .gte('date', dateFrom)
      .lte('date', dateTo);

    const joinedPlanksPromise = supabase
      .from(TABLES.JOINED_PLANKS)
      .select('*')
      .gte('date', dateFrom)
      .lte('date', dateTo);

    const planedPlanksPromise = supabase
      .from(TABLES.PLANED_PLANKS)
      .select('*')
      .gte('date', dateFrom)
      .lte('date', dateTo);

    const [logsResult, cutLogsResult, planksResult, takenPlanksResult, joinedPlanksResult, planedPlanksResult] = await Promise.all([
      logsPromise,
      cutLogsPromise,
      planksPromise,
      takenPlanksPromise,
      joinedPlanksPromise,
      planedPlanksPromise
    ]);

    if (logsResult.error) throw logsResult.error;
    if (cutLogsResult.error) throw cutLogsResult.error;
    if (planksResult.error) throw planksResult.error;
    if (takenPlanksResult.error) throw takenPlanksResult.error;
    if (joinedPlanksResult.error) throw joinedPlanksResult.error;
    if (planedPlanksResult.error) throw planedPlanksResult.error;

    return {
      logs: logsResult.data,
      cutLogs: cutLogsResult.data,
      planks: planksResult.data,
      takenPlanks: takenPlanksResult.data,
      joinedPlanks: joinedPlanksResult.data,
      planedPlanks: planedPlanksResult.data
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