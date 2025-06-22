
import {
  Controller,
  Post,
  Body,
  Get,
  Query,
} from '@nestjs/common';
import { CreateProductDto } from './dto/create.product.dto';
import { ProductService } from './product.service';
import { CreateProductRequest, GetAllProductsRequest } from '@auth-microservices/shared/types';

@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  async createProduct(@Body() dto: CreateProductDto) {
    return this.productService.createProduct(dto as CreateProductRequest);
  }

  @Get()
  async getProducts(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('keyword') keyword = '',
    @Query('brandId') brandId = '',
    @Query('categoryId') categoryId = '',
    @Query('sort') sort = '',
  ) {
    const request: GetAllProductsRequest = {
      page: Number(page),
      limit: Number(limit),
      keyword,
      brandId,
      categoryId,
      sort,
    };

    return this.productService.getAllProducts(request);
  }
}
