const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Configuração da Conexão
const db = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10
}).promise(); // Usando Promise para facilitar o uso de async/await

// Rota para Cadastrar Cliente Completo (Com Transação)
app.post('/api/clientes', async (req, res) => {
    const { 
        tipo_pessoa, documento, razao_social, nome_fantasia, 
        email, telefones, enderecos, usuario_id 
    } = req.body;

    let connection;

    try {
        // Pega uma conexão do pool
        connection = await db.getConnection();
        
        // Inicia a Transação
        await connection.beginTransaction();

        // 1. Inserir Cliente
        const sqlCliente = `
            INSERT INTO clientes (tipo_pessoa, documento, razao_social, nome_fantasia, email_principal, usuario_id) 
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        const [resCliente] = await connection.query(sqlCliente, [
            tipo_pessoa, documento, razao_social, nome_fantasia, email, usuario_id || null
        ]);
        const clienteId = resCliente.insertId;

        // 2. Inserir Telefones
        if (telefones && telefones.length > 0) {
            const sqlTelefone = `INSERT INTO cliente_telefones (cliente_id, numero, tipo) VALUES (?, ?, ?)`;
            for (const tel of telefones) {
                if (tel.numero) {
                    await connection.query(sqlTelefone, [clienteId, tel.numero, tel.tipo]);
                }
            }
        }

        // 3. Inserir Endereços (Atualizado com Bairro e CEP)
        if (enderecos && enderecos.length > 0) {
            const sqlEndereco = `
                INSERT INTO cliente_enderecos (cliente_id, logradouro, numero, complemento, bairro, cidade, estado, cep, tipo) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            for (const end of enderecos) {
                if (end.logradouro) {
                    await connection.query(sqlEndereco, [
                        clienteId, end.logradouro, end.numero, end.complemento || null, end.bairro || '', 
                        end.cidade, end.estado, end.cep || '', end.tipo
                    ]);
                }
            }
        }

        // Se chegou aqui sem erro, confirma tudo no banco
        await connection.commit();
        console.log(`✅ Cliente ${clienteId} cadastrado com sucesso!`);
        res.status(201).json({ message: "Cliente cadastrado com sucesso!", id: clienteId });

    } catch (error) {
        // Se deu qualquer erro, desfaz as inserções anteriores
        if (connection) await connection.rollback();
        console.error("❌ Erro na transação:", error);
        res.status(500).json({ error: "Erro ao salvar cliente", details: error.message });

    } finally {
        // Libera a conexão de volta para o pool
        if (connection) connection.release();
    }
});

// Rota de Teste para verificar se o servidor está ON
app.get('/health', (req, res) => res.send("API Rodando! 🚀"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});