const PRODUCTS = [
  {
    sku: "fortnite-leviathan-100-200",
    title: "Fortnite Leviathan Axe 100-200 Skins",
    price: 15,
    brand: "FORTNITE",
    outline: "Cuentas Fortnite",
    stock: "in",
    service: "netflix",
    image: "https://images.unsplash.com/photo-1542751110-97427bbecf20?auto=format&fit=crop&w=1400&q=80"
  },
  {
    sku: "fortnite-minty-100-250",
    title: "Fortnite Minty Axe 100-250 Skins",
    price: 18,
    brand: "FORTNITE",
    outline: "Cuentas Fortnite",
    stock: "in",
    service: "disney",
    image: "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1400&q=80"
  },
  {
    sku: "fortnite-250-400",
    title: "Fortnite 250-400 Skins",
    price: 20,
    brand: "FORTNITE",
    outline: "Cuentas Fortnite",
    stock: "in",
    service: "plextv",
    image: "https://images.unsplash.com/photo-1593305841991-05c297ba4575?auto=format&fit=crop&w=1400&q=80"
  },
  {
    sku: "fortnite-400-550",
    title: "Fortnite 400-550 Skins",
    price: 45,
    brand: "FORTNITE",
    outline: "Cuentas Fortnite",
    stock: "in",
    service: "pureflix",
    image: "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?auto=format&fit=crop&w=1400&q=80"
  },
  {
    sku: "paramount-eu-lifetime",
    title: "Netflix LifeTime",
    price: 0.1,
    brand: "NETFLIX",
    outline: "Netflix Premium",
    stock: "in",
    service: "netflix",
    image: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1400&q=80"
  },
  {
    sku: "epicgames-20-50-nfa",
    title: "EpicGames [20-50 Games] [NFA]",
    price: 0.12,
    brand: "EPIC GAMES",
    outline: "Cuentas de juegos",
    stock: "in",
    service: "crunchyroll",
    image: "https://images.unsplash.com/photo-1580327344181-c1163234e5a0?auto=format&fit=crop&w=1400&q=80"
  },
  {
    sku: "chatgpt-premium-ilimitado",
    title: "ChatGPT Premium Ilimitado",
    price: 3,
    brand: "CHATGPT",
    outline: "Chat GPT Premium",
    stock: "in",
    service: "chatgpt",
    image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1400&q=80"
  },
  {
    sku: "steam-random-keys",
    title: "Claves aleatorias Steam",
    price: 3.5,
    brand: "STEAM",
    outline: "Boveda Steam",
    stock: "out",
    service: "spotify",
    image: "https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?auto=format&fit=crop&w=1400&q=80"
  },
  {
    sku: "steam-wallet-stock",
    title: "Cuentas Steam Wallet",
    price: 2.8,
    brand: "STEAM",
    outline: "Boveda Steam",
    stock: "out",
    service: "primevideo",
    image: "https://images.unsplash.com/photo-1627856014754-5e8765d7a8f4?auto=format&fit=crop&w=1400&q=80"
  }
];

const PRODUCT_INDEX = Object.fromEntries(PRODUCTS.map((product) => [product.sku, product]));
const CART_KEY = "optistore-cart-v1";
const PAYPAL_LINK = "https://www.paypal.com/paypalme/cocolosu";
const PRICE = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2
});

const state = {
  searchTerm: "",
  activeService: "all"
};

const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");

const formatMoney = (value) => {
  const amount = Number(value);
  return PRICE.format(Number.isFinite(amount) ? amount : 0);
};

const normalizeQty = (value) => {
  const qty = Number(value);
  if (!Number.isFinite(qty)) return 1;
  return Math.max(1, Math.floor(qty));
};

const DETAIL_DESCRIPTIONS = {
  "fortnite-leviathan-100-200":
    "Cuentas Fortnite verificadas, acceso completo y reemplazo rapido si hay incidencia durante la entrega.",
  "fortnite-minty-100-250":
    "Cuenta con skins premium y entrega digital inmediata. Ideal para uso principal o secundario.",
  "fortnite-250-400":
    "Pack de cuenta con rango de skins alto, listo para usar y con soporte de activacion paso a paso.",
  "fortnite-400-550":
    "Cuenta avanzada con inventario amplio de skins y revision previa antes del envio.",
  "paramount-eu-lifetime":
    "Acceso de larga duracion con instrucciones claras para iniciar sesion sin bloqueos.",
  "epicgames-20-50-nfa":
    "Cuenta de juegos con catalogo variado. Incluye guia de acceso y soporte postventa.",
  "chatgpt-premium-ilimitado":
    "Plan premium ilimitado con acceso estable y soporte para activacion en minutos.",
  "steam-random-keys":
    "Claves para Steam con rotacion frecuente. Recomendado para ampliar biblioteca rapido.",
  "steam-wallet-stock":
    "Cuenta Steam Wallet para compras puntuales. Envio digital con validacion de acceso."
};

