# AWSネットワーク基盤 方式設計書・パラメータシート(サンプル)

> 本書の値はすべてサンプルです。実案件の値に置き換えてください。

## 改版履歴・文書情報

| 項目 | 内容 |
|---|---|
| 文書名 | AWSネットワーク基盤 方式設計書 |
| システム名 | サンプルシステム(オンプレ連携型 AWS基盤) |
| 版数 | 1.0 |
| 作成日 | 2026-11-20 |
| 作成者 | (サンプル)Kiro 生成 |
| 対象範囲 | VPC / サブネット / ルートテーブル / Internet Gateway / NAT Gateway / Direct Connect |
| 注記 | 本書の値はすべてサンプルです。CIDR・ASN・VLAN・接続先ロケーション等は実案件の値に置き換えてください。 |

## 方式設計

| No. | 区分 | 項目 | 設計方針 | 設計内容 | 根拠・備考 |
|---|---|---|---|---|---|
| 1 | 全体 | リージョン/AZ | 東京リージョンの2AZで冗長化 | ap-northeast-1 / AZ: 1a, 1c の2AZ構成。全レイヤ(Public/Private)をAZ対称に配置する。 | 単一AZ障害時もサービス継続するため |
| 2 | 全体 | IPアドレス設計 | オンプレ・他VPCと重複しない私設CIDRを使用 | VPC CIDR 10.10.0.0/16。オンプレミス 192.168.0.0/16 と非重複。将来のVPC追加用に 10.20.0.0/16 以降を予約。 | Direct Connect経由のルーティングで重複を避ける |
| 3 | VPC | VPC構成 | 1VPC・3階層サブネット | DNSサポート/DNSホスト名を有効化。テナンシーはdefault。IPv6は使用しない。 | Route 53 Resolver等の利用を想定 |
| 4 | VPC | サブネット設計 | 用途×AZでサブネットを分離 | Public(/24×2)、Private-App(/24×2)、Private-DB(/24×2)の計6サブネット。各サブネットは/24(利用可能251IP)。 | AWS予約の先頭4IP・末尾1IPを除く |
| 5 | ルーティング | ルートテーブル | 階層ごと・NATはAZごとにルートテーブルを分離 | Public用1枚、Private-App用AZ別2枚、Private-DB用1枚。VGWからの経路伝播を有効化。 | AZ障害時にクロスAZ経由のNAT依存を避ける |
| 6 | インターネット接続 | Internet Gateway | Publicサブネットのみ直接インターネット接続 | VPCに1つのIGWをアタッチ。Publicルートテーブルの 0.0.0.0/0 をIGWに向ける。 | IGWはリージョンで冗長化されるマネージドサービス |
| 7 | インターネット接続 | NAT Gateway | Privateからの外向き通信はAZ別NATGWで実施 | 各AZのPublicサブネットにPublic NATGWを1つずつ配置(計2)。Elastic IPを各1個割当。Private-App RTの 0.0.0.0/0 を同一AZのNATGWへ。 | NATGWはAZ内冗長のため、AZごとに配置して可用性を確保 |
| 8 | インターネット接続 | DBサブネットの外部通信 | Private-DBはインターネットへ出さない | Private-DB RTに 0.0.0.0/0 は設定しない。オンプレ向け経路(VGW)のみ。 | データ層の最小通信原則 |
| 9 | 専用線接続 | Direct Connect接続 | 異なるロケーションで2本の専用接続 | 専用接続(Dedicated) 1Gbps ×2本を異なるDXロケーションに配置し、Active/Activeで運用。LAGは使用しない。 | ロケーション障害・機器障害への耐性 |
| 10 | 専用線接続 | 仮想インターフェイス | Private VIFでVPCと接続 | 各接続にPrivate VIFを1つずつ作成(VLAN 100/101)。BGPで経路交換。BGP認証(MD5)とBFDを有効化。 | BFDで高速な障害検知 |
| 11 | 専用線接続 | Direct Connect Gateway / VGW | DXGW経由でVGWに接続 | Direct Connect Gateway(Amazon側ASN 64512)を作成し、VPCにアタッチしたVGWと関連付ける。 | 将来のVPC追加・リージョン追加に拡張しやすい |
| 12 | 専用線接続 | 経路制御 | オンプレ→AWSは固定プレフィックス広告 | オンプレからは 192.168.0.0/16 をBGP広告。AWSからはVPC CIDR 10.10.0.0/16 を広告。優先経路はLocal Prefで制御(接続A優先)。 | Active/Standby相当の運用に切替可能 |
| 13 | セキュリティ | ネットワークACL | サブネット境界のステートレスフィルタ | Public/Private-App/Private-DBで別NACLを作成。必要最小限のポートのみ許可し、それ以外はDeny。 | SGとの二重防御 |
| 14 | セキュリティ | セキュリティグループ | SG参照による最小権限 | 階層間はSG参照で許可(ALB→App→DB)。オンプレからの管理通信は 192.168.0.0/16 のみ許可。 | IP直指定を最小化し変更に強くする |
| 15 | 運用 | ログ/監視 | VPCフローログとCloudWatchで可視化 | VPCフローログをS3へ出力(全トラフィック、集計間隔10分)。DX接続状態・BGPセッション・NATGWのErrorPortAllocationをCloudWatchアラーム化。 | 障害の早期検知と調査証跡の確保 |
| 16 | 運用 | タグ/命名規則 | 全リソースに統一タグ・命名規則を適用 | 命名: {system}-{env}-{resource}-{az/用途}。必須タグ: Name, System, Env, Owner, CostCenter。 | コスト配賦・棚卸しの容易化 |

