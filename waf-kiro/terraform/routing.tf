# ---------------------------------------------------------------- Route Table
# Public: 1枚(0.0.0.0/0 -> IGW)
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.this.id

  tags = { Name = "${local.prefix}-rtb-public" }
}

resource "aws_route" "public_default" {
  route_table_id         = aws_route_table.public.id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = aws_internet_gateway.this.id
}

# Private-App: AZごと(0.0.0.0/0 -> 同一AZのNATGW)
resource "aws_route_table" "app" {
  for_each = local.app_azs

  vpc_id = aws_vpc.this.id

  tags = { Name = "${local.prefix}-rtb-app-${each.key}" }
}

resource "aws_route" "app_default" {
  for_each = local.app_azs

  route_table_id         = aws_route_table.app[each.key].id
  destination_cidr_block = "0.0.0.0/0"
  nat_gateway_id         = aws_nat_gateway.this[each.key].id
}

# Private-DB: 1枚(インターネット向け経路なし)
resource "aws_route_table" "db" {
  vpc_id = aws_vpc.this.id

  tags = { Name = "${local.prefix}-rtb-db" }
}

# サブネット関連付け
resource "aws_route_table_association" "this" {
  for_each = var.subnets

  subnet_id = aws_subnet.this[each.key].id
  route_table_id = (
    each.value.tier == "public" ? aws_route_table.public.id :
    each.value.tier == "app" ? aws_route_table.app[each.value.az].id :
    aws_route_table.db.id
  )
}

# ---------------------------------------------------------------- VGW 経路伝播(オンプレ向け)
locals {
  route_table_ids = merge(
    {
      public = aws_route_table.public.id
      db     = aws_route_table.db.id
    },
    { for az, rt in aws_route_table.app : "app-${az}" => rt.id }
  )
}

resource "aws_vpn_gateway_route_propagation" "this" {
  for_each = local.route_table_ids

  vpn_gateway_id = aws_vpn_gateway.this.id
  route_table_id = each.value
}
