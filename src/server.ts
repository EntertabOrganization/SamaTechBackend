import "dotenv/config";
import app from "./app";

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 4000;

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Aramway backend listening on port ${PORT}`);
  // eslint-disable-next-line no-console
  console.log(`Swagger docs available at http://localhost:${PORT}/api-docs`);
});
