require('dotenv').config();
const express = require('express');
const path = require('path');
const crypto = require('crypto');
const sanitizeHtml = require('sanitize-html');
const multer = require('multer');
const fs = require('fs');

// Try to load sharp, but provide fallback if not available
let sharp;
let sharpAvailable = false;
try {
  sharp = require('sharp');
  sharpAvailable = true;
  console.log('✅ Image optimization available (sharp module loaded)');
} catch (error) {
  console.warn('⚠️ Image optimization not available: sharp module not found');
  console.warn('To enable image optimization, install sharp:');
  console.warn('npm install sharp');
}

const { initDatabase, executeQuery } = require('./db/database');

const app = express();
const PORT = process.env.PORT || 3000;

// Tokens fixos para simplicidade
const ADMIN_TOKEN = 'admin_token_123';
const CLIENT_TOKEN = 'client_token_123';

// Inicializar banco
let dbReady = false;
initDatabase().then(() => {
  dbReady = true;
  console.log('✅ Database ready');
}).catch(err => {
  console.error('❌ Database error:', err.message);
});

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Sanitização de nomes de arquivos
function sanitizeFileName(filename) {
  // Remove caracteres especiais e espaços
  let sanitized = filename
    .toLowerCase()
    .replace(/[^a-z0-9.]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  
  // Garante um nome único adicionando timestamp
  const timestamp = Date.now();
  const randomString = crypto.randomBytes(8).toString('hex');
  const ext = path.extname(sanitized);
  const basename = path.basename(sanitized, ext);
  
  return `${basename}-${timestamp}-${randomString}${ext}`;
}

// Configure multer storage with improved security and naming
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, 'public', 'uploads');
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Criar nome de arquivo seguro
    const sanitized = sanitizeFileName(file.originalname);
    cb(null, sanitized);
  }
});

