# Arkovia Marketplace Web

`ArkoviaMarketplace` is the browser-facing application for the Arkovia marketplace. It is deliberately separate from the TShock plugin.

Architecture:

`browser -> HTTPS reverse proxy -> ArkoviaMarketplace -> private/loopback TShock REST -> Arkovia economy database`

The browser never receives the TShock REST token and never submits an authoritative Terraria user ID, seller ID, owner ID, balance, escrow amount, tax, or settlement result.

## Required environment variables

- `ARKOVIA_TSHOCK_REST_TOKEN` — TShock REST token with `arkoviaeconomy.api.marketplace.read`, `.link`, and `.write` permissions. Backend only.
- `ARKOVIA_MARKET_SUBJECT_SECRET` — persistent random secret of at least 32 characters used to derive an opaque stable web subject from the Terraria account name. Keep this unchanged after users begin linking.
- `ARKOVIA_TSHOCK_REST_URL` — optional; defaults to `http://127.0.0.1:7878`. Keep TShock REST private/loopback when possible.
- `ARKOVIA_MARKET_COOKIE_SECURE` — optional; defaults to `true`. Set to `false` only for local HTTP development.
- `ASPNETCORE_URLS` — recommended `http://127.0.0.1:5080` when fronted by Nginx/Caddy.

Run:

```bash
dotnet publish ArkoviaMarketplace.csproj -c Release -o marketplace-dist
cd marketplace-dist
ARKOVIA_TSHOCK_REST_TOKEN='...' \
ARKOVIA_MARKET_SUBJECT_SECRET='use-a-long-random-persistent-secret' \
ARKOVIA_TSHOCK_REST_URL='http://127.0.0.1:7878' \
ASPNETCORE_URLS='http://127.0.0.1:5080' \
dotnet ArkoviaMarketplace.dll
```

The current production site is served at `https://arkovia-node1.mywire.org/marketplace`.

## ARKOVIA Depot

The web app includes the four-column ARKOVIA Depot player hub, marketplace listings, the Royal Menagerie companion catalog, My Sanctuary, pet adoption/care/adventure flows, live Terraria player status, and ARKOS account integration.

## Security model

Authentication is completed with the one-time code created in Terraria by `/market auth`. The backend derives the stable opaque web subject itself, redeems the code against TShock, and then issues a signed server-side session cookie. The cookie is `HttpOnly`, `SameSite=Strict`, and `Secure` by default.

State-changing browser requests require both the authenticated session and a per-session CSRF token. Marketplace and companion mutations use idempotency keys. TShock remains authoritative for identity, ownership, balances, taxes, settlement, Terraria inventory and companion delivery.

Never commit the production TShock REST token, marketplace subject secret, wallet secret phrases, private keys, or `/etc/arkovia/marketplace.env` to this repository.
