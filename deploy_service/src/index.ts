import dequeue from "./aws";

async function runService() {
  while (true) {
    try {
      await dequeue();
      await new Promise((resolve) => setTimeout(resolve, 3000));
    } catch (error) {
      console.error(error);
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }
}

runService();
