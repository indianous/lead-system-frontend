import type { NextConfig } from "next";
import path from "node:path";

// base-ds tem sua própria cópia de react/react-dom em node_modules
// (bug de packaging, ver base-ds#38), o que causa "Invalid hook call"
// sem forçar a resolução para a cópia única deste projeto.
const nextConfig: NextConfig = {
  // Sem isso, o dev server bloqueia recursos internos (HMR/RSC) quando a
  // página é acessada por uma origem que ele não reconhece automaticamente
  // (só localhost/127.0.0.1 e o IP de LAN detectado são liberados por
  // padrão) — o React nunca hidrata, o formulário de login cai para submit
  // HTML nativo (email/senha somem na URL) e parece que "o login falhou".
  allowedDevOrigins: ["100.64.251.52"],
  turbopack: {
    // base-ds é consumido via dependência de caminho local, fora da raiz
    // deste projeto (Turbopack só resolve módulos dentro da raiz) — aponta
    // para o ancestral comum entre este projeto e o base-ds.
    root: path.resolve(__dirname, "../../.."),
    resolveAlias: {
      react: "react",
      "react-dom": "react-dom",
    },
  },
};

export default nextConfig;
