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


// Valores de retorno simulados
const FAKE_HASHED_ANSWER = 'hashed-answer-fake';
const FAKE_NEW_PASSWORD_HASH = 'new-password-hash-fake';
const MOCK_USER = {
    id: 105, 
    email: 'recovery@test.com', 
    username: 'recuser', 
    first_name: 'Test', 
    last_name: 'User',
    recovery_answer: FAKE_HASHED_ANSWER // La respuesta hasheada almacenada
};


// Se asume que 'saltRounds' se define o mockea si es necesario
const saltRounds = 10; 


describe("Tests de integracion de Login Y Register", () => {
    test('Deberia devolver un 200 si el servidor esta funcionando', async () => {
        const response = await supertest(app).get('/api/health');
        expect(response.status).toBe(200);
      });
      
      test('Deberia devolver un 401 si el usuario no existe', async () => {
          const response = await supertest(app).post('/api/login').send({
              email: 'test@test.com',
              password: 'test'
          });
          expect(response.status).toBe(401);
      }); 
      
      test('Deberia devolver un 200 si el usuario existe', async () => {
          const response = await supertest(app).post('/api/login').send({
              email: 'bausalvalai@flowbit.com',
              password: 'uade123'
          });
          expect(response.status).toBe(200);
      });
      
      test('Deberia devolver un 401 si la contraseña es incorrecta', async () => {
          const response = await supertest(app).post('/api/login').send({
              email: 'bausalvalai@flowbit.com',
              password: 'incorrecta'
          });
          expect(response.status).toBe(401);
      });
      
      test('Deberia devolver un 401 si el email es incorrecto', async () => {
          const response = await supertest(app).post('/api/login').send({
              email: 'incorrecto@flowbit.com',
              password: 'uade123'
          });
          expect(response.status).toBe(401);
      });
      
      test("Deberia devolver un 201 si el usuario se registra correctamente", async () => {
          const response = await supertest(app).post('/api/register').send({
              email: 'test@test.com',
              password: 'test'
          });
          expect(response.status).toBe(201);
      });
      
      test("Deberia devolver un 400 si el usuario ya existe", async () => {
          const response = await supertest(app).post('/api/register').send({
              email: 'test@test.com',
              password: 'test'
          });
          expect(response.status).toBe(400);
      });
      
      test("Deberia devolver un 400 si el usuario no se registra correctamente", async () => {
          const response = await supertest(app).post('/api/register').send({
              email: 'test@test.com',
              password: 'test'
          });
          expect(response.status).toBe(400);
      });
});

describe('Tests Unitarios de Registro (/api/register)', () => {
    
    beforeEach(() => {
        jest.clearAllMocks();
    });

    const mockUserData = {
        email: 'nuevo.usuario@test.com',
        password: 'PasswordSegura123',
        username: 'newuser123'
    };

    // Test 1: Registro Exitoso (Caso principal)
    test('Debe devolver 201 y éxito si el usuario es nuevo y los datos son válidos', async () => {
        // A. Configurar Mocks:
        
        // 1. Simular que el usuario NO EXISTE (búsqueda inicial devuelve null)
        mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null });

        // 2. Simular el registro exitoso (Insert retorna éxito/data)
        mockInsert.mockResolvedValueOnce({ data: { id: 202, ...mockUserData }, error: null });

        // B. Ejecutar el test
        const response = await request(app)
            .post('/api/register')
            .send(mockUserData);

        // C. Verificaciones
        expect(response.statusCode).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.message).toContain('Usuario creado exitosamente');

        // Verificamos que se intentó insertar con la contraseña hasheada falsa
        expect(supabase.from().insert).toHaveBeenCalledWith(
            expect.objectContaining({
                email: mockUserData.email,
                username: mockUserData.username,
                password: 'fake-hashed-password-12345' // ¡El hash mockeado!
            })
        );
        // Verificamos que se llamó a la función de hasheo
        expect(hash).toHaveBeenCalledWith(mockUserData.password); 
    });

    // Test 2: Fallo - Usuario ya existe (email duplicado)
    test('Debe devolver 400 si el email ya existe', async () => {
        // A. Configurar Mocks:
        
        // 1. Simular que el usuario YA EXISTE (la búsqueda devuelve un usuario)
        mockMaybeSingle.mockResolvedValueOnce({ 
            data: { id: 50, email: mockUserData.email }, 
            error: null 
        });

        // 2. Simular que la inserción NUNCA DEBE SER LLAMADA
        mockInsert.mockResolvedValueOnce({ data: null, error: new Error('Error de DB') });

        // B. Ejecutar el test
        const response = await request(app)
            .post('/api/register')
            .send(mockUserData);

        // C. Verificaciones
        expect(response.statusCode).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Datos de entrada inválidos'); // Asumiendo este mensaje
        
        // Verificamos que NUNCA se intentó hashear la contraseña ni insertar
        expect(hash).not.toHaveBeenCalled();
        expect(supabase.from().insert).not.toHaveBeenCalled();
    });

    // Test 3: Fallo - Datos faltantes (Validación de Express-validator)
    test('Debe devolver 400 si falta el email (Validación)', async () => {
        // Asumimos que Express-validator devuelve 400
        const response = await request(app)
            .post('/api/register')
            .send({ 
                password: 'test', 
                username: 'fail' 
            });

        // C. Verificaciones
        expect(response.statusCode).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.errors).toBeDefined(); // Si usas express-validator, revisa el cuerpo
    });
    
    // Test 4: Fallo - Error en el servicio de la base de datos (Supabase)
    test('Debe devolver 500 si hay un error en el servicio de la BD durante el INSERT', async () => {
        // A. Configurar Mocks:
        
        // 1. Simular que el usuario NO EXISTE inicialmente
        mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null });

        // 2. Simular que la inserción FALLA con un error real
        mockInsert.mockResolvedValueOnce({ data: null, error: new Error('Database connection failed') });

        // B. Ejecutar el test
        const response = await request(app)
            .post('/api/register')
            .send(mockUserData);

        // C. Verificaciones
        expect(response.statusCode).toBe(500);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Error en el servicio de la base de datos'); 
        
        // Verificamos que sí se llamó a hash y a insert (aunque insert falló)
        expect(hash).toHaveBeenCalled();
        expect(supabase.from().insert).toHaveBeenCalled();
    });
});
