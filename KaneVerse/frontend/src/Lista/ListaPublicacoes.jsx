import CardPublicacao from '../Catalogo/CardPublicacao'

function ListaPublicacoes(props){
    let lista = [];
    for(const p of props.publicacoes){
        lista.push(<CardPublicacao key={p.id} {...props} publicacao={p}/>)
    }
    return lista.length ? lista : <p className="card">Nenhuma publicação encontrada.</p>
}
export default ListaPublicacoes
