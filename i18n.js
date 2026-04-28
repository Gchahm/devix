const I18n = (() => {
  const SUPPORTED = ["en", "pt"];
  const DEFAULT = "en";
  const STORAGE_KEY = "lang";

  let translations = {};

  function getLang() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && SUPPORTED.includes(stored)) return stored;
    const browser = navigator.language.slice(0, 2);
    return SUPPORTED.includes(browser) ? browser : DEFAULT;
  }

  function get(obj, path) {
    return path.split(".").reduce((o, k) => o?.[k], obj);
  }

  function applyTranslations() {
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const val = get(translations, el.dataset.i18n);
      if (val != null) el.textContent = val;
    });

    document.querySelectorAll("[data-i18n-href]").forEach((el) => {
      const val = get(translations, el.dataset.i18nHref);
      if (val != null) el.href = val.startsWith("mailto:") ? val : `mailto:${val}`;
    });

    const meta = translations.meta;
    if (meta) {
      if (meta.title) document.title = meta.title;
      const desc = document.querySelector('meta[name="description"]');
      if (desc && meta.description) desc.content = meta.description;
    }

    document.querySelectorAll(".lang-switcher button").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.lang === currentLang);
    });
  }

  let currentLang = DEFAULT;

  async function setLang(lang) {
    if (!SUPPORTED.includes(lang)) lang = DEFAULT;
    currentLang = lang;
    localStorage.setItem(STORAGE_KEY, lang);
    document.documentElement.lang = lang;

    const res = await fetch(`/i18n/${lang}.json`);
    translations = await res.json();

    applyTranslations();

    // Render dynamic lists (services, privacy sections)
    renderServices();
    renderPrivacySections();
  }

  function renderServices() {
    const container = document.getElementById("services-grid");
    if (!container) return;
    const items = get(translations, "services.items");
    if (!items) return;
    container.innerHTML = items
      .map(
        (item) =>
          `<div class="service-card"><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.description)}</p></div>`
      )
      .join("");
  }

  function renderPrivacySections() {
    const container = document.getElementById("privacy-sections");
    if (!container) return;
    const sections = get(translations, "privacy.sections");
    if (!sections) return;
    container.innerHTML = sections
      .map(
        (s) =>
          `<div class="privacy-section"><h2>${escapeHtml(s.heading)}</h2><p>${escapeHtml(s.text)}</p></div>`
      )
      .join("");
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  async function init() {
    currentLang = getLang();
    await setLang(currentLang);

    document.querySelectorAll(".lang-switcher button").forEach((btn) => {
      btn.addEventListener("click", () => setLang(btn.dataset.lang));
    });
  }

  return { init, setLang };
})();

document.addEventListener("DOMContentLoaded", I18n.init);
