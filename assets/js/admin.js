const fields = {
  title: document.querySelector("#article-title"),
  titleEn: document.querySelector("#article-title-en"),
  language: document.querySelector("#article-language"),
  date: document.querySelector("#article-date"),
  slug: document.querySelector("#article-slug"),
  summary: document.querySelector("#article-summary"),
  tags: document.querySelector("#article-tags"),
  featured: document.querySelector("#article-featured"),
  published: document.querySelector("#article-published"),
  body: document.querySelector("#markdown-editor")
};

const preview = {
  title: document.querySelector("#preview-title"),
  summary: document.querySelector("#preview-summary"),
  date: document.querySelector("#preview-date"),
  reading: document.querySelector("#preview-reading"),
  tags: document.querySelector("#preview-tags"),
  body: document.querySelector("#markdown-preview"),
  cover: document.querySelector("#preview-cover")
};

const targetFile = document.querySelector("#target-file");
const coverTarget = document.querySelector("#cover-target");
const wordCount = document.querySelector("#word-count");
const readingTime = document.querySelector("#reading-time");
const autosaveStatus = document.querySelector("#autosave-status");
const draftState = document.querySelector("#draft-state");
const toast = document.querySelector("#toast");
const coverInput = document.querySelector("#cover-input");
const coverDrop = document.querySelector("#cover-drop");
const coverPreview = document.querySelector("#cover-preview");
const coverPreviewImage = document.querySelector("#cover-preview-image");
let coverObjectUrl = "";
let slugWasEdited = false;
let saveTimer = 0;
const adminMessages = {
  zh: {
    saved: "草稿已保存在当前浏览器中。",
    generated: "已生成",
    copied: "Markdown 已复制到剪贴板。",
    clipboardError: "无法访问剪贴板，请使用下载功能。",
    longArticle: "文章较长，已下载 Markdown。请在 GitHub 的 _posts 目录上传该文件。",
    githubOpened: "已打开 GitHub 官方编辑器，请检查并提交文章。",
    invalidCover: "请选择 PNG、JPEG、WebP 或 SVG 图片。",
    coverLoaded: "封面已载入预览。发布前请将图片上传到提示路径。",
    draftSaved: "DRAFT SAVED",
    draftRestored: "DRAFT RESTORED",
    editing: "EDITING..."
  },
  en: {
    saved: "Draft saved in this browser.",
    generated: "Generated",
    copied: "Markdown copied to the clipboard.",
    clipboardError: "Clipboard access failed. Use the download action instead.",
    longArticle: "This article is too long for a prefilled URL. The Markdown was downloaded; upload it to GitHub's _posts directory.",
    githubOpened: "GitHub's official editor is open. Review and commit the article there.",
    invalidCover: "Choose a PNG, JPEG, WebP, or SVG image.",
    coverLoaded: "Cover loaded for preview. Upload it to the suggested path before publishing.",
    draftSaved: "DRAFT SAVED",
    draftRestored: "DRAFT RESTORED",
    editing: "EDITING..."
  }
};

function adminText(key) {
  const language = document.documentElement.dataset.language === "en" ? "en" : "zh";
  return adminMessages[language][key];
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function slugify(value) {
  return value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[\u4e00-\u9fff]+/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "new-article";
}

function parseTags() {
  return fields.tags.value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 10);
}

function markdownToHtml(markdown) {
  const codeBlocks = [];
  let source = markdown.replace(/```([\w-]*)\n([\s\S]*?)```/g, (_, language, code) => {
    const token = `@@CODEBLOCK${codeBlocks.length}@@`;
    codeBlocks.push(`<pre><code data-language="${escapeHtml(language)}">${escapeHtml(code.trim())}</code></pre>`);
    return token;
  });

  source = escapeHtml(source)
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/^&gt; (.+)$/gm, "<blockquote>$1</blockquote>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/_(.+?)_/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

  const lines = source.split("\n");
  const html = [];
  let inList = false;

  lines.forEach((line) => {
    if (/^- /.test(line)) {
      if (!inList) {
        html.push("<ul>");
        inList = true;
      }
      html.push(`<li>${line.slice(2)}</li>`);
      return;
    }

    if (inList) {
      html.push("</ul>");
      inList = false;
    }

    if (!line.trim()) return;
    if (/^<(h[1-3]|pre|blockquote)/.test(line) || /^@@CODEBLOCK/.test(line)) {
      html.push(line);
    } else {
      html.push(`<p>${line}</p>`);
    }
  });

  if (inList) html.push("</ul>");

  return html
    .join("\n")
    .replace(/@@CODEBLOCK(\d+)@@/g, (_, index) => codeBlocks[Number(index)]);
}

