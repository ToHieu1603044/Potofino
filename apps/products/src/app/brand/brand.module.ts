// src/brand/brand.module.ts

import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { PrismaService } from '../shared/prisma/prisma.service';
import { BrandPrismaRepository } from './infrastructure/persistence/repositories/brand.prisma.repository';
import { CreateBrandHandler } from './application/command/handlers/create-brand.handle';
import { BrandController } from './brand.controller';
import { BrandService } from './brand.service';
export const CommandHandlers = [CreateBrandHandler];
export const QueryHandlers = [];
@Module({
    imports: [CqrsModule],
    controllers: [BrandController],
    providers: [
        BrandService,
        PrismaService,
        {
            provide: 'IBrandRepository',
            useClass: BrandPrismaRepository,
        },

        ...CommandHandlers,
        ...QueryHandlers,
    ],
    exports: [],
})
export class BrandModule { }
