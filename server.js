const express = require('express');
const mysql = require('mysql');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.json());

// Configurações do seu banco de dados MySQL
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root', // <-- Substitua pelo seu usuário do MySQL
    password: 'password', // <-- Substitua pela sua senha
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
    const createMemoriesTable = `CREATE TABLE IF NOT EXISTS memories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255),
        description TEXT,
        date VARCHAR(255),
        imageUrl TEXT,
        userId INT,
        albumId INT DEFAULT NULL,
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

app.post('/memories', (req, res) => {
    const { title, description, date, imageUrl, userId, albumId } = req.body;
    const query = 'INSERT INTO memories (title, description, date, imageUrl, userId, albumId) VALUES (?, ?, ?, ?, ?, ?)';
    db.query(query, [title, description, date, imageUrl, userId, albumId], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ id: result.insertId, message: 'Memória adicionada com sucesso!' });
    });
});

app.put('/memories/:id', (req, res) => {
    const { id } = req.params;
    const { title, description, date, albumId } = req.body;
    let query;
    let params;

    if (albumId !== undefined) {
        query = 'UPDATE memories SET albumId = ? WHERE id = ?';
        params = [albumId, id];
    } else {
        query = 'UPDATE memories SET title = ?, description = ?, date = ? WHERE id = ?';
        params = [title, description, date, id];
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
        res.json({ message: 'Álbum excluído com sucesso!' });
    });
});

app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});