function countWords(value) {
  const latinWords = value.match(/[A-Za-z0-9]+/g)?.length || 0;
  const chineseCharacters = value.match(/[\u4e00-\u9fff]/g)?.length || 0;
  return latinWords + chineseCharacters;
}

function calculateReadingTime(value) {
  return Math.max(1, Math.ceil(countWords(value) / 280));
}

function formatDate(value) {
  return value ? value.replaceAll("-", ".") : "2026.06.08";
}

function updateTargetPaths() {
  const slug = slugify(fields.slug.value);
  if (fields.slug.value !== slug) fields.slug.value = slug;
  targetFile.textContent = `${fields.date.value}-${slug}.md`;
  coverTarget.textContent = `assets/articles/${slug}/cover.webp`;
}

function updatePreview() {
  const tags = parseTags();
  const readTime = calculateReadingTime(fields.body.value);

  preview.title.textContent =
    fields.language.value === "en" && fields.titleEn.value.trim()
      ? fields.titleEn.value
      : fields.title.value;
  preview.summary.textContent = fields.summary.value;
  preview.date.textContent = formatDate(fields.date.value);
  preview.reading.textContent = `${readTime} MIN READ`;
  preview.tags.replaceChildren(
    ...tags.map((tag) => {
      const item = document.createElement("li");
      item.textContent = tag;
      return item;
    })
  );
  preview.body.innerHTML = markdownToHtml(fields.body.value);
  wordCount.textContent = String(countWords(fields.body.value));
  readingTime.textContent = String(readTime);
  updateTargetPaths();
}

function articleMarkdown() {
  const tags = parseTags().map((tag) => `"${tag.replaceAll('"', '\\"')}"`).join(", ");
  const slug = slugify(fields.slug.value);
  const cover = `/assets/articles/${slug}/cover.webp`;
  const safeTitle = fields.title.value.replaceAll('"', '\\"');
  const safeTitleEn = fields.titleEn.value.replaceAll('"', '\\"');
  const safeSummary = fields.summary.value.replaceAll('"', '\\"');

  return `---
layout: post
title: "${safeTitle}"
title_en: "${safeTitleEn}"
description: "${safeSummary}"
date: ${fields.date.value} 09:00:00 +0800
updated: ${fields.date.value}
lang: ${fields.language.value}
translation_key: ${slug}
tags: [${tags}]
cover: ${cover}
featured: ${fields.featured.checked}
published: ${fields.published.checked}
read_time: ${calculateReadingTime(fields.body.value)}
---

${fields.body.value.trim()}
`;
}

function draftData() {
  return {
    title: fields.title.value,
    titleEn: fields.titleEn.value,
    language: fields.language.value,
    date: fields.date.value,
    slug: fields.slug.value,
    summary: fields.summary.value,
    tags: fields.tags.value,
    featured: fields.featured.checked,
    published: fields.published.checked,
    body: fields.body.value
  };
}

