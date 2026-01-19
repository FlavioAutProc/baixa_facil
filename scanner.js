// SCANNER DE CÓDIGO DE BARRAS
function setupScanner() {
    // Configurar botão de fechar scanner
    document.getElementById('close-scanner').addEventListener('click', closeScanner);
    
    // Configurar troca de câmera
    document.getElementById('toggle-camera').addEventListener('click', toggleCamera);
}

function openScanner() {
    const modal = document.getElementById('scanner-modal');
    modal.classList.add('active');
    
    // Inicializar scanner
    setTimeout(() => {
        initScanner();
    }, 300);
}

function initScanner() {
    const scannerContainer = document.getElementById('qr-reader');
    
    // Limpar scanner anterior se existir
    if (AppState.currentScanner) {
        AppState.currentScanner.clear();
    }
    
    // Configurar scanner
    AppState.currentScanner = new Html5Qrcode("qr-reader");
    
    const config = {
        fps: 10,
        qrbox: { width: 250, height: 150 },
        aspectRatio: 1.0,
        formatsToSupport: [Html5QrcodeSupportedFormats.EAN_13, Html5QrcodeSupportedFormats.EAN_8, 
                          Html5QrcodeSupportedFormats.UPC_A, Html5QrcodeSupportedFormats.UPC_E,
                          Html5QrcodeSupportedFormats.CODE_128, Html5QrcodeSupportedFormats.CODE_39,
                          Html5QrcodeSupportedFormats.CODE_93, Html5QrcodeSupportedFormats.ITF]
    };
    
    // Iniciar scanner
    Html5Qrcode.getCameras().then(cameras => {
        AppState.cameras = cameras;
        
        if (cameras && cameras.length > 0) {
            // Tentar encontrar câmera traseira
            let cameraId = cameras[0].id;
            for (const camera of cameras) {
                if (camera.label.toLowerCase().includes('back') || 
                    camera.label.toLowerCase().includes('traseira') ||
                    camera.label.toLowerCase().includes('rear')) {
                    cameraId = camera.id;
                    break;
                }
            }
            
            AppState.currentCameraId = cameraId;
            
            AppState.currentScanner.start(
                AppState.currentCameraId,
                config,
                onScanSuccess,
                onScanError
            ).then(() => {
                console.log("Scanner iniciado com sucesso");
            }).catch(err => {
                console.error("Erro ao iniciar scanner:", err);
                showAlert('Não foi possível acessar a câmera. Verifique as permissões.', 'error');
            });
        } else {
            showAlert('Nenhuma câmera encontrada no dispositivo.', 'error');
        }
    }).catch(err => {
        console.error("Erro ao obter câmeras:", err);
        showAlert('Não foi possível acessar as câmeras do dispositivo.', 'error');
    });
}

function onScanSuccess(decodedText) {
    // Tocar som se configurado
    if (AppState.settings.scanSound === 'enabled') {
        playScanSound();
    }
    
    // Preencher campo de código de barras
    document.getElementById('barcode').value = decodedText;
    
    // Fechar scanner
    closeScanner();
    
    // Focar no próximo campo
    document.getElementById('quantity').focus();
    
    // Validar código
    validateBarcode(decodedText);
}

function onScanError(error) {
    // Ignorar erros de scanner não encontrado (ocorrem frequentemente durante a varredura)
    if (!error.includes("NotFoundException")) {
        console.warn("Erro no scanner:", error);
    }
}

function toggleCamera() {
    if (AppState.cameras.length < 2) {
        showAlert('Apenas uma câmera disponível.', 'warning');
        return;
    }
    
    if (AppState.currentScanner && AppState.currentScanner.isScanning) {
        AppState.currentScanner.stop().then(() => {
            // Encontrar próxima câmera
            const currentIndex = AppState.cameras.findIndex(cam => cam.id === AppState.currentCameraId);
            const nextIndex = (currentIndex + 1) % AppState.cameras.length;
            AppState.currentCameraId = AppState.cameras[nextIndex].id;
            
            // Reiniciar com nova câmera
            const config = {
                fps: 10,
                qrbox: { width: 250, height: 150 },
                aspectRatio: 1.0
            };
            
            AppState.currentScanner.start(
                AppState.currentCameraId,
                config,
                onScanSuccess,
                onScanError
            ).then(() => {
                showAlert(`Câmera alterada: ${AppState.cameras[nextIndex].label || 'Câmera ' + (nextIndex + 1)}`, 'info');
            });
        }).catch(err => {
            console.error("Erro ao alternar câmera:", err);
            showAlert('Erro ao alterar câmera.', 'error');
        });
    }
}

function closeScanner() {
    if (AppState.currentScanner) {
        AppState.currentScanner.stop().then(() => {
            AppState.currentScanner.clear();
            AppState.currentScanner = null;
        }).catch(err => {
            console.error("Erro ao parar scanner:", err);
        });
    }
    
    document.getElementById('scanner-modal').classList.remove('active');
}

function playScanSound() {
    try {
        // Criar som de bip simples
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
    } catch (error) {
        console.warn("Não foi possível reproduzir som:", error);
    }
}

// Inicializar scanner quando o módulo for carregado
document.addEventListener('DOMContentLoaded', function() {
    setupScanner();
});