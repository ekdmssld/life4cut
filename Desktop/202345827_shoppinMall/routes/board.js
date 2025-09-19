const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const router = express.Router();
const dbPath = path.join(__dirname, '../db/database.sqlite');
const db = new sqlite3.Database(dbPath);

const multer = require('multer');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../public/uploads'));
    },
    filename: function (req, file, cb) {
        const uniqueName = Date.now() + '-' + file.originalname;
        cb(null, uniqueName);
    }
});
const upload = multer({ storage: storage });


// 게시글 목록
router.get('/', (req, res) => {
    db.all(`
        SELECT * FROM posts ORDER BY
                                COALESCE(parent_id, id), id ASC
    `, [], (err, posts) => {
        if (err) return res.send('목록 불러오기 실패');
        res.render('board', { title: '고객센터 게시판',posts });
    });
});

// 글쓰기 폼
router.get('/new', (req, res) => {
    res.render('post', {
        post: null,
        parentId: null,
        user: req.session.user || null //사용자 정보 전달
    });
});

// 글쓰기 처리
// router.post('/new', (req, res) => {
//     const { title, content, parent_id } = req.body;
//     const author = req.session.user?.username || '익명';
//
//     db.run(
//         'INSERT INTO posts (title, content, parent_id, author) VALUES (?, ?, ?, ?)',
//         [title, content, parent_id || null, author],
//         function (err) {
//             if (err) return res.send('작성 실패');
//             res.redirect('/board');
//         }
//     );
// });

//글쓰기 처리 + 파일 업로드

router.post('/new', upload.single('attachment'), (req, res) => {
    const { title, content, parent_id } = req.body;
    const author = req.session.user?.username || '익명';

    db.run(
        'INSERT INTO posts (title, content, parent_id, author) VALUES (?, ?, ?, ?)',
        [title, content, parent_id || null, author],
        function (err) {
            if (err) return res.send('작성 실패');

            const postId = this.lastID;

            // 파일이 있을 경우 files 테이블에 저장
            if (req.file) {
                const { filename, path: filepath } = req.file;
                db.run(
                    'INSERT INTO files (post_id, filename, filepath) VALUES (?, ?, ?)',
                    [postId, filename, filepath],
                    (err2) => {
                        if (err2) console.error('파일 저장 오류:', err2.message);
                        res.redirect('/board');
                    }
                );
            } else {
                res.redirect('/board');
            }
        }
    );
});

// 글 상세
// router.get('/view/:id', (req, res) => {
//     const postId = req.params.id;
//
//     db.get('SELECT * FROM posts WHERE id = ?', [postId], (err, post) => {
//         if (err || !post) return res.send('글 없음');
//         res.render('detail', { post });
//     });
// });

// 글 상세 + 파일조회
router.get('/view/:id', (req, res) => {
    const postId = req.params.id;

    db.get('SELECT * FROM posts WHERE id = ?', [postId], (err, post) => {
        if (err || !post) return res.send('글 없음');

        db.all('SELECT * FROM files WHERE post_id = ?', [postId], (ferr, files) => {

            // (3) 답글(자식 글) 조회
            db.all(
                'SELECT * FROM posts WHERE parent_id = ? ORDER BY created_at ASC',
                [postId],
                (rerr, replies) => {
                    if (rerr) {
                        console.error('답글 조회 오류:', rerr.message);
                        replies = [];
                    }

                    // (4) 렌더링: post, files, replies, user 전달
                    res.render('detail', {
                        post,
                        files,
                        replies,
                        user: req.session.user
                    });
                }
            );
        });
    });
});


// 답글 달기 폼
//
// router.get('/reply/:id', (req, res) => {
//     const parentId = req.params.id;
//     res.render('post', {post: null, parentId });
// });

router.get('/reply/:id', (req, res) => {
    const parentId = req.params.id;
    db.get("SELECT title FROM posts WHERE id = ?", [parentId], (err, row) => {
        if (err || !row) return res.send("원글 없음");
        res.render('reply',
            { parentId,
                parentTitle: row.title,
                user: req.session.user || null
            });
    });
});

// 댓글 달기 post
router.post('/create', (req, res) => {
    const { author, title, content, parent_id } = req.body;
    db.run(
        'INSERT INTO posts (author, title, content, parent_id) VALUES (?, ?, ?, ?)',
        [author, title, content, parent_id || null],
        function (err) {
            if (err) return res.send('등록 실패');
            res.redirect('/board');
        }
    );
});


