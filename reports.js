// RELATÓRIOS
function generateReport() {
    const period = document.getElementById('report-period').value;
    const groupBy = document.getElementById('group-by').value;
    let startDate, endDate;
    
    // Definir período
    const today = new Date();
    
    switch(period) {
        case 'today':
            startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
            break;
            
        case 'yesterday':
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            startDate = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
            endDate = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59);
            break;
            
        case 'week':
            const dayOfWeek = today.getDay();
            const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
            startDate = new Date(today.getFullYear(), today.getMonth(), diff);
            endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
            break;
            
        case 'month':
            startDate = new Date(today.getFullYear(), today.getMonth(), 1);
            endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
            break;
            
        case 'custom':
            const startInput = document.getElementById('start-date').value;
            const endInput = document.getElementById('end-date').value;
            
            if (!startInput || !endInput) {
                showAlert('Selecione ambas as datas para período personalizado.', 'error');
                return;
            }
            
            startDate = new Date(startInput);
            endDate = new Date(endInput);
            endDate.setHours(23, 59, 59);
            break;
    }
    
    // Filtrar registros pelo período
    const filteredRecords = AppState.records.filter(record => {
        const recordDate = new Date(record.timestamp);
        return recordDate >= startDate && recordDate <= endDate;
    });
    
    if (filteredRecords.length === 0) {
        document.getElementById('report-content').innerHTML = '';
        document.getElementById('report-summary').innerHTML = `
            <div class="empty-state">
                <i class="fas fa-chart-bar"></i>
                <p>Nenhum registro no período selecionado</p>
                <p style="font-size: 14px; margin-top: 10px;">Tente selecionar um período diferente</p>
            </div>
        `;
        return;
    }
    
    // Gerar resumo agrupado
    const summary = {};
    let totalQuantity = 0;
    const uniqueProducts = new Set();
    const uniqueEmployees = new Set();
    const uniqueSectors = new Set();
    
    filteredRecords.forEach(record => {
        let key;
        switch(groupBy) {
            case 'product':
                key = record.productName;
                break;
            case 'sector':
                key = record.sector;
                break;
            case 'employee':
                key = record.employee;
                break;
            case 'hour':
                const hour = new Date(record.timestamp).getHours();
                key = `${hour}:00-${hour}:59`;
                break;
            default:
                key = record.productName;
        }
        
        if (!summary[key]) {
            summary[key] = {
                name: key,
                quantity: 0,
                barcodes: new Set(),
                records: []
            };
        }
        
        summary[key].quantity += record.quantity;
        summary[key].barcodes.add(record.barcode);
        summary[key].records.push(record);
        totalQuantity += record.quantity;
        
        uniqueProducts.add(record.productName);
        uniqueEmployees.add(record.employee);
        uniqueSectors.add(record.sector);
    });
    
    // Gerar resumo estatístico
    const avgPerRecord = totalQuantity / filteredRecords.length;
    
    // Encontrar produtos mais retirados
    const sortedProducts = Object.entries(summary)
        .sort((a, b) => b[1].quantity - a[1].quantity)
        .slice(0, 5);
    
    // Gerar conteúdo do resumo
    let summaryHTML = `
        <div class="report-section">
            <div class="report-header">
                <div class="report-title">Resumo do Período</div>
                <div class="report-date">${period === 'custom' ? `${formatDate(startDate)} a ${formatDate(endDate)}` : getPeriodName(period)}</div>
            </div>
            
            <div class="report-grid">
                <div class="report-card">
                    <div class="report-card-title">Total Retirado</div>
                    <div class="report-card-value">${totalQuantity}</div>
                    <div class="report-card-detail">unidades</div>
                </div>
                
                <div class="report-card">
                    <div class="report-card-title">Registros</div>
                    <div class="report-card-value">${filteredRecords.length}</div>
                    <div class="report-card-detail">ocorrências</div>
                </div>
                
                <div class="report-card">
                    <div class="report-card-title">Média por Registro</div>
                    <div class="report-card-value">${avgPerRecord.toFixed(1)}</div>
                    <div class="report-card-detail">unidades/movimento</div>
                </div>
                
                <div class="report-card">
                    <div class="report-card-title">Produtos Únicos</div>
                    <div class="report-card-value">${uniqueProducts.size}</div>
                    <div class="report-card-detail">itens diferentes</div>
                </div>
                
                <div class="report-card">
                    <div class="report-card-title">Colaboradores</div>
                    <div class="report-card-value">${uniqueEmployees.size}</div>
                    <div class="report-card-detail">pessoas envolvidas</div>
                </div>
                
                <div class="report-card">
                    <div class="report-card-title">Setores</div>
                    <div class="report-card-value">${uniqueSectors.size}</div>
                    <div class="report-card-detail">áreas distintas</div>
                </div>
            </div>
            
            ${sortedProducts.length > 0 ? `
            <div style="margin-top: 24px;">
                <h4 style="color: #2c3e50; margin-bottom: 12px; font-size: 16px;">Top 5 Produtos Mais Retirados</h4>
                <div style="background: white; border-radius: 12px; padding: 16px; border: 1px solid #e8eaed;">
                    ${sortedProducts.map(([product, data], index) => `
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: ${index < 4 ? '1px solid #f1f3f5' : 'none'};">
                            <div>
                                <span style="color: #3498db; font-weight: 600; margin-right: 8px;">${index + 1}.</span>
                                <span style="color: #2c3e50;">${product}</span>
                            </div>
                            <span class="badge ${data.quantity > 50 ? 'badge-warning' : 'badge-success'}" style="font-size: 14px;">${data.quantity} unidades</span>
                        </div>
                    `).join('')}
                </div>
            </div>
            ` : ''}
        </div>
    `;
    
    // Gerar conteúdo detalhado agrupado
    let detailedHTML = `
        <div class="report-section">
            <div class="report-header">
                <div class="report-title">Detalhamento por ${getGroupByName(groupBy)}</div>
                <div class="report-date">${Object.keys(summary).length} grupos</div>
            </div>
    `;
    
    // Ordenar grupos por quantidade
    const sortedGroups = Object.entries(summary)
        .sort((a, b) => b[1].quantity - a[1].quantity);
    
    sortedGroups.forEach(([key, data]) => {
        detailedHTML += `
            <div style="margin-bottom: 20px; background: white; border-radius: 12px; padding: 16px; border: 1px solid #e8eaed;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                    <div>
                        <strong style="color: #2c3e50; font-size: 16px;">${key}</strong>
                        <div style="color: #7f8c8d; font-size: 13px; margin-top: 2px;">
                            ${data.records.length} registro(s) • ${data.barcodes.size} código(s) único(s)
                        </div>
                    </div>
                    <span class="badge ${data.quantity > 100 ? 'badge-warning' : 'badge-success'}" style="font-size: 16px; padding: 6px 12px;">
                        ${data.quantity} unidades
                    </span>
                </div>
                
                ${data.records.length <= 5 ? `
                    <div style="font-size: 14px; color: #5d6d7e; margin-top: 12px;">
                        <strong>Últimas retiradas:</strong>
                        <div style="margin-top: 8px;">
                            ${data.records.slice(0, 5).map(record => `
                                <div style="display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px solid #f8f9fa;">
                                    <span>${record.employee}</span>
                                    <span>${formatTime(record.timestamp)} • ${record.quantity} un</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : `
                    <div style="font-size: 14px; color: #5d6d7e; margin-top: 8px;">
                        <i class="fas fa-history"></i> ${data.records.length} retiradas registradas
                    </div>
                `}
            </div>
        `;
    });
    
    detailedHTML += `</div>`;
    
    // Atualizar interface
    document.getElementById('report-summary').innerHTML = summaryHTML;
    document.getElementById('report-content').innerHTML = detailedHTML;
    
    // Armazenar relatório atual para exportação
    AppState.currentReport = {
        period,
        startDate,
        endDate,
        filteredRecords,
        summary,
        totalQuantity,
        groupBy,
        avgPerRecord,
        uniqueProducts: uniqueProducts.size,
        uniqueEmployees: uniqueEmployees.size,
        uniqueSectors: uniqueSectors.size
    };
    
    // Rolar para o topo do relatório
    document.getElementById('report-content').scrollIntoView({ behavior: 'smooth' });
}

function exportToPDF() {
    if (!AppState.currentReport || AppState.currentReport.filteredRecords.length === 0) {
        showAlert('Gere um relatório primeiro para exportar.', 'warning');
        return;
    }
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    let yPos = margin;
    
    // Cabeçalho
    doc.setFillColor(44, 62, 80);
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('STOCKTRACK', margin, 25);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Relatório de Retiradas', margin, 35);
    
    // Informações da empresa
    doc.setTextColor(52, 152, 219);
    doc.setFontSize(10);
    doc.text(AppState.settings.companyName, pageWidth - margin - 50, 25);
    doc.setTextColor(100, 100, 100);
    doc.text('Sistema de Controle de Materiais', pageWidth - margin - 50, 32);
    
    // Data de geração
    const today = new Date();
    doc.text(`Gerado em: ${formatDateTime(today.toISOString())}`, pageWidth - margin - 50, 39);
    
    yPos = 50;
    
    // Linha divisória
    doc.setDrawColor(52, 152, 219);
    doc.setLineWidth(0.5);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 10;
    
    // Período do relatório
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Período Analisado', margin, yPos);
    yPos += 7;
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    const periodText = AppState.currentReport.period === 'custom' 
        ? `${formatDate(AppState.currentReport.startDate)} a ${formatDate(AppState.currentReport.endDate)}`
        : getPeriodName(AppState.currentReport.period);
    doc.text(periodText, margin, yPos);
    yPos += 15;
    
    // Resumo estatístico
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Resumo Estatístico', margin, yPos);
    yPos += 7;
    
    const summaryData = [
        ['Total Retirado', `${AppState.currentReport.totalQuantity} unidades`],
        ['Registros', `${AppState.currentReport.filteredRecords.length} ocorrências`],
        ['Média por Registro', `${AppState.currentReport.avgPerRecord.toFixed(1)} unidades/movimento`],
        ['Produtos Únicos', `${AppState.currentReport.uniqueProducts} itens diferentes`],
        ['Colaboradores', `${AppState.currentReport.uniqueEmployees} pessoas envolvidas`],
        ['Setores', `${AppState.currentReport.uniqueSectors} áreas distintas`]
    ];
    
    doc.setFontSize(10);
    summaryData.forEach(([label, value]) => {
        doc.setTextColor(100, 100, 100);
        doc.text(`${label}:`, margin, yPos);
        doc.setTextColor(0, 0, 0);
        doc.text(value, margin + 60, yPos);
        yPos += 5;
    });
    
    yPos += 10;
    
    // Detalhamento por grupo
    if (Object.keys(AppState.currentReport.summary).length > 0) {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(`Detalhamento por ${getGroupByName(AppState.currentReport.groupBy)}`, margin, yPos);
        yPos += 10;
        
        // Ordenar grupos por quantidade
        const sortedGroups = Object.entries(AppState.currentReport.summary)
            .sort((a, b) => b[1].quantity - a[1].quantity);
        
        sortedGroups.forEach(([key, data]) => {
            // Verificar se precisa de nova página
            if (yPos > pageHeight - 40) {
                doc.addPage();
                yPos = margin;
            }
            
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(52, 152, 219);
            doc.text(key, margin, yPos);
            yPos += 5;
            
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(100, 100, 100);
            doc.text(`${data.quantity} unidades • ${data.records.length} registro(s) • ${data.barcodes.size} código(s)`, margin, yPos);
            yPos += 15;
        });
    }
    
    // Rodapé
    const footerY = pageHeight - 15;
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.2);
    doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);
    
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('StockTrack - Sistema de Controle de Retiradas', margin, footerY);
    doc.text(`Página ${doc.internal.getNumberOfPages()}`, pageWidth - margin - 20, footerY, null, null, 'right');
    
    // Salvar PDF
    const fileName = `relatorio_retiradas_${new Date().toISOString().slice(0,10)}.pdf`;
    doc.save(fileName);
    
    showAlert('PDF gerado com sucesso!', 'success');
}

