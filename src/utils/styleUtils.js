import { getExpiryStatus } from './dateUtils';

export const getRowColorClass = (item, type) => {
      if (type === 'vehicle') {
            const licenseStatus = getExpiryStatus(item.licenseExpiryDate);
            const inspectionStatus = getExpiryStatus(item.inspectionExpiryDate);
            
            if (licenseStatus === 'expired' || inspectionStatus === 'expired') {
                  return 'bg-red-100 border-l-4 border-red-500';
            }
            if (licenseStatus === 'warning' || inspectionStatus === 'warning') {
                  return 'bg-yellow-100 border-l-4 border-orange-500';
            }
      }
      
      if (type === 'homeRent') {
            const payments = [
                  item.firstPaymentDate,
                  item.secondPaymentDate,
                  item.thirdPaymentDate,
                  item.fourthPaymentDate
            ];
            
            if (payments.some(date => getExpiryStatus(date) === 'expired')) {
                  return 'bg-red-100 border-l-4 border-red-500';
            }
            if (payments.some(date => getExpiryStatus(date) === 'warning')) {
                  return 'bg-yellow-100 border-l-4 border-orange-500';
            }
      }
      
      if (type === 'electricity') {
            const dueStatus = getExpiryStatus(item.dueDate);
            
            if (dueStatus === 'expired' && item.paymentStatus !== 'Paid') {
                  return 'bg-red-100 border-l-4 border-red-500';
            }
            if (dueStatus === 'warning' && item.paymentStatus !== 'Paid') {
                  return 'bg-yellow-100 border-l-4 border-orange-500';
            }
      }
      
      return 'bg-white border-l-4 border-transparent';
};