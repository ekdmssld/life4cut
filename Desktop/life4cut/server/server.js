const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const sharp = require('sharp');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static files - client 폴더를 정적 파일로 제공
app.use(express.static(path.join(__dirname, '../client')));

// 업로드 디렉토리 생성
const uploadDir = path.join(__dirname, 'uploads');
const framesDir = path.join(__dirname, 'frames');

async function ensureDirectories() {
    try {
        await fs.mkdir(uploadDir, { recursive: true });
        await fs.mkdir(framesDir, { recursive: true });
        console.log('Directories created successfully');
    } catch (error) {
        console.error('Error creating directories:', error);
    }
}

ensureDirectories();

// Multer 설정 (메모리 저장)
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// Routes

// 헬스체크
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Server is running' });
});

// 사진 저장
app.post('/api/photos/save', upload.single('photo'), async (req, res) => {
    try {
        if (!req.file && !req.body.photo) {
            return res.status(400).json({ error: 'No photo provided' });
        }

        let photoBuffer;

        if (req.file) {
            // multipart/form-data로 받은 경우
            photoBuffer = req.file.buffer;
        } else if (req.body.photo) {
            // base64 문자열로 받은 경우
            const base64Data = req.body.photo.replace(/^data:image\/\w+;base64,/, '');
            photoBuffer = Buffer.from(base64Data, 'base64');
        }

        // 파일명 생성
        const timestamp = Date.now();
        const filename = `photo_${timestamp}.jpg`;
        const filepath = path.join(uploadDir, filename);

        // Sharp를 사용해 이미지 처리 및 저장
        await sharp(photoBuffer)
            .jpeg({ quality: 90 })
            .toFile(filepath);

        res.json({
            success: true,
            filename: filename,
            url: `/uploads/${filename}`
        });

    } catch (error) {
        console.error('Error saving photo:', error);
        res.status(500).json({ error: 'Failed to save photo' });
    }
});

// 프레임 적용
app.post('/api/photos/apply-frame', upload.single('photo'), async (req, res) => {
    try {
        const { frame } = req.body;

        if (!req.file && !req.body.photo) {
            return res.status(400).json({ error: 'No photo provided' });
        }

        let photoBuffer;

        if (req.file) {
            photoBuffer = req.file.buffer;
        } else if (req.body.photo) {
            const base64Data = req.body.photo.replace(/^data:image\/\w+;base64,/, '');
            photoBuffer = Buffer.from(base64Data, 'base64');
        }

        // 프레임 적용 로직 (예시)
        let processedImage = sharp(photoBuffer);

        if (frame && frame !== 'none') {
            // 프레임에 따른 처리
            switch(frame) {
                case 'classic':
                    // 클래식 프레임: 테두리 추가
                    processedImage = processedImage
                        .extend({
                            top: 50,
                            bottom: 50,
                            left: 50,
                            right: 50,
                            background: { r: 255, g: 255, b: 255 }
                        });
                    break;
                case 'romantic':
                    // 로맨틱 프레임: 핑크 테두리
                    processedImage = processedImage
                        .extend({
                            top: 40,
                            bottom: 40,
                            left: 40,
                            right: 40,
                            background: { r: 255, g: 192, b: 203 }
                        });
                    break;
                // 더 많은 프레임 추가 가능
            }
        }

        const outputBuffer = await processedImage
            .jpeg({ quality: 90 })
            .toBuffer();

        // Base64로 변환해서 반환
        const base64Image = `data:image/jpeg;base64,${outputBuffer.toString('base64')}`;

        res.json({
            success: true,
            image: base64Image
        });

    } catch (error) {
        console.error('Error applying frame:', error);
        res.status(500).json({ error: 'Failed to apply frame' });
    }
});

// 콜라주 생성 (4장 합치기)
app.post('/api/photos/create-collage', upload.array('photos', 4), async (req, res) => {
    try {
        const photos = req.files || [];

        if (photos.length === 0 && req.body.photos) {
            // base64 배열로 받은 경우
            const base64Photos = JSON.parse(req.body.photos);

            // 각 사진을 200x200으로 리사이즈
            const resizedPhotos = await Promise.all(
                base64Photos.map(async (photo) => {
                    const base64Data = photo.replace(/^data:image\/\w+;base64,/, '');
                    const buffer = Buffer.from(base64Data, 'base64');
                    return sharp(buffer)
                        .resize(400, 400)
                        .toBuffer();
                })
            );

            // 2x2 그리드로 합치기
            const row1 = await sharp({
                create: {
                    width: 800,
                    height: 400,
                    channels: 3,
                    background: { r: 255, g: 255, b: 255 }
                }
            })
                .composite([
                    { input: resizedPhotos[0], left: 0, top: 0 },
                    { input: resizedPhotos[1] || resizedPhotos[0], left: 400, top: 0 }
                ])
                .toBuffer();

            const row2 = await sharp({
                create: {
                    width: 800,
                    height: 400,
                    channels: 3,
                    background: { r: 255, g: 255, b: 255 }
                }
            })
                .composite([
                    { input: resizedPhotos[2] || resizedPhotos[0], left: 0, top: 0 },
                    { input: resizedPhotos[3] || resizedPhotos[1] || resizedPhotos[0], left: 400, top: 0 }
                ])
                .toBuffer();

            // 최종 콜라주
            const collage = await sharp({
                create: {
                    width: 800,
                    height: 800,
                    channels: 3,
                    background: { r: 255, g: 255, b: 255 }
                }
            })
                .composite([
                    { input: row1, left: 0, top: 0 },
                    { input: row2, left: 0, top: 400 }
                ])
                .jpeg({ quality: 90 })
                .toBuffer();

            const base64Collage = `data:image/jpeg;base64,${collage.toString('base64')}`;

            res.json({
                success: true,
                collage: base64Collage
            });
        }

    } catch (error) {
        console.error('Error creating collage:', error);
        res.status(500).json({ error: 'Failed to create collage' });
    }
});

// 업로드된 파일 제공
app.use('/uploads', express.static(uploadDir));

// 모든 라우트를 index.html로 리디렉션 (SPA 지원)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/index.html'));
});

// 서버 시작
app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════╗
║                                        ║
║   🎉 PhotoBooth Server is running! 🎉  ║
║                                        ║
║   Local:  http://localhost:${PORT}        ║
║                                        ║
║   카메라 권한을 허용해주세요!            ║
║                                        ║
╚════════════════════════════════════════╝
  `);
});