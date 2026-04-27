#!/bin/bash
# Monitora a pasta videos/ e faz upload automático para o GitHub via Git LFS
# Pré-requisito: brew install fswatch

REPO_PATH="/Users/useradmin/Desktop/claude-code"
VIDEOS_PATH="$REPO_PATH/videos"

if ! command -v fswatch &>/dev/null; then
    echo "Erro: fswatch não está instalado. Rode: brew install fswatch"
    exit 1
fi

echo "[$(date '+%H:%M:%S')] Monitorando $VIDEOS_PATH por novos vídeos..."

fswatch -0 \
    --event Created \
    --event MovedTo \
    --exclude ".*/transcricoes/.*" \
    --exclude ".*\.gitkeep" \
    "$VIDEOS_PATH" | while IFS= read -r -d "" file; do

    ext="${file##*.}"
    ext=$(echo "$ext" | tr '[:upper:]' '[:lower:]')

    if [[ "$ext" =~ ^(mp4|mov|mkv|avi|webm)$ ]]; then
        filename=$(basename "$file")
        echo "[$(date '+%H:%M:%S')] Novo vídeo detectado: $filename"
        echo "[$(date '+%H:%M:%S')] Aguardando cópia completa do arquivo..."
        sleep 5

        cd "$REPO_PATH" || exit 1

        git add "videos/$filename"
        git commit -m "add: video $filename"
        git push -u origin main

        if [ $? -eq 0 ]; then
            echo "[$(date '+%H:%M:%S')] Upload concluído: $filename"
        else
            echo "[$(date '+%H:%M:%S')] Erro no upload: $filename"
        fi
    fi
done
