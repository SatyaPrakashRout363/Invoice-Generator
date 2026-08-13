const express = require('express');
const cors = require('cors');
const sessionMiddleware = require('./middleware/session');
const authRouter = require('./routes/auth');
const invoicesRouter = require('./routes/invoices');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(sessionMiddleware);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', authRouter);
app.use('/api/invoices', invoicesRouter);

app.listen(PORT, () => {
  console.log(`Invoice Generator API listening on http://localhost:${PORT}`);
});
