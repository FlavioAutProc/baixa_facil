// DADOS E ESTADO DO SISTEMA
const AppState = {
    records: JSON.parse(localStorage.getItem('stocktrack_records')) || [],
    settings: JSON.parse(localStorage.getItem('stocktrack_settings')) || {
        companyName: 'StockTrack',
        maxQuantity: 9999,
        autoSave: 'enabled',
        scanSound: 'enabled',
        duplicateTime: 1
    },
    currentScanner: null,
    currentCameraId: null,
    cameras: [],
    currentFilter: null,
    currentReport: null
};

// INICIALIZAÇÃO DO APP
document.addEventListener('DOMContentLoaded', function() {
    initApp();
});

function initApp() {
    // Configurar menu de navegação
    setupNavigation();
    
    // Configurar formulário de registro
    setupRegistrationForm();
    
    // Configurar botões e eventos
    setupButtons();
    
    // Carregar configurações salvas
    loadSettings();
    
    // Atualizar exibição inicial
    updateRecordsDisplay();
    updateLastRegistration();
    
    // Configurar FAB
    document.getElementById('fab-add').addEventListener('click', function() {
        switchScreen('register');
        document.getElementById('product-name').focus();
    });
    
    // Configurar filtro de registros
    setupFilter();
    
    // Atualizar display da quantidade máxima
    updateMaxQuantityDisplay();
    
    // Inicializar scanner (será configurado quando necessário)
}

// NAVEGAÇÃO ENTRE TELAS
function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            const screenId = this.getAttribute('data-screen');
            
            // Atualizar menu ativo
            navItems.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');
            
            // Alternar tela
            switchScreen(screenId);
        });
    });
}

function switchScreen(screenId) {
    // Esconder todas as telas
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    
    // Mostrar tela selecionada
    document.getElementById(`${screenId}-screen`).classList.add('active');
    
    // Atualizar dados específicos da tela
    if (screenId === 'records') {
        updateRecordsDisplay();
    } else if (screenId === 'reports') {
        // Limpar relatório anterior
        document.getElementById('report-content').innerHTML = '';
        document.getElementById('report-summary').innerHTML = `
            <p>Nenhum relatório gerado</p>
            <p style="font-size: 14px;">Use o formulário acima para gerar um relatório</p>
        `;
    }
}

// FORMULÁRIO DE REGISTRO
function setupRegistrationForm() {
    const form = document.getElementById('register-form');
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        registerWithdrawal();
    });
    
    // Validação em tempo real
    const quantityInput = document.getElementById('quantity');
    quantityInput.addEventListener('change', function() {
        validateQuantity(this.value);
    });
    
    // Botão de scanner (configurado em scanner.js)
    document.getElementById('scan-btn').addEventListener('click', function() {
        openScanner();
    });
}

// VALIDAÇÕES
function validateQuantity(quantity) {
    const max = AppState.settings.maxQuantity || 9999;
    const alertDiv = document.getElementById('form-alert');
    
    if (quantity <= 0) {
        showAlert('A quantidade deve ser maior que zero.', 'error');
        return false;
    }
    
    if (quantity > max) {
        showAlert(`A quantidade não pode exceder ${max}.`, 'error');
        return false;
    }
    
    return true;
}

function validateBarcode(barcode) {
    if (!barcode || barcode.trim() === '') {
        showAlert('O código de barras é obrigatório.', 'error');
        return false;
    }
    
    // Verificar duplicidade com base no tempo configurado
    const duplicateTime = parseInt(AppState.settings.duplicateTime) || 1;
    
    if (duplicateTime > 0) {
        const now = new Date();
        const isDuplicate = AppState.records.some(record => {
            if (record.barcode === barcode) {
                const recordTime = new Date(record.timestamp);
                const timeDiff = Math.abs(now - recordTime) / (1000 * 60); // Diferença em minutos
                return timeDiff < duplicateTime;
            }
            return false;
        });
        
        if (isDuplicate) {
            showAlert(`Este código foi registrado há menos de ${duplicateTime} minuto(s). Verifique se não é duplicado.`, 'warning');
            return false;
        }
    }
    
    return true;
}

