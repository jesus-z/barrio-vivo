data "oci_identity_availability_domains" "available" {
  compartment_id = var.compartment_ocid
}

data "oci_core_images" "ubuntu_2404" {
  compartment_id           = var.compartment_ocid
  operating_system         = "Canonical Ubuntu"
  operating_system_version = "24.04"
  shape                    = var.instance_shape
  sort_by                  = "TIMECREATED"
  sort_order               = "DESC"
}

resource "oci_core_vcn" "main" {
  compartment_id = var.compartment_ocid
  cidr_blocks    = ["10.42.0.0/16"]
  display_name   = "${var.project_name}-vcn"
  dns_label      = "barriovivo"
  freeform_tags  = { Project = var.project_name }
}

resource "oci_core_internet_gateway" "main" {
  compartment_id = var.compartment_ocid
  vcn_id         = oci_core_vcn.main.id
  display_name   = "${var.project_name}-igw"
  enabled        = true
  freeform_tags  = { Project = var.project_name }
}

resource "oci_core_route_table" "public" {
  compartment_id = var.compartment_ocid
  vcn_id         = oci_core_vcn.main.id
  display_name   = "${var.project_name}-public-routes"

  route_rules {
    destination       = "0.0.0.0/0"
    destination_type  = "CIDR_BLOCK"
    network_entity_id = oci_core_internet_gateway.main.id
  }
}

resource "oci_core_route_table" "private" {
  compartment_id = var.compartment_ocid
  vcn_id         = oci_core_vcn.main.id
  display_name   = "${var.project_name}-private-routes"
}

resource "oci_core_security_list" "public" {
  compartment_id = var.compartment_ocid
  vcn_id         = oci_core_vcn.main.id
  display_name   = "${var.project_name}-public-security"

  ingress_security_rules {
    protocol    = "6"
    source      = "0.0.0.0/0"
    description = "HTTP"
    tcp_options {
      min = 80
      max = 80
    }
  }
  ingress_security_rules {
    protocol    = "6"
    source      = "0.0.0.0/0"
    description = "HTTPS"
    tcp_options {
      min = 443
      max = 443
    }
  }
  ingress_security_rules {
    protocol    = "6"
    source      = var.admin_cidr
    description = "SSH administrativo"
    tcp_options {
      min = 22
      max = 22
    }
  }
  ingress_security_rules {
    protocol    = "6"
    source      = var.admin_cidr
    description = "VNC administrativo"
    tcp_options {
      min = 5901
      max = 5901
    }
  }
  egress_security_rules {
    protocol    = "all"
    destination = "0.0.0.0/0"
  }
}

resource "oci_core_security_list" "private" {
  compartment_id = var.compartment_ocid
  vcn_id         = oci_core_vcn.main.id
  display_name   = "${var.project_name}-private-security"

  ingress_security_rules {
    protocol    = "all"
    source      = "10.42.0.0/16"
    description = "Tráfico interno de la VCN"
  }
  egress_security_rules {
    protocol    = "all"
    destination = "10.42.0.0/16"
  }
}

resource "oci_core_subnet" "public" {
  compartment_id             = var.compartment_ocid
  vcn_id                     = oci_core_vcn.main.id
  cidr_block                 = "10.42.1.0/24"
  display_name               = "${var.project_name}-public"
  dns_label                  = "public"
  route_table_id             = oci_core_route_table.public.id
  security_list_ids          = [oci_core_security_list.public.id]
  prohibit_public_ip_on_vnic = false
  freeform_tags              = { Tier = "public", Project = var.project_name }
}

resource "oci_core_subnet" "private" {
  compartment_id             = var.compartment_ocid
  vcn_id                     = oci_core_vcn.main.id
  cidr_block                 = "10.42.2.0/24"
  display_name               = "${var.project_name}-private"
  dns_label                  = "private"
  route_table_id             = oci_core_route_table.private.id
  security_list_ids          = [oci_core_security_list.private.id]
  prohibit_public_ip_on_vnic = true
  freeform_tags              = { Tier = "private", Project = var.project_name }
}

resource "oci_core_instance" "web" {
  availability_domain = data.oci_identity_availability_domains.available.availability_domains[0].name
  compartment_id      = var.compartment_ocid
  display_name        = "${var.project_name}-ubuntu-2404"
  shape               = var.instance_shape

  dynamic "shape_config" {
    for_each = var.instance_shape == "VM.Standard.A1.Flex" ? [1] : []
    content {
      ocpus         = var.instance_ocpus
      memory_in_gbs = var.instance_memory_gbs
    }
  }

  create_vnic_details {
    subnet_id        = oci_core_subnet.public.id
    assign_public_ip = true
    hostname_label   = "barriovivo"
  }

  source_details {
    source_type             = "image"
    source_id               = data.oci_core_images.ubuntu_2404.images[0].id
    boot_volume_size_in_gbs = var.boot_volume_size_gbs
  }

  metadata = {
    ssh_authorized_keys = var.ssh_public_key
  }

  freeform_tags = { Project = var.project_name, OS = "Ubuntu 24.04" }
}

