// app.js - Life4Cut 메인 애플리케이션 로직

// 스토리지 관리자
class StorageManager {
    constructor() {
        this.prefix = 'life4cut_';
    }

    get(key) {
        try {
            const item = localStorage.getItem(this.prefix + key);
            return item ? JSON.parse(item) : null;
        } catch (e) {
            console.error('Storage get error:', e);
            return null;
        }
    }

    set(key, value) {
        try {
            localStorage.setItem(this.prefix + key, JSON.stringify(value));
            return true;
        } catch (e) {
            console.error('Storage set error:', e);
            return false;
        }
    }

    remove(key) {
        localStorage.removeItem(this.prefix + key);
    }

    clear() {
        Object.keys(localStorage)
            .filter(key => key.startsWith(this.prefix))
            .forEach(key => localStorage.removeItem(key));
    }
}

// 메인 앱 클래스
class Life4CutApp {
    constructor() {
        this.currentUser = null;
        this.storage = new StorageManager();
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkLoginStatus();
        console.log('Life4Cut App 초기화 완료');
    }

    setupEventListeners() {
        // 로그인 폼
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const username = document.getElementById('username').value;
                const password = document.getElementById('password').value;
                this.handleLogin(username, password);
            });
        }

        // QR URL 입력시 자동 생성
        const qrUrl = document.getElementById('qrUrl');
        if (qrUrl) {
            qrUrl.addEventListener('input', (e) => {
                if (e.target.value) {
                    this.generateQRCode(e.target.value);
                }
            });
        }
    }

    checkLoginStatus() {
        const currentUser = this.storage.get('currentUser');
        if (currentUser) {
            this.currentUser = currentUser;
            this.showMainApp(currentUser);
        }
    }

    handleLogin(username, password) {
        const errorMsg = document.getElementById('errorMessage');

        // 로그인 검증
        if ((username === 'admin' && password === 'admin') ||
            (username === 'user' && password === 'user')) {

            // 로그인 성공
            errorMsg.classList.remove('show');
            this.currentUser = username;
            this.storage.set('currentUser', username);

            // 로그인 시간 기록
            this.storage.set('lastLogin', new Date().toISOString());

            this.showMainApp(username);
        } else {
            // 로그인 실패
            errorMsg.classList.add('show');
            setTimeout(() => errorMsg.classList.remove('show'), 3000);
        }
    }

    quickLogin(type) {
        document.getElementById('username').value = type;
        document.getElementById('password').value = type;
        this.handleLogin(type, type);
    }

    showMainApp(userType) {
        // 화면 전환
        document.getElementById('loginContainer').style.display = 'none';
        document.getElementById('appContainer').classList.add('active');

        if (userType === 'admin') {
            this.showAdminPanel();
        } else {
            this.showUserPanel();
        }
    }

    showAdminPanel() {
        document.getElementById('adminPanel').classList.add('active');
        document.getElementById('userPanel').classList.remove('active');

        // 관리자 데이터 로드
        this.loadFrames();
        this.loadQRSettings();
        this.loadStats();
        this.checkDevices();
    }

    showUserPanel() {
        document.getElementById('userPanel').classList.add('active');
        document.getElementById('adminPanel').classList.remove('active');

        // 포토 앱 초기화
        if (!window.photoApp) {
            window.photoApp = new PhotoBoothApp();
        }
        window.photoApp.init();
    }

    logout() {
        this.storage.remove('currentUser');
        this.currentUser = null;
        location.reload();
    }

    // 프레임 관리
    handleFrameUpload(event) {
        const files = event.target.files;
        const frames = this.storage.get('frames') || [];

        Array.from(files).forEach(file => {
            if (file.size > 5 * 1024 * 1024) {
                this.showToast('파일 크기는 5MB 이하여야 합니다.', 'error');
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                const frameData = {
                    id: `frame_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    name: file.name,
                    data: e.target.result,
                    uploadDate: new Date().toISOString()
                };

                frames.push(frameData);
                this.storage.set('frames', frames);
                this.loadFrames();
                this.showToast('프레임이 추가되었습니다.', 'success');
            };
            reader.readAsDataURL(file);
        });

        // 입력 초기화
        event.target.value = '';
    }

    loadFrames() {
        const frames = this.storage.get('frames') || [];
        const preview = document.getElementById('framePreview');

        if (frames.length === 0) {
            preview.innerHTML = '<div style="color: #999; padding: 20px;">업로드된 프레임이 없습니다.</div>';
            return;
        }

        preview.innerHTML = frames.map(frame => `
            <div class="frame-item" data-id="${frame.id}">
                <img src="${frame.data}" alt="${frame.name}" title="${frame.name}">
                <button class="frame-remove" onclick="app.removeFrame('${frame.id}')" title="삭제">×</button>
            </div>
        `).join('');
    }

    removeFrame(frameId) {
        if (confirm('이 프레임을 삭제하시겠습니까?')) {
            let frames = this.storage.get('frames') || [];
            frames = frames.filter(f => f.id !== frameId);
            this.storage.set('frames', frames);
            this.loadFrames();
            this.showToast('프레임이 삭제되었습니다.', 'success');
        }
    }

    // QR 설정
    saveQRSettings() {
        const settings = {
            url: document.getElementById('qrUrl').value,
            text: document.getElementById('qrText').value,
            googleDriveFolder: document.getElementById('googleDriveFolder').value,
            savedAt: new Date().toISOString()
        };

        if (!settings.url && !settings.googleDriveFolder) {
            this.showToast('URL 또는 Google Drive 폴더 ID를 입력해주세요.', 'error');
            return;
        }

        this.storage.set('qrSettings', settings);

        if (settings.url) {
            this.generateQRCode(settings.url);
        }

        this.showToast('QR 설정이 저장되었습니다.', 'success');
    }

    loadQRSettings() {
        const settings = this.storage.get('qrSettings') || {};

        if (settings.url) {
            document.getElementById('qrUrl').value = settings.url;
            this.generateQRCode(settings.url);
        }

        if (settings.text) {
            document.getElementById('qrText').value = settings.text;
        }

        if (settings.googleDriveFolder) {
            document.getElementById('googleDriveFolder').value = settings.googleDriveFolder;
        }
    }

    generateQRCode(url) {
        const qrcodeDiv = document.getElementById('qrcode');
        qrcodeDiv.innerHTML = '';

        if (url && typeof QRCode !== 'undefined') {
            new QRCode(qrcodeDiv, {
                text: url,
                width: 200,
                height: 200,
                colorDark: '#000000',
                colorLight: '#ffffff',
                correctLevel: QRCode.CorrectLevel.H
            });
        }
    }

    // 장비 체크
    async checkDevices() {
        // 카메라 체크
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            document.getElementById('cameraStatus').innerHTML = '✅ 연결됨';
            document.getElementById('cameraStatus').style.color = '#4caf50';
            stream.getTracks().forEach(track => track.stop());
        } catch (error) {
            document.getElementById('cameraStatus').innerHTML = '❌ 연결 안됨';
            document.getElementById('cameraStatus').style.color = '#ff6b6b';
        }

        // 프린터 체크
        if (window.print) {
            document.getElementById('printerStatus').innerHTML = '✅ 사용 가능';
            document.getElementById('printerStatus').style.color = '#4caf50';
        } else {
            document.getElementById('printerStatus').innerHTML = '⚠️ 확인 필요';
            document.getElementById('printerStatus').style.color = '#ff9800';
        }

        // 저장공간 체크
        if (navigator.storage && navigator.storage.estimate) {
            try {
                const estimate = await navigator.storage.estimate();
                const percentUsed = (estimate.usage / estimate.quota * 100).toFixed(2);

                if (percentUsed < 80) {
                    document.getElementById('storageStatus').innerHTML = `✅ 충분함 (${percentUsed}% 사용)`;
                    document.getElementById('storageStatus').style.color = '#4caf50';
                } else {
                    document.getElementById('storageStatus').innerHTML = `⚠️ 부족 (${percentUsed}% 사용)`;
                    document.getElementById('storageStatus').style.color = '#ff9800';
                }
            } catch (error) {
                document.getElementById('storageStatus').innerHTML = '⚠️ 확인 불가';
                document.getElementById('storageStatus').style.color = '#ff9800';
            }
        }
    }

    // 통계 관리
    loadStats() {
        const stats = this.storage.get('stats') || { photos: 0, prints: 0, sessions: [] };

        document.getElementById('photoCount').textContent = stats.photos || 0;
        document.getElementById('printCount').textContent = stats.prints || 0;

        // 평균 시간 계산
        if (stats.sessions && stats.sessions.length > 0) {
            const avgTime = stats.sessions.reduce((acc, session) => acc + session.duration, 0) / stats.sessions.length;
            const minutes = Math.floor(avgTime / 60);
            const seconds = Math.floor(avgTime % 60);
            document.getElementById('avgTime').textContent = `${minutes}분 ${seconds}초`;
        } else {
            document.getElementById('avgTime').textContent = '-';
        }
    }

    resetStats() {
        if (confirm('통계를 초기화하시겠습니까?\n이 작업은 되돌릴 수 없습니다.')) {
            this.storage.set('stats', { photos: 0, prints: 0, sessions: [] });
            this.loadStats();
            this.showToast('통계가 초기화되었습니다.', 'success');
        }
    }

    updateStats(type, value = 1) {
        const stats = this.storage.get('stats') || { photos: 0, prints: 0, sessions: [] };

        if (type === 'photos') {
            stats.photos += value;
        } else if (type === 'prints') {
            stats.prints += value;
        } else if (type === 'session') {
            stats.sessions.push(value);
            // 최근 100개 세션만 유지
            if (stats.sessions.length > 100) {
                stats.sessions = stats.sessions.slice(-100);
            }
        }

        this.storage.set('stats', stats);
        this.loadStats();
    }

    // 토스트 메시지
    showToast(message, type = 'info') {
        // 기존 토스트 제거
        const existingToast = document.querySelector('.toast');
        if (existingToast) {
            existingToast.remove();
        }

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => toast.classList.add('show'), 10);

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}

// 포토부스 앱 클래스
class PhotoBoothApp {
    constructor() {
        this.currentStep = 1;
        this.selectedFrame = null;
        this.capturedPhotos = [];
        this.stream = null;
        this.isCapturing = false;
        this.captureCount = 0;
        this.captureTimer = null;
        this.countdownTimer = null;
        this.sessionStartTime = null;
        this.storage = new StorageManager();
        this.autoCaptureDuration = 3; // 3초 카운트다운
        this.photosNeeded = 4; // 4장 촬영
    }

    init() {
        this.sessionStartTime = Date.now();
        this.reset();
        this.loadUserFrames();
        this.showStep(1);
        this.updateStepIndicator();
        console.log('PhotoBooth 초기화 완료');
    }

    reset() {
        this.currentStep = 1;
        this.selectedFrame = null;
        this.capturedPhotos = [];
        this.captureCount = 0;
        this.isCapturing = false;

        if (this.stream) {
            this.stopCamera();
        }

        // 타이머 정리
        if (this.captureTimer) {
            clearTimeout(this.captureTimer);
        }
        if (this.countdownTimer) {
            clearInterval(this.countdownTimer);
        }
    }

    loadUserFrames() {
        const frames = this.storage.get('frames') || [];
        const frameSelection = document.getElementById('frameSelection');

        if (frames.length === 0) {
            frameSelection.innerHTML = '<div style="color: #666; padding: 40px;">관리자가 프레임을 등록하지 않았습니다.</div>';
            return;
        }

        frameSelection.innerHTML = frames.map(frame => `
            <div class="frame-option" data-id="${frame.id}" onclick="photoApp.selectFrame('${frame.id}')">
                <img src="${frame.data}" alt="${frame.name}">
                <div class="frame-name">${frame.name.replace(/\.[^/.]+$/, '')}</div>
            </div>
        `).join('');
    }

    selectFrame(frameId) {
        // 이전 선택 제거
        document.querySelectorAll('.frame-option').forEach(el => {
            el.classList.remove('selected');
        });

        // 새 선택 추가
        const frameElement = document.querySelector(`.frame-option[data-id="${frameId}"]`);
        if (frameElement) {
            frameElement.classList.add('selected');
            this.selectedFrame = frameId;

            // 다음 버튼 활성화
            const nextBtn = document.querySelector('#step1 .next-btn');
            if (nextBtn) {
                nextBtn.disabled = false;
            }
        }
    }

    showStep(stepNum) {
        // 모든 스텝 숨기기
        for (let i = 1; i <= 4; i++) {
            const step = document.getElementById(`step${i}`);
            if (step) {
                step.classList.add('hidden');
            }
        }

        // 현재 스텝 표시
        const currentStepEl = document.getElementById(`step${stepNum}`);
        if (currentStepEl) {
            currentStepEl.classList.remove('hidden');
        }

        this.currentStep = stepNum;
        this.updateStepIndicator();

        // 스텝별 초기화
        if (stepNum === 2) {
            this.initCamera();
            this.initCapturePreview();
        } else if (stepNum === 3) {
            this.showPreview();
        } else if (stepNum === 4) {
            this.showFinalResult();
        }
    }

    updateStepIndicator() {
        document.querySelectorAll('.step').forEach((step, index) => {
            const stepNum = index + 1;
            step.classList.remove('active', 'completed');

            if (stepNum === this.currentStep) {
                step.classList.add('active');
            } else if (stepNum < this.currentStep) {
                step.classList.add('completed');
            }
        });
    }

    nextStep() {
        if (this.currentStep < 4) {
            this.showStep(this.currentStep + 1);
        }
    }

    previousStep() {
        if (this.currentStep > 1) {
            this.showStep(this.currentStep - 1);
        }
    }

    // 카메라 관련 메서드
    async initCamera() {
        try {
            const video = document.getElementById('video');

            this.stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: {ideal: 1920},
                    height: {ideal: 1080},
                    facingMode: 'user'
                }
            });

            video.srcObject = this.stream;

            // 비디오 메타데이터 로드 후 처리
            video.onloadedmetadata = () => {
                video.play();
                console.log('카메라 준비 완료');
            };

        } catch (error) {
            console.error('카메라 초기화 실패:', error);
            app.showToast('카메라를 사용할 수 없습니다. 권한을 확인해주세요.', 'error');
        }
    }

    stopCamera() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
    }

    initCapturePreview() {
        const preview = document.getElementById('capturedPreview');
        preview.innerHTML = '';

        for (let i = 0; i < this.photosNeeded; i++) {
            const thumb = document.createElement('div');
            thumb.className = 'captured-photo-thumb empty';
            thumb.id = `thumb-${i}`;
            thumb.innerHTML = `<span>${i + 1}</span>`;
            preview.appendChild(thumb);
        }
    }

    // 자동 연속 촬영 시작
    startAutoCapture() {
        if (this.isCapturing) return;

        this.isCapturing = true;
        this.captureCount = 0;
        this.capturedPhotos = [];

        // 버튼 상태 변경
        const captureBtn = document.getElementById('captureBtn');
        captureBtn.disabled = true;
        captureBtn.classList.add('capturing');

        // 첫 촬영 시작
        this.captureNextPhoto();
    }

    captureNextPhoto() {
        if (this.captureCount >= this.photosNeeded) {
            this.finishCapture();
            return;
        }

        // 현재 촬영 번호 업데이트
        document.getElementById('currentPhoto').textContent = this.captureCount + 1;

        // 카운트다운 시작
        this.startCountdown(() => {
            this.takePhoto();
            this.captureCount++;

            // 다음 촬영 예약
            if (this.captureCount < this.photosNeeded) {
                this.captureTimer = setTimeout(() => {
                    this.captureNextPhoto();
                }, 1500); // 1.5초 대기 후 다음 촬영
            } else {
                this.finishCapture();
            }
        });
    }

    startCountdown(callback) {
        const countdownEl = document.getElementById('countdown');
        let count = this.autoCaptureDuration;

        countdownEl.textContent = count;
        countdownEl.classList.add('show');

        this.countdownTimer = setInterval(() => {
            count--;
            if (count > 0) {
                countdownEl.textContent = count;
            } else {
                clearInterval(this.countdownTimer);
                countdownEl.classList.remove('show');
                callback();
            }
        }, 1000);
    }

    takePhoto() {
        const video = document.getElementById('video');
        const canvas = document.getElementById('canvas');
        const context = canvas.getContext('2d');

        // 캔버스 크기를 비디오와 동일하게 설정
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // 좌우 반전하여 그리기 (미러 효과)
        context.save();
        context.scale(-1, 1);
        context.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
        context.restore();

        // 이미지 데이터 저장
        const photoData = canvas.toDataURL('image/jpeg', 0.95);
        this.capturedPhotos.push({
            id: `photo_${Date.now()}_${this.captureCount}`,
            data: photoData,
            index: this.captureCount
        });

        // 썸네일 업데이트
        this.updateThumbnail(this.captureCount, photoData);

        // 플래시 효과
        this.flashEffect();

        // 셔터 사운드 (옵션)
        this.playShutterSound();
    }

    updateThumbnail(index, photoData) {
        const thumb = document.getElementById(`thumb-${index}`);
        if (thumb) {
            thumb.classList.remove('empty');
            thumb.innerHTML = `
                <img src="${photoData}" alt="Photo ${index + 1}">
                <div class="photo-number">${index + 1}</div>
            `;
        }
    }

    flashEffect() {
        const video = document.getElementById('video');
        video.style.animation = 'flash 0.3s ease';
        setTimeout(() => {
            video.style.animation = '';
        }, 300);
    }

    playShutterSound() {
        // 셔터 사운드 재생 (오디오 파일 필요)
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhCCuBzvLZiTYIG2m98OScTgwOUarm7blmFgU7k9n1unEiBC13yO/eizEIHWq+8+OWT');
        audio.volume = 0.3;
        audio.play().catch(e => console.log('Audio play failed:', e));
    }

    finishCapture() {
        this.isCapturing = false;

        // 버튼 상태 복원
        const captureBtn = document.getElementById('captureBtn');
        captureBtn.disabled = false;
        captureBtn.classList.remove('capturing');

        // 건너뛰기 버튼 활성화
        document.getElementById('skipBtn').disabled = false;

        // 통계 업데이트
        app.updateStats('photos', this.photosNeeded);

        // 2초 후 자동으로 다음 단계로
        setTimeout(() => {
            this.nextStep();
        }, 2000);
    }

    skipToNext() {
        if (this.capturedPhotos.length > 0) {
            this.nextStep();
        } else {
            app.showToast('최소 1장 이상 촬영해주세요.', 'error');
        }
    }

    retake() {
        // 특정 사진만 재촬영하거나 전체 재촬영
        if (confirm('다시 촬영하시겠습니까?')) {
            this.capturedPhotos = [];
            this.captureCount = 0;
            this.showStep(2);
        }
    }

    // 미리보기 관련 메서드
    showPreview() {
        const grid = document.getElementById('previewGrid');
        grid.innerHTML = '';

        // 4장 그리드 생성
        for (let i = 0; i < this.photosNeeded; i++) {
            const photo = this.capturedPhotos[i];
            const photoDiv = document.createElement('div');
            photoDiv.className = 'preview-photo';

            if (photo) {
                photoDiv.innerHTML = `
                    <img src="${photo.data}" alt="Photo ${i + 1}">
                    <button class="retake-btn" onclick="photoApp.retakeSingle(${i})" title="재촬영">↻</button>
                `;
            } else {
                photoDiv.innerHTML = '<div class="empty-photo">빈 사진</div>';
            }

            grid.appendChild(photoDiv);
        }

        // 프레임 적용
        this.applyFrameToPreview();
    }

    retakeSingle(index) {
        app.showToast('개별 재촬영은 준비 중입니다.', 'info');
        // TODO: 개별 사진 재촬영 기능 구현
    }

    applyFrameToPreview() {
        const frames = this.storage.get('frames') || [];
        const selectedFrame = frames.find(f => f.id === this.selectedFrame);

        if (selectedFrame) {
            const previewFrame = document.getElementById('previewFrame');
            // 프레임 스타일 적용 (실제 구현 필요)
            console.log('프레임 적용:', selectedFrame.name);
        }
    }

    // 최종 결과 및 출력
    showFinalResult() {
        const finalPreview = document.getElementById('finalPreview');

        // 4컷 합성 이미지 생성
        this.createCollage().then(collageData => {
            finalPreview.innerHTML = `<img src="${collageData}" alt="최종 결과">`;

            // 세션 통계 저장
            const sessionDuration = (Date.now() - this.sessionStartTime) / 1000;
            app.updateStats('session', {duration: sessionDuration, timestamp: new Date().toISOString()});
        });
    }

    async createCollage() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // A4 비율 (3:4)
        const width = 600;
        const height = 800;
        canvas.width = width;
        canvas.height = height;

        // 배경색
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, width, height);

        // 사진 배치 (2x2 그리드)
        const photoWidth = width / 2 - 20;
        const photoHeight = height / 2 - 20;
        const padding = 10;

        for (let i = 0; i < 4; i++) {
            if (this.capturedPhotos[i]) {
                const img = new Image();
                img.src = this.capturedPhotos[i].data;

                await new Promise((resolve) => {
                    img.onload = () => {
                        const x = (i % 2) * (photoWidth + padding) + padding;
                        const y = Math.floor(i / 2) * (photoHeight + padding) + padding;

                        ctx.drawImage(img, x, y, photoWidth, photoHeight);
                        resolve();
                    };
                });
            }
        }

        // QR 코드 추가 (옵션)
        await this.addQRToCollage(ctx, width, height);

        return canvas.toDataURL('image/jpeg', 0.95);
    }

    async addQRToCollage(ctx, canvasWidth, canvasHeight) {
        const qrSettings = this.storage.get('qrSettings');
        if (qrSettings && qrSettings.url) {
            // QR 코드를 캔버스에 추가
            // 실제 구현은 QR 라이브러리 사용
            console.log('QR 코드 추가:', qrSettings.url);
        }
    }

    print() {
        window.print();
        app.updateStats('prints', 1);
        app.showToast('인쇄를 시작합니다.', 'success');
    }

    download() {
        const link = document.createElement('a');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        link.download = `life4cut_${timestamp}.jpg`;

        // 최종 이미지 가져오기
        const finalImage = document.querySelector('#finalPreview img');
        if (finalImage) {
            link.href = finalImage.src;
            link.click();
            app.showToast('다운로드를 시작합니다.', 'success');
        } else {
            app.showToast('다운로드할 이미지가 없습니다.', 'error');
        }
    }

    shareViaQR() {
        const modal = document.getElementById('qrModal');
        const qrSettings = this.storage.get('qrSettings');

        if (!qrSettings || !qrSettings.url) {
            app.showToast('QR 설정이 필요합니다. 관리자에게 문의하세요.', 'error');
            return;
        }

        // 이미지를 임시 저장하고 공유 링크 생성
        this.generateShareLink().then(shareUrl => {
            // QR 코드 생성
            const qrDiv = document.getElementById('shareQRCode');
            qrDiv.innerHTML = '';

            new QRCode(qrDiv, {
                text: shareUrl,
                width: 256,
                height: 256,
                colorDark: '#000000',
                colorLight: '#ffffff',
                correctLevel: QRCode.CorrectLevel.H
            });

            // 모달 표시
            modal.classList.add('show');

            // 24시간 후 자동 삭제 스케줄
            this.scheduleAutoDeletion(shareUrl);
        });
    }

    async generateShareLink() {
        const finalImage = document.querySelector('#finalPreview img');
        if (!finalImage) return null;

        // 실제 구현에서는 서버에 업로드하거나 Google Drive API 사용
        const qrSettings = this.storage.get('qrSettings');
        const shareId = `share_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // 임시 저장 (실제로는 서버나 클라우드에 저장)
        const shareData = {
            id: shareId,
            image: finalImage.src,
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24시간 후
            googleDriveFolder: qrSettings.googleDriveFolder
        };

        // localStorage에 임시 저장
        const shares = this.storage.get('shares') || [];
        shares.push(shareData);
        this.storage.set('shares', shares);

        // Google Drive 업로드 (옵션)
        if (qrSettings.googleDriveFolder) {
            this.uploadToGoogleDrive(shareData);
        }

        // 공유 URL 생성
        const baseUrl = qrSettings.url || window.location.origin;
        return `${baseUrl}?share=${shareId}`;
    }

    async uploadToGoogleDrive(shareData) {
        // Google Drive API 사용하여 업로드
        // 실제 구현 시 Google API 클라이언트 라이브러리 필요
        console.log('Google Drive 업로드 준비:', shareData.googleDriveFolder);

        // 예시 코드 (실제 구현 필요)
        /*
        const file = await this.dataURLtoFile(shareData.image, 'life4cut.jpg');
        const metadata = {
            name: `life4cut_${shareData.id}.jpg`,
            parents: [shareData.googleDriveFolder]
        };

        const form = new FormData();
        form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
        form.append('file', file);

        // Google Drive API 호출
        */
    }

    dataURLtoFile(dataurl, filename) {
        const arr = dataurl.split(',');
        const mime = arr[0].match(/:(.*?);/)[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);

        while(n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }

        return new File([u8arr], filename, { type: mime });
    }

    scheduleAutoDeletion(shareUrl) {
        // 24시간 후 자동 삭제
        setTimeout(() => {
            this.deleteShare(shareUrl);
        }, 24 * 60 * 60 * 1000);

        // 또는 서버에서 cron job으로 처리
        console.log('24시간 후 자동 삭제 예약:', shareUrl);
    }

    deleteShare(shareUrl) {
        let shares = this.storage.get('shares') || [];
        const shareId = shareUrl.split('share=')[1];
        shares = shares.filter(s => s.id !== shareId);
        this.storage.set('shares', shares);
        console.log('공유 링크 삭제됨:', shareId);
    }

    closeQRModal() {
        const modal = document.getElementById('qrModal');
        modal.classList.remove('show');
    }

    restart() {
        if (confirm('처음부터 다시 시작하시겠습니까?')) {
            this.reset();
            this.init();
        }
    }
}

// 공유 링크 처리 (페이지 로드 시)
function handleShareLink() {
    const urlParams = new URLSearchParams(window.location.search);
    const shareId = urlParams.get('share');

    if (shareId) {
        const storage = new StorageManager();
        const shares = storage.get('shares') || [];
        const shareData = shares.find(s => s.id === shareId);

        if (shareData) {
            // 만료 확인
            const expiresAt = new Date(shareData.expiresAt);
            if (expiresAt > new Date()) {
                // 공유된 이미지 표시
                displaySharedImage(shareData);
            } else {
                // 만료된 링크
                alert('이 링크는 만료되었습니다.');
                // 만료된 데이터 삭제
                const updatedShares = shares.filter(s => s.id !== shareId);
                storage.set('shares', updatedShares);
            }
        } else {
            alert('유효하지 않은 공유 링크입니다.');
        }
    }
}

function displaySharedImage(shareData) {
    // 공유된 이미지를 표시하는 특별한 뷰 생성
    document.body.innerHTML = `
        <div style="text-align: center; padding: 20px;">
            <h1>Life4Cut 공유 사진</h1>
            <img src="${shareData.image}" style="max-width: 100%; height: auto; margin: 20px 0;">
            <p>이 사진은 ${new Date(shareData.expiresAt).toLocaleString()}에 자동으로 삭제됩니다.</p>
            <button onclick="downloadSharedImage('${shareData.image}')" style="padding: 10px 20px; font-size: 16px; margin: 10px;">
                💾 다운로드
            </button>
        </div>
    `;
}

function downloadSharedImage(imageData) {
    const link = document.createElement('a');
    link.download = `life4cut_shared_${Date.now()}.jpg`;
    link.href = imageData;
    link.click();
}

// 자동 삭제 스케줄러 (서버리스 환경용)
class AutoDeleteScheduler {
    constructor() {
        this.storage = new StorageManager();
        this.checkInterval = 60 * 60 * 1000; // 1시간마다 체크
        this.startScheduler();
    }

    startScheduler() {
        // 페이지가 열려있는 동안만 작동
        setInterval(() => {
            this.checkExpiredShares();
        }, this.checkInterval);

        // 초기 체크
        this.checkExpiredShares();
    }

    checkExpiredShares() {
        const shares = this.storage.get('shares') || [];
        const now = new Date();

        const activeShares = shares.filter(share => {
            const expiresAt = new Date(share.expiresAt);
            if (expiresAt <= now) {
                console.log('만료된 공유 삭제:', share.id);
                return false;
            }
            return true;
        });

        if (activeShares.length !== shares.length) {
            this.storage.set('shares', activeShares);
            console.log(`${shares.length - activeShares.length}개의 만료된 공유가 삭제되었습니다.`);
        }
    }
}

// Service Worker 등록 (PWA)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('Service Worker 등록 성공:', registration);
            })
            .catch(error => {
                console.log('Service Worker 등록 실패:', error);
            });
    });
}

