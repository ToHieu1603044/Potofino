import { AggregateRoot } from "@nestjs/cqrs";

export interface BrandProps {
    id: string;
    name: string;
    isActive: boolean;
    logo: string;
    description?: string;
    createdAt: Date;
    updatedAt: Date;
}
export class BrandAggregate extends AggregateRoot {
    private constructor(private readonly props: BrandProps) {
        super();
    }
    static create(props: Omit<BrandProps, 'createdAt'| 'updatedAt'>): BrandAggregate {
        const now = new Date();
        return new BrandAggregate({
            ...props,
            createdAt: now,
            updatedAt: now
        });
    }
    static rehydrate(props: BrandProps): BrandAggregate {
        return new BrandAggregate(props);
    }

    //Getters
    getId(): string {
        return this.props.id;
    }
    getName(): string{
        return this.props.name;
    }
    getIsActive(): boolean{
        return this.props.isActive;
    }
    getLogo(): string{
        return this.props.logo;
    }
    getDescription(): string{
        return this.props.description;
    }
    getCreatedAt(): Date{
        return this.props.createdAt;
    }
    getUpdatedAt(): Date{
        return this.props.updatedAt;
    }

    rename(name: string) {
        this.props.name = name;
        this.touch()
    }
    deactivate() {
        this.props.isActive = false;
        this.touch()
    }
    activate() {
        this.props.isActive = true;
        this.touch()
    }
    updateLogo(logo: string) {
        this.props.logo = logo;
        this.touch()
    }
    updateDescription(description: string) {
        this.props.description = description;
        this.touch()
    }
    
    private touch() {
        this.props.updatedAt = new Date();
    }
    

}