function exportToImage() {
    if (!AppState.currentReport || AppState.currentReport.filteredRecords.length === 0) {
        showAlert('Gere um relatório primeiro para exportar.', 'warning');
        return;
    }
    
    // Criar container para a imagem
    const container = document.createElement('div');
    container.className = 'export-image-container';
    container.style.width = '800px';
    container.style.padding = '40px';
    
    // Conteúdo do relatório em imagem
    container.innerHTML = `
        <div class="export-header">
            <div class="export-logo">
                <i class="fas fa-boxes-stacked"></i>
            </div>
            <div class="export-company">${AppState.settings.companyName}</div>
            <div class="export-subtitle">Relatório de Retiradas</div>
            <div style="margin-top: 10px; font-size: 14px; color: #7f8c8d;">
                ${formatDateTime(new Date().toISOString())}
            </div>
        </div>
        
        <div style="margin: 30px 0;">
            <h3 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; margin-bottom: 20px;">
                Período: ${AppState.currentReport.period === 'custom' 
                    ? `${formatDate(AppState.currentReport.startDate)} a ${formatDate(AppState.currentReport.endDate)}`
                    : getPeriodName(AppState.currentReport.period)}
            </h3>
            
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 30px;">
                <div style="background: #f8fafc; padding: 20px; border-radius: 12px; text-align: center;">
                    <div style="font-size: 12px; color: #7f8c8d; margin-bottom: 8px;">TOTAL RETIRADO</div>
                    <div style="font-size: 32px; font-weight: 700; color: #2c3e50;">${AppState.currentReport.totalQuantity}</div>
                    <div style="font-size: 12px; color: #95a5a6;">unidades</div>
                </div>
                
                <div style="background: #f8fafc; padding: 20px; border-radius: 12px; text-align: center;">
                    <div style="font-size: 12px; color: #7f8c8d; margin-bottom: 8px;">REGISTROS</div>
                    <div style="font-size: 32px; font-weight: 700; color: #2c3e50;">${AppState.currentReport.filteredRecords.length}</div>
                    <div style="font-size: 12px; color: #95a5a6;">ocorrências</div>
                </div>
                
                <div style="background: #f8fafc; padding: 20px; border-radius: 12px; text-align: center;">
                    <div style="font-size: 12px; color: #7f8c8d; margin-bottom: 8px;">MÉDIA POR REGISTRO</div>
                    <div style="font-size: 32px; font-weight: 700; color: #2c3e50;">${AppState.currentReport.avgPerRecord.toFixed(1)}</div>
                    <div style="font-size: 12px; color: #95a5a6;">unidades/movimento</div>
                </div>
            </div>
            
            <h4 style="color: #2c3e50; margin: 30px 0 15px 0; font-size: 18px;">
                Detalhamento por ${getGroupByName(AppState.currentReport.groupBy)}
            </h4>
            
            <div style="background: white; border-radius: 12px; padding: 20px; border: 1px solid #e8eaed;">
                ${Object.entries(AppState.currentReport.summary)
                    .sort((a, b) => b[1].quantity - a[1].quantity)
                    .slice(0, 10)
                    .map(([key, data]) => `
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #f1f3f5;">
                        <div style="flex: 1;">
                            <div style="font-weight: 600; color: #2c3e50; margin-bottom: 4px;">${key}</div>
                            <div style="font-size: 12px; color: #7f8c8d;">
                                ${data.records.length} registro(s) • ${data.barcodes.size} código(s)
                            </div>
                        </div>
                        <div style="font-weight: 700; color: ${data.quantity > 100 ? '#e74c3c' : '#2ecc71'}; font-size: 18px;">
                            ${data.quantity} unidades
                        </div>
                    </div>
                `).join('')}
                
                ${Object.keys(AppState.currentReport.summary).length > 10 ? `
                    <div style="text-align: center; padding: 15px; color: #7f8c8d; font-size: 14px;">
                        + ${Object.keys(AppState.currentReport.summary).length - 10} grupo(s) adicional(is)
                    </div>
                ` : ''}
            </div>
        </div>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e8eaed; color: #95a5a6; font-size: 12px;">
            Gerado pelo StockTrack • Sistema de Controle de Retiradas
        </div>
    `;
    
    // Adicionar ao documento temporariamente
    document.body.appendChild(container);
    
    // Gerar imagem
    html2canvas(container, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false
    }).then(canvas => {
        // Converter para imagem
        const image = canvas.toDataURL('image/png', 1.0);
        
        // Criar link para download
        const link = document.createElement('a');
        link.download = `relatorio_retiradas_${new Date().toISOString().slice(0,10)}.png`;
        link.href = image;
        link.click();
        
        // Remover container temporário
        document.body.removeChild(container);
        
        showAlert('Imagem gerada com sucesso!', 'success');
    }).catch(error => {
        console.error('Erro ao gerar imagem:', error);
        document.body.removeChild(container);
        showAlert('Erro ao gerar imagem. Tente novamente.', 'error');
    });
}

