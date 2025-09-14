import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

export class PDFGenerator {
  constructor() {
    this.reportsDir = './reports';
    this.ensureReportsDir();
  }

  ensureReportsDir() {
    if (!fs.existsSync(this.reportsDir)) {
      fs.mkdirSync(this.reportsDir, { recursive: true });
    }
  }

  generateStudentReport(studentData, grades, term) {
    const doc = new PDFDocument({ margin: 50 });
    const filename = `bulletin_${studentData.email}_${term}_${Date.now()}.pdf`;
    const filepath = path.join(this.reportsDir, filename);
    
    doc.pipe(fs.createWriteStream(filepath));

    // En-tête
    doc.fontSize(20).text('DIGITSCHOOL', 50, 50, { align: 'center' });
    doc.fontSize(16).text('BULLETIN DE NOTES', 50, 80, { align: 'center' });
    
    // Informations étudiant
    doc.fontSize(12);
    doc.text(`Étudiant: ${studentData.email}`, 50, 120);
    doc.text(`Terme: ${term}`, 50, 140);
    doc.text(`Date: ${new Date().toLocaleDateString('fr-FR')}`, 50, 160);

    // Tableau des notes
    let yPosition = 200;
    doc.text('Matières et Notes:', 50, yPosition);
    yPosition += 30;

    // En-tête du tableau
    doc.text('Matière', 50, yPosition);
    doc.text('Note', 300, yPosition);
    doc.text('Moyenne', 400, yPosition);
    yPosition += 20;

    // Ligne de séparation
    doc.moveTo(50, yPosition).lineTo(500, yPosition).stroke();
    yPosition += 10;

    // Notes par matière
    const subjectAverages = {};
    grades.forEach(grade => {
      if (!subjectAverages[grade.subject]) {
        subjectAverages[grade.subject] = [];
      }
      subjectAverages[grade.subject].push(grade.score);
    });

    Object.entries(subjectAverages).forEach(([subject, scores]) => {
      const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
      
      doc.text(subject, 50, yPosition);
      doc.text(scores.join(', '), 300, yPosition);
      doc.text(average.toFixed(2), 400, yPosition);
      yPosition += 20;
    });

    // Moyenne générale
    const overallAverage = grades.reduce((sum, grade) => sum + grade.score, 0) / grades.length;
    yPosition += 10;
    doc.moveTo(50, yPosition).lineTo(500, yPosition).stroke();
    yPosition += 10;
    
    doc.fontSize(14).text(`MOYENNE GÉNÉRALE: ${overallAverage.toFixed(2)}/20`, 50, yPosition, { align: 'center' });
    
    // Orientation
    yPosition += 30;
    let orientation = '';
    if (overallAverage >= 16) orientation = 'Excellent';
    else if (overallAverage >= 14) orientation = 'Très bien';
    else if (overallAverage >= 12) orientation = 'Bien';
    else if (overallAverage >= 10) orientation = 'Passable';
    else orientation = 'Insuffisant';
    
    doc.fontSize(12).text(`Orientation: ${orientation}`, 50, yPosition, { align: 'center' });

    // Pied de page
    yPosition += 50;
    doc.fontSize(10).text('DigitSchool - Plateforme de gestion scolaire numérique', 50, yPosition, { align: 'center' });

    doc.end();

    return { filename, filepath };
  }

  generateClassReport(classData, studentsStats, term) {
    const doc = new PDFDocument({ margin: 50 });
    const filename = `rapport_classe_${classData.name}_${term}_${Date.now()}.pdf`;
    const filepath = path.join(this.reportsDir, filename);
    
    doc.pipe(fs.createWriteStream(filepath));

    // En-tête
    doc.fontSize(20).text('DIGITSCHOOL', 50, 50, { align: 'center' });
    doc.fontSize(16).text('RAPPORT DE CLASSE', 50, 80, { align: 'center' });
    
    // Informations classe
    doc.fontSize(12);
    doc.text(`Classe: ${classData.name} (${classData.level})`, 50, 120);
    doc.text(`Terme: ${term}`, 50, 140);
    doc.text(`Date: ${new Date().toLocaleDateString('fr-FR')}`, 50, 160);

    // Statistiques générales
    let yPosition = 200;
    doc.text('Statistiques Générales:', 50, yPosition);
    yPosition += 30;

    const totalStudents = studentsStats.length;
    const studentsWithGrades = studentsStats.filter(s => s.average > 0).length;
    const averageClass = studentsStats.reduce((sum, s) => sum + (s.average || 0), 0) / totalStudents;

    doc.text(`Nombre d'élèves: ${totalStudents}`, 50, yPosition);
    yPosition += 20;
    doc.text(`Élèves avec notes: ${studentsWithGrades}`, 50, yPosition);
    yPosition += 20;
    doc.text(`Moyenne de classe: ${averageClass.toFixed(2)}/20`, 50, yPosition);
    yPosition += 40;

    // Tableau des élèves
    doc.text('Résultats par Élève:', 50, yPosition);
    yPosition += 30;

    // En-tête du tableau
    doc.text('Élève', 50, yPosition);
    doc.text('Moyenne', 300, yPosition);
    doc.text('Orientation', 400, yPosition);
    yPosition += 20;

    // Ligne de séparation
    doc.moveTo(50, yPosition).lineTo(500, yPosition).stroke();
    yPosition += 10;

    // Données des élèves
    studentsStats.forEach(student => {
      doc.text(student.student_email, 50, yPosition);
      doc.text(student.average ? student.average.toFixed(2) : 'N/A', 300, yPosition);
      doc.text(student.orientation || 'N/A', 400, yPosition);
      yPosition += 20;
    });

    // Pied de page
    yPosition += 30;
    doc.fontSize(10).text('DigitSchool - Plateforme de gestion scolaire numérique', 50, yPosition, { align: 'center' });

    doc.end();

    return { filename, filepath };
  }
}
