// reports.js - FUNÇÕES COMPLETAS COM SUPORTE A UNIDADES

// FUNÇÃO generateReport ATUALIZADA
function generateReport() {
    const period = document.getElementById('report-period').value;
    const groupBy = document.getElementById('group-by').value;
    let startDate, endDate;
    
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
    
    // Agrupar por produto, código E unidade
    const productsMap = {};
    filteredRecords.forEach(record => {
        const key = `${record.productName}_${record.barcode}_${record.unit}`;
        if (!productsMap[key]) {
            productsMap[key] = {
                productName: record.productName,
                barcode: record.barcode,
                unit: record.unit,
                records: [],
                totalQuantity: 0
            };
        }
        productsMap[key].records.push(record);
        productsMap[key].totalQuantity += record.quantity;
    });
    
    // Ordenar produtos por nome
    const sortedProducts = Object.values(productsMap).sort((a, b) => 
        a.productName.localeCompare(b.productName)
    );
    
    // Gerar conteúdo do resumo simplificado
    let summaryHTML = `
        <div class="report-section">
            <div class="report-header">
                <div class="report-title">Relatório de Retiradas</div>
                <div class="report-date">${period === 'custom' ? `${formatDate(startDate)} a ${formatDate(endDate)}` : getPeriodName(period)}</div>
            </div>
            
            <div style="text-align: center; margin: 20px 0; padding: 15px; background: #f8f9fa; border-radius: 10px;">
                <div style="font-size: 16px; color: #2c3e50;">
                    <strong>Total de registros:</strong> ${filteredRecords.length}
                </div>
                <div style="font-size: 14px; color: #7f8c8d; margin-top: 5px;">
                    <strong>Produtos distintos:</strong> ${sortedProducts.length}
                </div>
            </div>
            
            <!-- LISTA DE PRODUTOS COM UNIDADES -->
            <div style="margin-top: 20px;">
                <strong style="color: #2c3e50; display: block; margin-bottom: 15px; font-size: 18px;">
                    <i class="fas fa-boxes"></i> Produtos Retirados
                </strong>
    `;
    
    // Mostrar cada produto com seu código e unidade
    sortedProducts.forEach((productData, index) => {
        summaryHTML += `
            <div style="margin-bottom: ${index < sortedProducts.length - 1 ? '25px' : '0'}; padding-bottom: ${index < sortedProducts.length - 1 ? '25px' : '0'}; border-bottom: ${index < sortedProducts.length - 1 ? '2px solid #e8eaed' : 'none'};">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px;">
                    <div style="flex: 1;">
                        <div style="font-weight: bold; color: #2c3e50; font-size: 17px;">
                            ${index + 1}. ${productData.productName}
                        </div>
                        <div style="margin-top: 8px;">
                            <span style="font-family: 'Courier New', monospace; font-size: 14px; color: #3498db; background: #f0f8ff; padding: 4px 8px; border-radius: 4px; font-weight: bold;">
                                ${productData.barcode}
                            </span>
                            <span style="margin-left: 10px; font-size: 14px; color: #7f8c8d;">
                                <i class="fas fa-balance-scale"></i> ${getUnitName(productData.unit)}
                            </span>
                        </div>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-size: 22px; font-weight: bold; color: #2c3e50;">
                            ${formatQuantityValue(productData.totalQuantity, productData.unit)}
                        </div>
                        <div style="font-size: 13px; color: #7f8c8d;">
                            ${getUnitLabel(productData.unit)}
                        </div>
                    </div>
                </div>
                
                <!-- Detalhamento das retiradas deste produto/código -->
                <div style="margin-top: 15px; padding-left: 15px; border-left: 3px solid #3498db;">
                    <div style="font-size: 14px; color: #7f8c8d; margin-bottom: 10px;">
                        <i class="fas fa-list"></i> ${productData.records.length} retirada(s) registrada(s):
                    </div>
                    ${productData.records.map(record => `
                        <div style="font-size: 13px; color: #5d6d7e; margin-bottom: 8px; padding: 8px; background: white; border-radius: 6px; border: 1px solid #f1f3f5;">
                            <div style="display: flex; justify-content: space-between;">
                                <div>
                                    <strong>${record.employee}</strong> - ${getSectorName(record.sector)}
                                </div>
                                <div style="font-weight: bold; color: #2c3e50;">
                                    ${formatQuantityDisplay(record.quantity, record.unit)}
                                </div>
                            </div>
                            <div style="font-size: 12px; color: #7f8c8d; margin-top: 4px;">
                                <i class="fas fa-clock"></i> ${formatTime(record.timestamp)}
                                ${record.notes ? `<br><span style="color: #95a5a6; font-size: 11px; margin-top: 3px; display: block;">↳ ${record.notes}</span>` : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    });
    
    summaryHTML += `
            </div>
        </div>
    `;
    
    // Atualizar interface
    document.getElementById('report-summary').innerHTML = summaryHTML;
    document.getElementById('report-content').innerHTML = '';
    
    // Armazenar relatório atual para exportação
    AppState.currentReport = {
        period,
        startDate,
        endDate,
        filteredRecords,
        sortedProducts
    };
}

// FUNÇÃO exportToPDF ATUALIZADA COM UNIDADES
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
    
    // ========== CABEÇALHO ==========
    doc.setFillColor(41, 128, 185);
    doc.rect(0, 0, pageWidth, 30, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('STOCKTRACK', pageWidth / 2, 18, null, null, 'center');
    
    doc.setFontSize(12);
    doc.text('RELATÓRIO DE RETIRADAS', pageWidth / 2, 25, null, null, 'center');
    
    const today = new Date();
    const formattedDate = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth()+1).toString().padStart(2, '0')}/${today.getFullYear().toString().slice(2)}`;
    doc.setFontSize(10);
    doc.text(`DATA: ${formattedDate}`, pageWidth / 2, 32, null, null, 'center');
    
    yPos = 45;
    
    // ========== INFORMAÇÕES DO RELATÓRIO ==========
    const periodText = AppState.currentReport.period === 'custom' 
        ? `${formatDate(AppState.currentReport.startDate)} a ${formatDate(AppState.currentReport.endDate)}`
        : getPeriodName(AppState.currentReport.period);
    
    doc.setFontSize(11);
    doc.setTextColor(100, 100, 100);
    doc.text(`Período: ${periodText}`, margin, yPos);
    doc.text(`Registros: ${AppState.currentReport.filteredRecords.length}`, pageWidth - margin, yPos, null, null, 'right');
    
    yPos += 8;
    doc.text(`Produtos: ${AppState.currentReport.sortedProducts.length}`, pageWidth - margin, yPos, null, null, 'right');
    
    yPos += 15;
    
    // Linha divisória
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    
    yPos += 20;
    
    // ========== LISTA DE PRODUTOS ==========
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('PRODUTOS RETIRADOS', margin, yPos);
    yPos += 10;
    
    // Mostrar cada produto
    AppState.currentReport.sortedProducts.forEach((productData, index) => {
        // Verificar se precisa de nova página
        if (yPos > pageHeight - 60) {
            doc.addPage();
            yPos = margin;
        }
        
        // Título do produto
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text(`${index + 1}. ${productData.productName}`, margin, yPos);
        
        // Código de barras
        doc.setFontSize(10);
        doc.setFont('courier', 'bold');
        doc.setTextColor(52, 152, 219);
        doc.text(productData.barcode, margin, yPos + 7);
        
        // Unidade
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        doc.text(getUnitName(productData.unit), margin + 100, yPos + 7);
        
        // Quantidade total
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text(formatQuantityValue(productData.totalQuantity, productData.unit), pageWidth - margin - 30, yPos + 4, null, null, 'right');
        
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(getUnitLabel(productData.unit), pageWidth - margin - 30, yPos + 9, null, null, 'right');
        
        yPos += 15;
        
        // Detalhamento das retiradas
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(80, 80, 80);
        
        productData.records.forEach((record, recordIndex) => {
            if (yPos > pageHeight - 30) {
                doc.addPage();
                yPos = margin;
            }
            
            const line = `• ${record.employee} - ${getSectorName(record.sector)} - ${formatQuantityDisplay(record.quantity, record.unit)} - ${formatTime(record.timestamp)}`;
            doc.text(line, margin + 5, yPos);
            yPos += 5;
            
            // Observações se existirem
            if (record.notes) {
                if (yPos > pageHeight - 20) {
                    doc.addPage();
                    yPos = margin;
                }
                doc.setFontSize(8);
                doc.setTextColor(120, 120, 120);
                doc.text(`↳ ${record.notes}`, margin + 10, yPos);
                doc.setFontSize(9);
                doc.setTextColor(80, 80, 80);
                yPos += 5;
            }
        });
        
        // Espaço entre produtos
        yPos += 10;
        
        // Linha divisória entre produtos (exceto o último)
        if (index < AppState.currentReport.sortedProducts.length - 1) {
            doc.setDrawColor(230, 230, 230);
            doc.setLineWidth(0.2);
            doc.line(margin, yPos - 5, pageWidth - margin, yPos - 5);
            yPos += 5;
        }
    });
    
    // ========== RESUMO FINAL ==========
    if (yPos > pageHeight - 40) {
        doc.addPage();
        yPos = margin;
    }
    
    yPos += 10;
    
    // Linha divisória
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    
    yPos += 15;
    
    // Contagem de produtos únicos
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Total de produtos distintos: ${AppState.currentReport.sortedProducts.length}`, margin, yPos);
    
    // Rodapé
    const finalY = pageHeight - 15;
    
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('StockTrack — Sistema de Controle de Retiradas', margin, finalY);
    doc.text('Idealizado por Flávio Monteiro • Implementação técnica com apoio de IA', margin, finalY + 5);
    doc.text(`Página ${doc.internal.getNumberOfPages()}`, pageWidth - margin, finalY, null, null, 'right');
    
    // Salvar PDF
    const fileName = `relatorio_stocktrack_${new Date().toISOString().slice(0,10)}.pdf`;
    doc.save(fileName);
    
    showAlert('PDF gerado com sucesso!', 'success');
}