function saveDraft(silent = false) {
  localStorage.setItem("austinelite-article-draft", JSON.stringify(draftData()));
  autosaveStatus.textContent = `AUTOSAVED ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  draftState.textContent = adminText("draftSaved");
  if (!silent) showToast(adminText("saved"));
}

function loadDraft() {
  const raw = localStorage.getItem("austinelite-article-draft");
  if (!raw) return;
  try {
    const draft = JSON.parse(raw);
    Object.entries(draft).forEach(([key, value]) => {
      const field = fields[key];
      if (!field) return;
      if (field.type === "checkbox") field.checked = Boolean(value);
      else field.value = value;
    });
    slugWasEdited = true;
    draftState.textContent = adminText("draftRestored");
  } catch {
    localStorage.removeItem("austinelite-article-draft");
  }
}

function scheduleAutosave() {
  clearTimeout(saveTimer);
  autosaveStatus.textContent = adminText("editing");
  saveTimer = setTimeout(() => saveDraft(true), 800);
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("is-visible");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("is-visible"), 2600);
}

function downloadMarkdown() {
  const fileName = `${fields.date.value}-${slugify(fields.slug.value)}.md`;
  const blob = new Blob([articleMarkdown()], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
  showToast(`${adminText("generated")} ${fileName}`);
}

async function copyMarkdown() {
  try {
    await navigator.clipboard.writeText(articleMarkdown());
    showToast(adminText("copied"));
  } catch {
    showToast(adminText("clipboardError"));
  }
}

function publishToGitHub() {
  const fileName = `${fields.date.value}-${slugify(fields.slug.value)}.md`;
  const base = "https://github.com/AustinElite/AustinElite.github.io/new/main/_posts";
  const query = new URLSearchParams({
    filename: fileName,
    value: articleMarkdown()
  });
  const url = `${base}?${query}`;

  if (url.length > 7800) {
    downloadMarkdown();
    showToast(adminText("longArticle"));
    window.open(base, "_blank", "noopener,noreferrer");
    return;
  }

  window.open(url, "_blank", "noopener,noreferrer");
  showToast(adminText("githubOpened"));
}

function useCoverFile(file) {
  if (!file || !file.type.startsWith("image/")) {
    showToast(adminText("invalidCover"));
    return;
  }
  if (coverObjectUrl) URL.revokeObjectURL(coverObjectUrl);
  coverObjectUrl = URL.createObjectURL(file);
  coverPreviewImage.src = coverObjectUrl;
  preview.cover.src = coverObjectUrl;
  coverPreview.classList.add("is-visible");
  showToast(adminText("coverLoaded"));
}

Object.values(fields).forEach((field) => {
  field.addEventListener("input", () => {
    if (field === fields.slug) slugWasEdited = true;
    if ((field === fields.titleEn || field === fields.title) && !slugWasEdited) {
      fields.slug.value = slugify(fields.titleEn.value || fields.title.value);
    }
    updatePreview();
    scheduleAutosave();
  });
  field.addEventListener("change", () => {
    updatePreview();
    scheduleAutosave();
  });
});

document.querySelectorAll("[data-wrap]").forEach((button) => {
  button.addEventListener("click", () => {
    const marker = button.dataset.wrap;
    const start = fields.body.selectionStart;
    const end = fields.body.selectionEnd;
    const selected = fields.body.value.slice(start, end);
    fields.body.setRangeText(`${marker}${selected}${marker}`, start, end, "select");
    fields.body.dispatchEvent(new Event("input"));
    fields.body.focus();
  });
});

document.querySelectorAll("[data-prefix]").forEach((button) => {
  button.addEventListener("click", () => {
    const start = fields.body.selectionStart;
    fields.body.setRangeText(button.dataset.prefix, start, start, "end");
    fields.body.dispatchEvent(new Event("input"));
    fields.body.focus();
  });
});

document.querySelectorAll("[data-block]").forEach((button) => {
  button.addEventListener("click", () => {
    const start = fields.body.selectionStart;
    fields.body.setRangeText(`\n${button.dataset.block}\n`, start, start, "end");
    fields.body.dispatchEvent(new Event("input"));
    fields.body.focus();
  });
});

coverInput.addEventListener("change", () => useCoverFile(coverInput.files[0]));
["dragenter", "dragover"].forEach((eventName) => {
  coverDrop.addEventListener(eventName, (event) => {
    event.preventDefault();
    coverDrop.classList.add("is-dragging");
  });
});
["dragleave", "drop"].forEach((eventName) => {
  coverDrop.addEventListener(eventName, (event) => {
    event.preventDefault();
    coverDrop.classList.remove("is-dragging");
  });
});
coverDrop.addEventListener("drop", (event) => useCoverFile(event.dataTransfer.files[0]));

document.querySelector("#save-draft").addEventListener("click", () => saveDraft());
document.querySelector("#copy-markdown").addEventListener("click", copyMarkdown);
document.querySelector("#download-markdown").addEventListener("click", downloadMarkdown);
document.querySelector("#publish-github").addEventListener("click", publishToGitHub);

loadDraft();
updatePreview();
