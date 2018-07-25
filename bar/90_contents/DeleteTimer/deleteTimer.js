function(request) {
  var targetCell = pjvm.getCellName(); //ユーザセル
  var targetBox = pjvm.getBoxName(); //Box
  var host = request.host;
  var headers = request.headers;
  var authorization = headers.authorization;
  var accessToken = authorization.substring("Bearer ".length);

  var bodyAsString = request.input.readAll();
  if (bodyAsString === "") {
    return {
      status: 200,
      headers: { "Content-Type": "application/json" },
      body: ['{"error":{"status":200, "message": "' + accessToken + '"}}']
    };
  }
  var params = JSON.parse(bodyAsString);
  var evt_object = params.Object;

  var items = [];
  items = evt_object && evt_object.substring(8).split("/");

  //変更があったセル情報
  var cellName = items[1];
  var cellUrl = "https://" + host + "/" + cellName + "/";
  var boxName = items[2];
  var collectionName = items[3];
  var entityInfo = items[4].split("'");
  var entityType = entityInfo[0].substring(0, entityInfo[0].length - 1);
  var entityId = entityInfo[1].substring(0, entityInfo[1].length);

  //TODO:発火済みタイマールールに関するスケジュールが削除されたときの処理をどうするか？
  //（404エラーは出るがサービス自体に悪影響はなさそうだが）

  var token = _p.as("serviceSubject").cell().getToken();

  var url = cellUrl+"__ctl/Rule(Name='"+entityId+"_s"+"',_Box.Name='"+targetBox+"')";
  var headers = { "Authorization": "Bearer " + token.access_token, };
  var httpClient = new _p.extension.HttpClient();
  var httpCode, response;

  try {
    response = httpClient.delete(url, headers);
  } catch (e) {
    // System exception
    return {
      status: 500,
      headers: { "Content-Type": "text/html" },
      body: ["HttpClient Error occurred." + e]
    };
  }
  httpCode = parseInt(response.status);
  // DELETE API usually returns HTTP code 204
  if (httpCode !== 204) {
    // Personium exception
    return {
      status: httpCode,
      headers: { "Content-Type": "text/html" },
      body: ["REST Error occurred." + response.body]
    };
  }

  return {
    status: 200,
    headers: { "Content-Type": "text/plain" },
    body: ['{"status":' + response.status + ', "headers" ' + response.headers.toString()
    + ' "body":' + response.body + '}']
  };

}
