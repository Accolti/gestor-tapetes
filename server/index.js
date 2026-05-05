const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

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

// --- CONFIGURAÇÃO DE UPLOAD (LOGOS) ---

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = './uploads/';
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const userId = req.body.usuario_id || 'unknown';
        cb(null, `logo_user_${userId}_${Date.now()}${ext}`);
    }
});

const upload = multer({ storage });

// Servir arquivos estáticos (Logos)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


//CONFIGURAÇÕES REFERENTES AO ORÇAMENTO
// 1. FILTRO 1: Lista todos os produtos (VW_FILTRO_PRODUTOS)
app.get('/api/produtos-lista', async (req, res) => {
    try {
        const [rows] = await db.query("SELECT * FROM vw_filtro_produtos");
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: "Erro ao buscar lista de produtos" });
    }
});

// 2. FILTROS 2, 3 e 4: Busca as opções disponíveis para um produto específico
app.get('/api/produto-detalhes/:id', async (req, res) => {
    const { id } = req.params;
    try {
        // Buscamos as combinações únicas para este produto
        const [rows] = await db.query(
            "SELECT DISTINCT id_produto, id_matriz_preco, attr_linha, attr_tipo, attr_nivel FROM vw_filtro_matriz_atributos WHERE id_produto = ?", 
            [id]
        );

        // Organizamos os dados para facilitar o trabalho do Vue
        const detalhes = {
            linhas: [...new Set(rows.map(r => r.attr_linha))].filter(Boolean),
            tipos: [...new Set(rows.map(r => r.attr_tipo))].filter(Boolean),
            niveis: [...new Set(rows.map(r => r.attr_nivel))].filter(Boolean)
        };

        res.json(detalhes);
    } catch (error) {
        res.status(500).json({ error: "Erro ao buscar detalhes do produto" });
    }
});

// 3. RESULTADO FINAL: Busca o preço e dados completos após selecionar os 4 filtros
app.get('/api/produto-preco-final', async (req, res) => {
    const { produtoId, linha, tipo, nivel } = req.query;
    
    try {
        // Buscamos na view detalhada usando os filtros de texto selecionados
        const [rows] = await db.query(
            `SELECT * FROM vw_produto_completo_detalhado 
             WHERE id_produto = ? AND attr_linha <=> ? AND attr_tipo <=> ? AND attr_nivel <=> ?`,
            [produtoId, linha || null, tipo || null, nivel || null]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: "Produto não encontrado na matriz." });
        }

        // Como um produto pode ter múltiplos acessórios na view (devido ao join), 
        // vamos retornar o primeiro registro para pegar o preço base e, 
        // se precisar, você pode tratar a lista de acessórios depois.
        res.json(rows[0]); 
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erro ao buscar detalhes finais do produto." });
    }
});
// 1. Rota para carregar a lista de acessórios (Filtro 5)
app.get('/api/produto-acessorios/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await db.query("SELECT * FROM vw_filtro_acessorios WHERE id_produto = ?", [id]);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: "Erro ao buscar acessórios" });
    }
});

// 2. Rota do Preço Final (Apenas a Matriz, o acessório tratamos no Vue)
app.get('/api/produto-preco-final', async (req, res) => {
    const { produtoId, linha, tipo, nivel } = req.query;
    try {
        const [rows] = await db.query(
            "SELECT * FROM vw_produto_completo_detalhado WHERE id_produto = ? AND attr_linha = ? AND attr_tipo = ? AND attr_nivel = ?",
            [produtoId, linha, tipo, nivel]
        );
        res.json(rows[0] || {});
    } catch (error) {
        res.status(500).json({ error: "Erro ao buscar preço final" });
    }
});
//FIM CONFIGIRAÇÕES REFERENTES AO ORÇAMENTO

// --- CONFIGURAÇÕES FISCAIS E EMPRESA (SaaS) ---

app.get('/api/config/estados', async (req, res) => {
    try {
        const [estados] = await db.query("SELECT * FROM config_estados_fiscais ORDER BY uf ASC");
        res.json(estados);
    } catch (error) {
        console.error("Erro ao buscar estados:", error);
        res.status(500).json({ error: "Erro ao buscar estados." });
    }
});

app.get('/api/config-completa/:id_usuario', async (req, res) => {
    const { id_usuario } = req.params;
    try {
        const [config] = await db.query(
            "SELECT * FROM vw_configuracao_completa_usuario WHERE id_usuario = ?", 
            [id_usuario]
        );
        if (config.length === 0) return res.status(404).json({ message: "Configuração não encontrada." });
        res.json(config[0]);
    } catch (error) {
        console.error("Erro ao carregar View:", error);
        res.status(500).json({ error: "Erro ao carregar dados da View." });
    }
});

