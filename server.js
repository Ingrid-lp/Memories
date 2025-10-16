const express = require('express');
const mysql = require('mysql');
const cors = require('cors');
const bodyParser = require('body-parser');

// ADICIONAR: Módulos para lidar com upload de ficheiros e caminhos
const multer = require('multer');
const path = require('path');

const app = express();
const port = 3000;

// Configuração do armazenamento do Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // O ficheiro será salvo na pasta 'uploads/'
        cb(null, 'uploads/'); 
    },
    filename: (req, file, cb) => {
        // Cria um nome de ficheiro único para a imagem
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// MIDDLEWARES
app.use(cors());

// Configura o Express para servir ficheiros estáticos da pasta 'uploads' (para aceder às imagens)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Manter o body-parser.json para rotas que esperam JSON (login, register, PUTs)
app.use(bodyParser.json()); 

// Configurações do seu banco de dados MySQL
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root', // <-- Substitua pelo seu usuário do MySQL
    password: 'MinhaSenha@123', // <-- Substitua pela sua senha
    database: 'memories_db'
});

db.connect(err => {
    if (err) {
        console.error('Erro ao conectar ao MySQL:', err);
        return;
    }
    console.log('Conectado ao MySQL com sucesso!');

    // Cria as tabelas se elas não existirem
    const createUsersTable = `CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL
    )`;
    const createAlbumsTable = `CREATE TABLE IF NOT EXISTS albums (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        userId INT,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    )`;
    // ATUALIZADO: Adicionada a coluna 'sentiment'
    const createMemoriesTable = `CREATE TABLE IF NOT EXISTS memories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255),
        description TEXT,
        date VARCHAR(255),
        imageUrl TEXT,
        userId INT,
        albumId INT DEFAULT NULL,
        sentiment VARCHAR(255),
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (albumId) REFERENCES albums(id) ON DELETE SET NULL
    )`;

    db.query(createUsersTable, err => { if (err) console.error('Erro ao criar tabela de usuários:', err); });
    db.query(createAlbumsTable, err => { if (err) console.error('Erro ao criar tabela de álbuns:', err); });
    db.query(createMemoriesTable, err => { if (err) console.error('Erro ao criar tabela de memórias:', err); });
});

// Rotas da API para Autenticação
app.post('/register', (req, res) => {
    const { name, email, password } = req.body;
    const query = 'INSERT INTO users (name, email, password) VALUES (?, ?, ?)';
    db.query(query, [name, email, password], (err, result) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({ message: 'Email já cadastrado.' });
            }
            return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ message: 'Conta criada com sucesso!' });
    });
});

app.post('/login', (req, res) => {
    const { email, password } = req.body;
    const query = 'SELECT id, name FROM users WHERE email = ? AND password = ?';
    db.query(query, [email, password], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length > 0) {
            res.json({ user: { id: results[0].id, name: results[0].name } });
        } else {
            res.status(401).json({ message: 'Email ou senha incorretos.' });
        }
    });
});

// Rotas da API para Memórias
app.get('/memories/:userId', (req, res) => {
    const { userId } = req.params;
    const query = 'SELECT * FROM memories WHERE userId = ?';
    db.query(query, [userId], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// ROTA ATUALIZADA: agora salva o campo 'sentiment'
app.post('/memories', upload.single('memoryImage'), (req, res) => {
    // 1. Verifica se o ficheiro foi carregado (o Multer popula req.file)
    if (!req.file) {
        return res.status(400).json({ message: 'O ficheiro da memória (imagem) é obrigatório.' });
    }

    // 2. O URL da imagem é o caminho para onde o Multer salvou o ficheiro
    const imageUrl = `/uploads/${req.file.filename}`;
    
    // 3. Os outros campos vêm do req.body (o Multer consegue ler campos de texto do FormData)
    // ATUALIZADO: Adicionado 'sentiment' à desestruturação
    const { title, description, date, userId, albumId, sentiment } = req.body;

    // 4. Salva os dados no banco de dados
    // ATUALIZADO: Adicionado 'sentiment' à query e aos parâmetros
    const query = 'INSERT INTO memories (title, description, date, imageUrl, userId, albumId, sentiment) VALUES (?, ?, ?, ?, ?, ?, ?)';
    // Usa albumId || null para garantir que o MySQL recebe NULL para IDs vazios (importante para FK)
    // Usa sentiment || null para salvar NULL se o valor for string vazia.
    db.query(query, [title, description, date, imageUrl, userId, albumId || null, sentiment || null], (err, result) => {
        if (err) {
            console.error('Erro ao inserir no banco de dados:', err);
            return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ 
            id: result.insertId, 
            imageUrl: imageUrl, 
            message: 'Memória adicionada com sucesso!' 
        });
    });
});

// ROTA ATUALIZADA: permite a atualização do campo 'sentiment'
app.put('/memories/:id', (req, res) => {
    const { id } = req.params;
    // ATUALIZADO: Adicionado 'sentiment'
    const { title, description, date, albumId, sentiment } = req.body;
    let query;
    let params;

    if (albumId !== undefined) {
        query = 'UPDATE memories SET albumId = ? WHERE id = ?';
        // Garante que albumId vazio no frontend vira NULL no DB
        params = [albumId || null, id]; 
    } else {
        // ATUALIZADO: Adicionado 'sentiment'
        query = 'UPDATE memories SET title = ?, description = ?, date = ?, sentiment = ? WHERE id = ?';
        // Usa sentiment || null para salvar NULL se o valor for string vazia.
        params = [title, description, date, sentiment || null, id];
    }

    db.query(query, params, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Memória não encontrada.' });
        }
        res.json({ message: 'Memória atualizada com sucesso!' });
    });
});

app.delete('/memories/:id', (req, res) => {
    const { id } = req.params;
    const query = 'DELETE FROM memories WHERE id = ?';
    db.query(query, [id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Memória não encontrada.' });
        }
        res.json({ message: 'Memória excluída com sucesso!' });
    });
});

// Rotas da API para Álbuns
app.get('/albums/:userId', (req, res) => {
    const { userId } = req.params;
    const query = 'SELECT * FROM albums WHERE userId = ?';
    db.query(query, [userId], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

app.post('/albums', (req, res) => {
    const { title, userId } = req.body;
    const query = 'INSERT INTO albums (title, userId) VALUES (?, ?)';
    db.query(query, [title, userId], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ id: result.insertId, message: 'Álbum criado com sucesso!' });
    });
});

app.put('/albums/:id', (req, res) => {
    const { id } = req.params;
    const { title } = req.body;
    const query = 'UPDATE albums SET title = ? WHERE id = ?';
    db.query(query, [title, id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Álbum não encontrado.' });
        }
        res.json({ message: 'Álbum atualizado com sucesso!' });
    });
});

app.delete('/albums/:id', (req, res) => {
    const { id } = req.params;
    const query = 'DELETE FROM albums WHERE id = ?';
    db.query(query, [id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Álbum não encontrado.' });
        }
        res.json({ message: 'Álbum excluída com sucesso!' });
    });
});

app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});
