-- BANCO DE DADOS SIMPLIFICADO - ESTEVAN HUB

DROP DATABASE IF EXISTS estevan_hub;
CREATE DATABASE estevan_hub CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE estevan_hub;

-- Usuários administradores
CREATE TABLE admin_users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  email VARCHAR(255),
  active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Usuários clientes
CREATE TABLE client_users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  email VARCHAR(255),
  active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Publicações (notícias/artigos) - apenas campos essenciais
CREATE TABLE publications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  titulo VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  resumo TEXT,
  conteudo LONGTEXT,
  categoria VARCHAR(100),
  autor VARCHAR(100) DEFAULT 'Equipe Estevan Hub',
  imagem_destaque VARCHAR(500),
  thumbnail VARCHAR(500),
  tags TEXT,
  status ENUM('publicado', 'rascunho') DEFAULT 'publicado',
  data_publicacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE publications
  MODIFY COLUMN thumbnail VARCHAR(255) NULL,
  MODIFY COLUMN imagem_destaque VARCHAR(255) NULL,
  MODIFY COLUMN tags VARCHAR(255) NULL,
  MODIFY COLUMN status VARCHAR(32) DEFAULT 'publicado',
  MODIFY COLUMN data_publicacao DATETIME DEFAULT CURRENT_TIMESTAMP;

-- Dados iniciais
INSERT INTO admin_users (username, password_hash, full_name, email) VALUES 
('admin', SHA2('admin123', 256), 'Administrador', 'admin@estevanhub.com.br');

INSERT INTO client_users (username, password_hash, full_name, email) VALUES 
('cliente', SHA2('cliente123', 256), 'Cliente Teste', 'cliente@exemplo.com'),
('joao', SHA2('123456', 256), 'João Silva', 'joao@exemplo.com'),
('maria', SHA2('senha123', 256), 'Maria Santos', 'maria@exemplo.com');

INSERT INTO publications (titulo, slug, resumo, conteudo, categoria, autor, imagem_destaque, tags, status) VALUES 
(
  'Como aumentar suas vendas com marketing digital',
  'aumentar-vendas-marketing-digital',
  'Descubra estratégias eficientes que realmente funcionam para aumentar suas vendas através do marketing digital.',
  '<h2>O Poder do Marketing Digital</h2><p>O marketing digital revolucionou a forma como fazemos negócios. Com as estratégias certas, é possível multiplicar suas vendas...</p>',
  'Marketing Digital',
  'Equipe Estevan Hub',
  '/images/blog/marketing-digital.jpg',
  'marketing,vendas,digital,estratégia',
  'publicado'
),
(
  'Redes sociais para pequenas empresas: guia completo',
  'redes-sociais-pequenas-empresas',
  'Aprenda como utilizar as redes sociais de forma eficiente para crescer seu negócio local',
  '<h2>O Poder das Redes Sociais</h2><p>Para pequenas empresas, as redes sociais representam uma oportunidade única...</p>',
  'Redes Sociais',
  'Equipe Estevan Hub',
  '/images/blog/social-media.jpg',
  'redes sociais,pequenas empresas,instagram,facebook',
  'publicado'
),
(
  'Automação de processos: como economizar 40% do tempo',
  'automacao-processos-economia-tempo',
  'Descubra como a automação pode revolucionar seus processos e liberar tempo para o que realmente importa',
  '<h2>A Revolução da Automação</h2><p>A automação não é mais luxo, é necessidade...</p>',
  'Automação',
  'Equipe Estevan Hub',
  '/images/blog/automation.jpg',
  'automação,processos,produtividade,eficiência',
  'publicado'
);

SELECT 'Banco criado com sucesso!' as status;