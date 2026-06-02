/**
@OnlyCurrentDoc
 */

// ============================================
// XNOR CLOUD – Google Apps Script (code.gs)
// ============================================
// Sheet tabs required (exact names, case‑sensitive):
//   Windows, Android, Mac, Apple, News, Users, Favorite, WhatsApp Number
//
// Columns (first row = headers, data starts row 2):
// Windows, Android, Mac, Apple : item‑id, name, description, category, download_url, open_url, size, website, icon_url, search_tags
// News                         : news‑id, title, content_excerpt, image_url, link, date, category
// Users                        : SESSION_ID, Username, Email, Password, FirstName, LastName, Birthday, WhatsApp Number, Gender, Country, Login timestamp
// Favorite                     : SESSION_ID, item‑id, name
// WhatsApp Number              : Contact Name, WhatsApp Number, SESSION_ID
// ============================================

const SS = SpreadsheetApp.getActiveSpreadsheet();

function getSheet(name) {
  return SS.getSheetByName(name);
}

function success(data) {
  return ContentService.createTextOutput(JSON.stringify({ success: true, ...data }))
    .setMimeType(ContentService.MimeType.JSON);
}

function error(msg) {
  return ContentService.createTextOutput(JSON.stringify({ success: false, message: msg }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  const action = e.parameter.action;
  if (!action) return error('Missing action parameter.');
  try {
    switch (action) {
      case 'getHomeItems': return getHomeItems();
      case 'getPlatformItems': return getPlatformItems(e.parameter.platform);
      case 'getNews': return getNews();
      case 'getFavorites': return getFavorites(e);
      case 'getUser': return getUser(e);
      default: return error(`Unknown action: ${action}`);
    }
  } catch (ex) {
    return error(`Script error: ${ex.message}`);
  }
}

function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  const action = data.action;
  if (!action) return error('Missing action parameter.');
  try {
    switch (action) {
      case 'register': return register(data);
      case 'login': return login(data);
      case 'updateAccount': return updateAccount(data);
      case 'changePassword': return changePassword(data);
      case 'deleteAccount': return deleteAccount(data);
      case 'addFavorite': return addFavorite(data);
      case 'removeFavorite': return removeFavorite(data);
      default: return error(`Unknown action: ${action}`);
    }
  } catch (ex) {
    return error(`Script error: ${ex.message}`);
  }
}

// ---------- GET ITEMS ----------
function getHomeItems() {
  const platforms = ['Windows', 'Android', 'Mac', 'Apple'];
  const allItems = [];
  platforms.forEach(platform => {
    const sheet = getSheet(platform);
    if (!sheet) return;
    const rows = sheet.getDataRange().getValues().slice(1);
    rows.forEach(r => {
      allItems.push({
        itemId: r[0] || '',
        name: r[1] || '',
        description: r[2] || '',
        category: r[3] || '',
        downloadUrl: r[4] || '',
        openUrl: r[5] || '',
        size: r[6] || '',
        website: r[7] || '',
        iconUrl: r[8] || '',
        searchTags: r[9] || '',
        platform: platform
      });
    });
  });
  return success({ items: allItems });
}

function getPlatformItems(platform) {
  if (!platform) return error('Missing platform parameter.');
  const sheet = getSheet(platform);
  if (!sheet) return error(`Sheet '${platform}' not found.`);
  const rows = sheet.getDataRange().getValues().slice(1);
  const items = rows.map(r => ({
    itemId: r[0] || '',
    name: r[1] || '',
    description: r[2] || '',
    category: r[3] || '',
    downloadUrl: r[4] || '',
    openUrl: r[5] || '',
    size: r[6] || '',
    website: r[7] || '',
    iconUrl: r[8] || '',
    searchTags: r[9] || '',
    platform: platform
  }));
  return success({ items });
}

function getNews() {
  const sheet = getSheet('News');
  if (!sheet) return error("Sheet 'News' not found.");
  const rows = sheet.getDataRange().getValues().slice(1);
  const news = rows.map(r => ({
    newsId: r[0] || '',
    title: r[1] || '',
    contentExcerpt: r[2] || '',
    imageUrl: r[3] || '',
    link: r[4] || '',
    date: r[5] || '',
    category: r[6] || ''
  }));
  return success({ news });
}

function getFavorites(e) {
  const sessionId = e.parameter.sessionId;
  if (!sessionId) return error('Missing sessionId.');
  const sheet = getSheet('Favorite');
  if (!sheet) return error("Sheet 'Favorite' not found.");
  const rows = sheet.getDataRange().getValues().slice(1);
  const favs = rows.filter(r => r[0] === sessionId).map(r => ({
    sessionId: r[0],
    itemId: r[1] || '',
    name: r[2] || ''
  }));
  return success({ favorites: favs });
}

function getUser(e) {
  const sessionId = e.parameter.sessionId;
  if (!sessionId) return error('Missing sessionId.');
  const sheet = getSheet('Users');
  if (!sheet) return error("Sheet 'Users' not found.");
  const rows = sheet.getDataRange().getValues().slice(1);
  const user = rows.find(r => r[0] === sessionId);
  if (!user) return error('User not found.');
  return success({
    user: {
      sessionId: user[0],
      username: user[1],
      email: user[2] || '',
      firstName: user[4] || '',
      lastName: user[5] || '',
      birthday: user[6] || '',
      whatsappNumber: user[7] || '',
      gender: user[8] || '',
      country: user[9] || '',
      loginTimestamp: user[10] || ''
    }
  });
}

// ---------- REGISTER ----------
function register(data) {
  const { username, email, password, firstName, lastName, birthday, whatsappNumber, gender, country } = data;
  if (!username || !password || !email) return error('Username, email and password are required.');
  const usersSheet = getSheet('Users');
  if (!usersSheet) return error("Sheet 'Users' not found.");
  const existing = usersSheet.getDataRange().getValues().slice(1);
  if (existing.some(r => r[1] === username)) return error('Username already exists.');
  if (existing.some(r => r[2] === email)) return error('Email already registered.');

  const sessionId = 'SESS_' + Utilities.getUuid();
  const timestamp = ''; // will be filled on first login
  usersSheet.appendRow([sessionId, username, email, password, firstName, lastName, birthday, whatsappNumber, gender, country, timestamp]);

  // Add to WhatsApp Number sheet
  const waSheet = getSheet('WhatsApp Number');
  if (waSheet) {
    const userCount = existing.length + 1; // rows excluding header
    const birthYear = birthday ? new Date(birthday).getFullYear() : '????';
    const contactName = `U${userCount}/${country || 'XX'}-${birthYear}:${gender || 'O'}`;
    waSheet.appendRow([contactName, whatsappNumber || '', sessionId]);
  }
  return success({ sessionId, userCount: existing.length + 1 });
}

// ---------- LOGIN ----------
function login(data) {
  const { username, password } = data;
  if (!username || !password) return error('Username and password required.');
  const sheet = getSheet('Users');
  if (!sheet) return error("Sheet 'Users' not found.");
  const rows = sheet.getDataRange().getValues().slice(1);
  const userRowIndex = rows.findIndex(r => r[1] === username && r[3] === password);
  if (userRowIndex === -1) return error('Invalid username or password.');

  // Update login timestamp (Sri Lanka time, format: D2026-05-31 T12:31:00)
  const now = new Date();
  const offsetMs = 5.5 * 60 * 60 * 1000; // GMT+5:30
  const slTime = new Date(now.getTime() + offsetMs);
  const pad = n => n.toString().padStart(2, '0');
  const formatted = `D${slTime.getUTCFullYear()}-${pad(slTime.getUTCMonth()+1)}-${pad(slTime.getUTCDate())} T${pad(slTime.getUTCHours())}:${pad(slTime.getUTCMinutes())}:${pad(slTime.getUTCSeconds())}`;
  const rowToUpdate = userRowIndex + 2; // +1 for header
  sheet.getRange(rowToUpdate, 11).setValue(formatted); // column 11 = Login timestamp

  const user = rows[userRowIndex];
  return success({
    sessionId: user[0],
    username: user[1],
    email: user[2],
    firstName: user[4],
    lastName: user[5],
    birthday: user[6],
    whatsappNumber: user[7],
    gender: user[8],
    country: user[9],
    loginTimestamp: formatted
  });
}

// ---------- UPDATE ACCOUNT ----------
function updateAccount(data) {
  const { sessionId, email, firstName, lastName, birthday, whatsappNumber, gender, country } = data;
  if (!sessionId) return error('Missing sessionId.');
  const sheet = getSheet('Users');
  if (!sheet) return error("Sheet 'Users' not found.");
  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === sessionId) {
      const row = i + 1;
      sheet.getRange(row, 3).setValue(email || '');
      sheet.getRange(row, 5).setValue(firstName || '');
      sheet.getRange(row, 6).setValue(lastName || '');
      sheet.getRange(row, 7).setValue(birthday || '');
      sheet.getRange(row, 8).setValue(whatsappNumber || '');
      sheet.getRange(row, 9).setValue(gender || '');
      sheet.getRange(row, 10).setValue(country || '');
      return success({ message: 'Account updated.' });
    }
  }
  return error('User not found.');
}

