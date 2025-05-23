require('dotenv').config();

const express = require('express');
const helmet = require('helmet');

const app = express();
app.use(helmet());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'UP', timestamp: new Date().toISOString(), author: 'FELIZ CUMPLEAÑOS ANGEL' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Healthcheck service running on port ${PORT}`);
});
