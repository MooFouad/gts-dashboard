import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

export const useDataManagement = (type, options = {}) => {
  const { usePagination = true, defaultPageSize = 25, searchTerm = '', filterStatus = 'all' } = options;

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const getEndpoint = (type) => {
    switch(type) {
      case 'homeRent':
        return '/home-rents'; // Match backend route
      case 'vehicle':
        return '/vehicles';
      case 'electricity':
        return '/electricity';
      case 'absher':
        return '/absher';
      case 'socialInsurance':
        return '/social-insurance'; // Match backend route
      case 'gosi':
        return '/gosi'; // GOSI endpoint
      default:
        return `/${type}s`;
    }
  };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const endpoint = getEndpoint(type);

      // Build query params for pagination and search
      const params = usePagination
        ? { page: currentPage, limit: pageSize }
        : { limit: 100000 }; // Fetch all items when pagination is disabled

      // Add search term if provided
      if (searchTerm && searchTerm.trim()) {
        params.search = searchTerm.trim();
      }

      // Add status filter if provided and not 'all'
      if (filterStatus && filterStatus !== 'all') {
        params.status = filterStatus;
      }

      const response = await api.get(endpoint, params);

      // Handle paginated response format: { success: true, data: [...], pagination: {...} }
      if (response?.pagination) {
        setData(Array.isArray(response.data) ? response.data : []);
        setTotalItems(response.pagination.total);
        setTotalPages(response.pagination.pages);
      } else {
        // Handle non-paginated response format: { success: true, data: [...] }
        const items = response?.data || response;
        setData(Array.isArray(items) ? items : []);
        setTotalItems(Array.isArray(items) ? items.length : 0);
        setTotalPages(1);
      }
    } catch (err) {
      console.error(`Error fetching ${type}:`, err);
      setError(err.message);
      setData([]);
      setTotalItems(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  }, [type, currentPage, pageSize, usePagination, searchTerm, filterStatus]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const validateData = useCallback((items) => {
    if (!Array.isArray(items)) {
      console.error('Invalid data format:', items);
      return [];
    }

    return items.map(item => {
      // Ensure all required fields exist
      const validatedItem = {
        _id: item._id || '',
        name: item.name || '',
        location: item.location || '',
        contractNumber: item.contractNumber || '',
        contractStartingDate: item.contractStartingDate || '',
        contractEndingDate: item.contractEndingDate || '',
        contractStatus: item.contractStatus || 'Active',
        rentAnnually: Number(item.rentAnnually) || 0,
        contactNo: item.contactNo || '',
        gts: item.gts || '',
        attachments: Array.isArray(item.attachments) ? item.attachments : []
      };

      // Ensure dates are in correct format
      try {
        if (validatedItem.contractStartingDate) {
          new Date(validatedItem.contractStartingDate).toISOString();
        }
        if (validatedItem.contractEndingDate) {
          new Date(validatedItem.contractEndingDate).toISOString();
        }
      } catch (error) {
        console.error('Invalid date format:', error);
      }

      return validatedItem;
    });
  }, []);

  const addItem = useCallback(async (data) => {
    try {
      const endpoint = getEndpoint(type);
      const response = await api.post(endpoint, data);
      // Handle new response format: { success: true, data: {...} }
      const item = response?.data || response;
      setData(prev => [...prev, item]);
      return item;
    } catch (err) {
      throw new Error(`Failed to add ${type}: ${err.message}`);
    }
  }, [type]);

  const updateItem = useCallback(async (id, updatedItem) => {
    try {
      const endpoint = getEndpoint(type);
      const response = await api.put(`${endpoint}/${id}`, updatedItem);
      // Handle new response format: { success: true, data: {...} }
      const updatedData = response?.data || response;
      setData(prev => prev.map(item => item._id === id ? updatedData : item));
      return updatedData;
    } catch (err) {
      throw new Error(`Failed to update ${type}: ${err.message}`);
    }
  }, [type]);

  const deleteItem = useCallback(async (id) => {
    try {
      const endpoint = getEndpoint(type);
      await api.delete(`${endpoint}/${id}`);
      setData(prev => prev.filter(item => item._id !== id));
    } catch (err) {
      console.error('Delete error:', err);
      throw new Error(`Failed to delete ${type}: ${err.message}`);
    }
  }, [type]);

  // Update or insert a single item in local state without a full refresh
  const upsertLocalItem = useCallback((item) => {
    setData(prev => {
      const idx = prev.findIndex(i => i._id === item._id);
      if (idx !== -1) {
        const next = [...prev];
        next[idx] = item;
        return next;
      }
      setTotalItems(t => t + 1);
      return [item, ...prev];
    });
  }, []);

  // Pagination handlers
  const handlePageChange = useCallback((newPage) => {
    setCurrentPage(newPage);
  }, []);

  const handlePageSizeChange = useCallback((newPageSize) => {
    setPageSize(newPageSize);
    setCurrentPage(1); // Reset to first page when page size changes
  }, []);

  // Reset to page 1 when search term or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus]);

  return {
    data,
    loading,
    error,
    addItem,
    updateItem,
    deleteItem,
    upsertLocalItem,
    refreshData: fetchData,
    // Pagination
    pagination: usePagination ? {
      currentPage,
      pageSize,
      totalItems,
      totalPages,
      onPageChange: handlePageChange,
      onPageSizeChange: handlePageSizeChange
    } : null
  };
};