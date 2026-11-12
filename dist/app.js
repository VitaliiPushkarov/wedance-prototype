'use strict';

const $ = (selector, context = document) => context.querySelector(selector);
const $$ = (selector, context = document) => [...context.querySelectorAll(selector)];
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

// Mobile navigation stays usable without taking over the whole page.
const menuToggle = $('.menu-toggle');
const mobileNav = $('#mobile-nav');
function closeMenu(returnFocus = false) {
  menuToggle.setAttribute('aria-expanded', 'false');
  menuToggle.setAttribute('aria-label', 'Open navigation');
  mobileNav.hidden = true;
  if (returnFocus) menuToggle.focus();
}
menuToggle.addEventListener('click', () => {
  const open = menuToggle.getAttribute('aria-expanded') !== 'true';
  menuToggle.setAttribute('aria-expanded', String(open));
  menuToggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  mobileNav.hidden = !open;
});
$$('a', mobileNav).forEach(link => link.addEventListener('click', () => closeMenu()));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && !mobileNav.hidden) closeMenu(true);
});
document.addEventListener('click', event => {
  if (!mobileNav.hidden && !event.target.closest('.site-header')) closeMenu();
});
window.matchMedia('(min-width: 901px)').addEventListener('change', event => {
  if (event.matches) closeMenu();
});

// Program choice follows the visitor into the local inquiry form.
$$('[data-select-program]').forEach(link => link.addEventListener('click', () => {
  $('#interest').value = link.dataset.selectProgram;
}));

// Filter the schedule without inventing class times or prices.
const filters = $$('[data-filter]');
function filterSchedule(key) {
  if (!filters.some(button => button.dataset.filter === key)) key = 'all';
  filters.forEach(button => {
    const active = button.dataset.filter === key;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  $$('[data-schedule]').forEach(card => { card.hidden = key !== 'all' && card.dataset.schedule !== key; });
  const selected = filters.find(button => button.dataset.filter === key);
  if ($('#schedule-status')) $('#schedule-status').textContent = `Showing ${key === 'all' ? 'all programs' : selected.textContent}. Final times and prices are awaiting studio confirmation.`;
}
filters.forEach(button => button.addEventListener('click', () => {
  const key = button.dataset.filter;
  filterSchedule(key);
  const url = new URL(location.href);
  if (key === 'all') url.searchParams.delete('program'); else url.searchParams.set('program', key);
  history.replaceState(null, '', url);
}));
if (filters.length) {
  filterSchedule(new URLSearchParams(location.search).get('program') || 'all');
  window.addEventListener('popstate', () => filterSchedule(new URLSearchParams(location.search).get('program') || 'all'));
}

// Load video only after an intentional click. Native dialogs provide focus trapping.
const videos = {
  'line-dance': { src: 'assets/video/line-dance.mp4', title: 'Line dancing at We Dance' },
  'studio-film': { src: 'assets/video/studio-film.mp4', title: 'Life at We Dance' },
  social: { src: 'assets/video/social.mp4', title: 'Find your social rhythm' },
  latin: { src: 'assets/video/latin.mp4', title: 'Latin, in motion' }
};
const videoDialog = $('#video-dialog');
const video = $('#modal-video');
let dialogTrigger;
function showDialog(dialog, trigger) {
  closeMenu();
  dialogTrigger = trigger;
  dialog.showModal();
  document.body.classList.add('modal-open');
}
$$('[data-video]').forEach(button => button.addEventListener('click', () => {
  const source = videos[button.dataset.video];
  if (!source) return;
  $('#video-title').textContent = source.title;
  $('#video-error').hidden = true;
  video.src = preferredVideoSource(source.src);
  showDialog(videoDialog, button);
  video.play().catch(() => { /* Native controls remain available if playback is restricted. */ });
}));
video.addEventListener('error', () => {
  if (video.hasAttribute('src')) $('#video-error').hidden = false;
});

$$('dialog').forEach(dialog => {
  $('[data-close-dialog]', dialog).addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });
  dialog.addEventListener('close', () => {
    document.body.classList.remove('modal-open');
    if (dialog === videoDialog) {
      video.pause();
      video.removeAttribute('src');
      video.load();
    }
    dialogTrigger?.focus({ preventScroll: true });
  });
});

