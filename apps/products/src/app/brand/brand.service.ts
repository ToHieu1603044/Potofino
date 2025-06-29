import { Injectable } from "@nestjs/common";
import { CommandBus } from "@nestjs/cqrs";
import { CreateBrandCommand } from "./application/command/create-brand.command";

@Injectable()
export class BrandService {
    constructor(
        private readonly commandBus: CommandBus
    ) {}

    createBrand(dto: any) {
        return this.commandBus.execute(new CreateBrandCommand(dto.id, dto.name, dto.isActive, dto.logo, dto.description));

    }
}