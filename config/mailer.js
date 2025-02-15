const nodemailer = require('nodemailer');
require('dotenv').config();

let smtpTransport = nodemailer.createTransport({
  pool: true,
  maxConnections: 1,
  service: 'gmail',
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  requireTLS: true,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

module.exports = smtpTransport;
