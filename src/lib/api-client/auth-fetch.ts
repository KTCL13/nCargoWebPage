// Thin wrapper around fetch that automatically attaches the Bearer token
// stored in localStorage by useProvideAuth. Safe to call on the server
// (typeof window check); there it just behaves like plain fetch.

export async function authFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
    const headers = new Headers(init.headers)

    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('auth_token')
        if (token && !headers.has('Authorization')) {
            headers.set('Authorization', `Bearer ${token}`)
        }
    }

    return fetch(input, { ...init, headers })
}
