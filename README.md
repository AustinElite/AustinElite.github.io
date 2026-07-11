# AustinElite

Personal portfolio and technical writing site for AustinElite.

## Local preview

The homepage and article index are generated from `_posts`, so use Jekyll for an exact local preview:

```powershell
bundle install
bundle exec jekyll serve
```

Open `http://localhost:4000`.

For a quick check of the standalone writing console, a static server is enough:

```powershell
python -m http.server 8000
```

Open `http://localhost:8000/admin/`.

## Publish an article

1. Open `/admin/`.
2. Write the article and preview it.
3. Select **Publish to GitHub** to open a prefilled GitHub file editor.
4. Upload the cover image under `assets/articles/<slug>/`.
5. Commit to `main`.

GitHub Pages will rebuild the article detail page, homepage feed, article index, and sitemap automatically.

## Dynamic GitHub projects

The homepage project section is generated from public repositories on the `AustinElite` GitHub account.

- The browser first reads `assets/data/github-repos.json`.
- `.github/workflows/sync-repos.yml` checks for changes every 6 hours and can also be run manually from the Actions tab.
- `scripts/sync-github-repos.mjs` talks to the GitHub API with the workflow token, so it avoids the low anonymous API limit.
- If the snapshot is missing, the browser tries a live GitHub API refresh and falls back to the static project cards if GitHub is rate-limited.

To change the account, update `data-github-user` in `index.html` and `GITHUB_USER` in `.github/workflows/sync-repos.yml`.
