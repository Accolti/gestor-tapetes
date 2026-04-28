const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const db = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10
}).promise();

// --- AUTENTICAÇÃO ---

app.post('/api/login', async (req, res) => {
    const { email, senha } = req.body;
    try {
        const [usuarios] = await db.query("SELECT * FROM usuarios WHERE email = ?", [email]);
        if (usuarios.length === 0) return res.status(401).json({ error: "E-mail não cadastrado." });

        const user = usuarios[0];
        if (senha !== user.senha_hash) return res.status(401).json({ error: "Senha incorreta." });

        const token = jwt.sign(
            { id: user.id, nome: user.nome, nivel: user.nivel_acesso },
            process.env.JWT_SECRET || 'chave_seguranca_padrao',
            { expiresIn: '8h' }
        );

        res.json({ token, user: { id: user.id, nome: user.nome, nivel: user.nivel_acesso } });
    } catch (error) {
        res.status(500).json({ error: "Erro interno no servidor." });
    }
});

app.post('/api/usuarios/verificar-email', async (req, res) => {
    const email = req.body.email ? req.body.email.trim() : '';
    console.log(`🔍 Verificando e-mail: "${email}"`);
    try {
        // LOWER ajuda a ignorar diferenças entre Maiúsculas e Minúsculas
        const [usuarios] = await db.query("SELECT id FROM usuarios WHERE LOWER(email) = LOWER(?) AND ativo = 1", [email]);
        
        if (usuarios.length === 0) {
            console.log("❌ E-mail não encontrado no banco.");
            return res.status(404).json({ error: "E-mail não encontrado ou usuário inativo." });
        }
        
        res.json({ message: "Usuário validado." });
    } catch (error) {
        console.error("🔥 Erro SQL:", error);
        res.status(500).json({ error: "Erro ao verificar e-mail." });
    }
});

app.post('/api/usuarios/definir-senha', async (req, res) => {
    const { email, senha } = req.body;
    try {
        const [result] = await db.query("UPDATE usuarios SET senha_hash = ? WHERE email = ?", [senha, email]);
        if (result.affectedRows === 0) return res.status(404).json({ error: "Usuário não encontrado." });
        res.json({ message: "Senha atualizada com sucesso!" });
    } catch (error) {
        res.status(500).json({ error: "Erro ao salvar nova senha." });
    }
});

// --- CLIENTES ---

app.get('/api/clientes', async (req, res) => {
    // Pegamos os parâmetros da query string
    const usuario_id = req.query.usuario_id;
    const nivel = req.query.nivel ? String(req.query.nivel).toLowerCase().trim() : '';

    console.log(`--- NOVA REQUISIÇÃO DE CLIENTES ---`);
    console.log(`👤 Usuário ID: ${usuario_id}`);
    console.log(`🔑 Nível Recebido: "${nivel}"`);

    try {
        let sql = "SELECT * FROM clientes";
        let params = [];

        // Lógica: Se for 'admin', não entra no IF e executa o SELECT puro (traz tudo)
        if (nivel !== 'admin') {
            console.log("🔒 FILTRANDO: Usuário comum só vê seus próprios clientes.");
            sql += " WHERE usuario_id = ?";
            params.push(usuario_id);
        } else {
            console.log("🔓 TOTAL: Admin visualiza todos os registros (inclusive NULLs).");
        }

        sql += " ORDER BY id DESC";

        const [clientes] = await db.query(sql, params);
        console.log(`📊 Clientes encontrados no banco: ${clientes.length}`);

        const listaCompleta = await Promise.all(clientes.map(async (c) => {
            const [tels] = await db.query("SELECT numero, tipo FROM cliente_telefones WHERE cliente_id = ?", [c.id]);
            const [ends] = await db.query("SELECT logradouro, numero, complemento, bairro, cidade, estado, cep, tipo FROM cliente_enderecos WHERE cliente_id = ?", [c.id]);
            return {
                ...c,
                email: c.email_principal,
                telefones: tels.length > 0 ? tels : [{ numero: '', tipo: 'WhatsApp' }],
                enderecos: ends.length > 0 ? ends : [{ logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '', cep: '', tipo: 'Comercial' }]
            };
        }));

        res.json(listaCompleta);
    } catch (error) {
        console.error("❌ ERRO NO BANCO:", error);
        res.status(500).json({ error: "Erro ao buscar clientes" });
    }
});
// ATUALIZAR CLIENTE (PUT) - CORRIGIDO PARA INCLUIR USUARIO_ID
app.put('/api/clientes/:id', async (req, res) => {
    const { id } = req.params;
    const { tipo_pessoa, documento, razao_social, nome_fantasia, email, telefones, enderecos, usuario_id } = req.body;
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        // 1. Atualiza dados principais incluindo o usuario_id
        await connection.query(
            "UPDATE clientes SET tipo_pessoa=?, documento=?, razao_social=?, nome_fantasia=?, email_principal=?, usuario_id=? WHERE id=?",
            [tipo_pessoa, documento, razao_social, nome_fantasia, email, usuario_id || null, id]
        );

        // 2. Atualiza Telefones
        await connection.query("DELETE FROM cliente_telefones WHERE cliente_id = ?", [id]);
        if (telefones) {
            for (const tel of telefones) {
                if (tel.numero) await connection.query("INSERT INTO cliente_telefones (cliente_id, numero, tipo) VALUES (?, ?, ?)", [id, tel.numero, tel.tipo]);
            }
        }

        // 3. Atualiza Endereços
        await connection.query("DELETE FROM cliente_enderecos WHERE cliente_id = ?", [id]);
        if (enderecos) {
            for (const end of enderecos) {
                if (end.logradouro) await connection.query(
                    "INSERT INTO cliente_enderecos (cliente_id, logradouro, numero, complemento, bairro, cidade, estado, cep, tipo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                    [id, end.logradouro, end.numero, end.complemento, end.bairro, end.cidade, end.estado, end.cep, end.tipo]
                );
            }
        }

        await connection.commit();
        res.json({ message: "Cliente atualizado com sucesso!" });
    } catch (error) {
        await connection.rollback();
        console.error("Erro no Update Cliente:", error);
        res.status(500).json({ error: "Erro ao atualizar cliente" });
    } finally {
        connection.release();
    }
});

