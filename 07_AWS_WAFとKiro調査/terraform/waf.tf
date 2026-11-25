# AWS WAF(02 の WAF 定義 shop-prd-webacl と同一: マネージド 4 + 回数制限、既定 Allow)
# ALB 自体は本コードの対象外。var.alb_arn を渡すと関連付ける。
resource "aws_wafv2_web_acl" "this" {
  name  = "${local.prefix}-webacl"
  scope = "REGIONAL"

  default_action {
    allow {}
  }

  dynamic "rule" {
    for_each = {
      "AWSManagedRulesAmazonIpReputationList" = 10
      "AWSManagedRulesCommonRuleSet"          = 20
      "AWSManagedRulesKnownBadInputsRuleSet"  = 30
      "AWSManagedRulesSQLiRuleSet"            = 40
    }
    content {
      name     = "AWS-${rule.key}"
      priority = rule.value

      # マネージドルールグループは override_action で Count / 本来のアクション(Block)を切り替える
      override_action {
        dynamic "count" {
          for_each = var.waf_managed_rules_count_only ? [1] : []
          content {}
        }
        dynamic "none" {
          for_each = var.waf_managed_rules_count_only ? [] : [1]
          content {}
        }
      }

      statement {
        managed_rule_group_statement {
          name        = rule.key
          vendor_name = "AWS"
        }
      }

      visibility_config {
        cloudwatch_metrics_enabled = true
        metric_name                = "AWS-${rule.key}"
        sampled_requests_enabled   = true
      }
    }
  }

  rule {
    name     = "${local.prefix}-rate-limit"
    priority = 50

    action {
      block {}
    }

    statement {
      rate_based_statement {
        limit              = var.waf_rate_limit
        aggregate_key_type = "IP"
        evaluation_window_sec = 300
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${local.prefix}-rate-limit"
      sampled_requests_enabled   = true
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "${local.prefix}-webacl"
    sampled_requests_enabled   = true
  }

  tags = { Name = "${local.prefix}-webacl" }
}

resource "aws_wafv2_web_acl_association" "alb" {
  count = var.alb_arn == "" ? 0 : 1

  resource_arn = var.alb_arn
  web_acl_arn  = aws_wafv2_web_acl.this.arn
}

# ログ: CloudWatch Logs(ロググループ名は aws-waf-logs- で始める)。Authorization と Cookie は伏せる。
resource "aws_cloudwatch_log_group" "waf" {
  name = "aws-waf-logs-${local.prefix}"
}

resource "aws_wafv2_web_acl_logging_configuration" "this" {
  resource_arn            = aws_wafv2_web_acl.this.arn
  log_destination_configs = [aws_cloudwatch_log_group.waf.arn]

  redacted_fields {
    single_header { name = "authorization" }
  }
  redacted_fields {
    single_header { name = "cookie" }
  }
}
