const sqlite3 = require("sqlite3").verbose();
const express = require("express");
const fs = require("fs");
const ejs = require("ejs");
const bodyParser = require("body-parser");

const db = new sqlite3.Database(__dirname, "comicbook.db", (err) => {
    if(err){
        console.err("sqlite 연결 실패", err.message);
    }else{
        console.log("sqlite 연결 성공");
    }
});

const app = express();
app.use(bodyParser.urlencoded({extended: false}));

app.listen(3000, () => {
    console.log("server is running on port 3000");
});

app.get("/", (req, res) => {
    fs.readFile("bookList.html", "utf-8", (err, template) => {
        if(err){
            res.status(500).send("HTML 파일을 읽을 수 없습니다.");
            return;
        }
        db.all("SELECT * FROM books", (err, rows) => {
            if(err){
                res.status(500).send("db조회 오류" + err.message);
                return;
            }
            res.render(ejs.render(template, {data : rows}));
        });
    });
});