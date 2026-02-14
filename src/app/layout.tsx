import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "项目管理系统",
  description: "企业级项目管理解决方案",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
