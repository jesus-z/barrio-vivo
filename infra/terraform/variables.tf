variable "aws_region" {
  description = "Región AWS donde crear la VM"
  type        = string
  default     = "us-east-1"
}
variable "project_name" {
  description = "Prefijo para los recursos"
  type        = string
  default     = "barrio-vivo"
}
variable "admin_cidr" {
  description = "IP/CIDR autorizado para SSH y escritorio VNC; no usar 0.0.0.0/0"
  type        = string
}
variable "ssh_public_key" {
  description = "Clave pública SSH para acceder a la VM"
  type        = string
  sensitive   = true
}
variable "instance_type" {
  description = "Tipo de instancia EC2"
  type        = string
  default     = "t3.medium"
}
variable "enable_cloudflare" {
  description = "Crear un registro DNS A proxied en Cloudflare"
  type        = bool
  default     = false
}
variable "cloudflare_api_token" {
  description = "API token de Cloudflare con permiso DNS edit"
  type        = string
  sensitive   = true
  default     = ""
}
variable "cloudflare_zone_id" {
  description = "ID de la zona existente de Cloudflare"
  type        = string
  default     = ""
}
variable "domain_name" {
  description = "FQDN para el sitio, por ejemplo barrio.example.com"
  type        = string
  default     = ""
}