## 論理構成図(テキスト)

```
[On-premises DC 192.168.0.0/16]  Router x2 (BGP ASN 65001)
        |                         |
  DX Connection A (1Gbps)   DX Connection B (1Gbps)
  [DX Location A]           [DX Location B]
        | Private VIF VLAN100     | Private VIF VLAN101
        +-----------+-------------+
                    |
        [Direct Connect Gateway  (Amazon ASN 64512)]
                    |
              [Virtual Private Gateway]
                    |
+------------------- VPC 10.10.0.0/16 (ap-northeast-1) -----------------------+
|  AZ-a (1a)                              AZ-c (1c)                           |
|  Public     10.10.0.0/24  [NATGW-a]     Public     10.10.1.0/24  [NATGW-c]  |
|  Private-App 10.10.10.0/24              Private-App 10.10.11.0/24           |
|  Private-DB  10.10.20.0/24              Private-DB  10.10.21.0/24           |
+-----------------------------------[IGW]------------------------------------+
                                       |
                                   Internet
```

## パラメータシート:VPC

| No. | リソース | パラメータ名 | 設定値 | 備考 |
|---|---|---|---|---|
| 1 | VPC | Name タグ | sample-prd-vpc |  |
| 2 | VPC | IPv4 CIDR | 10.10.0.0/16 | オンプレ 192.168.0.0/16 と非重複 |
| 3 | VPC | IPv6 CIDR | なし |  |
| 4 | VPC | テナンシー | default |  |
| 5 | VPC | DNS解決を有効化 | 有効 | enableDnsSupport |
| 6 | VPC | DNSホスト名を有効化 | 有効 | enableDnsHostnames |
| 7 | VPC | フローログ送信先 | S3 (sample-prd-flowlog-bucket) | 全トラフィック / 10分集計 |

## パラメータシート:サブネット

| No. | Name | 用途 | AZ | IPv4 CIDR | パブリックIP自動割当 | ルートテーブル | NACL |
|---|---|---|---|---|---|---|---|
| 1 | sample-prd-sub-public-1a | Public | ap-northeast-1a | 10.10.0.0/24 | 無効 | sample-prd-rtb-public | sample-prd-nacl-public |
| 2 | sample-prd-sub-public-1c | Public | ap-northeast-1c | 10.10.1.0/24 | 無効 | sample-prd-rtb-public | sample-prd-nacl-public |
| 3 | sample-prd-sub-app-1a | Private-App | ap-northeast-1a | 10.10.10.0/24 | 無効 | sample-prd-rtb-app-1a | sample-prd-nacl-app |
| 4 | sample-prd-sub-app-1c | Private-App | ap-northeast-1c | 10.10.11.0/24 | 無効 | sample-prd-rtb-app-1c | sample-prd-nacl-app |
| 5 | sample-prd-sub-db-1a | Private-DB | ap-northeast-1a | 10.10.20.0/24 | 無効 | sample-prd-rtb-db | sample-prd-nacl-db |
| 6 | sample-prd-sub-db-1c | Private-DB | ap-northeast-1c | 10.10.21.0/24 | 無効 | sample-prd-rtb-db | sample-prd-nacl-db |

## パラメータシート:ルートテーブル

