import PDFDocument from 'pdfkit';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import * as repository from './repository.js';
import * as driveLib from '../../utils/googleDriveService.js';
import logger from '../../config/logger.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ASSETS    = join(__dirname, '../../assets');

const FONT_KAUSHAN      = join(ASSETS, 'KaushanScript-Regular.ttf');
const FONT_CORMORANT    = join(ASSETS, 'CormorantGaramond-Regular.woff');
const FONT_CORMORANT_SB = join(ASSETS, 'CormorantGaramond-SemiBold.woff');

const BG         = '#FAF7EE';
const NAVY       = '#13224A';
const GOLD_TITLE = '#A08A5F';
const GOLD_NAME  = '#C0812E';
const SEPARATOR  = '#D8CDB2';
const BODY_GRAY  = '#5A5238';
const SIG_GRAY   = '#7C6F52';

function fmtDate(raw) {
  if (!raw) return null;
  const d = new Date(raw);
  if (isNaN(d.getTime())) return null;
  const dd   = String(d.getUTCDate()).padStart(2, '0');
  const mm   = String(d.getUTCMonth() + 1).padStart(2, '0');
  const yyyy = d.getUTCFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function buildPdfBuffer(data) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', layout: 'portrait', margin: 0 });
      const chunks = [];
      doc.on('data',  (c) => chunks.push(c));
      doc.on('end',   () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc.registerFont('Kaushan',      FONT_KAUSHAN);
      doc.registerFont('Cormorant',    FONT_CORMORANT);
      doc.registerFont('CormorantSB',  FONT_CORMORANT_SB);

      const W  = doc.page.width;
      const H  = doc.page.height;
      const MX = 54;
      const CW = W - MX * 2;

      // ── Fondo ──────────────────────────────────────────────────────
      doc.rect(0, 0, W, H).fill(BG);

      // ── Borde doble ────────────────────────────────────────────────
      doc.rect(14, 14, W - 28, H - 28).lineWidth(1.5).stroke(NAVY);
      doc.rect(22, 22, W - 44, H - 44).lineWidth(0.7).stroke(SEPARATOR);

      let y = 50;

      // ── Logo ───────────────────────────────────────────────────────
      const logoPath = join(ASSETS, 'logo.png');
      if (existsSync(logoPath)) {
        const logoW = 168;
        doc.image(logoPath, (W - logoW) / 2, y, { width: logoW });
        y += 108;
      } else {
        doc.font('Kaushan').fontSize(18).fillColor(NAVY)
          .text('Aula Pan de Vida', MX, y, { width: CW, align: 'center' });
        y += 38;
      }

      // ── CERTIFICADO DE FINALIZACIÓN ────────────────────────────────
      doc.font('Helvetica').fontSize(13).fillColor(GOLD_TITLE)
        .text('CERTIFICADO  DE  FINALIZACIÓN', MX, y, {
          width: CW, align: 'center', characterSpacing: 3,
        });
      y += 30;

      y += 10;

      // ── Se certifica que ───────────────────────────────────────────
      doc.font('Cormorant').fontSize(14).fillColor(BODY_GRAY)
        .text('Se certifica que', MX, y, { width: CW, align: 'center' });
      y += 28;

      // ── Nombre del alumno ──────────────────────────────────────────
      doc.font('Kaushan').fontSize(38).fillColor(GOLD_NAME);
      const studentNameH = doc.heightOfString(data.student_name, { width: CW, lineGap: 2 });
      doc.text(data.student_name, MX, y, { width: CW, align: 'center', lineGap: 2 });
      y += studentNameH + 12;

      y += 20;

      // ── completó ───────────────────────────────────────────────────
      doc.font('Cormorant').fontSize(14).fillColor(BODY_GRAY)
        .text('completó satisfactoriamente el curso', MX, y, { width: CW, align: 'center' });
      y += 30;

      // ── Nombre del curso ───────────────────────────────────────────
      doc.font('Kaushan').fontSize(28).fillColor(NAVY);
      const courseNameH = doc.heightOfString(data.course_name, { width: CW, lineGap: 2 });
      doc.text(data.course_name, MX, y, { width: CW, align: 'center', lineGap: 2 });
      y += courseNameH + 22;

      // ── Período ────────────────────────────────────────────────────
      const periodoLabel = data.period ?? '';
      const yearLabel    = String(data.year ?? '');

      // Renderizar "impartido ... durante el {Período} de {año}" con cambio inline de fuente
      drawCenteredMixedLine(doc, MX, y, CW, BODY_GRAY, 13, [
        { text: 'impartido en Aula Pan de Vida, durante el ', font: 'Cormorant' },
        { text: periodoLabel,                                 font: 'CormorantSB' },
        { text: ' de ',                                       font: 'Cormorant' },
        { text: yearLabel,                                    font: 'CormorantSB' },
      ]);
      y += 22;

      const fechaInicio = fmtDate(data.start_date);
      const fechaFin    = fmtDate(data.end_date);
      if (fechaInicio || fechaFin) {
        doc.font('Cormorant').fontSize(11).fillColor(BODY_GRAY)
          .text(`(del ${fechaInicio ?? '—'} al ${fechaFin ?? '—'})`, MX, y, {
            width: CW, align: 'center',
          });
        y += 20;
      }
      y += 18;

      // ── Estadísticas (condicional) ─────────────────────────────────
      const hasGrade      = data.final_grade != null && !isNaN(parseFloat(data.final_grade));
      const presentCount  = parseInt(data.present_count ?? 0, 10);
      const absentCount   = parseInt(data.absent_count  ?? 0, 10);
      const totalSessions = presentCount + absentCount;
      const hasAttendance = totalSessions > 0;

      if (hasGrade || hasAttendance) {
        const colW = CW / 2;
        const col1 = MX;
        const col2 = MX + colW;
        const divX = MX + colW;

        doc.moveTo(MX + 30, y).lineTo(W - MX - 30, y).lineWidth(0.5).stroke(SEPARATOR);
        y += 18;

        if (hasGrade) {
          doc.font('Helvetica').fontSize(8.5).fillColor(GOLD_TITLE)
            .text('CALIFICACIÓN FINAL', col1, y, { width: colW, align: 'center', characterSpacing: 1 });
        }
        if (hasAttendance) {
          doc.font('Helvetica').fontSize(8.5).fillColor(GOLD_TITLE)
            .text('ASISTENCIA', col2, y, { width: colW, align: 'center', characterSpacing: 1 });
        }

        const valY = y + 16;
        doc.moveTo(divX, y - 4).lineTo(divX, valY + 36).lineWidth(0.5).stroke(SEPARATOR);

        if (hasGrade) {
          doc.font('CormorantSB').fontSize(30).fillColor(NAVY)
            .text(parseFloat(data.final_grade).toFixed(1), col1, valY, { width: colW, align: 'center' });
        }
        if (hasAttendance) {
          const pct = Math.round((presentCount / totalSessions) * 100);
          doc.font('CormorantSB').fontSize(30).fillColor(NAVY)
            .text(`${pct}%`, col2, valY, { width: colW, align: 'center' });
        }
        y = valY + 46;
      }

      // ── Firma (anclada desde el fondo) ─────────────────────────────
      const sigY = H - 110;
      doc.font('Kaushan').fontSize(24).fillColor(NAVY)
        .text(data.teacher_name, MX, sigY, { width: CW, align: 'center' });

      const lineY = sigY + 36;
      doc.moveTo(W / 2 - 85, lineY).lineTo(W / 2 + 85, lineY).lineWidth(0.8).stroke(NAVY);

      doc.font('Helvetica').fontSize(9).fillColor(SIG_GRAY)
        .text('PROFESOR(A) DEL CURSO', MX, lineY + 10, {
          width: CW, align: 'center', characterSpacing: 1.5,
        });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

// Dibuja una línea con cambios de fuente inline, centrada manualmente
function drawCenteredMixedLine(doc, mx, y, cw, color, size, parts) {
  let totalW = 0;
  for (const p of parts) {
    doc.font(p.font).fontSize(size);
    totalW += doc.widthOfString(p.text);
  }

  const startX = mx + (cw - totalW) / 2;
  let curX = startX;

  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];
    const isLast = i === parts.length - 1;
    doc.font(p.font).fontSize(size).fillColor(color);
    if (i === 0) {
      // Primera parte: posicionar explícitamente
      doc.text(p.text, curX, y, { continued: !isLast, lineBreak: isLast });
    } else {
      // Partes siguientes: continuar desde donde dejó PDFKit
      doc.text(p.text, { continued: !isLast, lineBreak: isLast });
    }
    curX += doc.widthOfString(p.text);
  }
}

