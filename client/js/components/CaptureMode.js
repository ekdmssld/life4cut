// CaptureMode.js - 카메라 캡처 관련 기능

// export 문법 제거 (브라우저 직접 실행용)
const CaptureMode = {
    stream: null,
    isCapturing: false,
    captureCount: 0,
    capturedPhotos: [],
    photosNeeded: 4,
    autoCaptureDuration: 3,

    // 카메라 초기화
    async initCamera() {
        try {
            const video = document.getElementById('video');
            if (!video) {
                console.error('비디오 엘리먼트를 찾을 수 없습니다.');
                return false;
            }

            // 기존 스트림 정리
            if (this.stream) {
                this.stopCamera();
            }

            // 카메라 권한 요청
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1920, min: 1280 },
                    height: { ideal: 1080, min: 720 },
                    facingMode: 'user'
                }
            });

            video.srcObject = this.stream;

            // 비디오 메타데이터 로드 대기
            return new Promise((resolve) => {
                video.onloadedmetadata = () => {
                    video.play();
                    console.log('카메라 초기화 완료');
                    resolve(true);
                };
            });

        } catch (error) {
            console.error('카메라 초기화 실패:', error);
            this.handleCameraError(error);
            return false;
        }
    },

    // 카메라 에러 처리
    handleCameraError(error) {
        let message = '카메라를 사용할 수 없습니다.';

        if (error.name === 'NotAllowedError') {
            message = '카메라 접근이 거부되었습니다. 브라우저 설정에서 카메라 권한을 허용해주세요.';
        } else if (error.name === 'NotFoundError') {
            message = '카메라를 찾을 수 없습니다. 카메라가 연결되어 있는지 확인해주세요.';
        } else if (error.name === 'NotReadableError') {
            message = '카메라가 이미 다른 프로그램에서 사용 중입니다.';
        } else if (error.name === 'OverconstrainedError') {
            message = '요청한 카메라 설정을 지원하지 않습니다.';
        }

        if (window.app && window.app.showToast) {
            window.app.showToast(message, 'error');
        } else {
            alert(message);
        }
    },

    // 카메라 정지
    stopCamera() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => {
                track.stop();
            });
            this.stream = null;
            console.log('카메라 정지됨');
        }
    },

    // 자동 연속 촬영 시작
    startAutoCapture() {
        if (this.isCapturing) {
            console.log('이미 촬영 중입니다.');
            return;
        }

        this.isCapturing = true;
        this.captureCount = 0;
        this.capturedPhotos = [];

        // UI 업데이트
        this.updateCaptureUI(true);

        // 첫 촬영 시작
        this.captureNextPhoto();
    },

    // 다음 사진 촬영
    captureNextPhoto() {
        if (this.captureCount >= this.photosNeeded) {
            this.finishCapture();
            return;
        }

        // 현재 촬영 번호 업데이트
        const currentPhotoEl = document.getElementById('currentPhoto');
        if (currentPhotoEl) {
            currentPhotoEl.textContent = this.captureCount + 1;
        }

        // 카운트다운 시작
        this.startCountdown(() => {
            this.takePhoto();
            this.captureCount++;

            // 다음 촬영 예약
            if (this.captureCount < this.photosNeeded) {
                setTimeout(() => {
                    this.captureNextPhoto();
                }, 1500); // 1.5초 대기 후 다음 촬영
            } else {
                this.finishCapture();
            }
        });
    },

    // 카운트다운
    startCountdown(callback) {
        const countdownEl = document.getElementById('countdown');
        if (!countdownEl) {
            callback();
            return;
        }

        let count = this.autoCaptureDuration;
        countdownEl.textContent = count;
        countdownEl.classList.add('show');

        const countdownInterval = setInterval(() => {
            count--;
            if (count > 0) {
                countdownEl.textContent = count;
            } else {
                clearInterval(countdownInterval);
                countdownEl.classList.remove('show');
                callback();
            }
        }, 1000);
    },

    // 사진 촬영
    takePhoto() {
        const video = document.getElementById('video');
        const canvas = document.getElementById('canvas');

        if (!video || !canvas) {
            console.error('비디오 또는 캔버스 엘리먼트를 찾을 수 없습니다.');
            return;
        }

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

        // 효과
        this.playEffects();
    },

    // 썸네일 업데이트
    updateThumbnail(index, photoData) {
        const thumb = document.getElementById(`thumb-${index}`);
        if (thumb) {
            thumb.classList.remove('empty');
            thumb.innerHTML = `
                <img src="${photoData}" alt="Photo ${index + 1}">
                <div class="photo-number">${index + 1}</div>
            `;
        }
    },

    // 촬영 효과
    playEffects() {
        // 플래시 효과
        const video = document.getElementById('video');
        if (video) {
            video.classList.add('flash-effect');
            setTimeout(() => {
                video.classList.remove('flash-effect');
            }, 300);
        }

        // 셔터 사운드
        this.playShutterSound();
    },

    // 셔터 사운드
    playShutterSound() {
        try {
            // Base64 인코딩된 짧은 클릭 사운드
            const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhCCuBzvLZiTYIG2m98OScTgwOUarm7blmFgU7k9n1unEiBC13yO/eizEIHWq+8+OWT');
            audio.volume = 0.3;
            audio.play().catch(e => console.log('오디오 재생 실패:', e));
        } catch (e) {
            console.log('셔터 사운드 재생 실패:', e);
        }
    },

    // 촬영 완료
    finishCapture() {
        this.isCapturing = false;

        // UI 업데이트
        this.updateCaptureUI(false);

        // 통계 업데이트
        if (window.app && window.app.updateStats) {
            window.app.updateStats('photos', this.photosNeeded);
        }

        // 완료 메시지
        if (window.app && window.app.showToast) {
            window.app.showToast('촬영이 완료되었습니다!', 'success');
        }

        // 2초 후 자동으로 다음 단계로
        setTimeout(() => {
            if (window.photoApp && window.photoApp.nextStep) {
                window.photoApp.nextStep();
            }
        }, 2000);
    },

    // UI 업데이트
    updateCaptureUI(isCapturing) {
        const captureBtn = document.getElementById('captureBtn');
        const skipBtn = document.getElementById('skipBtn');

        if (captureBtn) {
            captureBtn.disabled = isCapturing;
            if (isCapturing) {
                captureBtn.classList.add('capturing');
            } else {
                captureBtn.classList.remove('capturing');
            }
        }

        if (skipBtn) {
            skipBtn.disabled = !this.capturedPhotos.length;
        }
    },

    // 촬영된 사진 가져오기
    getCapturedPhotos() {
        return this.capturedPhotos;
    },

    // 초기화
    reset() {
        this.stopCamera();
        this.isCapturing = false;
        this.captureCount = 0;
        this.capturedPhotos = [];
    }
};