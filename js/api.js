const Api = (() => {
  const listeners = [];
  const onLog = (fn) => listeners.push(fn);

  const BASE_URL = 'http://localhost:8080';

  async function request(method, path, body) {
    const url = BASE_URL + '/api/v1' + path;
    const opts = { method, headers: {} };
    if (body !== undefined) {
      opts.headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(body);
    }
    const entry = { method, url, body };
    let res;
    try {
      res = await fetch(url, opts);
    } catch (e) {
      entry.error = e.message;
      listeners.forEach((fn) => fn(entry));
      throw new Error('No se pudo conectar con el API (¿backend activo en el puerto 8080 y CORS habilitado?)');
    }
    const text = await res.text();
    let data = null;
    if (text) {
      try { data = JSON.parse(text); } catch { data = text; }
    }
    entry.status = res.status;
    entry.response = data;
    listeners.forEach((fn) => fn(entry));
    if (!res.ok) {
      const msg = (data && (data.message || data.error)) || `Error HTTP ${res.status}`;
      throw new Error(msg);
    }
    return data;
  }

  return {
    onLog,
    users: {
      list: () => request('GET', '/users'),
      get: (id) => request('GET', `/users/${id}`),
      create: (u) => request('POST', '/users', u),
      update: (id, u) => request('PATCH', `/users/${id}`, u),
      remove: (id) => request('DELETE', `/users/${id}`),
    },
    tasks: {
      list: (uid) => request('GET', `/users/${uid}/tasks`),
      get: (uid, id) => request('GET', `/users/${uid}/tasks/${id}`),
      create: (uid, t) => request('POST', `/users/${uid}/tasks`, t),
      autogenerate: (uid) => request('POST', `/users/${uid}/tasks?autogenerate=true`),
      update: (uid, id, t) => request('PATCH', `/users/${uid}/tasks/${id}`, t),
      remove: (uid, id) => request('DELETE', `/users/${uid}/tasks/${id}`),
    },
  };
})();
