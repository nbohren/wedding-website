/**
 * Wedding RSVP backend — Google Apps Script
 * -----------------------------------------
 * Receives RSVP submissions from the website, appends them to the bound
 * Google Sheet (one row per guest), and emails a confirmation to the guest
 * in their language.
 *
 * SETUP (see README): create a Google Sheet, Extensions ▸ Apps Script,
 * paste this file, set the CONFIG below, then Deploy ▸ New deployment ▸
 * Web app (Execute as: Me, Who has access: Anyone). Copy the /exec URL
 * into CONFIG.RSVP_ENDPOINT in index.html.
 *
 * Expected payload from the site:
 * { email, attending: "yes"|"no", note?, lang, guests: [ {name, diet, allergies, song} ] }
 */

const CONFIG = {
  COUPLE_NAMES: "Mona & Noah",
  WEDDING_DATE: "7 May 2027",
  VENUE: "Rocca di Lonato, Lombardy, Italy",
  CONTACT_EMAIL: "bohren.noah@gmail.com",   // used as Reply-To; guests can reach you here
  NOTIFY_EMAIL: "bohren.noah@gmail.com",    // you'll get a copy of every response
  SHEET_ID: "19TiySok4aklOHw93IvXZefMn6OTQiV5CsXwanlT2jdQ"  // the RSVP spreadsheet
};

function doPost(e) {
  try {
    // Accept both a hidden-form field ("payload") and a raw JSON body.
    var raw = (e && e.parameter && e.parameter.payload)
      ? e.parameter.payload
      : (e && e.postData && e.postData.contents) || "{}";
    const d = JSON.parse(raw);
    appendRows(d);
    sendConfirmation(d);
    if (CONFIG.NOTIFY_EMAIL) notifyCouple(d);
    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}

function doGet() { return json({ ok: true, service: "wedding-rsvp" }); }

/**
 * Run this directly from the editor (select "testWrite" ▸ Run) to verify the
 * sheet write and email work, independent of the website. It adds one test
 * row and sends one confirmation email to CONFIG.NOTIFY_EMAIL.
 */
function testWrite() {
  var d = {
    email: CONFIG.NOTIFY_EMAIL || CONFIG.CONTACT_EMAIL,
    attending: "yes", lang: "en",
    guests: [{ name: "TEST — editor check (safe to delete)", diet: "vegetarian", allergies: "none", song: "Test — Delete Me" }]
  };
  appendRows(d);
  sendConfirmation(d);
  Logger.log("testWrite completed — check the sheet and your inbox.");
}

function getSheet() {
  // openById works whether or not the script is bound to the sheet
  return CONFIG.SHEET_ID
    ? SpreadsheetApp.openById(CONFIG.SHEET_ID).getSheets()[0]
    : SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
}

function appendRows(d) {
  const sheet = getSheet();
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(["Timestamp","Email","Attending","Guest name","Meal","Allergies","Song","Note","Lang"]);
  }
  const ts = new Date();
  const guests = Array.isArray(d.guests) ? d.guests : [];
  if (d.attending === "yes" && guests.length) {
    guests.forEach(function (g) {
      sheet.appendRow([ts, d.email || "", "yes", g.name || "", g.diet || "", g.allergies || "", g.song || "", d.note || "", d.lang || "en"]);
    });
  } else {
    // declined (or no guests): a single row
    sheet.appendRow([ts, d.email || "", d.attending || "no", "", "", "", "", d.note || "", d.lang || "en"]);
  }
}

/* ---------- Localised meal labels for the email ---------- */
const DIET_LABELS = {
  en: { omnivore:"Omnivore", vegetarian:"Vegetarian", vegan:"Vegan", pescatarian:"Pescatarian", halal:"Halal" },
  fr: { omnivore:"Omnivore", vegetarian:"Végétarien", vegan:"Végan", pescatarian:"Pescétarien", halal:"Halal" },
  de: { omnivore:"Alles", vegetarian:"Vegetarisch", vegan:"Vegan", pescatarian:"Pescetarisch", halal:"Halal" },
  ar: { omnivore:"يأكل كل شيء", vegetarian:"نباتي", vegan:"نباتي صِرف", pescatarian:"سمكي", halal:"حلال" }
};
function dietLabel(lang, key) {
  var m = DIET_LABELS[lang] || DIET_LABELS.en;
  return m[key] || key || "—";
}

