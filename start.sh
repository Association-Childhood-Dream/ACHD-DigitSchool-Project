#!/bin/bash

# Script de démarrage rapide pour DigitSchool POC

echo "🚀 Démarrage de DigitSchool POC..."
echo "=================================="

# Vérifier que Docker est installé
if ! command -v docker &> /dev/null; then
    echo "❌ Docker n'est pas installé. Veuillez l'installer d'abord."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose n'est pas installé. Veuillez l'installer d'abord."
    exit 1
fi

# Démarrer les services
echo "🐳 Démarrage des services Docker..."
docker-compose up --build -d

# Attendre que les services soient prêts
echo "⏳ Attente du démarrage des services..."
sleep 30

# Vérifier que l'API est accessible
echo "🔍 Vérification de l'API..."
max_attempts=10
attempt=1

while [ $attempt -le $max_attempts ]; do
    if curl -s http://localhost:6080/auth/health > /dev/null 2>&1; then
        echo "✅ API accessible!"
        break
    else
        echo "⏳ Tentative $attempt/$max_attempts - Attente de l'API..."
        sleep 10
        ((attempt++))
    fi
done

if [ $attempt -gt $max_attempts ]; then
    echo "❌ L'API n'est pas accessible après $max_attempts tentatives."
    echo "Vérifiez les logs avec: docker-compose logs"
    exit 1
fi

# Afficher les informations d'accès
echo ""
echo "🎉 DigitSchool POC est maintenant accessible!"
echo "============================================="
echo "🌐 Frontend: http://localhost:6080"
echo "🔗 API: http://localhost:6080/auth, /user, /academic, /timetable, /report"
echo ""
echo "👤 Comptes de test:"
echo "   Admin: admin@digitschool.com / admin123"
echo "   Enseignant: teacher@digitschool.com / teacher123"
echo "   Élève: student@digitschool.com / student123"
echo "   Parent: parent@digitschool.com / parent123"
echo ""
echo "🧪 Pour tester l'API:"
echo "   cd scripts && npm install && npm test"
echo ""
echo "📊 Pour voir les logs:"
echo "   docker-compose logs -f"
echo ""
echo "🛑 Pour arrêter:"
echo "   docker-compose down"
