# 02 のルートテーブル設計: インターネット・オンプレの出入りを両方 Network Firewall に通し、
# 行きと帰りが同じ AZ の Firewall を通るようにする。

# ---------------------------------------------------------------- VGW(DX)
resource "aws_vpn_gateway" "this" {
  tags = { Name = "${local.prefix}-vgw" }
}

resource "aws_vpn_gateway_attachment" "this" {
  vpc_id         = aws_vpc.this.id
  vpn_gateway_id = aws_vpn_gateway.this.id
}

# ---------------------------------------------------------------- IGW エッジ: 入ってくる通信を Firewall へ
resource "aws_route_table" "igw_edge" {
  vpc_id = aws_vpc.this.id
  tags   = { Name = "${local.prefix}-rt-igw-edge" }
}

resource "aws_route" "igw_edge" {
  for_each = { for k, v in var.subnets : k => v if v.tier == "public" }

  route_table_id         = aws_route_table.igw_edge.id
  destination_cidr_block = each.value.cidr
  vpc_endpoint_id        = local.nfw_endpoint[each.value.az]
}

resource "aws_route_table_association" "igw_edge" {
  gateway_id     = aws_internet_gateway.this.id
  route_table_id = aws_route_table.igw_edge.id
}

# ---------------------------------------------------------------- VGW エッジ: オンプレから来る通信を Firewall へ
resource "aws_route_table" "vgw_edge" {
  vpc_id = aws_vpc.this.id
  tags   = { Name = "${local.prefix}-rt-vgw-edge" }
}

resource "aws_route" "vgw_edge" {
  for_each = { for k, v in var.subnets : k => v if v.tier != "firewall" }

  route_table_id         = aws_route_table.vgw_edge.id
  destination_cidr_block = each.value.cidr
  vpc_endpoint_id        = local.nfw_endpoint[each.value.az]
}

resource "aws_route_table_association" "vgw_edge" {
  gateway_id     = aws_vpn_gateway.this.id
  route_table_id = aws_route_table.vgw_edge.id

  depends_on = [aws_vpn_gateway_attachment.this]
}

# ---------------------------------------------------------------- public(AZごと): 0.0.0.0/0 -> 同じ AZ の Firewall
resource "aws_route_table" "public" {
  for_each = local.subnet_by_tier_az["public"]

  vpc_id = aws_vpc.this.id
  tags   = { Name = "${local.prefix}-rt-pub-${each.key}" }
}

resource "aws_route" "public_default" {
  for_each = local.subnet_by_tier_az["public"]

  route_table_id         = aws_route_table.public[each.key].id
  destination_cidr_block = "0.0.0.0/0"
  vpc_endpoint_id        = local.nfw_endpoint[each.key]
}

resource "aws_route_table_association" "public" {
  for_each = local.subnet_by_tier_az["public"]

  subnet_id      = aws_subnet.this[each.value].id
  route_table_id = aws_route_table.public[each.key].id
}

# ---------------------------------------------------------------- firewall(AZごと): 外 -> IGW、オンプレ -> VGW
resource "aws_route_table" "firewall" {
  for_each = local.subnet_by_tier_az["firewall"]

  vpc_id = aws_vpc.this.id
  tags   = { Name = "${local.prefix}-rt-fw-${each.key}" }
}

resource "aws_route" "firewall_internet" {
  for_each = local.subnet_by_tier_az["firewall"]

  route_table_id         = aws_route_table.firewall[each.key].id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = aws_internet_gateway.this.id
}

resource "aws_route" "firewall_onprem" {
  for_each = local.subnet_by_tier_az["firewall"]

  route_table_id         = aws_route_table.firewall[each.key].id
  destination_cidr_block = var.onprem_cidr
  gateway_id             = aws_vpn_gateway.this.id

  depends_on = [aws_vpn_gateway_attachment.this]
}

resource "aws_route_table_association" "firewall" {
  for_each = local.subnet_by_tier_az["firewall"]

  subnet_id      = aws_subnet.this[each.value].id
  route_table_id = aws_route_table.firewall[each.key].id
}

# ---------------------------------------------------------------- app(AZごと): 外 -> 同じ AZ の NAT、オンプレ -> 同じ AZ の Firewall
resource "aws_route_table" "app" {
  for_each = local.subnet_by_tier_az["app"]

  vpc_id = aws_vpc.this.id
  tags   = { Name = "${local.prefix}-rt-app-${each.key}" }
}

resource "aws_route" "app_internet" {
  for_each = local.subnet_by_tier_az["app"]

  route_table_id         = aws_route_table.app[each.key].id
  destination_cidr_block = "0.0.0.0/0"
  nat_gateway_id         = aws_nat_gateway.this[each.key].id
}

resource "aws_route" "app_onprem" {
  for_each = local.subnet_by_tier_az["app"]

  route_table_id         = aws_route_table.app[each.key].id
  destination_cidr_block = var.onprem_cidr
  vpc_endpoint_id        = local.nfw_endpoint[each.key]
}

resource "aws_route_table_association" "app" {
  for_each = local.subnet_by_tier_az["app"]

  subnet_id      = aws_subnet.this[each.value].id
  route_table_id = aws_route_table.app[each.key].id
}

# ---------------------------------------------------------------- db(AZごと): オンプレ -> 同じ AZ の Firewall(インターネット向け経路なし)
resource "aws_route_table" "db" {
  for_each = local.subnet_by_tier_az["db"]

  vpc_id = aws_vpc.this.id
  tags   = { Name = "${local.prefix}-rt-db-${each.key}" }
}

resource "aws_route" "db_onprem" {
  for_each = local.subnet_by_tier_az["db"]

  route_table_id         = aws_route_table.db[each.key].id
  destination_cidr_block = var.onprem_cidr
  vpc_endpoint_id        = local.nfw_endpoint[each.key]
}

resource "aws_route_table_association" "db" {
  for_each = local.subnet_by_tier_az["db"]

  subnet_id      = aws_subnet.this[each.value].id
  route_table_id = aws_route_table.db[each.key].id
}