// FUNÇÃO exportToImage ATUALIZADA COM UNIDADES
function exportToImage() {
    if (!AppState.currentReport || AppState.currentReport.filteredRecords.length === 0) {
        showAlert('Gere um relatório primeiro para exportar.', 'warning');
        return;
    }
    
    // Criar container
    const container = document.createElement('div');
    container.className = 'export-frame1-container';
    container.style.width = '800px';
    container.style.padding = '40px';
    container.style.backgroundColor = '#ffffff';
    container.style.fontFamily = 'Arial, sans-serif';
    container.style.color = '#2c3e50';
    container.style.lineHeight = '1.4';
    
    const today = new Date();
    const formattedDate = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth()+1).toString().padStart(2, '0')}/${today.getFullYear().toString().slice(2)}`;
    
    // ========== CABEÇALHO ==========
    const header = document.createElement('div');
    header.style.backgroundColor = '#2980b9';
    header.style.color = 'white';
    header.style.padding = '25px';
    header.style.borderRadius = '10px 10px 0 0';
    header.style.marginBottom = '30px';
    header.style.textAlign = 'center';
    
    header.innerHTML = `
        <h1 style="font-size: 28px; font-weight: bold; margin-bottom: 10px;">STOCKTRACK</h1>
        <h2 style="font-size: 18px; margin-bottom: 15px;">RELATÓRIO DE RETIRADAS</h2>
        <div style="font-size: 16px; font-weight: bold;">
            DATA: ${formattedDate}
        </div>
    `;
    
    container.appendChild(header);
    
    // ========== INFORMAÇÕES DO RELATÓRIO ==========
    const periodText = AppState.currentReport.period === 'custom' 
        ? `${formatDate(AppState.currentReport.startDate)} a ${formatDate(AppState.currentReport.endDate)}`
        : getPeriodName(AppState.currentReport.period);
    
    const infoSection = document.createElement('div');
    infoSection.style.textAlign = 'center';
    infoSection.style.marginBottom = '30px';
    infoSection.style.padding = '15px';
    infoSection.style.backgroundColor = '#f8f9fa';
    infoSection.style.borderRadius = '8px';
    infoSection.style.fontSize = '14px';
    
    infoSection.innerHTML = `
        <div style="margin-bottom: 8px;">
            <strong>Período:</strong> ${periodText}
        </div>
        <div style="display: flex; justify-content: center; gap: 20px; margin-top: 8px;">
            <div>
                <strong>Registros:</strong> ${AppState.currentReport.filteredRecords.length}
            </div>
            <div>
                <strong>Produtos:</strong> ${AppState.currentReport.sortedProducts.length}
            </div>
        </div>
    `;
    
    container.appendChild(infoSection);
    
    // Linha divisória
    const divider = document.createElement('hr');
    divider.style.border = 'none';
    divider.style.height = '2px';
    divider.style.backgroundColor = '#e8eaed';
    divider.style.margin = '30px 0';
    container.appendChild(divider);
    
    // ========== LISTA DE PRODUTOS ==========
    const productsTitle = document.createElement('div');
    productsTitle.style.fontSize = '20px';
    productsTitle.style.fontWeight = 'bold';
    productsTitle.style.color = '#2c3e50';
    productsTitle.style.textAlign = 'center';
    productsTitle.style.marginBottom = '30px';
    productsTitle.textContent = 'PRODUTOS RETIRADOS';
    container.appendChild(productsTitle);
    
    // Mostrar cada produto
    AppState.currentReport.sortedProducts.forEach((productData, productIndex) => {
        const productContainer = document.createElement('div');
        productContainer.style.marginBottom = '40px';
        
        // Tabela do produto
        const productTable = document.createElement('table');
        productTable.style.width = '100%';
        productTable.style.borderCollapse = 'collapse';
        productTable.style.border = '2px solid #2c3e50';
        productTable.style.marginBottom = '15px';
        
        productTable.innerHTML = `
            <tr>
                <td style="border-right: 2px solid #2c3e50; padding: 15px; width: 70%; vertical-align: top;">
                    <div style="font-size: 18px; font-weight: bold; color: #2c3e50; margin-bottom: 10px;">
                        ${productIndex + 1}. ${productData.productName}
                    </div>
                    <div style="font-size: 14px; color: #3498db; font-weight: bold; font-family: 'Courier New', monospace; margin-bottom: 5px;">
                        Código de Barras: ${productData.barcode}
                    </div>
                    <div style="font-size: 13px; color: #7f8c8d;">
                        <i class="fas fa-balance-scale"></i> ${getUnitName(productData.unit)}
                    </div>
                </td>
                <td style="padding: 15px; width: 30%; text-align: center; vertical-align: middle;">
                    <div style="font-size: 24px; font-weight: bold; color: #2c3e50;">
                        ${formatQuantityValue(productData.totalQuantity, productData.unit)}
                    </div>
                    <div style="font-size: 12px; color: #7f8c8d; text-transform: uppercase;">
                        ${getUnitLabel(productData.unit)}
                    </div>
                </td>
            </tr>
        `;
        
        productContainer.appendChild(productTable);
        
        // Detalhamento das retiradas
        const detailsContainer = document.createElement('div');
        detailsContainer.style.marginLeft = '20px';
        detailsContainer.style.marginBottom = '20px';
        
        productData.records.forEach(record => {
            const detailItem = document.createElement('div');
            detailItem.style.fontSize = '13px';
            detailItem.style.color = '#5d6d7e';
            detailItem.style.marginBottom = '8px';
            detailItem.style.paddingLeft = '15px';
            detailItem.style.borderLeft = '3px solid #3498db';
            
            let detailHTML = `
                <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
                    <div>
                        <span style="font-weight: bold;">${record.employee}</span> - 
                        <span>${getSectorName(record.sector)}</span>
                    </div>
                    <div style="font-weight: bold; color: #2c3e50;">
                        ${formatQuantityDisplay(record.quantity, record.unit)}
                    </div>
                </div>
                <div style="font-size: 11px; color: #7f8c8d;">
                    <i class="fas fa-clock"></i> ${formatTime(record.timestamp)}
            `;
            
            if (record.notes) {
                detailHTML += `<br><span style="color: #95a5a6; font-size: 10px; margin-top: 2px; display: block;">↳ ${record.notes}</span>`;
            }
            
            detailHTML += `</div>`;
            
            detailItem.innerHTML = detailHTML;
            detailsContainer.appendChild(detailItem);
        });
        
        productContainer.appendChild(detailsContainer);
        
        // Espaço entre produtos
        if (productIndex < AppState.currentReport.sortedProducts.length - 1) {
            const productDivider = document.createElement('div');
            productDivider.style.height = '1px';
            productDivider.style.backgroundColor = '#e8eaed';
            productDivider.style.margin = '20px 0';
            productContainer.appendChild(productDivider);
        }
        
        container.appendChild(productContainer);
    });
    
    // ========== RESUMO FINAL ==========
    const summarySection = document.createElement('div');
    summarySection.style.textAlign = 'center';
    summarySection.style.marginTop = '30px';
    summarySection.style.padding = '15px';
    summarySection.style.backgroundColor = '#f8f9fa';
    summarySection.style.borderRadius = '8px';
    summarySection.style.fontSize = '14px';
    
    summarySection.innerHTML = `
        <div style="margin-bottom: 8px;">
            <strong>Total de produtos distintos:</strong> ${AppState.currentReport.sortedProducts.length}
        </div>
        <div>
            <strong>Total de registros:</strong> ${AppState.currentReport.filteredRecords.length}
        </div>
    `;
    
    container.appendChild(summarySection);
    
    // ========== RODAPÉ ==========
    const footer = document.createElement('div');
    footer.style.textAlign = 'center';
    footer.style.marginTop = '50px';
    footer.style.paddingTop = '20px';
    footer.style.borderTop = '1px solid #e8eaed';
    footer.style.color = '#7f8c8d';
    footer.style.fontSize = '11px';
    
    footer.innerHTML = `
        <div style="margin-bottom: 8px;">
            <strong>StockTrack — Sistema de Controle de Retiradas</strong>
        </div>
        <div style="margin-bottom: 5px;">
            Idealizado por Flávio Monteiro • Implementação técnica com apoio de IA
        </div>
        <div style="font-size: 10px;">
            Relatório gerado: ${formatDateTime(new Date().toISOString())}
        </div>
    `;
    
    container.appendChild(footer);
    
    // Adicionar ao documento temporariamente
    document.body.appendChild(container);
    
    // Gerar imagem
    html2canvas(container, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false,
        width: 800,
        height: container.scrollHeight,
        windowWidth: 800
    }).then(canvas => {
        // Converter para imagem
        const image = canvas.toDataURL('image/png', 1.0);
        
        // Criar link para download
        const link = document.createElement('a');
        link.download = `relatorio_stocktrack_${new Date().toISOString().slice(0,10)}.png`;
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

// FUNÇÃO shareReport ATUALIZADA
function shareReport() {
    if (!AppState.currentReport || AppState.currentReport.filteredRecords.length === 0) {
        showAlert('Gere um relatório primeiro para compartilhar.', 'warning');
        return;
    }
    
    const periodText = AppState.currentReport.period === 'custom' 
        ? `${formatDate(AppState.currentReport.startDate)} a ${formatDate(AppState.currentReport.endDate)}`
        : getPeriodName(AppState.currentReport.period);
    
    // Criar texto simplificado com produtos, quantidades, códigos e unidades
    let reportText = `📋 RELATÓRIO DE RETIRADAS - ${AppState.settings.companyName}

