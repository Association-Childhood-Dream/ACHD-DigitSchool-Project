// Script pour générer les vrais hash bcrypt des mots de passe de test
const bcrypt = require('bcryptjs');

const passwords = {
  'admin@digitschool.com': 'admin123',
  'teacher@digitschool.com': 'teacher123', 
  'student@digitschool.com': 'student123',
  'parent@digitschool.com': 'parent123'
};

console.log('🔐 Génération des hash bcrypt pour les mots de passe de test');
console.log('==========================================================');

Object.entries(passwords).forEach(([email, password]) => {
  const saltRounds = 12;
  const hash = bcrypt.hashSync(password, saltRounds);
  console.log(`\n-- ${email}`);
  console.log(`INSERT INTO auth.users (email, password_hash, role) VALUES ('${email}', '${hash}', '${email.split('@')[0]}');`);
});

console.log('\n✅ Hash générés avec succès!');
console.log('\n📋 Instructions:');
console.log('1. Copiez les commandes INSERT ci-dessus');
console.log('2. Exécutez-les dans votre base de données PostgreSQL');
console.log('3. Ou utilisez le script create-users-api.sh pour créer via l\'API');
