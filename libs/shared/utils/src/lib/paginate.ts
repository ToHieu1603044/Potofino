import { Prisma } from '@prisma/client';

type PaginateOptions<T extends Prisma.ModelName> = {
  model: T;
  where?: any;
  orderBy?: any;
  page?: number;
  limit?: number;
  include?: any;
  select?: any;
};

type PaginateResult<T> = {
  data: T[];
  total: number;
};

export async function paginate<
  T extends Prisma.ModelName,
  R = any
>(
  prisma: Prisma.TypeMap['model'][T]['operations']['findMany']['args'] extends { select: infer S }
    ? Prisma.TypeMap['model'][T]['operations']['findMany']['args']
    : any,
  client: any, // PrismaService instance
  options: PaginateOptions<T>
): Promise<PaginateResult<R>> {
  const {
    model,
    where = {},
    orderBy = { createdAt: 'desc' },
    page = 1,
    limit = 10,
    include,
    select,
  } = options;

  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    client[model].findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include,
      select,
    }),
    client[model].count({ where }),
  ]);

  return {
    data,
    total,
  };
}
