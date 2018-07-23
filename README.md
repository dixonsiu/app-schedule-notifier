# app-schedule-notifier
予定slack通知サービス（Prsoniumカレンダーとの連携を前提）
### 準備
1. slackのワークスペース、Botの作成（slack通知のためにはBotトークンが必要）
1. bar/00_meta/00_manifest.jsonの***をアプリCell情報に変更（現在、https://demo.personium.io/test-matsuzoe/ にアプリが配備されている）
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
#### 現在、新規登録された予定の通知のみ対応（予定の変更／削除によるタイマールール変更は未対応）
