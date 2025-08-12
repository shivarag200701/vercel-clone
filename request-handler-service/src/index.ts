import express from "express";
import { getObject } from "./aws";
const app = express();

app.use(express.urlencoded({ extended: true }));

app.get("/{*any}", async (req, res) => {
  const host = req.hostname;
  const id = host.split(".")[0];
  console.log(id);
  const file = req.path;
  console.log("file", file);
  const body = await getObject(id, file);
  if (file.endsWith("html")) {
    res.setHeader("Content-Type", "text/html");
  } else if (file.endsWith("css")) {
    res.setHeader("Content-Type", "text/css");
  } else if (file.endsWith("js")) {
    res.setHeader("Content-Type", "text/javascript");
  } else if (file.endsWith("svg")) {
    res.setHeader("Content-Type", "image/svg+xml");
  } else {
    console.log("not found");
  }

  res.send(body);
  res.end();
});

app.listen(3003, () => {
  console.log("Server is running on port 3003");
});
