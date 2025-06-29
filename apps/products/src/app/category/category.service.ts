import { Injectable } from "@nestjs/common";
import { PrismaService } from "../shared/prisma/prisma.service";
import { CategoryListResponse, CategoryResponse, CategoryTreeResponse, CreateCategoryRequest, DeleteCategoryRequest, GetCategoryRequest, ListCategoriesRequest, UpdateCategoryRequest } from "@auth-microservices/shared/types";
import { Category } from "@prisma/client";

@Injectable()
export class CategoryService {
    constructor(private readonly prisma: PrismaService) {

    }

    async createCategory(request: CreateCategoryRequest): Promise<CategoryResponse> {
        const data = await this.prisma.category.create({
            data: {
                name: request.name,
                slug: request.slug,
                image: request.image,
                active: request.active,
                parentId: request.parentId || '',
            },
        });

        return {
            category: {
                ...data,
                parentId: data.parentId ?? '',
                deletedAt: data.deletedAt ? data.deletedAt.toISOString() : '',
                children: [],
            },
        };

    }
    async updateCategory(request: UpdateCategoryRequest): Promise<CategoryResponse> {

        const data = await this.prisma.category.update({
            where: {
                id: request.id || '',
            },
            data: {
                name: request.name,
                slug: request.slug,
                image: request.image,
                active: request.active,
                parentId: request.parentId || '',
            },
        });
        return Promise.resolve({
            category: {
                ...data,
                parentId: data.parentId ?? '',
                deletedAt: data.deletedAt ? data.deletedAt.toISOString() : '',
                children: [],
            },
        })
    }
    async deleteCategory(request: DeleteCategoryRequest): Promise<CategoryResponse> {
        const data = await this.prisma.category.delete({
            where: {
                id: request.id || '',
            },
        });
        return
    }
    async getCategory(request: GetCategoryRequest): Promise<CategoryResponse> {
        const data = await this.prisma.category.findUnique({
            where: {
                id: request.id || '',
            },
        });
        return Promise.resolve({
            category: {
                ...data,
                parentId: data.parentId ?? '',
                deletedAt: data.deletedAt ? data.deletedAt.toISOString() : '',
                children: [],
            },
        })
    }
    async listCategories(request: ListCategoriesRequest): Promise<CategoryListResponse> {
        const {
            page = 1,
            limit = 10,
            keyword,
            active,
        } = request;
        const where: any = {};

        if (keyword) {
            where.OR = [
                { name: { contains: keyword, mode: "insensitive" } },
                { slug: { contains: keyword, mode: "insensitive" } },
            ];
        }

        if (typeof active !== "undefined") {
            where.active = active;
        }

        const skip = (page - 1) * limit;

        const data = await this.prisma.category.findMany({
            where,
            skip,
            take: limit,
        });

        const total = await this.prisma.category.count({ where });

        const categories = data.map((category) => ({
            id: category.id,
            name: category.name,
            slug: category.slug,
            image: category.image ?? '',
            active: category.active,
            parentId: category.parentId ?? '',
            deletedAt: category.deletedAt ? category.deletedAt.toISOString() : '',
            children: [],
        }));
        return {
            categories,
            total,
        };
    }
    async getCategoryTree(): Promise<CategoryTreeResponse> {
        const categories = await this.prisma.category.findMany({
            where: { deletedAt: null }, 
            orderBy: { name: 'asc' },
        });

        const map = new Map<string, any>();

        const result: any[] = [];

        for (const category of categories) {
            const node = {
                id: category.id,
                name: category.name,
                slug: category.slug,
                image: category.image ?? '',
                active: category.active,
                parentId: category.parentId ?? '',
                deletedAt: category.deletedAt ? category.deletedAt.toISOString() : '',
                children: [],
            };

            map.set(category.id, node);
        }

        for (const node of map.values()) {
            if (node.parentId && map.has(node.parentId)) {
                map.get(node.parentId).children.push(node);
            } else {
                result.push(node); 
            }
        }

        return {
            categories: result,
        };
    }

}