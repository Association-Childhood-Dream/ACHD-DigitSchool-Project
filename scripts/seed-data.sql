-- Script de données de test pour DigitSchool POC

-- Utilisateurs de test
INSERT INTO auth.users (email, password_hash, role) VALUES 
('admin@digitschool.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/9.8Kz2K', 'admin'),
('teacher@digitschool.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/9.8Kz2K', 'teacher'),
('student@digitschool.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/9.8Kz2K', 'student'),
('parent@digitschool.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/9.8Kz2K', 'parent');

-- Classes de test
INSERT INTO usr.classes (name, level) VALUES 
('6ème A', '6ème'),
('5ème B', '5ème'),
('4ème A', '4ème');

-- Assignations
INSERT INTO usr.class_members (class_id, user_id, role) VALUES 
((SELECT id FROM usr.classes WHERE name = '6ème A'), (SELECT id FROM auth.users WHERE email = 'teacher@digitschool.com'), 'teacher'),
((SELECT id FROM usr.classes WHERE name = '6ème A'), (SELECT id FROM auth.users WHERE email = 'student@digitschool.com'), 'student');

-- Notes de test
INSERT INTO academic.grades (student_id, subject, term, score) VALUES 
((SELECT id FROM auth.users WHERE email = 'student@digitschool.com'), 'Mathématiques', 'T1', 15.5),
((SELECT id FROM auth.users WHERE email = 'student@digitschool.com'), 'Français', 'T1', 14.0),
((SELECT id FROM auth.users WHERE email = 'student@digitschool.com'), 'Histoire', 'T1', 16.0);

-- Progression enseignant
INSERT INTO academic.teacher_progress (teacher_id, class_id, coverage_percent) VALUES 
((SELECT id FROM auth.users WHERE email = 'teacher@digitschool.com'), (SELECT id FROM usr.classes WHERE name = '6ème A'), 75.0);

-- Emploi du temps
INSERT INTO timetable.entries (class_id, day_of_week, start_time, end_time, subject, teacher_id, room) VALUES 
((SELECT id FROM usr.classes WHERE name = '6ème A'), 1, '08:00', '09:00', 'Mathématiques', (SELECT id FROM auth.users WHERE email = 'teacher@digitschool.com'), 'Salle 101'),
((SELECT id FROM usr.classes WHERE name = '6ème A'), 1, '09:00', '10:00', 'Français', (SELECT id FROM auth.users WHERE email = 'teacher@digitschool.com'), 'Salle 101'),
((SELECT id FROM usr.classes WHERE name = '6ème A'), 2, '08:00', '09:00', 'Histoire', (SELECT id FROM auth.users WHERE email = 'teacher@digitschool.com'), 'Salle 102');
