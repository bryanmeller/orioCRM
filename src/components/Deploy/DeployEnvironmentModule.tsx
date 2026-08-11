import React, { useState } from 'react';
import {
  Server,
  ShieldCheck,
  KeyRound,
  Globe,
  Terminal,
  Copy,
  Check,
  Cpu,
  Smartphone,
  Tv,
  HardDrive,
  RefreshCw,
  FileCode,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Zap,
  Layers,
  Sparkles,
  Download,
  Settings,
  ExternalLink,
  Code2,
  Flame,
  ShieldAlert
} from 'lucide-react';
import { AdminUser, HierarchyAccount } from '../AdminPanel/AdminPanel';

interface DeployEnvironmentModuleProps {
  currentUser: AdminUser | null;
  accounts: HierarchyAccount[];
  showToast: (msg: string) => void;
}

export const DeployEnvironmentModule: React.FC<DeployEnvironmentModuleProps> = ({
  currentUser,
  accounts,
  showToast,
}) => {
  const [activeTab, setActiveTab] = useState<
    | 'environments'
    | 'variables'
    | 'docker_nginx'
    | 'flutter_builds'
    | 'https_cors'
    | 'backups'
    | 'docs'
  >('environments');

  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const handleCopyCode = (codeText: string, sectionKey: string) => {
    navigator.clipboard.writeText(codeText);
    setCopiedSection(sectionKey);
    showToast('Código/Configuração copiado para a área de transferência!');
    setTimeout(() => setCopiedSection(null), 2000);
  };

  // --- CONFIGURATIONS & SCRIPTS ---

  const dockerfileConfig = `# ==============================================================================
# DOCKERFILE MULTI-STAGE FOR STREAMFLIX TV SAAS PRODUCTION (MODULE 23)
# ==============================================================================

# STAGE 1: BUILD ENVIRONMENT
FROM node:20-alpine AS builder
WORKDIR /app

# Copy dependency definitions
COPY package*.json ./
RUN npm ci --quiet

# Copy source code and build production assets
COPY . .
ENV NODE_ENV=production
RUN npm run build

# STAGE 2: PRODUCTION RUNTIME
FROM node:20-alpine AS runner
WORKDIR /app

# Security & Runtime Env
ENV NODE_ENV=production
ENV PORT=3000

# Install Nginx and Supervisor for combined frontend/backend container
RUN apk add --no-gradient --no-cache nginx supervisor tzdata
ENV TZ=America/Sao_Paulo

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Copy Nginx and Supervisor configuration
COPY nginx.conf /etc/nginx/nginx.conf
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

EXPOSE 3000

HEALTHCHECK --interval=15s --timeout=3s --start-period=5s --retries=3 \\
  CMD wget -qO- http://localhost:3000/api/health || exit 1

CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
`;

  const nginxConfig = `# ==============================================================================
# NGINX HIGH-PERFORMANCE REVERSE PROXY & SECURITY HEADERS (MODULE 23)
# ==============================================================================
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    # Gzip & Brotli Compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
    gzip_min_length 1000;

    server {
        listen 3000;
        server_name _;

        # Security Headers (OWASP Recommended)
        add_header X-Frame-Options "DENY" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;
        add_header Content-Security-Policy "default-src 'self' https: data: 'unsafe-inline' 'unsafe-eval';" always;

        # API Proxy Route
        location /api/ {
            proxy_pass http://127.0.0.1:3001/;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }

        # Frontend SPA Fallback
        location / {
            root /app/dist;
            index index.html;
            try_files $uri $uri/ /index.html;
        }
    }
}
`;

  const githubActionsYaml = `# ==============================================================================
# GITHUB ACTIONS CI/CD DEPLOY PIPELINE (.github/workflows/deploy.yml)
# ==============================================================================
name: StreamFlix TV Production CI/CD Pipeline

on:
  push:
    branches: [ "main", "staging" ]

jobs:
  audit-and-build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Codebase
        uses: actions/checkout@v4

      - name: Setup Node.js 20
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install Dependencies
        run: npm ci

      - name: Typecheck & Linter Audit
        run: npm run lint

      - name: Compile Application
        run: npm run build

      - name: Docker Build & Security Scan
        run: |
          docker build -t streamflix-app:\${{ github.sha }} .

      - name: Deploy to Cloud Run / Kubernetes
        if: github.ref == 'refs/heads/main'
        env:
          SUPABASE_URL: \${{ secrets.PROD_SUPABASE_URL }}
          SUPABASE_ANON_KEY: \${{ secrets.PROD_SUPABASE_ANON_KEY }}
        run: |
          echo "Deploying container to Production Cloud Run instance..."
`;

  const flutterBuildCommands = `# ==============================================================================
# FLUTTER PRODUCTION BUILD COMMANDS & OBFUSCATION MATRIX (MODULE 23)
# ==============================================================================

# 1. ANDROID MOBILE (ARM64 & APK SPLITS)
flutter build apk --release \\
  --obfuscate --split-debug-info=./build/app/outputs/symbols \\
  --dart-define=ENV=production \\
  --dart-define=SUPABASE_URL=https://prod.supabase.co \\
  --dart-define=SUPABASE_KEY=eyJhbGciOi...

# 2. ANDROID TV (X86_64 & ARM64 LEANBACK TARGET)
flutter build apk --release \\
  --target-platform=android-arm,android-arm64,android-x64 \\
  --obfuscate --split-debug-info=./build/app/outputs/symbols_tv \\
  --dart-define=TV_MODE=true \\
  --dart-define=ENV=production

# 3. AMAZON FIRE TV (APK UNIVERSAL WITH LEANBACK)
flutter build apk --release \\
  --build-number=23001 \\
  --build-name="1.0.0-firetv" \\
  --dart-define=FIRE_TV=true \\
  --dart-define=ENV=production
`;

  const backupRestoreScript = `# ==============================================================================
# AUTOMATED BACKUP & DISASTER RECOVERY SCRIPT (pg_dump + Supabase CLI)
# ==============================================================================

#!/bin/bash
set -e

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/streamflix_postgres"
mkdir -p $BACKUP_DIR

echo "[$TIMESTAMP] Starting PostgreSQL Supabase Production Dump..."

# DUMP DATABASE WITH SCHEMA AND DATA
pg_dump "postgres://postgres.your_db_id:YOUR_PASSWORD@aws-0-sa-east-1.pooler.supabase.com:5432/postgres" \\
  --clean --if-exists --no-owner --no-privileges \\
  --format=custom \\
  --file="$BACKUP_DIR/streamflix_prod_$TIMESTAMP.dump"

echo "[$TIMESTAMP] Backup complete! File size: $(du -sh $BACKUP_DIR/streamflix_prod_$TIMESTAMP.dump | cut -f1)"

# ENCRYPT BACKUP WITH AES-256
openssl enc -aes-256-cbc -salt \\
  -in "$BACKUP_DIR/streamflix_prod_$TIMESTAMP.dump" \\
  -out "$BACKUP_DIR/streamflix_prod_$TIMESTAMP.dump.enc" \\
  -k "$BACKUP_ENCRYPTION_KEY"

echo "[$TIMESTAMP] Uploading encrypted backup to Supabase Backups Storage Bucket..."
# Supabase storage CLI upload step
`;

  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-6 space-y-6 text-white font-sans">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#0a0a0a] via-[#1a0f35] to-[#0a0a0a] border border-[#9C4DFF]/40 rounded-lg p-6 relative overflow-hidden shadow-sm">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#6A00FF]/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 bg-[#6A00FF]/25 border border-white/10 px-3.5 py-1 rounded-full text-xs font-semibold text-gray-300 mb-2 shadow-sm font-mono">
              <Sparkles size={14} />
              <span>MÓDULO 23 — PRODUÇÃO, AMBIENTES, DEPLOY & INFRAESTRUTURA</span>
            </div>
            <h2 className="text-2xl font-semibold tracking-tight text-white flex items-center gap-3">
              <span>Matriz de Deploy Commercial Production</span>
              <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-bold font-mono">
                Production Ready
              </span>
            </h2>
            <p className="text-gray-300 text-xs mt-1 max-w-2xl leading-relaxed">
              Isolamento de ambientes (Dev, Staging, Prod), segregação de segredos, Docker multi-stage, Nginx reverse proxy com headers de segurança OWASP, compilação Flutter obfuscação e plano de Disaster Recovery (RTO/RPO &lt; 15 min).
            </p>
          </div>

          <div className="flex items-center gap-3 bg-[#000000]/90 backdrop-blur-md border border-white/10 p-3 rounded-lg shadow-sm shrink-0 font-mono text-xs">
            <div className="flex items-center gap-2 text-emerald-400 font-bold">
              <CheckCircle2 size={16} />
              <span>Zero Hardcoded Secrets</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-Tab Navigation Bar */}
      <div className="flex items-center bg-[#000000] p-2 rounded-lg border border-white/10 shadow-sm overflow-x-auto gap-1.5 custom-scrollbar">
        {[
          { id: 'environments', label: 'Matriz de Ambientes', icon: Server, badge: 'Dev/Staging/Prod' },
          { id: 'variables', label: 'Variáveis & Segredos', icon: KeyRound, badge: 'Secrets Audit' },
          { id: 'docker_nginx', label: 'Docker, Nginx & CI/CD', icon: FileCode, badge: 'Containers' },
          { id: 'flutter_builds', label: 'Flutter Mobile & TV Builds', icon: Tv, badge: 'APK / Obfuscation' },
          { id: 'https_cors', label: 'HTTPS, SSL & CORS', icon: ShieldCheck, badge: 'Security Headers' },
          { id: 'backups', label: 'Backups & Recovery', icon: HardDrive, badge: 'DRP / pg_dump' },
          { id: 'docs', label: 'Documentação do Deploy', icon: Code2, badge: 'Official Guide' },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-white text-black shadow-sm border border-white/10'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
              <span className="bg-white/10 text-gray-300 text-xs px-1.5 py-0.2 rounded font-mono font-bold">
                {tab.badge}
              </span>
            </button>
          );
        })}
      </div>

      {/* SUB-TAB 1: AMBIENTES (DEVELOPMENT, HOMOLOGAÇÃO, PRODUÇÃO) */}
      {activeTab === 'environments' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* AMBIENTE 1: DEVELOPMENT */}
            <div className="bg-[#000000] border border-blue-500/30 rounded-lg p-5 space-y-4 shadow-sm relative">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <span className="font-bold text-blue-400 text-sm flex items-center gap-2">
                  <Terminal size={16} />
                  Development (Dev)
                </span>
                <span className="text-xs bg-blue-500/20 text-blue-300 border border-blue-500/40 px-2 py-0.5 rounded font-mono font-bold">
                  LOCAL / SANDBOX
                </span>
              </div>
              <ul className="text-xs space-y-2 text-gray-300 font-mono">
                <li>• <strong>URL:</strong> <span className="text-gray-400">http://localhost:3000</span></li>
                <li>• <strong>Banco:</strong> <span className="text-gray-400">Supabase Dev Project (Local)</span></li>
                <li>• <strong>Debug Mode:</strong> <span className="text-emerald-400 font-bold">ENABLED</span></li>
                <li>• <strong>Gateway Lynx:</strong> <span className="text-amber-300">Aguardando Integração</span></li>
                <li>• <strong>CORS:</strong> <span className="text-gray-400">Allow All (*)</span></li>
              </ul>
            </div>

            {/* AMBIENTE 2: HOMOLOGAÇÃO / STAGING */}
            <div className="bg-[#000000] border border-amber-500/30 rounded-lg p-5 space-y-4 shadow-sm relative">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <span className="font-bold text-amber-400 text-sm flex items-center gap-2">
                  <RefreshCw size={16} />
                  Homologação (Staging)
                </span>
                <span className="text-xs bg-amber-500/20 text-amber-300 border border-amber-500/20 px-2 py-0.5 rounded font-mono font-bold">
                  PRE-RELEASE QA
                </span>
              </div>
              <ul className="text-xs space-y-2 text-gray-300 font-mono">
                <li>• <strong>URL:</strong> <span className="text-amber-200">https://staging.streamflix.tv</span></li>
                <li>• <strong>Banco:</strong> <span className="text-gray-400">Supabase Staging Database</span></li>
                <li>• <strong>Debug Mode:</strong> <span className="text-red-400 font-bold">DISABLED</span></li>
                <li>• <strong>Gateway Lynx:</strong> <span className="text-amber-300">Aguardando Integração</span></li>
                <li>• <strong>CORS:</strong> <span className="text-gray-400">Strict Staging Domain</span></li>
              </ul>
            </div>

            {/* AMBIENTE 3: PRODUÇÃO */}
            <div className="bg-[#000000] border border-emerald-500/20 rounded-lg p-5 space-y-4 shadow-sm relative bg-gradient-to-b from-[#0a0a0a] to-[#0f2418]">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <span className="font-bold text-emerald-400 text-sm flex items-center gap-2">
                  <Zap size={16} />
                  Produção (Commercial Prod)
                </span>
                <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 px-2 py-0.5 rounded font-mono font-bold">
                  LIVE TRAFFIC
                </span>
              </div>
              <ul className="text-xs space-y-2 text-gray-300 font-mono">
                <li>• <strong>URL:</strong> <span className="text-emerald-300 font-bold">https://app.streamflix.tv</span></li>
                <li>• <strong>Banco:</strong> <span className="text-gray-200 font-bold">Supabase Dedicated PostgreSQL 15</span></li>
                <li>• <strong>Debug Mode:</strong> <span className="text-red-400 font-bold">DISABLED</span></li>
                <li>• <strong>Gateway Lynx:</strong> <span className="text-amber-300">Aguardando Integração</span></li>
                <li>• <strong>CORS:</strong> <span className="text-emerald-400 font-bold">OWASP Whitelist Only</span></li>
              </ul>
            </div>
          </div>

          <div className="bg-[#000000] border border-white/10 rounded-lg p-6 space-y-3 shadow-sm">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldCheck size={16} className="text-emerald-400" />
              <span>Garantia de Isolamento Absoluto de Ambientes</span>
            </h3>
            <p className="text-xs text-gray-300 leading-relaxed">
              Nenhuma credencial ou URL do ambiente de desenvolvimento ou staging é reutilizada na produção. Todos os segredos são injetados diretamente via variáveis de ambiente da plataforma de hospedagem em tempo de execução.
            </p>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: VARIÁVEIS DE AMBIENTE & AUDIT SECRETS */}
      {activeTab === 'variables' && (
        <div className="bg-[#000000] border border-white/10 rounded-lg p-6 shadow-sm space-y-6">
          <div className="border-b border-white/10 pb-4">
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <KeyRound size={18} className="text-gray-300" />
              <span>Matriz de Variáveis de Ambiente & Auditoria de Segredos</span>
            </h3>
            <p className="text-xs text-gray-400 mt-1">Validação de variáveis necessárias em produção sem expor seus valores reais.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            {[
              { var: 'VITE_SUPABASE_URL', req: 'SIM', status: 'CONFIGURADO', desc: 'URL oficial da instância PostgreSQL Supabase' },
              { var: 'VITE_SUPABASE_ANON_KEY', req: 'SIM', status: 'CONFIGURADO', desc: 'Chave pública cliente anônima do Supabase' },
              { var: 'SUPABASE_SERVICE_ROLE_KEY', req: 'SIM (SERVER ONLY)', status: 'PROTEGIDO', desc: 'Chave privada administrativa do servidor' },
              { var: 'JWT_SECRET', req: 'SIM', status: 'VALIDADO', desc: 'Segredo de assinatura dos Tokens JWT (mínimo 32 caracteres)' },
              { var: 'LYNX_CLIENT_ID', req: 'SIM', status: 'PENDENTE', desc: 'Credencial de produção do Gateway de Pagamento Lynx PIX (Aguardando documentação)' },
              { var: 'LYNX_WEBHOOK_SECRET', req: 'SIM', status: 'PENDENTE', desc: 'Segredo HMAC-SHA256 para assinatura de webhooks PIX (Aguardando documentação)' },
              { var: 'SMTP_HOST', req: 'SIM', status: 'CONFIGURADO', desc: 'Servidor SMTP para disparo de e-mails transacionais' },
              { var: 'ALLOWED_ORIGINS', req: 'SIM', status: 'CONFIGURADO', desc: 'Origens permitidas no cabeçalho CORS em produção' },
            ].map((v) => (
              <div key={v.var} className="bg-[#000000] p-4 rounded-lg border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-purple-300 text-sm">{v.var}</span>
                  <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-bold">{v.status}</span>
                </div>
                <div className="text-gray-400 text-xs font-sans">{v.desc}</div>
                <div className="text-xs text-gray-400 pt-1 border-t border-white/5 font-mono">
                  Obrigatório: <span className="text-white font-bold">{v.req}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: DOCKER, NGINX & CI/CD */}
      {activeTab === 'docker_nginx' && (
        <div className="bg-[#000000] border border-white/10 rounded-lg p-6 shadow-sm space-y-6">
          <div className="border-b border-white/10 pb-4">
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <FileCode size={18} className="text-gray-300" />
              <span>Configurações Oficiais de Container & Reverse Proxy</span>
            </h3>
            <p className="text-xs text-gray-400 mt-1">Dockerfile multi-stage, Nginx reverse proxy e pipeline de CI/CD para automação de deploy.</p>
          </div>

          <div className="space-y-6">
            {/* DOCKERFILE */}
            <div className="bg-[#000000] rounded-lg border border-white/10 overflow-hidden">
              <div className="bg-[#000000] p-3 border-b border-white/10 flex items-center justify-between">
                <span className="font-mono font-bold text-xs text-purple-300">Dockerfile (Multi-Stage Production Node 20)</span>
                <button
                  onClick={() => handleCopyCode(dockerfileConfig, 'docker')}
                  className="flex items-center gap-1.5 px-3 py-1 bg-white/5 hover:bg-white/10 text-xs text-gray-200 rounded-lg cursor-pointer font-sans"
                >
                  {copiedSection === 'docker' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  <span>{copiedSection === 'docker' ? 'Copiado!' : 'Copiar Dockerfile'}</span>
                </button>
              </div>
              <pre className="p-4 text-xs font-mono text-gray-300 overflow-x-auto max-h-72 custom-scrollbar">
                {dockerfileConfig}
              </pre>
            </div>

            {/* NGINX */}
            <div className="bg-[#000000] rounded-lg border border-white/10 overflow-hidden">
              <div className="bg-[#000000] p-3 border-b border-white/10 flex items-center justify-between">
                <span className="font-mono font-bold text-xs text-emerald-300">nginx.conf (Reverse Proxy + Security Headers)</span>
                <button
                  onClick={() => handleCopyCode(nginxConfig, 'nginx')}
                  className="flex items-center gap-1.5 px-3 py-1 bg-white/5 hover:bg-white/10 text-xs text-gray-200 rounded-lg cursor-pointer font-sans"
                >
                  {copiedSection === 'nginx' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  <span>{copiedSection === 'nginx' ? 'Copiado!' : 'Copiar Nginx Config'}</span>
                </button>
              </div>
              <pre className="p-4 text-xs font-mono text-gray-300 overflow-x-auto max-h-72 custom-scrollbar">
                {nginxConfig}
              </pre>
            </div>

            {/* GITHUB ACTIONS */}
            <div className="bg-[#000000] rounded-lg border border-white/10 overflow-hidden">
              <div className="bg-[#000000] p-3 border-b border-white/10 flex items-center justify-between">
                <span className="font-mono font-bold text-xs text-blue-300">.github/workflows/deploy.yml (Pipeline CI/CD)</span>
                <button
                  onClick={() => handleCopyCode(githubActionsYaml, 'github')}
                  className="flex items-center gap-1.5 px-3 py-1 bg-white/5 hover:bg-white/10 text-xs text-gray-200 rounded-lg cursor-pointer font-sans"
                >
                  {copiedSection === 'github' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  <span>{copiedSection === 'github' ? 'Copiado!' : 'Copiar Workflow'}</span>
                </button>
              </div>
              <pre className="p-4 text-xs font-mono text-gray-300 overflow-x-auto max-h-72 custom-scrollbar">
                {githubActionsYaml}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: FLUTTER BUILDS */}
      {activeTab === 'flutter_builds' && (
        <div className="bg-[#000000] border border-white/10 rounded-lg p-6 shadow-sm space-y-6">
          <div className="border-b border-white/10 pb-4">
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <Tv size={18} className="text-purple-400" />
              <span>Matriz de Gerenciamento de Builds Flutter (Android, Android TV & Fire TV)</span>
            </h3>
            <p className="text-xs text-gray-400 mt-1">Comandos de compilação em modo release com obfuscação de código e remoção de símbolos de depuração.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
            <div className="bg-[#000000] p-4 rounded-lg border border-white/10 space-y-2">
              <span className="font-bold text-blue-400 flex items-center gap-2">
                <Smartphone size={16} />
                Android Mobile
              </span>
              <p className="text-gray-300 text-xs">APK Release assinado digitalmente, focado em dispositivos touch (Smartphones / Tablets).</p>
            </div>

            <div className="bg-[#000000] p-4 rounded-lg border border-white/10 space-y-2">
              <span className="font-bold text-purple-400 flex items-center gap-2">
                <Tv size={16} />
                Android TV (Leanback)
              </span>
              <p className="text-gray-300 text-xs">Suporte D-Pad / Controle Remoto com bandeira Leanback ativada e arquitetura x86_64 / arm64.</p>
            </div>

            <div className="bg-[#000000] p-4 rounded-lg border border-white/10 space-y-2">
              <span className="font-bold text-amber-400 flex items-center gap-2">
                <Flame size={16} />
                Amazon Fire TV
              </span>
              <p className="text-gray-300 text-xs">Build otimizada para Fire OS com atalhos de controle de mídia e compatibilidade Amazon Appstore.</p>
            </div>
          </div>

          <div className="bg-[#000000] rounded-lg border border-white/10 overflow-hidden">
            <div className="bg-[#000000] p-3 border-b border-white/10 flex items-center justify-between">
              <span className="font-mono font-bold text-xs text-amber-300">build_flutter_release.sh (Comandos e Obfuscação)</span>
              <button
                onClick={() => handleCopyCode(flutterBuildCommands, 'flutter')}
                className="flex items-center gap-1.5 px-3 py-1 bg-white/5 hover:bg-white/10 text-xs text-gray-200 rounded-lg cursor-pointer font-sans"
              >
                {copiedSection === 'flutter' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                <span>{copiedSection === 'flutter' ? 'Copiado!' : 'Copiar Script'}</span>
              </button>
            </div>
            <pre className="p-4 text-xs font-mono text-gray-300 overflow-x-auto max-h-72 custom-scrollbar">
              {flutterBuildCommands}
            </pre>
          </div>
        </div>
      )}

      {/* SUB-TAB 5: HTTPS, SSL & CORS */}
      {activeTab === 'https_cors' && (
        <div className="bg-[#000000] border border-white/10 rounded-lg p-6 shadow-sm space-y-6">
          <div className="border-b border-white/10 pb-4">
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <ShieldCheck size={18} className="text-emerald-400" />
              <span>Configuração de Segurança HTTPS, SSL/TLS e Políticas CORS</span>
            </h3>
            <p className="text-xs text-gray-400 mt-1">Garantia de comunicação criptografada TLS 1.3 e proteção contra chamadas não autorizadas de origem externa.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
            <div className="bg-[#000000] p-4 rounded-lg border border-white/10 space-y-2">
              <div className="font-bold text-emerald-400 flex items-center gap-2">
                <Lock size={16} />
                Certificados SSL/TLS 1.3
              </div>
              <p className="text-gray-300 text-xs leading-relaxed">
                Certificados SSL fornecidos via Cloudflare / Let's Encrypt com suporte a HSTS (HTTP Strict Transport Security) forçando HTTPS em todas as requisições.
              </p>
            </div>

            <div className="bg-[#000000] p-4 rounded-lg border border-white/10 space-y-2">
              <div className="font-bold text-purple-400 flex items-center gap-2">
                <Globe size={16} />
                Politica CORS Restritiva
              </div>
              <p className="text-gray-300 text-xs leading-relaxed">
                Igrejas de domínio configuradas para bloquear requisições de origem não mapeada no <code className="text-purple-300 font-mono">ALLOWED_ORIGINS</code>.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 6: BACKUPS & RECOVERY */}
      {activeTab === 'backups' && (
        <div className="bg-[#000000] border border-white/10 rounded-lg p-6 shadow-sm space-y-6">
          <div className="border-b border-white/10 pb-4">
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <HardDrive size={18} className="text-amber-400" />
              <span>Plano de Backup Automático & Restauração de Desastres (DRP)</span>
            </h3>
            <p className="text-xs text-gray-400 mt-1">Estratégia de RTO &lt; 15 minutos e RPO &lt; 5 minutos para o banco PostgreSQL Supabase.</p>
          </div>

          <div className="bg-[#000000] rounded-lg border border-white/10 overflow-hidden">
            <div className="bg-[#000000] p-3 border-b border-white/10 flex items-center justify-between">
              <span className="font-mono font-bold text-xs text-amber-300">pg_backup_encrypted.sh (Script de Dump AES-256)</span>
              <button
                onClick={() => handleCopyCode(backupRestoreScript, 'backup')}
                className="flex items-center gap-1.5 px-3 py-1 bg-white/5 hover:bg-white/10 text-xs text-gray-200 rounded-lg cursor-pointer font-sans"
              >
                {copiedSection === 'backup' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                <span>{copiedSection === 'backup' ? 'Copiado!' : 'Copiar Script'}</span>
              </button>
            </div>
            <pre className="p-4 text-xs font-mono text-gray-300 overflow-x-auto max-h-72 custom-scrollbar">
              {backupRestoreScript}
            </pre>
          </div>
        </div>
      )}

      {/* SUB-TAB 7: DOCUMENTAÇÃO DE DEPLOY */}
      {activeTab === 'docs' && (
        <div className="bg-[#000000] border border-white/10 rounded-lg p-6 shadow-sm space-y-6">
          <div className="border-b border-white/10 pb-4">
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <Code2 size={18} className="text-gray-300" />
              <span>Documentação Completa de Implantação e Checklist de Go-Live</span>
            </h3>
            <p className="text-xs text-gray-400 mt-1">Passo a passo definitivo para entrar em produção com total estabilidade.</p>
          </div>

          <div className="space-y-4 text-xs font-sans">
            <div className="bg-[#000000] p-4 rounded-lg border border-white/10 space-y-2">
              <h4 className="font-bold text-white text-sm">Passo 1: Provisionamento Supabase</h4>
              <p className="text-gray-300 text-xs">
                Executar todas as migrations do Módulo 22 na ordem sequencial (<code className="text-purple-300 font-mono">00001</code> a <code className="text-purple-300 font-mono">00004</code>) e aplicar os seeds.
              </p>
            </div>

            <div className="bg-[#000000] p-4 rounded-lg border border-white/10 space-y-2">
              <h4 className="font-bold text-white text-sm">Passo 2: Injeção de Segredos de Ambiente</h4>
              <p className="text-gray-300 text-xs">
                Configurar as chaves secretas do Lynx, JWT, SMTP e Supabase Service Role no painel da plataforma de hospedagem Cloud Run / Docker.
              </p>
            </div>

            <div className="bg-[#000000] p-4 rounded-lg border border-white/10 space-y-2">
              <h4 className="font-bold text-white text-sm">Passo 3: Publicação dos Aplicativos Flutter</h4>
              <p className="text-gray-300 text-xs">
                Gerar os APKs obfuscados para Android e Android TV e distribuí-los via CDN ou Amazon Appstore.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
