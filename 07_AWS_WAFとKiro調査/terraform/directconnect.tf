# 物理のDX専用接続(aws_dx_connection)の申込み・開通は、LOA-CFA取得とキャリア作業を伴うため
# 本コードの対象外とし、既存接続IDを var.dx_vifs[*].connection_id で受け取る。

# ---------------------------------------------------------------- VGW
resource "aws_vpn_gateway" "this" {
  tags = { Name = "${local.prefix}-vgw" }
}

resource "aws_vpn_gateway_attachment" "this" {
  vpc_id         = aws_vpc.this.id
  vpn_gateway_id = aws_vpn_gateway.this.id
}

# ---------------------------------------------------------------- Direct Connect Gateway
resource "aws_dx_gateway" "this" {
  name            = "${local.prefix}-dxgw"
  amazon_side_asn = var.dx_gateway_asn
}

resource "aws_dx_gateway_association" "this" {
  dx_gateway_id         = aws_dx_gateway.this.id
  associated_gateway_id = aws_vpn_gateway.this.id

  allowed_prefixes = length(var.dx_gateway_allowed_prefixes) > 0 ? var.dx_gateway_allowed_prefixes : [var.vpc_cidr]

  depends_on = [aws_vpn_gateway_attachment.this]
}

# ---------------------------------------------------------------- Private VIF
# BFD: AWS側はVIFでBFDに応答する。オンプレ側ルータでBFDを有効化すること。
# Local Pref(接続A優先など)はオンプレ側ルータで設定する。
resource "aws_dx_private_virtual_interface" "this" {
  for_each = var.dx_vifs

  name             = "${local.prefix}-vif-${each.key}"
  connection_id    = each.value.connection_id
  dx_gateway_id    = aws_dx_gateway.this.id
  vlan             = each.value.vlan
  address_family   = "ipv4"
  bgp_asn          = each.value.customer_asn
  amazon_address   = each.value.amazon_address
  customer_address = each.value.customer_address
  bgp_auth_key     = lookup(var.bgp_auth_keys, each.key, null)
  mtu              = each.value.mtu

  tags = { Name = "${local.prefix}-vif-${each.key}" }
}
