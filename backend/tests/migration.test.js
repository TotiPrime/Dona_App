import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import sqlite3 from "sqlite3";
test("Migración aditiva conserva organización y usuarios previos", async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "dona-migration-"));
  process.env.DB_PATH = path.join(dir, "original.sqlite");
  process.env.DEMO_DATA = "true";
  const old = new sqlite3.Database(process.env.DB_PATH);
  await new Promise((resolve, reject) =>
    old.exec(
      `CREATE TABLE users(id INTEGER PRIMARY KEY AUTOINCREMENT,nombre TEXT NOT NULL,email TEXT UNIQUE NOT NULL,password TEXT NOT NULL,rol TEXT NOT NULL CHECK(rol IN ('admin','donante','orfanato')),estado TEXT DEFAULT 'activo',created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
 CREATE TABLE orphanages(id INTEGER PRIMARY KEY AUTOINCREMENT,nombre TEXT NOT NULL,direccion TEXT,telefono TEXT,responsable TEXT,descripcion TEXT,capacidad INTEGER DEFAULT 0,created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
 INSERT INTO users(nombre,email,password,rol) VALUES ('Usuario previo','previo@example.com','hash-previo','admin');
 INSERT INTO orphanages(nombre) VALUES ('Organización previa');`,
      (e) => (e ? reject(e) : resolve()),
    ),
  );
  await new Promise((r) => old.close(r));
  const { initDb, get, all, db } = await import("../src/config/db.js");
  try {
    await initDb();
    await initDb();
    assert.equal(
      (await get("SELECT password FROM users WHERE id=1")).password,
      "hash-previo",
    );
    assert.equal(
      (await get("SELECT nombre FROM orphanages WHERE id=1")).nombre,
      "Organización previa",
    );
    assert.equal(
      (await get("SELECT categoria FROM orphanages WHERE id=1")).categoria,
      "Infancia",
    );
    assert.equal((await get("SELECT COUNT(*) total FROM users")).total, 1);
    assert.ok(
      (await all("PRAGMA table_info(orphanages)")).some(
        (x) => x.name === "user_id",
      ),
    );
    assert.equal(
      (await get("SELECT COUNT(*) total FROM donation_events")).total,
      0,
    );
  } finally {
    await new Promise((r) => db.close(r));
    await fs.rm(dir, { recursive: true, force: true });
  }
});
