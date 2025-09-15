#!/bin/bash

echo "👤 Création des comptes utilisateurs de test"
echo "============================================"

API_BASE="http://37.60.242.104:6080"

# Fonction pour créer un utilisateur
create_user() {
    local email=$1
    local password=$2
    local role=$3
    
    echo "Création de $email ($role)..."
    
    response=$(curl -s -X POST "$API_BASE/auth/register" \
        -H "Content-Type: application/json" \
        -d "{
            \"email\": \"$email\",
            \"password\": \"$password\",
            \"role\": \"$role\"
        }")
    
    if echo "$response" | grep -q '"ok":true'; then
        echo "✅ $email créé avec succès"
    else
        echo "❌ Erreur pour $email: $response"
    fi
}

echo "🔐 Création des comptes de test..."

# Créer les comptes utilisateurs
create_user "admin@digitschool.com" "admin123" "admin"
create_user "teacher@digitschool.com" "teacher123" "teacher"
create_user "student@digitschool.com" "student123" "student"
create_user "parent@digitschool.com" "parent123" "parent"

echo ""
echo "🧪 Test de connexion..."

# Tester la connexion admin
echo "Test connexion admin..."
login_response=$(curl -s -X POST "$API_BASE/auth/login" \
    -H "Content-Type: application/json" \
    -d '{
        "email": "admin@digitschool.com",
        "password": "admin123"
    }')

if echo "$login_response" | grep -q '"ok":true'; then
    echo "✅ Connexion admin réussie"
    token=$(echo "$login_response" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
    echo "Token: ${token:0:20}..."
else
    echo "❌ Erreur de connexion admin: $login_response"
fi

echo ""
echo "📋 Comptes créés:"
echo "=================="
echo "👑 Admin: admin@digitschool.com / admin123"
echo "👨‍🏫 Enseignant: teacher@digitschool.com / teacher123"
echo "👨‍🎓 Élève: student@digitschool.com / student123"
echo "👨‍👩‍👧‍👦 Parent: parent@digitschool.com / parent123"

echo ""
echo "🌐 Application accessible sur: http://37.60.242.104:6080"
