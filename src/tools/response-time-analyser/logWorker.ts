import { LogTextStream } from "./logParser";
import type { WorkerMessage } from "./types";

const send = (message: WorkerMessage) => self.postMessage(message);
self.onmessage = async (event: MessageEvent<File>) => {
  const file = event.data;
  try {
    const parser = new LogTextStream();
    const decoder = new TextDecoder();
    const chunkSize = 1024 * 1024;
    for (let offset = 0; offset < file.size; offset += chunkSize) {
      const chunk = await file.slice(offset, offset + chunkSize).arrayBuffer();
      parser.push(decoder.decode(chunk, { stream: true }));
      send({
        type: "progress",
        percent: Math.min(
          100,
          Math.round(((offset + chunk.byteLength) / file.size) * 100),
        ),
      });
    }
    parser.push(decoder.decode());
    send({ type: "done", analysis: parser.finish() });
  } catch (error) {
    send({
      type: "error",
      message:
        error instanceof Error
          ? error.message
          : "Could not read this log file.",
    });
  }
};
