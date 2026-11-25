# セキュリティグループ(02 の「SG」シートに対応)。ネットワークACLは 02 の設計に無いため作らない(既定のまま)。
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

# ---- ALB
resource "aws_vpc_security_group_ingress_rule" "alb_https" {
  security_group_id = aws_security_group.alb.id
  description       = "HTTPS"
  ip_protocol       = "tcp"
  from_port         = 443
  to_port           = 443
  cidr_ipv4         = "0.0.0.0/0"
}

resource "aws_vpc_security_group_ingress_rule" "alb_http" {
  security_group_id = aws_security_group.alb.id
  description       = "HTTPS へ転送するため"
  ip_protocol       = "tcp"
  from_port         = 80
  to_port           = 80
  cidr_ipv4         = "0.0.0.0/0"
}

resource "aws_vpc_security_group_egress_rule" "alb_to_app" {
  security_group_id            = aws_security_group.alb.id
  description                  = "ターゲットへ"
  ip_protocol                  = "tcp"
  from_port                    = 8080
  to_port                      = 8080
  referenced_security_group_id = aws_security_group.app.id
}

# ---- App
resource "aws_vpc_security_group_ingress_rule" "app_from_alb" {
  security_group_id            = aws_security_group.app.id
  description                  = "ALB から"
  ip_protocol                  = "tcp"
  from_port                    = 8080
  to_port                      = 8080
  referenced_security_group_id = aws_security_group.alb.id
}

resource "aws_vpc_security_group_ingress_rule" "app_ssh_ops" {
  security_group_id = aws_security_group.app.id
  description       = "運用端末から"
  ip_protocol       = "tcp"
  from_port         = 22
  to_port           = 22
  cidr_ipv4         = var.ops_cidr
}

resource "aws_vpc_security_group_egress_rule" "app_to_db" {
  security_group_id            = aws_security_group.app.id
  description                  = "DB へ"
  ip_protocol                  = "tcp"
  from_port                    = 5432
  to_port                      = 5432
  referenced_security_group_id = aws_security_group.db.id
}

resource "aws_vpc_security_group_egress_rule" "app_https_out" {
  security_group_id = aws_security_group.app.id
  description       = "外部 API・更新(Network Firewall のドメイン許可リストで絞る)"
  ip_protocol       = "tcp"
  from_port         = 443
  to_port           = 443
  cidr_ipv4         = "0.0.0.0/0"
}

# ---- DB
resource "aws_vpc_security_group_ingress_rule" "db_from_app" {
  security_group_id            = aws_security_group.db.id
  description                  = "アプリから"
  ip_protocol                  = "tcp"
  from_port                    = 5432
  to_port                      = 5432
  referenced_security_group_id = aws_security_group.app.id
}
