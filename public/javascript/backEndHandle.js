// services/firebase.js
import firebase from 'firebase/compat/app';
import 'firebase/compat/storage';
import 'firebase/compat/database';

const firebaseConfig = {
  apiKey: "sua-api-key",
  authDomain: "seu-projeto.firebaseapp.com",
  databaseURL: "https://seu-projeto.firebaseio.com",
  projectId: "seu-projeto",
  storageBucket: "seu-projeto.appspot.com",
  messagingSenderId: "123456789",
  appId: "seu-app-id"
};

firebase.initializeApp(firebaseConfig);

export const database = firebase.database();
export const storage = firebase.storage();
export default firebase;


/**
 * Adiciona um novo projeto ao database
 * @param {Object} projectData - Dados do projeto
 * @param {string} projectData.name - Nome da obra
 * @param {string} projectData.address - Endereço
 * @param {string} projectData.startDate - Data de início (YYYY-MM-DD)
 * @param {string} projectData.endDate - Data de fim (YYYY-MM-DD)
 * @param {Array} projectData.operators - Array de IDs dos operadores
 * @param {Object} projectData.client - Dados do cliente
 * @param {string} projectData.client.name - Nome do cliente
 * @param {string} projectData.client.document - CNPJ/CPF
 * @param {string} projectData.client.email - Email
 * @param {string} projectData.client.whatsapp - WhatsApp
 * @param {string} managerId - ID do gerente que está criando o projeto
 * @returns {Promise<string>} - ID do projeto criado
 */
async function addProject(projectData, managerId) {
  const projectRef = database.ref('projects').push();
  const projectId = projectRef.key;

  const project = {
    ...projectData,
    createdBy: managerId,
    createdAt: new Date().toISOString()
  };

  await projectRef.set(project);
  return projectId;
}

/**
 * Busca todos os projetos de um operador
 * @param {string} operatorId - ID do operador
 * @returns {Promise<Array>} - Array de projetos
 */
async function getOperatorProjects(operatorId) {
  const projectsRef = database.ref('projects');
  const snapshot = await projectsRef.orderByChild('operators').get();

  const projects = [];
  snapshot.forEach((childSnapshot) => {
    const project = childSnapshot.val();
    if (project.operators && project.operators.includes(operatorId)) {
      projects.push({
        id: childSnapshot.key,
        ...project
      });
    }
  });

  return projects;
}

/**
 * Faz upload de uma imagem para o Storage e retorna a URL
 * @param {File} imageFile - Arquivo de imagem
 * @param {string} projectId - ID do projeto
 * @returns {Promise<string>} - URL da imagem
 */
async function uploadImage(imageFile, projectId) {
  // Cria uma referência para o arquivo no Storage
  const storageRef = storage.ref();
  const imageRef = storageRef.child(`projectUpdates/${projectId}/${Date.now()}_${imageFile.name}`);

  // Faz o upload
  const snapshot = await imageRef.put(imageFile);
  const downloadURL = await snapshot.ref.getDownloadURL();
  return downloadURL;
}

/**
 * Adiciona uma atualização (mensagem) ao projeto
 * @param {string} projectId - ID do projeto
 * @param {string} operatorId - ID do operador
 * @param {string} operatorName - Nome do operador
 * @param {string} message - Mensagem de texto (opcional)
 * @param {File} [imageFile] - Arquivo de imagem (opcional)
 * @returns {Promise<string>} - ID da atualização
 */
async function addProjectUpdate(projectId, operatorId, operatorName, message, imageFile) {
  let imageUrl = null;

  // Se há imagem, faz o upload
  if (imageFile) {
    imageUrl = await uploadImage(imageFile, projectId);
  }

  const updateRef = database.ref('projectUpdates').push();
  const updateId = updateRef.key;

  const updateData = {
    projectId,
    operatorId,
    operatorName,
    message: message || '',
    imageUrl,
    timestamp: new Date().toISOString()
  };

  await updateRef.set(updateData);
  return updateId;
}

/**
 * Busca todas as atualizações de um projeto
 * @param {string} projectId - ID do projeto
 * @returns {Promise<Array>} - Array de atualizações
 */
async function getProjectUpdates(projectId) {
  const updatesRef = database.ref('projectUpdates');
  const snapshot = await updatesRef.orderByChild('projectId').equalTo(projectId).get();

  const updates = [];
  snapshot.forEach((childSnapshot) => {
    updates.push({
      id: childSnapshot.key,
      ...childSnapshot.val()
    });
  });

  // Ordena por timestamp (mais recente primeiro)
  updates.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  return updates;
}

/**
 * Adiciona uma avaliação do cliente
 * @param {string} projectId - ID do projeto
 * @param {string} clientName - Nome do cliente
 * @param {string} projectName - Nome do projeto
 * @param {number} rating - Nota (ex: 1 a 5)
 * @param {string} comments - Comentários do cliente
 * @returns {Promise<string>} - ID da avaliação
 */
async function addReview(projectId, clientName, projectName, rating, comments) {
  const reviewRef = database.ref('reviews').push();
  const reviewId = reviewRef.key;

  const reviewData = {
    projectId,
    clientName,
    projectName,
    rating,
    comments,
    createdAt: new Date().toISOString()
  };

  await reviewRef.set(reviewData);
  return reviewId;
}