const getProductDescription = (product) =>
  DETAIL_DESCRIPTIONS[product.sku] ||
  "Entrega digital instantanea, garantia de reemplazo y soporte directo despues del pago.";

const readCart = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(CART_KEY) || "{}");
    if (!parsed || typeof parsed !== "object") return {};

    const cleaned = {};
    Object.entries(parsed).forEach(([sku, item]) => {
      const product = PRODUCT_INDEX[sku];
      if (!product || !item || typeof item !== "object") return;
      const qty = normalizeQty(item.qty);
      cleaned[sku] = {
        sku,
        qty,
        title: product.title,
        price: Number(product.price),
        image: product.image || ""
      };
    });

    return cleaned;
  } catch (_error) {
    return {};
  }
};

const writeCart = (cart) => {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
};

const getCartEntries = () => Object.values(readCart());

const getCartTotals = (entries) => {
  const quantity = entries.reduce((sum, item) => sum + normalizeQty(item.qty), 0);
  const total = entries.reduce((sum, item) => sum + Number(item.price) * normalizeQty(item.qty), 0);
  return { quantity, total };
};

const updateCartCount = () => {
  const entries = getCartEntries();
  const { quantity } = getCartTotals(entries);
  document.querySelectorAll("[data-cart-count]").forEach((node) => {
    node.textContent = quantity;
    node.classList.toggle("is-empty", quantity === 0);
  });
};

const setCartOpen = (open) => {
  const overlay = document.querySelector("[data-cart-overlay]");
  const drawer = document.querySelector("[data-cart-drawer]");
  if (!overlay || !drawer) return;
  overlay.classList.toggle("is-open", open);
  drawer.classList.toggle("is-open", open);
};

const saveAndRefresh = (cart) => {
  writeCart(cart);
  updateCartCount();
  renderCartDrawer();
  renderCheckout();
};

const addToCart = (sku, qty = 1) => {
  const product = PRODUCT_INDEX[sku];
  if (!product || product.stock !== "in") return;

  const cart = readCart();
  const current = cart[sku];
  const nextQty = (current ? normalizeQty(current.qty) : 0) + normalizeQty(qty);

  cart[sku] = {
    sku,
    qty: nextQty,
    title: product.title,
    price: Number(product.price),
    image: product.image || ""
  };

  saveAndRefresh(cart);
};

const updateCartItem = (sku, delta) => {
  const cart = readCart();
  const current = cart[sku];
  if (!current) return;

  const nextQty = normalizeQty(current.qty + delta);
  if (current.qty + delta <= 0) {
    delete cart[sku];
  } else {
    cart[sku].qty = nextQty;
  }

  saveAndRefresh(cart);
};

const removeCartItem = (sku) => {
  const cart = readCart();
  if (!cart[sku]) return;
  delete cart[sku];
  saveAndRefresh(cart);
};

