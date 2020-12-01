# Tubo

In browser development environment with E2E encrypted shared sessions and relative file imports.

## Development

```bash
mkcert -install && mkcert -key-file snowpack.key -cert-file snowpack.crt localhost # generate credentials for HTTPS
yarn # install dependencies
yarn install # development server
```

For share feature to work [Tubo Rooms](https://github.com/jake8n/tubo-rooms) should also be running.