function validateForm() {
    const productName = document.getElementById('product-name').value.trim();
    const barcode = document.getElementById('barcode').value.trim();
    const quantity = document.getElementById('quantity').value;
    const sector = document.getElementById('origin-sector').value;
    const employee = document.getElementById('employee').value.trim();
    
    if (!productName) {
        showAlert('O nome do produto é obrigatório.', 'error');
        return false;
    }
    
    if (!validateBarcode(barcode)) return false;
    
    if (!validateQuantity(quantity)) return false;
    
    if (!sector) {
        showAlert('O setor de origem é obrigatório.', 'error');
        return false;
    }
    
    if (!employee) {
        showAlert('O colaborador responsável é obrigatório.', 'error');
        return false;
    }
    
    return true;
}

// REGISTRO DE RETIRADA
function registerWithdrawal() {
    if (!validateForm()) return;
    
    const productName = document.getElementById('product-name').value.trim();
    const barcode = document.getElementById('barcode').value.trim();
    const quantity = parseInt(document.getElementById('quantity').value);
    const sector = document.getElementById('origin-sector').value;
    const employee = document.getElementById('employee').value.trim();
    const notes = document.getElementById('notes').value.trim();
    const timestamp = new Date().toISOString();
    
    const record = {
        id: Date.now(),
        productName,
        barcode,
        quantity,
        sector,
        employee,
        notes,
        timestamp
    };
    
    // Adicionar ao histórico
    AppState.records.unshift(record);
    
    // Limitar a 2000 registros para performance
    if (AppState.records.length > 2000) {
        AppState.records = AppState.records.slice(0, 2000);
    }
    
    // Salvar no localStorage
    saveRecords();
    
    // Feedback visual
    showAlert('Retirada registrada com sucesso!', 'success');
    
    // Limpar formulário
    document.getElementById('register-form').reset();
    
    // Atualizar exibições
    updateLastRegistration();
    updateRecordsDisplay();
    
    // Focar no primeiro campo para próximo registro
    document.getElementById('product-name').focus();
}

