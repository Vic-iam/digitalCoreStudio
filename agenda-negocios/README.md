# Agenda Negocios

SaaS para administrar clientes, servicios y turnos con React, TypeScript y Supabase.

## Crear usuarios como administrador

La creación de usuarios se realiza mediante `supabase/functions/create-user`, nunca desde el navegador con la `service_role`.

1. Define `VITE_ADMIN_USER_ID` en el `.env` del frontend con el UUID de tu usuario administrador.
2. Configura `ADMIN_USER_ID` y `SUPABASE_SERVICE_ROLE_KEY` como secretos de la Edge Function.
3. Despliega la función con `supabase functions deploy create-user`.

El formulario de creación solo se muestra a tu UUID y la función vuelve a validar el permiso en servidor.

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.