// SALVAR OU ATUALIZAR (Transaction para Empresa + Logística)
// ROTA POST CORRIGIDA
// SALVAR OU ATUALIZAR (Correção Definitiva do Regime Tributário)
app.post('/api/config-empresa', upload.single('logo_file'), async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // Log para ver o que vem do Vue
        console.log("Dados Recebidos:", req.body);

        const {
            usuario_id, tipo_identificacao, documento, razao_social, 
            nome_fantasia, uf_sede, regime_tributario, 
            imposto_venda_percentual, custo_fixo_operacional, markup_alvo,
            valor_minimo_isencao, valor_frete_padrao
        } = req.body;

        let logo_path = req.file ? req.file.filename : req.body.logo_path;

        // 1. Atualizar config_empresa
        const sqlEmpresa = `
            INSERT INTO config_empresa 
                (id_usuario, tipo_identificacao, documento, razao_social, nome_fantasia, regime_tributario, imposto_venda_percentual, custo_fixo_operacional, markup_alvo, logo_path) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE 
                tipo_identificacao = VALUES(tipo_identificacao),
                documento = VALUES(documento),
                razao_social = VALUES(razao_social),
                nome_fantasia = VALUES(nome_fantasia),
                regime_tributario = VALUES(regime_tributario), 
                imposto_venda_percentual = VALUES(imposto_venda_percentual),
                custo_fixo_operacional = VALUES(custo_fixo_operacional),
                markup_alvo = VALUES(markup_alvo),
                logo_path = IFNULL(VALUES(logo_path), logo_path)
        `;

        await connection.query(sqlEmpresa, [
            usuario_id, tipo_identificacao, documento, razao_social, 
            nome_fantasia, regime_tributario, imposto_venda_percentual, 
            custo_fixo_operacional, markup_alvo, logo_path
        ]);

        // 2. Atualizar config_frete_fornecedor
        await connection.query(`
            INSERT INTO config_frete_fornecedor 
                (id_usuario, uf_destino, valor_minimo_isencao, valor_frete_padrao, ativo)
            VALUES (?, ?, ?, ?, 1)
            ON DUPLICATE KEY UPDATE 
                uf_destino = VALUES(uf_destino),
                valor_minimo_isencao = VALUES(valor_minimo_isencao),
                valor_frete_padrao = VALUES(valor_frete_padrao)
        `, [usuario_id, uf_sede, valor_minimo_isencao, valor_frete_padrao]);

        await connection.commit();
        console.log("✅ Salvo com sucesso no banco!");
        res.json({ message: "Configurações salvas!" });
    } catch (error) {
        await connection.rollback();
        console.error("❌ ERRO NO BANCO:", error.message);
        res.status(500).json({ error: error.message });
    } finally {
        connection.release();
    }
});// --- RESTO DAS ROTAS (Autenticação, Clientes, Usuários) MANTIDAS ---

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
    try {
        const [usuarios] = await db.query("SELECT id FROM usuarios WHERE LOWER(email) = LOWER(?) AND ativo = 1", [email]);
        if (usuarios.length === 0) return res.status(404).json({ error: "E-mail não encontrado." });
        res.json({ message: "Usuário validado." });
    } catch (error) {
        res.status(500).json({ error: "Erro ao verificar e-mail." });
    }
});

//CLIENTES
app.get('/api/clientes', async (req, res) => {
    const usuario_id = req.query.usuario_id;
    const nivel = req.query.nivel ? String(req.query.nivel).toLowerCase().trim() : '';
    try {
        let sql = "SELECT * FROM clientes";
        let params = [];
        if (nivel !== 'admin') { sql += " WHERE usuario_id = ?"; params.push(usuario_id); }
        sql += " ORDER BY id DESC";
        const [clientes] = await db.query(sql, params);
        const listaCompleta = await Promise.all(clientes.map(async (c) => {
            const [tels] = await db.query("SELECT numero, tipo FROM cliente_telefones WHERE cliente_id = ?", [c.id]);
            const [ends] = await db.query("SELECT logradouro, numero, complemento, bairro, cidade, estado, cep, tipo FROM cliente_enderecos WHERE cliente_id = ?", [c.id]);
            return { ...c, email: c.email_principal, telefones: tels, enderecos: ends };
        }));
        res.json(listaCompleta);
    } catch (error) {
        res.status(500).json({ error: "Erro ao buscar clientes" });
    }
});

