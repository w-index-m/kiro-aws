# AWS WAFとKiro調査

AWS WAFの方式設計(サンプル)と、Kiroの画面・料金・使い方をまとめた資料一式です。

## 内容
- `docs/AWS_WAFとKiro調査.pptx` ... 調査スライド(42枚、v1.26)。PDF版も同梱
- `design/AWS_WAF_方式設計書_サンプル.xlsx / .md` ... WAFの方式設計書(サンプル)
- `design/AWS_WAF_画面一覧_入力サンプル.xlsx` ... WAF設定画面の入力サンプル
- `design/AWS_VPC_DX_方式設計書_パラメータシート_サンプル.xlsx / .md` ... VPC/Direct Connectの方式設計(サンプル)
- `terraform/` ... ネットワークのTerraformサンプル
- `tools/` ... スライド(make_deck.js)と方式設計書(build_waf_design.py)の生成スクリプト

## 注意
- 内容はサンプルです。実案件では、最新の公式ドキュメントで確認してください。
- スライド内のKiro画面は、Kiro公式サイト/ドキュメントのスクリーンショットです。公開する場合は、利用条件を確認してください。
- `tools/make_deck.js` は、画像フォルダ(kiroimg)がないと、そのままでは動きません。
