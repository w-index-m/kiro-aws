# AWS Network Firewall(02_AWSネットワーク設計書サンプルの「NFWポリシー」「NetworkFirewall」シートに対応)
locals {
  home_net = [var.vpc_cidr, var.onprem_cidr]

  # 5-tuple ルール: 02 の shop-prd-rg-5tuple(優先度100)
  nfw_5tuple_rules = [
    { sid = 1001, action = "PASS", protocol = "TCP", source = "ANY", destination = "10.20.0.0/23", port = "443" },            # インターネット → ALB(HTTPS)
    { sid = 1002, action = "PASS", protocol = "TCP", source = "ANY", destination = "10.20.0.0/23", port = "80" },             # インターネット → ALB(HTTPS へ転送)
    { sid = 1003, action = "PASS", protocol = "TCP", source = var.ops_cidr, destination = "10.20.20.0/23", port = "22" },     # 運用端末 → アプリ(SSH)
    { sid = 1004, action = "PASS", protocol = "TCP", source = var.onprem_cidr, destination = "10.20.20.0/23", port = "443" }, # オンプレ → アプリ(社内向け API)
    { sid = 1005, action = "DROP", protocol = "IP", source = var.onprem_cidr, destination = "10.20.30.0/23", port = "ANY" },  # オンプレ → DB は止める(ログに残すため明示)
  ]

  # AZ短縮名 => Firewall エンドポイントID
  nfw_endpoint = {
    for s in aws_networkfirewall_firewall.this.firewall_status[0].sync_states :
    one([for k, v in var.azs : k if v == s.availability_zone]) => s.attachment[0].endpoint_id
  }
}

resource "aws_networkfirewall_rule_group" "five_tuple" {
  name     = "${local.prefix}-rg-5tuple"
  type     = "STATEFUL"
  capacity = 100

  rule_group {
    rule_variables {
      ip_sets {
        key = "HOME_NET"
        ip_set { definition = local.home_net }
      }
    }
    stateful_rule_options { rule_order = "STRICT_ORDER" }
    rules_source {
      dynamic "stateful_rule" {
        for_each = local.nfw_5tuple_rules
        content {
          action = stateful_rule.value.action
          header {
            direction        = "FORWARD"
            protocol         = stateful_rule.value.protocol
            source           = stateful_rule.value.source
            source_port      = "ANY"
            destination      = stateful_rule.value.destination
            destination_port = stateful_rule.value.port
          }
          rule_option {
            keyword  = "sid"
            settings = [tostring(stateful_rule.value.sid)]
          }
        }
      }
    }
  }
}

# アプリから外へ出る通信(NAT の後で検査)のドメイン許可リスト: 02 の shop-prd-rg-egress-domains(優先度200)
resource "aws_networkfirewall_rule_group" "egress_domains" {
  name     = "${local.prefix}-rg-egress-domains"
  type     = "STATEFUL"
  capacity = 100

  rule_group {
    rule_variables {
      ip_sets {
        key = "HOME_NET"
        ip_set { definition = local.home_net }
      }
    }
    stateful_rule_options { rule_order = "STRICT_ORDER" }
    rules_source {
      rules_source_list {
        generated_rules_type = "ALLOWLIST"
        target_types         = ["TLS_SNI", "HTTP_HOST"]
        targets              = var.egress_allowed_domains
      }
    }
  }
}

resource "aws_networkfirewall_firewall_policy" "this" {
  name = "${local.prefix}-nfw-policy"

  firewall_policy {
    stateless_default_actions          = ["aws:forward_to_sfe"]
    stateless_fragment_default_actions = ["aws:forward_to_sfe"]
    stateful_default_actions           = ["aws:drop_established", "aws:alert_established"]

    stateful_engine_options { rule_order = "STRICT_ORDER" }

    stateful_rule_group_reference {
      priority     = 100
      resource_arn = aws_networkfirewall_rule_group.five_tuple.arn
    }
    stateful_rule_group_reference {
      priority     = 200
      resource_arn = aws_networkfirewall_rule_group.egress_domains.arn
    }
  }
}

resource "aws_networkfirewall_firewall" "this" {
  name                = "${local.prefix}-nfw"
  firewall_policy_arn = aws_networkfirewall_firewall_policy.this.arn
  vpc_id              = aws_vpc.this.id

  dynamic "subnet_mapping" {
    for_each = local.subnet_by_tier_az["firewall"]
    content {
      subnet_id = aws_subnet.this[subnet_mapping.value].id
    }
  }

  tags = { Name = "${local.prefix}-nfw" }
}

# ログ: ALERT と FLOW を S3 へ、ALERT は CloudWatch Logs にも(02 のとおり)
resource "aws_networkfirewall_logging_configuration" "this" {
  firewall_arn = aws_networkfirewall_firewall.this.arn

  logging_configuration {
    log_destination_config {
      log_type             = "ALERT"
      log_destination_type = "S3"
      log_destination = {
        bucketName = var.nfw_log_bucket_name
        prefix     = "alert"
      }
    }
    log_destination_config {
      log_type             = "FLOW"
      log_destination_type = "S3"
      log_destination = {
        bucketName = var.nfw_log_bucket_name
        prefix     = "flow"
      }
    }
    log_destination_config {
      log_type             = "ALERT"
      log_destination_type = "CloudWatchLogs"
      log_destination = {
        logGroup = var.nfw_alert_log_group_name
      }
    }
  }
}
