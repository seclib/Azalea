#!/bin/bash
# Script de renommage complet: Enki AI -> Enki AI
# Usage: bash scripts/rename-to-enki.sh

set -e

echo "🚀 Démarrage du renommage: Enki AI -> Enki AI"
echo ""

# Couleurs pour output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Compteur
FILES_MODIFIED=0

# Fonction de remplacement sécurisé
replace_in_file() {
    local file=$1
    local search=$2
    local replace=$3
    
    if [ -f "$file" ]; then
        # Vérifier si le fichier contient la chaîne à remplacer
        if grep -q "$search" "$file" 2>/dev/null; then
            # Créer un backup
            cp "$file" "${file}.bak"
            # Remplacer (cas sensible)
            sed -i "s/$search/$replace/g" "$file"
            echo -e "${GREEN}✓${NC} $file"
            FILES_MODIFIED=$((FILES_MODIFIED + 1))
        fi
    fi
}

# Fonction pour fichiers JSON (gestion spéciale des guillemets)
replace_in_json() {
    local file=$1
    local search=$2
    local replace=$3
    
    if [ -f "$file" ]; then
        if grep -q "\"$search\"" "$file" 2>/dev/null; then
            cp "$file" "${file}.bak"
            sed -i "s/\"$search\"/\"$replace\"/g" "$file"
            echo -e "${GREEN}✓${NC} $file"
            FILES_MODIFIED=$((FILES_MODIFIED + 1))
        fi
    fi
}

echo "📦 Étape 1: Mise à jour des package.json..."
echo ""

# package.json racine
if [ -f "package.json" ]; then
    replace_in_json "package.json" "Enki AI" "Enki AI"
    replace_in_json "package.json" "enki" "enki"
fi

# Tous les package.json du projet
find . -name "package.json" -type f | while read file; do
    # Skip node_modules
    if [[ "$file" == *"node_modules"* ]]; then
        continue
    fi
    
    replace_in_json "$file" "Enki AI" "Enki AI"
    replace_in_json "$file" "enki" "enki"
done

echo ""
echo "📄 Étape 2: Mise à jour de la documentation..."
echo ""

# Fichiers markdown
find . -name "*.md" -type f | grep -v node_modules | grep -v ".git" | while read file; do
    replace_in_file "$file" "Enki AI" "Enki AI"
    replace_in_file "$file" "enki" "enki"
done

echo ""
echo "💻 Étape 3: Mise à jour du code source..."
echo ""

# Fichiers TypeScript
find . -name "*.ts" -o -name "*.tsx" | grep -v node_modules | grep -v ".git" | grep -v "*.bak" | while read file; do
    replace_in_file "$file" "Enki AI" "Enki AI"
    replace_in_file "$file" "enki" "enki"
done

echo ""
echo "⚙️  Étape 4: Mise à jour des configurations..."
echo ""

# Fichiers JSON (hors node_modules)
find . -name "*.json" -type f | grep -v node_modules | grep -v ".git" | grep -v "*.bak" | while read file; do
    replace_in_json "$file" "Enki AI" "Enki AI"
    replace_in_json "$file" "enki" "enki"
done

echo ""
echo "🔧 Étape 5: Mise à jour des scripts shell..."
echo ""

# Fichiers shell
find . -name "*.sh" -type f | grep -v node_modules | grep -v ".git" | while read file; do
    replace_in_file "$file" "Enki AI" "Enki AI"
    replace_in_file "$file" "enki" "enki"
done

echo ""
echo "🎨 Étape 6: Renommage des fichiers et dossiers..."
echo ""

# Renommer les fichiers contenant "enki" ou "Enki AI"
find . -depth -name "*enki*" -o -name "*Enki AI*" | grep -v node_modules | grep -v ".git" | grep -v ".bak" | while read file; do
    # Skip le dossier .enki (contient des skills)
    if [[ "$file" == ./.enki* ]]; then
        continue
    fi
    
    # Nouveau nom
    newname=$(echo "$file" | sed 's/enki/enki/g; s/Enki AI/Enki/g')
    
    if [ "$file" != "$newname" ]; then
        echo -e "${YELLOW}Renommage:${NC} $file -> $newname"
        mv "$file" "$newname"
        FILES_MODIFIED=$((FILES_MODIFIED + 1))
    fi
done

echo ""
echo "🧹 Étape 7: Nettoyage des backups..."
echo ""

# Supprimer les fichiers .bak
find . -name "*.bak" -type f | grep -v node_modules | grep -v ".git" | while read file; do
    rm "$file"
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ Renommage terminé!${NC}"
echo -e "📊 $FILES_MODIFIED fichiers modifiés"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "⚠️  Actions manuelles requises:"
echo "  1. Mettre à jour les icônes/logos (assets/)"
echo "  2. Mettre à jour les URLs (enki.bot -> enki.ai)"
echo "  3. Vérifier les copyrights (Enki AI Bot Inc. -> Enki AI Inc.)"
echo "  4. Mettre à jour les workflows GitHub (.github/)"
echo "  5. Tester le build: bun run build"
echo ""
