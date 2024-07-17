const { connectWhatsapp } = require('./index');

console.log('Starting WhatsApp Bot worker...');
connectWhatsapp();

process.on('unhandledRejection', (reason, promise) => {
  console.log('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.log('Uncaught Exception:', error);
});