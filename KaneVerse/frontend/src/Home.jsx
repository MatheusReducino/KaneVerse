import './Home.css'
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import FormPublicacao from './Forms/FormPublicacao'
import ListaPublicacoes from './Lista/ListaPublicacoes'
import Banner from './Componente/Banner'


const url = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '');

function Home(props) {
    const noticia = props.tipo === 'noticia';
    const rota = noticia ? '/noticias' : '/posts';
    const [publicacoes, setPublicacoes] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState('');
    const [editando, setEditando] = useState(null);
    const [versao, setVersao] = useState(0);
    const usuario = props.usuario;
    const podePublicar = usuario && (!noticia || usuario.admin);

    async function getPublicacoes() {
        try{
            const r = await fetch(url + rota)
            const dados = await r.json().catch(() => null);
            if(!r.ok) {
                throw new Error(dados?.msg || 'Erro na requisicao (' + r.status + ')')
            }
            setPublicacoes(dados)
            setVersao(v => v + 1)
        } catch (error){
            setErro(error.message)
        } finally{
            setCarregando(false)
        }
    }
    useEffect(()=>{
        getPublicacoes()
    }, [rota])

    async function salvar(dados, foto, publicacao) {
        const token = localStorage.getItem('token');
        const r = await fetch(url + (publicacao ? rota + '/' + publicacao.id : rota), {
            method: publicacao ? 'PUT' : 'POST',
            headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
        })
        const resposta = await r.json().catch(() => null);
        if(!r.ok) {
            throw new Error(resposta?.msg || 'Erro na requisicao (' + r.status + ')')
        }
        const id = publicacao ? publicacao.id : resposta[props.tipo].id;
        setErro('')
        if(foto) {
            try{
                if(!['image/png', 'image/jpeg'].includes(foto.type) || foto.size > 2 * 1024 * 1024) {
                    throw new Error('Selecione uma imagem PNG ou JPEG de ate 2 MB')
                }
                const arquivo = new FormData();
                arquivo.append('foto', foto);
                const token = localStorage.getItem('token');
                const r = await fetch(url + rota + '/' + id + '/foto', {
                    method: 'PUT',
                    headers: { Authorization: 'Bearer ' + token },
                    body: arquivo
                })
                const resposta = await r.json().catch(() => null);
                if(!r.ok) {
                    throw new Error(resposta?.msg || 'Erro na requisicao (' + r.status + ')')
                }
            } catch (error){
                setErro('Texto salvo, mas a imagem nao foi enviada: ' + error.message)
            }
        }
        setEditando(null)
        await getPublicacoes()
        if(usuario) {
            await props.getUsuario()
        }
    }
    async function excluir(id) {
        if(!confirm('Deseja excluir esta publicação?')) {
            return;
        }
        setErro('')
        try{
            const token = localStorage.getItem('token');
            const r = await fetch(url + rota + '/' + id, {
                method: 'DELETE',
                headers: { Authorization: 'Bearer ' + token }
            })
            const resposta = await r.json().catch(() => null);
            if(!r.ok) {
                throw new Error(resposta?.msg || 'Erro na requisicao (' + r.status + ')')
            }
            getPublicacoes()
        } catch (error){
            setErro(error.message)
        }
    }
    async function removerFoto(id) {
        setErro('')
        try{
            const token = localStorage.getItem('token');
            const r = await fetch(url + rota + '/' + id + '/foto', {
                method: 'DELETE',
                headers: { Authorization: 'Bearer ' + token }
            })
            const resposta = await r.json().catch(() => null);
            if(!r.ok) {
                throw new Error(resposta?.msg || 'Erro na requisicao (' + r.status + ')')
            }
            getPublicacoes()
        } catch (error){
            setErro(error.message)
        }
    }
    return (
        <>
            <Banner noticia={noticia} />
            <div className="layout-feed layout-home">
                <section className="coluna-feed" id="feed">
                    <div className="cabecalho-secao">
                        <span className="etiqueta">{noticia ? 'Notícias' : 'Comunidade'}</span>
                        <h2>{noticia ? 'Últimas notícias' : 'Publicações'}</h2>
                        
                    </div>
                    {podePublicar && <div className="card criar-publicacao">
                        <h2>{noticia ? 'Nova notícia' : 'Nova publicação'}</h2>
                        <FormPublicacao tipo={props.tipo} salvar={salvar} />
                    </div>}
                    {!usuario && <div className="card convite">
                        <div>
                            <strong>Entre na sua conta</strong>
                            <p>Entre na sua conta para publicar, comentar e reagir.</p>
                        </div>
                        <Link className="botao" to="/login">Entrar</Link>
                    </div>}
                    {erro && <p className="erro" role="alert">{erro} <button className="secundario" onClick={()=>{ setErro(''); getPublicacoes() }}>Atualizar</button></p>}
                    <div className="feed-titulo">
                        <h3>{noticia ? 'Publicações recentes' : 'Feed da comunidade'}</h3>
                        
                    </div>
                    {carregando ? <p>Carregando...</p> : <ListaPublicacoes publicacoes={publicacoes} tipo={props.tipo} usuario={usuario} getUsuario={props.getUsuario} editando={editando} setEditando={setEditando} salvar={salvar} excluir={excluir} removerFoto={removerFoto} versao={versao} />}
                </section>
                <aside className="lateral lateral-home">
                    <div className="card pontos-card">
                        <h2>Kane Points</h2>
                        <p>{usuario ? usuario.kane_points + ' KP' : 'Entre para ganhar Kane Points.'}</p>
                        <p>+10 por post<br/>+2 por comentário</p>
                        <Link to="/titulos" className="botao">Ver títulos</Link>
                    </div>
                    <div className="card atalhos">
                        <h3>Links</h3>
                        <Link to="/ranking">Ranking</Link>
                        <Link to="/estatisticas">Estatísticas do Kane</Link>
                        <Link to={noticia ? '/' : '/noticias'}>{noticia ? 'Feed' : 'Notícias'}</Link>
                    </div>
                </aside>
            </div>
        </>
    )
}
export default Home
