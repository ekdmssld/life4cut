// client/js/components/CaptureMode.js
export default class CaptureMode {
    constructor({ videoEl, canvasEl, onShotsDone, counterEl, thumbsEl }) {
        this.videoEl = videoEl;
        this.canvasEl = canvasEl;
        this.ctx = canvasEl.getContext('2d', { willReadFrequently: true });
        this.onShotsDone = onShotsDone || (()=>{});
        this.counterEl = counterEl;
        this.thumbsEl = thumbsEl;

        this.stream = null;
        this.captures = [];
        this.maxShots = 8;
        this.intervalId = null;
    }

    async startCamera() {
        // HTTPS 혹은 localhost에서만 동작. 파일:// 은 안 됨.
        if (location.protocol === 'http:' && location.hostname !== 'localhost') {
            console.warn('권장: https 또는 localhost');
        }
        if (!navigator.mediaDevices?.getUserMedia) {
            alert('이 브라우저는 카메라를 지원하지 않습니다.');
            return;
        }
        // 해상도는 상황에 맞게 조정(아이패드는 1280x720 권장)
        const constraints = {
            audio: false,
            video: {
                width: { ideal: 1920 }, height: { ideal: 1080 },
                facingMode: 'user' // 맥은 의미 없음, iPad면 전면 카메라
            }
        };
        this.stream = await navigator.mediaDevices.getUserMedia(constraints);
        this.videoEl.srcObject = this.stream;
        this.videoEl.setAttribute('playsinline','');
        await this.videoEl.play();
    }

    stopCamera() {
        if (this.intervalId) { clearInterval(this.intervalId); this.intervalId = null; }
        if (this.stream) {
            this.stream.getTracks().forEach(t => t.stop());
            this.stream = null;
        }
        this.videoEl.srcObject = null;
    }

    async captureOnce() {
        if (!this.stream || this.captures.length >= this.maxShots) return;

        const { videoWidth: w, videoHeight: h } = this.videoEl;
        if (!w || !h) return;

        // 캔버스 크기 동기화 후 draw
        this.canvasEl.width = w;
        this.canvasEl.height = h;
        this.ctx.drawImage(this.videoEl, 0, 0, w, h);

        // Blob으로 저장(품질 조정 가능)
        const blob = await new Promise(res => this.canvasEl.toBlob(res, 'image/jpeg', 0.92));
        const url = URL.createObjectURL(blob);
        this.captures.push({ blob, url });

        // 썸네일 갱신
        const img = new Image();
        img.src = url;
        this.thumbsEl.appendChild(img);

        this.updateCounter();

        if (this.captures.length === this.maxShots) {
            this.onShotsDone(this.captures.slice()); // 8장 완료 콜백
        }
    }

    async autoCapture(intervalMs = 1500) {
        if (!this.stream) return;
        if (this.intervalId) return; // 중복 방지
        // 남은 장 수만큼 자동
        const need = this.maxShots - this.captures.length;
        if (need <= 0) return;

        let left = need;
        await this.captureOnce();
        left--;

        this.intervalId = setInterval(async () => {
            if (left <= 0) {
                clearInterval(this.intervalId);
                this.intervalId = null;
                return;
            }
            await this.captureOnce();
            left--;
        }, intervalMs);
    }

    resetShots() {
        if (this.intervalId) { clearInterval(this.intervalId); this.intervalId = null; }
        this.captures.forEach(c => URL.revokeObjectURL(c.url));
        this.captures = [];
        this.thumbsEl.innerHTML = '';
        this.updateCounter();
    }

    updateCounter() {
        if (this.counterEl) {
            this.counterEl.textContent = `${this.captures.length}/${this.maxShots}`;
        }
    }
}
