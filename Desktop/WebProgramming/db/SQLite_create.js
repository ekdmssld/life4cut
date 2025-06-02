const sqlite3 = require("sqlite3").verbose();

const path = require("path");
const dbPath = path.join(__dirname, "comicbook.db");

const db = new sqlite3.Database(dbPath, (err) => {
    if(err){
        console.error("데이터베이스 연결 실패", err.message);
    }
    else{
        console.log("sqlite 데이터베이스 연결 성공");
    }
});

const createTableQuery = `
CREATE TABLE IF NOT EXISTS books(
    number INTEGER PRIMARY KEY AUTOINCREMENT,
    genre TEXT NOT NULL,
    name TEXT NOT NULL,
    writer TEXT NOT NULL,
    releasedate DATE NOT NULL
);`;

db.run(createTableQuery, (err) => {
    if(err){
        console.log("테이블 생성 실패", err.message);
    }else{
        console.log("books 테이블이 생성되었습니다.");

        db.all("PRAGMA table_info(books);", (err, rows) => {
            if(err){
                console.error("테이블 구조 조회 실패 : ", err.message);
            }else{
                console.log("테이블 구조 : ");
                console.table(rows);
            }

            db.close((err) => {
                if(err){
                    console.log("연결 종료 중 오류", err.message);
                }else{
                    console.log("sqlite 연결 종료 완료");
                }
            });
        });
    }
});