// ============================================
// XNOR CLOUD – Google Apps Script (code.gs)
// ============================================
// Sheet tabs must be named EXACTLY:
//   Items, News, Users, Favorites
//
// Columns (first row = headers, data starts row 2):
// Items     : item-id, name, description, category, download_url, open_url, size, website, icon_url, search_tags
// News      : news-id, title, content_excerpt, image_url, link, date, category
// Users     : SESSION_ID, Username, Password, FullName, Lastname, Birthday, WhatsAppNumber, Gender, Country
// Favorites : SESSION_ID, item-id, name
// ============================================

const SS = SpreadsheetApp.getActiveSpreadsheet();

// Helper: get sheet by name, return null if missing
function getSheet(name) {
  return SS.getSheetByName(name);
}

// Helper: build success response
function success(data) {
  return ContentService.createTextOutput(JSON.stringify({ success: true, ...data }))
    .setMimeType(ContentService.MimeType.JSON);
}

// Helper: build error response
function error(msg) {
  return ContentService.createTextOutput(JSON.stringify({ success: false, message: msg }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  const action = e.parameter.action;
  if (!action) return error('Missing action parameter.');

  try {
    switch (action) {
      case 'getItems': return getItems();
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

// ==================== GET ITEMS ====================
function getItems() {
  const sheet = getSheet('Items');
  if (!sheet) return error("Sheet 'Items' not found.");
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
    searchTags: r[9] || ''
  }));
  return success({ items });
}

// ==================== GET NEWS ====================
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

// ==================== GET FAVORITES ====================
function getFavorites(e) {
  const sessionId = e.parameter.sessionId;
  if (!sessionId) return error('Missing sessionId.');
  const sheet = getSheet('Favorites');
  if (!sheet) return error("Sheet 'Favorites' not found.");
  const rows = sheet.getDataRange().getValues().slice(1);
  const favs = rows.filter(r => r[0] === sessionId).map(r => ({
    sessionId: r[0],
    itemId: r[1] || '',
    name: r[2] || ''
  }));
  return success({ favorites: favs });
}

// ==================== GET USER ====================
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
      fullName: user[3],
      lastname: user[4],
      birthday: user[5],
      whatsappNumber: user[6],
      gender: user[7],
      country: user[8]
    }
  });
}

// ==================== REGISTER ====================
function register(data) {
  const { username, password, fullName, lastname, birthday, whatsappNumber, gender, country } = data;
  if (!username || !password) return error('Username and password required.');
  const sheet = getSheet('Users');
  if (!sheet) return error("Sheet 'Users' not found.");
  const rows = sheet.getDataRange().getValues().slice(1);
  if (rows.some(r => r[1] === username)) return error('Username already exists.');
  const sessionId = 'SESS_' + Utilities.getUuid();
  sheet.appendRow([sessionId, username, password, fullName || '', lastname || '', birthday || '', whatsappNumber || '', gender || '', country || '']);
  return success({ sessionId, userCount: rows.length + 1 });
}

// ==================== LOGIN ====================
function login(data) {
  const { username, password } = data;
  if (!username || !password) return error('Username and password required.');
  const sheet = getSheet('Users');
  if (!sheet) return error("Sheet 'Users' not found.");
  const rows = sheet.getDataRange().getValues().slice(1);
  const user = rows.find(r => r[1] === username && r[2] === password);
  if (!user) return error('Invalid username or password.');
  return success({
    sessionId: user[0],
    username: user[1],
    fullName: user[3],
    lastname: user[4],
    birthday: user[5],
    whatsappNumber: user[6],
    gender: user[7],
    country: user[8]
  });
}

// ==================== UPDATE ACCOUNT ====================
function updateAccount(data) {
  const { sessionId, fullName, lastname, birthday, whatsappNumber, gender, country } = data;
  if (!sessionId) return error('Missing sessionId.');
  const sheet = getSheet('Users');
  if (!sheet) return error("Sheet 'Users' not found.");
  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === sessionId) {
      const row = i + 1;
      sheet.getRange(row, 4).setValue(fullName || '');
      sheet.getRange(row, 5).setValue(lastname || '');
      sheet.getRange(row, 6).setValue(birthday || '');
      sheet.getRange(row, 7).setValue(whatsappNumber || '');
      sheet.getRange(row, 8).setValue(gender || '');
      sheet.getRange(row, 9).setValue(country || '');
      return success({ message: 'Account updated.' });
    }
  }
  return error('User not found.');
}

// ==================== CHANGE PASSWORD ====================
function changePassword(data) {
  const { sessionId, oldPassword, newPassword } = data;
  if (!sessionId || !oldPassword || !newPassword) return error('Missing fields.');
  const sheet = getSheet('Users');
  if (!sheet) return error("Sheet 'Users' not found.");
  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === sessionId && rows[i][2] === oldPassword) {
      sheet.getRange(i + 1, 3).setValue(newPassword);
      return success({ message: 'Password changed.' });
    }
  }
  return error('Incorrect current password.');
}

// ==================== DELETE ACCOUNT ====================
function deleteAccount(data) {
  const { sessionId } = data;
  if (!sessionId) return error('Missing sessionId.');
  const sheet = getSheet('Users');
  if (!sheet) return error("Sheet 'Users' not found.");
  const rows = sheet.getDataRange().getValues();
  for (let i = rows.length - 1; i >= 1; i--) {
    if (rows[i][0] === sessionId) {
      sheet.deleteRow(i + 1);
      return success({ message: 'Account deleted.' });
    }
  }
  return error('User not found.');
}

// ==================== ADD FAVORITE ====================
function addFavorite(data) {
  const { sessionId, itemId, name } = data;
  if (!sessionId || !itemId) return error('Missing sessionId or itemId.');
  const sheet = getSheet('Favorites');
  if (!sheet) return error("Sheet 'Favorites' not found.");
  const rows = sheet.getDataRange().getValues().slice(1);
  if (rows.some(r => r[0] === sessionId && r[1] === itemId)) return error('Already in favorites.');
  sheet.appendRow([sessionId, itemId, name || '']);
  return success({ message: 'Added to favorites.' });
}

// ==================== REMOVE FAVORITE ====================
function removeFavorite(data) {
  const { sessionId, itemId } = data;
  if (!sessionId || !itemId) return error('Missing sessionId or itemId.');
  const sheet = getSheet('Favorites');
  if (!sheet) return error("Sheet 'Favorites' not found.");
  const rows = sheet.getDataRange().getValues();
  for (let i = rows.length - 1; i >= 1; i--) {
    if (rows[i][0] === sessionId && rows[i][1] === itemId) {
      sheet.deleteRow(i + 1);
      return success({ message: 'Removed from favorites.' });
    }
  }
  return error('Favorite not found.');
}
