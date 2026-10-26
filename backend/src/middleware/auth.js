import jwt from "jsonwebtoken";

export function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ message: "Token no enviado" });
  const token = header.split(" ")[1];
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || "dona_app_secret");
    next();
  } catch {
    res.status(401).json({ message: "Token inválido o expirado" });
  }
}

export function role(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.rol)) {
      return res
        .status(403)
        .json({ message: "No tienes permiso para esta acción" });
    }
    next();
  };
}
