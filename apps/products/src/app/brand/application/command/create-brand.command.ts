export class CreateBrandCommand {
    constructor(
        public readonly id: string,
        public readonly name: string,
        public readonly isActive: boolean,
        public readonly logo: string,
        public readonly description?: string,
    ) {}
}