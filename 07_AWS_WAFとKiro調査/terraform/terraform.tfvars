# 02_AWSネットワーク設計書サンプルのパラメータシート(shop-prd-*)と同一の値。実案件の値に置き換えること。
region      = "ap-northeast-1"
system      = "shop"
env         = "prd"
owner       = "network-team" # 要置換
cost_center = "CC0000"       # 要置換

vpc_cidr    = "10.20.0.0/16"
onprem_cidr = "192.168.0.0/16"
ops_cidr    = "192.168.100.0/24"

azs = {
  "1a" = "ap-northeast-1a"
  "1c" = "ap-northeast-1c"
}

subnets = {
  "pub-1a" = { tier = "public", az = "1a", cidr = "10.20.0.0/24" }
  "pub-1c" = { tier = "public", az = "1c", cidr = "10.20.1.0/24" }
  "fw-1a"  = { tier = "firewall", az = "1a", cidr = "10.20.10.0/28" }
  "fw-1c"  = { tier = "firewall", az = "1c", cidr = "10.20.10.16/28" }
  "app-1a" = { tier = "app", az = "1a", cidr = "10.20.20.0/24" }
  "app-1c" = { tier = "app", az = "1c", cidr = "10.20.21.0/24" }
  "db-1a"  = { tier = "db", az = "1a", cidr = "10.20.30.0/24" }
  "db-1c"  = { tier = "db", az = "1c", cidr = "10.20.31.0/24" }
}

flow_log_bucket_arn      = "arn:aws:s3:::shop-prd-flowlog-bucket"       # 要置換
nfw_log_bucket_name      = "shop-prd-nfw-logs"                          # 要置換
nfw_alert_log_group_name = "/aws/network-firewall/shop-prd-nfw/alert"   # 要置換

dx_gateway_asn = 64512

dx_vifs = {
  "a" = {
    connection_id    = "dxcon-xxxxxxxx" # 要置換: DX ロケーション A(東京)の既存接続 shop-dxcon-a
    vlan             = 101
    customer_asn     = 65010
    amazon_address   = "169.254.10.1/30"
    customer_address = "169.254.10.2/30"
    mtu              = 1500
  }
  "b" = {
    connection_id    = "dxcon-yyyyyyyy" # 要置換: DX ロケーション B(大阪)の既存接続 shop-dxcon-b
    vlan             = 102
    customer_asn     = 65010
    amazon_address   = "169.254.20.1/30"
    customer_address = "169.254.20.2/30"
    mtu              = 1500
  }
}

# BGP認証キーはここに書かない。環境変数で渡す例:
#   export TF_VAR_bgp_auth_keys='{"a":"<key-a>","b":"<key-b>"}'
