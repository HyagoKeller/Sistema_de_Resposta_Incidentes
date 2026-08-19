/**
 * Geração de documentos .docx (Relatório Preliminar / Relatório Final / Formulário ANPD)
 * a partir dos dados do incidente. Executa no navegador.
 */

import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";
import type { Incident } from "./sri-store";
import { ANPD_SECTIONS, PHASES } from "./sri-schema";

const AZUL = "1351B4";
const PROFUNDO = "071D41";
const FONTE = "Arial";

const LARGURA = 9026; // A4 com margens de 1"
const COL_ROTULO = 3200;
const COL_VALOR = LARGURA - COL_ROTULO;

const borda = { style: BorderStyle.SINGLE, size: 1, color: "C4CBD8" };
const bordas = { top: borda, bottom: borda, left: borda, right: borda };

function texto(v: unknown): string {
  if (v === undefined || v === null || v === "") return "Não informado";
  if (typeof v === "boolean") return v ? "Sim" : "Não";
  if (Array.isArray(v)) {
    return v
      .map((item, idx) =>
        typeof item === "object" && item
          ? `${idx + 1}) ` +
            Object.entries(item as Record<string, unknown>)
              .filter(([, val]) => val !== "" && val !== undefined)
              .map(([k, val]) => `${k}: ${String(val)}`)
              .join("; ")
          : `${idx + 1}) ${String(item)}`,
      )
      .join("\u000b");
  }
  return String(v);
}

function paragrafos(v: string): Paragraph[] {
  return v.split(/\u000b|\n/).map(
    (linha) =>
      new Paragraph({
        spacing: { after: 40 },
        children: [new TextRun({ text: linha, font: FONTE, size: 20 })],
      }),
  );
}

function linha(rotulo: string, valor: unknown): TableRow {
  return new TableRow({
    children: [
      new TableCell({
        borders: bordas,
        width: { size: COL_ROTULO, type: WidthType.DXA },
        shading: { fill: "EEF3FA", type: ShadingType.CLEAR, color: "auto" },
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
        children: [new Paragraph({ children: [new TextRun({ text: rotulo, bold: true, font: FONTE, size: 20, color: PROFUNDO })] })],
      }),
      new TableCell({
        borders: bordas,
        width: { size: COL_VALOR, type: WidthType.DXA },
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
        children: paragrafos(texto(valor)),
      }),
    ],
  });
}

function tabela(rows: TableRow[]): Table {
  return new Table({ width: { size: LARGURA, type: WidthType.DXA }, columnWidths: [COL_ROTULO, COL_VALOR], rows });
}

function titulo(t: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 280, after: 140 },
    children: [new TextRun({ text: t, bold: true, font: FONTE, size: 24, color: AZUL })],
  });
}

function cabecalho(doc: string, inc: Incident): Paragraph[] {
  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: "ADVOCACIA-GERAL DA UNIÃO", bold: true, font: FONTE, size: 24, color: PROFUNDO })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 },
      children: [new TextRun({ text: "Departamento de Segurança da Informação - Sistema de Resposta a Incidentes (SRI)", font: FONTE, size: 18, color: "5A6B82" })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 240 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: AZUL, space: 6 } },
      children: [new TextRun({ text: doc.toUpperCase(), bold: true, font: FONTE, size: 28, color: PROFUNDO })],
    }),
    new Paragraph({
      spacing: { after: 200 },
      children: [
        new TextRun({ text: `${inc.codigo} · `, bold: true, font: FONTE, size: 20 }),
        new TextRun({
          text: `${inc.tipo === "privacidade" ? "Incidente de privacidade (LGPD)" : "Incidente de segurança da informação"} · emitido em ${new Date().toLocaleString("pt-BR")}`,
          font: FONTE,
          size: 20,
        }),
      ],
    }),
  ];
}

export type TipoDocumento = "Relatório Preliminar" | "Relatório Final" | "Formulário ANPD";

function construir(tipo: TipoDocumento, inc: Incident): Document {
  const filhos: (Paragraph | Table)[] = [...cabecalho(tipo, inc)];

  if (tipo === "Formulário ANPD") {
    const anpd = inc.anpd ?? {};
    for (const secao of ANPD_SECTIONS) {
      filhos.push(titulo(secao.titulo));
      filhos.push(tabela(secao.fields.map((f) => linha(f.label, anpd[f.id]))));
    }
  } else {
    const fasesIncluidas = tipo === "Relatório Preliminar" ? PHASES.slice(0, 2) : PHASES;
    for (const fase of fasesIncluidas) {
      filhos.push(titulo(`Fase ${fase.numero} - ${fase.titulo}`));
      const visiveis = fase.fields.filter((f) => !f.showWhen || f.showWhen(inc.data));
      filhos.push(tabela(visiveis.map((f) => linha(f.label, inc.data[f.id]))));
    }
  }

  filhos.push(titulo("Trilha de auditoria (últimos registros)"));
  filhos.push(
    tabela(
      inc.auditoria
        .slice(0, 15)
        .map((a) => linha(new Date(a.ts).toLocaleString("pt-BR"), `${a.acao} - ${a.entidade}${a.detalhe ? ` (${a.detalhe})` : ""} · ${a.ator}`)),
    ),
  );

  filhos.push(
    new Paragraph({
      spacing: { before: 320 },
      children: [
        new TextRun({
          text: "Documento gerado automaticamente pelo SRI/AGU. Versão registrada em trilha imutável (WORM) com hash SHA-256.",
          italics: true,
          font: FONTE,
          size: 16,
          color: "5A6B82",
        }),
      ],
    }),
  );

  return new Document({
    styles: { default: { document: { run: { font: FONTE, size: 20 } } } },
    sections: [
      {
        properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } },
        children: filhos,
      },
    ],
  });
}

export async function baixarDocx(tipo: TipoDocumento, inc: Incident): Promise<void> {
  const blob = await Packer.toBlob(construir(tipo, inc));
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${inc.codigo}-${tipo.replace(/\s+/g, "-").toLowerCase()}.docx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
