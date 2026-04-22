# Aura Design — Setup Guide

## Files
- `index.html` — Public portfolio homepage
- `admin.html` — Password-protected admin dashboard
- `client.html` — Client review page (accessed via unique link)
- `style.css` — All styles (dark glass UI)
- `script.js` — All logic (auth, uploads, gallery, annotations, cloud sync)

## GitHub Pages Deployment
1. Create a new GitHub repository.
2. Upload all files to the root of the repo.
3. Open **Settings → Pages** and set source to `main` branch / root.
4. Website URL will be: `https://yourusername.github.io/repo-name/`.

## Admin Access
- Visit `yoursite/admin.html`
- Password: **1040**
- Or click "Admin Access" on the homepage.

## Public Internet Storage (important)
By default, browser `localStorage` is only local to one browser.
To make uploaded projects visible publicly across devices, enable **GitHub Gist sync** in the admin dashboard:

1. Create a **public gist** in your GitHub account.
2. Add a file named exactly `projects.json` with content `[]`.
3. Copy the Gist ID (part of the gist URL).
4. Create a GitHub Personal Access Token with `gist` scope.
5. Open `admin.html` and enter:
   - Gist ID
   - Token
6. Click **Save Cloud Settings**.

Now uploads/deletes/feedback are synced to the public gist and can be read on other devices through GitHub Pages.

## How the Client Link System Works
1. Admin uploads a design and enters project title/client name.
2. A unique project ID is generated: `Date.now() + random string`.
3. Share link format: `yoursite/client.html?id=UNIQUE_ID`.
4. Client page reads `?id=` and loads the project.
5. Client can annotate, approve, or request changes.
6. Data is saved locally and (if configured) synced to the public gist.

## Annotation System
- Client clicks on the design to place a numbered marker.
- A popup collects the comment for that exact point.
- Markers are stored as `{ x%, y%, comment }`.
- Admin sees annotation count and decision in dashboard.

## Security Note
- The GitHub token is saved in local browser storage to allow direct sync from static pages.
- For production-level security, move upload/sync logic to a backend service.
