class ApiClient {
    constructor(baseUrl = 'http://192.168.1.100:3001') {
        this.baseUrl = baseUrl;
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        try {
            const response = await fetch(url, config);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    // Camera API
    async initializeCamera() {
        return this.request('/api/camera/initialize', { method: 'POST' });
    }

    async startLiveview() {
        return this.request('/api/camera/liveview/start', { method: 'POST' });
    }

    async capturePhoto() {
        return this.request('/api/camera/capture', { method: 'POST' });
    }

    async stopLiveview() {
        return this.request('/api/camera/liveview/stop', { method: 'POST' });
    }

    // Photo processing API
    async composePhotos(selectedPhotos, frameTemplate, peopleCount) {
        return this.request('/api/photos/compose', {
            method: 'POST',
            body: JSON.stringify({
                selectedPhotos,
                frameTemplate,
                peopleCount
            })
        });
    }

    async getFrames(peopleCount) {
        return this.request(`/api/frames?count=${peopleCount}`);
    }

    // Print API
    async printPhoto(imageData) {
        return this.request('/api/print', {
            method: 'POST',
            body: JSON.stringify({ imageData })
        });
    }

    async getPrintStatus() {
        return this.request('/api/print/status');
    }

    // Download API
    async generateDownloadLink(photoId) {
        return this.request(`/api/download/generate/${photoId}`, {
            method: 'POST'
        });
    }
}

// 전역 API 클라이언트 인스턴스
window.apiClient = new ApiClient();