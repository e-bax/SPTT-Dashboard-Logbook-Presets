# SPTT Dashboard Logbook Presets

Unofficial Tampermonkey userscript for the SPTT Dashboard logbook pages.

> **Access note:** SPTT Dashboard is not a public website. It is used for a specific university placement program only. Do not try to enrol in or request access to SPTT unless your university/course has explicitly directed you to use it; unrelated access requests will be denied.

It adds local presets, persistent last-used activity selections, daily hour totals, dashboard progress indicators, and a default `20` rows per page setting for logbook activity tables.

## What It Does

- Adds a compact `Logbook presets` panel inside the `New activity` modal.
- Saves and applies named activity presets.
- Includes baked-in starter presets.
- Persists last-used activity selections locally.
- Keeps the date persistent separately from presets.
- Defaults blank dates to today only when no last-used date exists.
- Adds a `Repeat previous` button.
- Shows daily hour totals on logbook pages.
- Defaults activity tables to `20` items per page.
- Adds a manual `Fill notes to 7.5h` helper that fills a Notes activity for the remaining hours on the selected date.
- Adds contract dashboard progress helpers:
  - `Week X / Y`
  - `X weeks remaining`
  - `Client contact forecast: X / 172 hrs`
  - `Client contact hours of 172 hrs`

## Safety Notes

This script is local-only and intentionally conservative.

- It does not submit logbook activities automatically.
- It does not call the SPTT Dashboard API.
- It does not use `fetch`, `XMLHttpRequest`, or `GM_xmlhttpRequest`.
- It does not read cookies, passwords, tokens, authentication headers, usernames, or emails.
- Presets are stored locally with `GM_setValue`, falling back to `localStorage`.
- Always review the form before clicking `Create activity`.
- The `Fill notes to 7.5h` helper fills values only; it does not create or submit the activity.

This is not an official SPTT Dashboard tool. Use it at your own risk.

## Install Tampermonkey

1. Open your browser.
2. Install Tampermonkey:
   - Chrome / Edge: search for `Tampermonkey` in the Chrome Web Store.
   - Firefox: search for `Tampermonkey` in Firefox Add-ons.
3. After installing, pin the Tampermonkey extension if you want easy access.

## Install This Script

1. Open `logbook-presets.user.js` from this repository.
2. Click `Raw`.
3. Tampermonkey should open an install screen.
4. Click `Install`.
5. Go to the SPTT Dashboard.
6. Open a contract or logbook page.

The script runs on:

```text
https://sptt-dashboard.vercel.app/contracts/*
https://sptt-dashboard.vercel.app/contracts/*/logbooks/*
```

## Manual Install

If the `Raw` install flow does not open Tampermonkey:

1. Open Tampermonkey.
2. Click `Create a new script`.
3. Delete the default template.
4. Paste the full contents of `logbook-presets.user.js`.
5. Save.
6. Reload the SPTT Dashboard page.

## Fill Notes To 7.5 Hours

Use this after manually entering your real client contact and supervision activities for the day.

1. Open `New activity` for the same date.
2. Click `Fill notes to 7.5h`.
3. The script totals the visible activities for that date.
4. It fills the form with a Notes-style activity for the remaining hours to reach `7.5`.
5. Review the form yourself.
6. Click `Create activity` manually only if it is correct.

The helper uses your baked/local Notes presets where possible, then overrides only the duration. If no Notes preset is available, it falls back to the configured Notes dropdown values in `CONFIG.fillDayNotesFallbackValues`.

## Using Presets

1. Open a logbook.
2. Click `New activity`.
3. Use a baked-in preset, or fill the form manually.
4. To save your current selections:
   - Type a name into `Preset name`.
   - Click `Save current`.
5. To use a preset:
   - Click the preset chip.
   - Review the form.
   - Manually click `Create activity`.

Presets do not save or apply the date. The date is handled by last-used persistence.

## Last-Used Date And Fields

The script remembers your last-used fields locally. When you open `New activity`, it reapplies those values.

The date is persistent, so if you last used `30/07/2026`, opening the modal again should keep that date rather than resetting to today.

## Dashboard Targets

The script ships with a default client contact target of `172` hours.

To change it without editing code:

1. Open the contract dashboard.
2. Click the `Client contact forecast` text in the orange progress strip.
3. Enter your required target hours.
4. The value is saved locally in Tampermonkey/browser storage.

The code default is still available here if you want to change the shipped default:

```js
clientContactTargetHours: 172
```

## Updating From GitHub

If you installed through Tampermonkey from the `Raw` GitHub URL:

1. Open Tampermonkey.
2. Open the script.
3. Use Tampermonkey's update/check-for-updates option if available.

If you installed manually:

1. Open the latest `logbook-presets.user.js` on GitHub.
2. Click `Raw`.
3. Copy the full script.
4. Open the script in Tampermonkey.
5. Replace the old contents.
6. Save and reload the SPTT Dashboard.

## Connecting To GitHub As A Contributor

If you want to edit and push changes:

1. Install Git: <https://git-scm.com/downloads>
2. Clone the repo:

```bash
git clone https://github.com/e-bax/SPTT-Dashboard-Logbook-Presets.git
cd SPTT-Dashboard-Logbook-Presets
```

3. Make changes.
4. Check the diff:

```bash
git diff
```

5. Commit:

```bash
git add README.md logbook-presets.user.js
git commit -m "Update logbook presets userscript"
```

6. Push:

```bash
git push
```

If GitHub asks you to authenticate, use GitHub's browser login or a personal access token. Do not commit tokens or credentials into the repository.

## Files

- `logbook-presets.user.js` - the Tampermonkey userscript.
- `README.md` - install and usage instructions.