function shareReport() {
    if (!AppState.currentReport || AppState.currentReport.filteredRecords.length === 0) {
        showAlert('Gere um relatório primeiro para compartilhar.', 'warning');
        return;
    }
    
    // Texto do relatório para compartilhamento
    const periodText = AppState.currentReport.period === 'custom' 
        ? `${formatDate(AppState.currentReport.startDate)} a ${formatDate(AppState.currentReport.endDate)}`
        : getPeriodName(AppState.currentReport.period);
    
    const reportText = `📊 RELATÓRIO DE RETIRADAS - ${AppState.settings.companyName}

Período: ${periodText}
Total Retirado: ${AppState.currentReport.totalQuantity} unidades
Registros: ${AppState.currentReport.filteredRecords.length} ocorrências
Média: ${AppState.currentReport.avgPerRecord.toFixed(1)} unidades/movimento

Principais itens:
${Object.entries(AppState.currentReport.summary)
    .sort((a, b) => b[1].quantity - a[1].quantity)
    .slice(0, 3)
    .map(([key, data], index) => 
        `${index + 1}. ${key}: ${data.quantity} unidades`
    ).join('\n')}

Gerado em: ${formatDateTime(new Date().toISOString())}
Sistema StockTrack`;

    // Tentar usar API de compartilhamento do navegador
    if (navigator.share) {
        navigator.share({
            title: `Relatório de Retiradas - ${AppState.settings.companyName}`,
            text: reportText,
            url: window.location.href
        }).then(() => {
            showAlert('Relatório compartilhado com sucesso!', 'success');
        }).catch(error => {
            console.log('Compartilhamento cancelado:', error);
            // Fallback para download
            downloadTextFile(reportText);
        });
    } else {
        // Fallback para download de arquivo de texto
        downloadTextFile(reportText);
    }
}

