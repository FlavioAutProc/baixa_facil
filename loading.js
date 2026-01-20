// loading.js - Versão corrigida
document.addEventListener('DOMContentLoaded', function() {
    // Elementos
    const loadingScreen = document.getElementById('loading-screen');
    const appContainer = document.querySelector('.app-container');
    const progressFill = document.querySelector('.progress-fill');
    const progressPercent = document.getElementById('loading-percent');
    const statusIcons = document.querySelectorAll('.status-icon');
    
    // Garantir que o app-container esteja escondido inicialmente
    if (appContainer) {
        appContainer.style.opacity = '0';
        appContainer.style.visibility = 'hidden';
    }
    
    // Configuração do progresso
    let progress = 0;
    const totalSteps = 4;
    const stepDuration = 600; // ms
    
    // Função para atualizar o progresso
    function updateProgress(newProgress) {
        progress = Math.min(newProgress, 100);
        
        // Atualizar barra de progresso
        if (progressFill) {
            progressFill.style.width = `${progress}%`;
        }
        
        // Atualizar porcentagem
        if (progressPercent) {
            progressPercent.textContent = `${Math.round(progress)}%`;
        }
        
        // Atualizar ícones de status
        if (statusIcons.length > 0) {
            const completedSteps = Math.floor((progress / 100) * totalSteps);
            
            statusIcons.forEach((icon, index) => {
                if (index < completedSteps) {
                    // Etapa completada
                    icon.className = 'fas fa-check-circle status-icon status-completed';
                    icon.closest('.status-item')?.classList.add('active');
                } else if (index === completedSteps) {
                    // Etapa atual
                    icon.className = 'fas fa-spinner fa-spin status-icon status-active';
                    icon.closest('.status-item')?.classList.add('active');
                } else {
                    // Etapa pendente
                    icon.className = 'fas fa-circle status-icon status-pending';
                    icon.closest('.status-item')?.classList.remove('active');
                }
            });
        }
        
        // Log para debug
        console.log(`Progresso: ${progress}%`);
    }
    
    // Função para completar o carregamento
    function completeLoading() {
        // Garantir 100%
        updateProgress(100);
        
        // Pequena pausa para mostrar o 100%
        setTimeout(() => {
            // Adicionar classe de fade-out na tela de loading
            if (loadingScreen) {
                loadingScreen.classList.add('fade-out');
            }
            
            // Mostrar a aplicação principal
            if (appContainer) {
                appContainer.style.opacity = '1';
                appContainer.style.visibility = 'visible';
                appContainer.classList.add('app-loaded');
            }
            
            // Remover a tela de loading após a animação
            setTimeout(() => {
                if (loadingScreen) {
                    loadingScreen.style.display = 'none';
                }
                
                // Inicializar a aplicação principal
                if (typeof initApp === 'function') {
                    try {
                        initApp();
                    } catch (error) {
                        console.error('Erro ao inicializar app:', error);
                        // Se initApp falhar, tente iniciar manualmente
                        initializeApplication();
                    }
                } else {
                    // Se initApp não existir, iniciar manualmente
                    initializeApplication();
                }
            }, 500); // Tempo da animação de fade-out
        }, 500);
    }
    
    // Função para simular carregamento
    function simulateLoading() {
        const interval = setInterval(() => {
            // Incrementar progresso
            const increment = 1 + Math.random() * 3; // Entre 1% e 4%
            progress += increment;
            
            updateProgress(progress);
            
            // Quando chegar a 100%, completar
            if (progress >= 100) {
                clearInterval(interval);
                completeLoading();
            }
        }, stepDuration);
    }
    
    // Função de inicialização alternativa
    function initializeApplication() {
        console.log('Inicializando aplicação...');
        
        // Inicializar funcionalidades básicas
        try {
            // Inicializar navegação
            const navItems = document.querySelectorAll('.nav-item');
            if (navItems.length > 0) {
                navItems.forEach(item => {
                    item.addEventListener('click', function() {
                        const screenId = this.getAttribute('data-screen');
                        switchScreen(screenId);
                    });
                });
            }
            
            // Inicializar formulário
            const form = document.getElementById('register-form');
            if (form) {
                form.addEventListener('submit', function(e) {
                    e.preventDefault();
                    if (typeof registerWithdrawal === 'function') {
                        registerWithdrawal();
                    }
                });
            }
            
            // Carregar configurações
            if (typeof loadSettings === 'function') {
                loadSettings();
            }
            
            // Atualizar registros
            if (typeof updateRecordsDisplay === 'function') {
                updateRecordsDisplay();
            }
            
            console.log('Aplicação inicializada com sucesso');
        } catch (error) {
            console.error('Erro na inicialização:', error);
        }
    }
    
    // Verificar se a imagem da logo existe
    const logoImage = document.querySelector('.logo-image');
    if (logoImage) {
        logoImage.onerror = function() {
            console.warn('Imagem logo01 não encontrada, usando fallback');
            this.style.display = 'none';
            const logoBackground = document.querySelector('.logo-background');
            if (logoBackground) {
                logoBackground.innerHTML = `
                    <div class="logo-fallback">
                        <i class="fas fa-boxes-stacked"></i>
                        <span>StockTrack</span>
                    </div>
                `;
            }
        };
        
        // Verificar se a imagem carregou
        logoImage.onload = function() {
            console.log('Logo carregada com sucesso');
        };
    }
    
    // Iniciar o processo de carregamento com um pequeno delay
    setTimeout(() => {
        console.log('Iniciando processo de carregamento...');
        simulateLoading();
    }, 300);
    
    // Fallback: Se algo der errado, garantir que o app apareça após 8 segundos
    setTimeout(() => {
        if (loadingScreen && loadingScreen.style.display !== 'none') {
            console.warn('Fallback: Forçando término do loading');
            completeLoading();
        }
    }, 8000);
});