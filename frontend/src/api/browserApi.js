// Demostración autónoma. Este módulo no sustituye la autorización de un servidor.
import { AxiosError } from "axios";
const name = "DonaApp-demo-v1:" + new URL(".", window.location.href).pathname;
const types = [
  "Ropa",
  "Alimentos",
  "Útiles escolares",
  "Juguetes",
  "Higiene",
  "Otros",
];
const transitions = {
  registrada: ["aprobada", "rechazada"],
  aprobada: ["entregada", "rechazada"],
  entregada: [],
  rechazada: [],
};
const now = () => new Date().toISOString().slice(0, 19).replace("T", " ");
const fail = (status, message) => {
  throw Object.assign(new Error(message), { httpStatus: status });
};
const positive = (n) =>
  Number.isInteger(Number(n)) && Number(n) >= 1 && Number(n) <= 100000;
const safe = (u) => ({
  id: u.id,
  nombre: u.nombre,
  email: u.email,
  rol: u.rol,
});
let opening;
function open() {
  return (opening ||= new Promise((resolve, reject) => {
    if (!window.indexedDB)
      return reject(
        new Error(
          "Este navegador no permite guardar datos locales. Usa Chrome o Edge en modo normal.",
        ),
      );
    const req = indexedDB.open(name, 1);
    req.onupgradeneeded = () => req.result.createObjectStore("data");
    req.onerror = () => reject(req.error);
    req.onblocked = () =>
      reject(
        new Error("Cierra otras pestañas de esta demo e inténtalo nuevamente."),
      );
    req.onsuccess = () => {
      const db = req.result;
      db.onversionchange = () => db.close();
      resolve(db);
    };
  }));
}
async function transaction(fn, write = false) {
  const db = await open();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("data", write ? "readwrite" : "readonly"),
      store = tx.objectStore("data");
    let result, reason;
    tx.oncomplete = () => resolve(result);
    tx.onerror = () =>
      reject(
        reason || tx.error || new Error("No se pudo guardar la información"),
      );
    tx.onabort = () =>
      reject(
        reason ||
          tx.error ||
          new Error("No se pudo guardar. Revisa el espacio disponible."),
      );
    const request = store.get("state");
    request.onsuccess = () => {
      try {
        const state = request.result;
        result = fn(state, (value) => store.put(value, "state"));
        if (write && state) store.put(state, "state");
      } catch (e) {
        reason = e;
        tx.abort();
      }
    };
  });
}
async function passwordHash(password, salt = crypto.randomUUID()) {
  if (!crypto.subtle)
    fail(400, "Abre la demo mediante HTTPS o localhost para usar las cuentas.");
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const buffer = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: new TextEncoder().encode(salt),
      iterations: 100000,
      hash: "SHA-256",
    },
    key,
    256,
  );
  return {
    salt,
    hash: Array.from(new Uint8Array(buffer), (v) =>
      v.toString(16).padStart(2, "0"),
    ).join(""),
  };
}
let initialized;
async function ready() {
  return (initialized ||= (async () => {
    if (await transaction((s) => Boolean(s))) return;
    const credential = await passwordHash("Demo2026!");
    const users = [
      ["Coordinación demo", "admin@donaapp.com", "admin"],
      ["Donante demo", "donante@donaapp.com", "donante"],
      ["Organización demo", "orfanato@donaapp.com", "orfanato"],
    ].map(([nombre, email, rol], i) => ({
      id: i + 1,
      nombre,
      email,
      rol,
      ...credential,
    }));
    const orphanages = [
      [
        "Hogar Semillas · DEMO",
        "Infancia",
        "Ropa y útiles para acompañar el aprendizaje de niñas y niños.",
      ],
      [
        "Refugio Huellitas · DEMO",
        "Animales",
        "Alimentos e insumos para animales rescatados.",
      ],
      [
        "Red Universitaria · DEMO",
        "Comunidad",
        "Apoyo solidario desde la comunidad universitaria.",
      ],
    ].map(([nombre, categoria, descripcion], i) => ({
      id: i + 1,
      nombre,
      categoria,
      descripcion,
      direccion: "Cochabamba · ubicación de muestra",
      telefono: "",
      responsable: "Coordinación demo",
      capacidad: 0,
      user_id: 3,
      created_at: now(),
    }));
    const needs = [
      [1, "Ropa", "Chamarras limpias en buen estado", 20, "alta"],
      [1, "Útiles escolares", "Cuadernos tamaño carta", 40, "media"],
      [2, "Alimentos", "Bolsas de alimento para perros de 1 kg", 30, "alta"],
      [3, "Alimentos", "Paquetes de arroz de 1 kg", 50, "media"],
    ].map(([orphanage_id, tipo, descripcion, cantidad, prioridad], i) => ({
      id: i + 1,
      orphanage_id,
      tipo,
      descripcion,
      cantidad,
      prioridad,
      edad: "",
      talla: "",
      estado: "pendiente",
      created_at: now(),
    }));
    await transaction((s, put) => {
      if (!s)
        put({
          version: 1,
          users,
          orphanages,
          needs,
          donations: [],
          events: [],
          images: {},
          sessions: {},
          next: { users: 4, orphanages: 4, needs: 5, donations: 1, events: 1 },
        });
    }, true);
  })().catch((e) => {
    initialized = null;
    throw e;
  }));
}
function userFrom(s, config) {
  const header =
    config.headers?.get?.("Authorization") ||
    config.headers?.Authorization ||
    "";
  const token = header.replace(/^Bearer\s+/i, "");
  const session = s.sessions[token];
  if (!session || session.expires < Date.now())
    fail(401, "Tu sesión terminó. Vuelve a ingresar.");
  const user = s.users.find((u) => u.id === session.user_id);
  if (!user) fail(401, "Cuenta no encontrada");
  return user;
}
function requireRole(u, ...roles) {
  if (!roles.includes(u.rol)) fail(403, "No tienes permiso para esta acción");
}
function canSee(s, u, d) {
  return (
    u.rol === "admin" ||
    (u.rol === "donante"
      ? d.donor_id === u.id
      : s.orphanages.some((o) => o.id === d.orphanage_id && o.user_id === u.id))
  );
}
function orgValues(b) {
  if (
    typeof b.nombre !== "string" ||
    b.nombre.trim().length < 3 ||
    b.nombre.length > 120 ||
    !["Infancia", "Animales", "Comunidad"].includes(
      b.categoria || "Infancia",
    ) ||
    !Number.isInteger(Number(b.capacidad || 0)) ||
    Number(b.capacidad || 0) < 0
  )
    fail(400, "Revisa nombre, categoría y capacidad");
  return {
    nombre: b.nombre.trim(),
    direccion: b.direccion || "",
    telefono: b.telefono || "",
    responsable: b.responsable || "",
    descripcion: b.descripcion || "",
    capacidad: Number(b.capacidad || 0),
    categoria: b.categoria || "Infancia",
  };
}
function authResult(s, u) {
  const token = crypto.randomUUID();
  s.sessions[token] = {
    user_id: u.id,
    expires: Date.now() + 8 * 60 * 60 * 1000,
  };
  return { user: safe(u), token };
}
function dispatch(s, config, path, method, b, credential, loginId) {
  if (path === "/health")
    return { status: "ok", demo: true, storage: "IndexedDB" };
  if (path === "/auth/register" && method === "POST") {
    if (b.rol && b.rol !== "donante")
      fail(400, "El registro público solo admite donantes");
    if (s.users.some((u) => u.email === b.email))
      fail(400, "Ese correo ya está registrado");
    const u = {
      id: s.next.users++,
      nombre: b.nombre.trim(),
      email: b.email,
      rol: "donante",
      ...credential,
    };
    s.users.push(u);
    return authResult(s, u);
  }
  if (path === "/auth/login" && method === "POST") {
    const u = s.users.find((u) => u.id === loginId);
    if (!u) fail(401, "Credenciales incorrectas");
    return authResult(s, u);
  }
  if (path === "/orphanages" && method === "GET")
    return s.orphanages.map(({ user_id, ...o }) => o);
  if (path === "/needs" && method === "GET")
    return s.needs
      .map((n) => ({
        ...n,
        orphanage_nombre: s.orphanages.find((o) => o.id === n.orphanage_id)
          ?.nombre,
        categoria: s.orphanages.find((o) => o.id === n.orphanage_id)?.categoria,
        recibidas: s.donations
          .filter((d) => d.need_id === n.id && d.estado === "entregada")
          .reduce((a, d) => a + d.cantidad, 0),
      }))
      .sort(
        (a, b) =>
          ({ alta: 0, media: 1, baja: 2 })[a.prioridad] -
            { alta: 0, media: 1, baja: 2 }[b.prioridad] || b.id - a.id,
      );
  const orgMatch = path.match(/^\/orphanages\/(\d+)$/);
  if (orgMatch && method === "GET") {
    const row = s.orphanages.find((o) => o.id === Number(orgMatch[1]));
    if (!row) fail(404, "Organización no encontrada");
    const { user_id, ...publicRow } = row;
    return publicRow;
  }
  const u = userFrom(s, config);
  if (path === "/auth/me") return { user: safe(u) };
  if (path === "/auth/logout" && method === "POST") {
    const token = (config.headers.get?.("Authorization") || "").replace(
      /^Bearer\s+/i,
      "",
    );
    delete s.sessions[token];
    return { message: "Sesión cerrada" };
  }
  if (path === "/orphanages" && method === "POST") {
    requireRole(u, "admin");
    const row = {
      id: s.next.orphanages++,
      created_at: now(),
      ...orgValues(b),
      user_id: null,
    };
    s.orphanages.push(row);
    return row;
  }
  if (orgMatch) {
    requireRole(u, "admin");
    const id = Number(orgMatch[1]),
      row = s.orphanages.find((o) => o.id === id);
    if (!row) fail(404, "Organización no encontrada");
    if (method === "PUT") {
      Object.assign(row, orgValues(b));
      return row;
    }
    if (method === "DELETE") {
      if (
        s.needs.some((n) => n.orphanage_id === id) ||
        s.donations.some((d) => d.orphanage_id === id)
      )
        fail(
          409,
          "Tiene necesidades o donaciones asociadas; conserva su trazabilidad.",
        );
      s.orphanages = s.orphanages.filter((o) => o.id !== id);
      return { message: "Organización eliminada" };
    }
  }
  if (path === "/needs" && method === "POST") {
    requireRole(u, "admin");
    if (
      !types.includes(b.tipo) ||
      !b.descripcion?.trim() ||
      b.descripcion.length > 1000 ||
      !positive(b.cantidad) ||
      !["alta", "media", "baja"].includes(b.prioridad || "media")
    )
      fail(400, "Revisa tipo, descripción, cantidad y prioridad");
    if (!s.orphanages.some((o) => o.id === Number(b.orphanage_id)))
      fail(400, "Organización no encontrada");
    const row = {
      id: s.next.needs++,
      orphanage_id: Number(b.orphanage_id),
      tipo: b.tipo,
      descripcion: b.descripcion.trim(),
      edad: b.edad || "",
      talla: b.talla || "",
      cantidad: Number(b.cantidad),
      prioridad: b.prioridad || "media",
      estado: "pendiente",
      created_at: now(),
    };
    s.needs.push(row);
    return row;
  }
  const needMatch = path.match(/^\/needs\/(\d+)\/status$/);
  if (needMatch && method === "PATCH") {
    requireRole(u, "admin");
    if (!["pendiente", "cubierta"].includes(b.estado))
      fail(400, "Estado inválido");
    const row = s.needs.find((n) => n.id === Number(needMatch[1]));
    if (!row) fail(404, "Necesidad no encontrada");
    row.estado = b.estado;
    return row;
  }
  const visible = s.donations.filter((d) => canSee(s, u, d));
  if (path === "/donations" && method === "GET")
    return visible
      .map((d) => ({
        ...d,
        donor_nombre: s.users.find((x) => x.id === d.donor_id)?.nombre,
        orphanage_nombre: s.orphanages.find((x) => x.id === d.orphanage_id)
          ?.nombre,
      }))
      .sort((a, b) => b.id - a.id);
  if (path === "/donations" && method === "POST") {
    requireRole(u, "admin", "donante");
    if (!types.includes(b.tipo)) fail(400, "Selecciona un tipo válido");
    if (!positive(b.cantidad))
      fail(400, "La cantidad debe ser un entero entre 1 y 100000");
    if (!b.descripcion?.trim() || b.descripcion.length > 1000)
      fail(400, "Describe tu aporte (máximo 1000 caracteres)");
    if (!s.orphanages.some((o) => o.id === Number(b.orphanage_id)))
      fail(400, "Selecciona una organización existente");
    if (b.need_id) {
      const n = s.needs.find((n) => n.id === Number(b.need_id));
      if (
        !n ||
        n.orphanage_id !== Number(b.orphanage_id) ||
        n.tipo !== b.tipo ||
        n.estado !== "pendiente"
      )
        fail(
          400,
          "La necesidad debe estar pendiente y coincidir con la organización y tipo",
        );
    }
    const image = b.imagen instanceof Blob && b.imagen.size ? b.imagen : null;
    if (
      image &&
      (!["image/jpeg", "image/png", "image/webp"].includes(image.type) ||
        image.size > 5 * 1024 * 1024)
    )
      fail(400, "Solo imágenes JPG, PNG o WebP de hasta 5 MB");
    const row = {
      id: s.next.donations++,
      donor_id: u.id,
      orphanage_id: Number(b.orphanage_id),
      need_id: b.need_id ? Number(b.need_id) : null,
      tipo: b.tipo,
      descripcion: b.descripcion.trim(),
      cantidad: Number(b.cantidad),
      estado: "registrada",
      image_url: image ? "/uploads/" + crypto.randomUUID() : null,
      ai_score: null,
      ai_condition: "Revisión manual",
      ai_recommendation:
        "El equipo verificará el estado y la cantidad al recibir el aporte.",
      created_at: now(),
    };
    s.donations.push(row);
    if (image) s.images[row.image_url] = image;
    s.events.push({
      id: s.next.events++,
      donation_id: row.id,
      estado: row.estado,
      actor_id: u.id,
      nota: "Aporte registrado; aún no confirma recepción.",
      created_at: now(),
    });
    return row;
  }
  const history = path.match(/^\/donations\/(\d+)\/history$/),
    status = path.match(/^\/donations\/(\d+)\/status$/);
  if (history && method === "GET") {
    const row = visible.find((d) => d.id === Number(history[1]));
    if (!row) fail(404, "Donación no encontrada");
    return s.events
      .filter((e) => e.donation_id === row.id)
      .map(({ estado, nota, created_at }) => ({ estado, nota, created_at }));
  }
  if (status && method === "PATCH") {
    requireRole(u, "admin", "orfanato");
    const row = visible.find((d) => d.id === Number(status[1]));
    if (!row) fail(404, "Donación no encontrada");
    if (!transitions[row.estado]?.includes(b.estado))
      fail(400, "Transición inválida. Revisa el estado actual.");
    if (typeof (b.nota ?? "") !== "string" || (b.nota || "").length > 500)
      fail(400, "La observación admite hasta 500 caracteres");
    if (b.estado === "rechazada" && !b.nota?.trim())
      fail(400, "Explica el motivo del rechazo");
    row.estado = b.estado;
    s.events.push({
      id: s.next.events++,
      donation_id: row.id,
      estado: row.estado,
      actor_id: u.id,
      nota: b.nota?.trim() || "Estado actualizado por coordinación.",
      created_at: now(),
    });
    return row;
  }
  if (path === "/dashboard/stats")
    return {
      donations: visible.length,
      pendingDonations: visible.filter((d) => d.estado === "registrada").length,
      delivered: visible.filter((d) => d.estado === "entregada").length,
      units: visible
        .filter((d) => d.estado === "entregada")
        .reduce((a, d) => a + d.cantidad, 0),
      orphanages: s.orphanages.length,
      pendingNeeds: s.needs.filter((n) => n.estado === "pendiente").length,
      byType: types
        .map((tipo) => ({
          tipo,
          total: visible.filter((d) => d.tipo === tipo).length,
        }))
        .filter((x) => x.total)
        .sort((a, b) => b.total - a.total),
    };
  if (path.startsWith("/uploads/")) {
    if (!visible.some((d) => d.image_url === path) || !s.images[path])
      fail(404, "Imagen no encontrada");
    return s.images[path];
  }
  fail(404, "Ruta no encontrada");
}
export async function browserAdapter(config) {
  try {
    await ready();
    const method = (config.method || "get").toUpperCase();
    const path = new URL(config.url, window.location.origin).pathname.replace(
      /^\/api(?=\/)/,
      "",
    );
    const b =
      config.data instanceof FormData
        ? Object.fromEntries(config.data.entries())
        : typeof config.data === "string"
          ? JSON.parse(config.data)
          : config.data || {};
    let credential, loginId;
    if (path === "/auth/register" && method === "POST") {
      b.email = String(b.email || "")
        .trim()
        .toLowerCase();
      if (
        typeof b.nombre !== "string" ||
        b.nombre.trim().length < 2 ||
        b.nombre.length > 100 ||
        !/^\S+@\S+\.\S+$/.test(b.email) ||
        typeof b.password !== "string" ||
        b.password.length < 8
      )
        fail(
          400,
          "Nombre válido, correo y contraseña de al menos 8 caracteres requeridos",
        );
      credential = await passwordHash(b.password);
    }
    if (path === "/auth/login" && method === "POST") {
      const email = String(b.email || "")
        .trim()
        .toLowerCase();
      const u = await transaction((s) =>
        s.users.find((u) => u.email === email),
      );
      if (!u || typeof b.password !== "string")
        fail(401, "Credenciales incorrectas");
      const c = await passwordHash(b.password, u.salt);
      if (c.hash !== u.hash) fail(401, "Credenciales incorrectas");
      loginId = u.id;
    }
    const data = await transaction(
      (s) => dispatch(s, config, path, method, b, credential, loginId),
      method !== "GET",
    );
    const status =
      method === "POST" &&
      ["/auth/register", "/orphanages", "/needs", "/donations"].includes(path)
        ? 201
        : 200;
    return { data, status, statusText: "OK", headers: {}, config };
  } catch (err) {
    const status = err.httpStatus || 503;
    const response = {
      data: {
        message: err.httpStatus
          ? err.message
          : err.message ||
            "No se pudo guardar en el navegador. Revisa el espacio disponible.",
      },
      status,
      statusText: "Error",
      headers: {},
      config,
    };
    throw new AxiosError(
      response.data.message,
      status >= 500 ? "ERR_BAD_RESPONSE" : "ERR_BAD_REQUEST",
      config,
      null,
      response,
    );
  }
}
