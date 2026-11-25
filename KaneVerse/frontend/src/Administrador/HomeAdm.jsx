import './HomeAdm.css'
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import FormTitulo from './Forms/FormTitulo'
import FormPalavra from './Forms/FormPalavra'
import FormPontos from './Forms/FormPontos'

const url = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '');

function HomeAdm(props){
    const [usuarios, setUsuarios] = useState([]);
    const [titulos, setTitulos] = useState([]);
    const [palavras, setPalavras] = useState([]);
    const [banimentos, setBanimentos] = useState([]);
    const [secao, setSecao] = useState('usuarios');
    const [tituloEditando, setTituloEditando] = useState(null);
    const [palavraEditando, setPalavraEditando] = useState(null);
    const [erro, setErro] = useState('');
    const [msg, setMsg] = useState('');
    const [ocupado, setOcupado] = useState(false);

    async function carregar(){
        try{
            const token = localStorage.getItem('token');
            const headers = token ? {Authorization: 'Bearer '+token} : {};
            const respostas = await Promise.all([
                fetch(url+'/usuarios', {headers}),
                fetch(url+'/titulos', {headers}),
                fetch(url+'/palavraschave', {headers}),
                fetch(url+'/banimentos', {headers})
            ]);
            const dados = [];
            for(const r of respostas){
                const resposta = await r.json().catch(()=>null);
                if(!r.ok){
                    throw new Error(resposta?.msg || 'Erro na requisicao ('+r.status+')')
                }
                dados.push(resposta)
            }
            setUsuarios(dados[0])
            setTitulos(dados[1])
            setPalavras(dados[2])
            setBanimentos(dados[3])
        } catch (error){
            setErro(error.message)
        }
    }
    useEffect(()=>{
        carregar()
    },[])
    async function executar(rota, metodo, dados=null){
        setOcupado(true)
        setErro('')
        setMsg('')
        try{
            const token = localStorage.getItem('token');
            let headers = {Authorization: 'Bearer '+token};
            let opcoes = {method: metodo, headers};
            if(dados !== null){
                headers['Content-Type'] = 'application/json';
                opcoes.body = JSON.stringify(dados);
            }
            const r = await fetch(url+rota, opcoes)
            const resposta = await r.json().catch(()=>null);
            if(!r.ok){
                throw new Error(resposta?.msg || 'Erro na requisicao ('+r.status+')')
            }
            setMsg(resposta.msg)
            await carregar()
            await props.getUsuario()
            return true;
        } catch (error){
            setErro(error.message)
            return false;
        } finally{
            setOcupado(false)
        }
    }
    function alterarPontos(e, id){
        e.preventDefault()
        let dados = {kane_points: Number(e.target.kane_points.value)};
        executar('/usuarios/'+id+'/points', 'PUT', dados)
    }
    function banir(id){
        let motivo = prompt('Motivo do banimento:');
        if(motivo !== null && motivo.trim()){
            executar('/banimentos', 'POST', {usuario_id: id, motivo})
        }
    }
    function excluir(rota){
        if(confirm('Deseja excluir este registro?')){
            executar(rota, 'DELETE')
        }
    }
    async function salvarTitulo(e){
        e.preventDefault()
        const form = e.target;
        let dados = {
            nome_titulo: e.target.nome_titulo.value,
            descricao: e.target.descricao.value,
            kane_points_desbloqueio: Number(e.target.kane_points_desbloqueio.value)
        };
        if(await executar(tituloEditando ? '/titulos/'+tituloEditando.id : '/titulos', tituloEditando ? 'PUT' : 'POST', dados)){
            form.reset()
            setTituloEditando(null)
        }
    }
    async function salvarPalavra(e){
        e.preventDefault()
        const form = e.target;
        let dados = {palavra: e.target.palavra.value};
        if(await executar(palavraEditando ? '/palavraschave/'+palavraEditando.id : '/palavraschave', palavraEditando ? 'PUT' : 'POST', dados)){
            form.reset()
            setPalavraEditando(null)
        }
    }
    let linhasUsuarios = [];
    for(const u of usuarios){
        linhasUsuarios.push(<tr key={u.id}>
            <td>{u.nome_usuario}<small className="bloco">{u.admin ? 'Admin' : u.banido ? 'Banido' : 'Usuário'}</small></td>
            <td><FormPontos key={u.kane_points} usuario={u} alterarPontos={alterarPontos} ocupado={ocupado}/></td>
            <td><div className="acoes">
                {!u.admin && !u.banido && <button className="perigo" disabled={ocupado} onClick={()=>banir(u.id)}>Banir</button>}
                {!u.admin && <button className="secundario" disabled={ocupado} onClick={()=>excluir('/usuarios/'+u.id)}>Excluir</button>}
                {u.banido && <button className="secundario" onClick={()=>setSecao('banimentos')}>Ver banimento</button>}
            </div></td>
        </tr>)
    }
    let linhasTitulos = [];
    for(const t of titulos){
        linhasTitulos.push(<tr key={t.id}>
            <td>{t.nome_titulo}</td>
            <td>{t.descricao}</td>
            <td>{t.kane_points_desbloqueio}</td>
            <td><div className="acoes">
                <button className="secundario" disabled={ocupado} onClick={()=>setTituloEditando(t)}>Editar</button>
                <button className="perigo" disabled={ocupado} onClick={()=>excluir('/titulos/'+t.id)}>Excluir</button>
            </div></td>
        </tr>)
    }
    let linhasPalavras = [];
    for(const p of palavras){
        linhasPalavras.push(<tr key={p.id}>
            <td>{p.palavra}</td>
            <td><div className="acoes">
                <button className="secundario" disabled={ocupado} onClick={()=>setPalavraEditando(p)}>Editar</button>
                <button className="perigo" disabled={ocupado} onClick={()=>excluir('/palavraschave/'+p.id)}>Excluir</button>
            </div></td>
        </tr>)
    }
    let linhasBanimentos = [];
    for(const b of banimentos){
        linhasBanimentos.push(<tr key={b.id}>
            <td>{b.usuario}</td>
            <td>{b.administrador}</td>
            <td>{b.motivo}</td>
            <td>{b.ativo ? 'Ativo' : 'Encerrado'}</td>
            <td>{b.ativo && <button disabled={ocupado} onClick={()=>executar('/banimentos/'+b.id, 'PUT')}>Desbanir</button>}</td>
        </tr>)
    }
    return(
        <>
            <span className="etiqueta">ÁREA RESTRITA</span>
            <h1>Administração</h1>
            <p>Gerencie a comunidade. Para publicar notícias, acesse <Link to="/noticias">Notícias</Link>.</p>
            <div className="abas">
                {['usuarios','titulos','palavraschave','banimentos'].map(s=><button key={s} className={secao === s ? '' : 'secundario'} onClick={()=>setSecao(s)}>{{usuarios:'Usuários',titulos:'Títulos',palavraschave:'Palavras-chave',banimentos:'Banimentos'}[s]}</button>)}
                <button className="secundario" onClick={carregar}>Atualizar</button>
            </div>
            {erro && <p className="erro" role="alert">{erro}</p>}
            {msg && <p className="sucesso" role="status">{msg}</p>}
            {secao === 'usuarios' && <article className="card">
                <h2>Usuários e Kane Points</h2>
                <div className="tabela">
                    <table>
                        <thead>
                            <tr>
                                <th>Usuário</th>
                                <th>Pontos</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>{linhasUsuarios}</tbody>
                    </table>
                </div>
            </article>}
            {secao === 'titulos' && <article className="card">
                <h2>{tituloEditando ? 'Editar título' : 'Criar título'}</h2>
                <FormTitulo key={tituloEditando?.id || "novo"} tituloEditando={tituloEditando} salvarTitulo={salvarTitulo} ocupado={ocupado} cancelar={()=>setTituloEditando(null)}/>
                <div className="tabela">
                    <table>
                        <thead>
                            <tr>
                                <th>Título</th>
                                <th>Descrição</th>
                                <th>KP</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>{linhasTitulos}</tbody>
                    </table>
                </div>
            </article>}
            {secao === 'palavraschave' && <article className="card">
                <h2>{palavraEditando ? 'Editar palavra-chave' : 'Criar palavra-chave'}</h2>
                <FormPalavra key={palavraEditando?.id || "nova"} palavraEditando={palavraEditando} salvarPalavra={salvarPalavra} ocupado={ocupado} cancelar={()=>setPalavraEditando(null)}/>
                <div className="tabela">
                    <table>
                        <thead>
                            <tr>
                                <th>Palavra</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>{linhasPalavras}</tbody>
                    </table>
                </div>
            </article>}
            {secao === 'banimentos' && <article className="card">
                <h2>Histórico de banimentos</h2>
                <div className="tabela">
                    <table>
                        <thead>
                            <tr>
                                <th>Usuário</th>
                                <th>Administrador</th>
                                <th>Motivo</th>
                                <th>Situação</th>
                                <th>Ação</th>
                            </tr>
                        </thead>
                        <tbody>{linhasBanimentos}</tbody>
                    </table>
                    {!linhasBanimentos.length && <p>Nenhum banimento registrado.</p>}
                </div>
            </article>}
        </>
    )
}
export default HomeAdm
