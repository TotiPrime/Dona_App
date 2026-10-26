import sqlite3 from "sqlite3";
import bcrypt from "bcryptjs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
export const db = new sqlite3.Database(
  process.env.DB_PATH || path.join(root, "dona_app.sqlite"),
);
export const run = (sql, params = []) =>
  new Promise((resolve, reject) =>
    db.run(sql, params, function (err) {
      err ? reject(err) : resolve(this);
    }),
  );
export const get = (sql, params = []) =>
  new Promise((resolve, reject) =>
    db.get(sql, params, (err, row) => (err ? reject(err) : resolve(row))),
  );
export const all = (sql, params = []) =>
  new Promise((resolve, reject) =>
    db.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows))),
  );
export async function initDb() {
  await run("PRAGMA foreign_keys = ON");
  await run(
    `CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY AUTOINCREMENT,nombre TEXT NOT NULL,email TEXT UNIQUE NOT NULL,password TEXT NOT NULL,rol TEXT NOT NULL CHECK(rol IN ('admin','donante','orfanato')),estado TEXT DEFAULT 'activo',created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`,
  );
  await run(
    `CREATE TABLE IF NOT EXISTS orphanages(id INTEGER PRIMARY KEY AUTOINCREMENT,nombre TEXT NOT NULL,direccion TEXT,telefono TEXT,responsable TEXT,descripcion TEXT,capacidad INTEGER DEFAULT 0,created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`,
  );
  await run(
    `CREATE TABLE IF NOT EXISTS needs(id INTEGER PRIMARY KEY AUTOINCREMENT,orphanage_id INTEGER NOT NULL,tipo TEXT NOT NULL,descripcion TEXT NOT NULL,edad TEXT,talla TEXT,cantidad INTEGER NOT NULL,prioridad TEXT DEFAULT 'media',estado TEXT DEFAULT 'pendiente',created_at DATETIME DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(orphanage_id) REFERENCES orphanages(id))`,
  );
  await run(
    `CREATE TABLE IF NOT EXISTS donations(id INTEGER PRIMARY KEY AUTOINCREMENT,donor_id INTEGER,orphanage_id INTEGER,need_id INTEGER,tipo TEXT NOT NULL,descripcion TEXT,cantidad INTEGER DEFAULT 1,estado TEXT DEFAULT 'registrada',image_url TEXT,ai_score INTEGER,ai_condition TEXT,ai_recommendation TEXT,created_at DATETIME DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(donor_id) REFERENCES users(id),FOREIGN KEY(orphanage_id) REFERENCES orphanages(id),FOREIGN KEY(need_id) REFERENCES needs(id))`,
  );
  // Migraciones aditivas: conservan las tablas y registros de la versión original.
  const columns = await all("PRAGMA table_info(orphanages)");
  if (!columns.some((c) => c.name === "categoria"))
    await run(
      "ALTER TABLE orphanages ADD COLUMN categoria TEXT DEFAULT 'Infancia'",
    );
  if (!columns.some((c) => c.name === "user_id"))
    await run(
      "ALTER TABLE orphanages ADD COLUMN user_id INTEGER REFERENCES users(id)",
    );
  await run(
    `CREATE TABLE IF NOT EXISTS donation_events(id INTEGER PRIMARY KEY AUTOINCREMENT,donation_id INTEGER NOT NULL,estado TEXT NOT NULL,actor_id INTEGER,nota TEXT,created_at DATETIME DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(donation_id) REFERENCES donations(id),FOREIGN KEY(actor_id) REFERENCES users(id))`,
  );
  await run(
    "CREATE INDEX IF NOT EXISTS idx_donations_donor ON donations(donor_id)",
  );
  await run(
    "CREATE INDEX IF NOT EXISTS idx_events_donation ON donation_events(donation_id)",
  );
  if (
    process.env.DEMO_DATA === "true" &&
    !(await get("SELECT id FROM users LIMIT 1"))
  ) {
    const hash = await bcrypt.hash("Demo2026!", 10);
    await run("INSERT INTO users(nombre,email,password,rol) VALUES (?,?,?,?)", [
      "Coordinación demo",
      "admin@donaapp.com",
      hash,
      "admin",
    ]);
    await run("INSERT INTO users(nombre,email,password,rol) VALUES (?,?,?,?)", [
      "Donante demo",
      "donante@donaapp.com",
      hash,
      "donante",
    ]);
    await run("INSERT INTO users(nombre,email,password,rol) VALUES (?,?,?,?)", [
      "Organización demo",
      "orfanato@donaapp.com",
      hash,
      "orfanato",
    ]);
    const seeds = [
      [
        "Hogar Semillas · DEMO",
        "Infancia",
        "Ropa y útiles para acompañar el aprendizaje de niñas y niños.",
      ],
      [
        "Refugio Huellitas · DEMO",
        "Animales",
        "Alimentos e insumos de cuidado para animales rescatados.",
      ],
      [
        "Red Universitaria · DEMO",
        "Comunidad",
        "Apoyo solidario coordinado desde la comunidad universitaria.",
      ],
    ];
    for (const [nombre, categoria, descripcion] of seeds)
      await run(
        "INSERT INTO orphanages(nombre,categoria,descripcion,direccion,responsable,user_id) VALUES (?,?,?,?,?,?)",
        [
          nombre,
          categoria,
          descripcion,
          "Cochabamba · ubicación de muestra",
          "Coordinación demo",
          3,
        ],
      );
    const needs = [
      [1, "Ropa", "Chamarras limpias en buen estado", 20, "alta"],
      [1, "Útiles escolares", "Cuadernos tamaño carta", 40, "media"],
      [2, "Alimentos", "Bolsas de alimento para perros de 1 kg", 30, "alta"],
      [3, "Alimentos", "Paquetes de arroz de 1 kg", 50, "media"],
    ];
    for (const [org, tipo, descripcion, cantidad, prioridad] of needs)
      await run(
        "INSERT INTO needs(orphanage_id,tipo,descripcion,cantidad,prioridad) VALUES (?,?,?,?,?)",
        [org, tipo, descripcion, cantidad, prioridad],
      );
  }
}
