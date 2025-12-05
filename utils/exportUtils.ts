import { Inspection } from '../types';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Extend jsPDF type for autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
};

const formatCpfCnpj = (value: string) => {
  const cleaned = (value || '').replace(/\D/g, '');
  const length = cleaned.length;

  if (length <= 11) {
    return cleaned
      .replace(/^(\d{3})(\d)/, '$1.$2')
      .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1-$2')
      .slice(0, 14);
  }

  return cleaned
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
    .slice(0, 18);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('pt-BR');
};

/**
 * Exporta inspeções para Excel
 */
export const exportToExcel = (inspections: Inspection[], filename: string = 'vistorias.xlsx') => {
  try {
    // Preparar dados para Excel
    const data = inspections.map(inspection => ({
      'Data': formatDate(inspection.date),
      'Placa': inspection.licensePlate,
      'Modelo': inspection.vehicleModel,
      'Cliente': inspection.client.name,
      'CPF/CNPJ': formatCpfCnpj(inspection.client.cpf),
      'Endereço': inspection.client.address,
      'CEP': inspection.client.cep,
      'Contato': inspection.contact || '-',
      'Serviços': inspection.selectedServices.join('; '),
      'Indicação': inspection.indicationName || '-',
      'Inspetor': inspection.inspector || '-',
      'Valor': formatCurrency(inspection.totalValue),
      'Pagamento': inspection.paymentStatus || '-',
      'Status': inspection.status,
      'Observações': inspection.observations || '-'
    }));

    // Criar workbook
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Vistorias');

    // Ajustar largura das colunas
    const colWidths = [
      { wch: 12 }, // Data
      { wch: 12 }, // Placa
      { wch: 18 }, // Modelo
      { wch: 20 }, // Cliente
      { wch: 18 }, // CPF/CNPJ
      { wch: 25 }, // Endereço
      { wch: 12 }, // CEP
      { wch: 15 }, // Contato
      { wch: 30 }, // Serviços
      { wch: 20 }, // Indicação
      { wch: 15 }, // Inspetor
      { wch: 15 }, // Valor
      { wch: 18 }, // Pagamento
      { wch: 12 }, // Status
      { wch: 30 }, // Observações
    ];
    worksheet['!cols'] = colWidths;

    // Fazer download
    XLSX.writeFile(workbook, filename);
  } catch (error) {
    console.error('Erro ao exportar para Excel:', error);
    throw new Error('Falha ao exportar para Excel');
  }
};

/**
 * Exporta inspeções para PDF (tabela completa com resumo financeiro)
 */
export const exportToPDF = async (
  inspections: Inspection[],
  filename: string = 'vistorias.pdf'
) => {
  try {
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 10;
    let yPosition = margin;

    // Título
    pdf.setFontSize(18);
    pdf.setTextColor(41, 128, 185);
    pdf.text('RELATÓRIO DE VISTORIAS', margin, yPosition);
    yPosition += 8;

    // Data de geração
    pdf.setFontSize(9);
    pdf.setTextColor(100, 100, 100);
    pdf.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, margin, yPosition);
    pdf.text(`Total de Fichas: ${inspections.length}`, pageWidth - margin - 50, yPosition);
    yPosition += 10;

    // Resumo Financeiro
    const totalValue = inspections.reduce((acc, i) => acc + (i.totalValue || 0), 0);
    const totalPago = inspections.filter(i => i.paymentStatus && i.paymentStatus.startsWith('Pago')).reduce((acc, i) => acc + (i.totalValue || 0), 0);
    const totalAPagar = inspections.filter(i => i.paymentStatus === 'A pagar').reduce((acc, i) => acc + (i.totalValue || 0), 0);

    pdf.setFontSize(10);
    pdf.setTextColor(0, 0, 0);
    
    // Box com resumo
    pdf.setFillColor(240, 240, 240);
    pdf.rect(margin, yPosition, pageWidth - 2 * margin, 16, 'F');
    
    pdf.setFontSize(9);
    pdf.setTextColor(40, 40, 40);
    const resumoX = margin + 5;
    pdf.text(`RESUMO FINANCEIRO`, resumoX, yPosition + 4);
    
    pdf.setFontSize(8);
    pdf.text(`Total: ${formatCurrency(totalValue)}`, resumoX, yPosition + 9);
    pdf.setTextColor(0, 128, 0);
    pdf.text(`Pago: ${formatCurrency(totalPago)}`, resumoX + 60, yPosition + 9);
    pdf.setTextColor(255, 102, 0);
    pdf.text(`A Pagar: ${formatCurrency(totalAPagar)}`, resumoX + 110, yPosition + 9);
    
    yPosition += 20;

    // Tabela detalhada
    const tableData = inspections.map(inspection => [
      formatDate(inspection.date),
      inspection.licensePlate,
      inspection.vehicleModel.substring(0, 12),
      inspection.client.name.substring(0, 12),
      inspection.inspector || '-',
      inspection.paymentStatus || '-',
      inspection.status,
      formatCurrency(inspection.totalValue)
    ]);

    const headers = ['Data', 'Placa', 'Modelo', 'Cliente', 'Inspetor', 'Pagamento', 'Status', 'Valor'];

    // Usar autoTable
    (pdf as any).autoTable({
      head: [headers],
      body: tableData,
      startY: yPosition,
      margin: margin,
      theme: 'grid',
      styles: {
        font: 'helvetica',
        fontSize: 8,
        halign: 'center',
        valign: 'middle',
        cellPadding: 2
      },
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 8
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      columnStyles: {
        0: { halign: 'center' },
        1: { halign: 'center', fontStyle: 'bold' },
        7: { halign: 'right', fontStyle: 'bold' }
      },
      bodyStyles: {
        fontSize: 7
      }
    });

    pdf.save(filename);
  } catch (error) {
    console.error('Erro ao exportar para PDF:', error);
    throw new Error('Falha ao exportar para PDF');
  }
};


