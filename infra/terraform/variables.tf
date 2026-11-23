variable "oci_config_profile" {
  description = "Nombre del perfil en ~/.oci/config"
  type        = string
  default     = "DEFAULT"
}

variable "region" {
  description = "Región OCI (debe coincidir con la región de tu tenancy)"
  type        = string
}

variable "compartment_ocid" {
  description = "OCID del compartment donde se crearán los recursos"
  type        = string
}

variable "project_name" {
  description = "Prefijo para los recursos"
  type        = string
  default     = "barrio-vivo"
}

variable "admin_cidr" {
  description = "IP/CIDR autorizado para SSH y VNC; no uses 0.0.0.0/0"
  type        = string
}

variable "ssh_public_key" {
  description = "Clave pública SSH que se instalará en Ubuntu"
  type        = string
  sensitive   = true
}

variable "instance_shape" {
  description = "Shape ARM para Oracle Cloud Always Free Ampere A1"
  type        = string
  default     = "VM.Standard.A1.Flex"
}

variable "instance_ocpus" {
  description = "OCPUs para Ampere A1; 2 OCPU y 12 GB caben en el límite Always Free"
  type        = number
  default     = 2
}

variable "instance_memory_gbs" {
  description = "Memoria en GB para Ampere A1"
  type        = number
  default     = 12
}

variable "boot_volume_size_gbs" {
  description = "Tamaño del volumen de arranque (OCI requiere al menos 50 GB)"
  type        = number
  default     = 50
}

variable "enable_cloudflare" {
  description = "Crear un registro DNS A proxied en una zona existente de Cloudflare"
  type        = bool
  default     = false
}

variable "cloudflare_api_token" {
  description = "Token Cloudflare con Zone/DNS/Edit limitado a la zona del proyecto"
  type        = string
  sensitive   = true
  default     = ""
}

variable "cloudflare_zone_id" {
  description = "ID de la zona de Cloudflare que ya administras"
  type        = string
  default     = ""
}

variable "domain_name" {
  description = "FQDN para el sitio, por ejemplo barrio.example.com"
  type        = string
  default     = ""
}
