#!/usr/bin/env node

/**
 * Script de test pour valider le POC DigitSchool
 * Teste les fonctionnalités principales de l'API
 */

import axios from 'axios';

const API_BASE = 'http://localhost:6080';
const api = axios.create({ baseURL: API_BASE });

// Couleurs pour les logs
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testAuth() {
  log('\n🔐 Test du service d\'authentification...', 'blue');
  
  try {
    // Test d'inscription
    const registerResponse = await api.post('/auth/register', {
      email: 'test@digitschool.com',
      password: 'test123',
      role: 'teacher'
    });
    log('✅ Inscription réussie', 'green');
    
    // Test de connexion
    const loginResponse = await api.post('/auth/login', {
      email: 'test@digitschool.com',
      password: 'test123'
    });
    log('✅ Connexion réussie', 'green');
    
    const token = loginResponse.data.data.token;
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    
    return { token, userId: loginResponse.data.data.user.id };
  } catch (error) {
    log(`❌ Erreur auth: ${error.response?.data?.error || error.message}`, 'red');
    throw error;
  }
}

async function testUserService() {
  log('\n👥 Test du service utilisateur...', 'blue');
  
  try {
    // Créer une classe
    const classResponse = await api.post('/user/classes', {
      name: 'Test Class',
      level: '6ème'
    });
    log('✅ Classe créée', 'green');
    
    const classId = classResponse.data.data.class.id;
    
    // Lister les classes
    const classesResponse = await api.get('/user/classes');
    log('✅ Liste des classes récupérée', 'green');
    
    return { classId };
  } catch (error) {
    log(`❌ Erreur user service: ${error.response?.data?.error || error.message}`, 'red');
    throw error;
  }
}

async function testAcademicService(userId, classId) {
  log('\n📚 Test du service académique...', 'blue');
  
  try {
    // Ajouter des notes
    const grades = [
      { subject: 'Mathématiques', term: 'T1', score: 15.5 },
      { subject: 'Français', term: 'T1', score: 14.0 },
      { subject: 'Histoire', term: 'T1', score: 16.0 }
    ];
    
    for (const grade of grades) {
      await api.post('/academic/grades', {
        student_id: userId,
        ...grade
      });
    }
    log('✅ Notes ajoutées', 'green');
    
    // Récupérer les notes
    const gradesResponse = await api.get(`/academic/grades/${userId}`);
    log('✅ Notes récupérées', 'green');
    
    // Calculer la moyenne
    const averageResponse = await api.get(`/academic/grades/${userId}/average?term=T1`);
    log(`✅ Moyenne calculée: ${averageResponse.data.data.overall_average}/20`, 'green');
    
    return true;
  } catch (error) {
    log(`❌ Erreur academic service: ${error.response?.data?.error || error.message}`, 'red');
    throw error;
  }
}

async function testReportService(userId) {
  log('\n📄 Test du service de rapports...', 'blue');
  
  try {
    // Générer un bulletin
    const reportResponse = await api.post('/report/generate/student', {
      student_id: userId,
      term: 'T1'
    });
    log('✅ Bulletin généré', 'green');
    
    const downloadUrl = reportResponse.data.data.download_url;
    log(`📥 URL de téléchargement: ${downloadUrl}`, 'yellow');
    
    // Lister les rapports
    const reportsResponse = await api.get(`/report/reports?student_id=${userId}`);
    log('✅ Liste des rapports récupérée', 'green');
    
    return true;
  } catch (error) {
    log(`❌ Erreur report service: ${error.response?.data?.error || error.message}`, 'red');
    throw error;
  }
}

async function testTimetableService(classId) {
  log('\n⏰ Test du service d\'emploi du temps...', 'blue');
  
  try {
    // Créer un créneau
    const entryResponse = await api.post('/timetable/entries', {
      class_id: classId,
      day_of_week: 1,
      start_time: '08:00',
      end_time: '09:00',
      subject: 'Mathématiques',
      room: 'Salle 101'
    });
    log('✅ Créneau créé', 'green');
    
    // Récupérer l'emploi du temps
    const timetableResponse = await api.get(`/timetable/entries/class/${classId}`);
    log('✅ Emploi du temps récupéré', 'green');
    
    return true;
  } catch (error) {
    log(`❌ Erreur timetable service: ${error.response?.data?.error || error.message}`, 'red');
    throw error;
  }
}

async function runTests() {
  log('🚀 Démarrage des tests du POC DigitSchool', 'blue');
  log('=' .repeat(50), 'blue');
  
  try {
    // Test 1: Authentification
    const { token, userId } = await testAuth();
    
    // Test 2: Service utilisateur
    const { classId } = await testUserService();
    
    // Test 3: Service académique
    await testAcademicService(userId, classId);
    
    // Test 4: Service de rapports
    await testReportService(userId);
    
    // Test 5: Service d'emploi du temps
    await testTimetableService(classId);
    
    log('\n🎉 Tous les tests sont passés avec succès!', 'green');
    log('✅ Le POC DigitSchool fonctionne correctement', 'green');
    
  } catch (error) {
    log('\n❌ Échec des tests', 'red');
    log(`Erreur: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Vérifier que l'API est accessible
async function checkAPI() {
  try {
    await api.get('/auth/health');
    return true;
  } catch (error) {
    log('❌ L\'API n\'est pas accessible. Assurez-vous que Docker Compose est démarré.', 'red');
    log('Commande: docker-compose up --build -d', 'yellow');
    return false;
  }
}

// Point d'entrée
async function main() {
  const isAPIReady = await checkAPI();
  if (!isAPIReady) {
    process.exit(1);
  }
  
  await runTests();
}

main().catch(console.error);
