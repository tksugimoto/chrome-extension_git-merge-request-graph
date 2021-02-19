# GitLab の Merge Request の関係を可視化する Chrome拡張

## 事前準備
1. GitLab API の AccessToken を取得
    - SaaS版 `GitLab.com` なら [Personal Access Tokens · User Settings · GitLab](https://gitlab.com/profile/personal_access_tokens) から
    - 必要な権限: `read_api`
1. [chrome-extension/.env.example.js](./chrome-extension/.env.example.js) を参考に `chrome-extension/.env.js` を作成
    - 対象 project の ID の指定必須
    - `TODO`: Chrome拡張内で設定できるようにする
1. `mermaid.min.js` を [chrome-extension/lib/mermaid/](chrome-extension/lib/mermaid/) に配置する
    - https://unpkg.com/mermaid/ の `dist` ディレクトリからダウンロード
1. ブラウザに拡張をインストール
