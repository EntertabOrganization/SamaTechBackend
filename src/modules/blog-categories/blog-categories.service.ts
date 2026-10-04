import prisma from "../../lib/prisma";

export interface CreateBlogCategoryInput {
  name: string;
  slug: string;
  description?: string;
}

export interface UpdateBlogCategoryInput {
  name?: string;
  slug?: string;
  description?: string;
}

export const createBlogCategory = (data: CreateBlogCategoryInput) => {
  return prisma.blogCategory.create({ data });
};

export const listBlogCategories = (params: { skip: number; limit: number }) => {
  return Promise.all([
    prisma.blogCategory.findMany({
      skip: params.skip,
      take: params.limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.blogCategory.count(),
  ]);
};

export const getBlogCategoryById = (id: string) => {
  return prisma.blogCategory.findUnique({ where: { id } });
};

export const updateBlogCategory = (id: string, data: UpdateBlogCategoryInput) => {
  return prisma.blogCategory.update({ where: { id }, data });
};

export const deleteBlogCategory = (id: string) => {
  return prisma.blogCategory.delete({ where: { id } });
};
