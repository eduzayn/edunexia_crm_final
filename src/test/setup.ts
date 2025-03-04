import '@testing-library/jest-dom';

// Configuração global para testes
beforeAll(() => {
  // Configurações que devem ser executadas antes de todos os testes
  jest.setTimeout(10000); // Aumenta o timeout para 10 segundos
});

afterAll(() => {
  // Limpeza após todos os testes
  jest.clearAllMocks();
});

// Mock global do console.error para evitar logs de erro nos testes
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is no longer supported')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
}); 