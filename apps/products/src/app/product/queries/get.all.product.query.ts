export class FindProductAllQuery {
  constructor(
    public readonly params: {
      page?: number;
      limit?: number;
      keyword?: string;
      brandId?: string;
      categoryId?: string;
      sort?: string; 
    }
  ) {}
}
