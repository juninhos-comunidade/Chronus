import { Link } from "react-router"

export default function BtnLogin() {
    return(
        <Link to="/login" className="bg-primary-yellow font-primary text-black font-bold text-xl px-7.5 py-2.5 rounded-tr-2xl rounded-bl-2xl rounded-tl-sm rounded-br-sm tracking-widest">
            Login
        </Link>
    )
}