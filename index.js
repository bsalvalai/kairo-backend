import 'dotenv/config';
import express, { json } from 'express';
import cors from 'cors';
import userRoutes from './routes/userRoutes.js';
import taskRoutes from './routes/taskRoutes.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(json());

app.use('/api', userRoutes);
app.use('/api/tasks', taskRoutes);

// Endpoint de prueba
app.get('/api/health', async (req, res) => {
  res.json({
    success: true,
    message: 'Servidor funcionando correctamente - SPRINT 4',
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