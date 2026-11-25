from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

FONT = "Meiryo UI"
import os
BASE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "design", "AWS_WAF_方式設計書_サンプル")
TITLE = "AWS WAF 方式設計書(サンプル)"

S = []  # sheets
SRC = "AWS SCS対策資料(maruchin tech v1.0.3)"

S.append(dict(name="改版履歴", title="改版履歴・文書情報", headers=["項目", "内容"], widths=[22, 90], rows=[
    ["文書名", "AWS WAF 方式設計書"],
    ["システム名", "サンプル商事 EC サイト 本番環境(02_AWSネットワーク設計書サンプルと同一の構成)"],
    ["版数", "1.4(02_AWSネットワーク設計書サンプル(サンプルA)の構成・値に統一。VPC 10.20.0.0/16、shop-prd 命名、Network Firewall 採用、WAF は 5 ルール)"],
    ["作成日", "2026-11-25"],
    ["対象範囲", "AWS WAF(リージョナルWeb ACL)のALBへの適用。ルール、ログ、監視、運用方針、試験項目"],
    ["関連文書", "02_AWSネットワーク設計書サンプル(出力/basic-design.md・parameter-sheet.xlsx)。VPC・DX・ALB・NAT・Network Firewall はそちらを正とする"],
    ["前提", "保護対象のALB(shop-prd-alb)はPublicサブネットに配置する。インターネットからの通信は IGW → Network Firewall → ALB(WAF)の順に通る。ALB自体の設計は本書の対象外(別途定義)。"],
    ["注記", "本書の値はすべてサンプルです。IP、名称、しきい値は実案件の値に置き換えてください。コンソールの項目名は更新されるため、実画面と照合してください。"],
    ["試験観点の反映", "AWS公式の試験ガイド(SCS、ANS)・AWS WAF FAQ・学習サイトの整理を参考に、『試験観点チェック』シートにまとめた。試験問題(問題集)そのものは参照していない。v1.3では、ユーザー提供のSCS対策資料(Udemy教材のPDF、maruchin tech)の『Infrastructure Security』章(WAF、Network Firewall、SG/NACL、Shield、Firewall Manager)を参考に追記した。"],
]))

