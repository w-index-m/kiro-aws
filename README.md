# kiro-aws — AWS Kiro まとめ

[w-index-m/nirvana-lab](https://github.com/w-index-m/nirvana-lab) の調査記録から、AWS の Kiro に関する部分を抜き出してまとめたものです。
元の文章は `docs/source/` にそのまま置いてあります。

> **注意**: 元資料の Kiro の内容は **2026-11-22〜25 時点の公式ドキュメント・記事で確かめた整理**で、Kiro 自体は実際には動かしていません。
> 版・提供範囲・料金はよく変わるので、使う前に最新の Docs で確認してください。

## 1. Kiro とは

AWS の AI 開発ツール。VS Code 系(Code OSS)のエディタのほか、CLI(`kiro-cli`、Amazon Q Developer CLI の後継)・Web がある。
特徴は **仕様(Specs)から入る** こと。

| 仕組み | 内容 | Claude Code での相当 |
|---|---|---|
| Specs | 依頼から `requirements.md` → `design.md` → `tasks.md` を作り、順に実装 (`.kiro/specs/<機能>/`) | 会話で決めて `docs/` に残す |
| Steering | プロジェクトの決まりを Markdown で毎回渡す (`.kiro/steering/`) | `CLAUDE.md` |
| Hooks | 保存・作成・削除などで決まった作業を実行 (`.kiro/hooks/`) | Claude Code の hooks |
| クラウドセッション / 自律エージェント | 管理されたクラウドの隔離環境で作業 (`kiro-cli --cloud`、自律エージェントはプレビュー) | クラウドのサンドボックス |
| MCP・Powers | 外部の道具をつなぐ。Powers に CDK/CloudFormation・SAM・Terraform 向けの手引き | MCP・skills |

モード: 既定は Autopilot。AWS を触るときは **Supervised**(ファイルを変えるたびに人が確認)を推奨。

## 2. 始める条件・必要なもの

- **サインイン**: GitHub / Google / AWS Builder ID / IAM Identity Center(会社利用は IAM Identity Center が前提)
- **プラン**: 無料枠は月 50 クレジットと少ない。本格利用は有料(会社なら AWS 請求の Enterprise)
- **AWS への変更**: その PC に有効な認証情報(SSO の一時的なもの推奨)と必要最小限の IAM 権限
- **道具**: AWS CLI、CDK 2.x か Terraform(SAM なら SAM CLI)、MCP 設定(`~/.kiro/settings/mcp.json` か Powers)
- AWS の変更は ① ターミナル(`aws`・`cdk deploy`・`terraform apply`) ② AWS MCP Server(SigV4 / OAuth)の 2 通り。認証は Kiro ではなく PC 側の AWS 設定を使う

## 3. 安全のための決まり(最重要)

1. 最初は**検証用の AWS アカウント**で試す
2. Kiro に渡すのは**読み取り権限だけ**(ViewOnlyAccess / SecurityAudit + SSO 一時資格情報)。書き込みを本当に防ぐのは権限であり、Steering の文言だけに頼らない
3. 本番への `apply` は **PR → CI → 人の承認 → CI/CD**。Kiro から直接 apply しない
4. `plan` に **削除・作り直し(forces replacement)・0.0.0.0/0 の許可** が出たら止めて報告
5. AWS Budgets で費用上限アラート
6. **Kiro のクラウド隔離環境は既定で外への通信に制限がない**(公式がプロンプトインジェクション・秘密の持ち出しの危険を明記)。強い鍵を置かない
7. 機密(VPN 事前共有鍵・パスワードハッシュ・SNMP コミュニティ等)を外部 AI に渡してよいか社内ルールで確認。Kiro のデータの扱い(学習利用設定)も確認

## 4. 標準の進め方(Kiro で AWS を作るまで)

1. **準備(人)**: Kiro を入れてサインインし、Git リポジトリを開く
2. **Steering(人)**: `product.md`・`tech.md`・`structure.md` と、会社の決まり・replace で止めるルールを書く
3. **AWS 設定(人)**: MCP・Powers、読み取り用 SSO プロファイル
4. **Spec 作成(Kiro)**: requirements → design → tasks。各段階を人が承認
5. **タスク実行(Kiro)**: Supervised で
6. **plan まで(Kiro)**: fmt・validate・plan。作り直しが出たら止める
7. **反映(人)**: PR → CI の検査 → 承認 → CI/CD から apply
8. **確認(Kiro)**: describe で確かめ、設計書・パラメータシートを再生成

依頼のコツ: 「反映して」とは頼まず「IaC を直して plan まで出し、PR にして」まで。環境・ファイル・目的を具体的に、やってほしくないことと確認方法も書く。

Steering の例(`.kiro/steering/aws-change.md`):

```
- apply、aws の書き込み系コマンド(authorize-*/revoke-*/delete-* など)は実行しない
- 変更するのは terraform/ の下だけ
- plan に削除・作り直し・0.0.0.0/0 の許可があれば、そこで止めて報告する
- PR の本文には、plan の要約・影響範囲・切り戻し手順・作業後の確認コマンドを書く
```

## 5. 何が楽になり、何が残るか

- **楽になる**: IaC を書く(CDK・CloudFormation・Terraform)、調べる(AWS MCP でドキュメント・現在のリソース)、出す(AWS MCP Server の Deployment SOP、プレビュー)
- **増える**: Specs を先に作る分、最初の工程は増える(作り直しは減る)
- **人に残る**: ネットワーク構成・権限・費用の判断、plan・出来上がりの確認、承認

## 6. VPC / Direct Connect / ALB / NLB

| 部品 | Kiro に任せる | 人が決める | 注意 |
|---|---|---|---|
| VPC | CIDR・サブネット・ルート・NAT・エンドポイント・フローログ | CIDR 設計(重複)、AZ 数、NAT 数(費用) | 後から変えると作り直し。最初の設計が最重要 |
| Direct Connect | DXGW、VGW/TGW 関連付け、VIF、ルート伝搬 | 回線申込・LOA・配線・BGP の ASN/VLAN/キー、オンプレ側 BGP | 物理・契約はコード化不可。経路ミスで本番通信停止 |
| ALB | リスナー・ルール・TG・ヘルスチェック・SG・WAF | ACM 証明書、公開範囲、ルール優先順位 | DNS 検証は DNS 側作業。ルール順の間違いに注意 |
| NLB | リスナー・TG・EIP・クロスゾーン・TLS | 固定 IP、送信元 IP 保持、ヘルスチェック方式 | サブネット/EIP 変更は作り直し。送信元 IP の扱いで SG が変わる |

**DX → DXGW → VPC** は 3 段階: ①物理回線(数日〜数週間・人/事業者) ②AWS 側論理(DXGW・VIF・VGW/TGW・関連付け・伝搬、1 回の apply で数分〜数十分) ③オンプレ BGP(人)。②は①と並行して先に作れる。

| 窓口 | VIF | 向く場面 | DXGW あたり上限(既定) |
|---|---|---|---|
| VGW | private | VPC が少ない | 20(引き上げ不可) |
| TGW | transit | VPC が多い・VPC 間通信も | 6 |
| Cloud WAN コアネットワーク | — | 複数リージョンを Cloud WAN で統合 | 要確認 |

進め方の決まり: replace で止める / DX の経路(広告・受信・優先度)を design に表で書かせ、人がオンプレ設定と突き合わせる / 本番は作業時間を決めて CI/CD から / CIDR・ASN・VLAN・EIP はパラメータシートを正とする。

ALB の HTTPS は ACM 証明書が必要(同一リージョン)。順番は VPC 土台 → ACM 申請・DNS 検証 → ALB → NLB → 名前解決。待ちになるのは DNS 検証(Route 53 なら同じ apply で完結)。

## 7. ドキュメント類を Kiro で作れるか

| 文書 | 結論 |
|---|---|
| 要件定義書 | 下書きは可。`requirements.md` は機能 1 つ分(EARS 形式)で範囲が狭い。非機能要件は IPA 非機能要求グレードを Steering に入れて補う。合意の書類なのでレビュー・承認は必須 |
| 基本設計書・詳細設計書 | 作れるが出るのは開発用メモ(Markdown)。表紙・改訂履歴・値の表は補う。**値は AI に考えさせず IaC と describe の結果から機械的に起こす**。Word は pandoc、Excel は変換スクリプト |
| 作業手順書・運用手順書 | 下書き可(事前確認・手順・確認方法・切り戻し・運用)。検証環境で一度通してから本番へ |

## 8. 変更・運用まわり

- **Kiro で作ったら変更も Kiro 必須?** → 不要。普通の IaC と Markdown が Git に入るので他の道具でも変更可。ただしコンソール直変更は避け、ドリフトを定期検出し、Kiro 外で変えたら Spec・設計書も直す
- **チャットで firewall も変えられるか** → API 経由で可能(SG・NACL・Network Firewall・WAF)。直接変更は検証環境まで、本番は「IaC を直させる → plan → PR → CI → 承認 → CI/CD」
- **反映方法** → IaC の道具(`terraform apply` / 変更セット / `cdk deploy`)を本番では CI/CD が実行。aws-cli は作業前後の `describe-*` 確認用
- **AWS の状態を見られるか** → 読み取り権限で可(describe 系、CloudWatch、CloudTrail、Config、`terraform plan -refresh-only`、ドリフト検出)。秘密(Lambda 環境変数など)は読ませない
- **別の AI による確認** → 4 段: 機械検査(validate/tflint/checkov/cfn-lint/cfn-guard)→ 別 AI で要件と plan 差分を突き合わせ → 人の承認 → 反映後の実通信確認(Reachability Analyzer・Network Access Analyzer)。AI は承認の代わりではなく確認を 1 段増やすもの

## 9. 既存 firewall → AWS Network Firewall

下書きは可。**元ルール 1 本ずつの対応表(移さないものは理由付き)** を必ず作らせて人が突き合わせる。

- ゾーン(inside/outside/DMZ)は無い → VPC・サブネットとルートテーブルで通り道を作る
- 上から順評価 → strict order を選ぶ
- NAT・IPsec VPN は Network Firewall ではできない(別途用意)
- アプリ識別・AV・URL カテゴリは一部のみ置き換え可。単純な許可は SG で足りることも多い
- ラボ検証: 模擬 IPCOM のルール 6 本 → 新ルール 8 本。確認用通信 21 本のうち 1 本が不一致(LAN→外 22/tcp、インタフェース区別が消えたため WAN 側 deny が先に一致)

## 10. 他の AWS AI ツールとの使い分け

| ツール | 用途 |
|---|---|
| **Kiro**(エディタ/CLI/Web) | 仕様から入って新しく作る(要件・設計・IaC・plan・文書下書き) |
| Amazon Q Developer | IDE 補完・コンソールでの相談。Kiro CLI が Q Developer CLI の後継(2025-11) |
| AWS Transform | 今あるもの(VMware・メインフレーム・.NET)を AWS へ移行 |
| AWS DevOps Agent | 運用・障害対応(2026-03 一般提供) |
| Amazon Bedrock(AgentCore) | 自分で AI エージェントを作る基盤 |

どれを使っても「権限は最小限・本番は人の承認と CI/CD」は共通。Direct Connect の物理・契約はどの AI もコード化できない。

## 11. サンドボックス比較(Kiro の位置づけ)

Kiro のクラウドセッションは他社(Claude Code Web・Codex・Copilot cloud agent など)と同様の使い捨て隔離環境だが、**外への通信が既定で制限なし**(他は許可制/既定オフが多い)。詳細は `docs/source/ai-agent-sandboxes.md`。

## 12. AWS WAF と Kiro 調査(追加資料)

`waf-kiro/` に、別途用意された「AWS WAF と Kiro 調査」一式(スライド・設計書サンプル・Terraform サンプル・生成スクリプト)を取り込んでいます。
内容はすべてサンプルで、2026-11-25 時点(スライド v1.26)の整理です。

| パス | 内容 |
|---|---|
| `waf-kiro/docs/AWS_WAFとKiro調査.pptx` / `.pdf` | 調査スライド(42 枚) |
| `waf-kiro/design/AWS_WAF_方式設計書_サンプル.xlsx` / `.md` | WAF 方式設計書(v1.3) |
| `waf-kiro/design/AWS_WAF_画面一覧_入力サンプル.xlsx` | WAF 設定画面の入力サンプル |
| `waf-kiro/design/AWS_VPC_DX_方式設計書_パラメータシート_サンプル.xlsx` / `.md` | VPC / Direct Connect 方式設計 |
| `waf-kiro/terraform/` | VPC・DX・NACL/SG の Terraform サンプル(`terraform.tfvars` がパラメータシートに対応) |
| `waf-kiro/tools/` | スライド生成 `make_deck.js`、設計書生成 `build_waf_design.py` |

注意: `make_deck.js` は画像フォルダ(kiroimg)が無いとそのままでは動きません。スライド内の Kiro 画面は Kiro 公式のスクリーンショットなので、公開時は利用条件を確認してください。

### WAF 設計の要点(`AWS_WAF_方式設計書_サンプル`)

- **構成**: Internet → IGW → ALB(+ リージョナル Web ACL `sample-prd-waf-alb`)→ App → DB。既定アクションは Allow(ブロックリスト方式)
- **ルール評価順**: 1 許可 IP(Allow)→ 2 レート制限(2,000 回/5 分で Block)→ 3 IP reputation → 4 Core rule set → 5 Known bad inputs → 6 SQL database
- **導入**: 全ルールを Count で開始し、Sampled requests とログで誤検知を確認してから Block へ。ALB では本文検査が先頭 8KB 固定のため、アップロード系パスは Core rule set の `SizeRestrictions_BODY` から範囲を限定して除外
- **WCU・料金**: 合計 約 1,128 WCU(上限 5,000、基本料金に含まれるのは 1,500 まで)。有料マネージドルールは追加時に自動購読になる
- **ログ**: S3 の `aws-waf-logs-` で始まる名前へ出力、authorization / cookie をマスク、保管 90 日
- **関連付け可能**: CloudFront・ALB・API Gateway(REST)・AppSync・App Runner・Verified Access など。NLB・GWLB は不可
- **他機能との分担**: NACL/SG = L3/L4、WAF = L7、Network Firewall = L3〜L7(未採用)、Shield = DDoS、Firewall Manager = 複数アカウント一元管理
- **マネージドルールの更新**: 既定の版は新版公開で自動では変わらず、切替の 1 週間前と当日に SNS 通知。IP reputation は版が無く頻繁に更新され通知対象外

### Kiro に関する追加情報(スライド 19〜42)

- **概要**: 2025-07-14 に AWS が発表したエージェント型 IDE。Code OSS 製で VS Code の設定・Open VSX 拡張と互換。Google / GitHub ログインなら AWS アカウント不要。IDE・CLI・Web がある
- **料金(2026-11 時点、公式 kiro.dev/pricing)**:

| プラン | 月額 | クレジット |
|---|---|---|
| Free | $0 | 50 |
| Pro | $20 | 1,000 |
| Pro+ | $40 | 2,000 |
| Pro Max | $100 | 5,000 |
| Power | $200 | 10,000 |
| Enterprise | $20/席(2 席〜) | 500/席(共有) |

  追加は 1 クレジット $0.04。Free はオープンウェイトモデルと Claude Sonnet 4.5 のみ
- **注意点**: 仕様駆動の重い使い方では無料枠はすぐ尽きる / Open VSX のため Microsoft 製 C# 拡張は使えない / クラウド型のため NDA 案件では懸念の声あり
- **他ツールとの違い**: Cursor・Claude Code は「依頼するとすぐ編集」、Kiro は「先に計画と仕様を固める」流れ。設計書を書いてから実装するインフラ系と相性が良さそう
- **BYOK(自分の API キー)**: 公式対応は今回の調査では確認できず(GitHub に要望 #9367・#1409)
- **他エディタとの関係**: VS Code 内では ACP(`kiro-cli acp`)とコミュニティ拡張、Visual Studio / Eclipse は Kiro CLI を併用、JetBrains は AI Assistant にカスタムエージェントとして追加
- **WAF の設定変更を Kiro に頼む流れ**、**CLI(AWS CLI)の結果を Kiro で使う方法**、**Steering・Skills・Powers の違い**(誰が・いつ書くか)、**Power の守備範囲(Aurora DSQL の例)** はスライド 33〜41 を参照

## 元資料

- `docs/source/ai-driven-aws.md` — AI ドリブンで AWS を作るなら(Kiro の節を含む全文・出典 URL 付き)
- `docs/source/ai-agent-sandboxes.md` — AI エージェントのサンドボックス比較
- `waf-kiro/` — AWS WAF と Kiro 調査(上記 12 章)

nirvana-lab にはほかに Kiro 解説デッキ(`tools/decks/ai_driven_dev_kiro_deck.js`)、`docs/fw-migrate-ipcom-to-nfw.md`、`docs/aws-network-design-sample.md`、`docs/design-docs-from-describe.md` があります(未取り込み)。