const renderCartDrawer = () => {
  const itemsNode = document.querySelector("[data-cart-items]");
  const subNode = document.querySelector("[data-cart-sub]");
  const totalNode = document.querySelector("[data-cart-total]");
  const checkoutBtn = document.querySelector(".checkout-btn");

  if (!itemsNode || !subNode || !totalNode) return;

  const entries = getCartEntries();
  const { quantity, total } = getCartTotals(entries);

  subNode.textContent = `${quantity} ${quantity === 1 ? "articulo" : "articulos"}`;

  if (!entries.length) {
    totalNode.textContent = "";
    totalNode.classList.add("is-hidden");
    if (checkoutBtn) {
      checkoutBtn.classList.add("is-hidden");
    }

    itemsNode.innerHTML = `
      <div class="cart-empty-state">
        <div class="cart-empty-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="9" cy="20" r="1.5"></circle>
            <circle cx="18" cy="20" r="1.5"></circle>
            <path d="M2 3h3l2.1 11.3a2 2 0 0 0 2 1.7h8.9a2 2 0 0 0 2-1.6L22 7H7"></path>
          </svg>
        </div>
        <p class="cart-empty-title">Tu carrito esta vacio</p>
        <p class="cart-empty-sub">Agrega productos para empezar</p>
      </div>
    `;
    return;
  }

  totalNode.textContent = formatMoney(total);
  totalNode.classList.remove("is-hidden");
  if (checkoutBtn) {
    checkoutBtn.classList.remove("is-hidden");
  }

  itemsNode.innerHTML = entries
    .map((item) => {
      const lineTotal = formatMoney(item.price * item.qty);
      const thumbStyle = item.image
        ? ` style="background-image:url('${escapeHtml(item.image)}')"`
        : "";

      return `
        <article class="cart-row">
          <div class="cart-thumb"${thumbStyle}></div>
          <div class="cart-info">
            <h4>${escapeHtml(item.title)}</h4>
            <div class="item-controls">
              <button type="button" data-cart-action="minus" data-sku="${escapeHtml(item.sku)}">-</button>
              <span class="item-qty">${item.qty}</span>
              <button type="button" data-cart-action="plus" data-sku="${escapeHtml(item.sku)}">+</button>
            </div>
          </div>
          <strong class="cart-line-price">${lineTotal}</strong>
        </article>
      `;
    })
    .join("");
};

const renderProductGrid = () => {
  const grid = document.querySelector("[data-product-grid]");
  if (!grid) return;

  const term = state.searchTerm.trim().toLowerCase();
  const filtered = PRODUCTS.filter((product) => {
    const matchesService = state.activeService === "all" || product.service === state.activeService;
    const haystack = `${product.title} ${product.brand} ${product.outline} ${product.service}`.toLowerCase();
    const matchesSearch = term.length === 0 || haystack.includes(term);
    return matchesService && matchesSearch;
  });

  if (!filtered.length) {
    grid.innerHTML = '<p class="empty-grid">No se encontraron productos para este filtro.</p>';
    return;
  }

  grid.innerHTML = filtered
    .map((product) => {
      const isInStock = product.stock === "in";
      const stockLabel = isInStock ? "En stock" : "Agotado";
      const statusClass = isInStock ? "in" : "out";
      const imageStyle = product.image ? ` style="background-image:url('${escapeHtml(product.image)}')"` : "";
      const blankClass = product.image ? "" : " is-blank";
      const productLink = `product.html?sku=${encodeURIComponent(product.sku)}`;

      return `
        <article class="product-card${blankClass}" data-product-link="${productLink}" tabindex="0" role="link" aria-label="Ver detalle de ${escapeHtml(product.title)}">
          <div class="product-bg"${imageStyle}></div>
          <div class="product-glow"></div>
          <div class="product-hover-layer">
            <button class="quick-add" type="button" data-add-to-cart data-sku="${escapeHtml(product.sku)}" data-label="Agregar al carrito" ${isInStock ? "" : "disabled"}>
              ${isInStock ? "Agregar al carrito" : "Sin stock"}
            </button>
          </div>
          <p class="product-brand">${escapeHtml(product.brand)}</p>
          <p class="product-outline">${escapeHtml(product.outline)}</p>
          <p class="product-stock ${statusClass}">${stockLabel}</p>
          <h3 class="product-title">${escapeHtml(product.title)}</h3>
          <div class="product-foot">
            <p class="product-price">${formatMoney(product.price)}</p>
          </div>
        </article>
      `;
    })
    .join("");
};

const copyText = async (text) => {
  if (!text) return;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const area = document.createElement("textarea");
  area.value = text;
  document.body.appendChild(area);
  area.select();
  document.execCommand("copy");
  document.body.removeChild(area);
};

const buildOrderSummaryText = () => {
  const entries = getCartEntries();
  if (!entries.length) {
    return "No hay productos en el carrito.";
  }

  return entries
    .map((item, index) => `${index + 1}. ${item.title} x${normalizeQty(item.qty)}`)
    .join("\n");
};

const setOrderModalOpen = (open) => {
  const backdrop = document.querySelector("[data-order-backdrop]");
  const modal = document.querySelector("[data-order-modal]");
  if (!backdrop || !modal) return;

  backdrop.classList.toggle("is-open", open);
  modal.classList.toggle("is-open", open);
  modal.setAttribute("aria-hidden", open ? "false" : "true");
};