// 앱 초기화
let app;
let photoApp;
let autoDeleteScheduler;

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM 로드 완료, Life4Cut 초기화');

    // 공유 링크 체크
    handleShareLink();

    // 메인 앱 초기화
    if (!window.location.search.includes('share=')) {
        app = new Life4CutApp();
        window.app = app;

        // 자동 삭제 스케줄러 시작
        autoDeleteScheduler = new AutoDeleteScheduler();
    }
});

// 전역 에러 핸들러
window.addEventListener('error', (event) => {
    console.error('전역 오류:', event.error);
    if (app) {
        app.showToast('오류가 발생했습니다. 페이지를 새로고침하세요.', 'error');
    }
});

// 페이지 나가기 전 확인
window.addEventListener('beforeunload', (event) => {
    if (photoApp && photoApp.isCapturing) {
        event.preventDefault();
        event.returnValue = '촬영 중입니다. 페이지를 나가시겠습니까?';
        return event.returnValue;
    }
});

// PWA 설치 프롬프트
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;

    // 설치 버튼 표시 (옵션)
    console.log('PWA 설치 가능');
});

// 네트워크 상태 감지
window.addEventListener('online', () => {
    if (app) {
        app.showToast('온라인 상태입니다.', 'success');
    }
});

window.addEventListener('offline', () => {
    if (app) {
        app.showToast('오프라인 상태입니다. 일부 기능이 제한될 수 있습니다.', 'error');
    }
});

// 디버그 모드 (개발용)
const DEBUG = true;
if (DEBUG) {
    window.debugStorage = () => {
        const storage = new StorageManager();
        console.log('Frames:', storage.get('frames'));
        console.log('QR Settings:', storage.get('qrSettings'));
        console.log('Stats:', storage.get('stats'));
        console.log('Shares:', storage.get('shares'));
    };

    window.clearAllData = () => {
        if (confirm('모든 데이터를 삭제하시겠습니까?')) {
            const storage = new StorageManager();
            storage.clear();
            location.reload();
        }
    };

    console.log('디버그 모드 활성화됨. debugStorage(), clearAllData() 사용 가능');
}