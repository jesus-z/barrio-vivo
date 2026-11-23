output "public_ip" {
  description = "IP pública de Ubuntu 24.04"
  value       = aws_instance.web.public_ip
}
output "website_url" {
  description = "URL para acceder al sitio"
  value       = var.enable_cloudflare ? "https://${var.domain_name}" : "http://${aws_instance.web.public_ip}"
}
output "vpc_id" { value = aws_vpc.main.id }
output "public_subnet_id" { value = aws_subnet.public.id }
output "private_subnet_id" { value = aws_subnet.private.id }
