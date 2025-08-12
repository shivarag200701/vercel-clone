async function transformToByteArray(stream: any): Promise<Uint8Array> {
  const chunks: Uint8Array[] = [];

  return new Promise((resolve, reject) => {
    stream.on("data", (chunk: Uint8Array) => {
      chunks.push(chunk);
    });

    stream.on("end", () => {
      const result = Buffer.concat(chunks);
      resolve(result);
    });

    stream.on("error", reject);
  });
}

export default transformToByteArray;
