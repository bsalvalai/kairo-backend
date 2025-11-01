//import 'dotenv/config';
const express = require('express');
const { json } = require('express');
const cors = require('cors');
const userRoutes = require('./routes/userRoutes');
const taskRoutes = require('./routes/taskRoutes');
const reportsRoutes = require('./routes/reportsRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(json());

app.use('/api', userRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/reports', reportsRoutes)

// Endpoint de prueba
app.get('/api/health', async (req, res) => {
  res.json({
    success: true,
    message: 'Servidor funcionando correctamente - SPRINT 5',
    timestamp: new Date().toISOString(),
  });
});

// Manejo de rutas no encontradas (debe ir al final, después de todas las rutas)
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Ruta no encontrada'
  });
});

  app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/api/health`);
  });

module.exports = app;