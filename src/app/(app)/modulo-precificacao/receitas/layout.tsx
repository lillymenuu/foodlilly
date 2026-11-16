/** Receitas e produtos: `modal` mostra a ficha técnica por cima da lista (rotas interceptadas). */
export default function Layout({
  children,
  modal,
}: LayoutProps<"/modulo-precificacao/receitas">) {
  return (
    <>
      {children}
      {modal}
    </>
  );
}