S.append(dict(name="方式設計", title="方式設計", headers=["No.", "区分", "項目", "設計方針", "設計内容", "根拠・備考"],
              widths=[6, 14, 20, 34, 70, 40], rows=[
    [1, "全体", "目的", "Webアプリ層(L7)の攻撃をALBの手前で検知・遮断する", "SQLインジェクション等の一般的な攻撃、既知の不正入力、悪性IP、過剰アクセスを対象とする。", "NACL/SGによるネットワーク層の防御を補完する"],
    [2, "全体", "保護対象", "インターネット公開のALBを保護する", "shop-prd-alb(Application Load Balancer、Publicサブネット 10.20.0.0/24, 10.20.1.0/24 に配置)をWeb ACLに関連付ける。", "02 のPublicサブネット(shop-prd-pub-1a / 1c)"],
    [3, "構成", "配置", "リージョナルWeb ACLをALBに関連付ける", "Internet → IGW → Network Firewall(AZごと)→ ALB(+Web ACL)→ App(Private-App)。Network Firewall で L3〜L7 の検査を通したうえで、ALBに到達したリクエストをWAFが評価する。戻りは同じAZのFirewallを通る。", "構成図参照。02 のルート設計(IGWエッジ関連付け)による"],
    [4, "構成", "スコープ", "リージョナルスコープ", "ap-northeast-1。CloudFrontを前段に置く場合は、別途 Global(CloudFront)用のWeb ACLを作成する。", "ALBと同一リージョンが必須"],
    [5, "Web ACL", "構成", "ALB単位で1つのWeb ACL", "名称: shop-prd-webacl。デフォルトアクションはAllow(ブロックリスト方式)。", "正規利用を妨げにくい。厳格化が必要ならAllowリスト方式を検討"],
    [6, "ルール", "ルール構成と評価順", "IP評判 → 汎用 → 既知不正入力 → SQLi → レート制限 の順に評価", "優先度10: Amazon IP reputation list / 20: Core rule set / 30: Known bad inputs / 40: SQL database / 50: レート制限(Block)。詳細は『P_ルール』。", "番号の小さい順に評価。Allow/Blockに一致した時点で評価終了。02 の WAF 定義と同一"],
    [7, "ルール", "SQLi対策", "AWSマネージドルール『SQL database』で遮断", "AWSManagedRulesSQLiRuleSet を優先度40で追加。クエリ文字列、ボディ、Cookie、URIパスのSQLiパターンを検査する。", "根本対策はアプリ側のプレースホルダ(バインド変数)利用"],
    [8, "ルール", "レート制限", "同一IPからの過剰アクセスを制限", "5分間に2000リクエスト超でBlock(集約キー: IPアドレス)。しきい値は運用実績を見て調整する。", "総当たり・過負荷の緩和"],
    [9, "ルール", "許可IP(未採用)", "許可IPルールは設けない", "02 の構成では許可IPのAllowルールを置かない(保守拠点からの通信もWAFの検査を通す)。必要になった場合は IP set と優先度1のAllowルールを追加する(Allowに一致すると以降のルールを評価しない点に注意)。", "02 の WAF 定義(5ルール)に合わせた"],
    [10, "運用", "導入手順", "Countで開始し、段階的にBlockへ移行", "初期は各ルールをCount(マネージドルールは上書き)。Sampled requestsとログで誤検知を確認し、問題なければBlockへ切り替える。誤検知は該当ルールのみCountにする、または範囲を限定して除外する。例: ALBでは8KB超のボディをCore rule setのSizeRestrictions_BODYがブロックするため、ファイルアップロード等のパスは対象を限定して除外する。", "誤検知による業務影響を避ける"],
    [11, "運用", "ログ", "CloudWatch Logsに保存し、機密ヘッダはマスクする", "送信先: aws-waf-logs-shop-prd(CloudWatch Logsのロググループ、同一リージョン)。authorization、cookieヘッダをマスク。", "ロググループ名は aws-waf-logs- で始める必要がある。02 のログ方針(WAFはCloudWatch Logs)と同一"],
    [12, "運用", "監視", "CloudWatchメトリクスで可視化する", "全ルールのメトリクスを有効化し、Blockの急増をアラーム化する(しきい値は運用で決定)。", ""],
    [13, "運用", "権限", "最小権限とする", "WAFの設定変更権限と参照権限を分離する。Terraform実行用・Kiro用のIAMロールは別途定義(参照専用から開始)。", ""],
    [14, "運用", "構成管理", "Terraformで管理する(予定)", "wafv2のリソースをコード化する。マネージドルールグループのバージョンを固定するかは運用時に検討する(更新による誤検知増加への備え)。", "コードとパラメータシートの値を一致させる"],
    [15, "容量/料金", "WCUと料金", "WCUを把握したうえでルールを追加する", "合計1,127 WCU(『P_ルール』参照。Core rule set 700、SQL database 200、Known bad inputs 200、IP reputation 25は公式記載値、自前のレート制限は概数 2)。Web ACLの上限は5,000 WCUで、基本料金に含まれるのは1,500 WCUまで(超過分は追加料金)。本構成は1,500以内。料金はWeb ACL数、ルール数(マネージドルールグループは1つ追加ごとに月額)、リクエスト数に応じて発生するため、単価は公式の料金ページで確認する。", "有料のマネージドルールは追加時に自動購読となるため、追加前に料金を確認する"],
    [16, "制約", "WAFの限界", "WAFの限界を前提に設計する", "ALBではリクエストボディの検査は先頭8KB(8,192バイト)までで、この上限は変更できない。ヘッダーとCookieも先頭8KB・最大200件まで。上限を超えた場合の扱いは、ルールごとのOversize handling(Continue / Match / No match)で選ぶ。エンコード等の回避もあり得るため、アプリ側の対策と併用する。", ""],
    [17, "タグ", "タグ/命名規則", "全リソースに統一タグを付与", "命名: {system}-{env}-{resource}(例: shop-prd-webacl)。必須タグ: Name, System, Env, Owner, CostCenter。", "02 の命名規則(shop-prd-*)と共通"],
    [18, "関連サービス", "役割分担", "WAFと他サービスの守備範囲を分けて設計する", "WAF: HTTP/HTTPSのL7(URI・クエリ文字列・ヘッダー・ボディ等)を検査。Shield: DDoS防御(Standardは自動適用、Advancedは別途契約)。Firewall Manager: AWS Organizationsの複数アカウントでWAFルールを一元管理(Organizations有効が前提)。GuardDuty/Macie: 脅威検知・機密データ検出でありWAFの代替ではない。NACL/SG: L3〜L4の制御。", "試験で混同されやすい点。本構成は単一アカウント想定のためFirewall Managerは対象外"],
    [19, "関連サービス", "適用可能リソース", "現構成はALB。将来の拡張先を把握しておく", "WAFを関連付けられる主なリソース: CloudFront、ALB、API Gateway(REST)、AppSync、App Runner、Verified Access(ほかCognitoユーザープールなど)。NLB・GWLBは関連付けできない(ELBのうちALBのみ対応)。CloudFront利用時はGlobal用のWeb ACLを別に作成し、ルールはエッジロケーションで評価される。", "AWS WAF FAQと学習サイトの整理に基づく"],
    [20, "検討事項", "今回未採用の機能", "要件が出た時点で追加を検討する", "国別の地理的制限(Geo match)、Bot Control(有料)、Anti-DDoSマネージドルールグループ(AWSManagedRulesAntiDDoSRuleSet、50 WCU、追加料金あり)、CAPTCHA/Challenge、AWS WAF Security Automations(AWS公式ソリューション)。", "追加時は料金とWCUを必ず確認する"],
    [21, "多層防御", "セキュリティ機能の使い分け", "レイヤーごとに防御機能を分担させる", "L3/L4: NACL(サブネット、ステートレス、許可/拒否)とSG(ENI、ステートフル、許可のみ)。L7: WAF(HTTP/HTTPSの内容を検査)。L3〜L7: Network Firewall(VPC全体、IPS・ドメインフィルタ)。本構成はNACL/SGでネットワーク層、Network Firewallでインターネット・オンプレの出入り、WAFでALB手前のL7を担当する。詳細は『セキュリティ機能比較』シート。", f"{SRC}。Network Firewallの採用は 02 の設計による"],
    [22, "多層防御", "DDoS対策との関係", "L7のDDoSはWAFとShieldを併用して検討する", "L7(HTTPフラッド等): WAF、Shield、CloudFront、ALB、Auto Scaling。L3/L4(SYNフラッド、UDPリフレクション等): Shield、Route 53、ELB、SG、NACL。Shield Standardは全アカウントで自動適用(L3/L4)。Shield Advancedは有料で、L7のDDoS検出・緩和をWAFと連携して行い、WAFの料金が含まれる。対象は明示指定(CloudFront、Route 53ホストゾーン、ALB/NLB、Global Accelerator、EC2のElastic IP)。24時間365日のDRT対応あり。", f"{SRC}。Shield Advancedは本構成では未契約(要件次第)"],
    [23, "ルール", "ルールの提供元とアクション", "AWSマネージドルールを基本とし、特化型が必要ならMarketplaceを検討", "マネージドルールの提供元は、AWS(一般的なセキュリティ、無料〜一部有料、AWSがサポート)とAWS Marketplace(特化型、有料、各ベンダーがサポート)。アクションはAllow、Block(既定403)、Count(テスト・監視)、CAPTCHA、Challenge(サイレント確認)の5種類。本構成はAllow/Block/Countを使用。", f"{SRC}"],
    [24, "多層防御", "Network Firewallでできること", "インターネットとオンプレの出入りをVPCの入口で検査する(02 で採用)", "VPC向けのマネージドなファイアウォール(AWSが管理し、スケール・可用性を担保)。ステートフル検査、IPS、ドメイン名フィルタリングを提供。ルール評価は、ステートレスルールグループ(pass / drop / forward_to_sfe)→ ステートフルルールグループ(5タプル、ドメイン名、Suricata互換のIPSルール。PASS / DROP / ALERT / REJECT)→ デフォルトアクションの順。WAFと異なり、保護対象リソースへの関連付けではなくルーティング経由で通信を通す。02 では shop-prd-fw-1a / 1c に配置し、IGW・VGWのエッジルートテーブルで入ってくる通信をFirewallへ向け、行きと帰りが同じAZのFirewallを通るようにしている(STRICT_ORDER、既定は drop_established + alert_established)。", f"{SRC}。ルールグループ・ドメイン許可リストは 02 の『NetworkFirewall』シートを参照"],
    [25, "関連サービス", "その他のセキュリティ関連サービス", "予防(WAF等)と検知・調査・管理のサービスを役割で分けて把握する", "予防的制御: WAF、Shield、Network Firewall、SG/NACL。検知: GuardDuty(CloudTrail・VPC Flow Logs・DNSログを分析する脅威検出、エージェント不要)、Inspector(EC2・ECRのコンテナイメージ・Lambdaの脆弱性とネットワーク露出を継続スキャン)、Macie(S3内の機密データ検出)。集約・調査: Security Hub(検出結果の集約)、Detective(調査)。管理: Firewall Manager(複数アカウントのWAF・Shield Advanced・SG・Network Firewall・Route 53 DNS Firewallを一元管理。Organizations参加とConfig有効化が前提)。詳細は『セキュリティサービス一覧』シート。", f"{SRC}(章構成・各サービスの章)。Detectiveの説明は一般的な機能理解による"],
]))