const renderOrderPreview = () => {
  const previewNode = document.querySelector("[data-order-preview]");
  if (!previewNode) return;

  const entries = getCartEntries();
  if (!entries.length) {
    previewNode.innerHTML = '<p class="order-preview-empty">No hay productos.</p>';
    return;
  }

  const rows = entries
    .slice(0, 2)
    .map((item) => {
      const thumbStyle = item.image
        ? ` style="background-image:url('${escapeHtml(item.image)}')"`
        : "";

      return `
        <article class="order-preview-row">
          <div class="order-preview-thumb"${thumbStyle}></div>
          <div class="order-preview-copy">
            <h4>${escapeHtml(item.title)}</h4>
            <p>x${normalizeQty(item.qty)}</p>
          </div>
        </article>
      `;
    })
    .join("");

  const extra = entries.length > 2 ? `<p class="order-preview-more">+${entries.length - 2} productos mas</p>` : "";
  previewNode.innerHTML = rows + extra;
};

const renderCheckout = () => {
  const itemsNode = document.querySelector("[data-checkout-items]");
  const subtotalNode = document.querySelector("[data-checkout-subtotal]");
  const taxNode = document.querySelector("[data-checkout-tax]");
  const totalNode = document.querySelector("[data-checkout-total]");
  const payButton = document.querySelector("[data-pay-link]");

  if (!itemsNode || !subtotalNode || !totalNode) return;

  const entries = getCartEntries();
  const { total } = getCartTotals(entries);
  const tax = 0;
  const grandTotal = total + tax;

  if (!entries.length) {
    itemsNode.innerHTML = `
      <div class="checkout-empty">
        <p>Tu carrito esta vacio.</p>
        <span>Agrega productos desde el catalogo para continuar.</span>
      </div>
    `;
    if (payButton) {
      payButton.classList.add("is-disabled");
      payButton.setAttribute("aria-disabled", "true");
      payButton.removeAttribute("href");
    }
  } else {
    itemsNode.innerHTML = entries
      .map(
        (item) => `
          <article class="checkout-item">
            <div class="checkout-item-main">
              <div class="checkout-thumb" ${item.image ? `style="background-image:url('${escapeHtml(item.image)}')"` : ""}></div>
              <div class="checkout-item-copy">
                <h4>${escapeHtml(item.title)}</h4>
                <p>${formatMoney(item.price)} c/u</p>
                <div class="item-controls">
                  <button type="button" data-checkout-action="minus" data-sku="${escapeHtml(item.sku)}">-</button>
                  <span class="item-qty">${item.qty}</span>
                  <button type="button" data-checkout-action="plus" data-sku="${escapeHtml(item.sku)}">+</button>
                </div>
              </div>
            </div>
            <div class="checkout-item-side">
              <button class="checkout-remove" type="button" aria-label="Eliminar producto" data-checkout-action="remove" data-sku="${escapeHtml(item.sku)}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2"></path>
                  <path d="M19 6l-1 14H6L5 6"></path>
                  <line x1="10" y1="11" x2="10" y2="17"></line>
                  <line x1="14" y1="11" x2="14" y2="17"></line>
                </svg>
              </button>
              <strong>${formatMoney(item.price * item.qty)}</strong>
            </div>
          </article>
        `
      )
      .join("");

    if (payButton) {
      payButton.classList.remove("is-disabled");
      payButton.setAttribute("href", PAYPAL_LINK);
      payButton.removeAttribute("aria-disabled");
    }
  }

  subtotalNode.textContent = formatMoney(total);
  if (taxNode) {
    taxNode.textContent = formatMoney(tax);
  }
  totalNode.textContent = formatMoney(grandTotal);

  if (!itemsNode.dataset.bound) {
    itemsNode.dataset.bound = "true";
    itemsNode.addEventListener("click", (event) => {
      const button = event.target.closest("[data-checkout-action]");
      if (!button) return;
      const sku = button.dataset.sku;
      const action = button.dataset.checkoutAction;
      if (action === "minus") updateCartItem(sku, -1);
      if (action === "plus") updateCartItem(sku, 1);
      if (action === "remove") removeCartItem(sku);
    });
  }
};

