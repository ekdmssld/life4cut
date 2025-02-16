const mongoose = require('mongoose');

const AdminSchema = new mongoose.Schema({
  account: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
    unique: true,
  },
  phoneNumber: {
    type: String,
    required: true,
    unique: true,
  },
  approved: {
    type: Boolean,
    default: false,
  },
});

module.exports = mongoose.model('Admin', AdminSchema);