diagram = """[Internet Client]
      |
   [IGW shop-prd-igw]   (edge route table -> Network Firewall)
      |
+---------------- VPC 10.20.0.0/16 (ap-northeast-1) -----------------+
|  Firewall (1a 10.20.10.0/28 / 1c 10.20.10.16/28) [Network Firewall] |
|      |  (same-AZ round trip)                                        |
|  Public (1a 10.20.0.0/24 / 1c 10.20.1.0/24)                         |
|     [ALB shop-prd-alb] <==== associated ==== [Web ACL shop-prd-webacl]
|          |                                    10 IP reputation list |
|          |                                    20 Core rule set      |
|          |                                    30 Known bad inputs   |
|          |                                    40 SQL database (SQLi)|
|          |                                    50 rate limit 2000/5min (Block)
|  Private-App (10.20.20.0/24, 10.20.21.0/24)  [App]                  |
|  Private-DB  (10.20.30.0/24, 10.20.31.0/24)  [DB]                   |
+---------------------------------------------------------------------+

Web ACL --> logs: CloudWatch Logs aws-waf-logs-shop-prd
        --> metrics: CloudWatch (per rule)""".split("\n")
S.append(dict(name="セキュリティ機能比較", title="セキュリティ機能の比較(NACL / SG / WAF / Network Firewall)",
              headers=["項目", "ネットワークACL", "セキュリティグループ", "AWS WAF", "Network Firewall"],
              widths=[22, 28, 30, 44, 36], rows=[
    ["主な動作レイヤー", "L3 / L4", "L3 / L4", "L7(HTTP/HTTPS)", "L3〜L7"],
    ["適用レベル", "サブネット", "ENI / インスタンス", "ALB、CloudFront、API Gatewayなど", "VPC(ルーティング経由)"],
    ["ステート管理", "ステートレス", "ステートフル", "ステートレス", "ステートレス&ステートフル"],
    ["ルールのアクション", "許可 / 拒否", "許可のみ(暗黙の拒否)", "許可 / ブロック / カウント / CAPTCHA / Challenge", "許可 / 破棄 / アラート"],
    ["IPアドレス/CIDR", "○", "○(送信元)", "○", "○"],
    ["ポート/プロトコル", "○", "○", "△(HTTP/HTTPSが前提)", "○"],
    ["地理的位置(Geo)", "×", "×", "○", "×"],
    ["HTTPヘッダー", "×", "×", "○(名前、値、サイズ、正規表現)", "△(Host/SNI、IPSで検査可)"],
    ["URIパス / クエリ文字列", "×", "×", "○(文字列、正規表現、サイズ)", "△(IPSで検査可)"],
    ["HTTPボディ", "×", "×", "△(サイズ、内容は一部検査可)", "△(IPSで検査可)"],
    ["SQLi / XSSパターン", "×", "×", "○(専用の検出機能あり)", "△(IPSシグネチャで対応可)"],
    ["リクエストレート", "×", "×", "○(レートベースルール)", "×"],
    ["ボット/不正利用", "×", "×", "○(専用マネージドルールあり)", "×"],
    ["ペイロード検査(IPS)", "×", "×", "×", "○(ステートフルルール、Suricata互換)"],
    ["主な役割", "サブネット境界の基本フィルタ", "インスタンスの基本フィルタ", "ウェブアプリ/API特化型の保護", "VPCネットワークの高度な保護/IPS"],
    ["本構成での採否", "採用(02)", "採用(02)", "採用(本書)", "採用(02)"],
]))

