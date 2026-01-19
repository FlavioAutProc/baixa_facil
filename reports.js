// RELATÓRIOS
// FUNÇÃO generateReport - Atualizada para exibir códigos de barras conforme formato solicitado
// reports.js - FUNÇÃO generateReport ATUALIZADA
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
    
    // Calcular estatísticas
    let totalQuantity = 0;
    const uniqueProducts = new Set();
    const uniqueEmployees = new Set();
    const uniqueSectors = new Set();
    const uniqueBarcodes = new Set();
    
    filteredRecords.forEach(record => {
        totalQuantity += record.quantity;
        uniqueProducts.add(record.productName);
        uniqueEmployees.add(record.employee);
        uniqueSectors.add(record.sector);
        uniqueBarcodes.add(record.barcode);
    });
    
    // Calcular média
    const avgPerRecord = totalQuantity / filteredRecords.length;
    
    // Gerar conteúdo do resumo COM TODOS OS CÓDIGOS
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
                    <div class="report-card-detail">com códigos</div>
                </div>
                
                <div class="report-card">
                    <div class="report-card-title">Códigos Únicos</div>
                    <div class="report-card-value">${uniqueBarcodes.size}</div>
                    <div class="report-card-detail">diferentes</div>
                </div>
                
                <div class="report-card">
                    <div class="report-card-title">Média por Código</div>
                    <div class="report-card-value">${(totalQuantity / uniqueBarcodes.size).toFixed(1)}</div>
                    <div class="report-card-detail">unidades/código</div>
                </div>
            </div>
            
            <!-- LISTA DE TODOS OS CÓDIGOS COM QUANTIDADE -->
            <div style="margin-top: 20px; padding: 15px; background: #f8fafc; border-radius: 10px;">
                <strong style="color: #2c3e50; display: block; margin-bottom: 10px;">
                    <i class="fas fa-barcode"></i> Todos os Códigos Registrados (${uniqueBarcodes.size})
                </strong>
                <div style="display: flex; flex-wrap: wrap; gap: 8px; max-height: 120px; overflow-y: auto; padding: 10px; background: white; border-radius: 8px;">
                    ${Array.from(uniqueBarcodes).map(barcode => {
                        const recordsForBarcode = filteredRecords.filter(r => r.barcode === barcode);
                        const totalForBarcode = recordsForBarcode.reduce((sum, r) => sum + r.quantity, 0);
                        const productName = recordsForBarcode[0]?.productName || 'Produto';
                        
                        return `
                            <div style="background: #e3f2fd; border: 1px solid #bbdefb; border-radius: 6px; padding: 6px 10px; font-size: 12px;">
                                <div style="font-family: 'Courier New', monospace; font-weight: bold; color: #0d47a1;">
                                    ${barcode}
                                </div>
                                <div style="font-size: 10px; color: #1976d2;">
                                    ${productName.substring(0, 15)}${productName.length > 15 ? '...' : ''}
                                </div>
                                <div style="font-size: 11px; color: #2c3e50; font-weight: bold;">
                                    ${totalForBarcode} un
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        </div>
    `;
    
    // Gerar conteúdo detalhado com TODOS os registros e seus códigos
    let detailedHTML = `
        <div class="report-section">
            <div class="report-header">
                <div class="report-title">Detalhamento Completo das Retiradas</div>
                <div class="report-date">${filteredRecords.length} registros com códigos</div>
            </div>
    `;
    
    // Agrupar por produto para organização
    const productsMap = {};
    filteredRecords.forEach(record => {
        if (!productsMap[record.productName]) {
            productsMap[record.productName] = [];
        }
        productsMap[record.productName].push(record);
    });
    
    // Ordenar produtos por quantidade total
    const sortedProducts = Object.entries(productsMap).map(([productName, records]) => {
        const totalQty = records.reduce((sum, r) => sum + r.quantity, 0);
        return { productName, records, totalQty };
    }).sort((a, b) => b.totalQty - a.totalQty);
    
    // Mostrar cada produto com TODOS os registros e códigos
    sortedProducts.forEach((productData, index) => {
        detailedHTML += `
            <div style="margin-bottom: 24px; background: white; border-radius: 12px; padding: 20px; border: 1px solid #e8eaed; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 2px solid #3498db;">
                    <div style="flex: 1;">
                        <strong style="color: #2c3e50; font-size: 18px; display: block; margin-bottom: 8px;">
                            ${index + 1}. ${productData.productName}
                        </strong>
                        <div style="color: #7f8c8d; font-size: 14px;">
                            Total: <strong>${productData.totalQty} unidades</strong> • 
                            Registros: ${productData.records.length} • 
                            Códigos: ${new Set(productData.records.map(r => r.barcode)).size}
                        </div>
                    </div>
                    <span class="badge ${productData.totalQty > 100 ? 'badge-warning' : 'badge-success'}" style="font-size: 16px; padding: 8px 16px;">
                        ${productData.totalQty}
                    </span>
                </div>
                
                <!-- LISTA DE TODAS AS RETIRADAS COM SEUS CÓDIGOS -->
                <div style="margin-top: 12px;">
                    <div style="font-size: 14px; color: #5d6d7e; margin-bottom: 8px; font-weight: 600;">
                        <i class="fas fa-list"></i> Todas as retiradas deste produto:
                    </div>
                    <div style="max-height: 300px; overflow-y: auto; border: 1px solid #e8eaed; border-radius: 8px; padding: 10px;">
                        ${productData.records.map(record => `
                            <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 8px; border-bottom: 1px solid #f8f9fa; font-size: 14px;">
                                <div style="display: flex; align-items: center; gap: 10px;">
                                    <div style="min-width: 150px;">
                                        <div style="font-family: 'Courier New', monospace; font-weight: bold; color: #0d47a1; font-size: 13px; background: #f0f8ff; padding: 4px 8px; border-radius: 4px;">
                                            ${record.barcode}
                                        </div>
                                    </div>
                                    <div style="color: #7f8c8d;">
                                        <i class="fas fa-user"></i> ${record.employee}
                                    </div>
                                    <div style="color: #7f8c8d;">
                                        <i class="fas fa-building"></i> ${getSectorName(record.sector)}
                                    </div>
                                </div>
                                <div style="text-align: right;">
                                    <div style="font-weight: bold; color: #2c3e50;">${record.quantity} un</div>
                                    <div style="font-size: 12px; color: #7f8c8d;">${formatTime(record.timestamp)}</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
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
        totalQuantity,
        avgPerRecord,
        uniqueProducts: uniqueProducts.size,
        uniqueEmployees: uniqueEmployees.size,
        uniqueSectors: uniqueSectors.size,
        uniqueBarcodes: uniqueBarcodes.size,
        uniqueBarcodesList: Array.from(uniqueBarcodes),
        productsMap: productsMap,
        barcodeFrequency: {}
    };
    
    // Calcular frequência de códigos
    const allBarcodeFrequency = {};
    filteredRecords.forEach(record => {
        allBarcodeFrequency[record.barcode] = (allBarcodeFrequency[record.barcode] || 0) + 1;
    });
    AppState.currentReport.barcodeFrequency = allBarcodeFrequency;
    
    // Rolar para o topo do relatório
    document.getElementById('report-content').scrollIntoView({ behavior: 'smooth' });
}
// reports.js - FUNÇÃO exportToImage ATUALIZADA - FORMATO FRAME1
function exportToImage() {
    if (!AppState.currentReport || AppState.currentReport.filteredRecords.length === 0) {
        showAlert('Gere um relatório primeiro para exportar.', 'warning');
        return;
    }
    
    // Criar container no formato Frame1
    const container = document.createElement('div');
    container.className = 'export-frame1-container';
    container.style.width = '800px';
    container.style.padding = '40px';
    container.style.backgroundColor = '#ffffff';
    container.style.fontFamily = 'Arial, sans-serif';
    container.style.color = '#2c3e50';
    container.style.lineHeight = '1.4';
    
    // Cálculos
    const avgPerRecord = AppState.currentReport.totalQuantity / AppState.currentReport.filteredRecords.length;
    const avgPercentage = (avgPerRecord / AppState.currentReport.totalQuantity * 100).toFixed(1);
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
    
    // ========== RESUMO PRINCIPAL ==========
    const summarySection = document.createElement('div');
    summarySection.style.marginBottom = '30px';
    summarySection.style.border = '2px solid #2c3e50';
    summarySection.style.borderRadius = '5px';
    summarySection.style.overflow = 'hidden';
    
    summarySection.innerHTML = `
        <table style="width: 100%; border-collapse: collapse;">
            <thead>
                <tr>
                    <th style="border: 2px solid #2c3e50; padding: 15px; text-align: center; font-size: 16px; font-weight: bold; width: 50%;">
                        TOTAL DE RETIRADAS
                    </th>
                    <th style="border: 2px solid #2c3e50; padding: 15px; text-align: center; font-size: 16px; font-weight: bold; width: 50%;">
                        TOTAL DE REGISTROS
                    </th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td style="border: 2px solid #2c3e50; padding: 25px; text-align: center; font-size: 36px; font-weight: bold;">
                        ${AppState.currentReport.totalQuantity}
                    </td>
                    <td style="border: 2px solid #2c3e50; padding: 25px; text-align: center; font-size: 36px; font-weight: bold;">
                        ${AppState.currentReport.filteredRecords.length}
                    </td>
                </tr>
                <tr>
                    <td style="border: 2px solid #2c3e50; padding: 10px; text-align: center; font-size: 12px; color: #7f8c8d; text-transform: uppercase;">
                        UN/KG/ML
                    </td>
                    <td style="border: 2px solid #2c3e50; padding: 10px; text-align: center; font-size: 12px; color: #7f8c8d; text-transform: uppercase;">
                        OCORRÊNCIAS
                    </td>
                </tr>
            </tbody>
        </table>
    `;
    
    container.appendChild(summarySection);
    
    // ========== MÉDIA POR REGISTRO ==========
    const averageSection = document.createElement('div');
    averageSection.style.textAlign = 'center';
    averageSection.style.marginBottom = '30px';
    averageSection.style.padding = '20px';
    averageSection.style.backgroundColor = '#f8f9fa';
    averageSection.style.borderRadius = '10px';
    
    averageSection.innerHTML = `
        <div style="font-size: 16px; font-weight: bold; color: #2c3e50; margin-bottom: 10px;">
            MÉDIA POR REGISTRO
        </div>
        <div style="font-size: 14px; color: #7f8c8d; margin-bottom: 5px;">
            ${avgPercentage}%
        </div>
        <div style="font-size: 16px; font-weight: bold; color: #2c3e50;">
            ${avgPerRecord.toFixed(1)} UNIDADES/MOVIMENTO
        </div>
    `;
    
    container.appendChild(averageSection);
    
    // Linha divisória
    const divider = document.createElement('hr');
    divider.style.border = 'none';
    divider.style.height = '2px';
    divider.style.backgroundColor = '#e8eaed';
    divider.style.margin = '40px 0';
    container.appendChild(divider);
    
    // ========== DETALHAMENTO POR PRODUTO ==========
    const productsTitle = document.createElement('div');
    productsTitle.style.fontSize = '20px';
    productsTitle.style.fontWeight = 'bold';
    productsTitle.style.color = '#2c3e50';
    productsTitle.style.textAlign = 'center';
    productsTitle.style.marginBottom = '30px';
    productsTitle.textContent = 'Detalhamento por Produto';
    container.appendChild(productsTitle);
    
    // Agrupar por produto
    const productsSummary = {};
    AppState.currentReport.filteredRecords.forEach(record => {
        if (!productsSummary[record.productName]) {
            productsSummary[record.productName] = {
                productName: record.productName,
                barcodes: new Set(),
                records: [],
                totalQuantity: 0
            };
        }
        productsSummary[record.productName].barcodes.add(record.barcode);
        productsSummary[record.productName].records.push(record);
        productsSummary[record.productName].totalQuantity += record.quantity;
    });
    
    // Ordenar produtos por quantidade
    const sortedProducts = Object.values(productsSummary).sort((a, b) => b.totalQuantity - a.totalQuantity);
    
    // Mostrar cada produto
    sortedProducts.forEach((productData) => {
        const productContainer = document.createElement('div');
        productContainer.style.marginBottom = '40px';
        
        // Para cada código de barras do produto
        Array.from(productData.barcodes).forEach((barcode) => {
            const recordsForBarcode = productData.records.filter(r => r.barcode === barcode);
            const totalForBarcode = recordsForBarcode.reduce((sum, r) => sum + r.quantity, 0);
            
            const productTable = document.createElement('table');
            productTable.style.width = '100%';
            productTable.style.borderCollapse = 'collapse';
            productTable.style.marginBottom = '15px';
            productTable.style.border = '2px solid #2c3e50';
            
            productTable.innerHTML = `
                <tr>
                    <td style="border-right: 2px solid #2c3e50; padding: 15px; width: 70%; vertical-align: top;">
                        <div style="font-size: 18px; font-weight: bold; color: #2c3e50; margin-bottom: 10px;">
                            ${productData.productName}
                        </div>
                        <div style="font-size: 14px; color: #3498db; font-weight: bold; font-family: 'Courier New', monospace; margin-bottom: 5px;">
                            Código de Barras: ${barcode}
                        </div>
                        <div style="font-size: 12px; color: #7f8c8d;">
                            ${recordsForBarcode.length} retirada(s) com este código
                        </div>
                    </td>
                    <td style="padding: 15px; width: 30%; text-align: center; vertical-align: middle;">
                        <div style="font-size: 24px; font-weight: bold; color: #2c3e50;">
                            ${totalForBarcode}
                        </div>
                        <div style="font-size: 12px; color: #7f8c8d; text-transform: uppercase;">
                            Unidade
                        </div>
                    </td>
                </tr>
            `;
            
            productContainer.appendChild(productTable);
            
            // Detalhamento das retiradas
            if (recordsForBarcode.length > 0) {
                const detailsContainer = document.createElement('div');
                detailsContainer.style.marginLeft = '20px';
                detailsContainer.style.marginBottom = '20px';
                
                recordsForBarcode.slice(0, 3).forEach(record => {
                    const detailItem = document.createElement('div');
                    detailItem.style.fontSize = '12px';
                    detailItem.style.color = '#5d6d7e';
                    detailItem.style.marginBottom = '5px';
                    detailItem.style.paddingLeft = '15px';
                    detailItem.style.borderLeft = '3px solid #3498db';
                    detailItem.innerHTML = `
                        <span style="font-weight: bold;">${record.employee}</span> - 
                        <span style="color: #3498db;">${record.barcode}</span> - 
                        <span>${record.quantity} un - ${formatTime(record.timestamp)}</span>
                    `;
                    detailsContainer.appendChild(detailItem);
                });
                
                if (recordsForBarcode.length > 3) {
                    const moreItem = document.createElement('div');
                    moreItem.style.fontSize = '11px';
                    moreItem.style.color = '#95a5a6';
                    moreItem.style.fontStyle = 'italic';
                    moreItem.textContent = `... + ${recordsForBarcode.length - 3} retirada(s)`;
                    detailsContainer.appendChild(moreItem);
                }
                
                productContainer.appendChild(detailsContainer);
            }
        });
        
        // Resumo do produto (se tiver múltiplos códigos)
        if (productData.barcodes.size > 1) {
            const productSummary = document.createElement('div');
            productSummary.style.textAlign = 'center';
            productSummary.style.marginTop = '10px';
            productSummary.style.padding = '10px';
            productSummary.style.backgroundColor = '#f8f9fa';
            productSummary.style.borderRadius = '6px';
            productSummary.style.fontSize = '12px';
            productSummary.style.color = '#7f8c8d';
            productSummary.innerHTML = `
                <strong>Total do produto:</strong> ${productData.totalQuantity} unidades • 
                <strong>Códigos:</strong> ${productData.barcodes.size} • 
                <strong>Registros:</strong> ${productData.records.length}
            `;
            productContainer.appendChild(productSummary);
        }
        
        container.appendChild(productContainer);
    });
    
    // ========== RESUMO DE CÓDIGOS ==========
    if (AppState.currentReport.uniqueBarcodesList.length > 0) {
        const codesDivider = document.createElement('hr');
        codesDivider.style.border = 'none';
        codesDivider.style.height = '1px';
        codesDivider.style.backgroundColor = '#e8eaed';
        codesDivider.style.margin = '50px 0 30px';
        container.appendChild(codesDivider);
        
        const codesSection = document.createElement('div');
        codesSection.style.textAlign = 'center';
        
        codesSection.innerHTML = `
            <div style="font-size: 16px; font-weight: bold; color: #2c3e50; margin-bottom: 15px;">
                RESUMO DE CÓDIGOS
            </div>
            <div style="font-size: 14px; color: #7f8c8d; margin-bottom: 20px;">
                Total de <strong>${AppState.currentReport.uniqueBarcodes}</strong> códigos únicos registrados
            </div>
        `;
        
        // Mostrar alguns códigos como exemplo
        const sampleCodes = AppState.currentReport.uniqueBarcodesList.slice(0, 6);
        const codesGrid = document.createElement('div');
        codesGrid.style.display = 'flex';
        codesGrid.style.flexWrap = 'wrap';
        codesGrid.style.justifyContent = 'center';
        codesGrid.style.gap = '10px';
        codesGrid.style.marginBottom = '20px';
        
        sampleCodes.forEach(barcode => {
            const count = AppState.currentReport.barcodeFrequency[barcode] || 0;
            const codeBox = document.createElement('div');
            codeBox.style.border = '1px solid #3498db';
            codeBox.style.borderRadius = '6px';
            codeBox.style.padding = '8px 12px';
            codeBox.style.minWidth = '180px';
            codeBox.style.textAlign = 'left';
            
            codeBox.innerHTML = `
                <div style="font-family: 'Courier New', monospace; font-weight: bold; color: #0d47a1; font-size: 13px; margin-bottom: 3px;">
                    ${barcode}
                </div>
                <div style="font-size: 11px; color: #7f8c8d;">
                    ${count} registro${count > 1 ? 's' : ''}
                </div>
            `;
            
            codesGrid.appendChild(codeBox);
        });
        
        codesSection.appendChild(codesGrid);
        
        if (AppState.currentReport.uniqueBarcodesList.length > 6) {
            const moreCodes = document.createElement('div');
            moreCodes.style.fontSize = '12px';
            moreCodes.style.color = '#95a5a6';
            moreCodes.style.fontStyle = 'italic';
            moreCodes.textContent = `... + ${AppState.currentReport.uniqueBarcodesList.length - 6} código(s) adicional(is)`;
            codesSection.appendChild(moreCodes);
        }
        
        container.appendChild(codesSection);
    }
    
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

function downloadTextFile(text) {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.href = url;
    link.download = `relatorio_retiradas_${new Date().toISOString().slice(0,10)}.txt`;
    link.click();
    
    URL.revokeObjectURL(url);
    showAlert('Relatório exportado como texto! Inclui todos os códigos.', 'success');
}
// FUNÇÃO shareReport - Atualizada para incluir códigos
function shareReport() {
    if (!AppState.currentReport || AppState.currentReport.filteredRecords.length === 0) {
        showAlert('Gere um relatório primeiro para compartilhar.', 'warning');
        return;
    }
    
    // Texto do relatório para compartilhamento COM CÓDIGOS
    const periodText = AppState.currentReport.period === 'custom' 
        ? `${formatDate(AppState.currentReport.startDate)} a ${formatDate(AppState.currentReport.endDate)}`
        : getPeriodName(AppState.currentReport.period);
    
    // Obter top 5 códigos mais utilizados
    const topBarcodes = Object.entries(AppState.currentReport.barcodeFrequency)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([barcode, count], index) => {
            const totalUnits = AppState.currentReport.filteredRecords
                .filter(r => r.barcode === barcode)
                .reduce((sum, r) => sum + r.quantity, 0);
            return `${index + 1}. ${barcode}: ${count} registro${count > 1 ? 's' : ''} (${totalUnits} unidades)`;
        })
        .join('\n');
    
    const reportText = `📊 RELATÓRIO DE RETIRADAS - ${AppState.settings.companyName}

📅 PERÍODO: ${periodText}

📈 RESUMO ESTATÍSTICO:
• Total Retirado: ${AppState.currentReport.totalQuantity} unidades
• Registros: ${AppState.currentReport.filteredRecords.length} ocorrências
• Códigos Únicos: ${AppState.currentReport.uniqueBarcodes} códigos diferentes
• Produtos Únicos: ${AppState.currentReport.uniqueProducts} itens
• Colaboradores: ${AppState.currentReport.uniqueEmployees} pessoas
• Setores: ${AppState.currentReport.uniqueSectors} áreas

🏆 TOP 5 CÓDIGOS MAIS UTILIZADOS:
${topBarcodes}

📦 PRINCIPAIS ITENS (com códigos):
${Object.entries(AppState.currentReport.summary)
    .sort((a, b) => b[1].quantity - a[1].quantity)
    .slice(0, 3)
    .map(([key, data], index) => {
        const topCode = Array.from(data.barcodes)[0] || 'N/A';
        return `${index + 1}. ${key}: ${data.quantity} unidades (${data.barcodes.size} códigos, ex: ${topCode})`;
    }).join('\n')}

🕒 Gerado em: ${formatDateTime(new Date().toISOString())}
🔗 Sistema StockTrack - Controle de Retiradas com Códigos de Barras`;

    // Tentar usar API de compartilhamento do navegador
    if (navigator.share) {
        navigator.share({
            title: `Relatório de Retiradas com Códigos - ${AppState.settings.companyName}`,
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

// Função auxiliar para download de texto
function downloadTextFile(text) {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.href = url;
    link.download = `relatorio_codigos_retiradas_${new Date().toISOString().slice(0,10)}.txt`;
    link.click();
    
    URL.revokeObjectURL(url);
    showAlert('Relatório exportado como texto! Inclui todos os códigos.', 'success');
}

// FUNÇÕES AUXILIARES PARA RELATÓRIOS (mantidas iguais)
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

// reports.js - FUNÇÃO exportToPDF ATUALIZADA - FORMATO FRAME1
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
    // Fundo azul
    doc.setFillColor(41, 128, 185); // Azul similar ao Frame1
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    // Título
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('STOCKTRACK', margin, 25);
    
    doc.setFontSize(14);
    doc.text('RELATÓRIO DE RETIRADAS', margin, 35);
    
    // Data
    const today = new Date();
    const formattedDate = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth()+1).toString().padStart(2, '0')}/${today.getFullYear().toString().slice(2)}`;
    doc.setFontSize(12);
    doc.text(`DATA: ${formattedDate}`, pageWidth - margin - 40, 35, null, null, 'right');
    
    yPos = 50;
    
    // ========== RESUMO PRINCIPAL ==========
    // Tabela de resumo
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    
    // Linha horizontal superior
    doc.line(margin, yPos, pageWidth - margin, yPos);
    
    // Colunas
    const tableY = yPos + 10;
    const cellHeight = 15;
    
    // Cabeçalho da tabela
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    
    doc.text('TOTAL DE RETIRADAS', margin + (pageWidth - 2 * margin) * 0.25, tableY);
    doc.text('TOTAL DE REGISTROS', margin + (pageWidth - 2 * margin) * 0.75, tableY);
    
    // Valores
    doc.setFontSize(24);
    doc.text(AppState.currentReport.totalQuantity.toString(), margin + (pageWidth - 2 * margin) * 0.25, tableY + 20);
    doc.text(AppState.currentReport.filteredRecords.length.toString(), margin + (pageWidth - 2 * margin) * 0.75, tableY + 20);
    
    // Rótulos
    doc.setFontSize(10);
    doc.text('UN/KG/ML', margin + (pageWidth - 2 * margin) * 0.25, tableY + 27);
    doc.text('OCORRÊNCIAS', margin + (pageWidth - 2 * margin) * 0.75, tableY + 27);
    
    // Linha horizontal inferior
    doc.line(margin, tableY + 35, pageWidth - margin, tableY + 35);
    
    yPos = tableY + 45;
    
    // ========== MÉDIA POR REGISTRO ==========
    const avgPerRecord = AppState.currentReport.totalQuantity / AppState.currentReport.filteredRecords.length;
    const avgPercentage = (avgPerRecord / AppState.currentReport.totalQuantity * 100).toFixed(1);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('MÉDIA POR REGISTRO', pageWidth / 2, yPos, null, null, 'center');
    yPos += 7;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`${avgPercentage}%`, pageWidth / 2, yPos, null, null, 'center');
    yPos += 5;
    
    doc.text(`${avgPerRecord.toFixed(1)} UNIDADES/MOVIMENTO`, pageWidth / 2, yPos, null, null, 'center');
    
    yPos += 20;
    
    // Linha divisória
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    
    yPos += 20;
    
    // ========== DETALHAMENTO POR PRODUTO ==========
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Detalhamento por Produto', margin, yPos);
    yPos += 10;
    
    // Agrupar por produto
    const productsSummary = {};
    AppState.currentReport.filteredRecords.forEach(record => {
        if (!productsSummary[record.productName]) {
            productsSummary[record.productName] = {
                productName: record.productName,
                barcodes: new Set(),
                records: [],
                totalQuantity: 0
            };
        }
        productsSummary[record.productName].barcodes.add(record.barcode);
        productsSummary[record.productName].records.push(record);
        productsSummary[record.productName].totalQuantity += record.quantity;
    });
    
    // Ordenar produtos por quantidade
    const sortedProducts = Object.values(productsSummary).sort((a, b) => b.totalQuantity - a.totalQuantity);
    
    // Mostrar cada produto
    sortedProducts.forEach((productData, productIndex) => {
        // Verificar se precisa de nova página
        if (yPos > pageHeight - 60) {
            doc.addPage();
            yPos = margin;
        }
        
        // Para cada código de barras do produto
        Array.from(productData.barcodes).forEach((barcode, barcodeIndex) => {
            if (yPos > pageHeight - 40 && (barcodeIndex > 0 || productIndex > 0)) {
                doc.addPage();
                yPos = margin;
            }
            
            // Filtrar registros para este código específico
            const recordsForBarcode = productData.records.filter(r => r.barcode === barcode);
            const totalForBarcode = recordsForBarcode.reduce((sum, r) => sum + r.quantity, 0);
            
            // Tabela de produto
            doc.setDrawColor(0, 0, 0);
            doc.setLineWidth(0.5);
            
            // Linha superior
            doc.line(margin, yPos, pageWidth - margin, yPos);
            
            // Coluna esquerda (produto)
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            
            // Nome do produto
            doc.text(productData.productName, margin + 10, yPos + 10);
            
            // Código de barras (destacado)
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(52, 152, 219); // Azul
            doc.text(`Código de Barras: ${barcode}`, margin + 10, yPos + 17);
            
            // Detalhes deste código
            doc.setTextColor(100, 100, 100);
            doc.setFontSize(9);
            doc.text(`${recordsForBarcode.length} retirada(s) com este código`, margin + 10, yPos + 22);
            
            // Coluna direita (quantidade)
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            doc.text(totalForBarcode.toString(), pageWidth - margin - 30, yPos + 15);
            
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text('Unidade', pageWidth - margin - 30, yPos + 22);
            
            // Linha inferior
            doc.line(margin, yPos + 30, pageWidth - margin, yPos + 30);
            
            // Detalhamento das retiradas com este código
            doc.setTextColor(80, 80, 80);
            doc.setFontSize(9);
            
            recordsForBarcode.slice(0, 2).forEach((record, index) => {
                doc.text(
                    `${record.employee} - ${record.barcode} - ${record.quantity} un - ${formatTime(record.timestamp)}`,
                    margin + 20,
                    yPos + 38 + (index * 5)
                );
            });
            
            if (recordsForBarcode.length > 2) {
                doc.setTextColor(150, 150, 150);
                doc.text(`... + ${recordsForBarcode.length - 2} retirada(s)`, margin + 20, yPos + 48);
            }
            
            yPos += 55 + (Math.min(recordsForBarcode.length, 2) * 5);
            
            // Espaço entre códigos do mesmo produto
            if (barcodeIndex < productData.barcodes.size - 1) {
                yPos += 10;
            }
        });
        
        // Resumo do produto (se tiver múltiplos códigos)
        if (productData.barcodes.size > 1) {
            doc.setFontSize(10);
            doc.setTextColor(100, 100, 100);
            doc.text(
                `Total do produto: ${productData.totalQuantity} unidades • Códigos: ${productData.barcodes.size} • Registros: ${productData.records.length}`,
                margin,
                yPos
            );
            yPos += 15;
        }
        
        // Espaço entre produtos
        if (productIndex < sortedProducts.length - 1) {
            yPos += 10;
        }
    });
    
    // ========== RESUMO FINAL ==========
    if (yPos > pageHeight - 50) {
        doc.addPage();
        yPos = margin;
    }
    
    yPos += 10;
    
    // Linha divisória
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    
    yPos += 15;
    
    // Resumo de códigos
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Resumo de Códigos de Barras', margin, yPos);
    yPos += 8;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(`Total de ${AppState.currentReport.uniqueBarcodes} códigos únicos registrados`, margin, yPos);
    yPos += 15;
    
    // Mostrar alguns códigos como exemplo
    const sampleBarcodes = AppState.currentReport.uniqueBarcodesList.slice(0, 6);
    const codesPerRow = 2;
    const codeBoxWidth = (pageWidth - 2 * margin - 20) / codesPerRow;
    
    sampleBarcodes.forEach((barcode, index) => {
        const row = Math.floor(index / codesPerRow);
        const col = index % codesPerRow;
        const xPos = margin + 10 + (col * (codeBoxWidth + 10));
        const yBoxPos = yPos + (row * 25);
        
        // Caixa do código
        doc.setDrawColor(52, 152, 219);
        doc.setLineWidth(0.5);
        doc.rect(xPos, yBoxPos, codeBoxWidth, 20);
        
        // Código
        doc.setFont('courier', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(52, 152, 219);
        doc.text(barcode, xPos + 5, yBoxPos + 8);
        
        // Frequência
        const count = AppState.currentReport.barcodeFrequency[barcode] || 0;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text(`${count} registro${count > 1 ? 's' : ''}`, xPos + 5, yBoxPos + 15);
    });
    
    // Rodapé
    const finalY = Math.max(yPos + (Math.ceil(sampleBarcodes.length / codesPerRow) * 25), pageHeight - 30);
    
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('StockTrack — Sistema de Controle de Retiradas', margin, finalY);
    doc.text('Idealizado por Flávio Monteiro • Implementação técnica com apoio de IA', margin, finalY + 5);
    doc.text(`Página ${doc.internal.getNumberOfPages()}`, pageWidth - margin, finalY, null, null, 'right');
    
    // Salvar PDF
    const fileName = `relatorio_stocktrack_${new Date().toISOString().slice(0,10)}.pdf`;
    doc.save(fileName);
    
    showAlert('PDF gerado com sucesso no formato organizado!', 'success');
}

// function shareReport() {
//     if (!AppState.currentReport || AppState.currentReport.filteredRecords.length === 0) {
//         showAlert('Gere um relatório primeiro para compartilhar.', 'warning');
//         return;
//     }
    
//     // Texto do relatório para compartilhamento
//     const periodText = AppState.currentReport.period === 'custom' 
//         ? `${formatDate(AppState.currentReport.startDate)} a ${formatDate(AppState.currentReport.endDate)}`
//         : getPeriodName(AppState.currentReport.period);
    
//     const reportText = `📊 RELATÓRIO DE RETIRADAS - ${AppState.settings.companyName}

// Período: ${periodText}
// Total Retirado: ${AppState.currentReport.totalQuantity} unidades
// Registros: ${AppState.currentReport.filteredRecords.length} ocorrências
// Média: ${AppState.currentReport.avgPerRecord.toFixed(1)} unidades/movimento

// Principais itens:
// ${Object.entries(AppState.currentReport.summary)
//     .sort((a, b) => b[1].quantity - a[1].quantity)
//     .slice(0, 3)
//     .map(([key, data], index) => 
//         `${index + 1}. ${key}: ${data.quantity} unidades`
//     ).join('\n')}

// Gerado em: ${formatDateTime(new Date().toISOString())}
// Sistema StockTrack`;

//     // Tentar usar API de compartilhamento do navegador
//     if (navigator.share) {
//         navigator.share({
//             title: `Relatório de Retiradas - ${AppState.settings.companyName}`,
//             text: reportText,
//             url: window.location.href
//         }).then(() => {
//             showAlert('Relatório compartilhado com sucesso!', 'success');
//         }).catch(error => {
//             console.log('Compartilhamento cancelado:', error);
//             // Fallback para download
//             downloadTextFile(reportText);
//         });
//     } else {
//         // Fallback para download de arquivo de texto
//         downloadTextFile(reportText);
//     }
// }

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