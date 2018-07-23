function(request) {
  var targetCell = pjvm.getCellName(); //UserCell
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
  var evt_info = params.Info;

  var clientAccessor = _p.as("serviceSubject");

  try{
    var ScheduleAccessor = clientAccessor.cell(targetCell); //内部的にトークンをトランスセルトークンに切り替え
    var ScheduleBoxAccessor = ScheduleAccessor.box("io_personium_demo_app-personium-calendar");
    var ScheduleCollectionAccessor = ScheduleBoxAccessor.odata("OData");
    var ScheduleEntityAccessor = ScheduleCollectionAccessor.entitySet("vevent");
    var ScheduleQuery = "__id eq '"+evt_info.slice(0,-2)+"'";//予定情報のidを抽出
    var ScheduleEntitiesResponse = ScheduleEntityAccessor.query().filter(ScheduleQuery).run(); // 予定情報を検索
    var ScheduleEntity = ScheduleEntitiesResponse.d.results[0]; //entity[]

    var scheduleName = ScheduleEntity.summary;

  } catch(e) {
    return {
      status: 501,
      headers: { "Content-Type": "text/html" },
      body: ["Server Error occurred. [Personal Cell Accessor]" + e]
    };
  }
///デバック用出力///
  try {
    var TimertestAccessor = clientAccessor.cell(targetCell); //内部的にトークンをトランスセルトークンに切り替え
    var TimertestBoxAccessor = TimertestAccessor.box("app-schedule-notifier");
    var TimertestCollectionAccessor = TimertestBoxAccessor.odata("TimerList");
    var TimertestEntityAccessor = TimertestCollectionAccessor.entitySet("timer_list");
  } catch (e) {
    return {
      status: 500,
      headers: { "Content-Type": "text/html" },
      body: ["Server Error occurred. [Personal Cell Accessor]" + e]
    };
  }

  try{
    TimertestEntityAccessor.create({
      test: evt_info,
    }, "*");
  } catch (e){
    return {
      status: 500,
      headers: { "Content-Type": "text/html" },
      body: ["Server Error occurred. [Entity.create]" + e]
    };
  }
///////////
  try{
    var ServiceInfo = [];
    try{
      var SlackInfoAccessor = clientAccessor.cell(targetCell); //内部的にトークンをトランスセルトークンに切り替え
      var SlackInfoBoxAccessor = SlackInfoAccessor.box("app-schedule-notifier");
      var info = SlackInfoBoxAccessor.getString("ServiceInfo/ServiceInfo.json");
      ServiceInfo = JSON.parse(info);

      if (ServiceInfo.length == 0) {
        return {
          status : 204,
          headers : {"Content-Type":"application/json"},
          body: []
        };
      }
    } catch (e){
      if (e.code == 404) {
        return {
          status : 204,
          headers : {"Content-Type":"application/json"},
          body: []
        };
      } else {
        return {
          status : 500,
          headers : {"Content-Type":"application/json"},
          body: [JSON.stringify({"error": e.message})]
        };
      }
    }

    var slackToken = ServiceInfo.slack.token;//通知したいslackワークスペースのトークン（Botトークン？）
    var username = ServiceInfo.slack.username;//ユーザ名
    var defaultChannel = ServiceInfo.slack.defaultChannel;

    var slack = new _p.extension.Slack();
    slack.setConfig(slackToken, defaultChannel);
    slack.sendMessageToUser(scheduleName+"の時間だよ", username);
  } catch (e){
    return {
      status: 500,
      headers: { "Content-Type": "text/html" },
      body: ["Slack Message Error occurred." + e]
    };
  }

  var token = _p.as("serviceSubject").cell().getToken();

  var url = "https://" + host + "/"+targetCell+"/__ctl/Rule(Name='"+evt_info+"',_Box.Name='app-schedule-notifier')";
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
