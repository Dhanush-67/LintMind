import { app } from "./app.js";

const port = process.env.PORT || 3000;

app.listen(port, (error) => {
  if (error) {
    console.error(`Failed to start server on port ${port}:`, error);
    process.exitCode = 1;
    return;
  }
  console.log(`Server running on port ${port}`);
});
