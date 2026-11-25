output "vpc_id" {
  value = aws_vpc.this.id
}

output "subnet_ids" {
  value = { for k, s in aws_subnet.this : k => s.id }
}

output "nat_gateway_public_ips" {
  description = "NATGWのEIP(外部サービス側の許可リスト登録用)"
  value       = { for az, e in aws_eip.nat : az => e.public_ip }
}

output "nfw_endpoint_ids" {
  description = "AZごとの Network Firewall エンドポイント"
  value       = local.nfw_endpoint
}

output "web_acl_arn" {
  value = aws_wafv2_web_acl.this.arn
}

output "dx_gateway_id" {
  value = aws_dx_gateway.this.id
}

output "vgw_id" {
  value = aws_vpn_gateway.this.id
}

output "dx_vif_ids" {
  value = { for k, v in aws_dx_private_virtual_interface.this : k => v.id }
}