initReviewPreview();
function initReviewPreview() {
  if (!$('.review-slider')) return;
  // Review layout is explicitly marked as illustrative, with no fabricated ratings.
  const reviews = [
    { title: 'That first “I can do this” moment.', description: 'A verified review from an adult beginner will appear here, sharing their experience of the first lesson.', person: 'Adult student story' },
    { title: 'Watching their confidence grow.', description: 'A verified parent review will appear here, describing their child’s experience learning and growing at We Dance.', person: 'Parent story' },
    { title: 'A first dance that felt like us.', description: 'A verified wedding couple’s review will appear here, sharing how they prepared for their first dance.', person: 'Wedding couple story' }
  ];
  let reviewIndex = 0;
  function showReview(index) {
    reviewIndex = (index + reviews.length) % reviews.length;
    const review = reviews[reviewIndex];
    $('#review-title').textContent = review.title;
    $('#review-description').textContent = review.description;
    $('#review-person-label').textContent = review.person;
    $('#review-counter').textContent = `0${reviewIndex + 1} / 03`;
    $$('[data-review]').forEach((dot, position) => {
      dot.classList.toggle('is-active', position === reviewIndex);
      dot.setAttribute('aria-pressed', String(position === reviewIndex));
    });
  }
  $('#review-prev').addEventListener('click', () => showReview(reviewIndex - 1));
  $('#review-next').addEventListener('click', () => showReview(reviewIndex + 1));
  $$('[data-review]').forEach(button => button.addEventListener('click', () => showReview(Number(button.dataset.review))));
  let touchStart;
  $('.review-slider').addEventListener('touchstart', event => {
    touchStart = { x: event.changedTouches[0].clientX, y: event.changedTouches[0].clientY };
  }, { passive: true });
  $('.review-slider').addEventListener('touchend', event => {
    if (!touchStart) return;
    const dx = event.changedTouches[0].clientX - touchStart.x;
    const dy = event.changedTouches[0].clientY - touchStart.y;
    if (Math.abs(dx) > 65 && Math.abs(dx) > Math.abs(dy) * 1.5) showReview(reviewIndex + (dx < 0 ? 1 : -1));
    touchStart = undefined;
  }, { passive: true });

}

// Demonstration only: there is deliberately no network request or local persistence.
const form = $('#lesson-form');
form.addEventListener('submit', event => {
  event.preventDefault();
  if (!form.reportValidity()) return;
  const name = form.elements.name.value.trim();
  if (!name) {
    form.elements.name.setCustomValidity('Please enter your name.');
    form.elements.name.reportValidity();
    return;
  }
  $('#success-message').textContent = `Thanks, ${name}. In the finished website, the studio would receive your request and contact you to discuss a first lesson.`;
  form.hidden = true;
  $('#form-success').hidden = false;
  $('#reset-form').focus({ preventScroll: true });
  // Do not retain the entered values after the demonstration.
  form.reset();
});
form.elements.name.addEventListener('input', () => form.elements.name.setCustomValidity(''));
$('#reset-form').addEventListener('click', () => {
  $('#form-success').hidden = true;
  $('#success-message').textContent = '';
  form.hidden = false;
  form.elements.name.focus({ preventScroll: true });
});