app.post('/api/clientes', async (req, res) => {
    const { tipo_pessoa, documento, razao_social, nome_fantasia, ie, email, telefones, enderecos, usuario_id } = req.body;
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const [resCliente] = await connection.query(
            "INSERT INTO clientes (tipo_pessoa, documento, razao_social, nome_fantasia, ie, email_principal, usuario_id) VALUES (?, ?, ?, ?, ?,?, ?)",
            [tipo_pessoa, documento, razao_social, nome_fantasia, ie || null, email, usuario_id || null]
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
// ATUALIZAR CLIENTE (PUT)
app.put('/api/clientes/:id', async (req, res) => {
    const { id } = req.params;
    const { tipo_pessoa, documento, razao_social, nome_fantasia, ie, email, telefones, enderecos } = req.body;
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Atualiza dados básicos
        await connection.query(
            "UPDATE clientes SET tipo_pessoa=?, documento=?, razao_social=?, nome_fantasia=?, ie=?, email_principal=? WHERE id=?",
            [tipo_pessoa, documento, razao_social, nome_fantasia, ie, email, id]
        );

        // 2. Atualiza Telefones (Remove os antigos e insere os novos para simplificar)
        await connection.query("DELETE FROM cliente_telefones WHERE cliente_id = ?", [id]);
        if (telefones) {
            for (const tel of telefones) {
                if (tel.numero) await connection.query("INSERT INTO cliente_telefones (cliente_id, numero, tipo) VALUES (?, ?, ?)", [id, tel.numero, tel.tipo]);
            }
        }

        // 3. Atualiza Endereços (Remove os antigos e insere os novos)
        await connection.query("DELETE FROM cliente_enderecos WHERE cliente_id = ?", [id]);
        if (enderecos) {
            for (const end of enderecos) {
                if (end.logradouro) await connection.query(
                    "INSERT INTO cliente_enderecos (cliente_id, logradouro, numero, complemento, cep,  cidade, estado, tipo) VALUES (?, ?, ?, ?, ?, ?, ?,?)",
                    [id, end.logradouro, end.numero, end.complemento, end.cep, end.cidade, end.estado, end.tipo]
                );
            }
        }

        await connection.commit();
        res.json({ message: "Cliente atualizado com sucesso!" });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ error: error.message });
    } finally {
        connection.release();
    }
});

// EXCLUIR CLIENTE (DELETE)
app.delete('/api/clientes/:id', async (req, res) => {
    const { id } = req.params;
    try {
        // As tabelas filhas (telefones/endereços) devem ter ON DELETE CASCADE no banco, 
        // se não tiverem, precisamos deletar manualmente:
        await db.query("DELETE FROM cliente_telefones WHERE cliente_id = ?", [id]);
        await db.query("DELETE FROM cliente_enderecos WHERE cliente_id = ?", [id]);
        await db.query("DELETE FROM clientes WHERE id = ?", [id]);
        
        res.json({ message: "Cliente excluído com sucesso!" });
    } catch (error) {
        res.status(500).json({ error: "Erro ao excluir cliente." });
    }
});

//USUARIOS
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

// ATUALIZAR USUÁRIO (PUT)
app.put('/api/usuarios/:id', async (req, res) => {
    const { id } = req.params;
    const { nome, email, senha_hash, nivel_acesso, comissao_padrao, ativo, telefones, enderecos } = req.body;
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Atualiza dados básicos (senha só se for enviada)
        let sql = "UPDATE usuarios SET nome=?, email=?, nivel_acesso=?, comissao_padrao=?, ativo=? WHERE id=?";
        let params = [nome, email, nivel_acesso, comissao_padrao, ativo, id];
        
        await connection.query(sql, params);

        // 2. Atualiza Telefones
        await connection.query("DELETE FROM usuario_telefones WHERE usuario_id = ?", [id]);
        if (telefones) {
            for (const tel of telefones) {
                if (tel.numero) await connection.query("INSERT INTO usuario_telefones (usuario_id, numero, tipo) VALUES (?, ?, ?)", [id, tel.numero, tel.tipo]);
            }
        }

        // 3. Atualiza Endereços
        await connection.query("DELETE FROM usuario_enderecos WHERE usuario_id = ?", [id]);
        if (enderecos) {
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
        res.status(500).json({ error: error.message });
    } finally {
        connection.release();
    }
});

// CRIAR USUÁRIO (POST)
app.post('/api/usuarios', async (req, res) => {
    const { nome, email, senha_hash, nivel_acesso, comissao_padrao, telefones, enderecos } = req.body;
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const [resUser] = await connection.query(
            "INSERT INTO usuarios (nome, email, senha_hash, nivel_acesso, comissao_padrao, ativo) VALUES (?, ?, ?, ?, ?, 1)",
            [nome, email, senha_hash, nivel_acesso, comissao_padrao]
        );
        const usuarioId = resUser.insertId;

        if (telefones) {
            for (const tel of telefones) {
                if (tel.numero) await connection.query("INSERT INTO usuario_telefones (usuario_id, numero, tipo) VALUES (?, ?, ?)", [usuarioId, tel.numero, tel.tipo]);
            }
        }
        if (enderecos) {
            for (const end of enderecos) {
                if (end.logradouro) await connection.query(
                    "INSERT INTO usuario_enderecos (usuario_id, logradouro, numero, complemento, cidade, estado, cep, tipo) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                    [usuarioId, end.logradouro, end.numero, end.complemento, end.cidade, end.estado, end.cep, end.tipo]
                );
            }
        }

        await connection.commit();
        res.status(201).json({ message: "Usuário cadastrado!" });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ error: error.message });
    } finally {
        connection.release();
    }
});

app.get('/health', (req, res) => res.send("API Rodando! 🚀"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor rodando em http://192.168.100.49:${PORT}`);
});