S.append(dict(name="セキュリティサービス一覧", title="セキュリティ関連サービスの役割整理",
              headers=["分類", "サービス", "できること", "本構成での扱い", "根拠"],
              widths=[14, 24, 74, 36, 30], rows=[
    ["予防", "AWS WAF", "HTTP/HTTPSリクエストの内容を検査し、許可・ブロック・カウント等を行う(L7)", "採用(本書)", SRC],
    ["予防", "AWS Shield", "DDoS対策。Standardは全アカウントで自動(L3/L4)。Advancedは有料でL7も対象、WAFと連携、DRT対応", "Standardのみ(自動適用)", SRC],
    ["予防", "AWS Network Firewall", "VPC向けのマネージドFW。ステートフル検査、IPS(Suricata互換)、ドメインフィルタ", "採用(02。Firewallサブネットに配置)", SRC],
    ["予防", "セキュリティグループ / ネットワークACL", "L3/L4の制御。SGはステートフルで許可のみ、NACLはステートレスで許可/拒否", "採用(02)", SRC],
    ["予防", "Route 53 Resolver DNS Firewall", "VPCからのDNSクエリをフィルタリング(L7のDNS層)", "未採用", SRC + "(図中の記載)"],
    ["管理", "AWS Firewall Manager", "複数アカウントのWAF・Shield Advanced・SG・Network Firewall・DNS Firewallを一元管理。Organizations参加とConfig有効化が前提", "対象外(単一アカウント想定)", SRC],
    ["検知", "Amazon GuardDuty", "CloudTrail、VPC Flow Logs、DNSログを分析する脅威検出。フルマネージドでエージェント不要", "本書の対象外(併用を推奨)", SRC],
    ["検知", "Amazon Inspector", "EC2、ECRのコンテナイメージ、Lambdaの脆弱性(CVE)とネットワーク露出を継続スキャン", "本書の対象外", SRC],
    ["検知", "Amazon Macie", "S3内の機密データを検出する(WAFの代替ではない)", "本書の対象外", "SCS対策資料(章構成)・一般的な機能理解"],
    ["集約・調査", "AWS Security Hub", "各サービスの検出結果を集約する(GuardDuty等 → Security Hub → SNS通知の構成例あり)", "本書の対象外", SRC],
    ["集約・調査", "Amazon Detective", "検出事象の調査(原因分析)に使う", "本書の対象外", "SCS対策資料(章構成)・一般的な機能理解"],
    ["記録", "AWS CloudTrail / Config", "API操作の記録、設定変更の記録・評価。Firewall ManagerはConfigが前提", "本書の対象外", SRC],
]))

