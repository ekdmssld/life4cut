// DOM 유틸리티
const $ = (selector) => document.querySelector(selector);
const $ = (selector) => document.querySelectorAll(selector);

// 이벤트 유틸리티
const on = (element, event, callback) => {
    if (typeof element === 'string') {
        element = $(element);
    }
    element?.addEventListener(event, callback);
};

const off = (element, event, callback) => {
    if (typeof element === 'string') {
        element = $(element);
    }
    element?.removeEventListener(event, callback);
};

// 애니메이션 유틸리티
const animate = (element, keyframes, options = {}) => {
    if (typeof element === 'string') {
        element = $(element);
    }

    return element?.animate(keyframes, {
        duration: 300,
        easing: 'ease-out',
        ...options
    });
};

// 이미지 로딩 유틸리티
const loadImage = (src) => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });
};

// 이미지 리사이징 유틸리티
const resizeImage = (file, maxWidth, maxHeight, quality = 0.8) => {
    return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        img.onload = () => {
            // 비율 계산
            let { width, height } = img;

            if (width > height) {
                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }
            } else {
                if (height > maxHeight) {
                    width = (width * maxHeight) / height;
                    height = maxHeight;
                }
            }

            canvas.width = width;
            canvas.height = height;

            // 이미지 그리기
            ctx.drawImage(img, 0, 0, width, height);

            // Base64로 변환
            const dataUrl = canvas.toDataURL('image/jpeg', quality);
            resolve(dataUrl);
        };

        img.src = URL.createObjectURL(file);
    });
};

// 로컬 스토리지 유틸리티 (메모리 기반)
class MemoryStorage {
    constructor() {
        this.storage = new Map();
    }

    setItem(key, value) {
        this.storage.set(key, JSON.stringify(value));
    }

    getItem(key) {
        const value = this.storage.get(key);
        return value ? JSON.parse(value) : null;
    }

    removeItem(key) {
        this.storage.delete(key);
    }

    clear() {
        this.storage.clear();
    }
}

window.memoryStorage = new MemoryStorage();

// 터치 제스처 감지
class TouchGestureDetector {
    constructor(element) {
        this.element = element;
        this.startTouch = null;
        this.isLongPress = false;
        this.longPressTimer = null;

        this.bindEvents();
    }

    bindEvents() {
        this.element.addEventListener('touchstart', this.handleTouchStart.bind(this));
        this.element.addEventListener('touchmove', this.handleTouchMove.bind(this));
        this.element.addEventListener('touchend', this.handleTouchEnd.bind(this));
    }

    handleTouchStart(e) {
        this.startTouch = {
            x: e.touches[0].clientX,
            y: e.touches[0].clientY,
            time: Date.now()
        };

        this.isLongPress = false;
        this.longPressTimer = setTimeout(() => {
            this.isLongPress = true;
            this.onLongPress?.(e);
        }, 1000);
    }

    handleTouchMove(e) {
        if (this.longPressTimer) {
            clearTimeout(this.longPressTimer);
            this.longPressTimer = null;
        }
    }

    handleTouchEnd(e) {
        if (this.longPressTimer) {
            clearTimeout(this.longPressTimer);
            this.longPressTimer = null;
        }

        if (!this.startTouch) return;

        const endTouch = {
            x: e.changedTouches[0].clientX,
            y: e.changedTouches[0].clientY,
            time: Date.now()
        };

        const deltaX = endTouch.x - this.startTouch.x;
        const deltaY = endTouch.y - this.startTouch.y;
        const deltaTime = endTouch.time - this.startTouch.time;

        // 탭 감지
        if (Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10 && deltaTime < 300 && !this.isLongPress) {
            this.onTap?.(e);
        }

        // 스와이프 감지
        if (Math.abs(deltaX) > 50 || Math.abs(deltaY) > 50) {
            const direction = Math.abs(deltaX) > Math.abs(deltaY)
                ? (deltaX > 0 ? 'right' : 'left')
                : (deltaY > 0 ? 'down' : 'up');

            this.onSwipe?.(direction, e);
        }

        this.startTouch = null;
    }
}

// 성능 모니터링
class PerformanceMonitor {
    constructor() {
        this.metrics = {
            frameRate: 0,
            memoryUsage: 0,
            loadTime: 0
        };

        this.startTime = performance.now();
        this.frameCount = 0;
        this.lastFrameTime = this.startTime;

        this.startMonitoring();
    }

    startMonitoring() {
        // FPS 모니터링
        const measureFPS = () => {
            const now = performance.now();
            this.frameCount++;

            if (now - this.lastFrameTime >= 1000) {
                this.metrics.frameRate = this.frameCount;
                this.frameCount = 0;
                this.lastFrameTime = now;
            }

            requestAnimationFrame(measureFPS);
        };

        requestAnimationFrame(measureFPS);

        // 메모리 사용량 모니터링 (가능한 경우)
        if (performance.memory) {
            setInterval(() => {
                this.metrics.memoryUsage = performance.memory.usedJSHeapSize / 1024 / 1024; // MB
            }, 5000);
        }
    }

    getMetrics() {
        return {
            ...this.metrics,
            loadTime: performance.now() - this.startTime
        };
    }
}

// 디바이스 정보
const DeviceInfo = {
    isIOS: /iPad|iPhone|iPod/.test(navigator.userAgent),
    isAndroid: /Android/.test(navigator.userAgent),
    isMobile: /Mobi|Android/i.test(navigator.userAgent),
    isTablet: /iPad/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1),

    getScreenInfo() {
        return {
            width: window.screen.width,
            height: window.screen.height,
            pixelRatio: window.devicePixelRatio || 1,
            orientation: screen.orientation?.type || 'unknown'
        };
    },

    getNetworkInfo() {
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        return {
            effectiveType: connection?.effectiveType || 'unknown',
            downlink: connection?.downlink || 0,
            rtt: connection?.rtt || 0
        };
    }
};

// 전역 헬퍼 객체
window.helpers = {
    $, $, on, off, animate, loadImage, resizeImage,
    TouchGestureDetector, PerformanceMonitor, DeviceInfo
};

// 전역 성능 모니터 시작
window.performanceMonitor = new PerformanceMonitor();

// 콘솔 로그 래퍼 (프로덕션에서는 비활성화 가능)
const log = {
    info: (...args) => console.log('[INFO]', ...args),
    warn: (...args) => console.warn('[WARN]', ...args),
    error: (...args) => console.error('[ERROR]', ...args),
    debug: (...args) => console.debug('[DEBUG]', ...args)
};

window.log = log;