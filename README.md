# Aura Design — Setup Guide

## Files
- `index.html` — Public portfolio homepage
- `admin.html` — Password-protected admin dashboard  
- `client.html` — Client review page (accessed via unique link)
- `style.css` — All styles (glassmorphism dark UI)
- `script.js` — All logic (auth, uploads, gallery, annotations)

## GitHub Pages Deployment
1. Create a new GitHub repository
2. Upload all 5 files to the root of the repo
3. Go to Settings → Pages → Source: `main` branch / `root`
4. Your site will be at: `https://yourusername.github.io/repo-name/`

## Admin Access
- Visit `yoursite/admin.html`
- Password: **1040**
- Or click "Admin Access" on the homepage

## How the Client Link System Works
1. Admin uploads a design + sets title/client name
2. A unique ID is generated: `Date.now() + random string`
3. The client link is: `yoursite/client.html?id=UNIQUE_ID`
4. The client page reads the `?id=` param and loads from localStorage
5. Client can add annotations (click anywhere on design), then approve or request changes
6. All data saved in browser localStorage — no backend needed

### Public Flyer URLs (Cross-device support)
- In the admin panel, you can now paste a **public URL** (image or PDF) instead of uploading a local file.
- If you use a public URL, the same flyer can be viewed from phone, PC, and other devices because the media is hosted online.
- Local uploads still remain browser-local due to localStorage constraints.

## Annotation System
- Client clicks anywhere on the design image to place a numbered marker
- A popup appears to type a comment for that exact location
- Markers are stored as `{ x%, y%, comment }` — position is percentage-based so it works on any screen size
- Admin can see annotation count and client decision in the admin dashboard

## Limitations (No-backend constraints)
- All data lives in localStorage — clearing browser storage will erase projects
- Files are stored as base64 strings — keep uploads under ~5MB for best performance
- Each browser/device has its own storage — share the link across devices will show the project only if they're on the same browser that uploaded
- For production use, connect to a backend (Supabase, Firebase) to persist data server-side
