(function () {
  "use strict";

  const profileStore = window.PROFILE_DATA;
  if (!profileStore?.locales) return;

  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
  const escapeHtml = (value) =>
    String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");

  const browserLocale = navigator.language.toLowerCase().startsWith("zh") ? "zh" : "en";
  let locale = localStorage.getItem("locale");
  if (!profileStore.locales[locale]) locale = browserLocale;
  let data = profileStore.locales[locale];
  let supabaseState = "checking";

  const setText = (selector, value) => {
    $$(selector).forEach((node) => {
      node.textContent = value;
    });
  };

  function renderStaticUi() {
    document.documentElement.lang = locale === "zh" ? "zh-CN" : "en";
    $$("[data-ui]").forEach((node) => {
      const value = data.ui[node.dataset.ui];
      if (value) node.textContent = value;
    });
    $$("[data-ui-aria]").forEach((node) => {
      const value = data.ui[node.dataset.uiAria];
      if (value) node.setAttribute("aria-label", value);
    });

    const languageButton = $("[data-language-toggle]");
    languageButton.textContent = data.ui.languageButton;
    languageButton.setAttribute("aria-label", data.ui.switchLanguage);
    languageButton.setAttribute("title", data.ui.switchLanguage);
    $("[data-filters]").setAttribute("aria-label", data.ui.filterLabel);

    document.title = data.meta.title;
    $('meta[name="description"]').content = data.meta.description;
    $('meta[property="og:title"]').content = data.meta.title;
    $('meta[property="og:description"]').content = data.meta.ogDescription;
  }

  function renderIdentity() {
    const identity = data.identity;
    setText("[data-name]", identity.name);
    setText("[data-monogram]", identity.monogram);
    setText("[data-role]", identity.role);
    setText("[data-status]", identity.status);
    setText("[data-headline]", identity.headline);
    setText("[data-summary]", identity.summary);

    const avatar = $("[data-avatar]");
    if (avatar) {
      avatar.src = profileStore.shared.avatar;
      avatar.alt = identity.avatarAlt;
    }

    const preferredContact = profileStore.shared.email
      ? `mailto:${profileStore.shared.email}`
      : profileStore.shared.social.find((item) => item.label.toLowerCase() === "github")?.url || "#contact";
    $$("[data-email-link]").forEach((link) => {
      link.href = preferredContact;
    });
  }

  function renderSocial() {
    const links = profileStore.shared.social
      .map(
        (item) =>
          `<a href="${escapeHtml(item.url)}" target="_blank" rel="noreferrer">${escapeHtml(item.label)} <span aria-hidden="true">↗</span></a>`,
      )
      .join("");
    $("[data-social-links]").innerHTML = links;
    $("[data-footer-links]").innerHTML = links;
  }

  function renderAbout() {
    $("[data-about]").innerHTML = data.about.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("");
    $("[data-principles]").innerHTML = data.principles
      .map(
        (item) => `
          <article class="principle reveal">
            <span>${escapeHtml(item.number)}</span>
            <h3>${escapeHtml(item.title)}</h3>
            <p>${escapeHtml(item.text)}</p>
          </article>`,
      )
      .join("");
  }

  function renderFocus() {
    $("[data-focus-grid]").innerHTML = data.focus
      .map(
        (item) => `
          <article class="focus-card reveal" data-accent="${escapeHtml(item.accent)}">
            <div class="focus-card-top">
              <span>${escapeHtml(item.index)}</span>
              <span class="focus-icon" aria-hidden="true">↗</span>
            </div>
            <h3>${escapeHtml(item.title)}</h3>
            <p>${escapeHtml(item.text)}</p>
            <ul>${item.tags.map((tag) => `<li>${escapeHtml(tag)}</li>`).join("")}</ul>
          </article>`,
      )
      .join("");
  }

  function renderWork(filter = null) {
    const visible = filter ? data.work.filter((item) => item.type === filter) : data.work;
    const grid = $("[data-work-grid]");
    grid.innerHTML = visible
      .map(
        (item) => `
          <article class="work-card reveal ${item.featured ? "featured" : ""}">
            <div class="work-meta"><span>${escapeHtml(item.type)}</span><span>${escapeHtml(item.year)}</span></div>
            <div>
              <h3>${escapeHtml(item.title)}</h3>
              <p>${escapeHtml(item.description)}</p>
            </div>
            <a href="${escapeHtml(item.link)}" ${item.link.startsWith("http") ? 'target="_blank" rel="noreferrer"' : ""}>
              ${escapeHtml(item.linkLabel)} <span aria-hidden="true">↗</span>
            </a>
          </article>`,
      )
      .join("");
    requestAnimationFrame(observeReveals);
  }

  function renderFilters() {
    const types = [...new Set(data.work.map((item) => item.type))];
    const root = $("[data-filters]");
    root.innerHTML = [
      `<button type="button" class="filter-button active" data-filter="">${escapeHtml(data.ui.all)}</button>`,
      ...types.map(
        (type) =>
          `<button type="button" class="filter-button" data-filter="${escapeHtml(type)}">${escapeHtml(type)}</button>`,
      ),
    ].join("");
    root.onclick = (event) => {
      const button = event.target.closest("[data-filter]");
      if (!button) return;
      $$("[data-filter]", root).forEach((item) => item.classList.toggle("active", item === button));
      renderWork(button.dataset.filter || null);
    };
  }

  function renderTimeline() {
    $("[data-timeline]").innerHTML = data.timeline
      .map(
        (item) => `
          <li class="timeline-item reveal">
            <p class="timeline-period">${escapeHtml(item.period)}</p>
            <div>
              <h3>${escapeHtml(item.title)}</h3>
              <p class="timeline-org">${escapeHtml(item.organization)}</p>
              <p>${escapeHtml(item.description)}</p>
            </div>
          </li>`,
      )
      .join("");
  }

  function renderBackendStatus() {
    const status = $("[data-supabase-status]");
    const config = window.SUPABASE_CONFIG;
    if (!status || !config?.projectName) return;
    status.dataset.state = supabaseState;
    const stateLabel =
      supabaseState === "connected"
        ? data.ui.connected
        : supabaseState === "offline"
          ? data.ui.reconnecting
          : locale === "zh"
            ? "正在连接"
            : "connecting";
    status.lastChild.textContent = ` ${config.projectName} ${stateLabel}`;
  }

  function renderAll() {
    renderStaticUi();
    renderIdentity();
    renderSocial();
    renderAbout();
    renderFocus();
    renderFilters();
    renderWork();
    renderTimeline();
    setText("[data-contact-copy]", data.contact.copy);
    setText("[data-year]", new Date().getFullYear());
    renderBackendStatus();
    observeReveals();
  }

  function setupLanguage() {
    $("[data-language-toggle]").addEventListener("click", () => {
      locale = locale === "zh" ? "en" : "zh";
      data = profileStore.locales[locale];
      localStorage.setItem("locale", locale);
      renderAll();
    });
  }

  function setupTheme() {
    const root = document.documentElement;
    const stored = localStorage.getItem("theme");
    const preferred = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    root.dataset.theme = stored || preferred;
    $("[data-theme-toggle]").addEventListener("click", () => {
      const next = root.dataset.theme === "dark" ? "light" : "dark";
      root.dataset.theme = next;
      localStorage.setItem("theme", next);
    });
  }

  function setupNavigation() {
    const button = $("[data-menu-toggle]");
    const menu = $("[data-mobile-menu]");
    const close = () => {
      button.setAttribute("aria-expanded", "false");
      menu.classList.remove("open");
      document.body.classList.remove("menu-open");
    };
    button.addEventListener("click", () => {
      const open = button.getAttribute("aria-expanded") !== "true";
      button.setAttribute("aria-expanded", String(open));
      menu.classList.toggle("open", open);
      document.body.classList.toggle("menu-open", open);
    });
    $$("a", menu).forEach((link) => link.addEventListener("click", close));

    const header = $("[data-header]");
    window.addEventListener("scroll", () => header.classList.toggle("scrolled", window.scrollY > 24), { passive: true });
  }

  async function setupSupabase() {
    const config = window.SUPABASE_CONFIG;
    if (!config?.url || !config?.publishableKey) return;

    try {
      const response = await fetch(`${config.url}/auth/v1/health`, {
        headers: { apikey: config.publishableKey },
      });
      if (!response.ok) throw new Error("Supabase health check failed");
      supabaseState = "connected";
    } catch {
      supabaseState = "offline";
    }
    renderBackendStatus();
  }

  let revealObserver;
  function observeReveals() {
    if (!revealObserver) {
      revealObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("visible");
              revealObserver.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.12 },
      );
    }
    $$(".reveal:not(.visible)").forEach((element) => revealObserver.observe(element));
  }

  setupTheme();
  setupLanguage();
  setupNavigation();
  renderAll();
  setupSupabase();
})();
