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
