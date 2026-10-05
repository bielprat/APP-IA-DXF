# Autenticació amb Microsoft 365 (Entra ID)

1. Al [portal d'Entra ID](https://entra.microsoft.com) → **Registres d'aplicacions** → **Registre nou**.
   - Nom: `Colomer-Rifà Render AI`
   - Tipus de compte: **només comptes d'aquest directori organitzatiu** (tenant únic).
   - URI de redirecció (Web): `https://<domini-de-l-app>/api/auth/callback/microsoft-entra-id`
     (en local: `http://localhost:3000/api/auth/callback/microsoft-entra-id`).
2. A **Certificats i secrets**, crea un secret de client i copia'n el valor.
3. Omple el `.env`:

   ```
   AUTH_MICROSOFT_ENTRA_ID_ID=<Application (client) ID>
   AUTH_MICROSOFT_ENTRA_ID_SECRET=<valor del secret>
   AUTH_MICROSOFT_ENTRA_ID_ISSUER=https://login.microsoftonline.com/<Directory (tenant) ID>/v2.0
   ALLOWED_EMAIL_DOMAINS=colomer-rifa.cat
   ADMIN_EMAILS=<correus dels administradors>
   ```

4. En producció: `APP_ENV=production` i `AUTH_DEV_LOGIN=false`. L'aplicació no arrenca si l'accés de desenvolupament
   està activat fora de l'entorn local.

Notes:

- Si el perfil no porta `email`, s'utilitza el `preferred_username` (UPN). Només s'accepten adreces del domini exacte.
- Un usuari es pot desactivar posant `active = false` a la taula `User`; perd l'accés a la següent petició.
- Opcionalment, a **Aplicacions empresarials** es pot exigir assignació d'usuaris per limitar qui pot entrar.
