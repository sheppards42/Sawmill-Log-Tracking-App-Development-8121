// Local storage utilities for sawmill data
export const STORAGE_KEYS = {
  LOGS: 'sawmill_logs',
  CUT_LOGS: 'sawmill_cut_logs',
  LOG_SHEETS: 'sawmill_log_sheets'
};

export const saveToStorage = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving to storage:', error);
  }
};

export const loadFromStorage = (key) => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading from storage:', error);
    return [];
  }
};

export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};