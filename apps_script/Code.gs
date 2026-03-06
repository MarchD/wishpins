const SHEET_NAME = 'wishes';
const HEADER_ALIASES = {
  id: ['id'],
  title: ['title'],
  link: ['link'],
  image: ['image'],
  status: ['status'],
  x: ['x'],
  y: ['y'],
  updatedAt: ['updated_at', 'updatedAt'],
  sticker: ['sticker']
};

function doGet(e) {
  try {

    const sheet = getSheet_();
    const values = sheet.getDataRange().getValues();
    if (values.length <= 1) {
      return json_([]);
    }

    const index = headerIndex_(values[0]);
    const rows = values.slice(1).map(function (row) {
      return {
        id: asString_(row[index.id]),
        title: asString_(row[index.title]),
        link: asString_(row[index.link]),
        image: asString_(row[index.image]),
        sticker: asString_(row[index.sticker]),
        status: asString_(row[index.status]) || 'todo',
        x: row[index.x] === '' ? '' : row[index.x],
        y: row[index.y] === '' ? '' : row[index.y],
        updatedAt: asString_(row[index.updatedAt])
      };
    });

    return json_(rows);
  } catch (error) {
    return json_({ ok: false, error: error.message || String(error) });
  }
}

function doPost(e) {
  try {
    const action = getAction_(e);
    if (action !== 'update') {
      return json_({ ok: false, error: 'Not Found' });
    }

    const body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    const id = asString_(body.id).trim();
    const status = asString_(body.status).trim();

    if (!id) {
      return json_({ ok: false, error: 'Missing id' });
    }

    if (['todo', 'in_progress', 'done'].indexOf(status) === -1) {
      return json_({ ok: false, error: 'Invalid status' });
    }

    const sheet = getSheet_();
    const values = sheet.getDataRange().getValues();
    if (values.length <= 1) {
      return json_({ ok: false, error: 'No data rows' });
    }

    const index = headerIndex_(values[0]);
    let rowNumber = -1;

    for (let i = 1; i < values.length; i += 1) {
      if (asString_(values[i][index.id]).trim() === id) {
        rowNumber = i + 1;
        break;
      }
    }

    if (rowNumber === -1) {
      return json_({ ok: false, error: 'Item not found' });
    }

    sheet.getRange(rowNumber, index.status + 1).setValue(status);

    if (Object.prototype.hasOwnProperty.call(body, 'x')) {
      sheet.getRange(rowNumber, index.x + 1).setValue(body.x === null ? '' : body.x);
    }

    if (Object.prototype.hasOwnProperty.call(body, 'y')) {
      sheet.getRange(rowNumber, index.y + 1).setValue(body.y === null ? '' : body.y);
    }

    sheet.getRange(rowNumber, index.updatedAt + 1).setValue(new Date().toISOString());

    if (Object.prototype.hasOwnProperty.call(body, 'sticker')) {
      sheet.getRange(rowNumber, index.sticker + 1).setValue(asString_(body.sticker));
    }

    return json_({ ok: true });
  } catch (error) {
    return json_({ ok: false, error: error.message || String(error) });
  }
}

function getAction_(e) {
  const path = asString_(e && e.pathInfo).trim();
  if (path) {
    return path.split('/')[0];
  }

  return asString_(e && e.parameter && e.parameter.action).trim();
}

function getSheet_() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sheet) {
    throw new Error('Sheet tab "' + SHEET_NAME + '" was not found');
  }
  return sheet;
}

function headerIndex_(headerRow) {
  const map = {};

  Object.keys(HEADER_ALIASES).forEach(function (header) {
    const aliases = HEADER_ALIASES[header];
    let idx = -1;

    for (let i = 0; i < aliases.length; i += 1) {
      idx = headerRow.indexOf(aliases[i]);
      if (idx !== -1) {
        break;
      }
    }

    if (idx === -1) {
      throw new Error('Missing required header: ' + aliases[0]);
    }
    map[header] = idx;
  });

  return map;
}

function asString_(value) {
  if (value === null || value === undefined) {
    return '';
  }
  return String(value);
}

function json_(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(
    ContentService.MimeType.JSON
  );
}