| No. | ルートテーブル名 | 宛先 | ターゲット | 種別 | 備考 |
|---|---|---|---|---|---|
| 1 | sample-prd-rtb-public | 10.10.0.0/16 | local | 静的 |  |
| 2 | sample-prd-rtb-public | 0.0.0.0/0 | sample-prd-igw | 静的 | インターネット向け |
| 3 | sample-prd-rtb-public | 192.168.0.0/16 | sample-prd-vgw | 伝播 | オンプレ向け(経路伝播) |
| 4 | sample-prd-rtb-app-1a | 10.10.0.0/16 | local | 静的 |  |
| 5 | sample-prd-rtb-app-1a | 0.0.0.0/0 | sample-prd-natgw-1a | 静的 | 同一AZのNATGW |
| 6 | sample-prd-rtb-app-1a | 192.168.0.0/16 | sample-prd-vgw | 伝播 |  |
| 7 | sample-prd-rtb-app-1c | 10.10.0.0/16 | local | 静的 |  |
| 8 | sample-prd-rtb-app-1c | 0.0.0.0/0 | sample-prd-natgw-1c | 静的 | 同一AZのNATGW |
| 9 | sample-prd-rtb-app-1c | 192.168.0.0/16 | sample-prd-vgw | 伝播 |  |
| 10 | sample-prd-rtb-db | 10.10.0.0/16 | local | 静的 |  |
| 11 | sample-prd-rtb-db | 192.168.0.0/16 | sample-prd-vgw | 伝播 | インターネット向け経路なし |

## パラメータシート:IGW / NAT Gateway / EIP

| No. | リソース | Name | パラメータ名 | 設定値 | 備考 |
|---|---|---|---|---|---|
| 1 | Internet Gateway | sample-prd-igw | アタッチ先VPC | sample-prd-vpc |  |
| 2 | Elastic IP | sample-prd-eip-natgw-1a | ネットワーク境界グループ | ap-northeast-1 | NATGW-1a用 |
| 3 | Elastic IP | sample-prd-eip-natgw-1c | ネットワーク境界グループ | ap-northeast-1 | NATGW-1c用 |
| 4 | NAT Gateway | sample-prd-natgw-1a | 接続タイプ | パブリック |  |
| 5 | NAT Gateway | sample-prd-natgw-1a | 配置サブネット | sample-prd-sub-public-1a |  |
| 6 | NAT Gateway | sample-prd-natgw-1a | Elastic IP | sample-prd-eip-natgw-1a |  |
| 7 | NAT Gateway | sample-prd-natgw-1c | 接続タイプ | パブリック |  |
| 8 | NAT Gateway | sample-prd-natgw-1c | 配置サブネット | sample-prd-sub-public-1c |  |
| 9 | NAT Gateway | sample-prd-natgw-1c | Elastic IP | sample-prd-eip-natgw-1c |  |

## パラメータシート:Direct Connect

