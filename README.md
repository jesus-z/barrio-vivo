# Barrio Vivo 🌱

MVP de una comunidad vecinal sostenible: cualquier persona puede compartir una acción positiva; el barrio descubre ideas, filtra actividades y suma puntos de impacto.

## Entregables de la práctica

| Requisito | Implementación |
|---|---|
| MVP novedoso con frontend, backend y base de datos | React + Vite, API REST Express, Prisma y PostgreSQL |
| Push a `dev` ejecuta pruebas automatizadas | `.github/workflows/pipeline.yml`: unitarias, integración, E2E y build |
| Al menos 6 pruebas por nivel | 6 unitarias, 6 integración contra PostgreSQL, 6 E2E con Playwright |
| Push a `main` crea y publica Docker Hub | Después de pasar todas las pruebas publica `barrio-vivo-api` y `barrio-vivo-web` con tags `latest` y SHA |
| Dockerfile y Docker Compose | Imágenes multi-stage en `Dockerfile`; stack PostgreSQL, API, web y Caddy en `docker-compose.yml` |
| Terraform Ubuntu 24.04, VNC, subredes e IP pública | VPC con subred pública y privada, EC2 Ubuntu 24.04, IP pública, SG y puertos 80/443/22/5901 |
| Script/Ansible para Docker, Git, firewall e iptables | `infra/ansible/site.yml` instala y configura los servicios; firewall persistente limita SSH/VNC a tu CIDR |
| Extra de Ansible y Cloudflare | Despliegue con Ansible y registro DNS A proxied opcional con Terraform/Cloudflare |

## Ejecutar localmente

Requisitos: Node.js 24, Docker Desktop y Docker Compose v2.

```bash
cp .env.example .env
docker compose up --build
```

Abre [http://localhost](http://localhost). Compose crea PostgreSQL, aplica el esquema Prisma, carga tres actividades de ejemplo y levanta el sitio. Para cerrar: `docker compose down`; para borrar también los datos locales: `docker compose down -v`.

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
   - `DOCKERHUB_USERNAME/barrio-vivo-api:latest` y `:GITHUB_SHA`
   - `DOCKERHUB_USERNAME/barrio-vivo-web:latest` y `:GITHUB_SHA`
4. Para el equipo de dos personas, cada integrante trabaja en una rama de funcionalidad, abre PR hacia `dev`, revisa el trabajo de su compañero y promueve a `main` la versión aceptada. Así el push a `dev` valida continuamente y `main` publica.

## Infraestructura AWS con Terraform

La infraestructura vive en `infra/terraform`. Crea Ubuntu Server 24.04 LTS, VPC, una subred pública y otra privada, Internet Gateway, rutas, grupo de seguridad, clave SSH y EC2 con IP pública. VNC (`5901/tcp`) y SSH (`22/tcp`) quedan limitados a `admin_cidr`; HTTP/HTTPS (`80/443`) son públicos. Metadata IMDSv2 y disco cifrado están habilitados.

Necesitas Terraform >=1.7, credenciales de AWS por AWS CLI/variables de entorno y una clave SSH. Nunca guardes claves privadas ni `terraform.tfvars` en Git.

```bash
cd infra/terraform
cp terraform.tfvars.example terraform.tfvars
# Edita admin_cidr con TU_IP_PUBLICA/32 y pega únicamente la clave pública SSH.
terraform init
terraform validate
terraform plan
terraform apply
terraform output website_url
```

Guarda `public_ip` para Ansible. Usa `terraform destroy` cuando termines la práctica para retirar EC2 y la red y detener cargos. La instancia `t3.medium` y su volumen pueden generar cargos mientras existan.

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

### DNS y HTTPS con Cloudflare (puntos extra)

Usa una zona de Cloudflare que ya administres y crea un API token con permiso `Zone / DNS / Edit` solamente para esa zona. En `terraform.tfvars` activa `enable_cloudflare`, define `cloudflare_api_token`, `cloudflare_zone_id` y el FQDN (`domain_name`). Terraform crea el registro A proxied apuntando a la IP pública. Protege el token, evita subir los tfvars y recuerda que Terraform puede conservar valores sensibles en el state.

El Caddy del compose obtiene y renueva certificado HTTPS automáticamente cuando el FQDN resuelve a la VM y llegan conexiones por 80/443. Configura Cloudflare SSL/TLS en **Full (strict)** y define `SITE_DOMAIN=app.tudominio.com` en `.env` antes de desplegar. En el escenario sin dominio usa `SITE_DOMAIN=http://IP_PUBLICA` para servir HTTP sin intentar emitir un certificado.

## Despliegue a la VM

Al terminar Ansible, configura entorno en la máquina desde la que ejecutarás el playbook y despliega las imágenes que el workflow publicó:

```bash
cd infra/ansible
export APP_REPOSITORY='https://github.com/USUARIO/REPOSITORIO.git'
export DOCKERHUB_USERNAME='TU_USUARIO_DOCKERHUB'
export POSTGRES_PASSWORD='una-clave-larga-y-aleatoria'
export SITE_DOMAIN='app.tudominio.com' # o http://IP_PUBLICA si no usarás Cloudflare
ansible-playbook deploy.yml
```

Para un repo privado configura una clave de despliegue Git en la VM antes de correr el playbook. Para Docker Hub privado, inicia sesión con `docker login` en la VM y crea un token de lectura. Caddy sirve HTTPS para el dominio cuando DNS y Cloudflare están listos.

## Estructura

```text
api/                 API Express, reglas de negocio, Prisma y 12 pruebas
web/                 interfaz React, Vite y 6 pruebas E2E
.github/workflows/   pipeline dev/main y publicación Docker Hub
infra/docker/        reverse proxy frontend → API
infra/terraform/     VPC, subnets, Ubuntu 24.04, VNC/SG y DNS Cloudflare
infra/ansible/       hardening, herramientas, escritorio VNC y despliegue
```
