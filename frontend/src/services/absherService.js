import api from './api';

const absherService = {
  // Get all absher records
  getAll: async (params = {}) => {
    return await api.get('/absher', params);
  },

  // Get single absher record by ID
  getById: async (id) => {
    return await api.get(`/absher/${id}`);
  },

  // Create new absher record
  create: async (absherData) => {
    return await api.post('/absher', absherData);
  },

  // Update absher record
  update: async (id, absherData) => {
    return await api.put(`/absher/${id}`, absherData);
  },

  // Delete absher record
  delete: async (id) => {
    return await api.delete(`/absher/${id}`);
  },

  // Get count
  getCount: async () => {
    return await api.get('/absher/count/total');
  },

  // Search absher records
  search: async (searchTerm, status = 'all') => {
    return await api.get('/absher', { search: searchTerm, status });
  },

  // Sync vehicle insurance details from Absher API
  syncFromAbsher: async (plateNumber, sequenceNumber = null, referenceNumber = null, name = null) => {
    return await api.post('/absher/sync', {
      plateNumber,
      sequenceNumber,
      referenceNumber,
      name
    });
  },

  // Bulk sync ALL vehicles from Absher API (fetches real government data)
  bulkSyncFromAPI: async () => {
    return await api.post('/absher/bulk-sync-from-api');
  },

  // Sync all vehicles from Vehicles collection to Absher (local database only)
  syncAllFromVehicles: async () => {
    return await api.post('/absher/sync-all-from-vehicles');
  },

  // Get vehicle insurance details from Absher API
  getInsuranceDetails: async (plateNumber, sequenceNumber = null) => {
    return await api.post('/absher/insurance-inquiry', {
      plateNumber,
      sequenceNumber
    });
  },

  // Get vehicle MVPI (inspection) details from Absher API
  getMVPIDetails: async (plateNumber, sequenceNumber = null) => {
    return await api.post('/absher/mvpi-inquiry', {
      plateNumber,
      sequenceNumber
    });
  },

  // ===== ISTEMARAH RENEWAL WORKFLOW =====

  // Step 1: Verify vehicle for Istemarah renewal
  verifyIstemarahRenewal: async (plateNumber) => {
    return await api.post('/absher/istemarah/verify', {
      plateNumber
    });
  },

  // Step 2: Submit Istemarah renewal
  submitIstemarahRenewal: async (conversationId, ownerMobileNumber, integratorUserId = null) => {
    return await api.post('/absher/istemarah/submit', {
      conversationId,
      ownerMobileNumber,
      integratorUserId
    });
  },

  // Step 3: Search renewed Istemarah records
  searchRenewedIstemarah: async (plateInfo, integratorUserId, page = 0, size = 10) => {
    return await api.post('/absher/istemarah/search', {
      plateInfo,
      integratorUserId,
      page,
      size
    });
  },

  // Complete Istemarah renewal workflow (all 3 steps in one call)
  completeIstemarahRenewal: async (plateNumber, ownerMobileNumber, integratorUserId = null) => {
    return await api.post('/absher/istemarah/renew-complete', {
      plateNumber,
      ownerMobileNumber,
      integratorUserId
    });
  }
};

export default absherService;
