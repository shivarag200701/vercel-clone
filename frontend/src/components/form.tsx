import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import { useState } from "react";
import { Input } from "./ui/input";
import axios from "axios";

function Form() {
  const [url, setUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [deployed, setDeployed] = useState(false);
  const [id, setId] = useState("");
  const handleDeploy = async () => {
    setUploading(true);
    const response = await axios.post("http://localhost:3000/upload", {
      repoUrl: url,
    });
    const id = response.data.id;
    setId(id);
    setDeploying(true);
    const interval = setInterval(async () => {
      const response = await axios.get(`http://localhost:3000/status/${id}`);
      const status = response.data.status;
      if (status === "deployed") {
        clearInterval(interval);
        setDeploying(false);
        setDeployed(true);
      }
    }, 2000);
  };
  return (
    <>
      <Card className="w-xl h-auto">
        <CardHeader>
          <CardTitle className="text-3xl font-bold">
            Delpoy your GitHub Repository
          </CardTitle>
          <CardDescription>
            Enter the URL of your GitHub repository to deploy it
          </CardDescription>
          <CardAction></CardAction>
        </CardHeader>
        <CardContent>
          <Input
            type="url"
            placeholder="Enter the URL of your GitHub repository"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
        </CardContent>
        <CardFooter className="flex flex-row items-center justify-center">
          <Button
            className="w-full"
            onClick={handleDeploy}
            disabled={deploying || uploading}
          >
            {deploying
              ? `Deploying (${id})`
              : uploading
              ? "Uploading"
              : "Deploy"}
          </Button>
        </CardFooter>
      </Card>
      {deployed && (
        <div className="mt-10">
          <Card>
            <CardHeader>
              <CardTitle>View your deployed app </CardTitle>
              <CardDescription>
                <p>
                  Your app is deployed to{" "}
                  <a href={`http://${id}.glider.com:3003/index.html`} target="_blank">
                    {`http://${id}.glider.com:3003/index.html`}
                  </a>
                </p>
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      )}
    </>
  );
}

export default Form;
