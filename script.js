/* ==========================================================================
   Capô Aberto — interatividades (Vanilla JS)
   ========================================================================== */

// Marca que o JS está ativo: o CSS só esconde os elementos animados (.reveal)
// quando esta classe existe, então sem JS a página continua 100% legível.
document.documentElement.classList.add('js');

document.addEventListener('DOMContentLoaded', () => {
  const header = document.getElementById('header');
  const nav = header.querySelector('nav');
  const menuToggle = document.getElementById('menu-toggle');
  const mobileMenu = document.getElementById('mobile-menu');
  const backToTop = document.getElementById('back-to-top');
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ------------------------------------------------------------------------
     1. MENU HAMBÚRGUER (MOBILE)
     ------------------------------------------------------------------------ */

  // Abre o menu: remove o atributo hidden e, no próximo frame, aplica a classe
  // que dispara a transição de altura/opacidade definida no style.css.
  function openMobileMenu() {
    mobileMenu.hidden = false;
    requestAnimationFrame(() => mobileMenu.classList.add('is-open'));
    menuToggle.setAttribute('aria-expanded', 'true');
    menuToggle.setAttribute('aria-label', 'Fechar menu');
  }

  // Fecha o menu e, ao fim da transição, volta a escondê-lo por completo
  // (para que os links não fiquem acessíveis via teclado quando fechado).
  function closeMobileMenu() {
    if (menuToggle.getAttribute('aria-expanded') !== 'true') return;
    mobileMenu.classList.remove('is-open');
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Abrir menu');
    setTimeout(() => {
      if (!mobileMenu.classList.contains('is-open')) mobileMenu.hidden = true;
    }, 350);
  }

  menuToggle.addEventListener('click', () => {
    const isOpen = menuToggle.getAttribute('aria-expanded') === 'true';
    isOpen ? closeMobileMenu() : openMobileMenu();
  });

  // Fecha o menu ao pressionar Esc.
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeMobileMenu();
  });

  // Fecha o menu ao clicar fora do header.
  document.addEventListener('click', (event) => {
    if (!header.contains(event.target)) closeMobileMenu();
  });

  // Se a tela for redimensionada para desktop (>= 1024px), fecha o menu mobile.
  window.matchMedia('(min-width: 1024px)').addEventListener('change', (event) => {
    if (event.matches) closeMobileMenu();
  });

  /* ------------------------------------------------------------------------
     2. NAVEGAÇÃO SUAVE ENTRE SEÇÕES
     ------------------------------------------------------------------------ */

  // Intercepta cliques em qualquer link interno (href="#secao") e rola até a
  // seção descontando a altura do header fixo, para o título não ficar coberto.
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (event) => {
      const id = link.getAttribute('href');
      if (id === '#' || id.length < 2) return;

      const target = document.querySelector(id);
      if (!target) return;

      event.preventDefault();
      closeMobileMenu();
      closeDemo();

      // Usa a altura apenas da barra de navegação (não do menu mobile aberto).
      const offset = nav.offsetHeight + 8;
      const top = target.getBoundingClientRect().top + window.scrollY - offset;

      window.scrollTo({ top: Math.max(top, 0), behavior: prefersReducedMotion ? 'auto' : 'smooth' });

      // Atualiza a URL sem provocar o "pulo" padrão do navegador.
      history.pushState(null, '', id);
    });
  });

  /* ------------------------------------------------------------------------
     3. HEADER COM SOMBRA + BOTÃO "VOLTAR AO TOPO"
     ------------------------------------------------------------------------ */

  function onScroll() {
    const y = window.scrollY;
    header.classList.toggle('is-scrolled', y > 10);
    backToTop.classList.toggle('is-visible', y > 700);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ------------------------------------------------------------------------
     4. LINK ATIVO NO MENU CONFORME A SEÇÃO VISÍVEL
     ------------------------------------------------------------------------ */

  const navLinks = document.querySelectorAll('.nav-link, .mobile-link');
  const sectionIds = [...new Set([...navLinks].map((a) => a.getAttribute('href')))];
  const sections = sectionIds.map((id) => document.querySelector(id)).filter(Boolean);

  if ('IntersectionObserver' in window) {
    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const id = `#${entry.target.id}`;
        navLinks.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === id));
      });
    }, { rootMargin: '-45% 0px -50% 0px' });

    sections.forEach((section) => sectionObserver.observe(section));
  }

  /* ------------------------------------------------------------------------
     5. FAQ — ACCORDION (SANFONA)
     ------------------------------------------------------------------------ */

  const faqItems = document.querySelectorAll('.faq-item');

  // Abre ou fecha um item. A altura é animada via max-height usando o
  // scrollHeight real do conteúdo, então funciona com respostas de qualquer tamanho.
  function setFaqState(item, open) {
    const button = item.querySelector('.faq-question');
    const answer = item.querySelector('.faq-answer');
    item.classList.toggle('is-open', open);
    button.setAttribute('aria-expanded', String(open));
    answer.style.maxHeight = open ? `${answer.scrollHeight}px` : '0px';
  }

  faqItems.forEach((item) => {
    const button = item.querySelector('.faq-question');
    button.addEventListener('click', () => {
      const willOpen = !item.classList.contains('is-open');
      // Mantém apenas uma pergunta aberta por vez.
      faqItems.forEach((other) => { if (other !== item) setFaqState(other, false); });
      setFaqState(item, willOpen);
    });
  });

  // Recalcula a altura da resposta aberta quando a tela muda de tamanho
  // (o texto quebra em mais ou menos linhas).
  window.addEventListener('resize', () => {
    document.querySelectorAll('.faq-item.is-open .faq-answer').forEach((answer) => {
      answer.style.maxHeight = `${answer.scrollHeight}px`;
    });
  });

  /* ------------------------------------------------------------------------
     6. ANIMAÇÃO DE ENTRADA AO ROLAR (REVEAL)
     ------------------------------------------------------------------------ */

  const revealEls = document.querySelectorAll('.reveal');

  if ('IntersectionObserver' in window && !prefersReducedMotion) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    // Pequeno atraso em cascata para elementos irmãos (cards lado a lado).
    revealEls.forEach((el) => {
      const siblings = [...el.parentElement.children].filter((c) => c.classList.contains('reveal'));
      el.style.animationDelay = `${siblings.indexOf(el) * 90}ms`;
      revealObserver.observe(el);
    });
  } else {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  }

  /* ------------------------------------------------------------------------
     7. CONTADORES ANIMADOS DA FAIXA DE MÉTRICAS
     ------------------------------------------------------------------------ */

  function animateCounter(el) {
    const target = Number(el.dataset.count);
    const duration = 1400;
    const start = performance.now();

    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      el.textContent = Math.round(target * eased);
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  const counters = document.querySelectorAll('[data-count]');
  if ('IntersectionObserver' in window && !prefersReducedMotion) {
    const counterObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        animateCounter(entry.target);
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.6 });
    counters.forEach((el) => counterObserver.observe(el));
  } else {
    counters.forEach((el) => { el.textContent = el.dataset.count; });
  }

  /* ------------------------------------------------------------------------
     8. MODAL "VER DEMONSTRAÇÃO" (slides com avanço automático)
     ------------------------------------------------------------------------ */

  const modal = document.getElementById('demo-modal');
  const slides = modal.querySelectorAll('.demo-slide');
  const bars = modal.querySelectorAll('.demo-bar');
  const SLIDE_DURATION = 4000;
  let currentSlide = 0;
  let lastFocused = null;

  modal.style.setProperty('--demo-duration', `${SLIDE_DURATION}ms`);

  // Mostra o slide indicado e atualiza as barras de progresso.
  function goToSlide(index) {
    currentSlide = index;
    slides.forEach((slide, i) => slide.classList.toggle('is-active', i === index));
    bars.forEach((bar, i) => {
      bar.classList.remove('is-running');
      bar.classList.toggle('is-done', i < index);
    });
    // Força o reinício da animação CSS da barra atual.
    void bars[index].offsetWidth;
    bars[index].classList.add('is-running');
  }

  // Quando a barra do slide atual termina de encher, avança automaticamente.
  bars.forEach((bar, i) => {
    bar.addEventListener('animationend', () => {
      if (i !== currentSlide) return;
      if (i < slides.length - 1) {
        goToSlide(i + 1);
      } else {
        bar.classList.remove('is-running');
        bar.classList.add('is-done');
      }
    });
  });

  function openDemo() {
    lastFocused = document.activeElement;
    closeMobileMenu();
    modal.hidden = false;
    document.body.classList.add('no-scroll');
    requestAnimationFrame(() => modal.classList.add('is-open'));
    goToSlide(0);
    modal.querySelector('.modal-close').focus();
  }

  function closeDemo() {
    if (modal.hidden) return;
    modal.classList.remove('is-open');
    document.body.classList.remove('no-scroll');
    bars.forEach((bar) => bar.classList.remove('is-running'));
    setTimeout(() => { modal.hidden = true; }, 300);
    if (lastFocused) lastFocused.focus({ preventScroll: true });
  }

  document.querySelectorAll('[data-open-demo]').forEach((btn) => btn.addEventListener('click', openDemo));
  modal.querySelectorAll('[data-close-demo]').forEach((el) => el.addEventListener('click', closeDemo));

  // Botão "Próximo passo": avança ou recomeça a demonstração.
  modal.querySelector('[data-demo-next]').addEventListener('click', () => {
    goToSlide((currentSlide + 1) % slides.length);
  });

  // Teclado: Esc fecha e Tab fica preso dentro do modal enquanto aberto.
  document.addEventListener('keydown', (event) => {
    if (modal.hidden) return;
    if (event.key === 'Escape') closeDemo();
    if (event.key === 'Tab') {
      const focusables = modal.querySelectorAll('button, a[href]');
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });
});
