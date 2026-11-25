import './ListaTitulos.css'
import { Link } from 'react-router-dom'

function ListaTitulos(props){
    const usuario = props.usuario;
    let lista = [];
    for(const t of props.titulos){
        const desbloqueado = props.meusTitulos.some(mt=>mt.id === t.id);
        lista.push(
            <article className="card titulo-card" key={t.id}>
                <span className="etiqueta">{desbloqueado ? 'CONQUISTADO' : t.kane_points_desbloqueio+' KP'}</span>
                <h2>{t.nome_titulo}</h2>
                <p>{t.descricao}</p>
                {usuario ? <button disabled={props.ocupado || desbloqueado || usuario.kane_points < t.kane_points_desbloqueio} onClick={()=>props.desbloquear(t.id)}>{desbloqueado ? 'Desbloqueado' : usuario.kane_points < t.kane_points_desbloqueio ? 'Pontos insuficientes' : 'Desbloquear'}</button> : <Link to="/login">Entre para desbloquear</Link>}
            </article>
        )
    }
    return <div className="grade">
        {lista.length ? lista : <p>Nenhum título disponível.</p>}
    </div>
}
export default ListaTitulos
