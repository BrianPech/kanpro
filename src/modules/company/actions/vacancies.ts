"use server"

import { revalidatePath } from "next/cache"

/**
 * Revalidates the cache for the vacancies dashboard page.
 */
export async function revalidateVacancies() {
  revalidatePath("/dashboard/company/vacancies")
  revalidatePath("/dashboard/candidate/discovery")
  revalidatePath("/")
}
