/**
 * GoldAlert — Personal Alerts Backend (Google Apps Script)
 * ==========================================================
 * What this does:
 *   1. doPost(e)        — receives new subscriptions from the website's subscribe
 *                          form and stores them in a "Subscribers" sheet.
 *   2. checkAndNotify()  — run this on a time-driven trigger (e.g. every 30-60
 *                          minutes). It reads the live signals.json published by
 *                          the site's GitHub Action, compares each asset's tier
 *                          to what it was last time, and for every asset that
 *                          just went UP a tier (HOLD -> WATCH, or WATCH -> STRONG),
 *                          emails and/or Telegram-messages every subscriber whose
 *                          preference matches that asset.
 *
 * Setup (one-time, ~10 minutes, entirely inside your own free Google account):
 *   1. Go to https://sheet.new to create a blank Google Sheet. Rename it
 *      "GoldAlert Subscribers" (or anything you like).
 *   2. In the Sheet, go to Extensions -> Apps Script.
 *   3. Delete the placeholder code and paste this entire file in its place.
 *   4. Click the save icon, name the project "GoldAlert Backend".
 *   5. In the left sidebar, click "Project Settings" (gear icon) -> Script
 *      Properties -> Add script property:
 *        - Property: TELEGRAM_BOT_TOKEN   Value: (see step 6)
 *   6. Create a Telegram bot: message @BotFather on Telegram, send /newbot,
 *      follow the prompts, and copy the token it gives you into the script
 *      property above. This bot is what will message your subscribers.
 *   7. Back in the Apps Script editor, click "Deploy" -> "New deployment".
 *      - Type: "Web app"
 *      - Execute as: "Me"
 *      - Who has access: "Anyone"
 *      Click "Deploy", authorize the requested permissions (this is your own
 *      script talking to your own Sheet — safe to allow), then copy the Web
 *      App URL it gives you.
 *   8. Open dist/index.html in your repo, find the line:
 *        const SUBSCRIBE_ENDPOINT = "";
 *      and paste your Web App URL between the quotes. Push that change (or
 *      ask Claude to do it) so the live site's subscribe form is connected.
 *   9. Back in Apps Script, click the clock icon ("Triggers") in the left
 *      sidebar -> "Add Trigger":
 *        - Function: checkAndNotify
 *        - Event source: Time-driven
 *        - Type: Minutes timer, every 30 minutes (or hourly — your choice)
 *      Save. That's it — subscriptions and alerts are now fully automatic.
 *
 * Cost: $0. Everything here runs on Google's free tier (Apps Script, Sheets,
 * and Gmail sending via MailApp all have generous free daily quotas that a
 * personal alert list will not come close to).
 */

const SIGNALS_URL = "https://goldalert.org/data/signals.json";
const SHEET_SUBSCRIBERS = "Subscribers";
const SHEET_STATE = "LastState";

function getSheet_(name, headerRow) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(headerRow);
  }
  return sheet;
}

/** Receives POST requests from the website's subscribe form. */
function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const email = (body.email || "").trim();
    const telegram = (body.telegram || "").trim();
    const pref = (body.pref || "any").trim();
    if (!email && !telegram) {
      return ContentService.createTextOutput(JSON.stringify({ ok: false, error: "empty" }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    const sheet = getSheet_(SHEET_SUBSCRIBERS, ["Timestamp", "Email", "Telegram Chat ID", "Preference"]);
    sheet.appendRow([new Date(), email, telegram, pref]);
    return ContentService.createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/** Maps a subscriber's notify preference to the asset IDs it covers. */
const PREF_GROUPS = {
  metals: ["XAUUSD", "XAGUSD"],
  stocks: ["AU", "KGC", "HMY", "GFI"],
  etf: ["GDX", "GLD", "SLV"],
  crypto: ["PAXG", "XAUT"],
};
function assetsForPref_(pref) {
  return PREF_GROUPS[pref] || null; // null/"any" = every asset
}

const TIER_RANK = { HOLD: 0, "50% BUY": 1, "100% BUY": 2 };

/** Run this on a time-driven trigger. Compares current vs. last-known tiers
 *  and notifies matching subscribers about any asset that just went up a tier. */
function checkAndNotify() {
  const resp = UrlFetchApp.fetch(SIGNALS_URL, { muteHttpExceptions: true });
  if (resp.getResponseCode() !== 200) {
    Logger.log("Could not fetch signals.json: HTTP " + resp.getResponseCode());
    return;
  }
  const data = JSON.parse(resp.getContentText());
  const signals = data.signals || {};

  const stateSheet = getSheet_(SHEET_STATE, ["Asset", "Level"]);
  const stateRows = stateSheet.getDataRange().getValues().slice(1); // skip header
  const lastLevel = {};
  stateRows.forEach(r => { lastLevel[r[0]] = r[1]; });

  const upgraded = []; // [{id, level, run, drop, price}]
  Object.keys(signals).forEach(id => {
    const s = signals[id];
    const prevRank = TIER_RANK[lastLevel[id]] ?? 0;
    const curRank = TIER_RANK[s.level] ?? 0;
    if (curRank > prevRank) upgraded.push(Object.assign({ id }, s));
  });

  // Persist the new state regardless, so next run compares against today's levels.
  stateSheet.clearContents();
  stateSheet.appendRow(["Asset", "Level"]);
  Object.keys(signals).forEach(id => stateSheet.appendRow([id, signals[id].level]));

  if (upgraded.length === 0) {
    Logger.log("No tier upgrades this run.");
    return;
  }

  const subSheet = getSheet_(SHEET_SUBSCRIBERS, ["Timestamp", "Email", "Telegram Chat ID", "Preference"]);
  const subs = subSheet.getDataRange().getValues().slice(1);
  const botToken = PropertiesService.getScriptProperties().getProperty("TELEGRAM_BOT_TOKEN");

  subs.forEach(row => {
    const [, email, telegram, pref] = row;
    const allowed = assetsForPref_(pref);
    const relevant = allowed ? upgraded.filter(u => allowed.includes(u.id)) : upgraded;
    if (relevant.length === 0) return;

    const lines = relevant.map(u => `${u.id}: ${u.level} · ${u.run} red days · ${u.drop}% · $${u.price}`);
    const text = "GoldAlert — signal update\n" + lines.join("\n") + "\n\nhttps://goldalert.org/";

    if (email) {
      try {
        MailApp.sendEmail(email, "GoldAlert: " + relevant.map(u => u.id).join(", ") + " signal update", text);
      } catch (err) { Logger.log("Email failed for " + email + ": " + err); }
    }
    if (telegram && botToken) {
      try {
        UrlFetchApp.fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: "post",
          contentType: "application/json",
          payload: JSON.stringify({ chat_id: telegram, text }),
          muteHttpExceptions: true,
        });
      } catch (err) { Logger.log("Telegram failed for " + telegram + ": " + err); }
    }
  });

  Logger.log(`Notified subscribers about ${upgraded.length} upgraded asset(s).`);
}

/** Optional: run manually once to verify the Sheet + Telegram token are wired up. */
function testRun() {
  Logger.log("Signals URL reachable: " + (UrlFetchApp.fetch(SIGNALS_URL, { muteHttpExceptions: true }).getResponseCode() === 200));
  Logger.log("Telegram token set: " + !!PropertiesService.getScriptProperties().getProperty("TELEGRAM_BOT_TOKEN"));
}
