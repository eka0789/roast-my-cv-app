import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const name = file.name.toLowerCase();

    let text = "";

    if (file.type === "application/pdf" || name.endsWith(".pdf")) {
      const { PDFParse } = await import("pdf-parse");
      const parser = new PDFParse({ data: new Uint8Array(buffer) });
      const result = await parser.getText();
      text = result.text;
    } else if (
      file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      name.endsWith(".docx")
    ) {
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
    } else if (file.type === "application/msword" || name.endsWith(".doc")) {
      return NextResponse.json(
        { error: "Legacy .doc format is not supported. Please save the file as .docx and try again." },
        { status: 400 }
      );
    } else {
      return NextResponse.json(
        { error: "Unsupported file type. Please upload a PDF or DOCX file." },
        { status: 400 }
      );
    }

    const trimmed = text.trim();

    if (trimmed.length < 50) {
      return NextResponse.json(
        { error: "Could not extract enough text from the file. Make sure it contains selectable text (not a scanned image)." },
        { status: 400 }
      );
    }

    return NextResponse.json({ text: trimmed.slice(0, 15000) });
  } catch (err) {
    console.error("File parse error:", err);
    return NextResponse.json({ error: "Failed to parse file. Please try again." }, { status: 500 });
  }
}
