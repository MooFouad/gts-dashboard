import React, { useState } from 'react';
import { Trash2, ChevronDown, ChevronUp, Building2, User, Calendar, Shield } from 'lucide-react';
import ScrollableTableWrapper from '../common/ScrollableTableWrapper';

const GOSITable = ({ data, onDelete }) => {
  const [expandedRows, setExpandedRows] = useState(new Set());

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Calculate actual status based on current date
  const getActualStatus = (item) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (item.engagementEndDate) {
      const endDate = new Date(item.engagementEndDate);
      endDate.setHours(0, 0, 0, 0);

      if (endDate < today) {
        return 'terminated';
      }
    }

    if (item.engagementStartDate) {
      const startDate = new Date(item.engagementStartDate);
      startDate.setHours(0, 0, 0, 0);

      if (startDate <= today) {
        return 'active';
      }
    }

    return 'inactive';
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'inactive':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'terminated':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const toggleRow = (id) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  if (data.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg border">
        <p className="text-gray-500 mb-2">No GOSI records found</p>
        <p className="text-sm text-gray-400">Import an Excel file with employee Iqama numbers to fetch data from GOSI</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {data.map((item) => {
        const isExpanded = expandedRows.has(item._id);
        const apiData = item.fullApiResponse || {};

        return (
          <div
            key={item._id}
            className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
          >
            {/* Main Row - Collapsed View */}
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Employee Info */}
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <User size={20} className="text-blue-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{item.name || item.nin}</div>
                      {item.nameAr && (
                        <div className="text-sm text-gray-600" dir="rtl">{item.nameAr}</div>
                      )}
                      <div className="text-xs text-gray-500">NIN: {item.nin}</div>
                      {item.contributorType && (
                        <div className="text-xs text-blue-600 mt-1">
                          <Shield size={12} className="inline mr-1" />
                          {item.contributorType}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Engagement Info */}
                  <div className="flex items-start gap-2">
                    <Calendar size={16} className="text-gray-400 mt-1 flex-shrink-0" />
                    <div>
                      <div className="text-xs text-gray-500">Engagement Start</div>
                      <div className="font-medium text-gray-900">{formatDate(item.engagementStartDate)}</div>
                      <div className="text-xs text-gray-500 mt-1">End Date</div>
                      <div className="font-medium text-gray-900">
                        {item.engagementEndDate ? (
                          formatDate(item.engagementEndDate)
                        ) : (
                          <span className="text-green-600 text-xs">Active - Ongoing</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Deduction Rates */}
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Deduction Rates</div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Employer:</span>
                        <span className="font-semibold text-green-600">
                          {item.totalEmployerContribution ? `${item.totalEmployerContribution}%` : '-'}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Employee:</span>
                        <span className="font-semibold text-blue-600">
                          {item.totalEmployeeContribution ? `${item.totalEmployeeContribution}%` : '-'}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm pt-1 border-t">
                        <span className="text-gray-600">Total:</span>
                        <span className="font-bold text-gray-900">
                          {item.totalContribution ? `${item.totalContribution}%` : '-'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Status & Actions */}
                  <div className="flex flex-col justify-between items-end gap-2">
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${getStatusColor(getActualStatus(item))}`}>
                      {getActualStatus(item)}
                    </span>
                    <div className="text-xs text-gray-500">
                      Last Sync: {formatDate(item.lastSyncDate)}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => toggleRow(item._id)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition text-gray-600 hover:text-gray-900"
                    title={isExpanded ? "Hide details" : "Show details"}
                  >
                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </button>
                  <button
                    onClick={() => onDelete(item._id)}
                    className="p-2 hover:bg-red-50 rounded-lg transition text-red-600 hover:text-red-900"
                    title="Delete"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>

            {/* Expanded Details */}
            {isExpanded && (
              <div className="border-t border-gray-200 bg-gray-50 p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Establishment Info */}
                  <div className="bg-white p-4 rounded-lg border">
                    <div className="flex items-center gap-2 mb-3">
                      <Building2 size={18} className="text-blue-600" />
                      <h4 className="font-semibold text-gray-900">Establishment</h4>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-gray-500">Registration No:</span>
                        <span className="ml-2 font-medium">{item.establishmentRegNumber || '-'}</span>
                      </div>
                      {item.establishmentName && (
                        <div>
                          <span className="text-gray-500">Name:</span>
                          <span className="ml-2 font-medium">{item.establishmentName}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Identity Information */}
                  {apiData.identity && (
                    <div className="bg-white p-4 rounded-lg border">
                      <div className="flex items-center gap-2 mb-3">
                        <User size={18} className="text-green-600" />
                        <h4 className="font-semibold text-gray-900">Identity</h4>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-gray-500">Iqama:</span>
                          <span className="ml-2 font-medium">{apiData.identity.iqama || '-'}</span>
                        </div>
                        {apiData.identity.borderNumber && (
                          <div>
                            <span className="text-gray-500">Border Number:</span>
                            <span className="ml-2 font-medium">{apiData.identity.borderNumber}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Engagement Details */}
                  <div className="bg-white p-4 rounded-lg border">
                    <div className="flex items-center gap-2 mb-3">
                      <Calendar size={18} className="text-purple-600" />
                      <h4 className="font-semibold text-gray-900">Engagement Details</h4>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-gray-500">Type:</span>
                        <span className="ml-2 font-medium">{item.contributorType || '-'}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Status:</span>
                        <span className={`ml-2 px-2 py-0.5 rounded text-xs font-semibold ${getStatusColor(apiData.engagements?.status || item.engagementStatus)}`}>
                          {apiData.engagements?.status || item.engagementStatus || '-'}
                        </span>
                      </div>
                      {item.occupation && (
                        <div>
                          <span className="text-gray-500">Occupation:</span>
                          <span className="ml-2 font-medium">{item.occupation}</span>
                        </div>
                      )}
                      {item.wage > 0 && (
                        <div>
                          <span className="text-gray-500">Wage:</span>
                          <span className="ml-2 font-medium">{item.wage} {item.currency}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Coverage/Products */}
                  {item.products && item.products.length > 0 && (
                    <div className="bg-white p-4 rounded-lg border md:col-span-2 lg:col-span-3">
                      <div className="flex items-center gap-2 mb-3">
                        <Shield size={18} className="text-orange-600" />
                        <h4 className="font-semibold text-gray-900">Social Insurance Coverage</h4>
                      </div>
                      <ScrollableTableWrapper>
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Arabic Name</th>
                              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Employer Rate</th>
                              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Employee Rate</th>
                              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Total Rate</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {item.products.map((product, index) => (
                              <tr key={index} className="hover:bg-gray-50">
                                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                  {product.productName || '-'}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-600" dir="rtl">
                                  {product.productNameAr || '-'}
                                </td>
                                <td className="px-4 py-3 text-sm text-right font-semibold text-green-600">
                                  {product.employerContribution ? `${product.employerContribution}%` : '-'}
                                </td>
                                <td className="px-4 py-3 text-sm text-right font-semibold text-blue-600">
                                  {product.employeeContribution ? `${product.employeeContribution}%` : '-'}
                                </td>
                                <td className="px-4 py-3 text-sm text-right font-bold text-gray-900">
                                  {product.totalContribution ? `${product.totalContribution}%` : '-'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot className="bg-gray-50 font-semibold">
                            <tr>
                              <td colSpan="2" className="px-4 py-3 text-sm text-gray-900">Total</td>
                              <td className="px-4 py-3 text-sm text-right text-green-700">
                                {item.totalEmployerContribution ? `${item.totalEmployerContribution}%` : '-'}
                              </td>
                              <td className="px-4 py-3 text-sm text-right text-blue-700">
                                {item.totalEmployeeContribution ? `${item.totalEmployeeContribution}%` : '-'}
                              </td>
                              <td className="px-4 py-3 text-sm text-right text-gray-900 font-bold">
                                {item.totalContribution ? `${item.totalContribution}%` : '-'}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </ScrollableTableWrapper>
                    </div>
                  )}

                  {/* Raw API Response (for debugging) */}
                  {apiData && Object.keys(apiData).length > 0 && (
                    <div className="bg-gray-900 text-gray-100 p-4 rounded-lg border md:col-span-2 lg:col-span-3">
                      <h4 className="font-semibold mb-2 text-green-400">Raw API Response</h4>
                      <pre className="text-xs overflow-x-auto whitespace-pre-wrap">
                        {JSON.stringify(apiData, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-blue-800 font-medium">Total Employees: {data.length}</span>
          <span className="text-blue-600">Click on any row to view detailed information and raw API data</span>
        </div>
      </div>
    </div>
  );
};

export default GOSITable;
