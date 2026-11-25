locals {
  prefix = "${var.system}-${var.env}"

  # tier => { AZ短縮名 => サブネットキー }
  subnet_by_tier_az = {
    for tier in ["public", "firewall", "app", "db"] :
    tier => { for k, v in var.subnets : v.az => k if v.tier == tier }
  }
}

# ---------------------------------------------------------------- VPC
resource "aws_vpc" "this" {
  cidr_block           = var.vpc_cidr
  instance_tenancy     = "default"
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = { Name = "${local.prefix}-vpc" }
}

resource "aws_flow_log" "this" {
  vpc_id                   = aws_vpc.this.id
  traffic_type             = "ALL"
  log_destination_type     = "s3"
  log_destination          = var.flow_log_bucket_arn
  max_aggregation_interval = 600

  tags = { Name = "${local.prefix}-flowlog" }
}

# ---------------------------------------------------------------- Subnet
resource "aws_subnet" "this" {
  for_each = var.subnets

  vpc_id                  = aws_vpc.this.id
  cidr_block              = each.value.cidr
  availability_zone       = var.azs[each.value.az]
  map_public_ip_on_launch = false

  tags = { Name = "${local.prefix}-${each.key}" } # 例: shop-prd-pub-1a
}

# ---------------------------------------------------------------- IGW
resource "aws_internet_gateway" "this" {
  vpc_id = aws_vpc.this.id

  tags = { Name = "${local.prefix}-igw" }
}

# ---------------------------------------------------------------- NAT Gateway (AZごと、publicサブネットに配置)
resource "aws_eip" "nat" {
  for_each = local.subnet_by_tier_az["public"]

  domain = "vpc"

  tags = { Name = "${local.prefix}-eip-nat-${each.key}" }

  depends_on = [aws_internet_gateway.this]
}

resource "aws_nat_gateway" "this" {
  for_each = local.subnet_by_tier_az["public"]

  connectivity_type = "public"
  allocation_id     = aws_eip.nat[each.key].id
  subnet_id         = aws_subnet.this[each.value].id

  tags = { Name = "${local.prefix}-nat-${each.key}" }

  depends_on = [aws_internet_gateway.this]
}
