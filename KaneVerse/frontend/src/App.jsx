import { useState, useEffect } from 'react'
import { Link, NavLink, Route, Routes, Navigate } from 'react-router-dom'
import Login from './Login'
import Cadastro from './Cadastro'
import Home from './Home'
import Perfil from './Perfil'
import Ranking from './Ranking'
import Titulos from './Titulos'
import Estatisticas from './Estatisticas'
import HomeAdm from './Administrador/HomeAdm'

import './App.css'

const url = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '');

function App(){
    const [usuario, setUsuario] = useState(null);
    const [carregando, setCarregando] = useState(!!localStorage.getItem('token'));
    const [erro, setErro] = useState('');
    const [versao, setVersao] = useState(0);

    async function getUsuario(){
        const token = localStorage.getItem('token');
        if(!token){
            setUsuario(null)
            setCarregando(false)
            return;
        }
        try{
            const r = await fetch(url+'/usuarios/me', {
                headers: {Authorization: 'Bearer '+token}
            })
            const dados = await r.json().catch(()=>null);
            if(!r.ok){
                const erro = new Error(dados?.msg || 'Erro na requisicao ('+r.status+')');
                erro.status = r.status;
                throw erro;
            }
            if(localStorage.getItem('token') !== token){
                return;
            }
            setUsuario(dados)
            setErro('')
            setVersao(v=>v+1)
        } catch (error){
            if(localStorage.getItem('token') !== token){
                return;
            }
            if(error.status === 401 || error.status === 403){
                localStorage.removeItem('token')
                setUsuario(null)
            }
            setErro(error.message)
        } finally{
            setCarregando(false)
        }
    }
    useEffect(()=>{
        getUsuario()
    },[])

    function entrar(dados){
        localStorage.setItem('token', dados.token);
        setUsuario(dados.usuario)
        setErro('')
    }
    function sair(){
        localStorage.removeItem('token');
        setUsuario(null)
        setErro('')
    }
    if(carregando){
        return <p className="carregando">Carregando KaneVerse...</p>
    }
    return(
        <>
            <header className="topo">
                <Link to="/" className="marca"><span className="numero">9</span><span>KaneVerse</span></Link>
                <nav>
                    <NavLink to="/" end>Feed</NavLink>
                    <NavLink to="/noticias">Notícias</NavLink>
                    <NavLink to="/estatisticas">Estatísticas</NavLink>
                    <NavLink to="/ranking">Ranking</NavLink>
                    <NavLink to="/titulos">Títulos</NavLink>
                    {usuario && <NavLink to="/perfil">Perfil</NavLink>}
                    {usuario?.admin && <NavLink to="/admin">Admin</NavLink>}
                </nav>
                <div className="conta">
                    {usuario ? <>
                        <span>{usuario.nome_usuario} · <b>{usuario.kane_points} KP</b></span>
                        <button className="secundario" onClick={sair}>Sair</button>
                    </> : <>
                        <Link className="link-entrar" to="/login">Entrar</Link>
                        <Link className="botao" to="/cadastro">Criar conta</Link>
                    </>}
                </div>
            </header>
            <main className="pagina">
                {erro && <p role="alert" className="erro">{erro} <button className="secundario" onClick={getUsuario}>Tentar novamente</button></p>}
                <Routes>
                    <Route path="/" element={<Home key="posts" tipo="post" usuario={usuario} getUsuario={getUsuario}/>}/>
                    <Route path="/noticias" element={<Home key="noticias" tipo="noticia" usuario={usuario} getUsuario={getUsuario}/>}/>
                    <Route path="/login" element={usuario ? <Navigate to="/" replace/> : <Login entrar={entrar}/>}/>
                    <Route path="/cadastro" element={usuario ? <Navigate to="/" replace/> : <Cadastro/>}/>
                    <Route path="/perfil" element={usuario ? <Perfil key={usuario.id} usuario={usuario} getUsuario={getUsuario} sair={sair} versao={versao}/> : <Navigate to="/login" replace/>}/>
                    <Route path="/estatisticas" element={<Estatisticas/>}/>
                    <Route path="/ranking" element={<Ranking/>}/>
                    <Route path="/titulos" element={<Titulos usuario={usuario} getUsuario={getUsuario}/>}/>
                    <Route path="/admin" element={usuario?.admin ? <HomeAdm usuario={usuario} getUsuario={getUsuario}/> : <Navigate to="/" replace/>}/>
                    <Route path="*" element={<Navigate to="/" replace/>}/>
                </Routes>
            </main>
            <footer>
                <strong>KANE<span>VERSE</span></strong>
                
                <a href={url+'/documentacao'} target="_blank" rel="noreferrer">Documentação da API</a>
            </footer>
        </>
    )
}

export default App
