(() => {
  // Xóa các nhóm nút nổi cũ ở từng trang (Gọi/FB/scroll...) để toàn website chỉ còn 1 nút Zalo tư vấn.
  document.querySelectorAll('.float-box,.floating,.hv-floating-contact,.hv-store-floating').forEach(el => el.remove());

  const zaloButtons = [...document.querySelectorAll('a.float-zalo')];
  const zaloButton = zaloButtons.shift() || document.createElement('a');
  zaloButtons.forEach(item => item.remove());
  zaloButton.className = 'float-zalo';
  zaloButton.href = 'https://zalo.me/4499562857082296287';
  zaloButton.target = '_blank';
  zaloButton.rel = 'noopener';
  zaloButton.textContent = 'ZALO TƯ VẤN';
  zaloButton.setAttribute('aria-label', 'Nhắn Zalo tư vấn với HV Mobile');
  document.body.append(zaloButton);

  if (!document.getElementById('hv-floating-zalo-style')) {
    const style = document.createElement('style');
    style.id = 'hv-floating-zalo-style';
    style.textContent = `
      .float-zalo{
        position:fixed!important;right:18px!important;bottom:18px!important;z-index:99999!important;
        width:auto!important;height:auto!important;min-width:144px!important;padding:14px 22px!important;
        display:inline-flex!important;align-items:center!important;justify-content:center!important;
        overflow:hidden!important;border:0!important;border-radius:999px!important;
        background:#d4af37!important;color:#111!important;font:700 14px/1.4 Arial,Helvetica,sans-serif!important;
        letter-spacing:0!important;text-transform:none!important;text-decoration:none!important;
        box-shadow:0 10px 24px rgba(0,0,0,.24)!important;
        transform-origin:center!important;isolation:isolate!important;
        animation:hv-zalo-pulse 2.4s ease-in-out infinite!important;
        transition:transform .2s ease,box-shadow .2s ease,background .2s ease!important;
      }
      .float-zalo::before{
        content:"";position:absolute;inset:-35%;z-index:-1;
        background:linear-gradient(115deg,transparent 38%,rgba(255,255,255,.55) 50%,transparent 62%);
        transform:translateX(-75%);animation:hv-zalo-shine 3.2s ease-in-out infinite;
      }
      .float-zalo:hover,.float-zalo:focus-visible{
        background:#e0bd3f!important;transform:translateY(-3px) scale(1.03)!important;
        box-shadow:0 14px 30px rgba(0,0,0,.3)!important;outline:3px solid rgba(212,175,55,.3)!important;
      }
      @keyframes hv-zalo-pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.045)}}
      @keyframes hv-zalo-shine{0%,45%{transform:translateX(-75%)}70%,100%{transform:translateX(75%)}}
      @media(max-width:700px){.float-zalo{right:12px!important;bottom:12px!important;min-width:132px!important;padding:12px 18px!important;font-size:13px!important}}
      @media(prefers-reduced-motion:reduce){.float-zalo,.float-zalo::before{animation:none!important}}
    `;
    document.head.append(style);
  }

  // Cho phép giải nén rồi mở index.html trực tiếp trên Windows mà các link thư mục vẫn hoạt động.
  if (window.location.protocol === 'file:') {
    document.querySelectorAll('a[href]').forEach(link => {
      const href = link.getAttribute('href');
      if (!href || href.startsWith('#') || /^(?:https?:|tel:|mailto:|javascript:)/i.test(href)) return;
      const target = new URL(href, window.location.href);
      if (target.pathname.endsWith('/')) target.pathname += 'index.html';
      link.href = target.href;
    });
  }


  // ================================================================
  //  LUOI AN TOAN: ep lien ket ban do chi nhanh Quang Ngai ve dung ghim.
  //  Neu may chu con phat mot trang HTML cu (link tim theo chu ->
  //  Google nhay sang Duc Pho), doan nay se sua ngay khi trang tai xong.
  //  Khi trang da dung san thi doan nay khong lam gi ca.
  // ================================================================
  (() => {
    const QN_MAP = 'https://www.google.com/maps/place/15.113954,108.810143/@15.113954,108.810143,19z';
    const QN_DIR = 'https://www.google.com/maps/dir/?api=1&destination=15.113954%2C108.810143&travelmode=driving';
    const isDaNang = value => /Tr%E1%BA%A7n\+Cao|Tran\+Cao|Trần\+Cao|Da\+Nang|%C4%90%C3%A0\+N%E1%BA%B5ng|649/i.test(value);

    document.querySelectorAll('a[href*="google.com/maps"]').forEach(link => {
      const href = link.getAttribute('href') || '';
      if (isDaNang(href)) return;
      if (href.includes('15.113954,108.810143') || href.includes('15.113954%2C108.810143')) return;
      link.href = /\/maps\/dir\//.test(href) ? QN_DIR : QN_MAP;
    });

    document.querySelectorAll('script[type="application/ld+json"]').forEach(node => {
      if (!node.textContent.includes('Lê Thánh Tôn')) return;
      node.textContent = node.textContent.replace(
        /"hasMap":\s*"https:\/\/www\.google\.com\/maps\/[^"]*"/g,
        match => (isDaNang(match) ? match : '"hasMap": "' + QN_MAP + '"')
      );
    });
  })();

  const button = document.getElementById('menuBtn');
  const menu = document.getElementById('mobileMenu');
  if (button && menu) {
    button.addEventListener('click', () => {
      const open = menu.classList.toggle('open');
      button.setAttribute('aria-expanded', String(open));
    });
  }
})();
