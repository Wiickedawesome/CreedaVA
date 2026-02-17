/* ═══════════════════════════════════════════════════
   CreedaVA Demo — Shared JS (nav, toast, form)
   ═══════════════════════════════════════════════════ */

// Mobile menu toggle
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.querySelector('.nav__hamburger');
  const links = document.querySelector('.nav__links');
  if (btn && links) {
    btn.addEventListener('click', () => links.classList.toggle('open'));
    // Close on link click
    links.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => links.classList.remove('open'));
    });
  }
});

// Demo toast
function showToast(msg, duration = 3000) {
  let toast = document.getElementById('demo-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'demo-toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = '🚀 ' + msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), duration);
}

// Demo form handler
function handleDemoForm(e) {
  e.preventDefault();
  showToast('Demo mode — form submission simulated!');
  e.target.reset();
}
