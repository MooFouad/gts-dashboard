import api from './api';

/**
 * GOSI Service
 * Frontend service for GOSI API integration and CRUD operations
 */

/**
 * Get all GOSI records
 * @param {Object} params - Query parameters (page, limit, status, search)
 * @returns {Promise<Object>} - GOSI records with pagination
 */
export const getAll = async (params = {}) => {
  return await api.get('/gosi', params);
};

/**
 * Get single GOSI record by ID
 * @param {string} id - Record ID
 * @returns {Promise<Object>} - GOSI record
 */
export const getById = async (id) => {
  return await api.get(`/gosi/${id}`);
};

/**
 * Get count of GOSI records
 * @returns {Promise<Object>} - Count
 */
export const getCount = async () => {
  return await api.get('/gosi/count/total');
};

/**
 * Create new GOSI record (manual entry)
 * @param {Object} data - GOSI record data
 * @returns {Promise<Object>} - Created record
 */
export const create = async (data) => {
  return await api.post('/gosi', data);
};

/**
 * Update GOSI record
 * @param {string} id - Record ID
 * @param {Object} data - Updated data
 * @returns {Promise<Object>} - Updated record
 */
export const update = async (id, data) => {
  return await api.put(`/gosi/${id}`, data);
};

/**
 * Delete GOSI record
 * @param {string} id - Record ID
 * @returns {Promise<Object>} - Deletion confirmation
 */
export const remove = async (id) => {
  return await api.delete(`/gosi/${id}`);
};

/**
 * Bulk delete GOSI records
 * @param {Array<string>} ids - Array of record IDs
 * @returns {Promise<Object>} - Deletion result
 */
export const bulkDelete = async (ids) => {
  return await api.post('/gosi/bulk-delete', { ids });
};

/**
 * Sync single employee data from GOSI API
 * @param {string} nin - National ID or Iqama number
 * @returns {Promise<Object>} - Synced employee data
 */
export const syncEmployee = async (nin) => {
  return await api.post(`/gosi/sync/${nin}`);
};

/**
 * Sync multiple employees from GOSI API
 * @param {Array<string>} ninList - Array of NIN/Iqama numbers
 * @returns {Promise<Object>} - Sync results
 */
export const syncMultipleEmployees = async (ninList) => {
  return await api.post('/gosi/sync-multiple', { ninList });
};

/**
 * Test GOSI API connection
 * @returns {Promise<Object>} - Test result
 */
export const testConnection = async () => {
  return await api.get('/gosi/test-connection/check');
};

/**
 * Get establishment information
 * @returns {Promise<Object>} - Establishment data
 */
export const getEstablishmentInfo = async () => {
  return await api.get('/gosi/establishment/info');
};

/**
 * Import employees from Excel file and bulk sync from GOSI API
 * @param {File} file - Excel file with employee Iqama numbers
 * @returns {Promise<Object>} - Import results
 */
export const importEmployees = async (file) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${import.meta.env.VITE_API_URL}/import/gosi`, {
    method: 'POST',
    body: formData,
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Import failed');
  }

  return await response.json();
};

export default {
  getAll,
  getById,
  getCount,
  create,
  update,
  remove,
  bulkDelete,
  syncEmployee,
  syncMultipleEmployees,
  testConnection,
  getEstablishmentInfo,
  importEmployees
};
