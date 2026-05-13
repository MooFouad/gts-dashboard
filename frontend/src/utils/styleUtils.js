import { getExpiryStatus } from './dateUtils';

export const getRowColorClass = (item, type) => {
      if (type === 'vehicle') {
            const licenseStatus = getExpiryStatus(item.licenseExpiryDate);
            const inspectionStatus = getExpiryStatus(item.inspectionExpiryDate);

            if (licenseStatus === 'expired' || inspectionStatus === 'expired') {
                  return 'bg-rose-50/60 border-l-[3px] border-rose-400';
            }
            if (licenseStatus === 'warning' || inspectionStatus === 'warning') {
                  return 'bg-amber-50/60 border-l-[3px] border-amber-400';
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
                  return 'bg-rose-50/60 border-l-[3px] border-rose-400';
            }
            if (payments.some(date => getExpiryStatus(date) === 'warning')) {
                  return 'bg-amber-50/60 border-l-[3px] border-amber-400';
            }
      }

      if (type === 'electricity') {
            const dueStatus = getExpiryStatus(item.dueDate);

            if (dueStatus === 'expired' && item.paymentStatus !== 'Paid') {
                  return 'bg-rose-50/60 border-l-[3px] border-rose-400';
            }
            if (dueStatus === 'warning' && item.paymentStatus !== 'Paid') {
                  return 'bg-amber-50/60 border-l-[3px] border-amber-400';
            }
      }

      if (type === 'absher') {
            const dates = [
                  item.expiryDate,
                  item.inspectionExpiryDate,
                  item.licenseExpiryDate
            ].filter(date => date);

            if (dates.length === 0) {
                  return 'bg-white border-l-[3px] border-transparent';
            }

            const statuses = dates.map(date => getExpiryStatus(date));

            if (statuses.some(status => status === 'expired')) {
                  return 'bg-rose-50/60 border-l-[3px] border-rose-400';
            }
            if (statuses.some(status => status === 'warning')) {
                  return 'bg-amber-50/60 border-l-[3px] border-amber-400';
            }
      }

      return 'bg-white border-l-[3px] border-transparent';
};