function downloadTextFile(text) {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.href = url;
    link.download = `relatorio_retiradas_${new Date().toISOString().slice(0,10)}.txt`;
    link.click();
    
    URL.revokeObjectURL(url);
    showAlert('Relatório exportado como texto!', 'success');
}

// FUNÇÕES AUXILIARES PARA RELATÓRIOS
function getPeriodName(period) {
    const periods = {
        'today': 'Hoje',
        'yesterday': 'Ontem',
        'week': 'Esta Semana',
        'month': 'Este Mês',
        'custom': 'Personalizado'
    };
    return periods[period] || period;
}

function getGroupByName(groupBy) {
    const groups = {
        'product': 'Produto',
        'sector': 'Setor',
        'employee': 'Colaborador',
        'hour': 'Hora do Dia'
    };
    return groups[groupBy] || groupBy;
}

// INICIALIZAÇÃO DOS RELATÓRIOS
document.addEventListener('DOMContentLoaded', function() {
    // Botão para gerar relatório
    document.getElementById('generate-report-btn').addEventListener('click', generateReport);
    
    // Botão para exportar PDF
    document.getElementById('export-pdf-btn').addEventListener('click', exportToPDF);
    
    // Botão para exportar imagem
    document.getElementById('export-image-btn').addEventListener('click', exportToImage);
    
    // Botão para compartilhar relatório
    document.getElementById('share-report-btn').addEventListener('click', shareReport);
});