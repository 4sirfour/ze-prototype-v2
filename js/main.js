/* Zebit Prototype interactions: mobile menu, modals, tabs, accordion, lang hints */
(function () {
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  /* Mobile menu */
  const hamburger = $('.hamburger');
  const mobileMenu = $('.mobile-menu');
  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('active');
      mobileMenu.classList.toggle('open');
    });
    $$('a', mobileMenu).forEach(a => a.addEventListener('click', () => {
      hamburger.classList.remove('active');
      mobileMenu.classList.remove('open');
    }));
  }

  /* Tabs */
  $$('[data-tabs]').forEach(group => {
    const tabs = $$('[data-tab]', group);
    // scopeRoot = nearest element that wraps both tabs and their panels
    const scopeRoot = group.closest('[data-tab-scope]') || document;
    // basic ARIA semantics for accessibility
    group.setAttribute('role', 'tablist');
    tabs.forEach(t => {
      t.setAttribute('role', 'tab');
      t.setAttribute('aria-selected', t.classList.contains('active') ? 'true' : 'false');
    });
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const key = tab.getAttribute('data-tab');
        tabs.forEach(t => { t.classList.remove('active'); t.setAttribute('aria-selected', 'false'); });
        tab.classList.add('active');
        tab.setAttribute('aria-selected', 'true');
        // hide every panel inside this scope, then reveal the one matching the key
        $$('.tab-panel', scopeRoot).forEach(p => p.classList.remove('active'));
        const panel = $(`[data-panel="${key}"]`, scopeRoot);
        if (panel) panel.classList.add('active');
      });
    });
  });

  /* Accordion */
  $$('.accordion-header').forEach(header => {
    header.addEventListener('click', () => {
      const item = header.parentElement;
      const body = header.nextElementSibling;
      const isOpen = item.classList.contains('open');
      $$('.accordion-item.open').forEach(openItem => {
        openItem.classList.remove('open');
        openItem.querySelector('.accordion-body').style.maxHeight = null;
      });
      if (!isOpen) {
        item.classList.add('open');
        body.style.maxHeight = body.scrollHeight + 'px';
      }
    });
  });

  /* Modals */
  function openModal(id) {
    const modal = $(`#${id}`);
    if (modal) modal.classList.add('open');
  }
  function closeModal(id) {
    const modal = $(`#${id}`);
    if (modal) modal.classList.remove('open');
  }
  $$('[data-modal-open]').forEach(btn => {
    btn.addEventListener('click', () => openModal(btn.getAttribute('data-modal-open')));
  });
  $$('[data-modal-close]').forEach(btn => {
    const target = btn.getAttribute('data-modal-close');
    btn.addEventListener('click', () => {
      if (target) closeModal(target);
      else btn.closest('.modal-overlay').classList.remove('open');
    });
  });
  $$('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', e => {
      if (e.target === overlay) overlay.classList.remove('open');
    });
  });

  /* Market search filter */
  const marketSearch = $('#market-search');
  if (marketSearch) {
    marketSearch.addEventListener('input', e => {
      const term = e.target.value.toLowerCase();
      $$('#markets-table tbody tr:not(.market-empty)').forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(term) ? '' : 'none';
      });
    });
  }

  /* Market category tabs filter */
  const marketTabGroup = $('[data-tabs="market"]');
  const marketRowsAll = $$('#markets-table tbody tr:not(.market-empty)');
  const marketEmptyRow = $('#markets-table tbody .market-empty');
  if (marketTabGroup && marketRowsAll.length) {
    const marketTabs = $$('[data-tab]', marketTabGroup);
    marketTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const key = tab.getAttribute('data-tab');
        let visible = 0;
        marketRowsAll.forEach(row => {
          const sym = (row.querySelector('.sym')?.textContent || '').trim();
          const quote = sym.split('/')[1] || '';
          const isFav = row.hasAttribute('data-fav');
          let show = false;
          if (key === 'market-all') show = true;
          else if (key === 'market-usdt') show = quote === 'USDT';
          else if (key === 'market-btc') show = quote === 'BTC';
          else if (key === 'market-eth') show = quote === 'ETH';
          else if (key === 'market-fav') show = isFav;
          row.style.display = show ? '' : 'none';
          if (show) visible++;
        });
        if (marketEmptyRow) marketEmptyRow.style.display = visible ? 'none' : 'table-row';
      });
    });
  }

  /* Card-grid category tabs (earn, learn) */
  $$('[data-card-grid]').forEach(grid => {
    const scope = grid.parentElement;
    const tabsGroup = scope.querySelector('[data-tabs]');
    const empty = scope.querySelector('.tab-empty');
    const cards = $$('[data-category]', grid);
    if (!tabsGroup || !cards.length) return;
    $$('[data-tab]', tabsGroup).forEach(tab => {
      tab.addEventListener('click', () => {
        const key = tab.getAttribute('data-tab');
        const cat = key.split('-')[1];
        let visible = 0;
        cards.forEach(card => {
          const show = cat === 'all' || card.getAttribute('data-category') === cat;
          card.style.display = show ? '' : 'none';
          if (show) visible++;
        });
        if (empty) empty.style.display = visible ? 'none' : 'block';
      });
    });
  });

  /* Ticker animation pause on hover */
  const ticker = $('.ticker-track');
  if (ticker) {
    ticker.addEventListener('mouseenter', () => ticker.style.animationPlayState = 'paused');
    ticker.addEventListener('mouseleave', () => ticker.style.animationPlayState = 'running');
  }

  /* Sticky active nav marker */
  const current = location.pathname.split('/').pop() || 'index.html';
  $$('a').forEach(a => {
    const href = a.getAttribute('href');
    if (href && href.endsWith(current)) a.classList.add('active');
  });

  /* Floating support chat widget */
  const chatFab = $('.chat-fab');
  const chatPanel = $('.chat-panel');
  if (chatFab && chatPanel) {
    const setChat = (open) => {
      chatPanel.classList.toggle('open', open);
      chatFab.setAttribute('aria-expanded', open ? 'true' : 'false');
    };
    chatFab.addEventListener('click', () => setChat(!chatPanel.classList.contains('open')));
    const chatClose = $('.chat-close');
    if (chatClose) chatClose.addEventListener('click', () => setChat(false));
    document.addEventListener('click', e => {
      if (chatPanel.classList.contains('open') && !chatPanel.contains(e.target) && !chatFab.contains(e.target)) setChat(false);
    });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') setChat(false); });

    /* mock conversation */
    const chatForm = $('.chat-input-row');
    const chatInput = $('#chat-input');
    const chatLog = $('.chat-log');
    if (chatForm && chatInput && chatLog) {
      chatForm.addEventListener('submit', e => {
        e.preventDefault();
        const v = chatInput.value.trim();
        if (!v) return;
        const msg = document.createElement('div');
        msg.className = 'chat-msg user';
        msg.textContent = v;
        chatLog.appendChild(msg);
        chatInput.value = '';
        chatLog.scrollTop = chatLog.scrollHeight;
        setTimeout(() => {
          const reply = document.createElement('div');
          reply.className = 'chat-msg bot';
          reply.textContent = chatLog.getAttribute('data-reply') || 'Thanks! Our team will reply shortly.';
          chatLog.appendChild(reply);
          chatLog.scrollTop = chatLog.scrollHeight;
        }, 700);
      });
    }
  }

  /* Console signature */
  console.log('%c Zebit Prototype ', 'background:#D8B56A;color:#0B1020;padding:4px 8px;border-radius:4px;font-weight:700');
})();
