
        // ============================================
        // CONFIGURAÇÃO DO FIREBASE (EXEMPLO)
        // ============================================
        const firebaseConfig = {
            apiKey: "sua-api-key",
            authDomain: "seu-projeto.firebaseapp.com", 
            databaseURL: "https://seu-projeto.firebaseio.com",
            projectId: "seu-projeto-id",
            storageBucket: "seu-projeto.appspot.com",
            messagingSenderId: "123456789",
            appId: "sua-app-id"
        };

        // Inicializa o Firebase
        firebase.initializeApp(firebaseConfig);
        const database = firebase.database();

        // ============================================
        // FUNÇÕES CRUD (COPIAR ESTA PARTE PARA SEU PROJETO)
        // ============================================

        /**
         * 📝 CREATE - Cria um novo documento em uma coleção
         */
        async function createData(collection, data, id = null) {
            try {
                const documentId = id || generateId();
                const documentData = {
                    ...data,
                    _id: documentId,
                    _createdAt: new Date().toISOString(),
                    _updatedAt: new Date().toISOString()
                };
                
                await database.ref(`${collection}/${documentId}`).set(documentData);
                
                console.log(`✅ Documento criado: ${collection}/${documentId}`);
                return {
                    success: true,
                    id: documentId,
                    data: documentData
                };
                
            } catch (error) {
                console.error('❌ Erro ao criar documento:', error);
                return {
                    success: false,
                    error: error.message
                };
            }
        }

        /**
         * 📖 READ - Lê todos os documentos de uma coleção
         */
        async function readAllData(collection) {
            try {
                const snapshot = await database.ref(collection).once('value');
                const data = snapshot.val();
                
                console.log(`✅ Dados lidos da coleção: ${collection}`);
                return {
                    success: true,
                    data: data || {}
                };
                
            } catch (error) {
                console.error('❌ Erro ao ler dados:', error);
                return {
                    success: false,
                    error: error.message
                };
            }
        }

        /**
         * 🔍 READ BY ID - Lê um documento específico por ID
         */
        async function readDataById(collection, id) {
            try {
                const snapshot = await database.ref(`${collection}/${id}`).once('value');
                const data = snapshot.val();
                
                if (!data) {
                    throw new Error('Documento não encontrado');
                }
                
                console.log(`✅ Documento lido: ${collection}/${id}`);
                return {
                    success: true,
                    data: data
                };
                
            } catch (error) {
                console.error('❌ Erro ao ler documento:', error);
                return {
                    success: false,
                    error: error.message
                };
            }
        }

        /**
         * ✏️ UPDATE - Atualiza um documento existente
         */
        async function updateData(collection, id, updates) {
            try {
                const snapshot = await database.ref(`${collection}/${id}`).once('value');
                if (!snapshot.exists()) {
                    throw new Error('Documento não encontrado');
                }
                
                const updatedData = {
                    ...updates,
                    _updatedAt: new Date().toISOString()
                };
                
                await database.ref(`${collection}/${id}`).update(updatedData);
                
                console.log(`✅ Documento atualizado: ${collection}/${id}`);
                return {
                    success: true,
                    id: id,
                    data: updatedData
                };
                
            } catch (error) {
                console.error('❌ Erro ao atualizar documento:', error);
                return {
                    success: false,
                    error: error.message
                };
            }
        }

        /**
         * 🗑️ DELETE - Exclui um documento
         */
        async function deleteData(collection, id) {
            try {
                const snapshot = await database.ref(`${collection}/${id}`).once('value');
                if (!snapshot.exists()) {
                    throw new Error('Documento não encontrado');
                }
                
                await database.ref(`${collection}/${id}`).remove();
                
                console.log(`✅ Documento excluído: ${collection}/${id}`);
                return {
                    success: true,
                    id: id,
                    message: 'Documento excluído com sucesso'
                };
                
            } catch (error) {
                console.error('❌ Erro ao excluir documento:', error);
                return {
                    success: false,
                    error: error.message
                };
            }
        }

        /**
         * 👂 LISTEN - Escuta mudanças em tempo real
         */
        let listenerRef = null;
        function listenToCollection(collection, callback) {
            if (listenerRef) {
                listenerRef.off();
            }
            
            listenerRef = database.ref(collection);
            listenerRef.on('value', (snapshot) => {
                const data = snapshot.val() || {};
                console.log(`🔄 Dados atualizados em ${collection}:`, data);
                callback(data);
            });
            
            console.log(`👂 Escutando mudanças em: ${collection}`);
        }

        function stopListeningToCollection() {
            if (listenerRef) {
                listenerRef.off();
                listenerRef = null;
                console.log('⏹️ Escuta parada');
            }
        }

        // Função auxiliar para gerar ID único
        function generateId() {
            return Date.now().toString(36) + Math.random().toString(36).substr(2);
        }

        // ============================================
        // EXEMPLOS DE USO (PARA TESTAR)
        // ============================================

        function displayResult(message) {
            const output = document.getElementById('output');
            output.innerHTML += `<div>${message}</div>`;
        }

        async function testCreate() {
            displayResult('📝 Testando CREATE...');
            const result = await createData('users', {
                nome: 'João Silva',
                email: 'joao@email.com',
                idade: 30
            });
            displayResult(JSON.stringify(result, null, 2));
        }

        async function testRead() {
            displayResult('📖 Testando READ ALL...');
            const result = await readAllData('users');
            displayResult(JSON.stringify(result, null, 2));
        }

        async function testReadById() {
            displayResult('🔍 Testando READ BY ID...');
            // Primeiro cria um documento para depois ler
            const createResult = await createData('test', { mensagem: 'Teste de leitura' });
            if (createResult.success) {
                const readResult = await readDataById('test', createResult.id);
                displayResult(JSON.stringify(readResult, null, 2));
            }
        }

        async function testUpdate() {
            displayResult('✏️ Testando UPDATE...');
            // Primeiro cria um documento para depois atualizar
            const createResult = await createData('test', { 
                nome: 'Nome Original',
                valor: 100 
            });
            
            if (createResult.success) {
                const updateResult = await updateData('test', createResult.id, {
                    nome: 'Nome Atualizado',
                    valor: 200
                });
                displayResult(JSON.stringify(updateResult, null, 2));
            }
        }

        async function testDelete() {
            displayResult('🗑️ Testando DELETE...');
            // Primeiro cria um documento para depois excluir
            const createResult = await createData('test', { mensagem: 'Para ser excluído' });
            
            if (createResult.success) {
                const deleteResult = await deleteData('test', createResult.id);
                displayResult(JSON.stringify(deleteResult, null, 2));
            }
        }

        function startListening() {
            displayResult('👂 Iniciando escuta em tempo real...');
            listenToCollection('users', (data) => {
                displayResult(`🔄 Dados atualizados: ${Object.keys(data).length} usuários`);
            });
        }

        function stopListening() {
            displayResult('⏹️ Parando escuta...');
            stopListeningToCollection();
        }

        /**
         * 
         * // 📝 CREATE - Criar um usuário
const novoUsuario = await createData('users', {
    nome: 'Maria Santos',
    email: 'maria@email.com',
    idade: 25
});

// 📖 READ - Ler todos os usuários
const todosUsuarios = await readAllData('users');

// 🔍 READ BY ID - Ler um usuário específico
const usuario = await readDataById('users', 'id-do-usuario');

// ✏️ UPDATE - Atualizar um usuário
const atualizado = await updateData('users', 'id-do-usuario', {
    nome: 'Maria Silva',
    idade: 26
});

// 🗑️ DELETE - Excluir um usuário
const excluido = await deleteData('users', 'id-do-usuario');

// 👂 LISTEN - Escutar mudanças em tempo real
listenToCollection('users', (dados) => {
    console.log('Usuários atualizados:', dados);
});
         */