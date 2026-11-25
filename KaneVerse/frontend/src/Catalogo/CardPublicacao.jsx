import './CardPublicacao.css'
import FormPublicacao from '../Forms/FormPublicacao'
import Interacoes from '../Componente/Interacoes'

const url = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '');

function CardPublicacao(props){
    const p = props.publicacao;
    const usuario = props.usuario;
    const tipo = props.tipo;
    const noticia = tipo === 'noticia';
    const rota = noticia ? '/noticias' : '/posts';
    const podeEditar = usuario && (noticia ? usuario.admin : usuario.id === p.usuario_id);
    const podeExcluir = usuario && (usuario.admin || (!noticia && usuario.id === p.usuario_id));
    return(
            <article className="card publicacao" >
                <div className="linha autor-publicacao">
                    <div className="autor-dados">
                        <span className="avatar-pequeno avatar-padrao">{(p.nome_usuario || '?').charAt(0).toUpperCase()}</span>
                        <div>
                            <strong>{p.nome_usuario}</strong>
                            <small className="bloco">{noticia ? 'Notícia da comunidade' : 'Torcedor KaneVerse'}</small>
                        </div>
                    </div>
                    <small>{new Date(noticia ? p.data_noticia : p.data_post).toLocaleString('pt-BR')}</small>
                </div>
                {noticia && <span className="etiqueta">{p.categoria}</span>}
                {props.editando === p.id ? <FormPublicacao  tipo={tipo} publicacao={p} salvar={props.salvar} cancelar={()=>props.setEditando(null)}/> : <>
                    {noticia ? <>
                        <h2>{p.titulo}</h2>
                        <p className="subtitulo">{p.subtitulo}</p>
                        <p className="texto">{p.conteudo}</p>
                    </> : <p className="texto">{p.texto}</p>}
                    {p.tem_foto && <img className="foto-publicacao" src={url+rota+'/'+p.id+'/foto?v='+props.versao} alt="Imagem da publicação" loading="lazy"/>}
                    {(p.editado || p.editada) && <small>Editado</small>}
                    <div className="acoes">
                        {podeEditar && <button className="secundario" onClick={()=>props.setEditando(p.id)}>Editar</button>}
                        {podeEditar && p.tem_foto && <button className="secundario" onClick={()=>props.removerFoto(p.id)}>Remover foto</button>}
                        {podeExcluir && <button className="perigo" onClick={()=>props.excluir(p.id)}>Excluir</button>}
                    </div>
                </>}
                <Interacoes publicacao={p} tipo={tipo} usuario={usuario} getUsuario={props.getUsuario}/>
            </article>
    )
}
export default CardPublicacao
