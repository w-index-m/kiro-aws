# 方式設計書・パラメータシート(サンプル)と同一の値。実案件の値に置き換えること。
region      = "ap-northeast-1"
system      = "sample"
env         = "prd"
owner       = "network-team"   # 要置換
cost_center = "CC0000"         # 要置換

vpc_cidr    = "10.10.0.0/16"
onprem_cidr = "192.168.0.0/16"

azs = {
  "1a" = "ap-northeast-1a"
  "1c" = "ap-northeast-1c"
}

subnets = {
  "public-1a" = { tier = "public", az = "1a", cidr = "10.10.0.0/24" }
  "public-1c" = { tier = "public", az = "1c", cidr = "10.10.1.0/24" }
  "app-1a"    = { tier = "app", az = "1a", cidr = "10.10.10.0/24" }
  "app-1c"    = { tier = "app", az = "1c", cidr = "10.10.11.0/24" }
  "db-1a"     = { tier = "db", az = "1a", cidr = "10.10.20.0/24" }
  "db-1c"     = { tier = "db", az = "1c", cidr = "10.10.21.0/24" }
}

flow_log_bucket_arn = "arn:aws:s3:::sample-prd-flowlog-bucket"

dx_gateway_asn = 64512

dx_vifs = {
  "a" = {
    connection_id    = "dxcon-xxxxxxxx" # 要置換: ロケーションAの既存接続
    vlan             = 100
    customer_asn     = 65001
    amazon_address   = "169.254.100.1/30"
    customer_address = "169.254.100.2/30"
    mtu              = 1500
  }
  "b" = {
    connection_id    = "dxcon-yyyyyyyy" # 要置換: ロケーションBの既存接続
    vlan             = 101
    customer_asn     = 65001
    amazon_address   = "169.254.101.1/30"
    customer_address = "169.254.101.2/30"
    mtu              = 1500
  }
}

# BGP認証キーはここに書かない。環境変数で渡す例:
#   export TF_VAR_bgp_auth_keys='{"a":"<key-a>","b":"<key-b>"}'
