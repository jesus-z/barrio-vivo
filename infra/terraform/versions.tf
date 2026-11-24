terraform {
  required_version = ">= 1.7.0"

  required_providers {
    oci = {
      source  = "oracle/oci"
      version = ">= 6.0, < 8.0"
    }
  }
}

provider "oci" {
  region           = var.region
  tenancy_ocid     = var.tenancy_ocid == "" ? null : var.tenancy_ocid
  user_ocid        = var.user_ocid == "" ? null : var.user_ocid
  fingerprint      = var.fingerprint == "" ? null : var.fingerprint
  private_key_path = var.private_key_path == "" ? null : var.private_key_path
}
