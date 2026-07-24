import { NextResponse } from "next/server";
import { STAFF_COOKIE_NAME } from "@/app/admin/staff-session";

export async function GET(request: Request) {
  const response = NextResponse.redirect(new URL("/", request.url));
  response.cookies.set(STAFF_COOKIE_NAME, "", {
    httpOnly: true,
    maxAge: 0,
    path: "/admin",
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
  });
  return response;
}
