// FrameSelector.js - 프레임 선택 컴포넌트
const FrameSelector = {
    selectedFrame: null,
    frames: [],

    loadFrames() {
        const storage = window.app ? window.app.storage : new StorageManager();
        this.frames = storage.get('frames') || [];
        return this.frames;
    },

    renderFrames(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        if (this.frames.length === 0) {
            container.innerHTML = '<div style="color: #666; padding: 40px; text-align: center;">관리자가 프레임을 등록하지 않았습니다.</div>';
            return;
        }

        container.innerHTML = this.frames.map(frame => `
            <div class="frame-option" data-id="${frame.id}">
                <img src="${frame.data}" alt="${frame.name}">
                <div class="frame-name">${frame.name.replace(/\.[^/.]+$/, '')}</div>
            </div>
        `).join('');

        // 이벤트 리스너 추가
        container.querySelectorAll('.frame-option').forEach(el => {
            el.addEventListener('click', () => this.selectFrame(el.dataset.id));
        });
    },

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
    },

    getSelectedFrame() {
        return this.frames.find(f => f.id === this.selectedFrame);
    }
};

// PhotoSelector.js - 사진 선택 컴포넌트
const PhotoSelector = {
    selectedPhotos: [],
    maxSelection: 4,

    renderPhotos(photos, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = photos.map((photo, index) => `
            <div class="photo-item" data-index="${index}">
                <img src="${photo.data}" alt="Photo ${index + 1}">
                <div class="photo-checkbox">
                    <span>${index + 1}</span>
                </div>
            </div>
        `).join('');

        // 이벤트 리스너 추가
        container.querySelectorAll('.photo-item').forEach(el => {
            el.addEventListener('click', () => this.toggleSelection(parseInt(el.dataset.index)));
        });
    },

    toggleSelection(index) {
        const photoItem = document.querySelector(`.photo-item[data-index="${index}"]`);
        if (!photoItem) return;

        if (this.selectedPhotos.includes(index)) {
            // 선택 해제
            this.selectedPhotos = this.selectedPhotos.filter(i => i !== index);
            photoItem.classList.remove('selected');
        } else {
            // 선택 추가
            if (this.selectedPhotos.length < this.maxSelection) {
                this.selectedPhotos.push(index);
                photoItem.classList.add('selected');
            } else {
                if (window.app && window.app.showToast) {
                    window.app.showToast(`최대 ${this.maxSelection}장까지 선택 가능합니다.`, 'error');
                }
            }
        }

        this.updateSelectionUI();
    },

    updateSelectionUI() {
        const selectBtn = document.getElementById('selectBtn');
        if (selectBtn) {
            selectBtn.disabled = this.selectedPhotos.length === 0;
            selectBtn.textContent = `선택 완료 (${this.selectedPhotos.length}/${this.maxSelection})`;
        }
    },

    getSelectedPhotos(allPhotos) {
        return this.selectedPhotos.map(index => allPhotos[index]);
    },

    reset() {
        this.selectedPhotos = [];
    }
};

// FinalPreview.js - 최종 미리보기 컴포넌트
const FinalPreview = {
    collageCanvas: null,
    collageData: null,

    async createCollage(photos, frame) {
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

        // 4장 사진 그리기
        for (let i = 0; i < 4; i++) {
            if (photos[i]) {
                await this.drawPhoto(ctx, photos[i], {
                    x: (i % 2) * (photoWidth + padding) + padding,
                    y: Math.floor(i / 2) * (photoHeight + padding) + padding,
                    width: photoWidth,
                    height: photoHeight
                });
            }
        }

        // 프레임 적용 (있는 경우)
        if (frame) {
            await this.applyFrame(ctx, frame, width, height);
        }

        // QR 코드 추가
        await this.addQRCode(ctx, width, height);

        this.collageCanvas = canvas;
        this.collageData = canvas.toDataURL('image/jpeg', 0.95);
        return this.collageData;
    },

    async drawPhoto(ctx, photo, dimensions) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                ctx.drawImage(img, dimensions.x, dimensions.y, dimensions.width, dimensions.height);
                resolve();
            };
            img.src = photo.data;
        });
    },

    async applyFrame(ctx, frame, canvasWidth, canvasHeight) {
        // 프레임 오버레이 적용
        return new Promise((resolve) => {
            const frameImg = new Image();
            frameImg.onload = () => {
                ctx.drawImage(frameImg, 0, 0, canvasWidth, canvasHeight);
                resolve();
            };
            frameImg.onerror = () => resolve();
            frameImg.src = frame.data;
        });
    },

    async addQRCode(ctx, canvasWidth, canvasHeight) {
        const storage = window.app ? window.app.storage : new StorageManager();
        const qrSettings = storage.get('qrSettings');

        if (qrSettings && qrSettings.url) {
            // QR 코드 위치 (하단 우측)
            const qrSize = 100;
            const qrX = canvasWidth - qrSize - 20;
            const qrY = canvasHeight - qrSize - 20;

            // QR 배경
            ctx.fillStyle = 'white';
            ctx.fillRect(qrX - 5, qrY - 5, qrSize + 10, qrSize + 10);

            // QR 코드 그리기 (실제 구현은 QRCode 라이브러리 사용)
            ctx.fillStyle = '#000000';
            ctx.font = '10px Arial';
            ctx.fillText('QR', qrX + qrSize/2 - 10, qrY + qrSize/2);

            // QR 텍스트 (있는 경우)
            if (qrSettings.text) {
                ctx.fillStyle = '#333333';
                ctx.font = '12px Arial';
                ctx.fillText(qrSettings.text, qrX, qrY + qrSize + 15);
            }
        }
    },

    renderPreview(containerId) {
        const container = document.getElementById(containerId);
        if (!container || !this.collageData) return;

        container.innerHTML = `<img src="${this.collageData}" alt="최종 결과" style="width: 100%; height: auto;">`;
    },

    getCollageData() {
        return this.collageData;
    }
};

