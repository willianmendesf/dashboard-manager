/**
 * Utilitário centralizado para verificação de rotas públicas
 * Reutilizável em toda a aplicação para manter consistência
 */

/**
 * Lista de rotas públicas do frontend
 * Rotas onde usuários não autenticados podem navegar livremente
 */
export const PUBLIC_FRONTEND_ROUTES = [
  '/login',
  '/esqueci-senha',
  '/redefinir-senha',
  '/landing',
  '/mural',
  '/adicionar-visitantes',
  '/emprestimo',
  '/atualizar-cadastro'
] as const;

/**
 * Lista de rotas públicas da API
 * Rotas que não requerem autenticação no backend
 */
export const PUBLIC_API_ROUTES = [
  '/auth/login',
  '/auth/logout',
  '/auth/solicitar-reset',
  '/auth/redefinir-senha',
  '/usuarios/registro',
  '/public/',
  '/files/',
  '/emergency/',
  '/enrollments/request',
  '/enrollments/member/',
  '/enrollments/can-request/'
] as const;

/**
 * Verifica se uma URL do frontend é uma rota pública
 * @param url - URL ou path a verificar
 * @returns true se a rota for pública
 */
export function isPublicFrontendRoute(url: string): boolean {
  if (!url) return false;
  
  // Remover query params e hash da URL para verificação
  const path = url.split('?')[0].split('#')[0];
  
  return PUBLIC_FRONTEND_ROUTES.some(route => path.startsWith(route));
}

/**
 * Verifica se uma URL da API é uma rota pública
 * @param url - URL completa ou path da requisição HTTP
 * @returns true se a rota da API for pública
 */
export function isPublicApiRoute(url: string): boolean {
  if (!url) return false;
  
  return PUBLIC_API_ROUTES.some(route => url.includes(route));
}

