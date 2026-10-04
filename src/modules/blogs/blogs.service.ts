import { Prisma, BlogType, BlogStatus } from "@prisma/client";
import prisma from "../../lib/prisma";

export interface CreateBlogInput {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage?: string;
  type: BlogType;
  status?: BlogStatus;
  tags?: string[];
  categoryId: string;
  authorName?: string;
  publishedAt?: Date;
}

export interface UpdateBlogInput {
  title?: string;
  slug?: string;
  excerpt?: string;
  content?: string;
  coverImage?: string;
  type?: BlogType;
  status?: BlogStatus;
  tags?: string[];
  categoryId?: string;
  authorName?: string;
  publishedAt?: Date;
}

export const createBlog = (data: CreateBlogInput) => {
  return prisma.blog.create({ data });
};

export const listBlogs = (params: {
  skip: number;
  limit: number;
  type?: BlogType;
  categoryId?: string;
  status?: BlogStatus;
}) => {
  const where: Prisma.BlogWhereInput = {};
  if (params.type) where.type = params.type;
  if (params.categoryId) where.categoryId = params.categoryId;
  if (params.status) where.status = params.status;

  return Promise.all([
    prisma.blog.findMany({
      where,
      skip: params.skip,
      take: params.limit,
      orderBy: { createdAt: "desc" },
      include: { category: true },
    }),
    prisma.blog.count({ where }),
  ]);
};

export const getBlogById = (id: string) => {
  return prisma.blog.findUnique({ where: { id }, include: { category: true } });
};

export const getBlogBySlug = (slug: string) => {
  return prisma.blog.findUnique({ where: { slug }, include: { category: true } });
};

export const getCategoryById = (id: string) => {
  return prisma.blogCategory.findUnique({ where: { id } });
};

export const updateBlog = (id: string, data: UpdateBlogInput) => {
  return prisma.blog.update({ where: { id }, data });
};

export const deleteBlog = (id: string) => {
  return prisma.blog.delete({ where: { id } });
};
