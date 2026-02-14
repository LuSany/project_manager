import { redirect } from "next/navigation";

export default function HomePage() {
  // 重定向到工作台
  redirect("/dashboard");
}