// Progressive enhancement: content is visible when scripting or observers are absent.
if ('IntersectionObserver' in window) {
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px 25px 0px' });
  if (!reducedMotion.matches) {
    document.body.classList.add('motion-ready');
    $$('.reveal').forEach(element => revealObserver.observe(element));
  }
}
// A longer sticky passage gives each scene time without intercepting wheel/touch events.
const storySteps = $$('[data-story]');
const approach = $('.approach');
let activeStory = 0;
let desiredStory = 0;
let storyChangedAt = 0;
let storyTimer;
function advanceStory() {
  clearTimeout(storyTimer);
  if (activeStory === desiredStory) return;
  const wait = Math.max(0, 1800 - (performance.now() - storyChangedAt));
  if (wait) { storyTimer = setTimeout(advanceStory, wait); return; }
  activeStory += Math.sign(desiredStory - activeStory);
  storyChangedAt = performance.now();
  $$('[data-story-image]').forEach((image, i) => image.classList.toggle('is-active', i === activeStory));
  storySteps.forEach((step, i) => step.classList.toggle('is-active', i === activeStory));
  if (activeStory !== desiredStory) storyTimer = setTimeout(advanceStory, 1800);
}
let scrollQueued = false;
function onScroll() {
  scrollQueued = false;
  $('.site-header').classList.toggle('is-scrolled', scrollY > 16);
  const formRect = $('.booking-card').getBoundingClientRect();
  const formVisible = formRect.top < innerHeight - 70 && formRect.bottom > 100;
  $('.mobile-booking').classList.toggle('is-visible', scrollY > 400 && !formVisible);
  if (!approach || innerWidth <= 900 || reducedMotion.matches) return;
  const rect = approach.getBoundingClientRect();
  const headerHeight = $('.site-header').getBoundingClientRect().height;
  const travel = Math.max(1, rect.height - innerHeight + headerHeight);
  const progress = Math.max(0, Math.min(1, (headerHeight - rect.top) / travel));
  desiredStory = Math.min(2, Math.floor(progress * 3));
  advanceStory();
}
function queueScroll() {
  if (!scrollQueued) { scrollQueued = true; requestAnimationFrame(onScroll); }
}
window.addEventListener('scroll', queueScroll, { passive: true });
window.addEventListener('resize', queueScroll, { passive: true });
onScroll();

