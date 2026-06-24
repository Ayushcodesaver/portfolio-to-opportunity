import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import QRCode from "qrcode";
import { supabase } from "@/integrations/supabase/client";

export type CertificateInput = {
  internId: string;
  programId?: string | null;
  holderName: string;
  programTitle: string;
  planTier: "basic" | "pro" | "premium";
};

export type CertificateRecord = {
  id: string;
  certificate_code: string;
  intern_id: string;
  program_id: string | null;
  plan_tier: string;
  verified: boolean;
  holder_name: string;
  program_title: string;
  issued_at: string;
};

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I
function genCode() {
  let out = "XBR-";
  for (let i = 0; i < 6; i++) out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  return out;
}

/** Get an existing certificate for (intern, program) or issue a new one. */
export async function getOrIssueCertificate(input: CertificateInput): Promise<CertificateRecord> {
  // Find existing
  let query = supabase
    .from("certificates")
    .select("*")
    .eq("intern_id", input.internId);
  if (input.programId) query = query.eq("program_id", input.programId);
  else query = query.is("program_id", null);
  const { data: existing } = await query.maybeSingle();
  if (existing) return existing as any;

  // Issue new — retry on rare code collision
  for (let i = 0; i < 5; i++) {
    const code = genCode();
    const { data, error } = await supabase
      .from("certificates")
      .insert({
        intern_id: input.internId,
        program_id: input.programId ?? null,
        certificate_code: code,
        plan_tier: input.planTier,
        verified: input.planTier === "premium",
        holder_name: input.holderName,
        program_title: input.programTitle,
      })
      .select("*")
      .single();
    if (!error && data) return data as any;
    if (error && !`${error.message}`.toLowerCase().includes("duplicate")) throw error;
  }
  throw new Error("Failed to issue certificate after several attempts");
}

/** Build a branded PDF and trigger a browser download. */
export async function downloadCertificatePdf(cert: CertificateRecord) {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([842, 595]); // A4 landscape pts
  const { width, height } = page.getSize();

  const helv = await pdf.embedFont(StandardFonts.HelveticaBold);
  const helvR = await pdf.embedFont(StandardFonts.Helvetica);
  const italic = await pdf.embedFont(StandardFonts.HelveticaOblique);

  // Background — deep navy
  page.drawRectangle({ x: 0, y: 0, width, height, color: rgb(0.06, 0.09, 0.16) });
  // Inner border
  page.drawRectangle({
    x: 28, y: 28, width: width - 56, height: height - 56,
    borderColor: rgb(0.8, 0.72, 1), borderWidth: 1.5,
  });
  page.drawRectangle({
    x: 36, y: 36, width: width - 72, height: height - 72,
    borderColor: rgb(0.17, 0.21, 0.36), borderWidth: 0.6,
  });

  // Brand
  page.drawText("XEBURE", {
    x: width / 2 - 70, y: height - 90,
    size: 32, font: helv, color: rgb(0.8, 0.72, 1),
  });
  page.drawText("BUILD · LEARN · GET NOTICED", {
    x: width / 2 - 92, y: height - 110,
    size: 8, font: helv, color: rgb(0.58, 0.64, 0.72),
  });

  // Title
  page.drawText("Certificate of Completion", {
    x: width / 2 - 175, y: height - 170,
    size: 26, font: helv, color: rgb(1, 1, 1),
  });

  page.drawText("This is to certify that", {
    x: width / 2 - 70, y: height - 215,
    size: 11, font: italic, color: rgb(0.72, 0.78, 0.86),
  });

  // Holder name — centered manually
  const nameSize = 30;
  const nameWidth = helv.widthOfTextAtSize(cert.holder_name, nameSize);
  page.drawText(cert.holder_name, {
    x: (width - nameWidth) / 2, y: height - 260,
    size: nameSize, font: helv, color: rgb(1, 1, 1),
  });
  // Underline
  page.drawLine({
    start: { x: (width - nameWidth) / 2 - 10, y: height - 270 },
    end: { x: (width + nameWidth) / 2 + 10, y: height - 270 },
    color: rgb(0.8, 0.72, 1), thickness: 0.7,
  });

  page.drawText("has successfully completed the program", {
    x: width / 2 - 115, y: height - 295,
    size: 11, font: helvR, color: rgb(0.72, 0.78, 0.86),
  });

  const progSize = 18;
  const progWidth = helv.widthOfTextAtSize(cert.program_title, progSize);
  page.drawText(cert.program_title, {
    x: (width - progWidth) / 2, y: height - 330,
    size: progSize, font: helv, color: rgb(0.8, 0.72, 1),
  });

  // Footer details
  const issued = new Date(cert.issued_at).toLocaleDateString(undefined, {
    year: "numeric", month: "long", day: "numeric",
  });
  page.drawText(`Issued ${issued}`, {
    x: 70, y: 90, size: 10, font: helvR, color: rgb(0.72, 0.78, 0.86),
  });
  page.drawText(`Certificate ID: ${cert.certificate_code}`, {
    x: 70, y: 72, size: 10, font: helv, color: rgb(1, 1, 1),
  });
  page.drawText(`Plan: ${cert.plan_tier.toUpperCase()}${cert.verified ? "  ✓ VERIFIED" : ""}`, {
    x: 70, y: 54, size: 9, font: helv,
    color: cert.verified ? rgb(1, 0.82, 0.3) : rgb(0.72, 0.78, 0.86),
  });

  // Verified seal (top-right)
  if (cert.verified) {
    page.drawCircle({
      x: width - 95, y: height - 100, size: 30,
      borderColor: rgb(1, 0.82, 0.3), borderWidth: 1.5,
      color: rgb(0.18, 0.14, 0.04),
    });
    page.drawText("VERIFIED", {
      x: width - 121, y: height - 103, size: 8, font: helv, color: rgb(1, 0.82, 0.3),
    });
  }

  // QR code → verify URL
  const verifyUrl = `${window.location.origin}/verify/${cert.certificate_code}`;
  const qrDataUrl = await QRCode.toDataURL(verifyUrl, { margin: 1, width: 200, color: { dark: "#FFFFFF", light: "#0F172A" } });
  const qrPng = await pdf.embedPng(qrDataUrl);
  const qrSize = 90;
  page.drawImage(qrPng, { x: width - qrSize - 60, y: 50, width: qrSize, height: qrSize });
  page.drawText("Scan to verify", {
    x: width - qrSize - 60, y: 40, size: 7, font: helvR, color: rgb(0.58, 0.64, 0.72),
  });

  // Signature line
  page.drawLine({
    start: { x: 70, y: 150 }, end: { x: 240, y: 150 },
    color: rgb(0.4, 0.45, 0.6), thickness: 0.5,
  });
  page.drawText("Xebure Programs Team", {
    x: 70, y: 135, size: 9, font: helv, color: rgb(1, 1, 1),
  });

  const bytes = await pdf.save();
  const blob = new Blob([bytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `xebure-certificate-${cert.certificate_code}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5_000);
}
