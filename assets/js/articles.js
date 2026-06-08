const searchInput = document.querySelector("#article-search");
const filterButtons = [...document.querySelectorAll("[data-filter]")];
const articleCards = [...document.querySelectorAll(".article-card")];
const emptyState = document.querySelector("#article-empty");
let activeFilter = "all";
let articleLanguage = document.documentElement.dataset.language || "zh";

function normalize(value) {
  return value.toLocaleLowerCase().trim();
}

function updateCardLanguage(language) {
  articleLanguage = language;
  articleCards.forEach((card) => {
    const title = card.dataset[`title${language === "zh" ? "Zh" : "En"}`];
    const description = card.dataset[`description${language === "zh" ? "Zh" : "En"}`];
    const titleElement = card.querySelector("[data-card-title]");
    const descriptionElement = card.querySelector("[data-card-description]");
    if (title && titleElement) titleElement.textContent = title;
    if (description && descriptionElement) descriptionElement.textContent = description;
  });
  filterArticles();
}

function filterArticles() {
  const query = normalize(searchInput?.value || "");
  let visibleCount = 0;

  articleCards.forEach((card) => {
    const tags = card.dataset.tags || "";
    const title = card.dataset[`title${articleLanguage === "zh" ? "Zh" : "En"}`] || "";
    const description = card.dataset[`description${articleLanguage === "zh" ? "Zh" : "En"}`] || "";
    const matchesFilter = activeFilter === "all" || tags.split(" ").includes(activeFilter);
    const matchesQuery = !query || normalize(`${title} ${description} ${tags}`).includes(query);
    const visible = matchesFilter && matchesQuery;
    card.hidden = !visible;
    if (visible) visibleCount += 1;
  });

  emptyState?.classList.toggle("is-visible", visibleCount === 0);
}

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activeFilter = button.dataset.filter;
    filterButtons.forEach((item) => {
      item.setAttribute("aria-pressed", String(item === button));
    });
    filterArticles();
  });
});

searchInput?.addEventListener("input", filterArticles);
window.addEventListener("austinelite:language", (event) => updateCardLanguage(event.detail));
updateCardLanguage(document.documentElement.dataset.language || "zh");
