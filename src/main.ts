import sofiaPortrait from './img/sofia.webp';
import sofiaPortraitRetina from './img/sofia@2x.webp';
import victorPortrait from './img/viktor.webp';
import victorPortraitRetina from './img/viktor@2x.webp';
import modalStyles from './css/modal.module.css';

const get = <T extends HTMLElement>(selector: string): T => {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error('Missing required element: ' + selector);
  return element;
};

document
  .querySelectorAll<HTMLElement>('[data-modal-class]')
  .forEach(element => {
    const name = element.dataset.modalClass;
    if (name && modalStyles[name]) element.classList.add(modalStyles[name]);
  });

const page = get<HTMLElement>('#page-content');
const mobileMenu = get<HTMLElement>('#mobile-menu');
const menuToggle = get<HTMLButtonElement>('.menu-toggle');
const backdrop = get<HTMLElement>('#order-backdrop');
const orderDialog = get<HTMLElement>('#order-dialog');
const orderForm = get<HTMLFormElement>('#order-form');
const coffeeChoice = get<HTMLSelectElement>('#coffee-choice');
const customerName = get<HTMLInputElement>('#customer-name');
const customerPhone = get<HTMLInputElement>('#customer-phone');
const orderStatus = get<HTMLElement>('#order-status');
const focusableSelector =
  'a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]';
let activeOverlay: HTMLElement | null = null;
let focusReturn: HTMLElement | null = null;

function closeOverlay(restoreFocus = true): void {
  if (!activeOverlay) return;
  const closing = activeOverlay;
  activeOverlay = null;
  page.inert = false;
  document.body.classList.remove('scroll-locked');
  menuToggle.setAttribute('aria-expanded', 'false');
  if (restoreFocus && focusReturn?.isConnected) {
    const target = focusReturn.getClientRects().length
      ? focusReturn
      : get<HTMLElement>('.header .logo');
    target.focus({ preventScroll: true });
  } else if (closing.contains(document.activeElement)) {
    (document.activeElement as HTMLElement).blur();
  }
  closing.classList.remove('is-open');
  closing.setAttribute('aria-hidden', 'true');
  closing.inert = true;
}

function openOverlay(overlay: HTMLElement, trigger: HTMLElement): void {
  closeOverlay(false);
  focusReturn = trigger;
  activeOverlay = overlay;
  overlay.inert = false;
  overlay.setAttribute('aria-hidden', 'false');
  overlay.classList.add('is-open');
  document.body.classList.add('scroll-locked');
  if (overlay === mobileMenu) {
    menuToggle.setAttribute('aria-expanded', 'true');
    get<HTMLButtonElement>('[data-close-menu]').focus({ preventScroll: true });
  } else {
    orderDialog.focus({ preventScroll: true });
  }
  page.inert = true;
}

