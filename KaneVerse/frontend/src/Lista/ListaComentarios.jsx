import Comentario from '../Componente/Comentario'

function ListaComentarios(props){
    let lista = [];
    for(const c of props.comentarios){
        lista.push(<Comentario key={c.id} comentario={c} usuario={props.usuario} ocupado={props.ocupado} editarComentario={props.editarComentario} removerComentario={props.removerComentario}/>)
    }
    return lista.length ? lista : <p>Nenhum comentário.</p>
}
export default ListaComentarios
