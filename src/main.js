import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { errorHandler } from './middlewares/error.handler.js';
import usersRoutes from './modules/users/routes.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/users', usersRoutes);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});