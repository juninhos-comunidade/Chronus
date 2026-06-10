import { Link } from "react-router";
import logo from "../../../public/logo-footer.png";

export default function Footer() {
  return (
    <footer className="flex flex-col w-full items-center md:items-baseline gap-4 bg-yellow py-7.5 px-15 bg-primary-yellow text-black md:gap-7.5">
      <div className="flex flex-col items-center gap-4 justify-center md:w-full md:flex-row md:justify-between md:items-center">
        <img src={logo} alt="logo-footer" className="mr-9 w-30 md:w-42 md:mr-0" />
        <div className="flex flex-col items-center font-primary leading-6.25 text-[16px] gap-3.5 md:gap-10 md:flex-row md:text-[20px] md:leading-normal">
          <Link to="/">Privacidade</Link>
          <Link to="/">Termos e Serviços</Link>
          <Link to="/">Contato</Link>
        </div>
      </div>
      <div className="font-primary text-gray-mid leading-6.25 text-[16px] md:text-[20px] md:leading-normal">
        <p>© 2026 Chronus. Todos os direitos reservados.</p>
      </div>
    </footer>
  );
}
