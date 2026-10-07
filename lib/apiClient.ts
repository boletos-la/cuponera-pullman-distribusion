export const getApiUrl = () => {
  return process.env.NEXT_PUBLIC_API_URL || 'https://cuponera.dev-wit.com/api';
};

export const getDistribusionApiUrl = () => {
  return process.env.NEXT_PUBLIC_DISTRIBUSION_API_URL || 'http://localhost:4001/api';
};

export const getAuthToken = () => {
  if (typeof window !== 'undefined') {
    const token = sessionStorage.getItem('admin_token') || localStorage.getItem('jwt_token') || sessionStorage.getItem('jwt_token');
    if (token) {
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const payloadStr = decodeURIComponent(atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        const payload = JSON.parse(payloadStr);
        const now = Math.floor(Date.now() / 1000);
        
        if (payload.exp && payload.exp < now) {
          localStorage.removeItem('jwt_token');
          sessionStorage.removeItem('jwt_token');
          // Trigger event so Navbar knows to update state if it happens dynamically
          window.dispatchEvent(new Event('auth-change'));
          return null;
        }
        return token;
      } catch (e) {
        localStorage.removeItem('jwt_token');
        sessionStorage.removeItem('jwt_token');
        return null;
      }
    }
  }
  return null;
};

export const getAuthUser = () => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('jwt_token') || sessionStorage.getItem('jwt_token');
    if (token) {
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const payloadStr = decodeURIComponent(atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        const payload = JSON.parse(payloadStr);
        const now = Math.floor(Date.now() / 1000);
        
        if (payload.exp && payload.exp < now) {
          localStorage.removeItem('jwt_token');
          sessionStorage.removeItem('jwt_token');
          return null;
        }
        return payload;
      } catch (e) {
        return null;
      }
    }
  }
  return null;
};

export const setAuthToken = (token: string, rememberMe: boolean = true) => {
  if (typeof window !== 'undefined') {
    if (rememberMe) {
      localStorage.setItem('jwt_token', token);
      sessionStorage.removeItem('jwt_token');
    } else {
      sessionStorage.setItem('jwt_token', token);
      localStorage.removeItem('jwt_token');
    }
    window.dispatchEvent(new Event('auth-change'));
  }
};

export const removeAuthToken = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('jwt_token');
    sessionStorage.removeItem('jwt_token');
    window.dispatchEvent(new Event('auth-change'));
  }
};

export const apiClient = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${getApiUrl()}${endpoint}`;

  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');

  const token = getAuthToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  let data: any;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    data = await response.json();
  } else {
    const text = await response.text();
    if (!response.ok) {
      throw new Error(`Error del servidor (${response.status}): ${response.statusText || 'Respuesta no válida'}`);
    }
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text };
    }
  }

  if (!response.ok) {
    throw new Error(data?.message || data?.error?.message || `Error en la solicitud (${response.status})`);
  }

  return data;
};