const renderProductDetail = () => {
  const titleNode = document.querySelector("[data-detail-title]");
  if (!titleNode) return;

  const sku = new URLSearchParams(window.location.search).get("sku") || PRODUCTS[0].sku;
  const product = PRODUCT_INDEX[sku] || PRODUCTS[0];

  const imageNode = document.querySelector("[data-detail-image]");
  const descriptionNode = document.querySelector("[data-detail-description]");
  const priceNode = document.querySelector("[data-detail-price]");
  const categoryNode = document.querySelector("[data-detail-category]");
  const skuNode = document.querySelector("[data-detail-sku]");
  const stockNode = document.querySelector("[data-detail-stock]");
  const addButton = document.querySelector("[data-detail-add]");
  const qtyInput = document.querySelector("[data-detail-qty]");
  const minus = document.querySelector("[data-detail-minus]");
  const plus = document.querySelector("[data-detail-plus]");
  const summaryImage = document.querySelector("[data-summary-image]");
  const summaryTitle = document.querySelector("[data-summary-title]");
  const summaryQty = document.querySelector("[data-summary-qty]");
  const summaryLine = document.querySelector("[data-summary-line]");
  const summarySubtotal = document.querySelector("[data-summary-subtotal]");
  const summaryTotal = document.querySelector("[data-summary-total]");

  const updateDetailTotals = () => {
    const qty = normalizeQty(qtyInput ? qtyInput.value : 1);
    const subtotal = Number(product.price) * qty;

    if (qtyInput) {
      qtyInput.value = String(qty);
    }
    if (summaryQty) {
      summaryQty.textContent = String(qty);
    }
    if (summaryLine) {
      summaryLine.textContent = formatMoney(subtotal);
    }
    if (summarySubtotal) {
      summarySubtotal.textContent = formatMoney(subtotal);
    }
    if (summaryTotal) {
      summaryTotal.textContent = formatMoney(subtotal);
    }
  };

  titleNode.textContent = product.title;
  if (descriptionNode) {
    descriptionNode.textContent = getProductDescription(product);
  }
  if (priceNode) {
    priceNode.textContent = formatMoney(product.price);
  }
  if (categoryNode) {
    categoryNode.textContent = product.brand;
  }
  if (skuNode) {
    skuNode.textContent = product.sku.replace(/-/g, "");
  }
  if (stockNode) {
    stockNode.textContent = product.stock === "in" ? "En stock" : "Agotado";
    stockNode.classList.remove("is-in", "is-out");
    stockNode.classList.add(product.stock === "in" ? "is-in" : "is-out");
  }
  if (imageNode) {
    if (product.image) {
      imageNode.style.backgroundImage = `url('${product.image}')`;
    } else {
      imageNode.style.backgroundImage = "";
    }
  }
  if (summaryImage) {
    if (product.image) {
      summaryImage.style.backgroundImage = `url('${product.image}')`;
    } else {
      summaryImage.style.backgroundImage = "";
    }
  }
  if (summaryTitle) {
    summaryTitle.textContent = product.title;
  }
  if (addButton) {
    addButton.dataset.sku = product.sku;
    addButton.disabled = product.stock !== "in";
    addButton.textContent = product.stock === "in" ? "Agregar al carrito" : "Sin stock";
  }
  if (qtyInput) {
    qtyInput.value = "1";
    if (product.stock !== "in") {
      qtyInput.disabled = true;
    }
    qtyInput.addEventListener("input", updateDetailTotals);
    qtyInput.addEventListener("change", updateDetailTotals);
  }
  if (minus) {
    if (product.stock !== "in") {
      minus.disabled = true;
    }
  }
  if (plus) {
    if (product.stock !== "in") {
      plus.disabled = true;
    }
  }

  if (minus && qtyInput) {
    minus.addEventListener("click", () => {
      qtyInput.value = String(Math.max(1, normalizeQty(qtyInput.value) - 1));
      updateDetailTotals();
    });
  }

  if (plus && qtyInput) {
    plus.addEventListener("click", () => {
      qtyInput.value = String(normalizeQty(qtyInput.value) + 1);
      updateDetailTotals();
    });
  }

  updateDetailTotals();
};

