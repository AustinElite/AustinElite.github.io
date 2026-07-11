import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

const owner = process.env.GITHUB_USER || "AustinElite";
const token = process.env.GITHUB_TOKEN || "";
const outputPath = path.join("assets", "data", "github-repos.json");

const headers = {
  Accept: "application/vnd.github+json",
  "User-Agent": "AustinElite-github-pages-sync"
};

if (token) {
  headers.Authorization = `Bearer ${token}`;
}

async function requestJson(url) {
  const response = await fetch(url, { headers });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`GitHub API ${response.status}: ${body.slice(0, 240)}`);
  }

  return response.json();
}

async function listRepositories() {
  const repos = [];

  for (let page = 1; page <= 10; page += 1) {
    const url = new URL(`https://api.github.com/users/${owner}/repos`);
    url.searchParams.set("sort", "updated");
    url.searchParams.set("direction", "desc");
    url.searchParams.set("per_page", "100");
    url.searchParams.set("page", String(page));

    const batch = await requestJson(url);
    repos.push(...batch);

    if (batch.length < 100) break;
  }

  return repos;
}

function normalizeRepository(repo) {
  return {
    name: repo.name,
    full_name: repo.full_name,
    description: repo.description,
    html_url: repo.html_url,
    homepage: repo.homepage,
    language: repo.language,
    topics: repo.topics || [],
    stargazers_count: repo.stargazers_count || 0,
    forks_count: repo.forks_count || 0,
    fork: Boolean(repo.fork),
    archived: Boolean(repo.archived),
    disabled: Boolean(repo.disabled),
    created_at: repo.created_at,
    updated_at: repo.updated_at,
    pushed_at: repo.pushed_at
  };
}

const repositories = (await listRepositories()).map(normalizeRepository);

try {
  const existing = JSON.parse(await readFile(outputPath, "utf8"));
  if (JSON.stringify(existing.repos || []) === JSON.stringify(repositories)) {
    console.log(`No repository changes for ${owner}.`);
    process.exit(0);
  }
} catch (error) {
  // No existing snapshot yet.
}

const snapshot = {
  owner,
  generatedAt: new Date().toISOString(),
  source: `https://api.github.com/users/${owner}/repos`,
  repos: repositories
};

await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(`${outputPath}.tmp`, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");
await rename(`${outputPath}.tmp`, outputPath);

console.log(`Synced ${repositories.length} repositories for ${owner}.`);
