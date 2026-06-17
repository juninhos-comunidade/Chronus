import { useState } from "react";

function Login() {
  const [isRegister, setIsRegister] = useState(false);

  return (
    <section className="flex h-screen w-screen items-center justify-center overflow-hidden">
      <div className="flex flex-col max-md:mx-4 p-8 max-w-5xl w-fit items-center justify-between gap-10 rounded-lg bg-gray-dark">
        <article className="flex flex-col gap-4">
          <img
            src="/images/logo-chronus.svg"
            alt="Logo Chronus"
            className="w-42 mx-auto"
          />
          <h1>{isRegister ? "Criar Conta" : "Bem-vindo(a)!"}</h1>
          <p className="text-lg">
            {isRegister
              ? "Preencha os dados abaixo para criar sua conta."
              : "Entre na sua conta para continuar produzindo."}
          </p>
        </article>

        <article className="flex flex-col gap-4 w-full max-w-sm">
          <form className="flex flex-col space-y-4">
            {isRegister && (
              <>
                <label htmlFor="name" className="text-sm font-semibold">
                  Nome
                </label>
                <input
                  name="name"
                  type="text"
                  placeholder="Seu nome completo"
                  className="rounded-lg bg-gray-mid py-1 px-2 w-full text-white focus:outline-none focus:ring-2 focus:ring-primary-yellow"
                />
              </>
            )}

            <label htmlFor="email" className="text-sm font-semibold">
              Email
            </label>
            <input
              name="email"
              type="email"
              placeholder="Email"
              className="rounded-lg bg-gray-mid py-1 px-2 w-full text-white focus:outline-none focus:ring-2 focus:ring-primary-yellow"
            />

            <label htmlFor="password" className="text-sm font-semibold">
              Senha
            </label>
            <input
              name="password"
              type="password"
              placeholder="Senha"
              className="rounded-lg bg-gray-mid py-1 px-2 w-full text-white focus:outline-none focus:ring-2 focus:ring-primary-yellow"
            />

            {isRegister && (
              <>
                <label
                  htmlFor="confirmPassword"
                  className="text-sm font-semibold"
                >
                  Confirmar Senha
                </label>
                <input
                  name="confirmPassword"
                  type="password"
                  placeholder="Confirme sua senha"
                  className="rounded-lg bg-gray-mid py-1 px-2 w-full text-white focus:outline-none focus:ring-2 focus:ring-primary-yellow"
                />
              </>
            )}

            {!isRegister && (
              <p className="text-sm text-gray-light hover:text-white cursor-pointer self-end">
                Esqueceu sua senha?
              </p>
            )}

            <footer className="mt-8">
              <article className="flex gap-4 items-center justify-center">
                <button
                  type="button"
                  style={{ borderRadius: "5px 20px 5px 20px" }}
                  onClick={() => setIsRegister(!isRegister)}
                  className="rounded-full p-1 w-30 font-bold hover:text-black hover:bg-yellow-500 transition-colors duration-300 cursor-pointer"
                >
                  {isRegister ? "Voltar" : "Cadastre-se"}
                </button>

                <button
                  type="submit"
                  style={{ borderRadius: "5px 20px 5px 20px" }}
                  className="bg-primary-yellow p-1 w-30 font-bold text-black hover:bg-yellow-500 transition-colors duration-300 cursor-pointer"
                >
                  {isRegister ? "Criar Conta" : "Entrar"}
                </button>
              </article>

              {!isRegister && (
                <>
                  <div className="flex items-center w-full my-6">
                    <div className="flex-1 border-t border-zinc-700" />

                    <span className="px-4 text-zinc-300 text-sm font-light">
                      Continue com
                    </span>

                    <div className="flex-1 border-t border-zinc-700" />
                  </div>

                  <button className="bg-white rounded-full p-1 w-full text-black flex justify-center items-center gap-2 hover:bg-gray-300 transition-colors duration-300 cursor-pointer">
                    <img
                      src="/images/google-icon-logo.svg"
                      alt="Logo Google"
                      className="w-5"
                    />
                    <p>Google</p>
                  </button>
                </>
              )}
            </footer>
          </form>
        </article>
      </div>
    </section>
  );
}

export default Login;
