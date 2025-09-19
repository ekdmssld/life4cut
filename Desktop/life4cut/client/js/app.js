class PhotoBoothApp {
    constructor() {
        this.currentStep = 1;
        this.selectedPeople = null;
        this.selectedFrame = null;
        this.capturedPhotos = [];
        this.selectedPhotos = [];
        this.stream = null;
        this.countdownTimer = null;

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateStepIndicator();
        this.registerServiceWorker();
    }

    registerServiceWorker() {
        // Service Worker는 로컬 서버에서만 작동합니다
        if ('serviceWorker' in navigator && window.location.protocol === 'http:') {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js')
                    .then(registration => {
                        console.log('Service Worker registered:', registration);
                    })
                    .catch(error => {
                        console.log('Service Worker registration skipped:', error);
                    });
            });
        }
    }

    setupEventListeners() {
        // People selector
        document.querySelectorAll('.people-option').forEach(option => {
            option.addEventListener('click', (e) => {
                document.querySelectorAll('.people-option').forEach(opt => opt.classList.remove('selected'));
                option.classList.add('selected');
                this.selectedPeople = option.dataset.people;
                setTimeout(() => this.nextStep(), 300);
            });
        });

        // Frame selector
        document.querySelectorAll('.frame-option').forEach(option => {
            option.addEventListener('click', (e) => {
                document.querySelectorAll('.frame-option').forEach(opt => opt.classList.remove('selected'));
                option.classList.add('selected');
                this.selectedFrame = option.dataset.frame;
                setTimeout(() => this.nextStep(), 300);
            });
        });
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

    showStep(stepNum) {
        for (let i = 1; i <= 5; i++) {
            const stepEl = document.getElementById(`step${i}`);
            if (stepEl) {
                stepEl.classList.toggle('hidden', i !== stepNum);
            }
        }

        // Initialize camera when entering step 3
        if (stepNum === 3) {
            this.initCamera();
        }

        // Stop camera when leaving step 3
        if (this.currentStep === 3 && stepNum !== 3) {
            this.stopCamera();
        }
    }

    nextStep() {
        if (this.currentStep < 5) {
            this.currentStep++;
            this.updateStepIndicator();
            this.showStep(this.currentStep);

            if (this.currentStep === 4) {
                this.displayCapturedPhotos();
            } else if (this.currentStep === 5) {
                this.displayFinalPreview();
            }
        }
    }

    previousStep() {
        if (this.currentStep > 1) {
            this.currentStep--;
            this.updateStepIndicator();
            this.showStep(this.currentStep);
        }
    }

    async initCamera() {
        try {
            const video = document.getElementById('video');

            // 카메라 권한 요청 및 스트림 획득
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1920 },
                    height: { ideal: 1080 },
                    facingMode: 'user'
                }
            });

            video.srcObject = this.stream;
            this.updatePhotoCount();

        } catch (error) {
            console.error('Camera access error:', error);

            // 에러 메시지를 사용자에게 표시
            const errorMessage = this.getCameraErrorMessage(error);
            alert(errorMessage);
        }
    }

    getCameraErrorMessage(error) {
        if (error.name === 'NotAllowedError') {
            return '카메라 접근이 거부되었습니다.\n\n' +
                '카메라를 사용하려면:\n' +
                '1. 브라우저 주소표시줄의 카메라 아이콘을 클릭하세요\n' +
                '2. "허용"을 선택하세요\n' +
                '3. 페이지를 새로고침하세요';
        } else if (error.name === 'NotFoundError') {
            return '카메라를 찾을 수 없습니다.\n카메라가 연결되어 있는지 확인해주세요.';
        } else if (error.name === 'NotReadableError') {
            return '카메라가 이미 다른 프로그램에서 사용 중입니다.\n다른 프로그램을 종료하고 다시 시도해주세요.';
        } else {
            return `카메라 오류: ${error.message}`;
        }
    }

    stopCamera() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
    }

    capturePhoto() {
        if (this.capturedPhotos.length >= 8) {
            alert('최대 8장까지 촬영 가능합니다.');
            return;
        }

        const countdown = document.getElementById('countdown');
        const captureBtn = document.getElementById('captureBtn');
        captureBtn.disabled = true;

        let count = 3;
        countdown.textContent = count;
        countdown.style.display = 'block';

        this.countdownTimer = setInterval(() => {
            count--;
            if (count > 0) {
                countdown.textContent = count;
            } else {
                clearInterval(this.countdownTimer);
                countdown.style.display = 'none';
                this.takePhoto();
                captureBtn.disabled = false;
            }
        }, 1000);
    }

    takePhoto() {
        const video = document.getElementById('video');
        const canvas = document.getElementById('canvas');
        const context = canvas.getContext('2d');

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Flip horizontally for mirror effect
        context.translate(canvas.width, 0);
        context.scale(-1, 1);
        context.drawImage(video, 0, 0);

        const photoData = canvas.toDataURL('image/jpeg', 0.95);
        this.capturedPhotos.push({
            id: Date.now(),
            data: photoData,
            timestamp: new Date()
        });

        this.updatePhotoCount();

        // Flash effect
        const container = document.querySelector('.camera-container');
        container.style.animation = 'none';
        setTimeout(() => {
            container.style.animation = 'flash 0.3s ease';
        }, 10);

        // Enable next button after minimum photos
        if (this.capturedPhotos.length >= 1) {
            document.getElementById('nextBtn').disabled = false;
        }
    }

    updatePhotoCount() {
        const photoCount = document.getElementById('photoCount');
        photoCount.textContent = `${this.capturedPhotos.length} / 8`;
    }

    displayCapturedPhotos() {
        const grid = document.getElementById('photosGrid');
        grid.innerHTML = '';

        this.capturedPhotos.forEach(photo => {
            const photoItem = document.createElement('div');
            photoItem.className = 'photo-item';
            photoItem.dataset.photoId = photo.id;

            const img = document.createElement('img');
            img.src = photo.data;

            const checkbox = document.createElement('div');
            checkbox.className = 'photo-checkbox';
            checkbox.innerHTML = '✓';

            photoItem.appendChild(img);
            photoItem.appendChild(checkbox);

            photoItem.addEventListener('click', () => this.togglePhotoSelection(photo.id));

            grid.appendChild(photoItem);
        });
    }

    togglePhotoSelection(photoId) {
        const photoItem = document.querySelector(`[data-photo-id="${photoId}"]`);
        const isSelected = photoItem.classList.contains('selected');

        if (isSelected) {
            photoItem.classList.remove('selected');
            this.selectedPhotos = this.selectedPhotos.filter(id => id !== photoId);
        } else {
            if (this.selectedPhotos.length >= 4) {
                alert('최대 4장까지 선택 가능합니다.');
                return;
            }
            photoItem.classList.add('selected');
            this.selectedPhotos.push(photoId);
        }

        document.getElementById('selectNextBtn').disabled = this.selectedPhotos.length === 0;
    }

    displayFinalPreview() {
        const grid = document.getElementById('previewGrid');
        grid.innerHTML = '';

        const selectedPhotoData = this.capturedPhotos.filter(photo =>
            this.selectedPhotos.includes(photo.id)
        );

        selectedPhotoData.forEach(photo => {
            const previewPhoto = document.createElement('div');
            previewPhoto.className = 'preview-photo';

            const img = document.createElement('img');
            img.src = photo.data;

            previewPhoto.appendChild(img);
            grid.appendChild(previewPhoto);
        });
    }

    retakePhotos() {
        this.capturedPhotos = [];
        this.selectedPhotos = [];
        this.currentStep = 3;
        this.updateStepIndicator();
        this.showStep(3);
    }

    print() {
        window.print();
    }

    download() {
        const selectedPhotoData = this.capturedPhotos.filter(photo =>
            this.selectedPhotos.includes(photo.id)
        );

        selectedPhotoData.forEach((photo, index) => {
            const link = document.createElement('a');
            link.download = `photobooth_${index + 1}_${Date.now()}.jpg`;
            link.href = photo.data;
            link.click();
        });
    }

    restart() {
        this.currentStep = 1;
        this.selectedPeople = null;
        this.selectedFrame = null;
        this.capturedPhotos = [];
        this.selectedPhotos = [];
        this.updateStepIndicator();
        this.showStep(1);
    }
}

// Initialize app
const app = new PhotoBoothApp();