// Lazy, silent previews. A rejected autoplay leaves the poster and manual control usable.
function preferredVideoSource(src, mobileSrc) {
  const connection = navigator.connection;
  const useSmall = innerWidth <= 600 || connection?.saveData || /(^|-)2g$/.test(connection?.effectiveType || '');
  return useSmall ? (mobileSrc || src.replace(/\.mp4$/, '-mobile.mp4')) : src;
}
function playInline(video) {
  if (!video.getAttribute('src')) {
    video.src = preferredVideoSource(video.dataset.src, video.dataset.srcMobile);
    video.preload = 'metadata';
  }
  video.muted = true;
  return video.play().catch(() => {});
}
const mosaic = $('.hero-mosaic');
const ambientVideos = $$('.ambient-video');
let heroVisible = false;
let heroPaused = reducedMotion.matches || !!navigator.connection?.saveData;
const pendingHeroStarts = new Map();
function syncHero() {
  ambientVideos.forEach((video, index) => {
    const canPlay = heroVisible && !heroPaused && !document.hidden && video.getClientRects().length > 0 && !document.querySelector('dialog[open]');
    if (!canPlay) {
      clearTimeout(pendingHeroStarts.get(video));
      pendingHeroStarts.delete(video);
      video.pause();
    } else if (video.hasAttribute('src')) {
      playInline(video);
    } else if (!pendingHeroStarts.has(video)) {
      // Give the poster, text and first paint priority; stagger initial video requests.
      const start = () => {
        const timer = setTimeout(() => {
          pendingHeroStarts.delete(video);
          if (heroVisible && !heroPaused && !document.hidden && video.getClientRects().length > 0 && !document.querySelector('dialog[open]')) playInline(video);
        }, index * 250);
        pendingHeroStarts.set(video, timer);
      };
      pendingHeroStarts.set(video, null);
      if ('requestIdleCallback' in window) requestIdleCallback(start, {timeout:600});
      else start();
    }
  });
  const toggle = $('[data-toggle-motion]');
  if (toggle) {
    toggle.setAttribute('aria-pressed', String(heroPaused));
    toggle.setAttribute('aria-label', heroPaused ? 'Play background videos' : 'Pause background videos');
    toggle.firstElementChild.textContent = heroPaused ? '▷' : 'Ⅱ';
  }
}
if (mosaic) {
  new IntersectionObserver(entries => { heroVisible = entries[0].isIntersecting; syncHero(); }, {threshold:0.05}).observe(mosaic);
  $('[data-toggle-motion]').addEventListener('click', () => { heroPaused = !heroPaused; syncHero(); });
}
const cards = $$('.program-card');
let selectedCard = null;
let activeCard = null;
const visibleCards = new Set();
let userPausedCard = null;
function syncCards() {
  const first = cards[0];
  const target = !document.hidden && !document.querySelector('dialog[open]')
    ? (selectedCard && visibleCards.has(selectedCard) ? selectedCard : (!reducedMotion.matches && !navigator.connection?.saveData && visibleCards.has(first) ? first : null)) : null;
  activeCard = target === userPausedCard ? null : target;
  cards.forEach(card => {
    const video = $('.program-video', card);
    const button = $('.program-video-toggle', card);
    const play = card === activeCard;
    card.classList.toggle('is-playing', play);
    button.dataset.playing = String(play);
    button.setAttribute('aria-label', `${play ? 'Pause' : 'Play'} ${$('h3',card).textContent} video`);
    if (play) playInline(video); else video.pause();
  });
}
const cardObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) visibleCards.add(entry.target);
    else {
      visibleCards.delete(entry.target);
      if (selectedCard === entry.target) selectedCard = null;
      if (userPausedCard === entry.target) userPausedCard = null;
    }
  });
  syncCards();
}, {threshold:0.25});
cards.forEach(card => {
  const button = document.createElement('button');
  button.type = 'button'; button.className = 'program-video-toggle';
  button.innerHTML = '<svg aria-hidden="true"><use href="#play"/></svg>';
  card.append(button);
  const select = () => { selectedCard = card; userPausedCard = null; syncCards(); };
  card.addEventListener('pointerenter', event => { if (event.pointerType === 'mouse') select(); });
  card.addEventListener('pointerleave', event => { if (event.pointerType === 'mouse') { selectedCard = null; syncCards(); } });
  card.addEventListener('focusin', event => { if (event.target !== button) select(); });
  card.addEventListener('focusout', event => { if (!card.contains(event.relatedTarget)) { selectedCard = null; syncCards(); } });
  button.addEventListener('click', () => {
    if (activeCard === card) { userPausedCard = card; selectedCard = null; }
    else { selectedCard = card; userPausedCard = null; }
    syncCards();
  });
  cardObserver.observe(card);
});
document.addEventListener('visibilitychange', () => { syncHero(); syncCards(); });
reducedMotion.addEventListener('change', event => { heroPaused = event.matches; syncHero(); syncCards(); });
// Dialog videos take priority over all decorative previews.
new MutationObserver(() => { syncHero(); syncCards(); }).observe(document.body, {subtree:true, attributes:true, attributeFilter:['open']});

// The Adults preview remains lazy and stops as soon as its section leaves the viewport.
const editorialVideos = $$('.editorial-video');
const visibleEditorial = new Set();
function syncEditorial() {
  editorialVideos.forEach(video => {
    if (visibleEditorial.has(video) && !document.hidden && !reducedMotion.matches && !navigator.connection?.saveData && !document.querySelector('dialog[open]')) playInline(video);
    else video.pause();
  });
}
const editorialObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => { if (entry.isIntersecting) visibleEditorial.add(entry.target); else visibleEditorial.delete(entry.target); });
  syncEditorial();
}, {threshold:0.25});
editorialVideos.forEach(video => editorialObserver.observe(video));
document.addEventListener('visibilitychange', syncEditorial);
reducedMotion.addEventListener('change', syncEditorial);
new MutationObserver(syncEditorial).observe(document.body, {subtree:true, attributes:true, attributeFilter:['open']});
