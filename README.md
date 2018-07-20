# app-schedule-notifier
予定slack通知サービス（Prsoniumカレンダーとの連携を前提）
### 準備
1. slackのワークスペース、Botの作成（slack通知のためにはBotトークンが必要）
1. bar/90_contents/ServiceInfo/ServiceInfo.jsonに必要な情報を記述
1. barフォルダを圧縮して、barファイルを作成
1. Boxインストール（Personiumカレンダーアプリを自分のユーザセルにインストールしていることが前提）
    * Box名：app-schedule-notifier
1. Personiumカレンダーアプリとの連携のためのルールを手動でユーザセルに登録
```
{
  "EventType": "odata.create",
  "EventObject": "personium-localcell:/io_personium_demo_app-personium-calendar/OData/vevent",
  "Action": "exec",
  "TargetUrl": "personium-localcell:/app-schedule-notifier/SetTimer/setTimer"
}
```

### 利用方法
Personiumカレンダーアプリで何かしらの予定を同期すると、予定の開始時刻になるとslackに通知される。
#### 現在、新規登録された予定の通知のみ対応。メッセージも予定内容については通知していない（7/11現在）
