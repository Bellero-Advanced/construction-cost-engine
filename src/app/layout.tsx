import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Construction Cost Engine",
  description:
    "ระบบคำนวณต้นทุนวัสดุก่อสร้างจาก TPSO, CGD และร้านค้าปลีกสมัยใหม่",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