| No. | リソース | Name | パラメータ名 | 設定値 | 備考 |
|---|---|---|---|---|---|
| 1 | DX Connection | sample-prd-dxcon-a | ロケーション | (例)東京 Location A | 実ロケーションに置換 |
| 2 | DX Connection | sample-prd-dxcon-a | 帯域 | 1Gbps | 専用接続 |
| 3 | DX Connection | sample-prd-dxcon-a | ポート速度/光種別 | 1000BASE-LX |  |
| 4 | DX Connection | sample-prd-dxcon-b | ロケーション | (例)東京 Location B | 接続Aと別ロケーション |
| 5 | DX Connection | sample-prd-dxcon-b | 帯域 | 1Gbps | 専用接続 |
| 6 | DX Connection | sample-prd-dxcon-b | ポート速度/光種別 | 1000BASE-LX |  |
| 7 | Direct Connect Gateway | sample-prd-dxgw | Amazon側ASN | 64512 | プライベートASN |
| 8 | Virtual Private Gateway | sample-prd-vgw | アタッチ先VPC | sample-prd-vpc |  |
| 9 | Virtual Private Gateway | sample-prd-vgw | DXGW関連付け | sample-prd-dxgw | 許可プレフィックス: 10.10.0.0/16 |
| 10 | Private VIF | sample-prd-vif-a | 対象接続 | sample-prd-dxcon-a |  |
| 11 | Private VIF | sample-prd-vif-a | VLAN ID | 100 |  |
| 12 | Private VIF | sample-prd-vif-a | お客様側BGP ASN | 65001 |  |
| 13 | Private VIF | sample-prd-vif-a | Amazon側/お客様側ピアIP | 169.254.100.1/30 / 169.254.100.2/30 | サンプル値(リンクローカル) |
| 14 | Private VIF | sample-prd-vif-a | BGP認証キー(MD5) | (別途パスワード管理) | 文書には記載しない |
| 15 | Private VIF | sample-prd-vif-a | BFD | 有効 |  |
| 16 | Private VIF | sample-prd-vif-a | MTU | 1500 | Jumbo(8500)は将来検討 |
| 17 | Private VIF | sample-prd-vif-a | Local Pref | 200 (優先) | オンプレ側ルータで設定 |
| 18 | Private VIF | sample-prd-vif-b | 対象接続 | sample-prd-dxcon-b |  |
| 19 | Private VIF | sample-prd-vif-b | VLAN ID | 101 |  |
| 20 | Private VIF | sample-prd-vif-b | お客様側BGP ASN | 65001 |  |
| 21 | Private VIF | sample-prd-vif-b | Amazon側/お客様側ピアIP | 169.254.101.1/30 / 169.254.101.2/30 | サンプル値(リンクローカル) |
| 22 | Private VIF | sample-prd-vif-b | BGP認証キー(MD5) | (別途パスワード管理) | 文書には記載しない |
| 23 | Private VIF | sample-prd-vif-b | BFD | 有効 |  |
| 24 | Private VIF | sample-prd-vif-b | MTU | 1500 |  |
| 25 | Private VIF | sample-prd-vif-b | Local Pref | 100 | オンプレ側ルータで設定 |
| 26 | BGP広告 | オンプレ→AWS | 広告プレフィックス | 192.168.0.0/16 |  |
| 27 | BGP広告 | AWS→オンプレ | 広告プレフィックス | 10.10.0.0/16 | DXGW許可プレフィックスに従う |

## パラメータシート:NACL / セキュリティグループ

| No. | リソース | Name | 方向 | プロトコル/ポート | ソース/宛先 | 許可/拒否 | 備考 |
|---|---|---|---|---|---|---|---|
| 1 | NACL | sample-prd-nacl-public | In | TCP 80,443 | 0.0.0.0/0 | 許可 | ALB向け |
| 2 | NACL | sample-prd-nacl-public | In | TCP 1024-65535 | 0.0.0.0/0 | 許可 | 戻り通信 |
| 3 | NACL | sample-prd-nacl-public | Out | 全て | 0.0.0.0/0 | 許可 |  |
| 4 | NACL | sample-prd-nacl-app | In | TCP 8080 | 10.10.0.0/16 | 許可 | ALB→App |
| 5 | NACL | sample-prd-nacl-app | In | TCP 22 | 192.168.0.0/16 | 許可 | オンプレからの管理 |
| 6 | NACL | sample-prd-nacl-app | In | TCP 1024-65535 | 0.0.0.0/0 | 許可 | 戻り通信 |
| 7 | NACL | sample-prd-nacl-db | In | TCP 3306 | 10.10.10.0/23 | 許可 | App→DB |
| 8 | NACL | sample-prd-nacl-db | In | TCP 3306 | 192.168.0.0/16 | 許可 | オンプレからのDB接続 |
| 9 | NACL | sample-prd-nacl-db | Out | TCP 1024-65535 | 10.10.0.0/16 | 許可 | 戻り通信 |
| 10 | SG | sample-prd-sg-alb | In | TCP 443 | 0.0.0.0/0 | 許可 |  |
| 11 | SG | sample-prd-sg-app | In | TCP 8080 | sample-prd-sg-alb | 許可 | SG参照 |
| 12 | SG | sample-prd-sg-app | In | TCP 22 | 192.168.0.0/16 | 許可 | 管理用 |
| 13 | SG | sample-prd-sg-db | In | TCP 3306 | sample-prd-sg-app | 許可 | SG参照 |

## パラメータシート:タグ・命名規則

| No. | 項目 | ルール/値 | 備考 |
|---|---|---|---|
| 1 | 命名規則 | {system}-{env}-{resource}-{az/用途} | 例: sample-prd-natgw-1a |
| 2 | Name | 上記命名規則に従う | 全リソース必須 |
| 3 | System | sample |  |
| 4 | Env | prd | prd / stg / dev |
| 5 | Owner | (担当部署) | 要置換 |
| 6 | CostCenter | (コストセンタコード) | 要置換 |