const bindCatalogControls = () => {
  const searchInput = document.querySelector("[data-search-input]");
  if (searchInput) {
    searchInput.addEventListener("input", () => {
      state.searchTerm = searchInput.value || "";
      renderProductGrid();
    });
  }

  const serviceButtons = Array.from(document.querySelectorAll("[data-filter-service]"));
  if (serviceButtons.length) {
    serviceButtons.forEach((button) => {
      button.addEventListener("click", () => {
        state.activeService = button.dataset.filterService || "all";
        serviceButtons.forEach((node) => node.classList.toggle("is-active", node === button));
        renderProductGrid();
      });
    });
  }

  const toggle = document.querySelector("[data-toggle-streaming]");
  const sidebar = document.querySelector(".catalog-sidebar");
  if (toggle && sidebar) {
    toggle.addEventListener("click", () => {
      sidebar.classList.toggle("is-collapsed");
    });
  }
};

const bindCartDrawer = () => {
  const overlay = document.querySelector("[data-cart-overlay]");
  const drawer = document.querySelector("[data-cart-drawer]");

  if (!overlay || !drawer) return;

  document.querySelectorAll("[data-cart-toggle]").forEach((button) => {
    button.addEventListener("click", () => setCartOpen(true));
  });

  overlay.addEventListener("click", () => setCartOpen(false));

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      setCartOpen(false);
    }
  });

  drawer.addEventListener("click", (event) => {
    const button = event.target.closest("[data-cart-action]");
    if (!button) return;

    const sku = button.dataset.sku;
    const action = button.dataset.cartAction;

    if (action === "minus") updateCartItem(sku, -1);
    if (action === "plus") updateCartItem(sku, 1);
    if (action === "remove") removeCartItem(sku);
  });
};

const bindCheckoutPayModal = () => {
  const payButton = document.querySelector("[data-pay-link]");
  const modal = document.querySelector("[data-order-modal]");
  const backdrop = document.querySelector("[data-order-backdrop]");
  const copyArea = document.querySelector("[data-order-copy-text]");
  const copyBtn = document.querySelector("[data-order-copy-btn]");
  const closeBtn = document.querySelector("[data-order-close-btn]");
  const statusNode = document.querySelector("[data-order-copy-status]");

  if (!payButton || !modal || !backdrop || !copyArea || !copyBtn || !closeBtn || !statusNode) return;

  const closeModal = () => {
    setOrderModalOpen(false);
    statusNode.textContent = "";
  };

  payButton.addEventListener("click", (event) => {
    if (payButton.classList.contains("is-disabled")) {
      event.preventDefault();
      return;
    }
    renderOrderPreview();
    copyArea.value = buildOrderSummaryText();
    statusNode.textContent = "";
    setOrderModalOpen(true);
  });

  copyBtn.addEventListener("click", async () => {
    await copyText(copyArea.value || buildOrderSummaryText());
    statusNode.textContent = "Productos copiados.";
  });

  closeBtn.addEventListener("click", closeModal);
  backdrop.addEventListener("click", closeModal);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeModal();
    }
  });
};

const bindAddToCart = () => {
  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-add-to-cart]");
    if (!button || button.disabled) return;

    const sku = button.dataset.sku;
    if (!sku) return;

    let qty = 1;
    if (button.hasAttribute("data-detail-add")) {
      const qtyInput = document.querySelector("[data-detail-qty]");
      qty = normalizeQty(qtyInput ? qtyInput.value : 1);
    }

    addToCart(sku, qty);

    if (!button.dataset.label) {
      button.dataset.label = button.textContent.trim();
    }

    button.classList.add("is-added");
    button.textContent = "Agregado";
    setTimeout(() => {
      button.classList.remove("is-added");
      button.textContent = button.dataset.label || "Agregar al carrito";
    }, 800);
  });
};

const bindProductCardNavigation = () => {
  document.addEventListener("click", (event) => {
    const card = event.target.closest(".product-card[data-product-link]");
    if (!card) return;
    if (event.target.closest("[data-add-to-cart]")) return;

    const link = card.dataset.productLink;
    if (!link) return;
    window.location.href = link;
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;

    const card = event.target.closest(".product-card[data-product-link]");
    if (!card) return;
    if (event.target.closest("[data-add-to-cart]")) return;

    const link = card.dataset.productLink;
    if (!link) return;

    event.preventDefault();
    window.location.href = link;
  });
};

updateCartCount();
renderCartDrawer();
renderProductGrid();
renderCheckout();
renderProductDetail();
bindCatalogControls();
bindCartDrawer();
bindAddToCart();
bindProductCardNavigation();
bindCheckoutPayModal();


