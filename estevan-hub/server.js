require('dotenv').config();
const express = require('express');
const path = require('path');
const crypto = require('crypto');
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

// Autenticação simples
function adminAuth(req, res, next) {
  const token = req.headers['authorization'];
  if (token === `Bearer admin_token_123`) return next();
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
             thumbnail,
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
      SELECT id, titulo, slug, resumo, conteudo, autor, data_publicacao,
             thumbnail,
             DATE_FORMAT(data_publicacao, '%d/%m/%Y às %H:%i') as data_formatada
      FROM publications 
      WHERE slug = ? AND status = 'publicado'
    `, [slug]);
    
    return rows.length > 0 ? rows[0] : null;
  }, null);
  
  if (result) {
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
    imagem_destaque, thumbnail, tags
  } = req.body;

  const result = await safeDb(async () => {
    const [result] = await executeQuery(`
      UPDATE publications 
      SET titulo=?, slug=?, resumo=?, conteudo=?, categoria=?, autor=?, status=?, imagem_destaque=?, thumbnail=?, tags=?
      WHERE id=?
    `, [
      titulo, slug, resumo || '', conteudo || '', categoria || '', autor || 'Equipe Estevan Hub',
      status || 'publicado', imagem_destaque || '', thumbnail || '', tags || '', id
    ]);
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
  
  const result = await safeDb(async () => {
    let query = 'UPDATE client_users SET username = ?, active = ?';
    let params = [username, active ? 1 : 0];
    
    if (password) {
      query += ', password_hash = ?';
      params.push(crypto.createHash('sha256').update(password).digest('hex'));
    }
    
    query += ' WHERE id = ?';
    params.push(id);
    
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

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});