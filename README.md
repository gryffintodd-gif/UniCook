# UniCook

A website that helps college students build affordable meals with the groceries they already have.
Built for the RESECON 490AI website lab (Oct 27, 2026) with the anti-slop-web skill.

## How to open it
Double-click `index.html`. It opens in your browser. No install and no server are needed.
The two fonts (Archivo and Permanent Marker) load from Google Fonts. If you're offline, a plain font is used instead.

## What's real and what's demo
| Part | Status |
|---|---|
| Fridge: typing or tapping ingredients, shelves, peel off, undo | Real. Saved in this browser only. |
| Recipe matching, READY stamp, filters, appliances, step timer | Real logic. The 15 recipes are demo content. |
| Add from a photo | **Demo.** The photo is shown, but nothing reads it. You tap what you see. Real scanning would need an AI vision service and a secret key on a server. |
| Grocery list | Real. Saved in this browser only. |
| Spice rack (Me) and seasonings in recipes | Real. Your rack is saved in this browser; each recipe marks which of its seasonings you have. |
| Feed posts, handles, like counts | **Demo.** Invented. Your likes are saved on this device. |
| Your own feed posts | Real, but saved on this device only. Other students can't see them (that needs a backend such as Supabase). |
| Video import (TikTok / Reels) | **Demo.** Only checks that the link looks right, then shows a sample recipe. Real import would need a server that gets the video's captions or transcript (where the platform allows it) plus an AI model. |
| Profile ("kitchen card") | **Demo sign-in.** No password and no account. Saved on this device only. |

Cooking oil and water are assumed in every kitchen. Salt and pepper are now listed as seasonings.

## Files
- `index.html`: the page and its six screens (Fridge, Cook, List, Feed, Import, Me)
- `styles.css`: design tokens at the top, then the components
- `app.js`: all behavior
- `data.js`: demo recipes, ingredients, posts and schools
- `store.js`: saving and loading (localStorage now; a real backend later)
- `NOTES.md`: design decisions and the changelog

## Deploy (later)
Static site, so GitHub Pages or Netlify Drop works as is. All paths are relative. There are no keys or secrets anywhere.
