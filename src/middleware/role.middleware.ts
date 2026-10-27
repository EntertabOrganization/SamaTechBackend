import { NextFunction, Request, Response } from "express";
import { UserRole } from "@prisma/client";
import prisma from "../lib/prisma";

/**
 * Lets the request through only when the signed-in user (from
 * `authMiddleware`) has one of `roles`. ADMIN is always allowed. The role is
 * read from the database, so a role change or a deleted account takes effect
 * immediately instead of when the 7-day token expires.
 */
export const requireRole =
  (...roles: UserRole[]) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user
        ? await prisma.user.findUnique({ where: { id: req.user.id }, select: { role: true } })
        : null;
      if (!user) {
        res.status(401).json({ error: "Not authenticated" });
        return;
      }
      if (user.role !== "ADMIN" && !roles.includes(user.role)) {
        res.status(403).json({ error: "You don't have permission to do this" });
        return;
      }
      req.user!.role = user.role;
      next();
    } catch (err) {
      next(err);
    }
  };

export const requireAdmin = requireRole("ADMIN");
