import test from "node:test";
import assert from "node:assert/strict";
process.env.NODE_ENV = "test";
process.env.DB_PATH = ":memory:";
process.env.DEMO_DATA = "true";
process.env.JWT_SECRET = "test-only-secret";
const { app } = await import("../src/server.js");
const { db, run } = await import("../src/config/db.js");
const server = app.listen(0, "127.0.0.1");
await new Promise((r) => server.once("listening", r));
const base = `http://127.0.0.1:${server.address().port}`;
async function call(route, { method = "GET", body, token } = {}) {
  const r = await fetch(base + "/api" + route, {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: "Bearer " + token } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: r.status, data: await r.json() };
}
const login = async (email) =>
  (
    await call("/auth/login", {
      method: "POST",
      body: { email, password: "Demo2026!" },
    })
  ).data.token;
test("Flujo y permisos de DonaApp", async (t) => {
  try {
    const admin = await login("admin@donaapp.com"),
      donor = await login("donante@donaapp.com"),
      org = await login("orfanato@donaapp.com");
    let other, id;
    await t.test("Rechaza acceso anónimo al panel", async () =>
      assert.equal((await call("/donations")).status, 401),
    );
    await t.test("Impide registro público con rol privilegiado", async () =>
      assert.equal(
        (
          await call("/auth/register", {
            method: "POST",
            body: {
              nombre: "Intruso",
              email: "i@test.com",
              password: "Password123!",
              rol: "admin",
            },
          })
        ).status,
        400,
      ),
    );
    await t.test("Crea cuenta donante", async () => {
      const r = await call("/auth/register", {
        method: "POST",
        body: {
          nombre: "Otro Donante",
          email: "otro@test.com",
          password: "Password123!",
        },
      });
      assert.equal(r.status, 201);
      other = r.data.token;
    });
    await t.test(
      "Rechaza cantidad negativa y necesidad incompatible",
      async () => {
        const body = {
          orphanage_id: 1,
          need_id: 1,
          tipo: "Ropa",
          descripcion: "Chamarras nuevas",
          cantidad: -1,
        };
        assert.equal(
          (await call("/donations", { method: "POST", body, token: donor }))
            .status,
          400,
        );
        body.cantidad = 2;
        body.orphanage_id = 2;
        assert.equal(
          (await call("/donations", { method: "POST", body, token: donor }))
            .status,
          400,
        );
      },
    );
    await t.test("Registra aporte vinculado", async () => {
      const r = await call("/donations", {
        method: "POST",
        body: {
          orphanage_id: 1,
          need_id: 1,
          tipo: "Ropa",
          descripcion: "Dos chamarras limpias talla M",
          cantidad: 2,
        },
        token: donor,
      });
      assert.equal(r.status, 201);
      assert.equal(r.data.ai_score, null);
      id = r.data.id;
    });
    await t.test("Aísla donaciones e historial entre donantes", async () => {
      assert.equal((await call("/donations", { token: other })).data.length, 0);
      assert.equal(
        (await call(`/donations/${id}/history`, { token: other })).status,
        404,
      );
      assert.equal((await call("/donations", { token: donor })).data.length, 1);
    });
    await t.test(
      "Donante no puede aprobar ni publicar necesidades",
      async () => {
        assert.equal(
          (
            await call(`/donations/${id}/status`, {
              method: "PATCH",
              body: { estado: "aprobada" },
              token: donor,
            })
          ).status,
          403,
        );
        assert.equal(
          (await call("/needs", { method: "POST", body: {}, token: org }))
            .status,
          403,
        );
      },
    );
    await t.test("Organización solo ve destinos asignados", async () => {
      assert.equal((await call("/donations", { token: org })).data.length, 1);
      await run("UPDATE orphanages SET user_id=NULL WHERE id=1");
      assert.equal(
        (
          await call(`/donations/${id}/status`, {
            method: "PATCH",
            body: { estado: "aprobada" },
            token: org,
          })
        ).status,
        404,
      );
      await run("UPDATE orphanages SET user_id=3 WHERE id=1");
    });
    await t.test("Impide saltos de estado y rechazos sin motivo", async () => {
      assert.equal(
        (
          await call(`/donations/${id}/status`, {
            method: "PATCH",
            body: { estado: "entregada" },
            token: admin,
          })
        ).status,
        400,
      );
      assert.equal(
        (
          await call(`/donations/${id}/status`, {
            method: "PATCH",
            body: { estado: "rechazada" },
            token: admin,
          })
        ).status,
        400,
      );
    });
    await t.test(
      "Aprueba y confirma entrega; guarda tres eventos",
      async () => {
        assert.equal(
          (
            await call(`/donations/${id}/status`, {
              method: "PATCH",
              body: { estado: "aprobada" },
              token: admin,
            })
          ).status,
          200,
        );
        assert.equal(
          (
            await call(`/donations/${id}/status`, {
              method: "PATCH",
              body: { estado: "entregada", nota: "Recibida por coordinación" },
              token: org,
            })
          ).status,
          200,
        );
        const h = await call(`/donations/${id}/history`, { token: donor });
        assert.deepEqual(
          h.data.map((x) => x.estado),
          ["registrada", "aprobada", "entregada"],
        );
        assert.equal(
          (
            await call(`/donations/${id}/status`, {
              method: "PATCH",
              body: { estado: "aprobada" },
              token: admin,
            })
          ).status,
          400,
        );
      },
    );
    await t.test("Calcula métricas y progreso de entregas reales", async () => {
      const s = (await call("/dashboard/stats", { token: donor })).data;
      assert.equal(s.delivered, 1);
      assert.equal(s.units, 2);
      assert.equal(
        (await call("/dashboard/stats", { token: other })).data.donations,
        0,
      );
      const needs = (await call("/needs")).data;
      assert.equal(needs.find((x) => x.id === 1).recibidas, 2);
    });
    await t.test("No elimina organización con relaciones", async () =>
      assert.equal(
        (await call("/orphanages/1", { method: "DELETE", token: admin }))
          .status,
        409,
      ),
    );
    await t.test(
      "Permite CRUD de organización sin relaciones y valida necesidades",
      async () => {
        const r = await call("/orphanages", {
          method: "POST",
          body: { nombre: "Organización temporal", categoria: "Animales" },
          token: admin,
        });
        assert.equal(r.status, 201);
        assert.equal(
          (
            await call("/orphanages/" + r.data.id, {
              method: "PUT",
              body: {
                nombre: "Organización editada",
                categoria: "Animales",
                capacidad: 4,
              },
              token: admin,
            })
          ).status,
          200,
        );
        assert.equal(
          (
            await call("/orphanages/" + r.data.id, {
              method: "DELETE",
              token: admin,
            })
          ).status,
          200,
        );
        assert.equal(
          (
            await call("/needs", {
              method: "POST",
              body: {
                orphanage_id: 999,
                tipo: "Ropa",
                descripcion: "Ropa",
                cantidad: 2,
              },
              token: admin,
            })
          ).status,
          400,
        );
      },
    );
    await t.test(
      "Valida adjuntos y restringe lectura de imágenes",
      async () => {
        const send = async (file) => {
          const fd = new FormData();
          for (const [k, v] of Object.entries({
            orphanage_id: 1,
            tipo: "Ropa",
            descripcion: "Adjunto de prueba",
            cantidad: 1,
          }))
            fd.append(k, String(v));
          fd.append("imagen", file, "prueba.png");
          return fetch(base + "/api/donations", {
            method: "POST",
            headers: { Authorization: "Bearer " + donor },
            body: fd,
          });
        };
        assert.equal(
          (await send(new Blob(["texto"], { type: "text/plain" }))).status,
          400,
        );
        assert.equal(
          (
            await send(
              new Blob([new Uint8Array(5 * 1024 * 1024 + 1)], {
                type: "image/png",
              }),
            )
          ).status,
          413,
        );
        const png = Buffer.from(
          "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jS3sAAAAASUVORK5CYII=",
          "base64",
        );
        const uploaded = await send(new Blob([png], { type: "image/png" }));
        assert.equal(uploaded.status, 201);
        const row = await uploaded.json();
        try {
          assert.equal((await fetch(base + row.image_url)).status, 401);
          assert.equal(
            (
              await fetch(base + row.image_url, {
                headers: { Authorization: "Bearer " + other },
              })
            ).status,
            404,
          );
          const image = await fetch(base + row.image_url, {
            headers: { Authorization: "Bearer " + donor },
          });
          assert.equal(image.status, 200);
          assert.equal((await image.arrayBuffer()).byteLength, png.byteLength);
        } finally {
          const { uploadDir } = await import("../src/config/upload.js");
          const fs = await import("node:fs/promises");
          const path = await import("node:path");
          await fs.unlink(path.join(uploadDir, path.basename(row.image_url)));
        }
      },
    );
  } finally {
    server.close();
    db.close();
  }
});
