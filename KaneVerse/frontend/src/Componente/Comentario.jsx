import './Comentario.css'
function Comentario(props){
    const c = props.comentario;
    const usuario = props.usuario;
    return(
        <div className="comentario">
            <strong>{c.nome_usuario}</strong>
            <p className="texto">{c.texto}</p>
            <div className="acoes">
                {usuario?.id === c.usuario_id && <button className="secundario" disabled={props.ocupado} onClick={()=>props.editarComentario(c)}>Editar</button>}
                {usuario && (usuario.id === c.usuario_id || usuario.admin) && <button className="perigo" disabled={props.ocupado} onClick={()=>props.removerComentario(c.id)}>Excluir</button>}
            </div>
        </div>
    )
}
export default Comentario
