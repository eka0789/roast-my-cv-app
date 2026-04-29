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

    if (
      file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      name.endsWith(".docx")
    ) {
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ buffer });
      const text = result.value.trim();

      if (text.length < 50) {
        return NextResponse.json(
          { error: "Could not extract enough text from the file." },
          { status: 400 }
        );
      }

      return NextResponse.json({ text: text.slice(0, 15000) });
    }

    return NextResponse.json(
      { error: "Unsupported file type. Only DOCX is handled server-side." },
      { status: 400 }
    );
  } catch (err) {
    console.error("File parse error:", err);
    return NextResponse.json({ error: "Failed to parse file. Please try again." }, { status: 500 });
  }
}
