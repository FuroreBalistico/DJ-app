#!/usr/bin/env python3
"""
DJ-App Auto Launcher
====================
Script di automazione per clonare, avviare e testare il DJ-App.

Uso:
    python3 run-dj-app.py           # Avvia il server e apre il browser
    python3 run-dj-app.py --clone   # Clona prima il repository, poi avvia
    python3 run-dj-app.py --help    # Mostra questo messaggio

Requisiti:
    - Python 3.6+
    - Git (per clonare il repository)
"""

import subprocess
import webbrowser
import time
import os
import sys
import argparse
from pathlib import Path


class DJAppLauncher:
    def __init__(self, repo_url="https://github.com/FuroreBalistico/DJ-app.git", branch="main"):
        self.repo_url = repo_url
        self.branch = branch
        self.project_dir = Path("DJ-app-clone")
        self.server_port = 8000

    def clone_repository(self):
        """Clona il repository da GitHub"""
        print(f"📦 Clonazione repository da {self.repo_url}...")

        if self.project_dir.exists():
            print(f"⚠️  La cartella '{self.project_dir}' esiste già.")
            response = input("Vuoi eliminarla e clonare di nuovo? (y/N): ")
            if response.lower() == 'y':
                import shutil
                shutil.rmtree(self.project_dir)
                print("🗑️  Cartella eliminata.")
            else:
                print("✅ Uso la cartella esistente.")
                return True

        try:
            # Clona il repository
            result = subprocess.run(
                ["git", "clone", "-b", self.branch, self.repo_url, str(self.project_dir)],
                capture_output=True,
                text=True,
                check=True
            )
            print(f"✅ Repository clonato con successo in '{self.project_dir}'")
            return True
        except subprocess.CalledProcessError as e:
            print(f"❌ Errore durante la clonazione: {e}")
            print(f"Output: {e.stderr}")
            return False
        except FileNotFoundError:
            print("❌ Git non trovato. Installa git prima di continuare.")
            print("   Ubuntu/Debian: sudo apt install git")
            print("   macOS: brew install git")
            return False

    def check_src_directory(self):
        """Verifica che esista la directory src"""
        src_path = self.project_dir / "src"
        if not src_path.exists():
            print(f"❌ Directory 'src' non trovata in {self.project_dir}")
            print("   Assicurati che il repository contenga la cartella src/")
            return False
        return True

    def start_server(self):
        """Avvia il server HTTP Python"""
        src_path = self.project_dir / "src"

        print(f"\n🚀 Avvio server HTTP sulla porta {self.server_port}...")
        print(f"📂 Directory: {src_path.absolute()}")
        print(f"🌐 URL: http://localhost:{self.server_port}")
        print("\n⚡ Premi Ctrl+C per fermare il server\n")

        try:
            # Avvia il server nella directory src
            process = subprocess.Popen(
                ["python3", "-m", "http.server", str(self.server_port)],
                cwd=str(src_path),
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )

            # Aspetta un momento per far partire il server
            time.sleep(2)

            # Verifica che il server sia ancora attivo
            if process.poll() is not None:
                stderr = process.stderr.read()
                print(f"❌ Il server si è fermato inaspettatamente: {stderr}")
                return None

            return process

        except FileNotFoundError:
            print("❌ Python 3 non trovato. Installa Python 3 prima di continuare.")
            return None
        except Exception as e:
            print(f"❌ Errore durante l'avvio del server: {e}")
            return None

    def open_browser(self):
        """Apre il browser all'indirizzo del DJ-App"""
        url = f"http://localhost:{self.server_port}"
        print(f"🌍 Apertura browser su {url}...")

        try:
            webbrowser.open(url)
            print("✅ Browser aperto!")
        except Exception as e:
            print(f"⚠️  Impossibile aprire il browser automaticamente: {e}")
            print(f"   Apri manualmente: {url}")

    def run(self, should_clone=False):
        """Esegue il processo completo di setup e avvio"""
        print("=" * 60)
        print("🎧 DJ-App Auto Launcher")
        print("=" * 60)

        # Clona il repository se richiesto
        if should_clone:
            if not self.clone_repository():
                return False
        else:
            if not self.project_dir.exists():
                print(f"❌ Directory '{self.project_dir}' non trovata.")
                print("   Usa --clone per clonare il repository.")
                return False

        # Verifica la struttura del progetto
        if not self.check_src_directory():
            return False

        # Avvia il server
        server_process = self.start_server()
        if not server_process:
            return False

        # Apri il browser
        self.open_browser()

        try:
            # Mantieni il server attivo
            print("\n" + "=" * 60)
            print("✨ DJ-App è ora in esecuzione!")
            print("=" * 60)
            print("\n💡 Consigli:")
            print("   • Carica una traccia audio cliccando 'Load'")
            print("   • Usa 'Tap Tempo' per rilevare i BPM")
            print("   • Prova i nuovi tasti Cue, Sync e FX!")
            print("\n")

            # Aspetta fino a Ctrl+C
            server_process.wait()

        except KeyboardInterrupt:
            print("\n\n🛑 Arresto del server...")
            server_process.terminate()
            server_process.wait()
            print("✅ Server fermato. Arrivederci!")

        return True


def main():
    # Parser argomenti
    parser = argparse.ArgumentParser(
        description="DJ-App Auto Launcher - Automatizza clone, avvio e test del DJ-App",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Esempi:
  %(prog)s                    Avvia il server nella cartella esistente
  %(prog)s --clone            Clona il repository e avvia
  %(prog)s --repo URL         Usa un repository personalizzato
  %(prog)s --branch dev       Usa un branch specifico
  %(prog)s --port 3000        Usa una porta diversa
        """
    )

    parser.add_argument(
        '--clone',
        action='store_true',
        help='Clona il repository prima di avviare'
    )

    parser.add_argument(
        '--repo',
        default='https://github.com/FuroreBalistico/DJ-app.git',
        help='URL del repository (default: %(default)s)'
    )

    parser.add_argument(
        '--branch',
        default='main',
        help='Branch da clonare (default: %(default)s)'
    )

    parser.add_argument(
        '--port',
        type=int,
        default=8000,
        help='Porta del server HTTP (default: %(default)s)'
    )

    args = parser.parse_args()

    # Crea il launcher
    launcher = DJAppLauncher(repo_url=args.repo, branch=args.branch)
    launcher.server_port = args.port

    # Esegui
    success = launcher.run(should_clone=args.clone)

    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
