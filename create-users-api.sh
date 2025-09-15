#!/bin/bash

echo "👤 Création des utilisateurs via l'API DigitSchool"
echo "================================================="

API_BASE="http://37.60.242.104:6080"

# Fonction pour créer un utilisateur via l'API
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
    
    echo "Réponse: $response"
    
    if echo "$response" | grep -q '"ok":true'; then
        echo "✅ $email créé avec succès"
        return 0
    else
        echo "❌ Erreur pour $email"
        return 1
    fi
}

# Fonction pour tester la connexion
test_login() {
    local email=$1
    local password=$2
    
    echo "Test de connexion pour $email..."
    
    response=$(curl -s -X POST "$API_BASE/auth/login" \
        -H "Content-Type: application/json" \
        -d "{
            \"email\": \"$email\",
            \"password\": \"$password\"
        }")
    
    if echo "$response" | grep -q '"ok":true'; then
        echo "✅ Connexion $email réussie"
        token=$(echo "$response" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
        echo "Token: ${token:0:30}..."
        return 0
    else
        echo "❌ Échec de connexion $email"
        return 1
    fi
}

echo "🔍 Vérification de l'API..."
health_response=$(curl -s "$API_BASE/auth/health")
if echo "$health_response" | grep -q '"ok":true'; then
    echo "✅ API accessible"
else
    echo "❌ API non accessible: $health_response"
    exit 1
fi

echo ""
echo "👥 Création des utilisateurs..."

# Créer les utilisateurs
create_user "admin@digitschool.com" "admin123" "admin"
create_user "teacher@digitschool.com" "teacher123" "teacher"
create_user "student@digitschool.com" "student123" "student"
create_user "parent@digitschool.com" "parent123" "parent"

echo ""
echo "🧪 Test des connexions..."

# Tester les connexions
test_login "admin@digitschool.com" "admin123"
test_login "teacher@digitschool.com" "teacher123"
test_login "student@digitschool.com" "student123"
test_login "parent@digitschool.com" "parent123"

echo ""
echo "🎉 Création terminée!"
echo "===================="
echo "🌐 Application: http://37.60.242.104:6080"
echo "👤 Comptes créés:"
echo "  - admin@digitschool.com / admin123 (Admin)"
echo "  - teacher@digitschool.com / teacher123 (Enseignant)"
echo "  - student@digitschool.com / student123 (Élève)"
echo "  - parent@digitschool.com / parent123 (Parent)"
