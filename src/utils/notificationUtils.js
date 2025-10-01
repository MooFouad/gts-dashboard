import { getExpiryStatus } from './dateUtils';

export const checkNotificationPermission = async () => {
    if (!('Notification' in window)) {
        console.log('This browser does not support notifications');
        return false;
    }

    if (Notification.permission === 'granted') {
        return true;
    }

    if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
    }

    return false;
};

export const sendExpiryNotification = (item, type) => {
    if (Notification.permission !== 'granted') return;

    let title, body;

    switch (type) {
        case 'vehicle': {
            const licenseStatus = getExpiryStatus(item.licenseExpiryDate);
            const inspectionStatus = getExpiryStatus(item.inspectionExpiryDate);
            
            if (licenseStatus === 'warning') {
                title = 'Vehicle License Expiry Alert';
                body = `Vehicle ${item.plateNumber} license will expire soon`;
            }
            if (inspectionStatus === 'warning') {
                title = 'Vehicle Inspection Expiry Alert';
                body = `Vehicle ${item.plateNumber} inspection will expire soon`;
            }
            break;
        }

        case 'homeRent': {
            const payments = [
                { date: item.firstPaymentDate, name: 'First' },
                { date: item.secondPaymentDate, name: 'Second' },
                { date: item.thirdPaymentDate, name: 'Third' },
                { date: item.fourthPaymentDate, name: 'Fourth' }
            ];

            const upcomingPayment = payments.find(p => getExpiryStatus(p.date) === 'warning');
            if (upcomingPayment) {
                title = 'Upcoming Rent Payment Alert';
                body = `${upcomingPayment.name} payment for property ${item.name} is due soon`;
            }
            break;
        }

        case 'electricity': {
            const dueStatus = getExpiryStatus(item.dueDate);
            if (dueStatus === 'warning') {
                title = 'Electricity Bill Alert';
                body = `Electricity bill #${item.billNumber} is due soon`;
            }
            break;
        }
    }

    if (title && body) {
        new Notification(title, {
            body,
            icon: '/notification-icon.png', // يمكنك إضافة أيقونة خاصة بك
            badge: '/notification-badge.png',
            dir: 'rtl',
            lang: 'ar'
        });
    }
};

// تخزين آخر وقت تم فيه إرسال إشعار لكل عنصر
const notificationsSent = new Map();

export const checkAndSendNotifications = (items, type) => {
    items.forEach(item => {
        const itemKey = `${type}-${item.id}`;
        const lastNotification = notificationsSent.get(itemKey);
        const now = new Date();

        // تحقق مما إذا كان قد مر 24 ساعة على آخر إشعار
        if (!lastNotification || (now - lastNotification) > 24 * 60 * 60 * 1000) {
            let shouldNotify = false;

            switch (type) {
                case 'vehicle': {
                    shouldNotify = getExpiryStatus(item.licenseExpiryDate) === 'warning' ||
                                 getExpiryStatus(item.inspectionExpiryDate) === 'warning';
                    break;
                }
                    
                case 'homeRent': {
                    const payments = [
                        item.firstPaymentDate,
                        item.secondPaymentDate,
                        item.thirdPaymentDate,
                        item.fourthPaymentDate
                    ];
                    shouldNotify = payments.some(date => getExpiryStatus(date) === 'warning');
                    break;
                }

                case 'electricity': {
                    shouldNotify = getExpiryStatus(item.dueDate) === 'warning' &&
                                 item.paymentStatus !== 'Paid';
                    break;
                }
            }

            if (shouldNotify) {
                sendExpiryNotification(item, type);
                notificationsSent.set(itemKey, now);
            }
        }
    });
};