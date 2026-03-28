import axios from "axios";
import { randomUUID } from "crypto";
import path from "path";

const SIRV_API_BASE = "https://api.sirv.com/v2";

class SirvService {
  private token: string | null = null;
  private tokenExpiresAt: number = 0;

  private async getToken(): Promise<string> {
    if (this.token && Date.now() < this.tokenExpiresAt) {
      return this.token;
    }

    const response = await axios.post(`${SIRV_API_BASE}/token`, {
      clientId: process.env.SIRV_CLIENT_ID,
      clientSecret: process.env.SIRV_CLIENT_SECRET,
    });

    this.token = response.data.token;
    this.tokenExpiresAt = Date.now() + (response.data.expiresIn - 60) * 1000;
    return this.token!;
  }

  async uploadFile(
    fileBuffer: Buffer,
    originalFilename: string,
    contentType: string
  ): Promise<string> {
    const ext = path.extname(originalFilename) || this.getExtFromContentType(contentType);
    const sirvPath = `/uploads/${randomUUID()}${ext}`;

    let token = await this.getToken();

    try {
      await axios.post(
        `${SIRV_API_BASE}/files/upload`,
        fileBuffer,
        {
          params: { filename: sirvPath },
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": contentType || "application/octet-stream",
          },
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
        }
      );
    } catch (error: any) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        this.token = null;
        this.tokenExpiresAt = 0;
        token = await this.getToken();

        await axios.post(
          `${SIRV_API_BASE}/files/upload`,
          fileBuffer,
          {
            params: { filename: sirvPath },
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": contentType || "application/octet-stream",
            },
            maxContentLength: Infinity,
            maxBodyLength: Infinity,
          }
        );
      } else {
        throw error;
      }
    }

    let cdnUrl = (process.env.SIRV_CDN_URL || "").trim().replace(/\/$/, "");
    if (cdnUrl && !cdnUrl.startsWith("http")) {
      cdnUrl = `https://${cdnUrl}`;
    }
    return `${cdnUrl}${sirvPath}`;
  }

  async deleteFile(sirvPath: string): Promise<void> {
    const token = await this.getToken();
    try {
      await axios.post(
        `${SIRV_API_BASE}/files/delete`,
        null,
        {
          params: { filename: sirvPath },
          headers: { Authorization: `Bearer ${token}` },
        }
      );
    } catch (error: any) {
      console.error("Failed to delete file from Sirv:", error.message);
    }
  }

  private getExtFromContentType(contentType: string): string {
    const map: Record<string, string> = {
      "image/jpeg": ".jpg",
      "image/png": ".png",
      "image/gif": ".gif",
      "image/webp": ".webp",
      "image/svg+xml": ".svg",
      "image/avif": ".avif",
      "audio/mpeg": ".mp3",
      "audio/wav": ".wav",
      "audio/ogg": ".ogg",
      "video/mp4": ".mp4",
      "video/webm": ".webm",
      "application/pdf": ".pdf",
    };
    return map[contentType] || "";
  }
}

export const sirvService = new SirvService();