// Melhorar fileFilter para maior segurança
const fileFilter = (req, file, cb) => {
  // Verificação explícita de mime types permitidos
  const allowedMimes = [
    'image/jpeg', 
    'image/png', 
    'image/gif', 
    'image/webp', 
    'image/avif', 
    'image/svg+xml'
  ];
  
  if (!allowedMimes.includes(file.mimetype)) {
    return cb(new Error(`Tipo de arquivo não permitido! Envie apenas: ${allowedMimes.join(', ')}`), false);
  }
  
  cb(null, true);
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// Função para otimizar imagens com fallback se sharp não estiver disponível
async function optimizeImage(filePath, options = {}) {
  // If sharp is not available, just return the original file path
  if (!sharpAvailable) {
    console.log('⚠️ Image optimization skipped (sharp not available):', path.basename(filePath));
    return filePath;
  }
  
  try {
    const info = await sharp(filePath).metadata();
    
    // Não otimizar SVGs ou GIFs animados
    if (info.format === 'svg' || (info.format === 'gif' && info.pages && info.pages > 1)) {
      return filePath;
    }
    
    // Gerar novo nome para imagem otimizada
    const dir = path.dirname(filePath);
    const ext = path.extname(filePath);
    const base = path.basename(filePath, ext);
    const optimizedPath = path.join(dir, `${base}-optimized${ext}`);
    
    // Configurações padrão
    const width = options.width || 1920; // Largura máxima razoável
    const quality = options.quality || 80; // Bom equilíbrio entre tamanho e qualidade
    
    // Redimensionar e otimizar
    await sharp(filePath)
      .resize({
        width,
        height: options.height,
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({ quality, progressive: true })
      .png({ quality, progressive: true })
      .webp({ quality })
      .toFile(optimizedPath);
    
    // Opcionalmente, remover arquivo original
    if (options.replace) {
      fs.unlinkSync(filePath);
      fs.renameSync(optimizedPath, filePath);
      return filePath;
    }
    
    return optimizedPath;
  } catch (error) {
    console.error('Image optimization error:', error);
    // Em caso de erro, retornar caminho original
    return filePath;
  }
}

// Autenticação simples
function adminAuth(req, res, next) {
  const token = req.headers['authorization'];
  if (token === `Bearer ${ADMIN_TOKEN}`) return next();
  res.status(401).json({ error: 'Não autorizado' });
}

// Helper para operações do banco
async function safeDb(operation, fallback = null) {
  if (!dbReady) return fallback;
  try {
    return await operation();
  } catch (error) {
    console.error('DB Error:', error.message);
    return fallback;
  }
}

// ROTAS PRINCIPAIS
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/noticia/:slug', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'noticia.html'));
});

// LOGIN ADMIN
app.post('/api/admin/login', async (req, res) => {
  const { username, password } = req.body;
  const passHash = crypto.createHash('sha256').update(password || '').digest('hex');
  const result = await safeDb(async () => {
    const [rows] = await executeQuery('SELECT * FROM admin_users WHERE username = ? AND password_hash = ?', [username, passHash]);
    return rows.length > 0;
  }, false);

  if (result) {
    res.json({ success: true, token: ADMIN_TOKEN });
  } else {
    res.status(401).json({ success: false, message: 'Credenciais inválidas' });
  }
});

// API PÚBLICA - LISTAR ARTIGOS
app.get('/api/publications', async (req, res) => {
  const result = await safeDb(async () => {
    const [rows] = await executeQuery(`
      SELECT id, titulo, slug, resumo, autor, data_publicacao,
             thumbnail, imagem_destaque, categoria,
             DATE_FORMAT(data_publicacao, '%d/%m/%Y') as data_formatada
      FROM publications 
      WHERE status = 'publicado' 
      ORDER BY data_publicacao DESC
    `);
    return rows;
  }, []);
  res.json(result);
});

// API PÚBLICA - ARTIGO ESPECÍFICO
app.get('/api/publications/:slug', async (req, res) => {
  const { slug } = req.params;
  
  const result = await safeDb(async () => {
    const [rows] = await executeQuery(`
      SELECT id, titulo, slug, resumo, conteudo, autor, categoria, data_publicacao,
             thumbnail, imagem_destaque,
             DATE_FORMAT(data_publicacao, '%d/%m/%Y às %H:%i') as data_formatada
      FROM publications 
      WHERE slug = ? AND status = 'publicado'
    `, [slug]);
    
    return rows.length > 0 ? rows[0] : null;
  }, null);
  
  if (result) {
    // Sanitize HTML content to prevent XSS
    result.conteudo = sanitizeHtml(result.conteudo || '', {
      allowedTags: sanitizeHtml.defaults.allowedTags.concat([
        'img', 'h1', 'h2', 'h3', 'h4', 'blockquote', 'pre', 'code'
      ]),
      allowedAttributes: {
        ...sanitizeHtml.defaults.allowedAttributes,
        img: ['src', 'alt', 'title', 'width', 'height', 'loading', 'class']
      }
    });
    res.json(result);
  } else {
    res.status(404).json({ error: 'Artigo não encontrado' });
  }
});

// ADMIN - LISTAR TODOS OS ARTIGOS
app.get('/api/admin/publications', adminAuth, async (req, res) => {
  const result = await safeDb(async () => {
    const [rows] = await executeQuery('SELECT * FROM publications ORDER BY id DESC');
    return Array.isArray(rows) ? rows : [];
  }, []);
  res.json(result);
});

// ADMIN - CRIAR ARTIGO
app.post('/api/admin/publications', adminAuth, async (req, res) => {
  const {
    titulo, slug, resumo, conteudo, categoria, autor, status,
    imagem_destaque, thumbnail, tags
  } = req.body;

  if (!titulo || !slug) {
    return res.status(400).json({ error: 'Título e slug são obrigatórios' });
  }

  // Verificar unicidade do slug
  const slugExists = await safeDb(async () => {
    const [rows] = await executeQuery('SELECT id FROM publications WHERE slug = ?', [slug]);
    return rows.length > 0;
  }, false);
  if (slugExists) {
    return res.status(400).json({ error: 'Slug já existe. Escolha outro.' });
  }

  const result = await safeDb(async () => {
    await executeQuery(`
      INSERT INTO publications (titulo, slug, resumo, conteudo, categoria, autor, status, imagem_destaque, thumbnail, tags) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      titulo, slug, resumo || '', conteudo || '', categoria || '', autor || 'Equipe Estevan Hub',
      status || 'publicado', imagem_destaque || '', thumbnail || '', tags || ''
    ]);
    return true;
  }, false);

  if (result) {
    res.json({ success: true });
  } else {
    res.status(500).json({ error: 'Erro ao criar artigo' });
  }
});

// ADMIN - EDITAR ARTIGO
app.put('/api/admin/publications/:id', adminAuth, async (req, res) => {
  const { id } = req.params;
  const {
    titulo, slug, resumo, conteudo, categoria, autor, status,
    imagem_destaque, thumbnail, tags, data_publicacao
  } = req.body;

  let query = `
    UPDATE publications 
    SET titulo=?, slug=?, resumo=?, conteudo=?, categoria=?, autor=?, status=?, imagem_destaque=?, thumbnail=?, tags=?
  `;
  let params = [
    titulo, slug, resumo || '', conteudo || '', categoria || '', autor || 'Equipe Estevan Hub',
    status || 'publicado', imagem_destaque || '', thumbnail || '', tags || ''
  ];
  if (data_publicacao) {
    query += ', data_publicacao=?';
    params.push(data_publicacao);
  }
  query += ' WHERE id=?';
  params.push(id);

  const result = await safeDb(async () => {
    const [result] = await executeQuery(query, params);
    return result.affectedRows > 0;
  }, false);

  if (result) {
    res.json({ success: true });
  } else {
    res.status(500).json({ error: 'Erro ao editar artigo' });
  }
});

// ADMIN - EXCLUIR ARTIGO
app.delete('/api/admin/publications/:id', adminAuth, async (req, res) => {
  const { id } = req.params;
  const result = await safeDb(async () => {
    const [result] = await executeQuery('DELETE FROM publications WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }, false);

  if (result) {
    res.json({ success: true });
  } else {
    res.status(500).json({ error: 'Erro ao excluir artigo' });
  }
});

// CRUD USUÁRIOS (mantido simples)
app.get('/api/client/users', adminAuth, async (req, res) => {
  const result = await safeDb(async () => {
    const [rows] = await executeQuery('SELECT id, username, active FROM client_users ORDER BY username');
    return Array.isArray(rows) ? rows : [];
  }, []);
  res.json(result);
});

app.post('/api/client/users', adminAuth, async (req, res) => {
  const { username, password, active = 1 } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Usuário e senha obrigatórios' });
  }
  const passHash = crypto.createHash('sha256').update(password).digest('hex');
  const result = await safeDb(async () => {
    await executeQuery('INSERT INTO client_users (username, password_hash, active) VALUES (?, ?, ?)', [username, passHash, active ? 1 : 0]);
    return true;
  }, false);

  if (result) {
    res.json({ success: true });
  } else {
    res.status(500).json({ error: 'Erro ao criar usuário' });
  }
});

app.put('/api/client/users/:id', adminAuth, async (req, res) => {
  const { id } = req.params;
  const { username, password, active } = req.body;
  let query = 'UPDATE client_users SET username = ?, active = ?';
  let params = [username, active ? 1 : 0];
  if (password) {
    query += ', password_hash = ?';
    params.push(crypto.createHash('sha256').update(password).digest('hex'));
  }
  query += ' WHERE id = ?';
  params.push(id);

  const result = await safeDb(async () => {
    const [result] = await executeQuery(query, params);
    return result.affectedRows > 0;
  }, false);

  if (result) {
    res.json({ success: true });
  } else {
    res.status(500).json({ error: 'Erro ao editar usuário' });
  }
});

app.delete('/api/client/users/:id', adminAuth, async (req, res) => {
  const { id } = req.params;
  const result = await safeDb(async () => {
    const [result] = await executeQuery('DELETE FROM client_users WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }, false);

  if (result) {
    res.json({ success: true });
  } else {
    res.status(500).json({ error: 'Erro ao excluir usuário' });
  }
});

// Melhorar a rota de upload com tratamento de erros mais robusto
app.post('/api/admin/upload', adminAuth, (req, res) => {
  upload.single('file')(req, res, async function(err) {
    if (err) {
      console.error('Upload error:', err);
      
      // Tratamento de erros específicos
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ 
          success: false, 
          error: 'O arquivo é muito grande! Limite de 10MB.' 
        });
      }
      
      return res.status(400).json({ 
        success: false, 
        error: err.message || 'Erro ao fazer upload do arquivo' 
      });
    }
    
    try {
      if (!req.file) {
        return res.status(400).json({ 
          success: false, 
          error: 'Nenhum arquivo enviado' 
        });
      }
      
      // Caminho completo para o arquivo
      const filePath = req.file.path;
      
      // Otimizar imagem (exceto SVGs) se sharp estiver disponível
      let finalPath = filePath;
      if (sharpAvailable && !['.svg', '.svg+xml'].some(ext => req.file.mimetype.includes(ext))) {
        try {
          await optimizeImage(filePath, { replace: true });
          console.log('Imagem otimizada com sucesso:', path.basename(filePath));
        } catch (optimizeError) {
          console.error('Erro ao otimizar imagem:', optimizeError);
          // Continua usando a imagem original em caso de erro
        }
      }
      
      // Obter URL relativa para o arquivo
      const relativePath = filePath.split('public')[1];
      const url = relativePath.replace(/\\/g, '/'); // Normaliza para URLs no formato /uploads/file.jpg
      
      // Responder no formato unificado compatível com CKEditor e uploads diretos
      const response = {
        success: true,
        url,
        fileName: req.file.filename,
        originalName: req.file.originalname
      };
      
      // Adicionar propriedades específicas para o CKEditor
      if (req.query.ckCsrfToken || req.headers['x-ckeditor']) {
        response.uploaded = 1;
        response.default = url;
      }
      
      res.json(response);
    } catch (error) {
      console.error('Upload processing error:', error);
      
      // Remover arquivo em caso de erro no processamento
      if (req.file && req.file.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      
      res.status(500).json({ 
        success: false, 
        error: 'Falha ao processar o arquivo após upload', 
        message: error.message 
      });
    }
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});