// GERENCIAMENTO DE REGISTROS
function updateRecordsDisplay() {
    const recordsList = document.getElementById('records-list');
    const emptyState = document.getElementById('empty-records');
    const totalItems = document.getElementById('total-items');
    const totalRecords = document.getElementById('total-records');
    
    // Filtrar registros se necessário
    let filteredRecords = AppState.records;
    if (AppState.currentFilter) {
        filteredRecords = filterRecords(AppState.records, AppState.currentFilter);
    }
    
    // Filtrar registros de hoje para o resumo
    const today = new Date().toDateString();
    const todayRecords = filteredRecords.filter(record => 
        new Date(record.timestamp).toDateString() === today
    );
    
    // Atualizar totais
    const totalToday = todayRecords.reduce((sum, record) => sum + record.quantity, 0);
    totalItems.textContent = totalToday;
    totalRecords.textContent = filteredRecords.length;
    
    // Limpar lista
    recordsList.innerHTML = '';
    
    if (filteredRecords.length === 0) {
        emptyState.style.display = 'block';
        return;
    }
    
    emptyState.style.display = 'none';
    
    // Adicionar registros (limitar a 100 para performance)
    const displayRecords = filteredRecords.slice(0, 100);
    
    displayRecords.forEach(record => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td style="font-weight: 500;">${record.productName}</td>
            <td><span class="badge ${record.quantity > 10 ? 'badge-warning' : 'badge-success'}">${record.quantity}</span></td>
            <td><span class="badge badge-primary">${getSectorName(record.sector)}</span></td>
            <td style="color: #7f8c8d; font-size: 13px;">${formatTime(record.timestamp)}</td>
        `;
        
        // Adicionar evento de clique para ver detalhes
        row.addEventListener('click', function() {
            showRecordDetails(record);
        });
        
        recordsList.appendChild(row);
    });
}

function updateLastRegistration() {
    const lastRegDiv = document.getElementById('last-registration');
    
    if (AppState.records.length > 0) {
        const lastRecord = AppState.records[0];
        lastRegDiv.innerHTML = `
            <div style="text-align: left; padding: 12px; background: #f8fafc; border-radius: 12px;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <div>
                        <strong style="color: #2c3e50; font-size: 16px;">${lastRecord.productName}</strong><br>
                        <small style="color: #7f8c8d;">Código: ${lastRecord.barcode}</small>
                    </div>
                    <span class="badge ${lastRecord.quantity > 10 ? 'badge-warning' : 'badge-success'}" style="font-size: 14px;">${lastRecord.quantity}</span>
                </div>
                <div style="margin-top: 8px;">
                    <small style="color: #7f8c8d;">
                        <i class="fas fa-user"></i> ${lastRecord.employee} | 
                        <i class="fas fa-building"></i> ${getSectorName(lastRecord.sector)}<br>
                        <i class="fas fa-clock"></i> ${formatDateTime(lastRecord.timestamp)}
                    </small>
                </div>
                ${lastRecord.notes ? `<div style="margin-top: 8px; padding: 8px; background: #e3f2fd; border-radius: 8px; font-size: 13px;">${lastRecord.notes}</div>` : ''}
            </div>
        `;
    } else {
        lastRegDiv.innerHTML = `
            <div style="padding: 20px;">
                <i class="fas fa-clipboard" style="font-size: 48px; color: #bdc3c7; margin-bottom: 16px;"></i>
                <p style="color: #7f8c8d;">Nenhuma retirada registrada ainda</p>
            </div>
        `;
    }
}

function showRecordDetails(record) {
    const message = `
        <div style="background: #f8fafc; padding: 20px; border-radius: 12px;">
            <h3 style="color: #2c3e50; margin-bottom: 16px; border-bottom: 2px solid #3498db; padding-bottom: 8px;">Detalhes da Retirada</h3>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
                <div style="background: white; padding: 12px; border-radius: 8px; border: 1px solid #e8eaed;">
                    <strong style="color: #7f8c8d; font-size: 12px; display: block; margin-bottom: 4px;">Produto</strong>
                    <span style="color: #2c3e50; font-weight: 600;">${record.productName}</span>
                </div>
                
                <div style="background: white; padding: 12px; border-radius: 8px; border: 1px solid #e8eaed;">
                    <strong style="color: #7f8c8d; font-size: 12px; display: block; margin-bottom: 4px;">Quantidade</strong>
                    <span class="badge ${record.quantity > 10 ? 'badge-warning' : 'badge-success'}" style="font-size: 14px;">${record.quantity} unidades</span>
                </div>
                
                <div style="background: white; padding: 12px; border-radius: 8px; border: 1px solid #e8eaed;">
                    <strong style="color: #7f8c8d; font-size: 12px; display: block; margin-bottom: 4px;">Código</strong>
                    <span style="color: #2c3e50; font-family: monospace; font-weight: 600;">${record.barcode}</span>
                </div>
                
                <div style="background: white; padding: 12px; border-radius: 8px; border: 1px solid #e8eaed;">
                    <strong style="color: #7f8c8d; font-size: 12px; display: block; margin-bottom: 4px;">Setor</strong>
                    <span class="badge badge-primary">${getSectorName(record.sector)}</span>
                </div>
            </div>
            
            <div style="margin-bottom: 16px;">
                <strong style="color: #7f8c8d; font-size: 12px; display: block; margin-bottom: 4px;">Colaborador</strong>
                <div style="background: white; padding: 12px; border-radius: 8px; border: 1px solid #e8eaed; color: #2c3e50; font-weight: 600;">
                    <i class="fas fa-user"></i> ${record.employee}
                </div>
            </div>
            
            ${record.notes ? `
            <div style="margin-bottom: 16px;">
                <strong style="color: #7f8c8d; font-size: 12px; display: block; margin-bottom: 4px;">Observações</strong>
                <div style="background: #e3f2fd; padding: 12px; border-radius: 8px; border-left: 4px solid #3498db; color: #0d47a1;">
                    ${record.notes}
                </div>
            </div>
            ` : ''}
            
            <div style="background: white; padding: 12px; border-radius: 8px; border: 1px solid #e8eaed; color: #7f8c8d; font-size: 14px;">
                <i class="fas fa-clock"></i> Registrado em: ${formatDateTime(record.timestamp)}
            </div>
        </div>
    `;
    
    showConfirmation('Detalhes da Retirada', message, false);
}

// FILTRO DE REGISTROS
function setupFilter() {
    const filterBtn = document.getElementById('filter-records');
    const closeFilterBtn = document.getElementById('close-filter');
    const applyFilterBtn = document.getElementById('apply-filter');
    const clearFilterBtn = document.getElementById('clear-filter');
    
    filterBtn.addEventListener('click', function() {
        document.getElementById('filter-modal').classList.add('active');
    });
    
    closeFilterBtn.addEventListener('click', function() {
        document.getElementById('filter-modal').classList.remove('active');
    });
    
    applyFilterBtn.addEventListener('click', function() {
        const sector = document.getElementById('filter-sector').value;
        const dateFilter = document.getElementById('filter-date').value;
        const employee = document.getElementById('filter-employee').value.trim();
        
        AppState.currentFilter = {
            sector: sector || null,
            dateFilter: dateFilter || 'today',
            employee: employee || null
        };
        
        document.getElementById('filter-modal').classList.remove('active');
        updateRecordsDisplay();
        showAlert('Filtro aplicado com sucesso!', 'success');
    });
    
    clearFilterBtn.addEventListener('click', function() {
        document.getElementById('filter-sector').value = '';
        document.getElementById('filter-date').value = 'today';
        document.getElementById('filter-employee').value = '';
        
        AppState.currentFilter = null;
        document.getElementById('filter-modal').classList.remove('active');
        updateRecordsDisplay();
        showAlert('Filtro removido!', 'info');
    });
}

function filterRecords(records, filter) {
    return records.filter(record => {
        // Filtrar por setor
        if (filter.sector && record.sector !== filter.sector) {
            return false;
        }
        
        // Filtrar por colaborador
        if (filter.employee && !record.employee.toLowerCase().includes(filter.employee.toLowerCase())) {
            return false;
        }
        
        // Filtrar por data
        const recordDate = new Date(record.timestamp);
        const today = new Date();
        
        switch(filter.dateFilter) {
            case 'today':
                return recordDate.toDateString() === today.toDateString();
            case 'yesterday':
                const yesterday = new Date(today);
                yesterday.setDate(yesterday.getDate() - 1);
                return recordDate.toDateString() === yesterday.toDateString();
            case 'week':
                const startOfWeek = new Date(today);
                startOfWeek.setDate(today.getDate() - today.getDay());
                return recordDate >= startOfWeek;
            case 'month':
                return recordDate.getMonth() === today.getMonth() && 
                       recordDate.getFullYear() === today.getFullYear();
            case 'all':
                return true;
            default:
                return true;
        }
    });
}

// CONFIGURAÇÕES
function loadSettings() {
    document.getElementById('company-name').value = AppState.settings.companyName;
    document.getElementById('max-quantity').value = AppState.settings.maxQuantity;
    document.getElementById('auto-save').value = AppState.settings.autoSave;
    document.getElementById('scan-sound').value = AppState.settings.scanSound;
    document.getElementById('duplicate-time').value = AppState.settings.duplicateTime;
    
    // Atualizar display da quantidade máxima
    updateMaxQuantityDisplay();
    
    // Configurar evento para período personalizado
    document.getElementById('report-period').addEventListener('change', function() {
        document.getElementById('custom-period').style.display = 
            this.value === 'custom' ? 'block' : 'none';
    });
    
    // Configurar data mínima e máxima para filtros
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('start-date').max = today;
    document.getElementById('end-date').max = today;
    document.getElementById('start-date').value = today;
    document.getElementById('end-date').value = today;
}

function updateMaxQuantityDisplay() {
    document.getElementById('max-quantity-display').textContent = AppState.settings.maxQuantity;
}

function saveSettings() {
    AppState.settings.companyName = document.getElementById('company-name').value.trim() || 'StockTrack';
    AppState.settings.maxQuantity = parseInt(document.getElementById('max-quantity').value) || 9999;
    AppState.settings.autoSave = document.getElementById('auto-save').value;
    AppState.settings.scanSound = document.getElementById('scan-sound').value;
    AppState.settings.duplicateTime = parseInt(document.getElementById('duplicate-time').value) || 1;
    
    localStorage.setItem('stocktrack_settings', JSON.stringify(AppState.settings));
    
    // Atualizar display
    updateMaxQuantityDisplay();
    
    showAlert('Configurações salvas com sucesso!', 'success');
}

// FUNÇÕES UTILITÁRIAS
function saveRecords() {
    localStorage.setItem('stocktrack_records', JSON.stringify(AppState.records));
}

function showAlert(message, type) {
    const alertDiv = document.getElementById('form-alert');
    
    const icons = {
        'success': 'check-circle',
        'warning': 'exclamation-triangle',
        'error': 'exclamation-circle',
        'info': 'info-circle'
    };
    
    alertDiv.innerHTML = `
        <i class="fas fa-${icons[type] || 'info-circle'}"></i>
        <div>${message}</div>
    `;
    
    alertDiv.className = `alert alert-${type}`;
    alertDiv.style.display = 'flex';
    
    // Auto-esconder após 5 segundos
    setTimeout(() => {
        alertDiv.style.display = 'none';
    }, 5000);
}

function showConfirmation(title, message, showCancel = true) {
    const modal = document.getElementById('confirmation-modal');
    const messageDiv = document.getElementById('confirmation-message');
    const titleElement = modal.querySelector('.modal-title');
    
    titleElement.innerHTML = `<i class="fas fa-check-circle"></i> ${title}`;
    messageDiv.innerHTML = message;
    modal.classList.add('active');
    
    // Configurar botões
    const confirmBtn = document.getElementById('confirm-ok');
    const cancelBtn = document.getElementById('confirm-cancel');
    
    confirmBtn.onclick = function() {
        modal.classList.remove('active');
    };
    
    cancelBtn.onclick = function() {
        modal.classList.remove('active');
    };
    
    cancelBtn.style.display = showCancel ? 'flex' : 'none';
}

function getSectorName(sectorCode) {
    const sectors = {
        'estoque': 'Estoque',
        'loja': 'Loja',
        'producao': 'Produção',
        'expedicao': 'Expedição',
        'manutencao': 'Manutenção',
        'outro': 'Outro'
    };
    
    return sectors[sectorCode] || sectorCode;
}

function formatDateTime(timestamp) {
    const date = new Date(timestamp);
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth()+1).toString().padStart(2, '0')}/${date.getFullYear()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
}

function formatDate(date) {
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth()+1).toString().padStart(2, '0')}/${date.getFullYear()}`;
}

function formatTime(timestamp) {
    const date = new Date(timestamp);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
}

// CONFIGURAÇÃO DE BOTÕES
function setupButtons() {
    // Botão para exportar Excel
    document.getElementById('export-excel-btn').addEventListener('click', exportToExcel);
    
    // Botão para salvar configurações
    document.getElementById('save-settings-btn').addEventListener('click', saveSettings);
    
    // Botão para backup de dados
    document.getElementById('backup-data-btn').addEventListener('click', function() {
        const dataStr = JSON.stringify({
            records: AppState.records,
            settings: AppState.settings,
            exportedAt: new Date().toISOString(),
            version: '1.0'
        }, null, 2);
        
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        const exportFileDefaultName = `stocktrack_backup_${new Date().toISOString().slice(0,10)}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        
        showAlert('Backup realizado com sucesso!', 'success');
    });
    
    // Botão para restaurar dados
    document.getElementById('restore-data-btn').addEventListener('click', function() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = function(e) {
            const file = e.target.files[0];
            const reader = new FileReader();
            
            reader.onload = function(event) {
                try {
                    const data = JSON.parse(event.target.result);
                    
                    if (data.records && Array.isArray(data.records)) {
                        showConfirmation('Restaurar Backup', 
                            `<div class="alert alert-warning">
                                <strong>Atenção!</strong><br>
                                Esta ação substituirá todos os dados atuais.<br>
                                <strong>${data.records.length}</strong> registros serão importados.
                            </div>`,
                            true
                        );
                        
                        document.getElementById('confirm-ok').onclick = function() {
                            AppState.records = data.records;
                            if (data.settings) {
                                AppState.settings = data.settings;
                                localStorage.setItem('stocktrack_settings', JSON.stringify(data.settings));
                                loadSettings();
                            }
                            saveRecords();
                            updateRecordsDisplay();
                            updateLastRegistration();
                            document.getElementById('confirmation-modal').classList.remove('active');
                            showAlert('Backup restaurado com sucesso!', 'success');
                        };
                    } else {
                        showAlert('Arquivo de backup inválido.', 'error');
                    }
                } catch (error) {
                    showAlert('Erro ao ler arquivo de backup.', 'error');
                }
            };
            
            reader.readAsText(file);
        };
        
        input.click();
    });
    
    // Botão para limpar registros
    document.getElementById('clear-records-btn').addEventListener('click', function() {
        showConfirmation('Limpar Registros', 
            `<div class="alert alert-warning">
                <strong>Atenção!</strong><br>
                Todos os ${AppState.records.length} registros serão apagados permanentemente.<br>
                Esta ação não pode ser desfeita.
                <div style="margin-top: 10px; font-size: 12px;">
                    <i class="fas fa-lightbulb"></i> Recomendamos fazer um backup antes.
                </div>
            </div>`,
            true
        );
        
        document.getElementById('confirm-ok').onclick = function() {
            AppState.records = [];
            AppState.currentFilter = null;
            saveRecords();
            updateRecordsDisplay();
            updateLastRegistration();
            document.getElementById('confirmation-modal').classList.remove('active');
            showAlert('Todos os registros foram removidos.', 'success');
        };
    });
}

// EXPORTAÇÃO PARA EXCEL
function exportToExcel() {
    if (AppState.records.length === 0) {
        showAlert('Não há registros para exportar.', 'warning');
        return;
    }
    
    // Criar cabeçalho CSV
    let csv = 'Produto,Código,Quantidade,Setor,Colaborador,Observações,Data/Hora\n';
    
    // Adicionar registros
    AppState.records.forEach(record => {
        const row = [
            `"${record.productName}"`,
            `"${record.barcode}"`,
            record.quantity,
            `"${getSectorName(record.sector)}"`,
            `"${record.employee}"`,
            `"${record.notes || ''}"`,
            `"${formatDateTime(record.timestamp)}"`
        ];
        csv += row.join(',') + '\n';
    });
    
    // Criar arquivo
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `retiradas_${new Date().toISOString().slice(0,10)}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showAlert('Dados exportados para CSV com sucesso!', 'success');
}