// ---------- CHANGE PASSWORD ----------
function changePassword(data) {
  const { sessionId, oldPassword, newPassword } = data;
  if (!sessionId || !oldPassword || !newPassword) return error('Missing fields.');
  const sheet = getSheet('Users');
  if (!sheet) return error("Sheet 'Users' not found.");
  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === sessionId && rows[i][3] === oldPassword) { // password column 4
      sheet.getRange(i + 1, 4).setValue(newPassword);
      return success({ message: 'Password changed.' });
    }
  }
  return error('Incorrect current password.');
}

// ---------- DELETE ACCOUNT ----------
function deleteAccount(data) {
  const { sessionId } = data;
  if (!sessionId) return error('Missing sessionId.');
  const sheet = getSheet('Users');
  if (!sheet) return error("Sheet 'Users' not found.");
  const rows = sheet.getDataRange().getValues();
  for (let i = rows.length - 1; i >= 1; i--) {
    if (rows[i][0] === sessionId) {
      sheet.deleteRow(i + 1);
      // Optionally delete favorites and WhatsApp entry
      return success({ message: 'Account deleted.' });
    }
  }
  return error('User not found.');
}

// ---------- FAVORITES ----------
function addFavorite(data) {
  const { sessionId, itemId, name } = data;
  if (!sessionId || !itemId) return error('Missing sessionId or itemId.');
  const sheet = getSheet('Favorite');
  if (!sheet) return error("Sheet 'Favorite' not found.");
  const existing = sheet.getDataRange().getValues().slice(1);
  if (existing.some(r => r[0] === sessionId && r[1] === itemId)) return error('Already in favorites.');
  sheet.appendRow([sessionId, itemId, name || '']);
  return success({ message: 'Added to favorites.' });
}

function removeFavorite(data) {
  const { sessionId, itemId } = data;
  if (!sessionId || !itemId) return error('Missing sessionId or itemId.');
  const sheet = getSheet('Favorite');
  if (!sheet) return error("Sheet 'Favorite' not found.");
  const rows = sheet.getDataRange().getValues();
  for (let i = rows.length - 1; i >= 1; i--) {
    if (rows[i][0] === sessionId && rows[i][1] === itemId) {
      sheet.deleteRow(i + 1);
      return success({ message: 'Removed from favorites.' });
    }
  }
  return error('Favorite not found.');
}
