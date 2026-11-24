# Barrio Vivo 🌱

MVP de una comunidad vecinal sostenible: cualquier persona puede compartir una acción positiva; el barrio descubre ideas, filtra actividades y suma puntos de impacto.

## Entregables de la práctica

| Requisito | Implementación |
|---|---|
| MVP novedoso con frontend, backend y base de datos | React + Vite, API REST Express, Prisma y PostgreSQL |
| Push a `dev` ejecuta pruebas automatizadas | `.github/workflows/pipeline.yml`: unitarias, integración, E2E y build |
| Al menos 6 pruebas por nivel | 6 unitarias, 6 integración contra PostgreSQL, 6 E2E con Playwright |
| Push a `main` crea y publica Docker Hub | Después de pasar todas las pruebas publica imágenes `linux/amd64` y `linux/arm64` de `barrio-vivo-api` y `barrio-vivo-web` con tags `latest` y SHA |
| Dockerfile y Docker Compose | Imágenes multi-stage en `Dockerfile`; stack PostgreSQL, API, web y Caddy en `docker-compose.yml` |
| Terraform Ubuntu 24.04, VNC, subredes e IP pública | VCN OCI con subred pública y privada, Compute Ubuntu 24.04 Ampere A1 ARM, IP pública y puertos 80/443/22/5901 |
| Script/Ansible para Docker, Git, firewall e iptables | `infra/ansible/site.yml` instala y configura los servicios; firewall persistente limita SSH/VNC a tu CIDR |
| Extra de Ansible y Cloudflare | Despliegue con Ansible y Cloudflare Quick Tunnel que genera un enlace temporal `trycloudflare.com` sin dominio ni token |

## Ejecutar localmente

Requisitos: Node.js 24, Docker Desktop y Docker Compose v2.

```bash
cp .env.example .env
docker compose up --build
```

