# 物理のDX専用接続(aws_dx_connection)の申込み・開通は、LOA-CFA取得とキャリア作業を伴うため
# 本コードの対象外とし、既存接続IDを var.dx_vifs[*].connection_id で受け取る。
# VGW は routing.tf で作成・アタッチ。

# ---------------------------------------------------------------- Direct Connect Gateway
resource "aws_dx_gateway" "this" {
  name            = "shop-dxgw"
  amazon_side_asn = var.dx_gateway_asn
}

resource "aws_dx_gateway_association" "this" {
  dx_gateway_id         = aws_dx_gateway.this.id
  associated_gateway_id = aws_vpn_gateway.this.id

  allowed_prefixes = length(var.dx_gateway_allowed_prefixes) > 0 ? var.dx_gateway_allowed_prefixes : [var.vpc_cidr]

  depends_on = [aws_vpn_gateway_attachment.this]
}

# ---------------------------------------------------------------- Private VIF(接続 a=主系、b=副系)
# AWS → オンプレの向きの優先は、オンプレから広告する BGP コミュニティで決める(主系 7224:7300 / 副系 7224:7100)。
# これはオンプレ側ルータの設定で、本コードでは行わない。
resource "aws_dx_private_virtual_interface" "this" {
  for_each = var.dx_vifs

  name             = "shop-vif-${each.key}"
  connection_id    = each.value.connection_id
  dx_gateway_id    = aws_dx_gateway.this.id
  vlan             = each.value.vlan
  address_family   = "ipv4"
  bgp_asn          = each.value.customer_asn
  amazon_address   = each.value.amazon_address
  customer_address = each.value.customer_address
  bgp_auth_key     = lookup(var.bgp_auth_keys, each.key, null)
  mtu              = each.value.mtu

  tags = { Name = "shop-vif-${each.key}" }
}
