import React, { useState, useEffect } from 'react';
import { isExpired } from '../utils/dateUtils';
import { updateMockData, loadSavedData } from '../utils/storageUtils';

export const useDataManagement = (initialData, type = 'vehicle') => {
      const [data, setData] = useState(() => loadSavedData(type, initialData));

      const updateItemStatus = React.useCallback((item) => {
            if (type === 'vehicle') {
                  const isLicenseExpired = isExpired(item.licenseExpiryDate);
                  const isInspectionExpired = isExpired(item.inspectionExpiryDate);
                  if (isLicenseExpired || isInspectionExpired) {
                        return { ...item, vehicleStatus: 'Inactive' };
                  }
            } else if (type === 'homeRent') {
                  const isContractExpired = isExpired(item.contractEndingDate);
                  if (isContractExpired) {
                        return { ...item, contractStatus: 'Inactive' };
                  }
            }
            return item;
      }, [type]);

      useEffect(() => {
            // Update status of all items on component mount and date change
            const checkAndUpdateStatus = () => {
                  const updatedData = data.map(updateItemStatus);
                  if (JSON.stringify(updatedData) !== JSON.stringify(data)) {
                        setData(updatedData);
                  }
            };
            
            checkAndUpdateStatus();
            // Check status every hour
            const interval = setInterval(checkAndUpdateStatus, 3600000);
            
            return () => clearInterval(interval);
      }, [data, updateItemStatus]);

      const dispatchCountUpdate = (newData) => {
            // Create and dispatch a custom event with the new count
            const event = new CustomEvent('itemCountUpdate', {
                  detail: {
                        type,
                        count: newData.length
                  }
            });
            window.dispatchEvent(event);
      };

      const addItem = (newItem) => {
            const id = data.length > 0 ? Math.max(...data.map(item => item.id)) + 1 : 1;
            const itemWithStatus = updateItemStatus({ ...newItem, id });
            const newData = [...data, itemWithStatus];
            setData(newData);
            updateMockData(type, newData);
            dispatchCountUpdate(newData);
      };

      const updateItem = (id, updatedItem) => {
            const existingItem = data.find(item => item.id === id);
            
            // Handle attachments properly
            let attachments = updatedItem.attachments || [];
            if (existingItem?.attachments && (!updatedItem.attachments || updatedItem.attachments.length === 0)) {
                  // Keep existing attachments if no new ones provided
                  attachments = existingItem.attachments;
            }
            
            const itemWithAttachments = { ...updatedItem, attachments };
            const itemWithStatus = updateItemStatus({ ...itemWithAttachments, id });
            const newData = data.map(item => item.id === id ? itemWithStatus : item);
            setData(newData);
            updateMockData(type, newData);
            dispatchCountUpdate(newData);
      };

      const deleteItem = (id) => {
            const newData = data.filter(item => item.id !== id);
            setData(newData);
            updateMockData(type, newData);
            dispatchCountUpdate(newData);
      };

      return { data, addItem, updateItem, deleteItem };
};