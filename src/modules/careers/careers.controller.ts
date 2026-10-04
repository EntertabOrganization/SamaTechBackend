import { Request, Response } from "express";
import { CareerApplicationStatus } from "@prisma/client";
import { asyncHandler } from "../../utils/asyncHandler";
import { ApiError } from "../../utils/ApiError";
import { getPagination, buildPaginatedResult } from "../../utils/pagination";
import * as service from "./careers.service";

const VALID_STATUSES: CareerApplicationStatus[] = [
  "PENDING",
  "REVIEWED",
  "REJECTED",
  "HIRED",
];

const REQUIRED_FIELDS = [
  "firstName",
  "lastName",
  "email",
  "phone",
  "address",
  "city",
  "country",
  "expectedSalary",
  "position",
  "startDate",
] as const;

export const createCareerApplication = asyncHandler(
  async (req: Request, res: Response) => {
    const body = req.body ?? {};
    const files = req.files as
      | { [fieldname: string]: Express.Multer.File[] }
      | undefined;

    const missing = REQUIRED_FIELDS.filter((field) => !body[field]);
    if (missing.length > 0) {
      throw new ApiError(400, `Missing required fields: ${missing.join(", ")}`);
    }

    const resumeFile = files?.resume?.[0];
    const coverLetterFile = files?.coverLetter?.[0];

    if (!resumeFile || !coverLetterFile) {
      throw new ApiError(400, "Both resume and coverLetter files are required");
    }

    const startDate = new Date(body.startDate);
    if (isNaN(startDate.getTime())) {
      throw new ApiError(400, "startDate must be a valid date");
    }

    const application = await service.createCareerApplication({
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email,
      phone: body.phone,
      address: body.address,
      city: body.city,
      country: body.country,
      expectedSalary: body.expectedSalary,
      position: body.position,
      startDate,
      resumeUrl: `uploads/${resumeFile.filename}`,
      coverLetterUrl: `uploads/${coverLetterFile.filename}`,
    });

    res.status(201).json(application);
  }
);

export const listCareerApplications = asyncHandler(
  async (req: Request, res: Response) => {
    const { page, limit, skip } = getPagination(req);
    const statusQuery = req.query.status as string | undefined;

    let status: CareerApplicationStatus | undefined;
    if (statusQuery) {
      if (!VALID_STATUSES.includes(statusQuery as CareerApplicationStatus)) {
        throw new ApiError(400, `status must be one of: ${VALID_STATUSES.join(", ")}`);
      }
      status = statusQuery as CareerApplicationStatus;
    }

    const [data, total] = await service.listCareerApplications({
      skip,
      limit,
      status,
    });

    res.status(200).json(buildPaginatedResult(data, total, page, limit));
  }
);

export const getCareerApplication = asyncHandler(
  async (req: Request, res: Response) => {
    const application = await service.getCareerApplicationById(req.params.id);
    if (!application) {
      throw new ApiError(404, "Career application not found");
    }
    res.status(200).json(application);
  }
);

export const updateCareerApplication = asyncHandler(
  async (req: Request, res: Response) => {
    const existing = await service.getCareerApplicationById(req.params.id);
    if (!existing) {
      throw new ApiError(404, "Career application not found");
    }

    const { status } = req.body ?? {};
    if (status && !VALID_STATUSES.includes(status)) {
      throw new ApiError(400, `status must be one of: ${VALID_STATUSES.join(", ")}`);
    }

    const application = await service.updateCareerApplication(req.params.id, {
      status,
    });
    res.status(200).json(application);
  }
);

export const deleteCareerApplication = asyncHandler(
  async (req: Request, res: Response) => {
    const existing = await service.getCareerApplicationById(req.params.id);
    if (!existing) {
      throw new ApiError(404, "Career application not found");
    }
    await service.deleteCareerApplication(req.params.id);
    res.status(200).json({ message: "Career application deleted" });
  }
);