// ── Exports ───────────────────────────────────────────────────────────────
export async function generateDiploma(courseId, enrollmentId) {
  const [data, attendance] = await Promise.all([
    repository.findDiplomaData(courseId, enrollmentId),
    repository.findAttendanceCounts(enrollmentId),
  ]);

  if (!data) {
    const err = new Error('Matrícula no encontrada para este curso');
    err.status = 404;
    throw err;
  }
  if (data.course_status === 'active') {
    const err = new Error('Solo se pueden generar diplomas para cursos finalizados');
    err.status = 400;
    throw err;
  }

  const fullData = { ...data, ...attendance };
  const pdfBuffer = await buildPdfBuffer(fullData);

  const safe = (s) => (s ?? '').replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '');
  const fileName = `diploma_${safe(data.student_name)}_${safe(data.course_name)}_${data.year}.pdf`;

  let driveFileId = null;
  let driveUrl    = null;
  try {
    const uploaded = await driveLib.uploadFile(
      process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID,
      pdfBuffer,
      fileName,
      'application/pdf',
    );
    driveFileId = uploaded.id;
    driveUrl    = uploaded.webViewLink;
  } catch (driveErr) {
    logger.warn({ driveErr }, 'generateDiploma — Drive no disponible, devolviendo PDF directo');
  }

  await repository.upsert(enrollmentId, { driveFileId, driveUrl });

  return { url: driveUrl, buffer: driveUrl ? null : pdfBuffer, fileName };
}

export async function getDiploma(courseId, enrollmentId) {
  const diploma = await repository.findByCourseAndEnrollment(courseId, enrollmentId);
  if (!diploma) {
    const err = new Error('Diploma no generado aún');
    err.status = 404;
    throw err;
  }
  return diploma;
}
