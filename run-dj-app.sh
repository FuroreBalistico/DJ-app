#!/bin/bash
# DJ-App Quick Launcher per Linux/macOS
# Questo script bash è una alternativa semplice allo script Python

set -e

# Colori per output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configurazione
REPO_URL="https://github.com/FuroreBalistico/DJ-app.git"
BRANCH="main"
PROJECT_DIR="DJ-app-clone"
PORT=8000

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}🎧 DJ-App Quick Launcher${NC}"
echo -e "${BLUE}========================================${NC}"

# Funzione per clonare il repository
clone_repo() {
    echo -e "\n${YELLOW}📦 Clonazione repository...${NC}"

    if [ -d "$PROJECT_DIR" ]; then
        echo -e "${YELLOW}⚠️  La cartella '$PROJECT_DIR' esiste già.${NC}"
        read -p "Vuoi eliminarla e clonare di nuovo? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            rm -rf "$PROJECT_DIR"
            echo -e "${GREEN}🗑️  Cartella eliminata.${NC}"
        else
            echo -e "${GREEN}✅ Uso la cartella esistente.${NC}"
            return 0
        fi
    fi

    if git clone -b "$BRANCH" "$REPO_URL" "$PROJECT_DIR"; then
        echo -e "${GREEN}✅ Repository clonato con successo!${NC}"
    else
        echo -e "${RED}❌ Errore durante la clonazione.${NC}"
        exit 1
    fi
}

# Funzione per avviare il server
start_server() {
    echo -e "\n${YELLOW}🚀 Avvio server HTTP sulla porta $PORT...${NC}"
    echo -e "${BLUE}📂 Directory: $(pwd)/$PROJECT_DIR/src${NC}"
    echo -e "${BLUE}🌐 URL: http://localhost:$PORT${NC}"
    echo -e "\n${YELLOW}⚡ Premi Ctrl+C per fermare il server${NC}\n"

    # Naviga nella directory src
    cd "$PROJECT_DIR/src" || exit 1

    # Apri il browser (differente per macOS e Linux)
    sleep 2
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        open "http://localhost:$PORT" &
    else
        # Linux
        xdg-open "http://localhost:$PORT" &
    fi

    echo -e "${GREEN}🌍 Browser aperto!${NC}\n"
    echo -e "${BLUE}========================================${NC}"
    echo -e "${GREEN}✨ DJ-App è ora in esecuzione!${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo -e "\n💡 Consigli:"
    echo -e "   • Carica una traccia audio cliccando 'Load'"
    echo -e "   • Usa 'Tap Tempo' per rilevare i BPM"
    echo -e "   • Prova i nuovi tasti Cue, Sync e FX!\n"

    # Avvia il server
    python3 -m http.server "$PORT"
}

# Main
if [ "$1" == "--clone" ]; then
    clone_repo
fi

if [ ! -d "$PROJECT_DIR" ]; then
    echo -e "${RED}❌ Directory '$PROJECT_DIR' non trovata.${NC}"
    echo -e "${YELLOW}   Usa: $0 --clone${NC}"
    exit 1
fi

if [ ! -d "$PROJECT_DIR/src" ]; then
    echo -e "${RED}❌ Directory 'src' non trovata in $PROJECT_DIR${NC}"
    exit 1
fi

start_server
