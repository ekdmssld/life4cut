require('dotenv').config();
const mongoose = require('mongoose');

async function dbConnect() {
  try {
    if (
      !process.env.MONGO_URI ||
      !process.env.DB_USER ||
      !process.env.DB_PASS
    ) {
      throw new Error(
        '환경 변수(MONGO_URI, DB_USER, DB_PASS)가 설정되지 않았습니다!'
      );
    }

    const uri = process.env.MONGO_URI.replace(
      '<DB_USER>',
      process.env.DB_USER
    ).replace('<DB_PASS>', encodeURIComponent(process.env.DB_PASS));

    await mongoose.connect(uri);

    console.log('MongoDB Connected');
  } catch (error) {
    console.error('MongoDB Connection Error:', error.message);
    process.exit(1);
  }
}

module.exports = dbConnect;