📅 PERÍODO: ${periodText}
📊 REGISTROS: ${AppState.currentReport.filteredRecords.length}
📦 PRODUTOS DISTINTOS: ${AppState.currentReport.sortedProducts.length}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 LISTA DE PRODUTOS:

`;
    
    // Adicionar cada produto
    AppState.currentReport.sortedProducts.forEach((productData, index) => {
        reportText += `
${index + 1}. ${productData.productName}
   Código: ${productData.barcode}
   Unidade: ${getUnitName(productData.unit)}
   Total: ${formatQuantityValue(productData.totalQuantity, productData.unit)} ${getUnitLabel(productData.unit)}
   
   Retiradas:
`;
        
        productData.records.forEach(record => {
            const noteText = record.notes ? ` (${record.notes})` : '';
            reportText += `   • ${record.employee} - ${getSectorName(record.sector)} - ${formatQuantityDisplay(record.quantity, record.unit)} - ${formatTime(record.timestamp)}${noteText}\n`;
        });
        
        reportText += '\n';
    });
    
    reportText += `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📅 Gerado em: ${formatDateTime(new Date().toISOString())}

StockTrack — Sistema de Controle de Retiradas
Idealizado por Flávio Monteiro • Implementação técnica com apoio de IA`;
    
    // Tentar usar API de compartilhamento
    if (navigator.share) {
        navigator.share({
            title: `Relatório de Retiradas - ${AppState.settings.companyName}`,
            text: reportText,
            url: window.location.href
        }).then(() => {
            showAlert('Relatório compartilhado com sucesso!', 'success');
        }).catch(error => {
            console.log('Compartilhamento cancelado:', error);
            downloadTextFile(reportText);
        });
    } else {
        downloadTextFile(reportText);
    }
}

// FUNÇÕES AUXILIARES
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

// FUNÇÃO PARA FORMATAR VALORES DE QUANTIDADE
function formatQuantityValue(quantity, unit) {
    const numQuantity = parseFloat(quantity);
    
    switch(unit) {
        case 'KG':
            return numQuantity.toFixed(2);
        case 'L':
            return numQuantity.toFixed(1);
        case 'M':
            return numQuantity.toFixed(2);
        default:
            return numQuantity.toFixed(0);
    }
}

// FUNÇÃO PARA OBTER ABREVIAÇÃO DA UNIDADE
function getUnitAbbreviation(unit) {
    const abbreviations = {
        'UN': 'un',
        'KG': 'kg',
        'ML': 'ml',
        'L': 'l',
        'M': 'm',
        'CX': 'cx',
        'PC': 'pc',
        'OUTRO': 'un'
    };
    return abbreviations[unit] || unit;
}

// INICIALIZAÇÃO DOS RELATÓRIOS
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('generate-report-btn').addEventListener('click', generateReport);
    document.getElementById('export-pdf-btn').addEventListener('click', exportToPDF);
    document.getElementById('export-image-btn').addEventListener('click', exportToImage);
    document.getElementById('share-report-btn').addEventListener('click', shareReport);
});