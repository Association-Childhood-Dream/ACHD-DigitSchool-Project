CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS usr;
CREATE SCHEMA IF NOT EXISTS academic;
CREATE SCHEMA IF NOT EXISTS timetable;
CREATE SCHEMA IF NOT EXISTS report;

-- AUTH schema
CREATE TABLE IF NOT EXISTS auth.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin','teacher','student','parent')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- USER schema
CREATE TABLE IF NOT EXISTS usr.classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  level TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS usr.class_members (
  class_id UUID REFERENCES usr.classes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('teacher','student')),
  PRIMARY KEY (class_id, user_id)
);

-- ACADEMIC schema
CREATE TABLE IF NOT EXISTS academic.grades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  term TEXT NOT NULL,
  score NUMERIC(5,2) NOT NULL CHECK (score >= 0 AND score <= 20),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS academic.teacher_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES usr.classes(id) ON DELETE CASCADE,
  coverage_percent NUMERIC(5,2) NOT NULL CHECK (coverage_percent >= 0 AND coverage_percent <= 100),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- TIMETABLE schema
CREATE TABLE IF NOT EXISTS timetable.entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES usr.classes(id) ON DELETE CASCADE,
  day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 1 AND 7),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  subject TEXT NOT NULL,
  teacher_id UUID REFERENCES auth.users(id),
  room TEXT
);

-- REPORT schema
CREATE TABLE IF NOT EXISTS report.generated_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  term TEXT NOT NULL,
  url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Données de test pour DigitSchool POC
-- Utilisateurs de test avec mots de passe en clair pour simplifier le développement
INSERT INTO auth.users (email, password_hash, role) VALUES 
('admin@digitschool.com', 'admin123', 'admin'),
('teacher@digitschool.com', 'teacher123', 'teacher'),
('student@digitschool.com', 'student123', 'student'),
('parent@digitschool.com', 'parent123', 'parent')
ON CONFLICT (email) DO NOTHING;

-- Classes de test
INSERT INTO usr.classes (name, level) VALUES 
('6ème A', '6ème'),
('5ème B', '5ème'),
('4ème A', '4ème')
ON CONFLICT DO NOTHING;

-- Assignations
INSERT INTO usr.class_members (class_id, user_id, role) VALUES 
((SELECT id FROM usr.classes WHERE name = '6ème A'), (SELECT id FROM auth.users WHERE email = 'teacher@digitschool.com'), 'teacher'),
((SELECT id FROM usr.classes WHERE name = '6ème A'), (SELECT id FROM auth.users WHERE email = 'student@digitschool.com'), 'student')
ON CONFLICT DO NOTHING;

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
