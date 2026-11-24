output "public_ip" {
  description = "IP pública de Ubuntu 24.04"
  value       = oci_core_instance.web.public_ip
}

output "private_ip" {
  description = "IP privada de la VM en la subred pública"
  value       = oci_core_instance.web.private_ip
}

output "origin_url" {
  description = "IP pública de origen de la aplicación (el enlace público se muestra en los logs de cloudflared)"
  value       = "http://${oci_core_instance.web.public_ip}"
}

output "vcn_id" {
  value = oci_core_vcn.main.id
}

output "public_subnet_id" {
  value = oci_core_subnet.public.id
}

output "private_subnet_id" {
  value = oci_core_subnet.private.id
}
