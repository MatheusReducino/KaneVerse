import './Forms/Autenticacao.css'
import './Login.css'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

const url = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '');

function Login(props) {
    const navigate = useNavigate();
    const [erro, setErro] = useState('');
    const [enviando, setEnviando] = useState(false);

    async function login(e) {
        e.preventDefault()
        let usuario = {
            email: e.target.email.value,
            senha: e.target.senha.value
        };
        setEnviando(true)
        setErro('')
        try{
            const r = await fetch(url + '/usuarios/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(usuario)
            })
            const dados = await r.json().catch(() => null);
            if(!r.ok) {
                throw new Error(dados?.msg || 'Erro na requisicao (' + r.status + ')')
            }
            props.entrar(dados)
            navigate('/')
        } catch (error){
            setErro(error.message)
        } finally{
            setEnviando(false)
        }
    }
    return (
        <div className="auth-layout login">
            <div className="auth-arte">
                <img className="auth-foto" src="/Imagens/login-kane.jpg" alt="Harry Kane" />
            </div>
            <section className="autenticacao card">
                
                <h1>Login</h1>
                <p>Entre para publicar, comentar e conquistar títulos.</p>
                {erro && <p className="erro" role="alert">{erro}</p>}
                <form onSubmit={login}>
                    <label>Email<input type="email" name="email" autoComplete="email" required /></label>
                    <label>Senha<input type="password" name="senha" autoComplete="current-password" required /></label>
                    <button disabled={enviando}>{enviando ? 'Entrando...' : 'Entrar'}</button>
                </form>
                <p>Não possui uma conta? <Link to="/cadastro">Cadastre-se</Link></p>
            </section>
        </div>
    )
}
export default Login
