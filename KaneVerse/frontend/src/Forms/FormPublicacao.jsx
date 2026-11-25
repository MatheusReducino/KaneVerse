import './FormPublicacao.css'
import { useState } from 'react'

function FormPublicacao(props){
    const [enviando, setEnviando] = useState(false);
    const [erro, setErro] = useState('');
    const noticia = props.tipo === 'noticia';
    const publicacao = props.publicacao;
    async function montarPublicacao(e){
        e.preventDefault()
        const form = e.target;
        let dados;
        if(noticia){
            dados = {
                titulo: e.target.titulo.value,
                subtitulo: e.target.subtitulo.value,
                conteudo: e.target.conteudo.value,
                categoria: e.target.categoria.value || 'Harry Kane'
            };
        } else{
            dados = {texto: e.target.texto.value};
        }
        const foto = e.target.foto.files[0];
        if(foto && (!['image/png','image/jpeg'].includes(foto.type) || foto.size > 2*1024*1024)){
            setErro('Envie uma imagem PNG ou JPEG de ate 2 MB')
            return;
        }
        setEnviando(true)
        setErro('')
        try{
            await props.salvar(dados, foto, publicacao);
            form.reset()
        } catch (error){
            setErro(error.message)
        } finally{
            setEnviando(false)
        }
    }
    return(
        <form onSubmit={montarPublicacao} className="form-publicacao">
            {erro && <p className="erro" role="alert">{erro}</p>}
            {noticia ? <>
                <label>Título<input name="titulo" defaultValue={publicacao?.titulo || ''} maxLength={255} required/></label>
                <label>Subtítulo<input name="subtitulo" defaultValue={publicacao?.subtitulo || ''} maxLength={500} required/></label>
                <label>Categoria<input name="categoria" defaultValue={publicacao?.categoria || 'Harry Kane'} maxLength={50}/></label>
                <label>Conteúdo<textarea name="conteudo" defaultValue={publicacao?.conteudo || ''} rows={5} required/></label>
            </> : <label>Publicação<textarea name="texto" defaultValue={publicacao?.texto || ''} placeholder="O que você tem a dizer sobre Kane?" rows={3} required/></label>}
            <label>Imagem (opcional)<input name="foto" type="file" accept="image/png,image/jpeg"/></label>
            <div className="acoes">
                <button disabled={enviando}>{enviando ? 'Salvando...' : publicacao ? 'Salvar' : 'Publicar'}</button>
                {publicacao && <button type="button" className="secundario" onClick={props.cancelar}>Cancelar</button>}
            </div>
        </form>
    )
}

export default FormPublicacao
