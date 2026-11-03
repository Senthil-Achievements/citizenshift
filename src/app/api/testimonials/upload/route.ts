import { NextResponse } from "next/server";
import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { getAdminClient, isAdminClientAvailable } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const ALLOWED_IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const ALLOWED_VIDEO_TYPES: Record<string, string> = {
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
};

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB
const MAX_VIDEO_BYTES = 50 * 1024 * 1024; // 50 MB

// Simple sliding window rate limiter: max 10 uploads per IP per 10 minutes
const uploadRateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = uploadRateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    uploadRateLimitMap.set(ip, { count: 1, resetAt: now + 10 * 60 * 1000 });
    return true;
  }
  if (entry.count >= 10) {
    return false;
  }
  entry.count += 1;
  return true;
}

/**
 * Validate magic numbers (file signature) to prevent disguised executable uploads.
 */
function isValidFileSignature(buffer: Buffer, mime: string): boolean {
  if (buffer.length < 12) return false;

  // JPEG: FF D8 FF
  if (mime === "image/jpeg") {
    return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (mime === "image/png") {
    return (
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47 &&
      buffer[4] === 0x0d &&
      buffer[5] === 0x0a &&
      buffer[6] === 0x1a &&
      buffer[7] === 0x0a
    );
  }

  // WebP: RIFF (bytes 0..3) ... WEBP (bytes 8..11)
  if (mime === "image/webp") {
    const isRiff = buffer.subarray(0, 4).toString("ascii") === "RIFF";
    const isWebp = buffer.subarray(8, 12).toString("ascii") === "WEBP";
    return isRiff && isWebp;
  }

  // MP4 / MOV: offset 4 contains 'ftyp' or 'moov'
  if (mime === "video/mp4" || mime === "video/quicktime") {
    const boxType = buffer.subarray(4, 8).toString("ascii");
    return boxType === "ftyp" || boxType === "moov";
  }

  // WebM: Matroska / EBML header (1A 45 DF A3)
  if (mime === "video/webm") {
    return (
      buffer[0] === 0x1a &&
      buffer[1] === 0x45 &&
      buffer[2] === 0xdf &&
      buffer[3] === 0xa3
    );
  }

  return false;
}

export async function POST(req: Request) {
  try {
    // 1. IP Rate Limiting
    const forwarded = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip");
    const clientIp = forwarded ? forwarded.split(",")[0].trim() : "anonymous";
    if (!checkRateLimit(clientIp)) {
      return NextResponse.json(
        { ok: false, error: "Too many upload attempts. Please wait a few minutes." },
        { status: 429 },
      );
    }

    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ ok: false, error: "No file provided" }, { status: 400 });
    }

    const mime = file.type;
    const isImage = Boolean(ALLOWED_IMAGE_TYPES[mime]);
    const isVideo = Boolean(ALLOWED_VIDEO_TYPES[mime]);

    if (!isImage && !isVideo) {
      return NextResponse.json(
        {
          ok: false,
          error: "Unsupported file format. Images must be JPEG, PNG, or WebP; videos must be MP4, WebM, or MOV.",
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

    const arrayBuf = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuf);

    // 2. Validate magic numbers
    if (!isValidFileSignature(buffer, mime)) {
      return NextResponse.json(
        { ok: false, error: "File contents do not match the expected media type." },
        { status: 400 },
      );
    }

    // 3. Unique safe filename
    const safeExt = isImage ? ALLOWED_IMAGE_TYPES[mime] : ALLOWED_VIDEO_TYPES[mime];
    const fileName = `${randomUUID()}.${safeExt}`;

    // 4. Try Supabase Storage first if available and configured
    if (isAdminClientAvailable()) {
      try {
        const supabase = getAdminClient();
        const folder = isVideo ? "videos" : "avatars";
        const storagePath = `${folder}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("testimonials")
          .upload(storagePath, buffer, {
            contentType: mime,
            upsert: false,
          });

        if (!uploadError) {
          const { data: publicUrlData } = supabase.storage
            .from("testimonials")
            .getPublicUrl(storagePath);

          if (publicUrlData?.publicUrl) {
            return NextResponse.json({
              ok: true,
              url: publicUrlData.publicUrl,
              type: isVideo ? "video" : "image",
            });
          }
        }
      } catch (storageErr) {
        console.warn("Supabase storage upload skipped or failed, falling back to local:", storageErr);
      }
    }

    // 5. Fallback: Local persistent storage in public/uploads/testimonials
    const uploadDir = join(process.cwd(), "public", "uploads", "testimonials");
    await mkdir(uploadDir, { recursive: true });
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
