import './Banner.css'
import { Link } from 'react-router-dom'

function Banner(props){
    // Troque as fotos dentro de public/Imagens.
    let imagem = props.noticia ? '/Imagens/noticias-kane.jpg' : '/Imagens/hero-kane.png';
    return(
        <section className={props.noticia ? 'banner-noticias' : 'hero'}>
            <img className="hero-foto" src={imagem} alt="Harry Kane"/>
            <div className="hero-degrade"></div>
            <div className="hero-texto">
                <h1>{props.noticia ? 'Notícias' : 'KaneVerse'}</h1>
                <p>{props.noticia ? 'As últimas notícias sobre Harry Kane.' : 'A comunidade do melhor camisa 9.'}</p>
                {!props.noticia && <div className="acoes">
                    <a className="botao hero-botao" href="#feed">Ver publicações</a>
                    <Link className="hero-link" to="/estatisticas">Estatísticas</Link>
                </div>}
            </div>
        </section>
    )
}
export default Banner
