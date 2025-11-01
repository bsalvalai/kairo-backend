const app = require('../index');
const supertest = require('supertest');
//const compare = jest.fn();
const compare = require('bcryptjs').compare;
const request = require('supertest');

const hash = jest.fn().mockResolvedValue('fake-hashed-password-12345'); 

// 2. Mock de Supabase Client
const mockMaybeSingle = jest.fn(); // Para simular la búsqueda de existencia
const mockInsert = jest.fn();       // Para simular la inserción de registro

// Simulamos la estructura de Supabase
const supabase = {
    from: jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: mockMaybeSingle, // Usado en el login y en la verificación de registro
        insert: jest.fn().mockReturnThis(),
        single: mockInsert, // Se asume que el INSERT usa .single() o similar para finalizar
    })),
};

describe('Tests de integracion de TASKS', () => {
    test('Deberia devolver tareas creadas por un usuario especifico (TASKS)', async () => {
        const response = await supertest(app).get('/api/tasks/createdByUser/bsalvalai');
        //console.log(response.body);
        expect(response.status).toBe(200);
    });

    test('Deberia devolver tareas asignadas a un usuario especifico (TASKS)', async () => {
        const response = await supertest(app).get('/api/tasks/assignedToUser/bsalvalai');
        //console.log(response.body);
        expect(response.status).toBe(200);
    });

    test('Deberia informar que el usuario no existe (TASKS)', async () => {
        const response = await supertest(app).get('/api/tasks/createdByUser/usuario_inexistente');
        //console.log(response.body);
        expect(response.status).toBe(404);
    });
});

