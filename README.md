# SPTT Dashboard Logbook Presets

Unofficial Tampermonkey userscript for the SPTT Dashboard logbook pages.

> **Access note:** SPTT Dashboard is not a public website. It is used for a specific university placement program only. Do not try to enrol in or request access to SPTT unless your university/course has explicitly directed you to use it; unrelated access requests will be denied.

It adds local presets, persistent last-used activity selections, daily hour totals, dashboard progress indicators, planned Notes activity creation, and a default `20` rows per page setting for logbook activity tables.

## What It Does

- Adds a compact `Logbook presets` panel inside the `New activity` modal.
- Saves and applies named activity presets.
- Includes baked-in starter presets.
- Persists last-used activity selections locally.
- Keeps the date persistent separately from presets.
- Defaults blank dates to today only when no last-used date exists.
- Shows daily hour totals with activity-type breakdowns on logbook pages.
- Defaults activity tables to `20` items per page.
- Plans and creates Notes activities to fill a selected date to `7.5` hours.
- Adds contract dashboard progress helpers:
  - `Week X / Y`
  - `X weeks remaining`
  - `Total hours forecast: X / 400 hrs`
  - `Client contact forecast: X / 172 hrs`
  - `Client contact hours of 172 hrs`
  - The forecast can include locally cached visible `Client Contact` hours from unsubmitted/unapproved logbooks after you have opened those logbook pages.

## Safety Notes

This script is local-only and intentionally conservative.

- It does not submit the logbook automatically.
- It does not call the SPTT Dashboard API.
- It does not use `fetch`, `XMLHttpRequest`, or `GM_xmlhttpRequest`.
- It does not read cookies, passwords, tokens, authentication headers, usernames, or emails.
- Presets are stored locally with `GM_setValue`, falling back to `localStorage`.
- The planned Notes helper may click `Create activity` for Notes drafts only.
- It must never click `Submit logbook`; logbook submission remains manual.

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

1. Open `New activity`.
2. Choose the day in the clearly labeled `Day to fill` dropdown. The options come from the visible daily totals.
3. Click `Fill selected day with notes`.
4. The script calculates the missing Notes chunks, fills each planned Notes activity, and clicks `Create activity` for those Notes drafts.
5. Review the created activities in the logbook table.
6. Submit the logbook manually only when you are satisfied.

The queue is stored locally and contains only dates and durations. If the visible daily totals change or the created activities look wrong, review the table before manually submitting the logbook.

The helper uses your baked/local Notes presets where possible. If no matching Notes preset duration is available, it falls back to the configured Notes dropdown values in `CONFIG.fillDayNotesFallbackValues` and the durations in `CONFIG.fillDayNotesFallbackDurations`.

This helper may click `Create activity`, but it must never click `Submit logbook`.

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

