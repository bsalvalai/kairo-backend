import { Router } from 'express';
import { body, validationResult, param } from 'express-validator';
import supabase from '../supabaseClient.js';

const router = Router();

// ----------------------------------------------------------------
// GET /statistics/:username (Consulta estadísticas de tareas asignadas a un usuario)
// Ruta final: GET /api/tasks/statistics/:username
// ----------------------------------------------------------------
router.get('/:username', async (req, res) => {
    try {
        if (!supabase) return res.status(500).json({ success: false, message: 'Fallo al inicializar Supabase' });

        const { username } = req.params;

        if (!username) {
            return res.status(400).json({ success: false, message: 'El nombre de usuario es requerido' });
        }

        // 1. Buscar el usuario por username para obtener su ID
        const { data: user, error: userError } = await supabase.from('users')
            .select('id')
            .eq('username', username)
            .limit(1)
            .maybeSingle();

        if (userError) {
            console.error('Error al buscar usuario:', userError);
            return res.status(500).json({ success: false, message: 'Error al buscar el usuario' });
        }

        if (!user) {
            return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
        }

        const userId = user.id;

        // Función auxiliar para obtener los IDs de tareas asignadas al usuario
        const getAssignedTaskIds = async (userId) => {
            const { data, error } = await supabase.from('asignaciones')
                .select('id_tarea')
                .eq('id_user', userId);

            if (error) throw error;
            // Retorna solo un array plano de IDs de tareas
            return data.map(item => item.id_tarea); 
        };

        const assignedTaskIds = await getAssignedTaskIds(userId);

        if (assignedTaskIds.length === 0) {
            return res.json({
                success: true,
                message: `No hay tareas asignadas a ${username}`,
                usuario: { username: username, id: userId },
                estadisticas: {
                    cantPendientes: 0,
                    cantCompletadas: 0,
                    cantEnProgreso: 0,
                    prioridadAlta: 0,
                    prioridadMedia: 0,
                    prioridadBaja: 0
                }
            });
        }

        // Helper para contar tareas por estado/prioridad
        const countTasks = async (column, value) => {
            const { count, error } = await supabase.from('tareas')
                // Realiza un COUNT utilizando el modificador { count: 'exact' }
                .select('*', { count: 'exact' }) 
                // Filtra solo las tareas asignadas a este usuario
                .in('id', assignedTaskIds) 
                // Aplica el filtro específico (estado o prioridad)
                .eq(column, value);

            if (error) throw error;
            return count;
        };

        // 2. Obtener conteos por Estado (columna 'estado' de la tabla 'tareas')
        const cantPendientes = await countTasks('estado', 'pendiente');
        const cantCompletadas = await countTasks('estado', 'completada');
        const cantEnProgreso = await countTasks('estado', 'en progreso');

        // 3. Obtener conteos por Prioridad (columna 'prioridad' de la tabla 'tareas')
        const prioridadAlta = await countTasks('prioridad', 'alta');
        const prioridadMedia = await countTasks('prioridad', 'media');
        const prioridadBaja = await countTasks('prioridad', 'baja');

        // 4. Formatear la respuesta con el objeto solicitado
        const estadisticas = {
            cantPendientes: cantPendientes,
            cantCompletadas: cantCompletadas,
            cantEnProgreso: cantEnProgreso,
            prioridadAlta: prioridadAlta,
            prioridadMedia: prioridadMedia,
            prioridadBaja: prioridadBaja
        };

        res.json({
            success: true,
            message: `Estadísticas de tareas asignadas a ${username}`,
            usuario: { username: username, id: userId },
            estadisticas: estadisticas
        });

    } catch (error) {
        console.error('Error en consulta de estadísticas de tareas:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor al obtener estadísticas' });
    }
});

// ----------------------------------------------------------------
// GET /expired/:username (Consulta tareas vencidas asignadas a un usuario)
// Ruta final: GET /api/tasks/expired/:username
// ----------------------------------------------------------------
router.get('/expired/:username', async (req, res) => {
    try {
        if (!supabase) return res.status(500).json({ success: false, message: 'Fallo al inicializar Supabase' });

        const { username } = req.params;

        if (!username) {
            return res.status(400).json({ success: false, message: 'El nombre de usuario es requerido' });
        }

        // 1. Buscar el usuario por username para obtener su ID
        const { data: user, error: userError } = await supabase.from('users')
            .select('id')
            .eq('username', username)
            .limit(1)
            .maybeSingle();

        if (userError) {
            console.error('Error al buscar usuario:', userError);
            return res.status(500).json({ success: false, message: 'Error al buscar el usuario' });
        }

        if (!user) {
            return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
        }

        const now = new Date().toISOString(); 

        // 2. Buscar asignaciones y hacer JOIN con la tabla 'tareas'
        const { data: asignaciones, error: asignacionesError } = await supabase.from('asignaciones')
            .select(`
                *,
                tareas!inner (*)
            `)
            .eq('id_user', user.id)
            .lt('tareas.fechaVencimiento', now) 
            
            // 🐛 CORRECCIÓN: Usar foreignTable para especificar la tabla relacionada.
            .order('fechaVencimiento', { 
                ascending: true, 
                foreignTable: 'tareas' // ✅ Esta línea le dice a Supabase que ordene usando la columna de la tabla 'tareas'.
            }); 

        if (asignacionesError) {
            // El error PGRST100 fue capturado aquí. Ahora debería resolverse.
            console.error('Error al buscar tareas vencidas:', asignacionesError);
            return res.status(500).json({ success: false, message: 'Error al buscar las tareas vencidas' });
        }

        // 3. Formatear la respuesta (misma estructura que el endpoint base)
        const tareasVencidas = asignaciones.map(asignacion => ({
            asignacion: {
                id: asignacion.id,
                idUser: asignacion.id_user,
                idTarea: asignacion.id_tarea,
                esPrioridad: asignacion.esPrioridad
            },
            tarea: {
                id: asignacion.tareas.id,
                titulo: asignacion.tareas.titulo,
                descripcion: asignacion.tareas.descripcion, 
                prioridad: asignacion.tareas.prioridad,
                fechaCreacion: asignacion.tareas.fechaCreacion,
                fechaVencimiento: asignacion.tareas.fechaVencimiento,
                estado: asignacion.tareas.estado,
                asignadoPor: asignacion.tareas.asignadoPor,
                nota: asignacion.tareas.nota,
                ultimaActualizacion: asignacion.tareas.ultimaActualizacion
            }
        }));

        res.json({
            success: true,
            message: `Tareas vencidas asignadas a ${username}`,
            usuario: {
                username: username,
                id: user.id
            },
            tareasVencidas: tareasVencidas,
            totalTareasVencidas: tareasVencidas.length
        });

    } catch (error) {
        console.error('Error en consulta de tareas vencidas:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
});
export default router;