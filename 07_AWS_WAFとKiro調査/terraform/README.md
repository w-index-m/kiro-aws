# AWS ネットワーク基盤 Terraform(サンプル)

`02_AWSネットワーク設計書サンプル`(サンプル A)のパラメータシートと **同じ構成・同じ値**(`shop-prd-*`、VPC `10.20.0.0/16`)を作る Terraform です。
`terraform validate` は成功、ダミーの認証情報での `plan`(オフライン)も通り **80 リソースが作成予定**になることを Terraform 1.9.8 + AWS provider 5.82.2 で確認済みです(本物の AWS では未適用)。

| ファイル | 内容 |
|---|---|
| versions.tf | Terraform/Provider バージョン、default タグ |
| variables.tf / terraform.tfvars | 入力変数 / サンプル値(02 のパラメータシートに対応) |
| vpc.tf | VPC、フローログ、サブネット(public / firewall / app / db)、IGW、NAT GW、EIP |
| nfw.tf | Network Firewall(ルールグループ 2 つ・ポリシー・ファイアウォール・ログ) |
| routing.tf | VGW、IGW / VGW のエッジルートテーブル、AZ ごとのルートテーブル(行き帰りを同じ AZ の Firewall に通す) |
| security.tf | セキュリティグループ(ALB / アプリ / DB) |
| directconnect.tf | DX ゲートウェイ、DXGW 関連付け、Private VIF(2 本) |
| waf.tf | WAF の Web ACL(マネージド 4 + 回数制限)、ログ(CloudWatch Logs)、ALB への関連付け(任意) |
| outputs.tf | 出力値 |

## 使い方

```bash
terraform init
terraform validate
terraform plan  -var-file=terraform.tfvars
terraform apply -var-file=terraform.tfvars
```

## 事前準備・注意

- 先に作っておくもの: VPC フローログ用 S3(`flow_log_bucket_arn`)、Network Firewall のログ用 S3(`nfw_log_bucket_name`)。
- DX 専用接続は事前に開通済みであること。`terraform.tfvars` の `dxcon-xxxxxxxx` を実 ID に置換。
- BGP 認証キーは tfvars に書かず `TF_VAR_bgp_auth_keys` 等で渡す。
- 主系・副系の優先(BGP コミュニティ 7224:7300 / 7100)はオンプレ側ルータの設定で、このコードでは行わない。
- ALB は対象外。作った ALB の ARN を `alb_arn` に渡すと Web ACL を関連付ける。
- WAF のマネージドルールは `waf_managed_rules_count_only = true`(Count)で始め、誤検知を確認してから `false`(Block)にする。
- 02 の設計にネットワーク ACL は無いので作っていない(既定のまま)。
- 「OS 更新の配布元」のドメインは 02 でも未決。`egress_allowed_domains` に追加が必要。
- Network Firewall のログは ALERT・FLOW とも S3 のみ。02 の「ALERT は CloudWatch Logs にも」は、Network Firewall がログの種類ごとに送り先を 1 つしか持てないため、この Terraform では作れない(02 側の要見直し点)。
- 以前の版(サンプル B: `sample-prd-*`、VPC `10.10.0.0/16`、Network Firewall なし、NACL あり)は Git の履歴に残っている。
