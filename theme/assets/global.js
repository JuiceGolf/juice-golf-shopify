/**
 * Juice Golf Trips — global progressive-enhancement script.
 * No framework/build step. Custom elements + small delegated handlers only.
 * Every feature here degrades to a real, working native fallback
 * (plain links/forms) if JavaScript fails to load.
 */

(function () {
  'use strict';

  /* ----------------------------------------------------------------
     Drawers (mobile nav, search, cart)
     ---------------------------------------------------------------- */
  class DrawerElement extends HTMLElement {
    connectedCallback() {
      this.querySelectorAll('[data-drawer-close]').forEach((el) => {
        el.addEventListener('click', (event) => {
          event.preventDefault();
          this.close();
        });
      });

      this.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') this.close();
      });
    }

    open() {
      this.setAttribute('open', '');
      document.documentElement.style.overflow = 'hidden';
      const focusable = this.querySelector('input, button, a');
      if (focusable) window.setTimeout(() => focusable.focus(), 60);
    }

    close() {
      this.removeAttribute('open');
      document.documentElement.style.overflow = '';
    }
  }

  customElements.define('mobile-nav-drawer', class extends DrawerElement {});
  customElements.define('search-drawer', class extends DrawerElement {});
  customElements.define('cart-drawer', class extends DrawerElement {});

  document.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-open-drawer]');
    if (!trigger) return;

    const drawer = document.querySelector(trigger.getAttribute('data-open-drawer'));
    if (!drawer) return;

    if (trigger.tagName === 'A' || trigger.tagName === 'BUTTON') {
      event.preventDefault();
    }
    drawer.open();
  });

  /* ----------------------------------------------------------------
     Cart count + cart drawer refresh helpers
     ---------------------------------------------------------------- */
  function updateCartCount(count) {
    document.querySelectorAll('[data-cart-count]').forEach((el) => {
      el.textContent = count;
      el.hidden = count === 0;
    });
  }

  function refreshCartDrawer() {
    return fetch(window.location.pathname + '?sections=cart-drawer')
      .then((res) => res.json())
      .then((data) => {
        const html = data['cart-drawer'];
        if (!html) return;
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const newDrawer = doc.querySelector('cart-drawer');
        const currentDrawer = document.querySelector('cart-drawer');
        if (newDrawer && currentDrawer) {
          currentDrawer.innerHTML = newDrawer.innerHTML;
        }
      })
      .catch(() => {
        /* Network hiccup — cart state on the server is still correct; a full
           page load (e.g. visiting /cart) will always reflect it. */
      });
  }

  /* ----------------------------------------------------------------
     Add-to-cart (progressive enhancement over the real Shopify cart form)
     ---------------------------------------------------------------- */
  document.addEventListener('submit', (event) => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement)) return;
    if (!form.action || form.action.indexOf('/cart/add') === -1) return;
    if (form.hasAttribute('data-roster-form')) return; // handled by initRosterBuilders

    event.preventDefault();

    const submitButton = form.querySelector('#ProductSubmitButton');
    const buttonText = submitButton ? submitButton.querySelector('[data-add-to-cart-text]') : null;
    const originalText = buttonText ? buttonText.textContent : null;

    if (submitButton) submitButton.disabled = true;
    if (buttonText) buttonText.textContent = 'Adding…';

    const formData = new FormData(form);

    fetch('/cart/add.js', {
      method: 'POST',
      headers: { Accept: 'application/json' },
      body: formData,
    })
      .then((res) => res.json())
      .then((item) => {
        if (item.status) {
          // Shopify returns an error payload with a `status` + `description` on failure.
          throw new Error(item.description || 'Could not add this item to your cart.');
        }

        return fetch('/cart.js')
          .then((res) => res.json())
          .then((cart) => {
            updateCartCount(cart.item_count);
            return refreshCartDrawer();
          });
      })
      .then(() => {
        const drawer = document.querySelector('cart-drawer');
        if (drawer && drawer.open) drawer.open();
      })
      .catch((error) => {
        // Real, visible failure state — no silent/fake success.
        if (buttonText) buttonText.textContent = 'Something went wrong';
        window.setTimeout(() => {
          if (buttonText && originalText) buttonText.textContent = originalText;
        }, 2500);
        console.error(error);
      })
      .finally(() => {
        if (submitButton) submitButton.disabled = false;
        if (buttonText && originalText && buttonText.textContent === 'Adding…') {
          buttonText.textContent = originalText;
        }
      });
  });

  /* ----------------------------------------------------------------
     Shared money formatting (product variant picker + roster builder)
     ---------------------------------------------------------------- */
  function formatMoney(cents) {
    return (cents / 100).toLocaleString(undefined, {
      style: 'currency',
      currency: (window.Shopify && window.Shopify.currency && window.Shopify.currency.active) || 'USD',
    });
  }

  /* ----------------------------------------------------------------
     Product variant picker
     ---------------------------------------------------------------- */
  function initVariantPickers() {
    document.querySelectorAll('.product-form').forEach((form) => {
      const section = form.closest('[data-section-id]');
      if (!section) return;

      const variantDataEl = section.querySelector('#ProductVariantData');
      if (!variantDataEl) return;

      let variants;
      try {
        variants = JSON.parse(variantDataEl.textContent);
      } catch (error) {
        return;
      }

      const selects = Array.from(form.querySelectorAll('.product-form__select'));
      if (selects.length === 0) return;

      const idInput = form.querySelector('#ProductFormVariantId');
      const submitButton = form.querySelector('#ProductSubmitButton');
      const buttonText = submitButton ? submitButton.querySelector('[data-add-to-cart-text]') : null;
      const priceWrapper = section.querySelector('#ProductPrice');

      function currentSelection() {
        return selects
          .sort((a, b) => Number(a.dataset.optionPosition) - Number(b.dataset.optionPosition))
          .map((select) => select.value);
      }

      function findMatchingVariant() {
        const selection = currentSelection();
        return variants.find((variant) => {
          const options = [variant.option1, variant.option2, variant.option3].filter((o) => o !== null);
          return options.every((value, index) => value === selection[index]);
        });
      }

      function render() {
        const variant = findMatchingVariant();

        selects.forEach((select) => {
          const label = select.closest('.product-form__option').querySelector('[data-selected-value]');
          if (label) label.textContent = select.value;
        });

        if (!variant) {
          if (submitButton) submitButton.disabled = true;
          if (buttonText) buttonText.textContent = 'Unavailable';
          return;
        }

        if (idInput) idInput.value = variant.id;

        if (priceWrapper) {
          const priceEl = priceWrapper.querySelector('.price');
          if (priceEl) {
            const onSale = variant.compare_at_price && variant.compare_at_price > variant.price;
            priceEl.classList.toggle('price--sale', Boolean(onSale));
            priceEl.innerHTML = onSale
              ? '<span class="price__sale">' + formatMoney(variant.price) + '</span><span class="price__compare">' + formatMoney(variant.compare_at_price) + '</span>'
              : '<span>' + formatMoney(variant.price) + '</span>';
          }
        }

        if (submitButton) submitButton.disabled = !variant.available;
        if (buttonText) buttonText.textContent = variant.available ? 'Add to cart' : 'Sold out';

        if (variant.featured_media) {
          const targetSlide = section.querySelector('[data-media-id="' + variant.featured_media.id + '"]');
          if (targetSlide) {
            section.querySelectorAll('.product__gallery-slide').forEach((slide) => {
              slide.hidden = slide !== targetSlide;
            });
          }
        }
      }

      selects.forEach((select) => select.addEventListener('change', render));
    });
  }

  /* ----------------------------------------------------------------
     Product gallery thumbnails
     ---------------------------------------------------------------- */
  function initGalleries() {
    document.querySelectorAll('.product__gallery-thumbs').forEach((thumbs) => {
      const gallery = thumbs.closest('.product__gallery');
      if (!gallery) return;

      thumbs.querySelectorAll('.product__gallery-thumb').forEach((thumb) => {
        thumb.addEventListener('click', () => {
          const mediaId = thumb.getAttribute('data-media-id');

          gallery.querySelectorAll('.product__gallery-slide').forEach((slide) => {
            slide.hidden = slide.getAttribute('data-media-id') !== mediaId;
          });

          thumbs.querySelectorAll('.product__gallery-thumb').forEach((t) => {
            t.classList.toggle('is-active', t === thumb);
          });
        });
      });
    });
  }

  /* ----------------------------------------------------------------
     Team roster builder (multiple personalized players in one submit)
     ---------------------------------------------------------------- */
  function initRosterBuilders() {
    document.querySelectorAll('.roster-builder').forEach((wrapper) => {
      const form = wrapper.querySelector('[data-roster-form]');
      const rowsContainer = wrapper.querySelector('[data-roster-rows]');
      const template = wrapper.querySelector('[data-roster-row-template]');
      const addButton = wrapper.querySelector('[data-roster-add]');
      const subtotalEl = wrapper.querySelector('[data-roster-subtotal]');
      const submitButton = wrapper.querySelector('[data-roster-submit]');
      const submitText = wrapper.querySelector('[data-roster-submit-text]');
      if (!form || !rowsContainer || !template) return;

      const basePrice = Number(wrapper.dataset.productPrice) || 0;

      function propertyName(input) {
        const match = /^properties\[(.+)\]$/.exec(input.name || '');
        return match ? match[1] : input.name;
      }

      function rowPrice(row) {
        const select = row.querySelector('[data-roster-size]');
        const selected = select && select.options[select.selectedIndex];
        const price = selected ? Number(selected.dataset.price) : NaN;
        return Number.isFinite(price) ? price : basePrice;
      }

      function updateSubtotal() {
        const rows = Array.from(rowsContainer.querySelectorAll('[data-roster-row]'));
        const total = rows.reduce((sum, row) => sum + rowPrice(row), 0);
        if (subtotalEl) subtotalEl.textContent = formatMoney(total);
      }

      function bindRow(row) {
        const removeButton = row.querySelector('[data-roster-remove]');
        if (removeButton) {
          removeButton.addEventListener('click', () => {
            if (rowsContainer.querySelectorAll('[data-roster-row]').length <= 1) return;
            row.remove();
            updateSubtotal();
          });
        }
        const select = row.querySelector('[data-roster-size]');
        if (select) select.addEventListener('change', updateSubtotal);
      }

      rowsContainer.querySelectorAll('[data-roster-row]').forEach(bindRow);
      updateSubtotal();

      if (addButton) {
        addButton.addEventListener('click', () => {
          const fragment = template.content.cloneNode(true);
          const newRow = fragment.querySelector('[data-roster-row]');
          rowsContainer.appendChild(fragment);
          if (newRow) {
            bindRow(newRow);
            const nameInput = newRow.querySelector('[data-roster-name]');
            if (nameInput) nameInput.focus();
          }
          updateSubtotal();
        });
      }

      form.addEventListener('submit', (event) => {
        event.preventDefault();
        event.stopPropagation();

        const originalSubmitText = submitText ? submitText.textContent : null;
        const rows = Array.from(rowsContainer.querySelectorAll('[data-roster-row]'));
        const items = [];

        rows.forEach((row) => {
          const nameInput = row.querySelector('[data-roster-name]');
          const numberInput = row.querySelector('[data-roster-number]');
          const select = row.querySelector('[data-roster-size]');
          const name = nameInput ? nameInput.value.trim() : '';
          if (!name) return; // skip empty rows

          const properties = {};
          if (nameInput) properties[propertyName(nameInput)] = name;
          if (numberInput && numberInput.value.trim()) {
            properties[propertyName(numberInput)] = numberInput.value.trim();
          }

          items.push({ id: select ? Number(select.value) : null, quantity: 1, properties });
        });

        if (items.length === 0) {
          if (submitText) submitText.textContent = 'Add at least one player';
          window.setTimeout(() => {
            if (submitText && originalSubmitText) submitText.textContent = originalSubmitText;
          }, 2500);
          return;
        }

        if (submitButton) submitButton.disabled = true;
        if (submitText) submitText.textContent = 'Adding…';

        fetch('/cart/add.js', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ items: items }),
        })
          .then((res) => res.json())
          .then((result) => {
            if (result.status) {
              throw new Error(result.description || 'Could not add this team to your cart.');
            }
            return fetch('/cart.js')
              .then((res) => res.json())
              .then((cart) => {
                updateCartCount(cart.item_count);
                return refreshCartDrawer();
              });
          })
          .then(() => {
            const drawer = document.querySelector('cart-drawer');
            if (drawer && drawer.open) drawer.open();
          })
          .catch((error) => {
            if (submitText) submitText.textContent = 'Something went wrong';
            window.setTimeout(() => {
              if (submitText && originalSubmitText) submitText.textContent = originalSubmitText;
            }, 2500);
            console.error(error);
          })
          .finally(() => {
            if (submitButton) submitButton.disabled = false;
            if (submitText && originalSubmitText && submitText.textContent === 'Adding…') {
              submitText.textContent = originalSubmitText;
            }
          });
      });
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    initVariantPickers();
    initGalleries();
    initRosterBuilders();
  });
})();