S.append(dict(name="構成図", title="論理構成図(テキスト)", headers=["構成図"], widths=[110], rows=[[l] for l in diagram], mono=True))

S.append(dict(name="P_WebACL", title="パラメータシート:Web ACL", headers=["No.", "項目", "設定値", "備考"], widths=[6, 40, 50, 46], rows=[
    [1, "Name", "shop-prd-webacl", "作成後は変更不可"],
    [2, "Description", "ALB向けWeb ACL(サンプル)", ""],
    [3, "CloudWatch metric name", "shop-prd-webacl", ""],
    [4, "Resource type / Region", "Regional resources / Asia Pacific (Tokyo) ap-northeast-1", ""],
    [5, "Associated AWS resources", "shop-prd-alb (Application Load Balancer)", ""],
    [6, "Default action", "Allow", "どのルールにも一致しない場合"],
    [7, "Request sampling", "Enable sampled requests", ""],
    [8, "Tags", "System=shop / Env=prd / Owner=network-team / CostCenter=CC0000", "Owner、CostCenterは要置換"],
]))

rules = [
    [10, "AWS-AWSManagedRulesAmazonIpReputationList", "マネージドルールグループ", "Amazon IP reputation list(評判の悪いIP)", 25, "ルールグループのアクション", "Countで開始"],
    [20, "AWS-AWSManagedRulesCommonRuleSet", "マネージドルールグループ", "Core rule set(XSS等を含む。ALBでは8KB超のボディをSizeRestrictions_BODYがブロック)", 700, "ルールグループのアクション", "Countで開始"],
    [30, "AWS-AWSManagedRulesKnownBadInputsRuleSet", "マネージドルールグループ", "Known bad inputs(既知の悪い入力)", 200, "ルールグループのアクション", "Countで開始"],
    [40, "AWS-AWSManagedRulesSQLiRuleSet", "マネージドルールグループ", "SQL database(SQLi対策)", 200, "ルールグループのアクション", "Countで開始"],
    [50, "shop-prd-rate-limit", "自前: Rate-based rule", "同一IPから5分間に2000リクエスト超(集約キー: IP)", 2, "Block", "Countで開始"],
]
S.append(dict(name="P_ルール", title="パラメータシート:ルール(優先度順)",
              headers=["優先度", "ルール名", "種別", "設定内容", "WCU(概数)", "アクション", "初期運用"],
              widths=[8, 46, 26, 50, 12, 28, 14], rows=rules, total_col=5,
              footer="合計WCU(概数): 1,127 / デフォルトアクション: Allow(マネージドルールのWCUは公式記載値、自前ルール2件は概数。実際の値は追加時の画面で確認)"))

S.append(dict(name="P_ログ", title="パラメータシート:ログ・監視", headers=["No.", "項目", "設定値", "備考"], widths=[6, 30, 50, 56], rows=[
    [1, "Logging destination", "Amazon CloudWatch Logs log group", "S3 / Firehose も選択可。02 の方針はCloudWatch Logs"],
    [2, "Log group name", "aws-waf-logs-shop-prd", "aws-waf-logs- で始める。同一リージョンに事前作成"],
    [3, "Redacted fields", "Header: authorization, cookie", ""],
    [4, "Filter logging", "なし(全リクエスト)", "コスト抑制が必要ならBlockのみに変更"],
    [5, "保管期間", "要決定(CloudWatch Logsの保持期間)", "02 の未決事項と合わせて決める"],
    [6, "CloudWatchメトリクス", "全ルール有効", "Blockの急増をアラーム化"],
]))