menuToggle.addEventListener('click', () => openOverlay(mobileMenu, menuToggle));
get<HTMLButtonElement>('[data-close-menu]').addEventListener('click', () =>
  closeOverlay()
);
mobileMenu.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach(link => {
  link.addEventListener('click', () => {
    const target = document.querySelector<HTMLElement>(link.hash);
    closeOverlay(false);
    if (target) {
      target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
      target.addEventListener(
        'blur',
        () => target.removeAttribute('tabindex'),
        { once: true }
      );
    }
  });
});
get<HTMLButtonElement>('[data-close-order]').addEventListener('click', () =>
  closeOverlay()
);
backdrop.addEventListener('click', event => {
  if (event.target === backdrop) closeOverlay();
});
document.querySelectorAll<HTMLButtonElement>('[data-order]').forEach(button => {
  button.addEventListener('click', () => {
    orderForm.reset();
    customerName.setCustomValidity('');
    customerPhone.setCustomValidity('');
    orderStatus.textContent = '';
    coffeeChoice.value = button.dataset.order || 'Cappuccino';
    const returnTarget = mobileMenu.contains(button) ? menuToggle : button;
    openOverlay(backdrop, returnTarget);
  });
});
document.addEventListener('keydown', event => {
  if (!activeOverlay) return;
  if (event.key === 'Escape') {
    event.preventDefault();
    closeOverlay();
    return;
  }
  if (event.key !== 'Tab') return;
  const items = Array.from(
    activeOverlay.querySelectorAll<HTMLElement>(focusableSelector)
  ).filter(
    item =>
      item.getClientRects().length &&
      item.getAttribute('aria-disabled') !== 'true'
  );
  const first = items[0];
  const last = items.at(-1);
  if (!first || !last) return;
  const current = document.activeElement;
  if (
    event.shiftKey &&
    (current === first || !items.includes(current as HTMLElement))
  ) {
    event.preventDefault();
    last.focus();
  } else if (
    !event.shiftKey &&
    (current === last || !items.includes(current as HTMLElement))
  ) {
    event.preventDefault();
    first.focus();
  }
});
window.matchMedia('(min-width: 1440px)').addEventListener('change', event => {
  if (event.matches && activeOverlay === mobileMenu) closeOverlay();
});
customerName.addEventListener('input', () => {
  customerName.setCustomValidity(
    customerName.value.trim().length < 2
      ? 'Please enter at least two non-space characters.'
      : ''
  );
});
customerPhone.addEventListener('input', () => {
  const value = customerPhone.value.trim();
  const valid =
    !value ||
    (/^[+\d\s().-]+$/.test(value) && value.replace(/\D/g, '').length >= 7);
  customerPhone.setCustomValidity(
    valid ? '' : 'Please enter a phone number with at least seven digits.'
  );
});
orderForm.addEventListener('input', () => {
  orderStatus.textContent = '';
});
orderForm.addEventListener('submit', event => {
  event.preventDefault();
  customerName.setCustomValidity(
    customerName.value.trim().length < 2 ? 'Please enter your name.' : ''
  );
  if (!orderForm.reportValidity()) return;
  orderStatus.textContent =
    'Your ' +
    coffeeChoice.value +
    ' request looks good. This is a demo only — no order has been placed and your details have not been sent or stored.';
});
const subscribeForm = get<HTMLFormElement>('#subscribe-form');
const subscribeStatus = get<HTMLElement>('#subscribe-status');
subscribeForm.addEventListener('input', () => {
  subscribeStatus.textContent = '';
});
subscribeForm.addEventListener('submit', event => {
  event.preventDefault();
  if (!subscribeForm.reportValidity()) return;
  subscribeStatus.textContent =
    'Your email is valid. This is a demo only — you have not been subscribed and your email has not been sent or stored.';
  subscribeForm.reset();
});

const reviewText = get<HTMLElement>('#review-text');
const reviewPosition = get<HTMLElement>('#review-position');
const reviewName = get<HTMLElement>('.review__name');
const reviewRole = get<HTMLElement>('.review__role');
const originalReviewRole = reviewRole.textContent;
const reviewPortrait = get<HTMLImageElement>('.review__portrait');
const firstPortrait = {
  src: reviewPortrait.src,
  srcset: reviewPortrait.srcset,
  alt: reviewPortrait.alt,
};
const reviews = [
  reviewText.textContent?.trim() ?? '',
  'Some mornings call for a little extra time. A smooth macchiato, a comfortable pause, and the aroma of freshly prepared coffee turn an ordinary break into something to enjoy. Bean Scene is my reminder to step away from the screen, take a breath, and come back to the day with a fresh perspective.',
  'Coffee is even better when there is someone to share the moment with. From a creamy latte to a small, bold espresso, there is a cup for every kind of morning. The simple pleasure of a well-made drink is what keeps a coffee break feeling special, even on the busiest days.',
];
let reviewIndex = 0;
function changeReview(direction: number): void {
  reviewIndex = (reviewIndex + direction + reviews.length) % reviews.length;
  reviewText.textContent = reviews[reviewIndex];
  const authors = [
    { name: 'John', role: originalReviewRole, ...firstPortrait },
    {
      name: 'Sofia',
      role: 'Accountant',
      src: sofiaPortrait,
      srcset: sofiaPortrait + ' 1x, ' + sofiaPortraitRetina + ' 2x',
      alt: 'Portrait of Sofia',
    },
    {
      name: 'Victor',
      role: 'CEO',
      src: victorPortrait,
      srcset: victorPortrait + ' 1x, ' + victorPortraitRetina + ' 2x',
      alt: 'Portrait of Victor',
    },
  ];
  const author = authors[reviewIndex];
  reviewName.textContent = author.name;
  reviewRole.textContent = author.role;
  reviewPortrait.srcset = author.srcset;
  reviewPortrait.src = author.src;
  reviewPortrait.alt = author.alt;
  reviewPosition.textContent = reviewIndex + 1 + ' of ' + reviews.length;
}
get<HTMLButtonElement>('.review__arrow--previous').addEventListener(
  'click',
  () => changeReview(-1)
);
get<HTMLButtonElement>('.review__arrow--next').addEventListener('click', () =>
  changeReview(1)
);