/**
 * Exporta relatório detalhado de uma inspeção para PDF
 */
export const exportInspectionDetailToPDF = async (
  inspection: Inspection,
  filename: string = `vistoria-${inspection.licensePlate}.pdf`
) => {
  try {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 15;
    let yPosition = margin;

    // Cabeçalho
    pdf.setFontSize(14);
    pdf.text('RELATÓRIO DE VISTORIA', margin, yPosition);
    yPosition += 8;

    pdf.setFontSize(10);
    pdf.text(`Data: ${formatDate(inspection.date)}`, margin, yPosition);
    yPosition += 6;
    pdf.text(`Placa: ${inspection.licensePlate} | Modelo: ${inspection.vehicleModel}`, margin, yPosition);
    yPosition += 8;

    // Informações do Cliente
    pdf.setFontSize(11);
    pdf.text('INFORMAÇÕES DO CLIENTE', margin, yPosition);
    yPosition += 6;

    pdf.setFontSize(10);
    pdf.text(`Nome: ${inspection.client.name}`, margin, yPosition);
    yPosition += 5;
    pdf.text(`CPF/CNPJ: ${formatCpfCnpj(inspection.client.cpf)}`, margin, yPosition);
    yPosition += 5;
    pdf.text(`Endereço: ${inspection.client.address}, ${inspection.client.number}${inspection.client.complement ? ', ' + inspection.client.complement : ''}`, margin, yPosition);
    yPosition += 5;
    pdf.text(`CEP: ${inspection.client.cep}`, margin, yPosition);
    yPosition += 8;

    // Serviços
    pdf.setFontSize(11);
    pdf.text('SERVIÇOS', margin, yPosition);
    yPosition += 6;

    pdf.setFontSize(10);
    inspection.selectedServices.forEach(service => {
      pdf.text(`• ${service}`, margin + 5, yPosition);
      yPosition += 5;
    });
    yPosition += 2;

    // Dados Financeiros
    pdf.setFontSize(11);
    pdf.text('DADOS FINANCEIROS', margin, yPosition);
    yPosition += 6;

    pdf.setFontSize(10);
    pdf.text(`Valor Total: ${formatCurrency(inspection.totalValue)}`, margin, yPosition);
    yPosition += 5;
    pdf.text(`Pagamento: ${inspection.paymentStatus || '-'}`, margin, yPosition);
    yPosition += 5;
    pdf.text(`Status da Ficha: ${inspection.status}`, margin, yPosition);
    yPosition += 5;
    if (inspection.nfe) {
      pdf.text(`NFe: ${inspection.nfe}`, margin, yPosition);
      yPosition += 5;
    }
    yPosition += 3;

    // Informações Adicionais
    if (inspection.inspector || inspection.indicationName || inspection.observations) {
      pdf.setFontSize(11);
      pdf.text('INFORMAÇÕES ADICIONAIS', margin, yPosition);
      yPosition += 6;

      pdf.setFontSize(10);
      if (inspection.inspector) {
        pdf.text(`Inspetor: ${inspection.inspector}`, margin, yPosition);
        yPosition += 5;
      }
      if (inspection.indicationName) {
        pdf.text(`Indicação: ${inspection.indicationName}`, margin, yPosition);
        yPosition += 5;
      }
      if (inspection.observations) {
        pdf.text('Observações:', margin, yPosition);
        yPosition += 4;
        const lines = pdf.splitTextToSize(inspection.observations, pageWidth - 2 * margin);
        lines.forEach(line => {
          pdf.text(line, margin + 5, yPosition);
          yPosition += 4;
        });
      }
    }

    pdf.save(filename);
  } catch (error) {
    console.error('Erro ao exportar detalhes para PDF:', error);
    throw new Error('Falha ao exportar detalhes para PDF');
  }
};
