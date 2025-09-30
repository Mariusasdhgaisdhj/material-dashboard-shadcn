// Use direct API calls to avoid proxy issues
const isDevelopment = import.meta.env.DEV;
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string) || "https://serverside3.vercel.app";

export function apiUrl(path: string): string {
  if (!path) return API_BASE_URL;
  if (path.startsWith("http")) return path;
  
  const base = API_BASE_URL.endsWith("/") ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
  const p = path.startsWith("/") ? path : `/${path}`;
  const fullUrl = `${base}${p}`;
  console.log(`[API] Making request to: ${fullUrl}`);
  return fullUrl;
}

export async function getJson<T>(path: string): Promise<T> {
  const url = apiUrl(path);
  
  try {
    console.log(`[API] Fetching: ${url}`);
    
    const fetchOptions: RequestInit = {
      method: 'GET',
      mode: 'cors',
      credentials: 'omit',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      }
    };
    
    const res = await fetch(url, fetchOptions);
    
    console.log(`[API] Response status: ${res.status}`);
    console.log(`[API] Response headers:`, Object.fromEntries(res.headers.entries()));
    
    if (!res.ok) {
      const text = await res.text();
      console.error(`[API] Error response:`, text);
      throw new Error(`HTTP ${res.status}: ${text || res.statusText}`);
    }
    
    // Check if response is actually JSON
    const contentType = res.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await res.text();
      console.error(`[API] Non-JSON response received:`, text.substring(0, 200) + '...');
      throw new Error(`Expected JSON response but received ${contentType || 'unknown content type'}. Response: ${text.substring(0, 100)}...`);
    }
    
    const data = await res.json();
    console.log(`[API] Success response:`, data);
    return data as T;
  } catch (error) {
    console.error(`[API] Fetch error for ${url}:`, error);
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      if (isDevelopment) {
        throw new Error(`Cannot connect to backend via proxy. Please restart the development server and try again.`);
      } else {
        // Check if it's a CORS error
        if (error.message.includes('CORS') || error.message.includes('cross-origin')) {
          throw new Error(`CORS error: The backend at ${url} is not allowing requests from this origin. This is likely a CORS configuration issue on the backend.`);
        }
        throw new Error(`Cannot connect to backend at ${url}. Please check your internet connection and ensure the backend is running.`);
      }
    }
    throw error;
  }
}


