import { execSync } from "child_process";
import path from "path";
import fs from "fs";

export const execSyncCommand = (command: string, targetDir: string) => {
  try {
    console.log(`Executing: ${command} in ${targetDir}`);
    execSync(command, { cwd: targetDir, stdio: "inherit" });
    console.log(`Successfully executed: ${command}`);
    return true;
  } catch (error) {
    console.error(`Failed to execute ${command}:`, error);
    return false;
  }
};

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
