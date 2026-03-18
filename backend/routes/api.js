console.log('--- INICIANDO CARREGAMENTO DE routes/api.js ---');
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const adminController = require('../controllers/adminController');
const aiController = require('../controllers/aiController');
const chatController = require('../controllers/chatController');
const atlasController = require('../controllers/atlasController');
const { authMiddleware, adminMiddleware } = require('../middlewares/auth');

// Rotas Públicas
router.post('/login', authController.login);
router.post('/register', authController.register);
router.post('/setup-admin', authController.registerAdmin);

// Rotas Protegidas (Usuário Comum e Admin)
router.get('/me', authMiddleware, authController.getProfile);
router.post('/ai/ask', authMiddleware, aiController.askAI);
router.get('/ai/synapses/:sistemaId', authMiddleware, aiController.getSynapses);
router.post('/ai/synapses', authMiddleware, aiController.saveSynapse);
router.delete('/ai/synapses/:id', authMiddleware, aiController.deleteSynapse);
router.get('/user/sistemas/:bancadaId', authMiddleware, adminController.getUserSistemas);

// Rotas de Chat
router.post('/chat/sessions', authMiddleware, chatController.createSession);
router.get('/chat/sessions/:sistemaId', authMiddleware, chatController.getSessions);
router.get('/chat/messages/:sessionId', authMiddleware, chatController.getMessages);
router.delete('/chat/sessions/:sessionId', authMiddleware, chatController.deleteSession);
router.put('/chat/sessions/:sessionId', authMiddleware, chatController.renameSession);

// Rotas ATLAS IA (Interface de Voz & Percepção)
router.post('/atlas/chat', authMiddleware, atlasController.chat);
router.get('/atlas/memory', authMiddleware, atlasController.getMemory);
router.post('/atlas/memory', authMiddleware, atlasController.saveMemory);
router.post('/atlas/tts', authMiddleware, atlasController.generateTTS);

const upload = require('../middlewares/upload');

// Rotas Administrativas
router.get('/admin/users', authMiddleware, adminMiddleware, adminController.getUsers);
router.post('/admin/users', authMiddleware, adminMiddleware, adminController.createUser);
router.put('/admin/users/:id', authMiddleware, adminMiddleware, adminController.updateUser);
router.delete('/admin/users/:id', authMiddleware, adminMiddleware, adminController.deleteUser);
router.get('/admin/pending-users', authMiddleware, adminMiddleware, adminController.getPendingUsers);
router.post('/admin/approve-user/:id', authMiddleware, adminMiddleware, adminController.approveUser);
router.post('/admin/reject-user/:id', authMiddleware, adminMiddleware, adminController.rejectUser);
router.get('/admin/bancadas', authMiddleware, adminMiddleware, adminController.getBancadas);
router.get('/admin/sistemas', authMiddleware, adminMiddleware, adminController.getSistemas);
router.get('/admin/status', authMiddleware, adminMiddleware, adminController.checkAIStatus);
router.post('/admin/upload-ddl', authMiddleware, adminMiddleware, adminController.uploadDDL);
router.post('/admin/upload-fdb', authMiddleware, adminMiddleware, upload.single('fdb'), adminController.handleFDBUpload);
router.post('/admin/bancada', authMiddleware, adminMiddleware, adminController.createBancada);
router.post('/admin/sistema', authMiddleware, adminMiddleware, adminController.createSistema);
router.post('/admin/associar', authMiddleware, adminMiddleware, adminController.associateSistemaBancada);

// Rotas do Córtex IA (Admin)
router.get('/admin/ai/stats', authMiddleware, adminMiddleware, aiController.getAIStats);
router.get('/admin/ai/insights', authMiddleware, adminMiddleware, aiController.getAIInsights);
router.get('/admin/ai/all-synapses', authMiddleware, adminMiddleware, aiController.getAllSynapses);

module.exports = router;
