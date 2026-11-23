data "aws_availability_zones" "available" {
  state = "available"
}
data "aws_ami" "ubuntu_2404" {
  most_recent = true
  owners      = ["099720109477"]
  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd-gp3/ubuntu-noble-24.04-amd64-server-*"]
  }
  filter {
    name   = "architecture"
    values = ["x86_64"]
  }
  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

resource "aws_vpc" "main" {
  cidr_block           = "10.42.0.0/16"
  enable_dns_support = true
  enable_dns_hostnames = true
  tags = { Name = "${var.project_name}-vpc" }
}
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id
  tags   = { Name = "${var.project_name}-igw" }
}
resource "aws_subnet" "public" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.42.1.0/24"
  availability_zone       = data.aws_availability_zones.available.names[0]
  map_public_ip_on_launch = true
  tags                    = { Name = "${var.project_name}-public", Tier = "public" }
}
resource "aws_subnet" "private" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.42.2.0/24"
  availability_zone = data.aws_availability_zones.available.names[1]
  tags              = { Name = "${var.project_name}-private", Tier = "private" }
}
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }
  tags = { Name = "${var.project_name}-public-routes" }
}
resource "aws_route_table_association" "public" {
  subnet_id      = aws_subnet.public.id
  route_table_id = aws_route_table.public.id
}
resource "aws_route_table" "private" {
  vpc_id = aws_vpc.main.id
  tags   = { Name = "${var.project_name}-private-routes" }
}
resource "aws_route_table_association" "private" {
  subnet_id      = aws_subnet.private.id
  route_table_id = aws_route_table.private.id
}

resource "aws_security_group" "vm" {
  name = "${var.project_name}-vm"
  description = "Web pública; administración SSH/VNC restringida al CIDR del responsable"
  vpc_id = aws_vpc.main.id
  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  ingress {
    description = "SSH administrativo"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.admin_cidr]
  }
  ingress {
    description = "VNC administrativo"
    from_port   = 5901
    to_port     = 5901
    protocol    = "tcp"
    cidr_blocks = [var.admin_cidr]
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  tags = { Name = "${var.project_name}-sg" }
}
resource "aws_key_pair" "admin" {
  key_name   = "${var.project_name}-admin"
  public_key = var.ssh_public_key
  tags       = { Project = var.project_name }
}
resource "aws_instance" "web" {
  ami = data.aws_ami.ubuntu_2404.id
  instance_type = var.instance_type
  subnet_id = aws_subnet.public.id
  vpc_security_group_ids = [aws_security_group.vm.id]
  key_name = aws_key_pair.admin.key_name
  associate_public_ip_address = true
  root_block_device {
    volume_size = 24
    volume_type = "gp3"
    encrypted   = true
  }
  metadata_options {
    http_tokens = "required"
  }
  tags = { Name = "${var.project_name}-ubuntu-2404"; Project = var.project_name; OS = "Ubuntu 24.04" }
}

resource "cloudflare_record" "site" {
  count = var.enable_cloudflare ? 1 : 0
  zone_id = var.cloudflare_zone_id
  name = var.domain_name
  type = "A"
  value = aws_instance.web.public_ip
  ttl = 1
  proxied = true
  comment = "Barrio Vivo MVP"
  lifecycle {
    precondition {
      condition     = var.cloudflare_zone_id != "" && var.domain_name != "" && var.cloudflare_api_token != ""
      error_message = "Cloudflare activado: define token, zone_id y domain_name."
    }
  }
}
