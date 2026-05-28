function doPost(e) {
  var result = {
    success: false,
    message: '無法解析請求。'
  };

  try {
    var payload = {};

    if (e.postData && e.postData.contents) {
      payload = JSON.parse(e.postData.contents);
    } else {
      payload = {
        restaurantName: e.parameter.restaurantName,
        address: e.parameter.address,
        lat: e.parameter.lat,
        lng: e.parameter.lng,
        category: e.parameter.category,
        rating: e.parameter.rating,
        featuredDish: e.parameter.featuredDish
      };
    }

    var restaurantName = payload.restaurantName || '';
    var address = payload.address || '';
    var lat = payload.lat || payload.latitude || '';
    var lng = payload.lng || payload.longitude || '';
    var category = payload.category || '';
    var rating = payload.rating || '';
    var featuredDish = payload.featuredDish || '';

    if (!restaurantName || !address || !lat || !lng) {
      result.message = '請提供 restaurantName、address、lat 以及 lng。';
      return createJsonResponse(result, 400);
    }

    var mapsUrl = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(lat + ',' + lng);

    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    if (!spreadsheet) {
      result.message = '找不到作用中試算表。';
      return createJsonResponse(result, 500);
    }

    var sheet = spreadsheet.getSheetByName('Sheet1');
    if (!sheet) {
      sheet = spreadsheet.getSheets()[0];
    }

    sheet.appendRow([
      new Date(),
      restaurantName,
      address,
      lat,
      lng,
      category,
      rating,
      featuredDish,
      mapsUrl
    ]);

    result.success = true;
    result.message = '資料已新增到試算表。';
    result.data = {
      restaurantName: restaurantName,
      address: address,
      lat: lat,
      lng: lng,
      category: category,
      rating: rating,
      featuredDish: featuredDish,
      mapsUrl: mapsUrl
    };

    return createJsonResponse(result, 200);
  } catch (error) {
    result.message = '伺服器錯誤：' + error.message;
    return createJsonResponse(result, 500);
  }
}

function doGet(e) {
  var payload = {
    success: false,
    message: '讀取資料失敗。',
    data: []
  };

  try {
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    if (!spreadsheet) {
      payload.message = '找不到作用中試算表。';
      return createJsonResponse(payload, 500);
    }

    var sheet = spreadsheet.getSheetByName('Sheet1');
    if (!sheet) {
      sheet = spreadsheet.getSheets()[0];
    }

    var values = sheet.getDataRange().getValues();
    if (values.length <= 1) {
      payload.success = true;
      payload.message = '試算表中無資料。';
      return createJsonResponse(payload, 200);
    }

    var headers = values[0];
    var rows = values.slice(1);
    var data = rows.map(function(row) {
      return {
        timestamp: row[0],
        restaurantName: row[1],
        address: row[2],
        lat: row[3],
        lng: row[4],
        category: row[5],
        rating: row[6],
        featuredDish: row[7],
        mapsUrl: row[8]
      };
    });

    payload.success = true;
    payload.message = '已讀取試算表資料。';
    payload.data = data;
    return createJsonResponse(payload, 200);
  } catch (error) {
    payload.message = '伺服器錯誤：' + error.message;
    return createJsonResponse(payload, 500);
  }
}

function doOptions(e) {
  return createJsonResponse({success: true, message: 'CORS preflight response'}, 204);
}

function createJsonResponse(payload, statusCode) {
  var output = ContentService.createTextOutput(JSON.stringify(payload));
  output.setMimeType(ContentService.MimeType.JSON);
  output.setHeader('Access-Control-Allow-Origin', '*');
  output.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  output.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  output.setHeader('Access-Control-Max-Age', '3600');
  if (statusCode) {
    output.setHeader('Status', statusCode);
  }
  return output;
}
