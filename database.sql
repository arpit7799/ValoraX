-- ============================================
-- 🎮 VALORA — FULL DATABASE SCHEMA
-- ============================================

CREATE DATABASE IF NOT EXISTS valorant;
USE valorant;

-- ============================================
-- 👤 USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('user', 'admin') DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 🧍 AGENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS agents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  role VARCHAR(30) NOT NULL,
  ability TEXT NOT NULL,
  image VARCHAR(255) NOT NULL
);

-- ============================================
-- 🔫 SKINS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS skins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  weapon_type VARCHAR(50) NOT NULL,
  tier VARCHAR(50) NOT NULL,
  price INT NOT NULL DEFAULT 0,
  image VARCHAR(500) NOT NULL,
  video VARCHAR(500)
);

-- ============================================
-- 📦 ORDERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  total_amount INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================
-- 🧾 ORDER ITEMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  skin_id INT NOT NULL,
  quantity INT DEFAULT 1,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (skin_id) REFERENCES skins(id) ON DELETE CASCADE
);

-- ============================================
-- 🗺 MAPS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS maps (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100),
  description TEXT,
  image VARCHAR(500)
);

-- ============================================
-- 🌱 SEED DATA: AGENTS
-- ============================================
INSERT INTO agents (name, role, ability, image) VALUES
('Brimstone','Controller','Sky Smoke, Incendiary, Stim Beacon, Orbital Strike','/images/BRIMSTONE.avif'),
('Phoenix','Duelist','Blaze, Curveball, Hot Hands, Run It Back','/images/PHOENIX.avif'),
('Sage','Sentinel','Barrier Orb, Slow Orb, Healing Orb, Resurrection','/images/SAGE.avif'),
('Sova','Initiator','Owl Drone, Shock Bolt, Recon Bolt, Hunter''s Fury','/images/SOVA.avif'),
('Viper','Controller','Snake Bite, Poison Cloud, Toxic Screen, Viper''s Pit','/images/VIPER.avif'),
('Cypher','Sentinel','Trapwire, Cyber Cage, Spycam, Neural Theft','/images/CYPHER.avif'),
('Reyna','Duelist','Leer, Devour, Dismiss, Empress','/images/REYNA.avif'),
('Killjoy','Sentinel','Nanoswarm, Alarmbot, Turret, Lockdown','/images/KILLJOY.avif'),
('Breach','Initiator','Aftershock, Flashpoint, Fault Line, Rolling Thunder','/images/BREACH.avif'),
('Omen','Controller','Shrouded Step, Paranoia, Dark Cover, From the Shadows','/images/OMEN.avif'),
('Jett','Duelist','Tailwind, Updraft, Cloudburst, Blade Storm','/images/JETT.avif');

-- ============================================
-- 🌱 SEED DATA: MAPS
-- ============================================
INSERT INTO maps (name, description, image) VALUES
('Corrode','French castle town turned radianite facility.','https://cmsassets.rgpub.io/sanity/images/dsfx7636/news_live/f9e0dcccefb0de3fdd18ba73d3d51996e3e3aa9d-915x515.jpg'),
('Abyss','A mysterious underground battleground.','https://cmsassets.rgpub.io/sanity/images/dsfx7636/news_live/53698d442a14b5a6be643d53eb970ac16442cb38-930x522.png'),
('Sunset','Urban city map with tactical angles.','https://cmsassets.rgpub.io/sanity/images/dsfx7636/news/5101e4ee241fbfca261bf8150230236c46c8b991-3840x2160.png'),
('Lotus','Three-site map with rotating doors.','https://cmsassets.rgpub.io/sanity/images/dsfx7636/news/67d199e0f7108bc60e8293d3f9a37538b0b55b11-3840x2160.png'),
('Pearl','Underwater city battleground.','https://cmsassets.rgpub.io/sanity/images/dsfx7636/news/0089861662b41c8d5c3c4f1c14cb4d1937936105-915x515.webp'),
('Fracture','Split map with attacker spawn on both sides.','https://cmsassets.rgpub.io/sanity/images/dsfx7636/news/aecf502b1eea8824fd1fa9f8a2450bc5c13f6910-915x515.webp'),
('Breeze','Open map with long sightlines.','https://cmsassets.rgpub.io/sanity/images/dsfx7636/news_live/bc402a09eb116972a9e01b332ce780897cd35c8f-915x515.jpg'),
('Icebox','Arctic research facility.','https://cmsassets.rgpub.io/sanity/images/dsfx7636/news/72853f583a0f6b25aed54870531756483a7b61de-3840x2160.png'),
('Ascent','Classic map with open mid control.','https://cmsassets.rgpub.io/sanity/images/dsfx7636/news/5cb7e65c04a489eccd725ce693fdc11e99982e10-3840x2160.png'),
('Split','Vertical gameplay with ropes.','https://cmsassets.rgpub.io/sanity/images/dsfx7636/news/878d51688c0f9dd0de827162e80c40811668e0c6-3840x2160.png'),
('Haven','Three bombsite map.','https://cmsassets.rgpub.io/sanity/images/dsfx7636/news/bccc7b5f8647a4f654d4bb359247bce6e82c77ab-3840x2160.png'),
('Bind','Teleport-based gameplay map.','https://cmsassets.rgpub.io/sanity/images/dsfx7636/news/7df1e6ee284810ef0cbf8db369c214a8cbf6578c-3840x2160.png');

-- ============================================
-- 👑 ADMIN USER
-- ============================================
INSERT INTO users (username, email, password, role) VALUES
('admin','admin@valora.com','$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi','admin');

-- NOTE:
-- Password = admin123 (bcrypt hashed placeholder)
-- Recommended: register manually and update role to admin