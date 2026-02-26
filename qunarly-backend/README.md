# Qunarly Backend

## Dev Notes

### Seed default admin

Creates an admin user if it does not exist:

- Email: `admin@qunarly.kz`
- Password: `Admin123!`
- Role: `ADMIN`

Run:

```
npm run db:seed
```

### Login payload

`POST /auth/login` expects **email + password** or **phone + password**.
