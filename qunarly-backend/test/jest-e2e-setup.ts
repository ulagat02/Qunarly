process.env.DATABASE_URL =
  process.env.DATABASE_URL ||
  'postgresql://postgres:postgres@localhost:5432/qunarly_test?schema=public';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'change-me-now';
process.env.JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || 'change-me-now-too';
process.env.PORT = process.env.PORT || '3001';
process.env.SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL || 'superadmin-e2e@example.com';
process.env.SUPER_ADMIN_PASSWORD = process.env.SUPER_ADMIN_PASSWORD || 'Admin123!';
process.env.SUPER_ADMIN_NAME = process.env.SUPER_ADMIN_NAME || 'Бас Әкімші';