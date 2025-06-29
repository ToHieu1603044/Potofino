import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { CreateBrandCommand } from "../create-brand.command";
import { IBrandRepository } from "../../../domain/repositories/brand.repository.interface";
import { BrandAggregate } from "../../../domain/aggregates/brand.aggregate";

@CommandHandler(CreateBrandCommand)
export class CreateBrandHandler implements ICommandHandler<CreateBrandCommand>{
    constructor(private readonly brandRepository: IBrandRepository){
    }
    async execute(command: CreateBrandCommand): Promise<any> {
        const brand = BrandAggregate.create({
            id: command.id,
            name: command.name,
            isActive: command.isActive,
            logo: command.logo,
            description: command.description,
        });
        return await this.brandRepository.save(brand);
    }
    
}