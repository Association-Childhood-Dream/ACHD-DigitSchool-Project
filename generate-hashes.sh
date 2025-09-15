#!/bin/bash

echo "🔐 Génération des hash bcrypt pour les mots de passe de test"
echo "==========================================================="

# Installer bcrypt si nécessaire
if ! command -v node &> /dev/null; then
    echo "❌ Node.js n'est pas installé. Installation de bcryptjs..."
    npm install bcryptjs
fi

# Générer les hash avec Node.js
node -e "
const bcrypt = require('bcryptjs');

const passwords = {
  'admin@digitschool.com': 'admin123',
  'teacher@digitschool.com': 'teacher123', 
  'student@digitschool.com': 'student123',
  'parent@digitschool.com': 'parent123'
};

console.log('-- Hash bcrypt générés:');
Object.entries(passwords).forEach(([email, password]) => {
  const saltRounds = 12;
  const hash = bcrypt.hashSync(password, saltRounds);
  const role = email.split('@')[0];
  console.log(\`INSERT INTO auth.users (email, password_hash, role) VALUES ('\${email}', '\${hash}', '\${role}');\`);
});
"

echo ""
echo "✅ Hash générés! Copiez les commandes INSERT ci-dessus dans votre base de données."
