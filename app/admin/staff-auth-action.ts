"use server";

import { redirect } from "next/navigation";
import { getStaffUser } from "@/app/chatgpt-auth";
import {
  isCorrectStaffPassword,
  startStaffSession,
} from "@/app/admin/staff-session";

export type StaffPasswordState = {
  error: string;
};

export async function authenticateStaff(
  _previousState: StaffPasswordState,
  formData: FormData,
): Promise<StaffPasswordState> {
  const user = await getStaffUser();
  if (!user) {
    return { error: "Natapos ang iyong sign-in. Paki-refresh ang pahina." };
  }

  const password = formData.get("password");
  if (
    typeof password !== "string" ||
    !(await isCorrectStaffPassword(password))
  ) {
    return { error: "Mali ang password. Pakisubukan muli." };
  }

  await startStaffSession(user.email);
  redirect("/admin");
}
