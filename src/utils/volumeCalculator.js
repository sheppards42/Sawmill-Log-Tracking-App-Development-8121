import { getLogVolume, VOLUME_LOOKUP, AVAILABLE_LENGTHS, AVAILABLE_DIAMETERS } from '../data/volumeLookup';

/**
 * Get volume for a single log using predefined lookup table
 * @param {number} length - Log length in meters
 * @param {number} diameter - Log diameter in centimeters
 * @returns {number} Volume in cubic meters from lookup table
 */
export const calculateSingleLogVolume = (length, diameter) => {
  return getLogVolume(length, diameter);
};

/**
 * Calculate total volume for multiple logs with same dimensions using lookup table
 * @param {number} length - Log length in meters
 * @param {number} diameter - Log diameter in centimeters
 * @param {number} quantity - Number of logs
 * @returns {number} Total volume in cubic meters
 */
export const calculateBatchVolume = (length, diameter, quantity = 1) => {
  const singleVolume = getLogVolume(length, diameter);
  return singleVolume * quantity;
};

/**
 * Calculate total volume for multiple logs with different dimensions using lookup table
 * @param {Array<{length: number, diameter: number, quantity: number}>} logs - Array of log objects
 * @returns {number} Total volume in cubic meters
 */
export const calculateMultipleLogsVolume = (logs) => {
  return logs.reduce((total, log) => {
    const volume = getLogVolume(log.length, log.diameter);
    return total + (volume * (log.quantity || 1));
  }, 0);
};

/**
 * Get the closest valid length and diameter values from predefined options
 * @param {number} length - Log length in meters
 * @param {number} diameter - Log diameter in centimeters
 * @returns {{length: number, diameter: number}} The closest valid values
 */
export const getClosestDimensions = (length, diameter) => {
  // Find closest length from available options
  const closestLength = AVAILABLE_LENGTHS.reduce((prev, curr) => {
    return Math.abs(curr - length) < Math.abs(prev - length) ? curr : prev;
  });
  
  // Find closest diameter from available options
  const closestDiameter = AVAILABLE_DIAMETERS.reduce((prev, curr) => {
    return Math.abs(curr - diameter) < Math.abs(prev - diameter) ? curr : prev;
  });
  
  return { length: closestLength, diameter: closestDiameter };
};

/**
 * Get volume category based on predefined volume value
 * @param {number} volume - Volume in cubic meters
 * @returns {string} Category (Small, Medium, Large)
 */
export const getVolumeCategory = (volume) => {
  if (volume > 1.0) return 'Large';
  if (volume > 0.5) return 'Medium';
  return 'Small';
};

/**
 * Find all logs with volume in a specific range from lookup table
 * @param {number} minVolume - Minimum volume
 * @param {number} maxVolume - Maximum volume
 * @returns {Array<{length: number, diameter: number, volume: number}>} Matching logs
 */
export const findLogsByVolumeRange = (minVolume, maxVolume) => {
  const results = [];
  
  AVAILABLE_LENGTHS.forEach(length => {
    AVAILABLE_DIAMETERS.forEach(diameter => {
      const volume = VOLUME_LOOKUP[length]?.[diameter];
      if (volume !== undefined && volume >= minVolume && volume <= maxVolume) {
        results.push({ length, diameter, volume });
      }
    });
  });
  
  return results;
};

/**
 * Get optimal log dimensions for a target volume from predefined lookup table
 * @param {number} targetVolume - Desired volume in cubic meters
 * @returns {Array<{length: number, diameter: number, volume: number, difference: number}>} 
 * Top 5 closest matches sorted by volume difference
 */
export const findOptimalLogDimensions = (targetVolume) => {
  const results = [];
  
  AVAILABLE_LENGTHS.forEach(length => {
    AVAILABLE_DIAMETERS.forEach(diameter => {
      const volume = VOLUME_LOOKUP[length]?.[diameter];
      if (volume !== undefined) {
        results.push({
          length,
          diameter,
          volume,
          difference: Math.abs(volume - targetVolume)
        });
      }
    });
  });
  
  // Sort by closest to target volume and return top 5
  return results
    .sort((a, b) => a.difference - b.difference)
    .slice(0, 5);
};

/**
 * Check if given dimensions are valid according to lookup table
 * @param {number} length - Log length in meters
 * @param {number} diameter - Log diameter in centimeters
 * @returns {boolean} Whether the dimensions are valid
 */
export const isValidDimensions = (length, diameter) => {
  return VOLUME_LOOKUP[length]?.[diameter] !== undefined;
};

/**
 * Get all available dimension combinations with their volumes
 * @returns {Array<{length: number, diameter: number, volume: number}>} All valid combinations
 */
export const getAllValidCombinations = () => {
  const combinations = [];
  
  AVAILABLE_LENGTHS.forEach(length => {
    AVAILABLE_DIAMETERS.forEach(diameter => {
      const volume = VOLUME_LOOKUP[length]?.[diameter];
      if (volume !== undefined) {
        combinations.push({ length, diameter, volume });
      }
    });
  });
  
  return combinations;
};

/**
 * Find exact volume match from lookup table
 * @param {number} targetVolume - Target volume to find
 * @returns {Array<{length: number, diameter: number, volume: number}>} Exact matches
 */
export const findExactVolumeMatches = (targetVolume) => {
  const results = [];
  
  AVAILABLE_LENGTHS.forEach(length => {
    AVAILABLE_DIAMETERS.forEach(diameter => {
      const volume = VOLUME_LOOKUP[length]?.[diameter];
      if (volume !== undefined && Math.abs(volume - targetVolume) < 0.001) {
        results.push({ length, diameter, volume });
      }
    });
  });
  
  return results;
};