import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import AbsherTable from './AbsherTable';
import Toolbar from '../layout/Toolbar';
import ExportButton from '../common/ExportButton';
import Pagination from '../common/Pagination';
import { useAuth } from '../../contexts/AuthContext';
import { exportAbsherToExcel } from '../../utils/excel/excelUtils';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const AbsherContainer = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    loadFromDatabase();
  }, []);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('itemCountUpdate', {
      detail: { type: 'absher', count: items.length }
    }));
  }, [items]);

  const loadFromDatabase = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    setLoading(true);

    try {
      const response = await axios.get(
        `${API_URL}/absher`,
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 30000
        }
      );

      if (response.data.success) {
        const dbRecords = response.data.data || [];
        const displayData = dbRecords.map(record => ({
          ...record,
          sequenceNumber: record.sequenceNumber || '-',
          plateInfo: record.plateInfo || record.plateNumber || '-',
          plateType: record.plateType || { nameEn: '-' },
          plateTypeCode: record.plateTypeCode || '-',
          ownerName: record.ownerName || record.name || '-',
          ownerIdNumber: record.ownerIdNumber || '-',
          maker: record.maker || record.notes?.match(/Maker: ([^,]+)/)?.[1] || '-',
          model: record.model || record.notes?.match(/Model: ([^,]+)/)?.[1] || '-',
          modelYear: record.modelYear || record.notes?.match(/Year: ([^)]+)/)?.[1] || '-',
          majorColor: record.majorColor || '-',
          createdDate: record.createdDate || record.issueDate || '-',
          renewalExpiryDate: record.renewalExpiryDate || record.expiryDate || '-',
          actualDriverIdNumber: record.actualDriverIdNumber || '-',
          actualDriverName: record.actualDriverName || '-',
          operatorIdNumber: record.operatorIdNumber || '-',
          branchName: record.branchName || { en: '-', ar: '-' },
          status: 'success'
        }));

        setItems(displayData);
      }
    } catch (error) {
      console.error('Error loading from database:', error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    try {
      exportAbsherToExcel(items);
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export data to Excel. Please try again.');
    }
  };

  const handleSyncFromAPI = async () => {
    setSyncing(true);
    try {
      await fetchFromLiveAPI();
      await loadFromDatabase();
      alert('Successfully synced data from Absher API! All fields are now populated.');
    } catch (error) {
      console.error('Sync error:', error);
      alert('Failed to sync from API. Check console for details.');
    } finally {
      setSyncing(false);
    }
  };

  const fetchFromLiveAPI = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    setLoading(true);

    try {
      let allRecords = [];
      let currentPage = 0;
      let totalPages = 1;
      let totalElements = 0;

      do {
        const response = await axios.post(
          `${API_URL}/absher/istemarah/search-all`,
          {
            integratorUserId: '7001486054',
            page: currentPage,
            size: 1000
          },
          {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 120000
          }
        );

        if (!response.data.success && response.data.error === 'API_UNREACHABLE') {
          setItems([]);
          return;
        }

        if (response.data.success) {
          const { content, totalElements: total, totalPages: pages, hasMore } = response.data.data;
          allRecords = [...allRecords, ...content];
          totalElements = total;
          totalPages = pages;

          if (hasMore && currentPage < pages - 1) {
            currentPage++;
          } else {
            break;
          }
        } else {
          break;
        }
      } while (currentPage < totalPages);

        const formattedData = allRecords.map(record => {
          const formatApiDate = (dateString) => {
            if (!dateString) return null;
            try {
              const date = new Date(dateString);
              if (isNaN(date.getTime())) return null;
              return date.toISOString().split('T')[0];
            } catch (e) {
              return null;
            }
          };

          return {
            sequenceNumber: record.sequenceNumber || null,
            plateInfo: record.plateInfo || null,
            plateType: record.plateType || null,
            plateTypeCode: record.plateTypeCode || null,
            maker: record.maker || null,
            model: record.model || null,
            modelYear: record.modelYear || null,
            majorColor: record.majorColor || null,
            createdDate: formatApiDate(record.createdDate),
            renewalExpiryDate: formatApiDate(record.renewalExpiryDate),
            actualDriverIdNumber: record.actualDriverIdNumber || null,
            actualDriverName: record.actualDriverName || null,
            ownerIdNumber: record.ownerIdNumber || null,
            ownerName: record.ownerName || null,
            traceId: record.traceId || null,
            operatorIdNumber: record.operatorIdNumber || null,
            branchName: record.branchName || null,
            plateNumber: record.plateInfo || record.plateNumber || 'N/A',
            name: record.ownerName || record.vehicleOwnerName || 'الشركة الألمانية للخدمات التقنية',
            referenceNumber: record.referenceNumber || record.sequenceNumber || record.plateInfo || 'REF-' + Date.now(),
            issueDate: formatApiDate(record.createdDate),
            expiryDate: formatApiDate(record.renewalExpiryDate),
            inspectionExpiryDate: null,
            licenseExpiryDate: null,
            ownerId: record.ownerIdNumber || '',
            notes: `Maker: ${record.maker || 'N/A'}, Model: ${record.model || 'N/A'}, Year: ${record.modelYear || 'N/A'}, Color: ${record.majorColor || 'N/A'}`,
            dataSource: 'absher',
            lastSyncDate: new Date()
          };
        });

        const sequenceNumberCounts = {};
        const plateInfoCounts = {};
        formattedData.forEach(record => {
          if (record.sequenceNumber) {
            sequenceNumberCounts[record.sequenceNumber] = (sequenceNumberCounts[record.sequenceNumber] || 0) + 1;
          }
          if (record.plateInfo) {
            plateInfoCounts[record.plateInfo] = (plateInfoCounts[record.plateInfo] || 0) + 1;
          }
        });

        const seqDuplicates = Object.entries(sequenceNumberCounts).filter(([_, count]) => count > 1);
        const plateDuplicates = Object.entries(plateInfoCounts).filter(([_, count]) => count > 1);

        if (seqDuplicates.length > 0) {
          console.warn(`API returned ${seqDuplicates.length} duplicate sequenceNumbers`);
        }

        if (plateDuplicates.length > 0) {
          console.warn(`API returned ${plateDuplicates.length} duplicate plateInfo`);
        }

        const uniqueFormattedData = [];
        const seenPlateInfo = new Set();
        const seenSequenceNumbers = new Set();

        formattedData.forEach(record => {
          const compositeKey = `${record.plateInfo}_${record.sequenceNumber}`;
          if (!seenPlateInfo.has(compositeKey)) {
            uniqueFormattedData.push(record);
            seenPlateInfo.add(compositeKey);
            if (record.sequenceNumber) seenSequenceNumbers.add(record.sequenceNumber);
          }
        });

        let savedCount = 0;
        let updatedCount = 0;
        let skippedCount = 0;
        let deletedCount = 0;
        let errorCount = 0;

        let existingRecords = [];
        try {
          const existingResponse = await axios.get(
            `${API_URL}/absher`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          existingRecords = existingResponse.data.data || [];
        } catch (err) {
          console.log('No existing records found:', err.message);
        }

        const plateNumberCounts = {};
        existingRecords.forEach(record => {
          plateNumberCounts[record.plateNumber] = (plateNumberCounts[record.plateNumber] || 0) + 1;
        });

        const duplicates = Object.entries(plateNumberCounts).filter(([_, count]) => count > 1);
        if (duplicates.length > 0) {
          for (const [plateNumber, count] of duplicates) {
            const recordsWithSamePlate = existingRecords.filter(r => r.plateNumber === plateNumber);
            recordsWithSamePlate.sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));

            for (let i = 1; i < recordsWithSamePlate.length; i++) {
              try {
                await axios.delete(
                  `${API_URL}/absher/${recordsWithSamePlate[i]._id}`,
                  { headers: { Authorization: `Bearer ${token}` } }
                );
                deletedCount++;
              } catch (err) {
                console.error('Failed to delete duplicate:', err.message);
              }
            }
          }

          const refreshResponse = await axios.get(
            `${API_URL}/absher`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          existingRecords = refreshResponse.data.data || [];
        }

        const apiPlateNumbers = new Set(uniqueFormattedData.map(r => r.plateNumber));

        const hasDataChanged = (existing, newData) => {
          const formatDate = (date) => {
            if (!date) return null;
            return new Date(date).toISOString().split('T')[0];
          };

          return (
            existing.name !== newData.name ||
            existing.referenceNumber !== newData.referenceNumber ||
            formatDate(existing.expiryDate) !== formatDate(newData.expiryDate) ||
            formatDate(existing.issueDate) !== formatDate(newData.issueDate) ||
            existing.ownerName !== newData.ownerName ||
            existing.ownerId !== newData.ownerId ||
            existing.notes !== newData.notes
          );
        };

        for (const record of uniqueFormattedData) {
          try {
            const existing = existingRecords.find(
              item => item.plateNumber === record.plateNumber
            );

            if (existing) {
              if (hasDataChanged(existing, record)) {
                await axios.put(
                  `${API_URL}/absher/${existing._id}`,
                  record,
                  { headers: { Authorization: `Bearer ${token}` } }
                );
                updatedCount++;
              } else {
                skippedCount++;
              }
            } else {
              await axios.post(
                `${API_URL}/absher`,
                record,
                { headers: { Authorization: `Bearer ${token}` } }
              );
              savedCount++;
            }
          } catch (err) {
            console.error(`Failed to save ${record.plateNumber}:`, err.response?.data || err.message);
            errorCount++;
          }
        }

        for (const existing of existingRecords) {
          if (!apiPlateNumbers.has(existing.plateNumber)) {
            try {
              await axios.delete(
                `${API_URL}/absher/${existing._id}`,
                { headers: { Authorization: `Bearer ${token}` } }
              );
              deletedCount++;
            } catch (err) {
              console.error(`Failed to delete ${existing.plateNumber}:`, err.message);
            }
          }
        }

        console.log(`Database sync: Created ${savedCount}, Updated ${updatedCount}, Skipped ${skippedCount}, Deleted ${deletedCount}, Errors ${errorCount}`);

        const displayData = uniqueFormattedData.map(record => ({
          ...record,
          status: 'success'
        }));

        setItems(displayData);
    } catch (error) {
      console.error('Error fetching Absher data:', error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const getEarliestExpiry = (record) => {
    const expiryDate = record.renewalExpiryDate || record.expiryDate;
    if (!expiryDate || expiryDate === 'N/A') return null;
    return new Date(expiryDate);
  };

  const filteredItems = items.filter((item) => {
    const matchSearch = Object.values(item).some((val) =>
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    );

    let matchStatus = true;
    if (filterStatus !== 'all') {
      const earliestExpiry = getEarliestExpiry(item);
      if (!earliestExpiry) {
        matchStatus = filterStatus === 'valid';
      } else {
        const isExpired = earliestExpiry < new Date();
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
        const needsRenewal = earliestExpiry <= thirtyDaysFromNow && !isExpired;

        if (filterStatus === 'expired') {
          matchStatus = isExpired;
        } else if (filterStatus === 'warning') {
          matchStatus = needsRenewal;
        } else if (filterStatus === 'valid') {
          matchStatus = !isExpired && !needsRenewal;
        }
      }
    }

    return matchSearch && matchStatus;
  });

  if (loading && items.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-navy-200 border-t-navy-600"></div>
        <span className="ml-3 text-slate-500 text-sm">Loading vehicles...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">
            Tamm Vehicles
            <span className="ml-2 badge-neutral">{items.length}</span>
          </h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleSyncFromAPI}
            disabled={syncing}
            className="btn-primary !text-sm"
          >
            <RefreshCw size={16} className={syncing ? 'animate-spin' : ''} />
            {syncing ? 'Syncing...' : 'Sync from API'}
          </button>
          <ExportButton onClick={handleExport} label="Export" />
        </div>
      </div>

      {/* Toolbar */}
      <Toolbar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filterStatus={filterStatus}
        onFilterChange={setFilterStatus}
        totalItems={filteredItems.length}
        statusOptions={[
          { value: 'all', label: 'All Status' },
          { value: 'valid', label: 'Valid' },
          { value: 'warning', label: 'Warning' },
          { value: 'expired', label: 'Expired' }
        ]}
        searchPlaceholder="Search vehicles..."
      />

      {items.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-slate-400 text-sm">No Absher records found</div>
          <div className="text-slate-400 text-xs mt-1">Click "Sync from API" to fetch vehicle data</div>
        </div>
      ) : (
        <>
          {filteredItems.length !== items.length && (
            <div className="text-xs text-slate-500">
              Showing {filteredItems.length} of {items.length} vehicles
            </div>
          )}
          <AbsherTable
            data={filteredItems}
            onEdit={() => {}}
            onDelete={() => {}}
          />
        </>
      )}
    </div>
  );
};

export default AbsherContainer;
