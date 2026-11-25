# AWSネットワーク基盤 Terraform(サンプル)

方式設計書・パラメータシート(サンプル)と同じ構成を作成します。1ディレクトリ構成です。

| ファイル | 内容 |
|---|---|
| versions.tf | Terraform/Providerバージョン、defaultタグ |
| variables.tf / terraform.tfvars | 入力変数 / サンプル値(パラメータシートに対応) |
| vpc.tf | VPC、フローログ、サブネット、IGW、NATGW、EIP |
| routing.tf | ルートテーブル、関連付け、VGW経路伝播 |
| security.tf | NACL、セキュリティグループ |
| directconnect.tf | VGW、DXGW、DXGW関連付け、Private VIF |
| outputs.tf | 出力値 |

## 使い方
```bash
terraform init
terraform validate
terraform plan  -var-file=terraform.tfvars
terraform apply -var-file=terraform.tfvars
```

## 事前準備・注意
- `flow_log_bucket_arn` のS3バケットは事前に作成しておく(バケットポリシーでログ配信を許可)。
- DX専用接続は事前に開通済みであること。`terraform.tfvars` の `dxcon-xxxxxxxx` を実IDに置換。
- BGP認証キーは tfvars に書かず `TF_VAR_bgp_auth_keys` 等で渡す。
- BFD有効化とLocal Pref(接続A優先)はオンプレ側ルータの設定。
- NACL(db)のApp層送信元は `cidrsubnet(var.vpc_cidr, 7, 5)`(vpc_cidr=10.10.0.0/16 のとき 10.10.10.0/23)で算出している。CIDRを変更する場合は見直すこと。
- サンプル値(CIDR/ASN/VLAN/タグ)は実案件の値に置換すること。
