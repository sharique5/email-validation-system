import express from 'express';
import dotenv from 'dotenv';

import emailRoutes from './routes/emailRoutes';

dotenv.config();

const app = express();

app.use(express.json());

app.use('/email', emailRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
