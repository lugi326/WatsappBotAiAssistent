const { default: makeWASocket, DisconnectReason, useMultiFileAuthState } = require('@adiwajshing/baileys');
const { Boom } = require('@hapi/boom');
const P = require('pino');
const fs = require('fs');
const qrcode = require('qrcode-terminal');

const logFile = 'bot.log';
const maxReconnectAttempts = 5;
let reconnectAttempts = 0;
let qrCode = null;

function logToFile(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `${timestamp}: ${message}\n`;
  fs.appendFileSync(logFile, logMessage);
}

async function connectWhatsapp() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');

  const socket = makeWASocket({
    printQRInTerminal: false,
    auth: state,
    logger: P({ level: 'silent' })
  });

  socket.ev.on("connection.update", ({ connection, qr }) => {
    if (connection === 'open') {
      console.log("WhatsApp Active..");
      console.log('Bot ID:', socket.user.id);
      logToFile("WhatsApp Active..");
      logToFile('Bot ID: ' + socket.user.id);
      qrCode = null;
      reconnectAttempts = 0;
    } else if (connection === 'close') {
      console.log("WhatsApp connection closed. Attempting to reconnect...");
      logToFile("WhatsApp connection closed. Attempting to reconnect...");
      if (reconnectAttempts < maxReconnectAttempts) {
        reconnectAttempts++;
        setTimeout(connectWhatsapp, 5000);
      } else {
        console.log("Max reconnection attempts reached. Exiting...");
        logToFile("Max reconnection attempts reached. Exiting...");
        process.exit(1);
      }
    } else if (qr) {
      qrCode = qr;
      console.log('\n==========================');
      console.log('New QR Code received, scan it to login:');
      console.log('==========================\n');
      qrcode.generate(qr, { small: true });
      console.log('\n==========================');
      console.log('End of QR Code');
      console.log('==========================\n');
    }
  });

  socket.ev.on("creds.update", saveCreds);

  socket.ev.on("messages.upsert", async ({ messages }) => {
    const m = messages[0];
    if (!m.message) return;
    const messageType = Object.keys(m.message)[0];
    if (messageType === 'conversation') {
      const text = m.message.conversation.toLowerCase();
      if (text === 'ping') {
        await socket.sendMessage(m.key.remoteJid, { text: 'Pong!' }, { quoted: m });
        console.log('Responded to ping');
        logToFile('Responded to ping');
      }
    }
  });

  return socket;
}

connectWhatsapp();