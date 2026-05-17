<!-- code.gs -->
<!-- 
  ============================================
  XNOR CLOUD – Google Apps Script (code.gs)
  Deploy as Web App → Copy URL → Use in JS
  ============================================
  Google Sheet Structure:
  Sheet1: "Items"    → item-id, name, description, category, download_url, open_url, size, website, icon_url, search_tags
  Sheet2: "News"     → news-id, title, content_excerpt, image_url, link, date, category
  Sheet3: "Users"    → SESSION_ID, Username, Password, FullName, Lastname, Birthday, WhatsAppNumber, Gender, Country
  Sheet4: "Favorites"→ SESSION_ID, item-id, name
-->
function doGet(e) {
  const action = e.parameter.action;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  if (action === 'getItems') {
    const sheet = ss.getSheetByName('Items');
    const data = sheet.getDataRange().getValues().slice(1);
    const items = data.map(row => ({
      itemId: row[0], name: row[1], description: row[2], category: row[3],
      downloadUrl: row[4], openUrl: row[5], size: row[6], website: row[7],
      iconUrl: row[8], searchTags: row[9]
    }));
    return ContentService.createTextOutput(JSON.stringify({ success: true, items }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  if (action === 'getNews') {
    const sheet = ss.getSheetByName('News');
    const data = sheet.getDataRange().getValues().slice(1);
    const news = data.map(row => ({
      newsId: row[0], title: row[1], contentExcerpt: row[2], imageUrl: row[3],
      link: row[4], date: row[5], category: row[6]
    }));
    return ContentService.createTextOutput(JSON.stringify({ success: true, news }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  if (action === 'getFavorites') {
    const sessionId = e.parameter.sessionId;
    const sheet = ss.getSheetByName('Favorites');
    const data = sheet.getDataRange().getValues().slice(1);
    const favs = data.filter(row => row[0] === sessionId).map(row => ({
      sessionId: row[0], itemId: row[1], name: row[2]
    }));
    return ContentService.createTextOutput(JSON.stringify({ success: true, favorites: favs }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  if (action === 'getUser') {
    const sessionId = e.parameter.sessionId;
    const sheet = ss.getSheetByName('Users');
    const data = sheet.getDataRange().getValues().slice(1);
    const user = data.find(row => row[0] === sessionId);
    if (user) {
      return ContentService.createTextOutput(JSON.stringify({
        success: true, user: {
          sessionId: user[0], username: user[1], fullName: user[3],
          lastname: user[4], birthday: user[5], whatsappNumber: user[6],
          gender: user[7], country: user[8]
        }
      })).setMimeType(ContentService.MimeType.JSON);
    }
    return ContentService.createTextOutput(JSON.stringify({ success: false, message: 'User not found' }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  return ContentService.createTextOutput(JSON.stringify({ success: false, message: 'Invalid action' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  const action = data.action;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  if (action === 'register') {
    const usersSheet = ss.getSheetByName('Users');
    const existing = usersSheet.getDataRange().getValues().slice(1);
    if (existing.some(row => row[1] === data.username)) {
      return ContentService.createTextOutput(JSON.stringify({ success: false, message: 'Username already exists' }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    const sessionId = 'SESS_' + Utilities.getUuid();
    const userCount = existing.length + 1;
    usersSheet.appendRow([sessionId, data.username, data.password, data.fullName, data.lastname,
      data.birthday, data.whatsappNumber, data.gender, data.country]);
    return ContentService.createTextOutput(JSON.stringify({ success: true, sessionId, userCount }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  if (action === 'login') {
    const usersSheet = ss.getSheetByName('Users');
    const existing = usersSheet.getDataRange().getValues().slice(1);
    const user = existing.find(row => row[1] === data.username && row[2] === data.password);
    if (user) {
      return ContentService.createTextOutput(JSON.stringify({
        success: true, sessionId: user[0], username: user[1], fullName: user[3],
        lastname: user[4], birthday: user[5], whatsappNumber: user[6], gender: user[7], country: user[8]
      })).setMimeType(ContentService.MimeType.JSON);
    }
    return ContentService.createTextOutput(JSON.stringify({ success: false, message: 'Invalid credentials' }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  if (action === 'updateAccount') {
    const usersSheet = ss.getSheetByName('Users');
    const existing = usersSheet.getDataRange().getValues();
    for (let i = 1; i < existing.length; i++) {
      if (existing[i][0] === data.sessionId) {
        usersSheet.getRange(i + 1, 4).setValue(data.fullName);
        usersSheet.getRange(i + 1, 5).setValue(data.lastname);
        usersSheet.getRange(i + 1, 6).setValue(data.birthday);
        usersSheet.getRange(i + 1, 7).setValue(data.whatsappNumber);
        usersSheet.getRange(i + 1, 8).setValue(data.gender);
        usersSheet.getRange(i + 1, 9).setValue(data.country);
        return ContentService.createTextOutput(JSON.stringify({ success: true, message: 'Account updated' }))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }
    return ContentService.createTextOutput(JSON.stringify({ success: false, message: 'User not found' }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  if (action === 'changePassword') {
    const usersSheet = ss.getSheetByName('Users');
    const existing = usersSheet.getDataRange().getValues();
    for (let i = 1; i < existing.length; i++) {
      if (existing[i][0] === data.sessionId && existing[i][2] === data.oldPassword) {
        usersSheet.getRange(i + 1, 3).setValue(data.newPassword);
        return ContentService.createTextOutput(JSON.stringify({ success: true, message: 'Password changed' }))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }
    return ContentService.createTextOutput(JSON.stringify({ success: false, message: 'Incorrect old password' }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  if (action === 'deleteAccount') {
    const usersSheet = ss.getSheetByName('Users');
    const existing = usersSheet.getDataRange().getValues();
    for (let i = existing.length - 1; i >= 1; i--) {
      if (existing[i][0] === data.sessionId) {
        usersSheet.deleteRow(i + 1);
        return ContentService.createTextOutput(JSON.stringify({ success: true, message: 'Account deleted' }))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }
    return ContentService.createTextOutput(JSON.stringify({ success: false, message: 'User not found' }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  if (action === 'addFavorite') {
    const favSheet = ss.getSheetByName('Favorites');
    const existing = favSheet.getDataRange().getValues().slice(1);
    if (existing.some(row => row[0] === data.sessionId && row[1] === data.itemId)) {
      return ContentService.createTextOutput(JSON.stringify({ success: false, message: 'Already favorited' }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    favSheet.appendRow([data.sessionId, data.itemId, data.name]);
    return ContentService.createTextOutput(JSON.stringify({ success: true, message: 'Added to favorites' }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  if (action === 'removeFavorite') {
    const favSheet = ss.getSheetByName('Favorites');
    const existing = favSheet.getDataRange().getValues();
    for (let i = existing.length - 1; i >= 1; i--) {
      if (existing[i][0] === data.sessionId && existing[i][1] === data.itemId) {
        favSheet.deleteRow(i + 1);
        return ContentService.createTextOutput(JSON.stringify({ success: true, message: 'Removed from favorites' }))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }
    return ContentService.createTextOutput(JSON.stringify({ success: false, message: 'Not found' }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  return ContentService.createTextOutput(JSON.stringify({ success: false, message: 'Invalid action' }))
    .setMimeType(ContentService.MimeType.JSON);
}