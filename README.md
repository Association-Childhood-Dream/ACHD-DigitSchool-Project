# DigitSchool POC

Plateforme de gestion scolaire numérique - Proof of Concept

## Démarrage

```bash
docker-compose up --build
```

L'application sera accessible sur http://localhost:6080

## Comptes de test

- **Admin**: admin@digitschool.com / admin123
- **Enseignant**: teacher@digitschool.com / teacher123
- **Élève**: student@digitschool.com / student123
- **Parent**: parent@digitschool.com / parent123

## Architecture

### Services
- **Auth Service**: Authentification
- **User Service**: Gestion utilisateurs et classes
- **Academic Service**: Notes et progression
- **Timetable Service**: Emplois du temps
- **Report Service**: Génération de rapports PDF
- **Frontend**: Interface React
- **Reverse Proxy**: Point d'entrée unique

### Base de données
- **PostgreSQL**: Base de données principale avec données de test
- **Redis**: Cache et sessions