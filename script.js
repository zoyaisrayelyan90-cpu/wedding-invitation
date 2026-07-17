
const openBtn = document.getElementById('openInvite');
const intro = document.getElementById('intro');
const main = document.getElementById('mainContent');

if (openBtn && intro && main) {
openBtn.addEventListener('click', () => {
  document.body.classList.add('invitation-opened');
  playWeddingMusic();

  intro.style.transition = 'opacity .8s ease';
  intro.style.opacity = '0';

  setTimeout(() => {
    intro.style.display = 'none';
    main.classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'auto' });
    observeReveals();
  }, 800);
});
}

function updateCountdown(){
  const target = new Date('2026-08-16T13:30:00+04:00').getTime();
  const now = Date.now();
  const diff = Math.max(0, target - now);
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  document.getElementById('days').textContent = d;
  document.getElementById('hours').textContent = h;
  document.getElementById('minutes').textContent = m;
  document.getElementById('seconds').textContent = s;
}
updateCountdown();
setInterval(updateCountdown,1000);

function observeReveals(){
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if(e.isIntersecting) e.target.classList.add('visible');
    });
  }, {threshold:.12});
  document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
}

// RSVP submission: save responses in Google Sheets through Google Apps Script.
const rsvpForm = document.getElementById('rsvpForm');
const rsvpModal = document.getElementById('rsvpSuccessModal');

function closeRsvpModal() {
  if (!rsvpModal) return;
  rsvpModal.classList.remove('is-open');
  rsvpModal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('modal-open');
}

function openRsvpModal() {
  if (!rsvpModal) return;
  rsvpModal.classList.add('is-open');
  rsvpModal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
}

document.querySelectorAll('[data-close-rsvp-modal]').forEach(button => {
  button.addEventListener('click', closeRsvpModal);
});

if (rsvpForm) {
  rsvpForm.addEventListener('submit', async event => {
    event.preventDefault();

    const submitButton = rsvpForm.querySelector('button[type="submit"]');
    const endpoint = window.RSVP_ENDPOINT || '';

    if (!endpoint || endpoint.includes('PASTE_YOUR')) {
      alert('RSVP կապը դեռ վերջնականացված չէ։ Տեղադրեք Google Apps Script-ի /exec հղումը config.js ֆայլում։');
      return;
    }

    submitButton.disabled = true;
    const originalText = submitButton.textContent;
    submitButton.textContent = 'Ուղարկվում է…';

    try {
      const formData = new FormData(rsvpForm);
      await fetch(endpoint, {
        method: 'POST',
        mode: 'no-cors',
        body: formData
      });

      rsvpForm.reset();

const thanks = document.getElementById('thanks');

if (thanks) {
  rsvpForm.hidden = true;
  thanks.hidden = false;
  thanks.scrollIntoView({
    behavior: 'smooth',
    block: 'center'
  });
}

openRsvpModal();
    } catch (error) {
      console.error('RSVP submission failed:', error);
      alert('Չհաջողվեց ուղարկել պատասխանը։ Խնդրում ենք կրկին փորձել։');
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = originalText;
    }
  });
}



// 3D rotating gallery
const gallerySlides = Array.from(document.querySelectorAll('.gallery-slide'));
const galleryDots = document.querySelector('.gallery-dots');
const galleryPrev = document.querySelector('.gallery-prev');
const galleryNext = document.querySelector('.gallery-next');
let galleryIndex = 0;
let galleryTimer;

function renderGallery(){
  if (!gallerySlides.length) return;
  gallerySlides.forEach((slide, index) => {
    const total = gallerySlides.length;
    let offset = index - galleryIndex;
    if (offset > total / 2) offset -= total;
    if (offset < -total / 2) offset += total;

    slide.classList.remove('active');
    slide.style.setProperty('--offset', offset);
    slide.style.opacity = Math.abs(offset) > 2 ? '0' : String(1 - Math.abs(offset) * 0.22);
    slide.style.pointerEvents = offset === 0 ? 'auto' : 'none';
    slide.style.zIndex = String(20 - Math.abs(offset));

    if (offset === 0) slide.classList.add('active');
  });

  if (galleryDots) {
    Array.from(galleryDots.children).forEach((dot, index) => {
      dot.classList.toggle('active', index === galleryIndex);
      dot.setAttribute('aria-current', index === galleryIndex ? 'true' : 'false');
    });
  }
}

function goToGallery(index){
  galleryIndex = (index + gallerySlides.length) % gallerySlides.length;
  renderGallery();
  restartGalleryTimer();
}

function restartGalleryTimer(){
  clearInterval(galleryTimer);
  galleryTimer = setInterval(() => goToGallery(galleryIndex + 1), 4500);
}

if (gallerySlides.length && galleryDots) {
  gallerySlides.forEach((_, index) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.setAttribute('aria-label', `Բացել ${index + 1}-րդ նկարը`);
    dot.addEventListener('click', () => goToGallery(index));
    galleryDots.appendChild(dot);
  });

  galleryPrev?.addEventListener('click', () => goToGallery(galleryIndex - 1));
  galleryNext?.addEventListener('click', () => goToGallery(galleryIndex + 1));

  let touchStartX = 0;
  const stage = document.querySelector('.gallery-stage');
  stage?.addEventListener('touchstart', e => {
    touchStartX = e.changedTouches[0].clientX;
  }, {passive:true});
  stage?.addEventListener('touchend', e => {
    const diff = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(diff) > 45) goToGallery(galleryIndex + (diff < 0 ? 1 : -1));
  }, {passive:true});

  renderGallery();
  restartGalleryTimer();
}

// Single YouTube background music player
const WEDDING_VIDEO_ID = 'CkKyvW_kdBA';
let weddingPlayer = null;
let weddingPlayerReady = false;
let weddingMusicRequested = false;
let weddingMusicPlaying = false;

window.onYouTubeIframeAPIReady = function () {
  if (weddingPlayer) return;

  weddingPlayer = new YT.Player('youtube-player', {
    height: '1',
    width: '1',
    videoId: WEDDING_VIDEO_ID,
    playerVars: {
      autoplay: 0,
      controls: 0,
      loop: 1,
      playlist: WEDDING_VIDEO_ID,
      rel: 0,
      modestbranding: 1,
      playsinline: 1
    },
    events: {
      onReady: function () {
        weddingPlayerReady = true;
        weddingPlayer.setVolume(65);
        if (weddingMusicRequested) playWeddingMusic();
      },
      onStateChange: function (event) {
        weddingMusicPlaying = event.data === YT.PlayerState.PLAYING;
        document.getElementById('musicToggle')?.classList.toggle('playing', weddingMusicPlaying);
      }
    }
  });
};

function playWeddingMusic() {
  weddingMusicRequested = true;
  if (!weddingPlayerReady || !weddingPlayer || weddingMusicPlaying) return;
  weddingPlayer.playVideo();
}

function pauseWeddingMusic() {
  if (!weddingPlayerReady || !weddingPlayer || !weddingMusicPlaying) return;
  weddingPlayer.pauseVideo();
}

function toggleWeddingMusic() {
  if (weddingMusicPlaying) pauseWeddingMusic();
  else playWeddingMusic();
}

document.addEventListener('click', function (event) {
  const openButton = event.target.closest('.open-btn, #openInvitation, [data-open-invitation]');
  if (openButton) {
    document.body.classList.add('invitation-opened');
    playWeddingMusic();
  }

  const musicButton = event.target.closest('#musicToggle, .music-toggle, [data-music-toggle]');
  if (musicButton) toggleWeddingMusic();
});
