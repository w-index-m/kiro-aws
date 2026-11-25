locals {
  prefix = "${var.system}-${var.env}"

  public_subnets = { for k, v in var.subnets : k => v if v.tier == "public" }

  # AZ短縮名 => そのAZのPublicサブネットキー(NATGW配置用)
  nat_az_to_subnet = { for k, v in local.public_subnets : v.az => k }

  app_azs = toset([for v in var.subnets : v.az if v.tier == "app"])
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

  tags = { Name = "${local.prefix}-sub-${each.key}" }
}

# ---------------------------------------------------------------- IGW
resource "aws_internet_gateway" "this" {
  vpc_id = aws_vpc.this.id

  tags = { Name = "${local.prefix}-igw" }
}

# ---------------------------------------------------------------- NAT Gateway (AZごと)
resource "aws_eip" "natgw" {
  for_each = local.nat_az_to_subnet

  domain = "vpc"

  tags = { Name = "${local.prefix}-eip-natgw-${each.key}" }

  depends_on = [aws_internet_gateway.this]
}

resource "aws_nat_gateway" "this" {
  for_each = local.nat_az_to_subnet

  connectivity_type = "public"
  allocation_id     = aws_eip.natgw[each.key].id
  subnet_id         = aws_subnet.this[each.value].id

  tags = { Name = "${local.prefix}-natgw-${each.key}" }

  depends_on = [aws_internet_gateway.this]
}
