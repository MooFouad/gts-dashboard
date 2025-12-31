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

  // Load data from database on mount
  useEffect(() => {
    console.log('Absher tab loaded. Loading data from database...');
    loadFromDatabase();
  }, []);

  // Dispatch count update when items change
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('itemCountUpdate', {
      detail: { type: 'absher', count: items.length }
    }));
  }, [items]);

  // Load data from database
  const loadFromDatabase = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('No token found, skipping database load');
      return;
    }

    setLoading(true);

    try {
      console.log('📁 Loading from database...');
      const response = await axios.get(
        `${API_URL}/absher`,
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 30000
        }
      );

      if (response.data.success) {
        const dbRecords = response.data.data || [];
        console.log(`✅ Loaded ${dbRecords.length} records from database`);

        // Format for display - keep all API fields
        const displayData = dbRecords.map(record => ({
          ...record,
          // Map API fields to display fields
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
      console.error('❌ Error loading from database:', error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle Excel export
  const handleExport = () => {
    try {
      exportAbsherToExcel(items);
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export data to Excel. Please try again.');
    }
  };

  // Handle sync from API
  const handleSyncFromAPI = async () => {
    setSyncing(true);
    try {
      await fetchFromLiveAPI();
      // Reload from database to get all the new fields
      await loadFromDatabase();
      alert('Successfully synced data from Absher API! All fields are now populated.');
    } catch (error) {
      console.error('Sync error:', error);
      alert('Failed to sync from API. Check console for details.');
    } finally {
      setSyncing(false);
    }
  };

  // Fetch Absher data from LIVE API and save to database
  const fetchFromLiveAPI = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('No token found, skipping Absher API fetch');
      return;
    }

    setLoading(true);

    try {
      console.log('🔍 Fetching all Istemarah records from Absher LIVE API...');

      // Fetch all pages
      let allRecords = [];
      let currentPage = 0;
      let totalPages = 1;
      let totalElements = 0;

      do {
        console.log(`📄 Fetching page ${currentPage + 1}...`);

        const response = await axios.post(
          `${API_URL}/absher/istemarah/search-all`,
          {
            integratorUserId: '7001486054',
            page: currentPage,
            size: 1000  // Fetch up to 1000 records per page to get ALL data
          },
          {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 120000 // 120 seconds timeout for larger dataset
          }
        );

        // Check if API is unreachable
        if (!response.data.success && response.data.error === 'API_UNREACHABLE') {
          console.error('❌ Absher API is unreachable');
          setItems([]);
          return;
        }

        if (response.data.success) {
          const { content, totalElements: total, totalPages: pages, hasMore } = response.data.data;

          console.log('📊 API Response:', {
            contentLength: content?.length,
            totalElements: total,
            totalPages: pages,
            hasMore: hasMore,
            currentPage: currentPage
          });

          allRecords = [...allRecords, ...content];
          totalElements = total;
          totalPages = pages;

          console.log(`✅ Page ${currentPage + 1}/${pages}: Got ${content.length} records (Total so far: ${allRecords.length}/${total})`);

          // Move to next page if there are more
          if (hasMore && currentPage < pages - 1) {
            currentPage++;
            console.log(`🔄 Moving to page ${currentPage + 1}...`);
          } else {
            console.log(`🛑 Stopping: hasMore=${hasMore}, currentPage=${currentPage}, totalPages=${pages}`);
            break;
          }
        } else {
          console.log('❌ API response not successful, breaking loop');
          break;
        }
      } while (currentPage < totalPages);

      console.log(`📊 Fetching complete! Total records: ${allRecords.length}/${totalElements}`);

        // Map all records to preserve all API fields
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
            // Original API fields from Istemarah Renewal API
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

            // Legacy fields for compatibility
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

        // Check for duplicates in API data
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
          console.warn(`⚠️  API returned ${seqDuplicates.length} duplicate sequenceNumbers:`);
          seqDuplicates.forEach(([seq, count]) => {
            const records = formattedData.filter(r => r.sequenceNumber === seq);
            console.warn(`   ${seq}: ${count} copies with plateInfo:`, records.map(r => r.plateInfo).join(', '));
          });
        }

        if (plateDuplicates.length > 0) {
          console.warn(`⚠️  API returned ${plateDuplicates.length} duplicate plateInfo:`);
          plateDuplicates.forEach(([plate, count]) => {
            console.warn(`   ${plate}: ${count} copies`);
          });
        }

        // Remove duplicates from API data (keep first occurrence only)
        const uniqueFormattedData = [];
        const seenSequenceNumbers = new Set();
        const seenPlateInfo = new Set();

        formattedData.forEach(record => {
          const compositeKey = `${record.plateInfo}_${record.sequenceNumber}`;
          if (!seenPlateInfo.has(compositeKey)) {
            uniqueFormattedData.push(record);
            seenPlateInfo.add(compositeKey);
            if (record.sequenceNumber) seenSequenceNumbers.add(record.sequenceNumber);
          } else {
            console.warn(`🔄 Skipping duplicate from API: ${record.plateInfo} (seq: ${record.sequenceNumber})`);
          }
        });

        console.log(`✅ After deduplication: ${uniqueFormattedData.length}/${formattedData.length} unique records`);

        // Save to database
        console.log('💾 Syncing with database...');
        let savedCount = 0;
        let updatedCount = 0;
        let skippedCount = 0;
        let deletedCount = 0;
        let errorCount = 0;

        // Fetch existing records once
        let existingRecords = [];
        try {
          const existingResponse = await axios.get(
            `${API_URL}/absher`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          existingRecords = existingResponse.data.data || [];
          console.log(`📋 Found ${existingRecords.length} existing records in database`);
        } catch (err) {
          console.log('No existing records found or error fetching:', err.message);
        }

        // Check for duplicates in database
        const plateNumberCounts = {};
        existingRecords.forEach(record => {
          plateNumberCounts[record.plateNumber] = (plateNumberCounts[record.plateNumber] || 0) + 1;
        });

        const duplicates = Object.entries(plateNumberCounts).filter(([_, count]) => count > 1);
        if (duplicates.length > 0) {
          console.log(`⚠️  Found ${duplicates.length} duplicate plate numbers in database:`);
          duplicates.forEach(([plate, count]) => {
            console.log(`   ${plate}: ${count} copies`);
          });

          // Remove duplicates, keep only the most recent one
          console.log('🧹 Removing duplicates...');
          for (const [plateNumber, count] of duplicates) {
            const recordsWithSamePlate = existingRecords.filter(r => r.plateNumber === plateNumber);
            // Sort by createdAt or updatedAt, keep the most recent
            recordsWithSamePlate.sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));

            // Delete all except the first (most recent)
            for (let i = 1; i < recordsWithSamePlate.length; i++) {
              try {
                await axios.delete(
                  `${API_URL}/absher/${recordsWithSamePlate[i]._id}`,
                  { headers: { Authorization: `Bearer ${token}` } }
                );
                console.log(`🗑️  Deleted duplicate: ${plateNumber} (ID: ${recordsWithSamePlate[i]._id})`);
                deletedCount++;
              } catch (err) {
                console.error(`❌ Failed to delete duplicate:`, err.message);
              }
            }
          }

          // Re-fetch after cleanup
          const refreshResponse = await axios.get(
            `${API_URL}/absher`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          existingRecords = refreshResponse.data.data || [];
          console.log(`✅ After duplicate cleanup: ${existingRecords.length} records`);
        }

        // Get plate numbers from API data
        const apiPlateNumbers = new Set(uniqueFormattedData.map(r => r.plateNumber));

        // Helper function to check if data has changed
        const hasDataChanged = (existing, newData) => {
          // Compare key fields
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

        // Save/Update each record
        for (const record of uniqueFormattedData) {
          try {
            const existing = existingRecords.find(
              item => item.plateNumber === record.plateNumber
            );

            if (existing) {
              // Check if data has changed
              if (hasDataChanged(existing, record)) {
                // Update existing (data changed)
                await axios.put(
                  `${API_URL}/absher/${existing._id}`,
                  record,
                  { headers: { Authorization: `Bearer ${token}` } }
                );
                console.log(`✅ Updated: ${record.plateNumber} (data changed)`);
                updatedCount++;
              } else {
                // Skip update (data is the same)
                console.log(`⏭️  Skipped: ${record.plateNumber} (no changes)`);
                skippedCount++;
              }
            } else {
              // Create new
              const createResponse = await axios.post(
                `${API_URL}/absher`,
                record,
                { headers: { Authorization: `Bearer ${token}` } }
              );
              console.log(`✅ Created: ${record.plateNumber}`);
              savedCount++;
            }
          } catch (err) {
            console.error(`❌ Failed to save ${record.plateNumber}:`, err.response?.data || err.message);
            errorCount++;
          }
        }

        // Delete records that are no longer in the API (cleanup old data)
        console.log('\n🧹 Cleaning up old records...');
        for (const existing of existingRecords) {
          if (!apiPlateNumbers.has(existing.plateNumber)) {
            try {
              await axios.delete(
                `${API_URL}/absher/${existing._id}`,
                { headers: { Authorization: `Bearer ${token}` } }
              );
              console.log(`🗑️  Deleted: ${existing.plateNumber} (no longer in API)`);
              deletedCount++;
            } catch (err) {
              console.error(`❌ Failed to delete ${existing.plateNumber}:`, err.message);
            }
          }
        }

        console.log(`\n✅ Database sync complete:`);
        console.log(`   Created: ${savedCount}`);
        console.log(`   Updated: ${updatedCount}`);
        console.log(`   Skipped: ${skippedCount} (no changes)`);
        console.log(`   Deleted: ${deletedCount} (no longer in API)`);
        console.log(`   Errors: ${errorCount}`);
        console.log(`   Final count: ${existingRecords.length - deletedCount + savedCount}`);

        // Display formatted data for UI - keep all API fields
        const displayData = uniqueFormattedData.map(record => ({
          ...record,
          // All API fields are already in the record
          status: 'success'
        }));

        setItems(displayData);

        console.log(`📊 Display Complete!`);
        console.log(`✅ Records displayed: ${displayData.length}`);
        console.log(`📦 Total in API: ${totalElements}`);
    } catch (error) {
      console.error('❌ Error fetching Absher data:', error);

      // Handle different error types - log to console, don't show alerts on auto-fetch
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        console.error('⏱️ Request Timeout - The request took too long to complete');
      } else if (error.response?.status === 503) {
        console.error('⚠️ Service Unavailable:', error.response.data.message || 'The Absher API service is currently unavailable');
      } else {
        const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch from Absher API';
        console.error(`❌ Error: ${errorMessage}`);
      }

      // Set empty items on error (this will trigger count dispatch with 0)
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const getEarliestExpiry = (record) => {
    // Use registration expiry date (renewalExpiryDate)
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600">Loading from database...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
        <h2 className="text-xl font-semibold">
          Tamm Vehicles ({items.length})
        </h2>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleSyncFromAPI}
            disabled={syncing}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition"
          >
            <RefreshCw size={18} className={syncing ? 'animate-spin' : ''} />
            {syncing ? 'Syncing...' : 'Sync from API'}
          </button>
          <ExportButton onClick={handleExport} label="Export to Excel" />
        </div>
      </div>

      <Toolbar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filterStatus={filterStatus}
        onFilterChange={setFilterStatus}
        totalItems={items.length}
        statusOptions={[
          { value: 'all', label: 'All Status' },
          { value: 'valid', label: 'Valid' },
          { value: 'warning', label: 'Warning' },
          { value: 'expired', label: 'Expired' }
        ]}
        searchPlaceholder="Search vehicles..."
      />

      {loading && items.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p className="mb-2">Loading from Absher API...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p className="mb-2">No Absher records found.</p>
          <p className="text-sm">Click "Refresh" to fetch data from Absher API.</p>
        </div>
      ) : (
        <>
          <div className="text-sm text-gray-600 mb-2">
            Filtered: {filteredItems.length} of {items.length} vehicles
          </div>
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
