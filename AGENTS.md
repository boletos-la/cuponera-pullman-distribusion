<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Reglas de Desarrollo y Flujo de Trabajo

## 1. Mensajes de Commit y Control de Push
- **Idioma de Commits**: Los mensajes de commit deben redactarse **siempre en español**.
- **Prohibido Push Automático**: **NO realizar `git push`** a menos que el usuario lo solicite explícitamente.

## 2. Verificación de Compilación (Build)
- **Build previo obligatorio**: Ejecutar y verificar `npm run build` **siempre antes** de hacer cualquier `git commit` o `git push`.
- Si el build falla con errores de TypeScript o compilación, deben resolverse antes de proceder.

## 3. Configuración de Entorno (API)
- **URL del Backend**: El front **siempre** debe apuntar a la URL del backend de producción (`https://cuponera.dev-wit.com/api`) en el archivo `.env.local` (o donde corresponda), ya que cambiarlo a localhost u otras URLs genera problemas recurrentes.
