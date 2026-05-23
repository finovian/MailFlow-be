import { prisma } from "../../lib/prisma.js";
import { generateUniqueSlug } from "../../services/slug.service.js";
import { extractPlaceholders } from "../../services/placeholder.service.js";
import { renderEmail } from "../../services/email-render.service.js";
import { sendEmail } from "../../services/resend.service.js";
import { NotFoundError } from "../../utils/errors.js";
import {
  buildPaginationArgs,
  buildPaginatedResponse,
} from "../../services/pagination.service.js";
import { createModuleLogger } from "../../lib/logger.js";
import type {
  CreateTemplateInput,
  UpdateTemplateInput,
  TestSendInput,
  TemplateListQuery,
} from "./template.types.js";
import type { Prisma } from "@prisma/client";

const log = createModuleLogger("template-service");

export async function create(userId: string, data: CreateTemplateInput) {
  const slug = await generateUniqueSlug(data.name, async (candidateSlug) => {
    const existing = await prisma.template.findUnique({
      where: { userId_slug: { userId, slug: candidateSlug } },
      select: { id: true },
    });
    return existing !== null;
  });

  const variables = extractPlaceholders(`${data.subject} ${data.bodyHtml}`);

  const template = await prisma.template.create({
    data: {
      userId,
      name: data.name,
      slug,
      subject: data.subject,
      bodyHtml: data.bodyHtml,
      description: data.description ?? null,
      variables,
      status: data.status,
    },
  });

  log.info({ templateId: template.id, slug }, "Template created");
  return template;
}

export async function list(userId: string, query: TemplateListQuery) {
  const { page = 1, limit = 20, search, status } = query;

  const where: Prisma.TemplateWhereInput = { userId };

  if (status) {
    where.status = status;
  } else {
    // By default, exclude archived templates
    where.status = { not: "ARCHIVED" };
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { subject: { contains: search, mode: "insensitive" } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.template.findMany({
      where,
      ...buildPaginationArgs(page, limit),
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        slug: true,
        subject: true,
        description: true,
        status: true,
        variables: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.template.count({ where }),
  ]);

  return buildPaginatedResponse(items, total, page, limit);
}

export async function getById(userId: string, id: string) {
  const template = await prisma.template.findFirst({
    where: { id, userId },
  });

  if (!template) {
    throw new NotFoundError("Template", id);
  }

  return template;
}

export async function update(userId: string, id: string, data: UpdateTemplateInput) {
  const existing = await prisma.template.findFirst({
    where: { id, userId },
    select: { id: true, name: true, slug: true, subject: true, bodyHtml: true },
  });

  if (!existing) {
    throw new NotFoundError("Template", id);
  }

  const updateData: Prisma.TemplateUpdateInput = { ...data };

  // Re-generate slug if name changed
  if (data.name && data.name !== existing.name) {
    updateData.slug = await generateUniqueSlug(data.name, async (candidateSlug) => {
      const collision = await prisma.template.findFirst({
        where: {
          userId,
          slug: candidateSlug,
          id: { not: id },
        },
        select: { id: true },
      });
      return collision !== null;
    });
  }

  // Re-extract variables if subject or bodyHtml changed
  if (data.subject || data.bodyHtml) {
    const subject = data.subject ?? existing.subject;
    const bodyHtml = data.bodyHtml ?? existing.bodyHtml;
    updateData.variables = extractPlaceholders(`${subject} ${bodyHtml}`);
  }

  const template = await prisma.template.update({
    where: { id },
    data: updateData,
  });

  log.info({ templateId: id }, "Template updated");
  return template;
}

export async function archive(userId: string, id: string) {
  const existing = await prisma.template.findFirst({
    where: { id, userId },
    select: { id: true },
  });

  if (!existing) {
    throw new NotFoundError("Template", id);
  }

  const template = await prisma.template.update({
    where: { id },
    data: { status: "ARCHIVED" },
  });

  log.info({ templateId: id }, "Template archived");
  return template;
}

export async function testSend(userId: string, id: string, input: TestSendInput) {
  const template = await getById(userId, id);

  const rendered = renderEmail(
    { subject: template.subject, bodyHtml: template.bodyHtml },
    input.mockPayload,
  );

  const result = await sendEmail({
    to: input.recipientEmail,
    subject: rendered.subject,
    html: rendered.html,
  });

  log.info(
    { templateId: id, recipientEmail: input.recipientEmail, success: result.success },
    "Test send completed",
  );

  return {
    recipientEmail: input.recipientEmail,
    subject: rendered.subject,
    success: result.success,
    messageId: result.messageId,
    error: result.error,
  };
}
