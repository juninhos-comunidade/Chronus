function Header() {
  return (
    <header className="h-20 flex justify-between items-center px-15 font-urbanist">
      <img src="/images/logo-chronus.svg" alt="Logo Chronus" className="w-42" />

      <nav className="space-x-10">
        <a href="">Inicio</a>
        <a href="">Sobre</a>
        <a href="">Soluções</a>
        <a href="">Funcionalidades</a>
      </nav>

      <button
        type="submit"
        style={{ borderRadius: "5px 20px 5px 20px" }}
        className="bg-primary-yellow p-1 w-30 font-bold text-black hover:bg-yellow-500 transition-colors duration-300 cursor-pointer"
      >
        Entrar
      </button>
    </header>
  );
}

export default Header;
