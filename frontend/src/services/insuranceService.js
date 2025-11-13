import api from './api';

const insuranceService = {
  // Get all insurance records
  getAll: async (params = {}) => {
    return await api.get('/insurance', params);
  },

  // Get single insurance record by ID
  getById: async (id) => {
    return await api.get(`/insurance/${id}`);
  },

  // Create new insurance record
  create: async (insuranceData) => {
    return await api.post('/insurance', insuranceData);
  },

  // Update insurance record
  update: async (id, insuranceData) => {
    return await api.put(`/insurance/${id}`, insuranceData);
  },

  // Delete insurance record
  delete: async (id) => {
    return await api.delete(`/insurance/${id}`);
  },

  // Delete multiple insurance records
  deleteMultiple: async (ids) => {
    return await api.post('/insurance/delete-multiple', { ids });
  },

  // Get count
  getCount: async () => {
    return await api.get('/insurance/count/total');
  },

  // Search insurance records
  search: async (searchTerm, status = 'all') => {
    return await api.get('/insurance', { search: searchTerm, status });
  },

  // Sync insurance details from Absher API (single vehicle)
  syncFromAPI: async (plateNumber, sequenceNumber = null) => {
    return await api.post('/insurance/sync-from-api', {
      plateNumber,
      sequenceNumber
    });
  },

  // Bulk sync ALL insurance data from Absher API
  bulkSyncFromAPI: async () => {
    return await api.post('/insurance/bulk-sync-from-api');
  }
};

export default insuranceService;
