import './Interacoes.css'
import { useState, useEffect } from 'react'
import ListaComentarios from '../Lista/ListaComentarios'
import FormComentario from '../Forms/FormComentario'

const url = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '');

function Interacoes(props){
    const [comentarios, setComentarios] = useState([]);
    const [reacoes, setReacoes] = useState([]);
    const [palavras, setPalavras] = useState([]);
    const [todasPalavras, setTodasPalavras] = useState([]);
    const [aberto, setAberto] = useState(false);
    const [erro, setErro] = useState('');
    const [ocupado, setOcupado] = useState(false);
    const usuario = props.usuario;
    const publicacao = props.publicacao;
    const tipo = props.tipo;
    const caminho = '/'+tipo+'/'+publicacao.id;
    const origem = tipo === 'post' ? {post_id: publicacao.id} : {noticia_id: publicacao.id};
    const podeVincular = usuario && (usuario.admin || (tipo === 'post' && usuario.id === publicacao.usuario_id));

    async function carregar(){
        try{
            const respostas = await Promise.all([
                fetch(url+'/comentarios'+caminho),
                fetch(url+'/reacoes'+caminho),
                fetch(url+'/palavraschave'+caminho)
            ]);
            const dados = [];
            for(const r of respostas){
                const resposta = await r.json().catch(()=>null);
                if(!r.ok){
                    throw new Error(resposta?.msg || 'Erro na requisicao ('+r.status+')')
                }
                dados.push(resposta)
            }
            setComentarios(dados[0])
            setReacoes(dados[1])
            setPalavras(dados[2])
        } catch (error){
            setErro(error.message)
        }
    }
    async function carregarPalavras(){
        try{
            const r = await fetch(url+'/palavraschave')
            const dados = await r.json().catch(()=>null);
            if(!r.ok){
                throw new Error(dados?.msg || 'Erro na requisicao ('+r.status+')')
            }
            setTodasPalavras(dados)
        } catch (error){
            setErro(error.message)
        }
    }
    useEffect(()=>{
        carregar()
    },[caminho])
    useEffect(()=>{
        if(podeVincular){
            carregarPalavras()
        }
    },[podeVincular])

    async function executar(rota, metodo, dados=null, pontos=false){
        setOcupado(true)
        setErro('')
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
            await carregar()
            if(pontos){
                await props.getUsuario()
            }
            return true;
        } catch (error){
            setErro(error.message)
            return false;
        } finally{
            setOcupado(false)
        }
    }
    function editarComentario(c){
        const texto = prompt('Editar comentário', c.texto);
        if(texto !== null){
            executar('/comentarios/'+c.id, 'PUT', {texto})
        }
    }
    function removerComentario(id){
        if(confirm('Excluir comentário?')){
            executar('/comentarios/'+id, 'DELETE')
        }
    }
    let minhaReacao = null;
    for(const r of reacoes){
        if(usuario && r.usuario_id === usuario.id){
            minhaReacao = r;
        }
    }
    function reagir(reacao){
        if(minhaReacao && minhaReacao.tipo === reacao){
            executar('/reacoes/'+minhaReacao.id, 'DELETE')
        } else{
            executar('/reacoes', 'POST', {tipo: reacao, ...origem})
        }
    }
    async function vincular(e){
        e.preventDefault()
        const form = e.target;
        if(!e.target.palavra_id.value){
            return;
        }
        let dados = {palavra_id: Number(e.target.palavra_id.value), ...origem};
        if(await executar('/palavraschave/vincular', 'POST', dados)){
            form.reset()
        }
    }
    let botoes = [];
    const simbolos = {curtida:'👍', fogo:'🔥', caveira:'💀', risada:'😂'};
    for(const tipoReacao of ['curtida','fogo','caveira','risada']){
        let quantidade = 0;
        for(const r of reacoes){
            if(r.tipo === tipoReacao){
                quantidade++;
            }
        }
        botoes.push(<button key={tipoReacao} disabled={!usuario || ocupado} title={tipoReacao} aria-pressed={minhaReacao?.tipo === tipoReacao} className={minhaReacao?.tipo === tipoReacao ? 'reacao selecionada' : 'reacao'} onClick={()=>reagir(tipoReacao)}>{simbolos[tipoReacao]} {quantidade}</button>)
    }
    let tags = [];
    let opcoes = [];
    for(const p of palavras){
        tags.push(<span className="tag" key={p.vinculo_id}>#{p.palavra} {podeVincular && <button title="Remover palavra-chave" disabled={ocupado} onClick={()=>executar('/palavraschave/vinculo/'+p.vinculo_id, 'DELETE')}>×</button>}</span>)
    }
    for(const p of todasPalavras){
        if(!palavras.some(v=>v.id === p.id)){
            opcoes.push(<option key={p.id} value={p.id}>{p.palavra}</option>)
        }
    }
    return(
        <section className="interacoes">
            {erro && <p className="erro" role="alert">{erro} <button className="secundario" onClick={()=>{setErro('');carregar();if(podeVincular){carregarPalavras()}}}>Atualizar</button></p>}
            <div className="tags">{tags}</div>
            {podeVincular && <form className="form-linha" onSubmit={vincular}>
                <select name="palavra_id" required aria-label="Palavra-chave">
                    <option value="">Adicionar palavra-chave</option>
                    {opcoes}
                </select>
                <button disabled={ocupado || !opcoes.length}>Vincular</button>
            </form>}
            <div className="acoes">
                {botoes}
                <button className="secundario" onClick={()=>setAberto(!aberto)}>{aberto ? 'Ocultar' : 'Comentários'} ({comentarios.length})</button>
            </div>
            {aberto && <div className="comentarios">
                <ListaComentarios comentarios={comentarios} usuario={usuario} ocupado={ocupado} editarComentario={editarComentario} removerComentario={removerComentario}/>
                {usuario && <FormComentario origem={origem} ocupado={ocupado} executar={executar}/>}
            </div>}
        </section>
    )
}
export default Interacoes
