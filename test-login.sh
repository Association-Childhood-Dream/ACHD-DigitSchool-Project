#!/bin/bash

echo "🔐 Test de connexion DigitSchool"
echo "==============================="

API_BASE="http://37.60.242.104:6080"

# Test de connexion admin
echo "Test connexion admin..."
admin_response=$(curl -s -X POST "$API_BASE/auth/login" \
    -H "Content-Type: application/json" \
    -d '{
        "email": "admin@digitschool.com",
        "password": "admin123"
    }')

echo "Réponse: $admin_response"

if echo "$admin_response" | grep -q '"ok":true'; then
    echo "✅ Connexion admin réussie!"
    token=$(echo "$admin_response" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
    echo "Token: ${token:0:30}..."
else
    echo "❌ Échec de connexion admin"
    echo "Vérifiez que les utilisateurs existent dans la base de données"
fi

echo ""
echo "🔍 Test de l'endpoint de santé..."
health_response=$(curl -s "$API_BASE/auth/health")
echo "Health check: $health_response"
