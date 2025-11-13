# 🚀 DJ-App Auto Launcher

Script di automazione per avviare rapidamente il DJ-App senza dover digitare comandi manualmente.

## 📋 Requisiti

- **Python 3.6+** (per lo script Python)
- **Git** (solo se vuoi clonare il repository)
- **Browser web** moderno (Chrome, Firefox, Safari, Edge)

## 🎯 Script Disponibili

### 1. **Python Script** (Consigliato) - `run-dj-app.py`

Lo script più completo e cross-platform.

**Caratteristiche:**
- ✅ Funziona su Windows, Linux e macOS
- ✅ Opzioni avanzate tramite argomenti
- ✅ Gestione automatica errori
- ✅ Help integrato

**Uso base:**
```bash
# Avvia il server (directory deve già esistere)
python3 run-dj-app.py

# Clona il repository e avvia
python3 run-dj-app.py --clone

# Mostra tutte le opzioni disponibili
python3 run-dj-app.py --help
```

**Opzioni avanzate:**
```bash
# Usa un branch specifico
python3 run-dj-app.py --clone --branch develop

# Usa una porta diversa
python3 run-dj-app.py --port 3000

# Repository personalizzato
python3 run-dj-app.py --clone --repo https://github.com/TuoUsername/DJ-app.git
```

---

### 2. **Bash Script** (Linux/macOS) - `run-dj-app.sh`

Script shell semplice e veloce per sistemi Unix.

**Uso:**
```bash
# Avvia il server
./run-dj-app.sh

# Clona e avvia
./run-dj-app.sh --clone
```

**Prima esecuzione:**
```bash
chmod +x run-dj-app.sh  # Rendi eseguibile
./run-dj-app.sh --clone  # Clona e avvia
```

---

### 3. **Batch Script** (Windows) - `run-dj-app.bat`

Script per Windows con interfaccia colorata.

**Uso:**
```cmd
REM Doppio click sul file, oppure da CMD:
run-dj-app.bat

REM Per clonare prima
run-dj-app.bat --clone
```

---

## 📖 Guida Passo-Passo

### Prima Volta (Con Clone)

**Linux/macOS:**
```bash
# 1. Scarica lo script
wget https://raw.githubusercontent.com/FuroreBalistico/DJ-app/main/run-dj-app.py

# 2. Esegui con opzione --clone
python3 run-dj-app.py --clone

# 3. Aspetta che il browser si apra automaticamente!
```

**Windows:**
```cmd
REM 1. Scarica run-dj-app.bat dal repository
REM 2. Doppio click sul file
REM 3. Scegli "Y" per clonare
REM 4. Il browser si aprirà automaticamente!
```

### Esecuzioni Successive

Basta eseguire lo script senza `--clone`:

```bash
# Linux/macOS
python3 run-dj-app.py

# Windows
run-dj-app.bat
```

---

## 🔧 Cosa Fa lo Script?

1. **🔍 Verifica Requirements**
   - Controlla che Python sia installato
   - Verifica che Git sia disponibile (se usi --clone)

2. **📦 Clona il Repository** (opzionale)
   - Scarica il codice da GitHub
   - Salva in cartella `DJ-app-clone`
   - Gestisce cartelle esistenti

3. **🚀 Avvia il Server**
   - Server HTTP Python sulla porta 8000
   - Serve i file dalla directory `src/`
   - Output colorato per facile lettura

4. **🌍 Apre il Browser**
   - Apre automaticamente http://localhost:8000
   - Funziona con browser predefinito

5. **📊 Monitora il Server**
   - Mantiene il server attivo
   - Mostra log delle richieste
   - Termina pulitamente con Ctrl+C

---

## 🎨 Output dello Script

```
============================================================
🎧 DJ-App Auto Launcher
============================================================

📦 Clonazione repository da https://github.com/...
✅ Repository clonato con successo in 'DJ-app-clone'

🚀 Avvio server HTTP sulla porta 8000...
📂 Directory: /path/to/DJ-app-clone/src
🌐 URL: http://localhost:8000

⚡ Pressi Ctrl+C per fermare il server

🌍 Apertura browser su http://localhost:8000...
✅ Browser aperto!

============================================================
✨ DJ-App è ora in esecuzione!
============================================================

💡 Consigli:
   • Carica una traccia audio cliccando 'Load'
   • Usa 'Tap Tempo' per rilevare i BPM
   • Prova i nuovi tasti Cue, Sync e FX!

Serving HTTP on 0.0.0.0 port 8000 (http://0.0.0.0:8000/) ...
```

---

## ⚙️ Configurazione

Puoi modificare le variabili all'inizio degli script:

**Python (`run-dj-app.py`):**
```python
# Nell'argparse defaults
--repo default='https://github.com/FuroreBalistico/DJ-app.git'
--branch default='main'
--port default=8000
```

**Bash (`run-dj-app.sh`):**
```bash
REPO_URL="https://github.com/FuroreBalistico/DJ-app.git"
BRANCH="main"
PORT=8000
```

**Batch (`run-dj-app.bat`):**
```batch
set REPO_URL=https://github.com/FuroreBalistico/DJ-app.git
set BRANCH=main
set PORT=8000
```

---

## 🐛 Troubleshooting

### Python non trovato
```bash
# Ubuntu/Debian
sudo apt install python3

# macOS
brew install python3

# Windows
# Scarica da https://python.org
```

### Git non trovato
```bash
# Ubuntu/Debian
sudo apt install git

# macOS
brew install git

# Windows
# Scarica da https://git-scm.com
```

### Porta già in uso
```bash
# Usa una porta diversa
python3 run-dj-app.py --port 3000
```

### Browser non si apre
Apri manualmente: http://localhost:8000

---

## 🎯 Esempi d'Uso Comuni

**Sviluppo locale:**
```bash
# Clona e testa rapidamente
python3 run-dj-app.py --clone
```

**Test su branch specifico:**
```bash
# Testa un feature branch
python3 run-dj-app.py --clone --branch feature/new-effects
```

**Demo per cliente:**
```bash
# Porta personalizzata per evitare conflitti
python3 run-dj-app.py --port 9000
```

**CI/CD Testing:**
```bash
# Automated testing script
python3 run-dj-app.py --clone --branch $CI_BRANCH
# ... run tests ...
# Ctrl+C per terminare
```

---

## 📝 Note

- **Performance**: Il server Python è adatto per sviluppo/testing, non per produzione
- **Firewall**: Potresti dover permettere Python nelle impostazioni firewall
- **CORS**: Non ci sono problemi CORS perché tutto è servito dalla stessa origin
- **Hot Reload**: Per vedere le modifiche, ricarica la pagina (F5)

---

## 🔗 Link Utili

- [Repository GitHub](https://github.com/FuroreBalistico/DJ-app)
- [Documentazione Python http.server](https://docs.python.org/3/library/http.server.html)
- [Segnala Bug](https://github.com/FuroreBalistico/DJ-app/issues)

---

## 🤝 Contribuire

Se migliori gli script, crea una Pull Request!

```bash
git checkout -b feature/launcher-improvements
# ... fai modifiche ...
git commit -m "Migliora launcher script"
git push origin feature/launcher-improvements
```

---

**Buon DJing! 🎧🎵**
