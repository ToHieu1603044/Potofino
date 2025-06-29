import {
  CategoryListResponse,
  CategoryResponse,
  CategoryServiceController,
  CategoryServiceControllerMethods,
  CategoryTreeResponse,
  CreateCategoryRequest,
  DeleteCategoryRequest,
  GetCategoryRequest,
  ListCategoriesRequest,
  UpdateCategoryRequest,
} from "@auth-microservices/shared/types";
import { Controller } from "@nestjs/common";
import { Observable } from "rxjs";
import { CategoryService } from "./category.service";

@CategoryServiceControllerMethods()
@Controller("categories")
export class CategoryController implements CategoryServiceController {
  constructor(private readonly categoryService: CategoryService) { }

  async createCategory(
    request: CreateCategoryRequest,
  ): Promise<CategoryResponse> {
    return this.categoryService.createCategory(request);
  }

  async updateCategory(
    request: UpdateCategoryRequest
  ): Promise<CategoryResponse> {
    return this.categoryService.updateCategory(request);
  }

  async deleteCategory(
    request: DeleteCategoryRequest,
  ): Promise<CategoryResponse> {
    return this.categoryService.deleteCategory(request);
  }

  async getCategory(
    request: GetCategoryRequest,
  ): Promise<CategoryResponse> {
    return this.categoryService.getCategory(request);
  }

  async listCategories(
    request: ListCategoriesRequest,
  ): Promise<CategoryListResponse> {
    return this.categoryService.listCategories(request);
  }

  async getCategoryTree(
    request: any,
  ): Promise<CategoryTreeResponse> {
    return this.categoryService.getCategoryTree();
  }
}
