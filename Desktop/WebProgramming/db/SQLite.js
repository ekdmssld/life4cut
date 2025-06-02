const sqlite3 = require("sqlite3").verbose();

const path = require("path");
const dbPath = path.join(__dirname, "comicbook.db");
console.log("db경로", dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
    if(err){
        console.error("데이터베이스 연결 실패", err.message);
        return;
    }
        console.log("sqlite 데이터베이스 연결 성공");
});

db.all('SELECT * FROM books', (err, rows) => {
    if(err) {
        console.log("SELECT 쿼리 오류", err.message);
    }
    else{
        console.log("테이블 전체 조회 결과 : ");
        console.table(rows);
    }

    db.close((err) => {
        if (err) console.log("연결 종류 중 오류 : ", err.message);
        else {
            console.log("sqlite 연결 종료 완료")
        }
    })
});