Abre [http://localhost](http://localhost). Compose crea PostgreSQL, aplica el esquema Prisma, carga tres actividades de ejemplo y levanta el sitio. El túnel público no se activa en desarrollo local. Para cerrar: `docker compose down`; para borrar también los datos locales: `docker compose down -v`.

Para desarrollo con recarga en caliente, inicia PostgreSQL con `docker compose up -d db`, luego ejecuta:

```bash
npm install
npm run db:generate
npm run db:push
npm run db:seed
npm run dev
```

Vite corre en `http://localhost:5173` y la API en `http://localhost:3000`. Define `DATABASE_URL` como en `.env.example`.

## Pruebas

Las pruebas de integración y E2E requieren PostgreSQL disponible y el esquema actualizado. La pipeline de GitHub Actions hace la preparación automáticamente.

```bash
npm install
npm run db:generate
npm run db:push
npm run db:seed
npm run test:unit         # 6 reglas de dominio
npm run test:integration  # 6 pruebas HTTP + PostgreSQL
npx playwright install chromium
npm run test:e2e          # 6 flujos del navegador contra frontend y API reales
```

## GitHub Actions y Docker Hub

1. Sube el código a las ramas `dev` y `main`. Cada push a ambas ramas ejecuta las tres suites, genera el cliente Prisma y compila el frontend. También se verifican PR hacia esas ramas.
2. En el repositorio de GitHub agrega los secretos `DOCKERHUB_USERNAME` y `DOCKERHUB_TOKEN` (token de acceso de Docker Hub).
3. Cada push a `main`, después de que pase el job `tests`, publica:
   - `DOCKERHUB_USERNAME/barrio-vivo-api:latest` y `:GITHUB_SHA` para `linux/amd64` y `linux/arm64`
   - `DOCKERHUB_USERNAME/barrio-vivo-web:latest` y `:GITHUB_SHA` para `linux/amd64` y `linux/arm64`
4. Para el equipo de dos personas, cada integrante trabaja en una rama de funcionalidad, abre PR hacia `dev`, revisa el trabajo de su compañero y promueve a `main` la versión aceptada. Así el push a `dev` valida continuamente y `main` publica.

## Infraestructura Oracle Cloud (OCI) con Terraform

La infraestructura vive en `infra/terraform`. Crea una VCN con subred pública y privada, Internet Gateway, rutas y listas de seguridad; una VM Ubuntu 24.04 con IP pública; y reglas para HTTP/HTTPS (`80/443`) abiertas y SSH/VNC (`22/5901`) limitadas a `admin_cidr`. La VM usa `VM.Standard.A1.Flex` ARM con 2 OCPU, 12 GB RAM y volumen de arranque de 50 GB, dimensionados para los límites publicados de OCI Always Free. Oracle puede no tener capacidad A1 libre temporalmente en tu región de origen.

Necesitas una cuenta OCI, Terraform >=1.7, un API signing key configurado en el perfil local `~/.oci/config`, el OCID del compartment, región, clave SSH pública e IP/CIDR administrativo. Configura las credenciales localmente con `oci setup config` (OCI CLI) o sigue la guía de [API Key Authentication de Oracle](https://docs.oracle.com/en-us/iaas/Content/dev/terraform/configuring.htm). El provider toma del perfil el tenancy OCID, user OCID, fingerprint y ruta de la clave privada. No subas `~/.oci/config`, claves privadas ni `terraform.tfvars` al repositorio.

```bash
cd infra/terraform
cp terraform.tfvars.example terraform.tfvars
# Define region, compartment_ocid, admin_cidr y tu clave PÚBLICA SSH.
terraform init
terraform fmt -check
terraform validate
terraform plan
terraform apply
terraform output public_ip
terraform output origin_url
```

Guarda `public_ip` para Ansible. Antes de aplicar, confirma que shape y volumen siguen marcados Always Free en tu tenancy. Usa `terraform destroy` cuando termines la práctica para retirar la VM, VCN y recursos asociados.

### Configurar la VM y el escritorio VNC con Ansible

Ejecuta Ansible desde Linux/WSL/una máquina con Python y OpenSSH:

```bash
cd infra/ansible
ansible-galaxy collection install -r requirements.yml
cp inventory.ini.example inventory.ini
cp group_vars/all.yml.example group_vars/all.yml
# Actualiza IP/clave y admin_cidr en los dos archivos.
export VNC_PASSWORD='una-clave-segura-de-8-caracteres-o-mas'
ansible-playbook site.yml
```

Esto instala Docker, Docker Compose, Git, XFCE, TigerVNC e iptables. El firewall persistente permite únicamente SSH/VNC desde `admin_cidr`, y puertos 80/443 desde Internet. Conéctate a `IP_PUBLICA:5901` desde tu CIDR. No expongas VNC a toda Internet.

### Enlace temporal de Cloudflare (puntos extra)

El despliegue de producción activa un Cloudflare Quick Tunnel dentro de Docker Compose. No requiere cuenta Cloudflare, dominio, DNS ni API token. Al iniciarlo, Cloudflare crea un enlace HTTPS aleatorio bajo `trycloudflare.com` que redirige al Caddy local:

```bash
cd /opt/barrio-vivo
docker compose logs -f cloudflared
```

Copia la URL `https://...trycloudflare.com` que aparece en los logs. El enlace es temporal: deja de funcionar si se detiene el contenedor y puede cambiar cuando se reinicia. Cualquier persona que conozca el enlace podrá abrir la aplicación; compártelo solo para la demostración. El túnel usa una conexión saliente, mientras que la VM conserva las reglas requeridas para los puertos 80/443.

## Despliegue a la VM

Al terminar Ansible, configura entorno en la máquina desde la que ejecutarás el playbook y despliega las imágenes que el workflow publicó:

```bash
cd infra/ansible
export APP_REPOSITORY='https://github.com/USUARIO/REPOSITORIO.git'
export DOCKERHUB_USERNAME='TU_USUARIO_DOCKERHUB'
export POSTGRES_PASSWORD='una-clave-larga-y-aleatoria'
ansible-playbook deploy.yml
```

Para un repo privado configura una clave de despliegue Git en la VM antes de correr el playbook. Para Docker Hub privado, inicia sesión con `docker login` en la VM y crea un token de lectura. Al terminar, obtén el enlace temporal con `docker compose logs -f cloudflared`.

## Estructura

```text
api/                 API Express, reglas de negocio, Prisma y 12 pruebas
web/                 interfaz React, Vite y 6 pruebas E2E
.github/workflows/   pipeline dev/main y publicación Docker Hub
infra/docker/        reverse proxy frontend → API
infra/terraform/     OCI VCN/subnets, Ubuntu 24.04 ARM, VNC y security lists
infra/ansible/       hardening, herramientas, escritorio VNC y despliegue
```
