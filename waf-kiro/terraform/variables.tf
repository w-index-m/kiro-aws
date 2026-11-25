variable "region" {
  description = "デプロイ先リージョン"
  type        = string
  default     = "ap-northeast-1"
}

variable "system" {
  description = "システム名(命名規則・Systemタグ)"
  type        = string
}

variable "env" {
  description = "環境名 prd / stg / dev(命名規則・Envタグ)"
  type        = string
}

variable "owner" {
  description = "Ownerタグ"
  type        = string
}

variable "cost_center" {
  description = "CostCenterタグ"
  type        = string
}

variable "vpc_cidr" {
  description = "VPCのIPv4 CIDR"
  type        = string
}

variable "onprem_cidr" {
  description = "オンプレミスのCIDR(VGW経由で到達)"
  type        = string
}

variable "azs" {
  description = "AZ識別子(短縮名) => AZ名"
  type        = map(string)
}

variable "subnets" {
  description = "サブネット定義。キーは {tier}-{az短縮名}、tier は public / app / db"
  type = map(object({
    tier = string
    az   = string # var.azs のキー
    cidr = string
  }))

  validation {
    condition     = alltrue([for s in values(var.subnets) : contains(["public", "app", "db"], s.tier)])
    error_message = "subnets の tier は public / app / db のいずれかを指定してください。"
  }
}

variable "flow_log_bucket_arn" {
  description = "VPCフローログ出力先S3バケットのARN(既存バケット)"
  type        = string
}

variable "dx_gateway_asn" {
  description = "Direct Connect GatewayのAmazon側ASN"
  type        = number
  default     = 64512
}

variable "dx_gateway_allowed_prefixes" {
  description = "DXGWからオンプレへ広告するプレフィックス。空の場合は vpc_cidr"
  type        = list(string)
  default     = []
}

variable "dx_vifs" {
  description = "Private VIF定義(既存のDX専用接続IDを指定。物理接続の開通は本コードの対象外)"
  type = map(object({
    connection_id    = string
    vlan             = number
    customer_asn     = number
    amazon_address   = string # 例: 169.254.100.1/30
    customer_address = string # 例: 169.254.100.2/30
    mtu              = number
  }))
}

variable "bgp_auth_keys" {
  description = "VIF名 => BGP認証キー(MD5)。未指定のVIFはAWS側で自動生成。tfvarsに書かず環境変数/シークレットから渡すこと"
  type        = map(string)
  default     = {}
  sensitive   = true
}
