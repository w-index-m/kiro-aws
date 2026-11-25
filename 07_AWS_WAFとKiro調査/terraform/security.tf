# ---------------------------------------------------------------- Network ACL
locals {
  subnet_ids_by_tier = {
    for tier in ["public", "app", "db"] :
    tier => [for k, v in var.subnets : aws_subnet.this[k].id if v.tier == tier]
  }
}

resource "aws_network_acl" "public" {
  vpc_id     = aws_vpc.this.id
  subnet_ids = local.subnet_ids_by_tier["public"]

  ingress {
    rule_no    = 100
    protocol   = "tcp"
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 80
    to_port    = 80
  }
  ingress {
    rule_no    = 110
    protocol   = "tcp"
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 443
    to_port    = 443
  }
  ingress {
    rule_no    = 120
    protocol   = "tcp"
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 1024
    to_port    = 65535
  }
  egress {
    rule_no    = 100
    protocol   = "-1"
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 0
    to_port    = 0
  }

  tags = { Name = "${local.prefix}-nacl-public" }
}

resource "aws_network_acl" "app" {
  vpc_id     = aws_vpc.this.id
  subnet_ids = local.subnet_ids_by_tier["app"]

  ingress {
    rule_no    = 100
    protocol   = "tcp"
    action     = "allow"
    cidr_block = var.vpc_cidr
    from_port  = 8080
    to_port    = 8080
  }
  ingress {
    rule_no    = 110
    protocol   = "tcp"
    action     = "allow"
    cidr_block = var.onprem_cidr
    from_port  = 22
    to_port    = 22
  }
  ingress {
    rule_no    = 120
    protocol   = "tcp"
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 1024
    to_port    = 65535
  }
  egress {
    rule_no    = 100
    protocol   = "-1"
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 0
    to_port    = 0
  }

  tags = { Name = "${local.prefix}-nacl-app" }
}

resource "aws_network_acl" "db" {
  vpc_id     = aws_vpc.this.id
  subnet_ids = local.subnet_ids_by_tier["db"]

  # App層サブネット(10.10.10.0/23 相当)からのDB接続
  ingress {
    rule_no    = 100
    protocol   = "tcp"
    action     = "allow"
    cidr_block = cidrsubnet(var.vpc_cidr, 7, 5) # 10.10.10.0/23 (vpc_cidr=10.10.0.0/16 の場合)
    from_port  = 3306
    to_port    = 3306
  }
  ingress {
    rule_no    = 110
    protocol   = "tcp"
    action     = "allow"
    cidr_block = var.onprem_cidr
    from_port  = 3306
    to_port    = 3306
  }
  egress {
    rule_no    = 100
    protocol   = "tcp"
    action     = "allow"
    cidr_block = var.vpc_cidr
    from_port  = 1024
    to_port    = 65535
  }
  egress {
    rule_no    = 110
    protocol   = "tcp"
    action     = "allow"
    cidr_block = var.onprem_cidr
    from_port  = 1024
    to_port    = 65535
  }

  tags = { Name = "${local.prefix}-nacl-db" }
}

# ---------------------------------------------------------------- Security Group
resource "aws_security_group" "alb" {
  name        = "${local.prefix}-sg-alb"
  description = "ALB"
  vpc_id      = aws_vpc.this.id

  tags = { Name = "${local.prefix}-sg-alb" }
}

resource "aws_security_group" "app" {
  name        = "${local.prefix}-sg-app"
  description = "Application"
  vpc_id      = aws_vpc.this.id

  tags = { Name = "${local.prefix}-sg-app" }
}

resource "aws_security_group" "db" {
  name        = "${local.prefix}-sg-db"
  description = "Database"
  vpc_id      = aws_vpc.this.id

  tags = { Name = "${local.prefix}-sg-db" }
}

resource "aws_vpc_security_group_ingress_rule" "alb_https" {
  security_group_id = aws_security_group.alb.id
  description       = "HTTPS from internet"
  ip_protocol       = "tcp"
  from_port         = 443
  to_port           = 443
  cidr_ipv4         = "0.0.0.0/0"
}

resource "aws_vpc_security_group_ingress_rule" "app_from_alb" {
  security_group_id            = aws_security_group.app.id
  description                  = "App port from ALB"
  ip_protocol                  = "tcp"
  from_port                    = 8080
  to_port                      = 8080
  referenced_security_group_id = aws_security_group.alb.id
}

resource "aws_vpc_security_group_ingress_rule" "app_ssh_onprem" {
  security_group_id = aws_security_group.app.id
  description       = "SSH from on-premises"
  ip_protocol       = "tcp"
  from_port         = 22
  to_port           = 22
  cidr_ipv4         = var.onprem_cidr
}

resource "aws_vpc_security_group_ingress_rule" "db_from_app" {
  security_group_id            = aws_security_group.db.id
  description                  = "MySQL from App"
  ip_protocol                  = "tcp"
  from_port                    = 3306
  to_port                      = 3306
  referenced_security_group_id = aws_security_group.app.id
}

resource "aws_vpc_security_group_egress_rule" "alb_all" {
  security_group_id = aws_security_group.alb.id
  ip_protocol       = "-1"
  cidr_ipv4         = "0.0.0.0/0"
}

resource "aws_vpc_security_group_egress_rule" "app_all" {
  security_group_id = aws_security_group.app.id
  ip_protocol       = "-1"
  cidr_ipv4         = "0.0.0.0/0"
}
