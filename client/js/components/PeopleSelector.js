class PeopleSelector {
    constructor(app) {
        this.app = app;
    }

    render() {
        return `
            <div class="people-selector">
                <div class="content-container">
                    <h2>촬영할 인원수를 선택해주세요</h2>
                    <div class="people-options">
                        ${this.renderPeopleOption(1, '👤', '혼자서')}
                        ${this.renderPeopleOption(2, '👥', '둘이서')}
                        ${this.renderPeopleOption(3, '👥👤', '셋이서')}
                        ${this.renderPeopleOption(4, '👥👥', '넷이서')}
                    </div>
                    <div class="help-text">
                        <p>선택한 인원수에 맞는 프레임으로 촬영됩니다</p>
                    </div>
                </div>
            </div>
        `;
    }

    renderPeopleOption(count, icon, text) {
        const isSelected = this.app.state.peopleCount === count;
        return `
            <div class="people-option ${isSelected ? 'selected' : ''}" 
                 data-count="${count}">
                <div class="icon">${icon}</div>
                <div class="text">${text}</div>
                <div class="count">${count}명</div>
            </div>
        `;
    }

    bindEvents() {
        const options = document.querySelectorAll('.people-option');

        options.forEach(option => {
            option.addEventListener('click', (e) => {
                e.preventDefault();

                // 선택 효과
                options.forEach(opt => opt.classList.remove('selected'));
                option.classList.add('selected');

                // 클릭 애니메이션
                option.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    option.style.transform = 'scale(1)';
                }, 150);

                const count = parseInt(option.dataset.count);

                // 다음 단계로 이동 (약간의 지연)
                setTimeout(() => {
                    this.app.showStep('frame-select', { peopleCount: count });
                }, 500);
            });

            // 터치 피드백
            option.addEventListener('touchstart', (e) => {
                option.classList.add('touching');
            });

            option.addEventListener('touchend', (e) => {
                option.classList.remove('touching');
            });
        });
    }
}