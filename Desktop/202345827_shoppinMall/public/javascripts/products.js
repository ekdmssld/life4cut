const productsPerPage = 4;
let currentCount = productsPerPage;
const cards = document.querySelectorAll('.product-card');
const total = cards.length;
const btn = document.getElementById('loadMoreBtn');

// 처음에 productsPerPage 개수만 보이게
cards.forEach((card, idx) => {
    card.style.display = idx < productsPerPage ? 'block' : 'none';
});

if (btn) {
    btn.addEventListener('click', function() {
        for (let i = currentCount; i < currentCount + productsPerPage && i < total; i++) {
            cards[i].style.display = 'block';
        }
        currentCount += productsPerPage;
        if (currentCount >= total) btn.disabled = true;
    });
    if (total <= productsPerPage) btn.style.display = 'none';
}