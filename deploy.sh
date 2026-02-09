#!/bin/bash
# VINCITORE 98 MOBILE - Deploy Script
# Supporta: Netlify, GitHub Pages, Vercel

set -e

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║  📱 VINCITORE 98 MOBILE - Deploy Automatico                 ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Colori
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Directory app
APP_DIR="mobile-app"

# Verifica esistenza directory
if [ ! -d "$APP_DIR" ]; then
    echo -e "${RED}❌ Errore: Directory $APP_DIR non trovata!${NC}"
    exit 1
fi

echo "✅ Directory app trovata"
echo ""

# Menu scelta deploy
echo "Scegli metodo deploy:"
echo ""
echo "  1) 🌐 Netlify (Raccomandato - Gratis)"
echo "  2) 📘 GitHub Pages (Gratis)"
echo "  3) ⚡ Vercel (Gratis)"
echo "  4) 🧪 Test Locale (HTTP Server)"
echo ""
read -p "Scelta [1-4]: " choice

case $choice in
    1)
        echo ""
        echo "🌐 Deploy su Netlify"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        
        # Verifica Netlify CLI
        if ! command -v netlify &> /dev/null; then
            echo -e "${YELLOW}📦 Installazione Netlify CLI...${NC}"
            npm install -g netlify-cli
        fi
        
        echo ""
        echo "🚀 Avvio deploy..."
        cd "$APP_DIR"
        
        # Login Netlify (se necessario)
        if ! netlify status &> /dev/null; then
            echo "🔐 Login richiesto..."
            netlify login
        fi
        
        # Deploy
        netlify deploy --prod --dir=.
        
        echo ""
        echo -e "${GREEN}✅ Deploy completato!${NC}"
        echo ""
        echo "📱 Apri URL dal telefono e installa l'app"
        ;;
        
    2)
        echo ""
        echo "📘 Deploy su GitHub Pages"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        
        # Verifica Git
        if ! command -v git &> /dev/null; then
            echo -e "${RED}❌ Git non installato!${NC}"
            exit 1
        fi
        
        read -p "Nome repository GitHub: " repo_name
        read -p "Username GitHub: " github_user
        
        cd "$APP_DIR"
        
        # Init Git
        if [ ! -d ".git" ]; then
            echo "📦 Inizializzazione Git..."
            git init
            git add .
            git commit -m "Initial commit - Vincitore 98 Mobile"
        fi
        
        # Add remote
        git remote add origin "https://github.com/$github_user/$repo_name.git" 2>/dev/null || true
        
        # Push
        echo "🚀 Push su GitHub..."
        git branch -M main
        git push -u origin main
        
        echo ""
        echo -e "${GREEN}✅ Codice pushato su GitHub!${NC}"
        echo ""
        echo "📝 PROSSIMI PASSI:"
        echo "  1. Vai su https://github.com/$github_user/$repo_name/settings/pages"
        echo "  2. Source: 'Deploy from a branch'"
        echo "  3. Branch: main / (root)"
        echo "  4. Save"
        echo "  5. Attendi 2 minuti"
        echo "  6. URL: https://$github_user.github.io/$repo_name/"
        ;;
        
    3)
        echo ""
        echo "⚡ Deploy su Vercel"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        
        # Verifica Vercel CLI
        if ! command -v vercel &> /dev/null; then
            echo -e "${YELLOW}📦 Installazione Vercel CLI...${NC}"
            npm install -g vercel
        fi
        
        echo ""
        echo "🚀 Avvio deploy..."
        cd "$APP_DIR"
        
        # Deploy
        vercel --prod
        
        echo ""
        echo -e "${GREEN}✅ Deploy completato!${NC}"
        ;;
        
    4)
        echo ""
        echo "🧪 Test Locale"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        
        cd "$APP_DIR"
        
        # Trova Python o Node.js
        if command -v python3 &> /dev/null; then
            echo "🐍 Server Python su http://localhost:8000"
            echo ""
            echo "📱 Apri dal telefono: http://$(hostname -I | awk '{print $1}'):8000"
            echo ""
            python3 -m http.server 8000
        elif command -v node &> /dev/null; then
            echo "📦 Installazione serve..."
            npx serve -p 8000
        else
            echo -e "${RED}❌ Né Python né Node.js trovati!${NC}"
            exit 1
        fi
        ;;
        
    *)
        echo -e "${RED}❌ Scelta non valida${NC}"
        exit 1
        ;;
esac

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}🎊 DEPLOY COMPLETATO!${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
