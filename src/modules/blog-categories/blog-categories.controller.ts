import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ApiError } from "../../utils/ApiError";
import { getPagination, buildPaginatedResult } from "../../utils/pagination";
import * as service from "./blog-categories.service";

export const createBlogCategory = asyncHandler(
  async (req: Request, res: Response) => {
    const { name, slug, description } = req.body ?? {};

    if (!name || !slug) {
      throw new ApiError(400, "name and slug are required");
    }

    try {
      const category = await service.createBlogCategory({
        name,
        slug,
        description,
      });
      res.status(201).json(category);
    } catch (err: any) {
      if (err?.code === "P2002") {
        throw new ApiError(409, "A category with this slug already exists");
      }
      throw err;
    }
  }
);

export const listBlogCategories = asyncHandler(
  async (req: Request, res: Response) => {
    const { page, limit, skip } = getPagination(req);
    const [data, total] = await service.listBlogCategories({ skip, limit });
    res.status(200).json(buildPaginatedResult(data, total, page, limit));
  }
);

export const getBlogCategory = asyncHandler(
  async (req: Request, res: Response) => {
    const category = await service.getBlogCategoryById(req.params.id);
    if (!category) {
      throw new ApiError(404, "Blog category not found");
    }
    res.status(200).json(category);
  }
);

export const updateBlogCategory = asyncHandler(
  async (req: Request, res: Response) => {
    const existing = await service.getBlogCategoryById(req.params.id);
    if (!existing) {
      throw new ApiError(404, "Blog category not found");
    }

    const { name, slug, description } = req.body ?? {};

    try {
      const category = await service.updateBlogCategory(req.params.id, {
        name,
        slug,
        description,
      });
      res.status(200).json(category);
    } catch (err: any) {
      if (err?.code === "P2002") {
        throw new ApiError(409, "A category with this slug already exists");
      }
      throw err;
    }
  }
);

export const deleteBlogCategory = asyncHandler(
  async (req: Request, res: Response) => {
    const existing = await service.getBlogCategoryById(req.params.id);
    if (!existing) {
      throw new ApiError(404, "Blog category not found");
    }
    await service.deleteBlogCategory(req.params.id);
    res.status(200).json({ message: "Blog category deleted" });
  }
);
