import { Module } from "@nestjs/common";
import { CategoryController } from "./category.controller";
import { CategoryService } from "./category.service";
import { PrismaService } from "../shared/prisma/prisma.service";

@Module({
    imports: [PrismaService],
    controllers: [CategoryController],
    providers: [CategoryService],
    exports: [] 
})
export class CategoryModule {}