// import dotenv from "dotenv";
// dotenv.config();

// import express from "express";
// import { getDeploymentStatus } from "./dynamoDB";

// const app = express();

// console.log(process.env.AWS_ACCESS_KEY_ID);

// app.get("/api/deployment/:projectId/status", async (req, res) => {
//   try {
//     const { projectId } = req.params;
//     console.log(projectId);
//     const status = await getDeploymentStatus(projectId);
//     if (!status) {
//       return res.status(404).json({ error: "Deployment not found" });
//     }
//     res.json({
//       projectId,
//       status: status.status,
//       updatedAt: status.updatedAt,
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: "Internal server error" });
//   }
// });

// app.listen(3000, () => {
//   console.log("Server is running on port 3000");
// });
