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


  var setTime = "";

  var clientAccessor = _p.as("serviceSubject");

    try {
      var TimerAccessor = clientAccessor.cell(cellName); //内部的にトークンをトランスセルトークンに切り替え
      var TimerBoxAccessor = TimerAccessor.box(boxName);//io_personium_demo_app-personium-calendar
      var TimerCollectionAccessor = TimerBoxAccessor.odata(collectionName);//OData
      var TimerEntityAccessor = TimerCollectionAccessor.entitySet(entityType);//vevent
      var timerQuery = "__id eq '"+entityId+"'";
      var TimerEntitiesResponse = TimerEntityAccessor.query().filter(timerQuery).run(); // result.__idで検索
      var TimerEntity = TimerEntitiesResponse.d.results[0]; //entity[]

      var time = TimerEntity.dtstart;
      var scheduleId = TimerEntity.__id;

      setTime = time.slice(6).slice( 0, -2 );

    } catch (e) {
      return {
        status: 500,
        headers: { "Content-Type": "text/html" },
        body: ["Server Error occurred. [Personal Cell Accessor]" + e]
      };
    }

    var rule = {
      "Name": scheduleId+"_s",
      "EventType": "timer.oneshot",
      "EventObject": setTime,
      "_Box.Name": targetBox,
      "EventSubject":"personium-localunit:/"+targetCell+"/#me",
      "EventInfo": scheduleId+"_s",
      "Action": "exec",
      "TargetUrl": "personium-localbox:/NotifySchedule/notifySchedule",
    };

    var token = _p.as("serviceSubject").cell().getToken();

    var postUrl = cellUrl+"__ctl/Rule";//"https://demo.personium.io/"+targetCell+"/__ctl/Rule"
    var headers = { "Authorization": "Bearer " + token.access_token, };
    var contentType = "application/json";
    var body = JSON.stringify(rule);
    var httpclient = new _p.extension.HttpClient();
    var httpCode, response;

    try{
      response = httpclient.post(postUrl, headers, contentType, body);
    } catch (e){
      return {
        status: 500,
        headers: { "Content-Type": "text/html" },
        body: ["HttpClient Error occurred." + e]
      };
    }
    httpCode = parseInt(response.status);
    if(httpCode != 201){
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
