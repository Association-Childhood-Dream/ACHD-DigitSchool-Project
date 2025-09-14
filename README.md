# DigitSchool POC - Plateforme de gestion scolaire numérique

## 🎯 Objectif

Proof of Concept (POC) pour DigitSchool, une plateforme de gestion scolaire numérique déployable avec Docker et démontrant la faisabilité technique pour les écoles primaires et secondaires en Afrique centrale.

## 🏗️ Architecture

### Microservices Backend
- **d-school-auth** (Port 6003) : Authentification JWT et gestion des rôles
- **d-school-user** (Port 6004) : Gestion des classes et assignations
- **d-school-academic** (Port 6005) : Notes, moyennes et progression
- **d-school-timetable** (Port 6006) : Gestion des emplois du temps
- **d-school-report** (Port 6007) : Génération de rapports PDF

### Frontend
- **React + Vite** : Interface utilisateur moderne
- **Electron** : Version desktop offline
- **4 vues principales** : Login, Dashboard, Saisie notes, Consultation bulletins

### Infrastructure
- **d-school-postgres** (Port 6001) : Base de données unique avec schémas séparés
- **d-school-redis** (Port 6002) : Cache et notifications temps réel
- **d-school-nginx** (Port 6080) : Reverse proxy pour routage des services
- **d-school-frontend** (Port 6008) : Interface utilisateur React
- **Docker Compose** : Orchestration complète

## 🚀 Installation et Démarrage

### Prérequis
- Docker et Docker Compose
- Node.js 20+ (pour développement local)

### Démarrage rapide
```bash
# Cloner le projet
git clone <repository-url>
cd digitschool-poc

# Démarrer tous les services
docker-compose up --build

# L'application sera accessible sur http://localhost:6080
```

### Comptes de test
- **Admin** : admin@digitschool.com / admin123
- **Enseignant** : teacher@digitschool.com / teacher123
- **Élève** : student@digitschool.com / student123
- **Parent** : parent@digitschool.com / parent123

## 📋 Scénario de Test

1. **Connexion Admin** : Se connecter avec le compte admin
2. **Création de classe** : Créer une classe "6ème A"
3. **Ajout d'élève** : Assigner l'étudiant à la classe
4. **Saisie de notes** : L'enseignant saisit 3 notes (Math, Français, Histoire)
5. **Génération bulletin** : Le Report Service génère un bulletin PDF
6. **Consultation** : L'élève/parent télécharge le bulletin via le frontend

## 🛠️ Développement

### Services Backend
Chaque service est un microservice Node.js/Express avec :
- Validation des données (Zod)
- Gestion d'erreurs centralisée
- Cache Redis
- Base de données PostgreSQL

### Frontend React
- Context API pour l'état global
- Routing avec React Router
- Interface responsive
- Gestion des erreurs

### Version Desktop (Electron)
```bash
cd frontend
npm run electron-dev  # Développement
npm run electron-build  # Build production
```

## 📊 Base de Données

### Schémas
- `auth` : Utilisateurs et authentification
- `usr` : Classes et assignations
- `academic` : Notes et progression
- `timetable` : Emplois du temps
- `report` : Rapports générés

### Données de test
Le script `scripts/seed-data.sql` contient des données de test pour démonstration.

## 🔧 Configuration

### Variables d'environnement
- `DATABASE_URL` : Connexion PostgreSQL
- `REDIS_URL` : Connexion Redis
- `JWT_SECRET` : Clé secrète JWT
- `SERVICE_SCHEMA` : Schéma de base de données par service

### Ports
- 6080 : d-school-nginx (point d'entrée)
- 6003-6007 : Services backend d-school
- 6001 : d-school-postgres
- 6002 : d-school-redis
- 6008 : d-school-frontend

## 📈 Fonctionnalités

### Authentification
- JWT avec expiration 24h
- Rôles : admin, teacher, student, parent
- Cache Redis pour performance

### Gestion des Classes
- CRUD classes
- Assignation enseignants/élèves
- Gestion des parents

### Système Académique
- Saisie des notes par matière/terme
- Calcul automatique des moyennes
- Orientation basée sur la moyenne
- Progression des enseignants

### Emplois du Temps
- CRUD créneaux horaires
- Gestion des conflits
- Vues par classe et enseignant

### Rapports
- Génération PDF bulletins
- Rapports de classe
- Statistiques générales

## 🐳 Docker

### Services
```yaml
services:
  - d-school-postgres: Base de données (Port 6001)
  - d-school-redis: Cache (Port 6002)
  - d-school-auth: Service authentification (Port 6003)
  - d-school-user: Service utilisateurs (Port 6004)
  - d-school-academic: Service académique (Port 6005)
  - d-school-timetable: Service emploi du temps (Port 6006)
  - d-school-report: Service rapports (Port 6007)
  - d-school-frontend: Interface React (Port 6008)
  - d-school-nginx: Reverse proxy (Port 6080)
```

### Volumes
- `pgdata` : Persistance des données PostgreSQL

## 🔒 Sécurité (POC)

- Authentification JWT
- Validation des données
- CORS configuré
- Headers de sécurité basiques

**Note** : Pour la production, ajouter HTTPS, validation avancée, monitoring, etc.

## 📝 API Endpoints

### Auth Service
- `POST /auth/register` : Inscription
- `POST /auth/login` : Connexion
- `POST /auth/logout` : Déconnexion
- `GET /auth/me` : Profil utilisateur

### User Service
- `GET /user/classes` : Liste des classes
- `POST /user/classes` : Créer une classe
- `POST /user/classes/:id/members` : Ajouter un membre

### Academic Service
- `POST /academic/grades` : Ajouter une note
- `GET /academic/grades/:studentId` : Notes d'un étudiant
- `GET /academic/grades/:studentId/average` : Moyenne d'un étudiant

### Report Service
- `POST /report/generate/student` : Générer bulletin étudiant
- `POST /report/generate/class` : Générer rapport classe
- `GET /report/reports/:filename` : Télécharger rapport

## 🎯 Critères SMART

- ✅ **Spécifique** : Digitaliser une école pilote
- ✅ **Mesurable** : Générer 5 bulletins + 2 rapports
- ✅ **Atteignable** : POC avec 5 microservices + 4 pages React
- ✅ **Réaliste** : Stack standard (REST + Postgres + Redis + React + Docker)
- ✅ **Temporel** : Livrable en 1 jour

## 🚀 Prochaines Étapes

1. Tests automatisés
2. Monitoring et logs
3. Déploiement cloud
4. Interface mobile
5. Notifications temps réel
6. Intégration paiements

## 📞 Support

Pour toute question ou problème :
- Vérifier les logs Docker : `docker-compose logs [service]`
- Redémarrer les services : `docker-compose restart`
- Rebuild complet : `docker-compose up --build --force-recreate`

---

**DigitSchool POC** - Fait avec ❤️ pour l'éducation en Afrique centrale