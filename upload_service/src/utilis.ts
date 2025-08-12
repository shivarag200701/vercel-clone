import { v4 as uuidv4 } from "uuid";
import path from "path";
import fs from "fs";

export function generate() {
  const id = uuidv4().replace(/-/g, "").substring(0, 5);
  return id;
}

export function getPath(folderPath: string) {
  let response: string[] = [];
  const allFilesAndFolders = fs.readdirSync(folderPath);
  console.log("folderPath", folderPath);
  console.log("allFilesAndFolders", allFilesAndFolders);

  for (const file of allFilesAndFolders) {
    const filePath = path.join(folderPath, file);
    if (fs.statSync(filePath).isDirectory()) {
      response.push(...getPath(filePath));
    } else {
      response.push(filePath);
    }
  }
  return response;
}
