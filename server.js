import express from 'express';
const app = express();
const PORT = process.env.PORT || 8080;

app.get('/', (req, res) => res.send('OK'));
app.get('/health', (req, res) => res.send('OK'));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on port ${PORT}`);
});

// Keep the process alive
process.on('SIGTERM', () => {
  console.log('SIGTERM received, exiting gracefully');
  process.exit(0);
});
