import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { HelpChat } from "@/components/HelpChat";

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main className="min-h-[calc(100vh-4rem)]">{children}</main>
      <Footer />
      <HelpChat />
    </>
  );
}
