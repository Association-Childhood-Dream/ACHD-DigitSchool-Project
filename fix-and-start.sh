#!/bin/bash

echo "🔧 Correction et démarrage de DigitSchool POC"
echo "============================================="

# Arrêter tous les services
echo "🛑 Arrêt des services existants..."
docker-compose down

# Démarrer les services dans l'ordre correct
echo "📊 1. Démarrage de PostgreSQL et Redis..."
docker-compose up -d d-school-postgres d-school-redis
sleep 10

echo "🔧 2. Démarrage des services backend..."
docker-compose up -d d-school-auth d-school-user d-school-academic d-school-timetable d-school-report
sleep 15

echo "🌐 3. Démarrage du frontend..."
docker-compose up -d d-school-frontend
sleep 10

echo "🔄 4. Démarrage du reverse proxy Nginx..."
docker-compose up -d d-school-nginx
sleep 5

# Vérifier l'état des services
echo "📋 État des services:"
docker-compose ps

# Tester l'accès
echo "🔍 Test de l'application..."
if curl -s http://localhost:6080 > /dev/null 2>&1; then
    echo "✅ Application accessible sur http://localhost:6080"
else
    echo "❌ Application non accessible. Vérifiez les logs:"
    echo "docker-compose logs d-school-nginx"
    echo "docker-compose logs d-school-frontend"
fi

echo "🎉 Démarrage terminé!"