S.append(dict(name="操作手順", title="コンソール操作手順(概要)", headers=["No.", "操作", "入力/選択", "備考"], widths=[6, 52, 56, 56], rows=[
    [1, "事前準備: ログ用のロググループを作成", "aws-waf-logs-shop-prd(ap-northeast-1)", "ロググループ名は aws-waf-logs- で始める"],
    [2, "(許可IPを使う場合のみ)WAFコンソール > IP sets > Create IP set", "02 の構成では不要", "必要になった場合はWeb ACLより先に作成"],
    [3, "WAFコンソール > Web ACLs(一覧)でリージョンを選択し Create web ACL", "ap-northeast-1", "新コンソールでは『protection packs (web ACLs)』の表記になる場合あり"],
    [4, "Step1: 名前、リソース種別、関連付けるリソース", "『P_WebACL』の値", ""],
    [5, "Step2: Add rules > Add my own rules and rule groups(Rate-based)", "『P_ルール』の優先度50", ""],
    [6, "Step2: Add rules > Add managed rule groups。AWS managed rule groupsを展開し、各ルールグループの『Add to web ACL』を有効にして Add rules", "IP reputation(10)/ Core(20)/ Known bad inputs(30)/ SQL database(40)", "初回はCountに上書き。有料のルールグループは追加時に自動購読になるため注意"],
    [7, "Step3: 優先度を確認、Step4: メトリクス設定、Step5: 確認して作成", "『P_ルール』の優先度", ""],
    [8, "Web ACL詳細 > Logging and metrics でログを有効化", "『P_ログ』の値", ""],
    [9, "Associated AWS resources でALBの関連付けを確認", "shop-prd-alb", ""],
    [10, "Count運用で挙動を確認し、問題なければBlockへ切替", "『試験項目』を実施", ""],
]))

S.append(dict(name="試験項目", title="動作確認(試験項目)", headers=["No.", "項目", "手順", "期待結果", "結果"], widths=[6, 26, 62, 52, 20], blank_last=True, rows=[
    [1, "関連付け確認", "Web ACLの Associated AWS resources を確認する", "shop-prd-alb が表示される", ""],
    [2, "通常アクセス", "ALBのURLへ通常のHTTPSアクセスを行う", "正常に応答する(デフォルトAllow)", ""],
    [3, "SQLi検知(Count中)", "自環境のALBに ?id=1%27%20OR%20%271%27%3D%271 を付けて送る", "Sampled requests/ログにSQLiルールの一致が記録される。応答は通常どおり", ""],
    [4, "SQLi遮断(Block化後)", "同上", "403 Forbidden となり、ログにBLOCKが記録される", ""],
    [5, "レート制限", "検証用に同一IPから短時間に多数のリクエストを送る(事前承認のうえ)", "Count中は記録のみ、Block化後は403", ""],
    [6, "Firewall経由", "インターネットからALBへアクセスし、Network FirewallのFLOWログを確認する", "Firewall(同じAZ)を経由してALBに届き、戻りも同じAZを通る", ""],
    [7, "ログ出力", "CloudWatch Logsのロググループを確認する", "aws-waf-logs-shop-prd にログが出力される", ""],
    [8, "メトリクス", "CloudWatchでWAFのメトリクスを確認する", "各ルールのメトリクスが表示される", ""],
]))

