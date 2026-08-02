# Mona & Noah — Multilingual Wedding Site + RSVP

7 May 2027 · Rocca di Lonato, Lombardy, Italy

A single-page, three-language (English / Français / العربية) wedding site.
Sections: **Our story** (photo gallery), **Travel & stay**, **Gifts**, and an
interactive **RSVP**. RSVP responses land in a Google Sheet (one row per guest)
and each guest gets an automatic confirmation email in the language they used.

**How the RSVP works:** the guest enters their email → chooses *Joyfully accepts*
or *Regretfully declines* → if yes, adds one card per guest with a meal
preference (pills: omnivore / vegetarian / vegan / pescatarian / halal),
allergies, and an optional song suggestion for the playlist. "Add another guest"
repeats under the same email. On submit, a confirmation email is sent.

```
wedding/
├── index.html   ← the whole website (edit text + images here)
├── Code.gs      ← the RSVP backend (paste into Google Apps Script)
└── README.md    ← this file
```

The site works the moment you open `index.html` — the RSVP form runs in a
harmless **demo mode** until you connect the backend (steps below).

---

## 1. Personalise the site

Open `index.html`. Everything you'll want to change lives in the **`I18N`**
object near the bottom (`<script>`). Each language has the same keys — edit all
three so nothing falls back to English.

Update:
- **Names** (`name1`, `name2`, `foot_names`, `monogram`)
- **Date & venue** (`hero_date`, schedule times, `foot_date`)
- **Story, details, FAQ** text

Your photos already live in the `photos/` folder and are wired in (venue as the
hero, couple shots through the gallery). To swap any, drop a new file in
`photos/` and update the matching `src="photos/..."` in the HTML.

**Gift link:** near the bottom of `index.html`, set `CONFIG.GIFT_URL` to your
registry or honeymoon-fund URL. Until you do, the "Registry & honeymoon fund"
button is inert (won't navigate).

"Details that appear along the way": just edit the copy (e.g. add the hotel
shortlist under Travel & stay) and re-deploy whenever you want to reveal more.

---

## 2. Set up the RSVP backend (Google Sheets + Apps Script)

Free, no extra accounts. Takes ~10 minutes.

1. Go to **sheets.new** to create a blank Google Sheet. Name it e.g. *Wedding RSVPs*.
2. In that sheet: **Extensions ▸ Apps Script**. Delete the sample code.
3. Paste the entire contents of **`Code.gs`**. At the top, edit `CONFIG`
   (couple names, date, venue, your contact email; optionally `NOTIFY_EMAIL`
   to get a copy of every reply). Save.
4. Click **Deploy ▸ New deployment**. Choose type **Web app**.
   - **Execute as:** *Me*
   - **Who has access:** *Anyone*
   - Click **Deploy**, approve the permissions prompt (needed so it can email
     guests and write to the sheet).
5. Copy the **Web app URL** (ends in `/exec`).
6. Open `index.html`, find `CONFIG.RSVP_ENDPOINT` near the bottom, and paste
   that URL in place of `PASTE_YOUR_APPS_SCRIPT_WEB_APP_URL_HERE`. Save.

That's it — RSVPs now append to the sheet and guests get confirmation emails.

> **Note on limits:** a normal Gmail account can send ~500 emails/day via Apps
> Script — far more than enough for a wedding.
>
> **If you change `Code.gs` later**, redeploy with **Deploy ▸ Manage
> deployments ▸ (edit) ▸ New version** so the URL stays the same.

### Managing invitees
Open the Google Sheet anytime to see every response (name, email, attending,
guest count, dietary needs, message, language). Sort/filter as usual, or turn
the sheet into a running headcount with a quick `=COUNTIF(D:D,"yes")`.

---

## 3. Put it online (free hosting)

Any static host works. Easiest options:

**Netlify Drop (no account setup needed):**
1. Go to **app.netlify.com/drop**.
2. Drag the whole `wedding` folder onto the page.
3. You get a live URL instantly (e.g. `your-site.netlify.app`). Add a custom
   domain later in the Netlify dashboard if you like.

**Vercel** or **GitHub Pages** work the same way — upload the folder / repo and
point it at `index.html`.

Whenever you edit the site, re-drag the folder (Netlify) or push again to update.

---

## 4. Test before sending it out
- Open the live URL, switch between **EN / FR / ع** (Arabic flips to
  right-to-left automatically). Your choice is remembered on return visits.
- Submit a test RSVP with your own email → confirm the row appears in the sheet
  and the confirmation email arrives in the right language.
- Try "declines" too — it sends a different, warmer message.

---

## Want changes?
Tell me and I can: add a photo gallery or countdown, split into multiple pages,
add a gift-registry / directions map section, pre-load a guest list with
per-guest links, or restyle the whole thing. Just ask.
