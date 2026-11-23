terraform {
  required_version = ">= 1.7.0"

  required_providers {
    oci = {
      source  = "oracle/oci"
      version = ">= 6.0, < 8.0"
    }
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }
  }
}

provider "oci" {
  config_file_profile = var.oci_config_profile
  region               = var.region
}

provider "cloudflare" {
  api_token = var.cloudflare_api_token
}
