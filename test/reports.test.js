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

describe('Tests de integracion de REPORTS', () => {
    
    test("Debería devolver un json con los reportes de un usuario especifico (REPORTS)", async () => {
        const response = await supertest(app).get('/api/reports/sdsdsds');
        expect(response.status).toBe(200);
        expect(response.body).toBeDefined();
        expect(response.body.success).toBe(true);
        expect(response.body.message).toContain('Estadísticas de tareas asignadas a sdsdsds');
    });

    test("Debería devolver un json con las tareas expiradas de un usuario específico (REPORTS)", async () => {
        const response = await supertest(app).get("/api/reports/expired/sdsdsds")
        expect(response.status).toBe(200);
        expect(response.body).toBeDefined();
        expect(response.body.message).toContain('Tareas vencidas asignadas a sdsdsds');
    })
});