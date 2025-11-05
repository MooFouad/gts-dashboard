const webpush = require('web-push');

console.log('Generating VAPID keys...\n');

const vapidKeys = webpush.generateVAPIDKeys();

console.log('Add these to your backend/.env file:\n');
console.log('VAPID_PUBLIC_KEY=' + vapidKeys.publicKey);
console.log('VAPID_PRIVATE_KEY=' + vapidKeys.privateKey);
console.log('\nAlso add to frontend/.env:');
console.log('VITE_VAPID_PUBLIC_KEY=' + vapidKeys.publicKey);