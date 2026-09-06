export interface ResumeTextResult {
  text: string;
  mimeType: string;
  pageCount: number;
  usedOcr: boolean;
  error?: string;
}

type OcrReader = (image: File) => Promise<string | undefined>;

let pdfjsLib: any = null;
let pdfLoadPromise: Promise<any> | null = null;

async function loadPdfJs(): Promise<any> {
  if (pdfjsLib) return pdfjsLib;
  if (pdfLoadPromise) return pdfLoadPromise;

  // @ts-expect-error - pdfjs-dist/build/pdf.mjs is not declared by the package
  pdfLoadPromise = import("pdfjs-dist/build/pdf.mjs").then((lib) => {
    lib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
    pdfjsLib = lib;
    return lib;
  });

  return pdfLoadPromise;
}

function isSupportedImageType(mimeType: string): boolean {
  return ["image/png", "image/jpeg", "image/jpg"].includes(mimeType);
}

async function renderPageToFile(page: any, name: string): Promise<File> {
  const viewport = page.getViewport({ scale: 2 });
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) throw new Error("Could not create a canvas for OCR");

  canvas.width = viewport.width;
  canvas.height = viewport.height;
  await page.render({ canvasContext: context, viewport }).promise;

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/png");
  });

  if (!blob) throw new Error("Could not create an image for OCR");
  return new File([blob], `${name}.png`, { type: "image/png" });
}

async function extractPdfText(
  file: File,
  ocrReader: OcrReader
): Promise<ResumeTextResult> {
  const lib = await loadPdfJs();
  const pdf = await lib.getDocument({ data: await file.arrayBuffer() }).promise;
  const pageTexts: string[] = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item: { str?: string }) => item.str ?? "")
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
    pageTexts.push(`Page ${pageNumber}\n${pageText}`.trim());
  }

  const text = pageTexts.join("\n\n").trim();
  if (text.replace(/Page \d+/g, "").trim().length >= 100) {
    return { text, mimeType: file.type, pageCount: pdf.numPages, usedOcr: false };
  }

  const ocrPages: string[] = [];
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const image = await renderPageToFile(page, `${file.name}-page-${pageNumber}`);
    const ocrText = await ocrReader(image);
    if (ocrText?.trim()) ocrPages.push(`Page ${pageNumber}\n${ocrText.trim()}`);
  }

  const ocrResult = ocrPages.join("\n\n").trim();
  return {
    text: ocrResult || text,
    mimeType: file.type,
    pageCount: pdf.numPages,
    usedOcr: true,
    error: ocrResult ? undefined : "No readable text could be extracted from this PDF",
  };
}

export async function extractResumeText(
  file: File,
  ocrReader: OcrReader
): Promise<ResumeTextResult> {
  const mimeType = file.type.toLowerCase();

  if (mimeType === "application/pdf") {
    return extractPdfText(file, ocrReader);
  }

  if (isSupportedImageType(mimeType)) {
    const text = (await ocrReader(file))?.trim() ?? "";
    return {
      text,
      mimeType,
      pageCount: 1,
      usedOcr: true,
      error: text ? undefined : "No readable text could be extracted from this image",
    };
  }

  return {
    text: "",
    mimeType,
    pageCount: 0,
    usedOcr: false,
    error: `Unsupported resume MIME type: ${mimeType || "unknown"}`,
  };
}
