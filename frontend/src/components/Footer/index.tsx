function Footer() {
  return (
    <footer className="absolute bottom-0 bg-primary-yellow w-full text-black min-h-39 flex flex-col px-15 justify-center gap-7.5 font-urbanist">
      <div className="flex justify-between items-center">
        <img
          src="/images/logo-chronus-black.svg"
          alt="Logo Chronus"
          className="w-42"
        />

        <ul className="flex gap-10">
          <li className="cursor-pointer">Privacidade</li>
          <li className="cursor-pointer">Termos e Serviços</li>
          <li className="cursor-pointer">Contato</li>
        </ul>
      </div>

      <p>© 2026 Chronus. Todos os direitos reservados.</p>
    </footer>
  );
}

export default Footer;
