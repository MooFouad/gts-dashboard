import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

export const useDataManagement = (type) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
      const response = await api.get(endpoint);
      // Handle new response format: { success: true, data: [...] }
      const items = response?.data || response;
      setData(Array.isArray(items) ? items : []);
    } catch (err) {
      console.error(`Error fetching ${type}:`, err);
      setError(err.message);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [type]);

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

  return {
    data,
    loading,
    error,
    addItem,
    updateItem,
    deleteItem,
    refreshData: fetchData
  };
};