const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, './database.sqlite');
const schemaPath = path.join(__dirname, '../schema.sql');


if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
    console.log('🗑 기존 데이터베이스 파일 삭제');
}

const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE);

const schema = fs.readFileSync(schemaPath, 'utf-8');

db.exec(schema, (err) => {
    if (err) {
        console.error('❌ 스키마 실행 오류:', err.message);
    } else {
        console.log('✅ 데이터베이스 초기화 완료');
    }
    db.close();
});

