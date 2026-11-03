import { NextResponse } from "next/server";
import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";

export const dynamic = "force-dynamic";

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB
const MAX_VIDEO_BYTES = 50 * 1024 * 1024; // 50 MB

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ ok: false, error: "No file provided" }, { status: 400 });
    }

    const mime = file.type;
    const isImage = ALLOWED_IMAGE_TYPES.includes(mime);
    const isVideo = ALLOWED_VIDEO_TYPES.includes(mime);

    if (!isImage && !isVideo) {
      return NextResponse.json(
        {
          ok: false,
          error: "Unsupported file format. Images must be JPEG/PNG/WebP, videos must be MP4/WebM/MOV.",
        },
        { status: 400 },
      );
    }

    if (isImage && file.size > MAX_IMAGE_BYTES) {
      return NextResponse.json(
        { ok: false, error: "Image exceeds 5MB limit." },
        { status: 400 },
      );
    }

    if (isVideo && file.size > MAX_VIDEO_BYTES) {
      return NextResponse.json(
        { ok: false, error: "Video exceeds 50MB limit." },
        { status: 400 },
      );
    }

    // Generate safe unique filename
    const ext = file.name.split(".").pop()?.toLowerCase() || (isImage ? "jpg" : "mp4");
    const sanitizedExt = ext.replace(/[^a-z0-9]/g, "").slice(0, 4);
    const fileName = `${randomUUID()}.${sanitizedExt}`;

    // Target directory: public/uploads/testimonials
    const uploadDir = join(process.cwd(), "public", "uploads", "testimonials");
    await mkdir(uploadDir, { recursive: true });

    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(join(uploadDir, fileName), buffer);

    const publicUrl = `/uploads/testimonials/${fileName}`;

    return NextResponse.json({
      ok: true,
      url: publicUrl,
      type: isVideo ? "video" : "image",
    });
  } catch (err) {
    console.error("Testimonial upload error:", err);
    return NextResponse.json(
      { ok: false, error: "Upload processing failed." },
      { status: 500 },
    );
  }
}

