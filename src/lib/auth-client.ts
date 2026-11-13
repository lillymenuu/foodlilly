import { inferAdditionalFields } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

import type { auth } from "./auth";

/** Cliente de login no navegador (cadastro, entrar, sair, Google). */
export const authClient = createAuthClient({
  plugins: [inferAdditionalFields<typeof auth>()],
});
