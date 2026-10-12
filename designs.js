/* One page, three visual designs. Parcel, panorama and form state belong to the
   existing controllers; switching appearance never recreates those controllers. */
(() => {
  'use strict';
  const designs = ['gold', 'orbit', 'moonlight'];
  const labels = {gold: 'Золото', orbit: 'Орбита', moonlight: 'Лунный свет'};
  const root = document.documentElement;
  const valid = value => designs.includes(value);
  const fromURL = () => new URL(location.href).searchParams.get('design');
  let saved;
  try { saved = localStorage.getItem('luna-design'); } catch { /* Optional storage. */ }
  let current = valid(fromURL()) ? fromURL() : valid(saved) ? saved : 'gold';
  const initialDesign = current;
  root.dataset.design = current;

  function entryState(design) {
    return {...(history.state || {}), lunaDesign: design};
  }
  function remember(method, design, url) {
    try { history[method](entryState(design), '', url); }
    catch { /* A restricted preview may disallow history; appearance still works. */ }
  }

  function apply(design, announce = true) {
    if (!valid(design)) return;
    current = design;
    root.dataset.design = design;
    document.querySelectorAll('[data-design-choice]').forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.designChoice === design));
    });
    const status = document.getElementById('design-status');
    if (status && announce) status.textContent = `Дизайн: ${labels[design]}`;
    try { localStorage.setItem('luna-design', design); } catch { /* Still works. */ }
    document.querySelector('meta[name="theme-color"]').content =
      {gold: '#0b0c0d', orbit: '#081727', moonlight: '#e7e9ed'}[design];
  }

  document.addEventListener('DOMContentLoaded', () => {
    apply(current, false);
    // Keep the original URL, including an absent design parameter and its hash.
    // Storage changes during later switches cannot describe an older entry.
    remember('replaceState', current, location.href);
    document.querySelectorAll('[data-design-choice]').forEach(button => {
      button.addEventListener('click', () => {
        const design = button.dataset.designChoice;
        if (!valid(design) || design === current) return;
        const url = new URL(location.href);
        url.searchParams.set('design', design);
        remember('pushState', design, url);
        apply(design);
      });
    });
    document.querySelectorAll('[data-preview-plot]').forEach(link => {
      link.addEventListener('click', () => {
        document.querySelector(`#plot-list [data-plot="${link.dataset.previewPlot}"]`)?.click();
      });
    });
    window.addEventListener('popstate', (event = {}) => {
      const design = fromURL();
      const remembered = event.state?.lunaDesign;
      apply(valid(design) ? design : valid(remembered) ? remembered : initialDesign);
    });
  });
})();