S.append(dict(name="試験観点チェック", title="試験で問われやすい観点と、本設計での反映状況",
              headers=["No.", "観点", "内容", "本設計での反映箇所", "状態", "根拠の種類"],
              widths=[6, 30, 60, 30, 28, 34], rows=[
    [1, "WAFの役割と対象リソース", "L7(HTTP/HTTPS)の防御。CloudFront、ALB、API Gateway、AppSyncなどに関連付ける", "方式設計 No.2, 3, 19", "反映済み", "AWS WAF FAQ、学習サイト"],
    [2, "Web ACLとルール", "Web ACLは優先度順のルールとデフォルトアクションで構成", "方式設計 No.5, 6", "反映済み", "学習サイト"],
    [3, "マネージドルールグループ", "SQL database、Core rule set、Known bad inputs、IP reputation など", "方式設計 No.6, 7 / P_ルール", "反映済み", "学習サイト、AWSドキュメント"],
    [4, "レートベースルール", "同一IPからの一定期間のリクエスト数でBlock(FAQの例: 5分間に2,000)", "方式設計 No.8", "反映済み", "AWS WAF FAQ"],
    [5, "Allow / Block / Count", "Countで検証してからBlockへ。マネージドルールもCountに設定可能", "方式設計 No.10", "反映済み", "AWS WAF FAQ"],
    [6, "SQLi・XSS対策", "SQLiはSQL databaseルール、XSSはCore rule setなどで対応", "方式設計 No.7", "反映済み(XSSはCore rule setのCrossSiteScripting_*ルールで対応。確認済み)", "学習サイト"],
    [7, "ログの出力先", "CloudWatch Logs / S3 / Firehose", "方式設計 No.11 / P_ログ", "反映済み(CloudWatch Logsを採用)", "学習サイト"],
    [8, "Shield・Firewall Manager・GuardDuty・Macieとの違い", "WAFはL7、ShieldはDDoS、Firewall Managerは複数アカウントの一元管理", "方式設計 No.18", "反映済み", "学習サイト、試験対策書籍の目次"],
    [9, "マルチアカウント管理", "Firewall Managerを使う場合はAWS Organizationsが前提", "方式設計 No.18", "記載のみ(単一アカウント想定)", "試験対策書籍の設問から"],
    [10, "CloudFront利用時のスコープ", "Global用Web ACLが必要。ルールはエッジロケーションで評価される", "方式設計 No.4, 19", "反映済み", "AWS WAF FAQ"],
    [11, "地理的制限(Geo match)", "国別に許可/遮断", "方式設計 No.20", "未採用(要件次第で検討)", "学習サイト"],
    [12, "Bot対策", "Bot Controlなど(有料オプション)", "方式設計 No.20", "未採用(要件次第で検討)", "AWSドキュメント"],
    [13, "自動化と運用", "IaC(Terraform等)、AWS WAF Security Automations", "方式設計 No.14, 20 / 参考リポジトリ", "一部反映", "学習サイト、GitHub"],
    [14, "コスト", "Web ACL、ルール、リクエスト数で課金。有料のマネージドルールは追加時に自動購読", "方式設計 No.15", "反映済み", "AWSドキュメント"],
    [15, "クォータ・上限", "WCU上限、ALB関連付け数の上限、ボディ検査の上限など", "方式設計 No.15, 16", "WCU上限5,000・1,500超は追加料金・ALBのボディ検査8KB固定は確認済み。ALBへの関連付け数の上限は未確認", "AWS公式ドキュメント(WCU、ボディ検査)"],
    [16, "WAFとNACL/SG/Network Firewallの違い", "WAFはL7(HTTP/HTTPS)、NACLはサブネット単位のステートレス、SGはENI単位のステートフル(許可のみ)、Network FirewallはVPC全体のL3〜L7(IPS・ドメインフィルタ)", "方式設計 No.21 / セキュリティ機能比較", "反映済み", "SCS対策資料(maruchin tech)"],
    [17, "Shield Advancedの特徴", "L7のDDoSをWAFと連携して緩和、WAF料金が含まれる、DRT(24時間365日)、保護対象は明示指定", "方式設計 No.22", "反映済み(本構成は未契約)", "SCS対策資料(maruchin tech)"],
    [18, "WAFのアクションと提供元", "Allow / Block / Count / CAPTCHA / Challenge。マネージドルールはAWSとMarketplaceがある", "方式設計 No.23", "反映済み", "SCS対策資料(maruchin tech)"],
    [19, "WAFに対応するELB", "ALBのみ対応。NLB、GWLBは非対応", "方式設計 No.19", "反映済み", "SCS対策資料(maruchin tech)"],
    [20, "Network Firewallの機能と配置", "ステートレス/ステートフルのルールグループ、Suricata互換IPS、ドメインフィルタ。検査VPCにマルチAZでデプロイし、ルーティング経由で通信を通す", "方式設計 No.24 / セキュリティ機能比較", "反映済み(本構成は採用。02 の設計)", "SCS対策資料(maruchin tech)"],
    [21, "脅威検出系サービスの使い分け", "GuardDuty(脅威検出)、Inspector(脆弱性)、Macie(機密データ)、Security Hub(集約)、Detective(調査)", "方式設計 No.25 / セキュリティサービス一覧", "反映済み", "SCS対策資料(maruchin tech)"],
]))

