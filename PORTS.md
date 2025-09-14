# Configuration des Ports - DigitSchool POC

## 📋 Résumé des Ports

| Service | Port Externe | Port Interne | Description |
|---------|-------------|-------------|-------------|
| **D-School-nginx** | 6080 | 80 | Point d'entrée principal (Reverse Proxy) |
| **D-School-postgres** | 6001 | 5432 | Base de données PostgreSQL |
| **D-School-redis** | 6002 | 6379 | Cache Redis |
| **D-School-auth** | 6003 | 3000 | Service d'authentification |
| **D-School-user** | 6004 | 3000 | Service de gestion des utilisateurs |
| **D-School-academic** | 6005 | 3000 | Service académique (notes, moyennes) |
| **D-School-timetable** | 6006 | 3000 | Service d'emploi du temps |
| **D-School-report** | 6007 | 3000 | Service de génération de rapports |
| **D-School-frontend** | 6008 | 80 | Interface utilisateur React |

## 🌐 Accès aux Services

### Frontend (Interface Utilisateur)
- **URL** : http://localhost:6080
- **Description** : Interface principale de DigitSchool

### API Endpoints
- **Auth** : http://localhost:6080/auth/
- **User** : http://localhost:6080/user/
- **Academic** : http://localhost:6080/academic/
- **Timetable** : http://localhost:6080/timetable/
- **Report** : http://localhost:6080/report/

### Services Directs (Développement)
- **Auth Service** : http://localhost:6003/
- **User Service** : http://localhost:6004/
- **Academic Service** : http://localhost:6005/
- **Timetable Service** : http://localhost:6006/
- **Report Service** : http://localhost:6007/
- **Frontend** : http://localhost:6008/

### Base de Données
- **PostgreSQL** : localhost:6001
  - **User** : digitschool
  - **Password** : digitschool
  - **Database** : digitschool

### Cache
- **Redis** : localhost:6002

## 🔧 Configuration

### Variables d'Environnement
```bash
# Base de données
DATABASE_URL=postgres://digitschool:digitschool@D-School-postgres:5432/digitschool

# Cache
REDIS_URL=redis://D-School-redis:6379

# Frontend
VITE_API_BASE=http://localhost:6080
```

### Docker Compose
```bash
# Démarrer tous les services
docker-compose up --build

# Démarrer en arrière-plan
docker-compose up -d --build

# Voir les logs
docker-compose logs -f

# Arrêter les services
docker-compose down
```

## 🚨 Résolution de Conflits

Si vous avez des conflits de ports, vous pouvez :

1. **Modifier les ports** dans `docker-compose.yml`
2. **Arrêter les services conflictuels** temporairement
3. **Utiliser des ports différents** en modifiant la colonne "Port Externe"

### Exemple de Modification
```yaml
# Pour changer le port du frontend de 6080 à 7080
D-School-nginx:
  ports:
    - "7080:80"  # Au lieu de "6080:80"
```

## 📊 Monitoring

### Vérifier l'État des Services
```bash
# Vérifier que tous les services sont en cours d'exécution
docker-compose ps

# Vérifier la santé d'un service spécifique
curl http://localhost:6003/health  # Auth service
curl http://localhost:6004/health  # User service
curl http://localhost:6005/health  # Academic service
curl http://localhost:6006/health  # Timetable service
curl http://localhost:6007/health  # Report service
```

### Logs des Services
```bash
# Logs de tous les services
docker-compose logs

# Logs d'un service spécifique
docker-compose logs D-School-auth
docker-compose logs D-School-user
docker-compose logs D-School-academic
docker-compose logs D-School-timetable
docker-compose logs D-School-report
docker-compose logs D-School-nginx
docker-compose logs D-School-frontend
```

## 🎯 Points d'Accès Principaux

1. **Application Complète** : http://localhost:6080
2. **API Documentation** : http://localhost:6080/auth/ (endpoints disponibles)
3. **Base de Données** : localhost:6001 (avec pgAdmin ou client PostgreSQL)
4. **Cache Redis** : localhost:6002 (avec Redis CLI ou client Redis)

---

**Note** : Tous les ports sont configurés pour éviter les conflits avec les services standard (80, 443, 3000, 5432, 6379, etc.).
