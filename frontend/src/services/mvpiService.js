import api from './api';

const mvpiService = {
  // Get all MVPI records
  getAll: async (params = {}) => {
    return await api.get('/mvpi', params);
  },

  // Get single MVPI record by ID
  getById: async (id) => {
    return await api.get(`/mvpi/${id}`);
  },

  // Create new MVPI record
  create: async (mvpiData) => {
    return await api.post('/mvpi', mvpiData);
  },

  // Update MVPI record
  update: async (id, mvpiData) => {
    return await api.put(`/mvpi/${id}`, mvpiData);
  },

  // Delete MVPI record
  delete: async (id) => {
    return await api.delete(`/mvpi/${id}`);
  },

  // Delete multiple MVPI records
  deleteMultiple: async (ids) => {
    return await api.post('/mvpi/delete-multiple', { ids });
  },

  // Get count
  getCount: async () => {
    return await api.get('/mvpi/count/total');
  },

  // Search MVPI records
  search: async (searchTerm, status = 'all') => {
    return await api.get('/mvpi', { search: searchTerm, status });
  },

  // Sync MVPI details from Absher API (single vehicle)
  syncFromAPI: async (plateNumber, sequenceNumber = null) => {
    return await api.post('/mvpi/sync-from-api', {
      plateNumber,
      sequenceNumber
    });
  },

  // Bulk sync ALL MVPI data from Absher API
  bulkSyncFromAPI: async () => {
    return await api.post('/mvpi/bulk-sync-from-api');
  }
};

export default mvpiService;
