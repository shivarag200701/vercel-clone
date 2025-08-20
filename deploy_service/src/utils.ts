import { spawn } from "child_process";
import path from "path";
import fs from "fs";

export const execSyncCommandWithLogs = async (command: string, targetDir: string, onLog:(log:string)=>void) => {
  return new Promise((resolve,reject)=>{
    const [cmd, ...args] = command.split(" ");
    const child = spawn(cmd,args,{cwd:targetDir,stdio:["inherit","pipe","pipe"]});
     let output = "";

     child.stdout.on("data",(data)=>{
      const log = data.toString()
      output += log;
      onLog(log);
     });

     child.stderr.on("data",(data)=>{
      const log = data.toString();
      output += log;
      onLog(log);
     });

     child.on("close",(code)=>{
      if(code === 0){
        onLog("Command completed successfully");
        resolve({success:true,output});
      }else{
        onLog(`Command failed with code ${code}`);
        reject({success:false,output});
      }
     });

     child.on("error",(error)=>{
      onLog(`Error executing command: ${error.message}`);
      reject({success:false,output:error.message});
     })
  })
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
