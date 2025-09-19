document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.wishlist-button').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const authenticated = btn.dataset.authenticated === 'true';
            if (!authenticated) {
                alert('♡ 위시리스트는 로그인 후에 사용할 수 있습니다.');
                return;  // UI 변경 없이 종료
            }

            const productId = btn.dataset.productId;
            try {
                const res = await fetch('/wishlist/toggle', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ productId })
                });
                const data = await res.json();
                if (!res.ok) {
                    alert(data.error || '작업에 실패했습니다.');
                    return;  // UI 토글 하지 않음
                }

                // 성공 시에만 active 클래스·SVG fill 토글
                btn.classList.toggle('active', data.added);
                const heart = btn.querySelector('.heart-shape');
                if (heart) heart.setAttribute('fill', data.added ? '#e11d48' : 'none');
            } catch (err) {
                console.error(err);
                alert('네트워크 오류가 발생했습니다.');
            }
        });
    });
});
