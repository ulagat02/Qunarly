"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const swagger_1 = require("@nestjs/swagger");
const app_module_1 = require("./app.module");
const http_exception_filter_1 = require("./common/http-exception.filter");
const express = require("express");
const path = require("path");
const safeDbFingerprint = (databaseUrl) => {
    if (!databaseUrl) {
        return 'DB: missing DATABASE_URL';
    }
    try {
        const url = new URL(databaseUrl);
        const schema = url.searchParams.get('schema') || 'public';
        const host = url.hostname || 'unknown';
        const port = url.port || '5432';
        const db = url.pathname.replace(/^\//, '') || 'unknown';
        return `DB: host=${host} port=${port} db=${db} schema=${schema}`;
    }
    catch (error) {
        return 'DB: invalid DATABASE_URL';
    }
};
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const bootstrapLogger = new common_1.Logger('Bootstrap');
    bootstrapLogger.log(safeDbFingerprint(process.env.DATABASE_URL));
    app.useGlobalFilters(new http_exception_filter_1.AllExceptionsFilter());
    app.enableCors({
        origin: true,
        credentials: true,
    });
    const logger = new common_1.Logger('HTTP');
    app.use((req, res, next) => {
        const start = Date.now();
        res.on('finish', () => {
            const ms = Date.now() - start;
            logger.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${ms}ms`);
        });
        next();
    });
    const uploadsDir = path.resolve(process.cwd(), 'uploads');
    app.use('/uploads', express.static(uploadsDir));
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        exceptionFactory: (errors) => new common_1.UnprocessableEntityException({
            message: 'Validation failed',
            errors: errors.map((error) => ({
                field: error.property,
                constraints: error.constraints,
            })),
        }),
    }));
    const config = new swagger_1.DocumentBuilder()
        .setTitle('Qunarly API')
        .setDescription('Qunarly Agritech Platform MVP')
        .setVersion('0.1.0')
        .addBearerAuth()
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    document.security = [{ bearerAuth: [] }];
    swagger_1.SwaggerModule.setup('api', app, document);
    const port = process.env.PORT ? Number(process.env.PORT) : 3000;
    await app.listen(port, '0.0.0.0');
    bootstrapLogger.log(`Application is running on: http://0.0.0.0:${port}`);
}
bootstrap();
//# sourceMappingURL=main.js.map