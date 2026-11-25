import './Forms/Autenticacao.css'
import './Cadastro.css'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

const url = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '');

function Cadastro(){
    const navigate = useNavigate();
    const [erro, setErro] = useState('');
    const [enviando, setEnviando] = useState(false);

    async function cadastrar(e){
        e.preventDefault()
        let usuario = {
            nome_usuario: e.target.nome_usuario.value,
            email: e.target.email.value,
            senha: e.target.senha.value,
            descricao: e.target.descricao.value || null
        };
        setErro('')
        setEnviando(true)
        try{
            const r = await fetch(url+'/usuarios', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(usuario)
            })
            const resposta = await r.json().catch(()=>null);
            if(!r.ok){
                throw new Error(resposta?.msg || 'Erro na requisicao ('+r.status+')')
            }
            navigate('/login')
        } catch (error){
            setErro(error.message)
        } finally{
            setEnviando(false)
        }
    }
    return(
        <div className="auth-layout cadastro">
            <div className="auth-arte">
                <img className="auth-foto" src="/Imagens/cadastro-kane.jpg" alt="Harry Kane"/>
            </div>
            <section className="autenticacao card">
                <h1>Cadastro</h1>
                <p>Faça parte da comunidade do camisa 9.</p>
                {erro && <p className="erro" role="alert">{erro}</p>}
                <form onSubmit={cadastrar}>
                    <label>Nome de usuário<input name="nome_usuario" maxLength={255} required/></label>
                    <label>Email<input type="email" name="email" maxLength={255} required/></label>
                    <label>Senha<input name="senha" type="password" minLength={8} maxLength={72} autoComplete="new-password" required/></label>
                    <label>Descrição (opcional)<textarea name="descricao" maxLength={500}/></label>
                    <button disabled={enviando}>{enviando ? 'Cadastrando...' : 'Criar conta'}</button>
                </form>
                <p>Já possui uma conta? <Link to="/login">Entrar</Link></p>
            </section>
        </div>
    )
}
export default Cadastro
