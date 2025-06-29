import { Controller } from "@nestjs/common";
import { GrpcMethod } from "@nestjs/microservices";
import { BrandService } from "./brand.service";

@Controller('brands')
export class BrandController {
    constructor(private readonly brandService: BrandService) {}

    @GrpcMethod('BrandService', 'CreateBrand')
    createBrand(dto: any) {
        return this.brandService.createBrand(dto);
    }
}