// PrintProgress.js - 인쇄 진행 상태 컴포넌트
const PrintProgress = {
    isPrinting: false,
    printQueue: [],

    addToPrintQueue(imageData) {
        this.printQueue.push({
            id: Date.now(),
            data: imageData,
            status: 'pending',
            timestamp: new Date().toISOString()
        });
    },

    print(imageData) {
        if (this.isPrinting) {
            this.addToPrintQueue(imageData);
            this.showQueueStatus();
            return;
        }

        this.isPrinting = true;
        this.showPrintProgress();

        // 인쇄용 페이지 생성
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>인생네컷 인쇄</title>
                <style>
                    @media print {
                        body { margin: 0; }
                        img { 
                            width: 100%; 
                            max-width: 10cm;
                            height: auto;
                            page-break-after: avoid;
                        }
                        @page {
                            size: 10cm 15cm;
                            margin: 0;
                        }
                    }
                </style>
            </head>
            <body>
                <img src="${imageData}" alt="Life4Cut">
                <script>
                    window.onload = function() {
                        window.print();
                        window.onafterprint = function() {
                            window.close();
                        };
                    };
                </script>
            </body>
            </html>
        `);

        // 인쇄 완료 처리
        setTimeout(() => {
            this.isPrinting = false;
            this.hidePrintProgress();
            this.processQueue();
        }, 5000);

        // 통계 업데이트
        if (window.app && window.app.updateStats) {
            window.app.updateStats('prints', 1);
        }
    },

    showPrintProgress() {
        const progressDiv = document.createElement('div');
        progressDiv.id = 'printProgress';
        progressDiv.className = 'print-progress-modal';
        progressDiv.innerHTML = `
            <div class="print-progress-content">
                <div class="spinner"></div>
                <h3>인쇄 중...</h3>
                <p>프린터로 전송 중입니다. 잠시만 기다려주세요.</p>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: 0%"></div>
                </div>
            </div>
        `;
        document.body.appendChild(progressDiv);

        // 프로그레스 애니메이션
        let progress = 0;
        const progressInterval = setInterval(() => {
            progress += 10;
            const fill = progressDiv.querySelector('.progress-fill');
            if (fill) {
                fill.style.width = `${Math.min(progress, 90)}%`;
            }
            if (progress >= 90) {
                clearInterval(progressInterval);
            }
        }, 400);
    },

    hidePrintProgress() {
        const progressDiv = document.getElementById('printProgress');
        if (progressDiv) {
            progressDiv.remove();
        }
    },

    showQueueStatus() {
        if (window.app && window.app.showToast) {
            window.app.showToast(`인쇄 대기열에 추가되었습니다. (대기: ${this.printQueue.length}개)`, 'info');
        }
    },

    processQueue() {
        if (this.printQueue.length > 0 && !this.isPrinting) {
            const nextPrint = this.printQueue.shift();
            this.print(nextPrint.data);
        }
    }
};

// PeopleSelector.js - 인원 선택 컴포넌트 (추가)
const PeopleSelector = {
    selectedPeople: null,

    renderOptions(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const options = [
            { value: 1, icon: '👤', label: '1명' },
            { value: 2, icon: '👥', label: '2명' },
            { value: 3, icon: '👨‍👩‍👦', label: '3명' },
            { value: 4, icon: '👨‍👩‍👧‍👦', label: '4명 이상' }
        ];

        container.innerHTML = options.map(opt => `
            <div class="people-option" data-value="${opt.value}">
                <div class="icon">${opt.icon}</div>
                <div>${opt.label}</div>
            </div>
        `).join('');

        // 이벤트 리스너 추가
        container.querySelectorAll('.people-option').forEach(el => {
            el.addEventListener('click', () => this.selectPeople(parseInt(el.dataset.value)));
        });
    },

    selectPeople(value) {
        // 이전 선택 제거
        document.querySelectorAll('.people-option').forEach(el => {
            el.classList.remove('selected');
        });

        // 새 선택 추가
        const element = document.querySelector(`.people-option[data-value="${value}"]`);
        if (element) {
            element.classList.add('selected');
            this.selectedPeople = value;

            // 자동으로 다음 단계로
            setTimeout(() => {
                if (window.photoApp && window.photoApp.nextStep) {
                    window.photoApp.nextStep();
                }
            }, 300);
        }
    },

    getSelectedPeople() {
        return this.selectedPeople;
    }
};