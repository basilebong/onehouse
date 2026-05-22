import { RouterProvider } from "@tanstack/react-router";
import { ThemeProvider } from "next-themes";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { Toaster } from "@/components/ui/sonner";
import { router } from "@/router";

import "@/styles.css";

const mount = document.getElementById("root");
if (mount === null) throw new Error("Missing #root element in index.html");

createRoot(mount).render(
  <StrictMode>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <RouterProvider router={router} />
      <Toaster richColors closeButton />
    </ThemeProvider>
  </StrictMode>,
);