// CADASTRAR CLIENTE (POST)
app.post('/api/clientes', async (req, res) => {
    const { tipo_pessoa, documento, razao_social, nome_fantasia, email, telefones, enderecos, usuario_id } = req.body;
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const [resCliente] = await connection.query(
            "INSERT INTO clientes (tipo_pessoa, documento, razao_social, nome_fantasia, email_principal, usuario_id) VALUES (?, ?, ?, ?, ?, ?)",
            [tipo_pessoa, documento, razao_social, nome_fantasia, email, usuario_id || null]
        );
        const clienteId = resCliente.insertId;

        if (telefones) {
            for (const tel of telefones) {
                if (tel.numero) await connection.query("INSERT INTO cliente_telefones (cliente_id, numero, tipo) VALUES (?, ?, ?)", [clienteId, tel.numero, tel.tipo]);
            }
        }
        if (enderecos) {
            for (const end of enderecos) {
                if (end.logradouro) await connection.query(
                    "INSERT INTO cliente_enderecos (cliente_id, logradouro, numero, complemento, bairro, cidade, estado, cep, tipo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                    [clienteId, end.logradouro, end.numero, end.complemento, end.bairro, end.cidade, end.estado, end.cep, end.tipo]
                );
            }
        }
        await connection.commit();
        res.status(201).json({ message: "Cliente cadastrado!", id: clienteId });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ error: error.message });
    } finally {
        connection.release();
    }
});

// --- USUÁRIOS ---
app.put('/api/usuarios/:id', async (req, res) => {
    const { id } = req.params;
    const { nome, email, nivel_acesso, comissao_padrao, ativo, telefones, enderecos } = req.body;
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        // 1. Atualiza os dados principais
        // Verifique se o nome da coluna no seu banco é 'nivel_acesso' ou 'nivel'
        const [resUser] = await connection.query(
            "UPDATE usuarios SET nome=?, email=?, nivel_acesso=?, comissao_padrao=?, ativo=? WHERE id=?",
            [nome, email, nivel_acesso, comissao_padrao, ativo, id]
        );

        // 2. Telefones (Limpa e reinsere)
        await connection.query("DELETE FROM usuario_telefones WHERE usuario_id = ?", [id]);
        if (telefones && telefones.length > 0) {
            for (const tel of telefones) {
                if (tel.numero) await connection.query("INSERT INTO usuario_telefones (usuario_id, numero, tipo) VALUES (?, ?, ?)", [id, tel.numero, tel.tipo]);
            }
        }

        // 3. Endereços (Limpa e reinsere)
        await connection.query("DELETE FROM usuario_enderecos WHERE usuario_id = ?", [id]);
        if (enderecos && enderecos.length > 0) {
            for (const end of enderecos) {
                if (end.logradouro) await connection.query(
                    "INSERT INTO usuario_enderecos (usuario_id, logradouro, numero, complemento, cidade, estado, cep, tipo) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                    [id, end.logradouro, end.numero, end.complemento, end.cidade, end.estado, end.cep, end.tipo]
                );
            }
        }

        await connection.commit();
        res.json({ message: "Usuário atualizado com sucesso!" });
    } catch (error) {
        await connection.rollback();
        console.error("❌ ERRO AO ATUALIZAR USUÁRIO:", error.message); // Isso vai aparecer no seu terminal
        res.status(500).json({ error: "Erro ao salvar usuário: " + error.message });
    } finally {
        connection.release();
    }
});

app.get('/api/usuarios', async (req, res) => {
    try {
        const [usuarios] = await db.query("SELECT id, nome, email, nivel_acesso, comissao_padrao, ativo FROM usuarios ORDER BY nome ASC");
        const listaCompleta = await Promise.all(usuarios.map(async (u) => {
            const [tels] = await db.query("SELECT numero, tipo FROM usuario_telefones WHERE usuario_id = ?", [u.id]);
            const [ends] = await db.query("SELECT logradouro, numero, complemento, cidade, estado, cep, tipo FROM usuario_enderecos WHERE usuario_id = ?", [u.id]);
            return { ...u, telefones: tels, enderecos: ends };
        }));
        res.json(listaCompleta);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/health', (req, res) => res.send("API Rodando! 🚀"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});