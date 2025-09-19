// scripts/seedProducts.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../db/database.sqlite');
const db = new sqlite3.Database(dbPath);

// 상품 초기 데이터 삽입
db.serialize(() => {
    db.get('SELECT COUNT(*) AS count FROM products', (err, row) => {
        if (err) {
            console.error('❌ products 테이블 조회 오류:', err.message);
            return db.close();
        }

        if (row.count === 0) {
            const stmt = db.prepare(`
        INSERT INTO products (name, description, price, emoji, image, likes, is_featured)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

            const products = [
                ['Keychron K1',            '초슬림 로우프로파일 무선 기계식 키보드 (Mac/Windows 호환)',           95000,  '⌨️', '1.jpg',   10, 1],
                ['Keychron K2',            '75% 배열 무선 기계식 키보드 (알루미늄 프레임)',                         129000, '⌨️', '2.jpg',   5,  1],
                ['Keychron K2 Pro',        '75% 배열 핫스왑 지원 기계식 키보드 (RGB 백라이트 포함)',               159000, '⌨️', '3.jpg',   3,  1],
                ['Keychron K3',            '65% 배열 초슬림 무선 키보드 (레트로 키캡 옵션)',                      109000, '⌨️', '4.jpg',   8,  0],
                ['Keychron K3 Pro',        '65% 배열 핫스왑 지원 로우프로파일 키보드 (RGB 백라이트)',             135000, '⌨️', '5.jpg',   2,  0],
                ['Keychron K4',            '96% 배열 컴팩트 기계식 키보드 (알루미늄 베젤)',                        129000, '⌨️', '6.jpg',   4,  0],
                ['Keychron K4 Pro',        '96% 배열 핫스왑 지원 유선/무선 기계식 키보드',                        155000, '⌨️', '7.jpg',   1,  0],
                ['Keychron K5',            '75% 풀사이즈 레이아웃 무선 기계식 키보드 (알루미늄 하우징)',            119000, '⌨️', '8.jpg',   6,  1],
                ['Keychron K5 Pro',        '75% 핫스왑 지원 유선/무선 기계식 키보드 (RGB 백라이트)',              149000, '⌨️', '9.jpg',   0,  0],
                ['Keychron K6',            '65% 배열 무선 기계식 키보드 (알루미늄 하우징)',                        119000, '⌨️', '10.jpg',  7,  1],
                ['Keychron K6 Pro',        '65% 배열 핫스왑 및 RGB 지원 유선/무선 기계식 키보드',                  145000, '⌨️', '11.jpg',  0,  0],
                ['Keychron K7',            '60% 배열 초슬림 무선 기계식 키보드 (저소음 스위치 옵션)',               99900,  '⌨️', '12.jpg',  2,  0],
                ['Keychron K8',            'Tenkeyless 유선/무선 기계식 키보드 (알루미늄 프레임)',                   139000, '⌨️', '13.jpg',  9,  1],
                ['Keychron K8 Pro',        'Tenkeyless 핫스왑 지원 기계식 키보드 (RGB 풀 커스터마이즈)',          165000, '⌨️', '14.jpg',  0,  0],
                ['Keychron K8 Wireless',   '무선 전용 Tenkeyless 기계식 키보드 (블루투스 5.1)',                     149000, '⌨️', '15.jpg',  0,  0],
                ['Keychron K8 Pro Wireless','무선 핫스왑 지원 키보드 (RGB 백라이트 포함)',                           189000, '⌨️', '16.jpg',  4,  0],
                ['Keychron K10',           '104키 풀사이즈 무선 기계식 키보드 (알루미늄 하우징, RGB)',             139000, '⌨️', '17.jpg',  6,  1],
                ['Keychron K10 Pro',       '풀사이즈 핫스왑 지원 기계식 키보드 (N-key 롤오버)',                     169000, '⌨️', '18.jpg',  0,  0],
                ['Keychron K10 Wireless',  '무선 풀사이즈 기계식 키보드 (듀얼 모드: 유선+무선)',                       159000, '⌨️', '19.jpg',  3,  0],
                ['Keychron K12',           '60% 배열 초소형 마이크로 키보드 (로우프로파일)',                         99900,  '⌨️', '20.jpg',  1,  0],
                ['Keychron K12 Pro',       '60% 핫스왑 지원 플로터 레이아웃 기계식 키보드',                         129000, '⌨️', '21.jpg',  0,  0],
                ['Keychron K14',           '65% 배열 로터리 인코더 포함 기계식 키보드',                             139000, '⌨️', '22.jpg',  0,  0],
                ['Keychron K14 Pro',       '65% 핫스왑 지원 무선 기계식 키보드 (알루미늄 베젤)',                     165000, '⌨️', '23.jpg',  2,  0],
                ['Keychron Q1',            '75% 풀 알루미늄 커스텀 기계식 키보드 키트 (핫스왑)',                      249000, '🔧', '24.jpg',  0,  0],
                ['Keychron Q2',            '65% 풀 알루미늄 커스텀 기계식 키보드 키트 (RGB 지원)',                  249000, '🔧', '25.jpg',  0,  0],
                ['Keychron Q3',            '풀사이즈 알루미늄 커스텀 기계식 키보드 키트 (핫스왑 및 RGB)',            299000, '🔧', '26.jpg',  0,  0],
                ['Keychron K3 SE',         '스페셜 에디션 초슬림 무선 키보드 (레트로 키캡 포함)',                     119000, '🎨', '27.jpg',  0,  0],
                ['Keychron K6 SE',         '스페셜 에디션 65% 무선 기계식 키보드 (레트로 디자인)',                     129000, '🎨', '28.jpg',  0,  0],
                ['Keychron K8 SE',         '스페셜 에디션 Tenkeyless 무선 키보드 (레트로 키캡 포함)',                   149000, '🎨', '29.jpg',  0,  0],
                ['Keychron K10 SE',        '스페셜 에디션 풀사이즈 무선 기계식 키보드 (레트로 테마)',                   149000, '🎨', '30.jpg',  0,  0],
            ];

            for (const product of products) {
                stmt.run(product);
            }

            stmt.finalize(() => {
                console.log('30개의 키보드 상품 데이터 삽입 완료');
                db.close();
            });
        } else {
            console.log(`ℹ️ 이미 ${row.count}개의 상품이 존재합니다. 삽입 생략`);
            db.close();
        }
    });
});
