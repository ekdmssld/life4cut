const ApiClient = {
    baseURL: window.location.origin,

    async request(method, endpoint, data = null) {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        if (data) {
            options.body = JSON.stringify(data);
        }

        try {
            const response = await fetch(`${this.baseURL}${endpoint}`, options);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    },

    // 이미지 업로드
    async uploadImage(imageData) {
        const formData = new FormData();
        const blob = this.dataURLtoBlob(imageData);
        formData.append('image', blob, 'photo.jpg');

        try {
            const response = await fetch(`${this.baseURL}/api/upload`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error('Upload failed');
            }

            return await response.json();
        } catch (error) {
            console.error('Image upload failed:', error);
            // 오프라인 모드에서는 로컬 스토리지 사용
            return { url: imageData, offline: true };
        }
    },

    dataURLtoBlob(dataURL) {
        const arr = dataURL.split(',');
        const mime = arr[0].match(/:(.*?);/)[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);

        while(n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }

        return new Blob([u8arr], { type: mime });
    },

    // Google Drive 업로드 (스텁)
    async uploadToGoogleDrive(imageData, folderId) {
        console.log('Google Drive 업로드 준비:', folderId);
        // 실제 구현은 Google API 클라이언트 필요
        return { success: false, message: 'Google Drive API not configured' };
    }
};