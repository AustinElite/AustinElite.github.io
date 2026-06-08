const postContent = document.querySelector(".post-content");
const toc = document.querySelector("#post-toc");
const copyButton = document.querySelector("#copy-link");
const copyLabel = document.querySelector("[data-copy-label]");

if (postContent && toc) {
  const headings = [...postContent.querySelectorAll("h2")];
  headings.forEach((heading, index) => {
    if (!heading.id) heading.id = `section-${index + 1}`;
    const link = document.createElement("a");
    link.href = `#${heading.id}`;
    link.textContent = heading.textContent;
    toc.append(link);
  });
}

copyButton?.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(location.href);
    copyLabel.textContent = document.documentElement.lang.startsWith("zh") ? "已复制" : "Copied";
    setTimeout(() => {
      copyLabel.textContent = document.documentElement.lang.startsWith("zh") ? "复制链接" : "Copy link";
    }, 1600);
  } catch {
    copyLabel.textContent = location.href;
  }
});