/* ---------- Confirmation emails ---------- */
const EMAILS = {
  en: {
    subjYes: "See you at our wedding 🤍",
    subjNo:  "Thank you for letting us know",
    yes: function (d, list) {
return "Thank you — we're so happy you'll be joining us!\n\n" +
"Here's what we noted:\n" + list + "\n\n" +
"The celebration: " + CONFIG.WEDDING_DATE + " at " + CONFIG.VENUE + ".\n" +
"More travel and accommodation details will appear on the website as the day approaches.\n\n" +
"With love,\n" + CONFIG.COUPLE_NAMES;
    },
    no: function (d) {
return "Thank you for letting us know — we'll miss you, but we completely understand.\n" +
"If anything changes, just reply to this email.\n\n" +
"With love,\n" + CONFIG.COUPLE_NAMES;
    },
    line: function (g, lang) {
      var s = "• " + g.name + " — " + dietLabel(lang, g.diet);
      if (g.allergies) s += " (allergies: " + g.allergies + ")";
      if (g.song) s += "\n    ♫ song: " + g.song;
      return s;
    }
  },
  fr: {
    subjYes: "À très bientôt pour notre mariage 🤍",
    subjNo:  "Merci de nous avoir prévenus",
    yes: function (d, list) {
return "Merci — nous sommes ravis de vous compter parmi nous !\n\n" +
"Voici ce que nous avons noté :\n" + list + "\n\n" +
"La célébration : " + CONFIG.WEDDING_DATE + " à " + CONFIG.VENUE + ".\n" +
"D'autres informations sur le voyage et l'hébergement apparaîtront sur le site à l'approche du jour.\n\n" +
"Avec toute notre affection,\n" + CONFIG.COUPLE_NAMES;
    },
    no: function (d) {
return "Merci de nous avoir prévenus — vous nous manquerez, mais nous comprenons tout à fait.\n" +
"Si cela devait changer, répondez simplement à cet e-mail.\n\n" +
"Avec toute notre affection,\n" + CONFIG.COUPLE_NAMES;
    },
    line: function (g, lang) {
      var s = "• " + g.name + " — " + dietLabel(lang, g.diet);
      if (g.allergies) s += " (allergies : " + g.allergies + ")";
      if (g.song) s += "\n    ♫ chanson : " + g.song;
      return s;
    }
  },
  de: {
    subjYes: "Bis bald an unserer Hochzeit 🤍",
    subjNo:  "Danke fürs Bescheidgeben",
    yes: function (d, list) {
return "Danke — wir freuen uns riesig, dass ihr dabei seid!\n\n" +
"Das haben wir notiert:\n" + list + "\n\n" +
"Die Feier: " + CONFIG.WEDDING_DATE + " in " + CONFIG.VENUE + ".\n" +
"Weitere Infos zu Anreise und Unterkunft erscheinen auf der Website, je näher der Tag rückt.\n\n" +
"Mit Liebe,\n" + CONFIG.COUPLE_NAMES;
    },
    no: function (d) {
return "Danke fürs Bescheidgeben — wir werden euch vermissen, haben aber vollstes Verständnis.\n" +
"Sollte sich etwas ändern, antwortet einfach auf diese E-Mail.\n\n" +
"Mit Liebe,\n" + CONFIG.COUPLE_NAMES;
    },
    line: function (g, lang) {
      var s = "• " + g.name + " — " + dietLabel(lang, g.diet);
      if (g.allergies) s += " (Allergien: " + g.allergies + ")";
      if (g.song) s += "\n    ♫ Song: " + g.song;
      return s;
    }
  },
  ar: {
    subjYes: "في انتظاركم في زفافنا 🤍",
    subjNo:  "شكرًا لإعلامنا",
    yes: function (d, list) {
return "شكرًا لكم — تسعدنا مشاركتكم لنا!\n\n" +
"هذا ما سجّلناه:\n" + list + "\n\n" +
"الاحتفال: " + CONFIG.WEDDING_DATE + " في " + CONFIG.VENUE + ".\n" +
"ستظهر تفاصيل إضافية عن السفر والإقامة على الموقع كلما اقترب الموعد.\n\n" +
"مع خالص المحبة،\n" + CONFIG.COUPLE_NAMES;
    },
    no: function (d) {
return "شكرًا لإعلامنا — سنفتقدكم، ونتفهّم ذلك تمامًا.\n" +
"وإن تغيّرت الظروف، يكفي الرد على هذه الرسالة.\n\n" +
"مع خالص المحبة،\n" + CONFIG.COUPLE_NAMES;
    },
    line: function (g, lang) {
      var s = "• " + g.name + " — " + dietLabel(lang, g.diet);
      if (g.allergies) s += " (حساسية: " + g.allergies + ")";
      if (g.song) s += "\n    ♫ أغنية: " + g.song;
      return s;
    }
  }
};

function sendConfirmation(d) {
  if (!d.email) return;
  var lang = EMAILS[d.lang] ? d.lang : "en";
  var t = EMAILS[lang];
  var attending = (d.attending === "yes");
  var body;
  if (attending) {
    var guests = Array.isArray(d.guests) ? d.guests : [];
    var list = guests.map(function (g) { return t.line(g, lang); }).join("\n");
    body = t.yes(d, list);
  } else {
    body = t.no(d);
  }
  MailApp.sendEmail({
    to: d.email,
    replyTo: CONFIG.CONTACT_EMAIL,
    name: CONFIG.COUPLE_NAMES,
    subject: attending ? t.subjYes : t.subjNo,
    body: body
  });
}

function notifyCouple(d) {
  MailApp.sendEmail({
    to: CONFIG.NOTIFY_EMAIL,
    subject: "New RSVP: " + (d.email || "") + " — " + (d.attending || ""),
    body: JSON.stringify(d, null, 2)
  });
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
