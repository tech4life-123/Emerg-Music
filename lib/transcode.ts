import "server-only";
import { spawn } from "node:child_process";
import ffmpegPath from "ffmpeg-static";

const BIN = process.env.FFMPEG_PATH || ffmpegPath || "ffmpeg";

// Runs ffmpeg and returns the decoded duration in ms (read from the last "time=" progress line).
export function transcodeToAac(input: string, output: string, bitrate: "64k" | "128k"): Promise<number> {
  return new Promise((resolve, reject) => {
    const p = spawn(/*turbopackIgnore: true*/ BIN, ["-y", "-i", input, "-vn", "-map_metadata", "-1", "-c:a", "aac", "-b:a", bitrate, "-ar", "44100", "-ac", "2", "-movflags", "+faststart", output], { stdio: ["ignore", "ignore", "pipe"] });
    let tail = "";
    p.stderr.on("data", (d: Buffer) => { tail = (tail + d.toString()).slice(-4000); });
    p.on("error", reject);
    p.on("close", (code) => {
      if (code !== 0) return reject(new Error(`ffmpeg exited ${code}`));
      const m = [...tail.matchAll(/time=(\d+):(\d+):(\d+(?:\.\d+)?)/g)].pop();
      resolve(m ? Math.round((Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3])) * 1000) : 0);
    });
  });
}