S.append(dict(name="参考リポジトリ", title="GitHub上の参考リポジトリ(AWS WAF関連)",
              headers=["No.", "リポジトリ", "概要(GitHubの説明に基づく)", "スター数", "最終更新", "用途・注意"],
              widths=[6, 52, 62, 10, 12, 62], rows=[
    [1, "https://github.com/aws-solutions/aws-waf-security-automations", "単一のWeb ACLと一連のルールを自動展開するAWS公式ソリューション", 928, "2026-11-19", "ルール構成の参考。導入する場合はCloudFormation等の展開内容と料金を確認"],
    [2, "https://github.com/amazon-archives/aws-waf-sample", "AWS WAF用のサンプルスクリプトとルール集", 506, "2026-11-19", "『archives』配下のため旧版向けの可能性がある。WAFv2に使えるか要確認"],
    [3, "https://github.com/umotif-public/terraform-aws-waf-webaclv2", "ALB向けのマネージドルール付きWAFv2 Web ACLを構成するTerraformモジュール", 146, "2026-10-25", "Terraform化の参考。モジュールの保守状況とライセンスを確認"],
    [4, "https://github.com/trussworks/terraform-aws-wafv2", "AWS WAFv2とAWSマネージドルールセットを作成するTerraformモジュール", 105, "2026-07-12", "Terraform化の参考。更新が古い場合は最新のproviderでの動作を確認"],
    ["注", "共通の注意", "スター数と日付は2026-11-25時点のGitHub検索結果(スター順の上位)。他にも該当するリポジトリがある可能性がある", None, None, "WAFやCAPTCHAの回避ツール(Solver系)は目的が異なるため掲載していない。利用前にライセンスとコードの確認が必要"],
]))

# ---------------- Excel
thin = Side(style="thin", color="999999")
border = Border(left=thin, right=thin, top=thin, bottom=thin)
hfill = PatternFill("solid", fgColor="1F3864")
tfill = PatternFill("solid", fgColor="D9E2F3")
yfill = PatternFill("solid", fgColor="FFFF99")

wb = Workbook()
wb.remove(wb.active)
for s in S:
    ws = wb.create_sheet(s["name"])
    n = len(s["headers"])
    ws["A1"] = s["title"]
    ws["A1"].font = Font(name=FONT, size=14, bold=True)
    for c in range(1, n + 1):
        ws.cell(1, c).fill = tfill
    for i, h in enumerate(s["headers"], 1):
        c = ws.cell(3, i, h)
        c.font = Font(name=FONT, bold=True, color="FFFFFF", size=10)
        c.fill = hfill
        c.border = border
        c.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
    mono = s.get("mono")
    for r, row in enumerate(s["rows"], 4):
        for i, v in enumerate(row, 1):
            c = ws.cell(r, i, v)
            c.font = Font(name="MS Gothic" if mono else FONT, size=10)
            if not mono:
                c.border = border
            c.alignment = Alignment(vertical="top", wrap_text=not mono,
                                    horizontal="center" if i == 1 and isinstance(v, int) else None)
            if s.get("blank_last") and i == n:
                c.fill = yfill
    for i, w in enumerate(s["widths"], 1):
        ws.column_dimensions[get_column_letter(i)].width = w
    if s.get("total_col"):
        last = 3 + len(s["rows"])
        col = s["total_col"]
        ws.cell(last + 1, col - 1, "合計WCU(概数)").font = Font(name=FONT, size=10, bold=True)
        ws.cell(last + 1, col - 1).alignment = Alignment(horizontal="right")
        c = ws.cell(last + 1, col, f"=SUM({get_column_letter(col)}4:{get_column_letter(col)}{last})")
        c.font = Font(name=FONT, size=10, bold=True)
        c.number_format = "#,##0"
        c.border = border
        ws.cell(last + 2, 1, s["footer"]).font = Font(name=FONT, size=9, italic=True)
    if not mono:
        ws.freeze_panes = "A4"
    ws.sheet_view.showGridLines = False
wb.save(BASE + ".xlsx")

# ---------------- Markdown
def esc(v):
    return str(v).replace("|", "\\|").replace("\n", "<br>")

md = [f"# {TITLE}", "", "> 本書の値はすべてサンプルです。実案件の値に置き換えてください。", ""]
for s in S:
    md += [f"## {s['title']}", ""]
    if s.get("mono"):
        md += ["```"] + [r[0] for r in s["rows"]] + ["```"]
    else:
        md.append("| " + " | ".join(s["headers"]) + " |")
        md.append("|" + "|".join(["---"] * len(s["headers"])) + "|")
        for r in s["rows"]:
            md.append("| " + " | ".join(esc(v) for v in r) + " |")
        if s.get("footer"):
            md += ["", s["footer"]]
    md.append("")
open(BASE + ".md", "w", encoding="utf-8").write("\n".join(md))
print("ok", [s["name"] for s in S])
