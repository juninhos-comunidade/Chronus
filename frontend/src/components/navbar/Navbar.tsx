import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { Link } from "react-router";
import BtnLogin from "../btn-login/Btn-login";
import logo from "../../../public/logo-navbar.png"

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const closeMenu = () => setIsOpen(false);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeMenu();
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen]);

  return (
    <nav className="relative z-50 w-full bg-black">
      <div className="flex h-20 items-center justify-between px-4 sm:px-6 lg:px-10">
        <div>
          <img src={logo} alt="logo Chronus" className="h-8 w-auto sm:h-10" />
        </div>

        <div className="hidden gap-10 font-primary text-xl font-light text-white md:flex">
          <Link to="/">Inicio</Link>
          <Link to="/#about">Sobre</Link>
          <Link to="/#soluctions">Soluções</Link>
          <Link to="/#functionality">Funcionalidade</Link>
        </div>

        <div>
          <div className="hidden md:flex gap-10 items-center ">
            <Link
              to="/register"
              className="font-secondary text-xl font-bold tracking-wide text-white"
            >
              Cadastre-se
            </Link>
            <BtnLogin />
          </div>
        </div>

        <div className="flex items-center gap-5 md:hidden">
          <button
            type="button"
            className="text-white md:hidden"
            onClick={() => setIsOpen((open) => !open)}
            aria-expanded={isOpen}
            aria-label={isOpen ? "Fechar menu" : "Abrir menu"}
          >
            {isOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
          <BtnLogin />
        </div>
      </div>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 top-20 z-40 bg-black/50 md:hidden"
            onClick={closeMenu}
            aria-hidden="true"
          />
          <div className="absolute left-0 right-0 z-50 border-t border-white/10 bg-black px-4 py-6 md:hidden">
            <div className="flex flex-col gap-6 font-primary text-xl font-light text-white">
              <Link to="/" onClick={closeMenu}>Inicio</Link>
              <Link to="/#about" onClick={closeMenu}>Sobre</Link>
              <Link to="/#soluctions" onClick={closeMenu}>Soluções</Link>
              <Link to="/#functionality" onClick={closeMenu}>Funcionalidade</Link>
              
            </div>
          </div>
        </>
      )}
    </nav>
  );
}