// 수정 폼
router.get('/edit/:id', (req, res) => {
    const postId = req.params.id;

    // ① 먼저 해당 게시물을 조회
    db.get('SELECT * FROM posts WHERE id = ?', [postId], (err, post) => {
        if (err || !post) {
            return res.send('글 없음');
        }

        // ② 이 게시물에 연결된 files 테이블의 레코드를 모두 가져오기
        db.all('SELECT * FROM files WHERE post_id = ?', [postId], (fileErr, files) => {
            if (fileErr) {
                console.error('첨부파일 조회 오류:', fileErr.message);
                // 파일 조회에 실패해도 최소 post 객체는 보여주기
                files = [];
            }
            // ③ edit.ejs에 post와 files를 같이 전달
            res.render('edit', { post, files });
        });
    });
});

// 수정 처리
router.post('/edit/:id', upload.single('attachment'), (req, res) => {
    const postId = req.params.id;
    const { title, content } = req.body;
    const deleteFileIds = req.body.deleteFileIds; // 체크된 파일 ID들 (string 또는 배열)

    // (1) 게시글 내용 수정
    db.run(
        'UPDATE posts SET title = ?, content = ? WHERE id = ?',
        [title, content, postId],
        (err) => {
            if (err) return res.send('수정 실패');

            // (2) 체크된 파일이 있으면 DB에서 삭제 & 파일시스템에서도 제거
            if (deleteFileIds) {
                // deleteFileIds가 단일 값이라면 문자열, 여러 개면 배열이 됨
                const idsToDelete = Array.isArray(deleteFileIds) ? deleteFileIds : [deleteFileIds];
                idsToDelete.forEach(idStr => {
                    const fileId = parseInt(idStr, 10);
                    // DB에서 파일 정보 얻어오기
                    db.get('SELECT filepath FROM files WHERE id = ?', [fileId], (Ferr, row) => {
                        if (row) {
                            // 실제 파일 삭제
                            fs.unlink(row.filepath, (fsErr) => {
                                if (fsErr) console.error('파일 삭제 오류:', fsErr);
                            });
                            // DB 레코드 삭제
                            db.run('DELETE FROM files WHERE id = ?', [fileId], (DelErr) => {
                                if (DelErr) console.error('files 테이블 삭제 오류:', DelErr);
                            });
                        }
                    });
                });
            }

            // (3) 새로 첨부된 파일이 있으면 파일 저장 & DB에 삽입
            if (req.file) {
                const { filename, path: filepath } = req.file;
                db.run(
                    'INSERT INTO files (post_id, filename, filepath) VALUES (?, ?, ?)',
                    [postId, filename, filepath],
                    (InsErr) => {
                        if (InsErr) console.error('새 파일 저장 오류:', InsErr);
                        return res.redirect('/board/view/' + postId);
                    }
                );
            } else {
                return res.redirect('/board/view/' + postId);
            }
        }
    );
});


// 삭제
// router.get('/delete/:id', (req, res) => {
//     db.run('DELETE FROM posts WHERE id = ?', [req.params.id], (err) => {
//         if (err) return res.send('삭제 실패');
//         res.redirect('/board');
//     });
// });

// 삭제 처리- 본인이 작성한 글만 삭제 가능
router.get('/delete/:id', (req, res) => {
    const postId = req.params.id;
    const currentUser = req.session.user?.username;

    db.get('SELECT * FROM posts WHERE id = ?', [postId], (err, post) => {
        if (err || !post) return res.send('글이 존재하지 않습니다.');

        // 익명 글이면 admin만 삭제 가능
        if (post.author === '익명') {
            if (currentUser !== 'admin') {
                return res.send('익명 글은 admin만 삭제할 수 있습니다.');
            }
        } else {
            // 본인이 쓴 글만 삭제 가능
            if (currentUser !== post.author) {
                return res.send('본인이 작성한 글만 삭제할 수 있습니다.');
            }
        }

        db.run('DELETE FROM posts WHERE id = ?', [postId], (delErr) => {
            if (delErr) return res.send('삭제 실패');
            res.redirect('/board');
        });
    });
});


module.exports = router;
