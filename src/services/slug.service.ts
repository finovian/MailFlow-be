export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function generateUniqueSlug(
  name: string,
  existsFn: (slug: string) => Promise<boolean>,
): Promise<string> {
  const baseSlug = generateSlug(name);
  let slug = baseSlug;
  let suffix = 1;

  while (await existsFn(slug)) {
    slug = `${baseSlug}-${suffix}`;
    suffix++;

    if (suffix > 100) {
      throw new Error(`Unable to generate unique slug for "${name}" after 100 attempts`);
    }
  }

  return slug;
}
