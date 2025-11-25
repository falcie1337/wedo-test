// cameraRoutine.mjs

/**
 * Inicializa a rotina de câmera + captura de fotos.
 * Versão corrigida - funciona completamente no cliente
 */
export function initCameraRoutine(config) {
    //============================
    // 1. Mapeia elementos via config
    //============================
    const cameraBtn = document.getElementById(config.cameraButtonId);
    const downloadBtn = document.getElementById(config.downloadButtonId);
    const video = document.getElementById(config.videoId);
    const canvas = document.getElementById(config.canvasId);

    if (!cameraBtn || !downloadBtn || !video || !canvas) {
        throw new Error("Algum dos elementos não foi encontrado. Verifique os IDs passados na config.");
    }

    const ctx = canvas.getContext('2d');

    //============================
    // 2. Estado interno
    //============================
    let imagens = [];
    let cameraAtiva = false;
    let stream = null;
    let imagensArray = [null];

    //============================
    // 3. Ligar câmera
    //============================
    document.addEventListener("DOMContentLoaded", () => {
        ligarCamera(video, cameraBtn);
    });

    const btnTake = document.getElementById('cameraAction');
    btnTake.addEventListener('click', () => {
        tirarFoto(video, canvas, ctx);
    });

    async function ligarCamera(videoElement, buttonElement) {
        try {
            stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: false
            });

            videoElement.srcObject = stream;
            await videoElement.play();

            cameraAtiva = true;
            console.log("Câmera ligada!");
        } catch (error) {
            console.error("Erro ao ligar câmera:", error);
            showSaveStatus('❌ Erro ao acessar a câmera', 'error');
        }
    }

    function desligarCamera() {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
        video.srcObject = null;
        cameraAtiva = false;
    }

    //============================
    // 4. Tirar foto - FUNÇÃO PRINCIPAL
    //============================
    function tirarFoto(videoElement, canvasElement, context) {
        try {
            canvasElement.width = videoElement.videoWidth || 300;
            canvasElement.height = videoElement.videoHeight || 300;

            context.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);

            // Gera o Base64
            const dataURL = canvasElement.toDataURL("image/png");

            // Guarda a única foto
            imagensArray[0] = {
                id: Date.now(),
                src: dataURL,
                timestamp: new Date().toISOString()
            };
            console.log('dataURL: ' , dataURL);

            console.log("Foto capturada:", imagensArray[0]);
            
            // Exibe preview
            exibirPreview(dataURL);
            
            // Salva localmente (sem tentar File System API automaticamente)
            salvarFotoLocalmente(dataURL);
            const filename = 'foto-obra' + Date.now();
            tentarFileSystemAPI(dataURL, filename);
            
        } catch (error) {
            console.error("Erro ao tirar foto:", error);
            showSaveStatus('❌ Erro ao capturar foto', 'error');
        }
    }

    //============================
    // 5. Exibir preview da foto
    //============================
    function exibirPreview(dataURL) {
        const previewCanvas = document.getElementById("photo");
        if (!previewCanvas) {
            console.warn("Elemento #photo não encontrado para preview");
            return;
        }
        console.log(dataURL);
        const previewCtx = previewCanvas.getContext("2d");
        previewCanvas.className = "PhotoMode";

        const img = new Image();
        img.src = dataURL;

        img.onload = () => {
            previewCanvas.width = img.width;
            previewCanvas.height = img.height;
            previewCtx.drawImage(img, 0, 0, previewCanvas.width, previewCanvas.height);
        };
    }

    //============================
    // 6. Salvar foto localmente (SEM File System API automática)
    //============================
    function salvarFotoLocalmente(dataURL) {
        try {
            // Salva no localStorage
            const fotoData = {
                dataURL: dataURL,
                timestamp: new Date().toISOString(),
                filename: `foto-obra-${Date.now()}.png`
            };
            
            localStorage.setItem('ultimaFotoObra', JSON.stringify(fotoData));
            
            // Mostra apenas notificação - download manual pelo botão
            showSaveStatus('📸 Foto capturada! Use o botão "Salvar" para baixar.', 'success', false);
            
            console.log('Foto salva no localStorage:', fotoData.filename);
            
        } catch (error) {
            console.error('Erro ao salvar localmente:', error);
            showSaveStatus('❌ Erro ao salvar foto', 'error');
        }
    }

    //============================
    // 7. Download local (método principal)
    //============================
    function downloadImageLocal(dataURL, filename = 'image.png') {
        try {
            const link = document.createElement('a');
            link.href = dataURL;
            link.download = filename;
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            showSaveStatus('✅ Download iniciado!', 'success');
            return true;
        } catch (error) {
            console.error('Erro no download:', error);
            showSaveStatus('❌ Erro ao baixar imagem', 'error');
            return false;
        }
    }

    //============================
    // 8. Tentar File System API apenas quando usuário clicar manualmente
    //============================
    async function tentarFileSystemAPI(dataURL, filename) {
        try {
            if (!window.showSaveFilePicker) {
                return { success: false, reason: 'API não suportada' };
            }

            const blob = dataURLToBlob(dataURL);
            const fileHandle = await window.showSaveFilePicker({
                suggestedName: filename,
                types: [{
                    description: 'Imagens PNG',
                    accept: {'image/png': ['.png']},
                }],
            });
            
            const writable = await fileHandle.createWritable();
            await writable.write(blob);
            await writable.close();
            
            showSaveStatus('✅ Foto salva no dispositivo!', 'success');
            return { success: true };
            
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error('Erro File System API:', error);
            }
            return { success: false, reason: error.message };
        }
    }

    //============================
    // 9. Converter DataURL para Blob
    //============================
    function dataURLToBlob(dataURL) {
        const partes = dataURL.split(',');
        const mime = partes[0].match(/:(.*?);/)[1];
        const b64 = atob(partes[1]);
        const u8array = new Uint8Array(b64.length);
        
        for (let i = 0; i < b64.length; i++) {
            u8array[i] = b64.charCodeAt(i);
        }
        
        return new Blob([u8array], { type: mime });
    }

    //============================
    // 10. Função para mostrar status
    //============================
    function showSaveStatus(message, type = 'info', clickable = false) {
        // Remove status anterior
        const existingStatus = document.getElementById('image-save-status');
        if (existingStatus) {
            existingStatus.remove();
        }
        
        // Cria novo elemento
        const statusDiv = document.createElement('div');
        statusDiv.id = 'image-save-status';
        statusDiv.className = `save-status ${type}`;
        statusDiv.textContent = message;
        
        // Estilos
        statusDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 18px;
            border-radius: 8px;
            color: white;
            font-weight: bold;
            z-index: 10000;
            background-color: ${type === 'success' ? '#28a745' : type === 'warning' ? '#ffc107' : '#dc3545'};
            cursor: ${clickable ? 'pointer' : 'default'};
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            font-size: 14px;
            max-width: 300px;
            word-wrap: break-word;
        `;
        
        document.body.appendChild(statusDiv);
        
        // Remove automaticamente após 4 segundos
        setTimeout(() => {
            if (statusDiv.parentElement) {
                statusDiv.remove();
            }
        }, 4000);
    }

    //============================
    // 11. Botão de download - AGORA COM File System API
    //============================
    const enviarBtn = document.getElementById('downloadZip');
    if (enviarBtn) {
        enviarBtn.addEventListener('click', async () => {
            const foto = imagensArray[0];
            if (!foto) {
                showSaveStatus('⚠️ Tire uma foto primeiro!', 'warning');
                return;
            }

            const filename = `foto-obra-${Date.now()}.png`;
            
            // Tenta File System API primeiro (agora é uma ação do usuário)
            if (window.showSaveFilePicker) {
                showSaveStatus('💾 Escolhendo local para salvar...', 'info');
                const resultado = await tentarFileSystemAPI(foto.src, filename);
                if (resultado.success) {
                    return;
                }
                // Se File System API falhar, continua para download normal
            }
            
            // Fallback para download tradicional
            downloadImageLocal(foto.src, filename);
        });
    }

    //============================
    // 12. Eventos principais
    //============================
    cameraBtn.addEventListener("click", () => {
        if (!cameraAtiva) {
            ligarCamera(video, cameraBtn);
        } else {
            tirarFoto(video, canvas, ctx);
        }
    });

    if (downloadBtn) {
        downloadBtn.addEventListener("click", async () => {
            const foto = imagensArray[0];
            if (!foto) {
                showSaveStatus('⚠️ Tire uma foto primeiro!', 'warning');
                return;
            }

            const filename = `foto-obra-${Date.now()}.png`;
            downloadImageLocal(foto.src, filename);
        });
    }

    //============================
    // 13. API pública
    //============================
    return {
        getImagens: () => [...imagens],
        isCameraAtiva: () => cameraAtiva,
        desligarCamera,
        limparGaleria: () => {
            imagens = [];
            imagensArray = [null];
            localStorage.removeItem('ultimaFotoObra');
        },
        getFotoAtual: () => imagensArray[0],
        getUltimaFotoSalva: () => {
            const saved = localStorage.getItem('ultimaFotoObra');
            return saved ? JSON.parse(saved) : null;
        },
        downloadFotoAtual: (customName = null) => {
            const foto = imagensArray[0];
            if (!foto) return false;
            
            const filename = customName || `foto-obra-${Date.now()}.png`;
            return downloadImageLocal(foto.src, filename);
        },
        // Nova função para salvar com File System API (quando usuário solicitar)
        salvarComFileSystemAPI: async (customName = null) => {
            const foto = imagensArray[0];
            if (!foto) return { success: false, error: 'Nenhuma foto disponível' };
            
            const filename = customName || `foto-obra-${Date.now()}.png`;
            return await tentarFileSystemAPI(foto.src, filename);
        }
    };
}
