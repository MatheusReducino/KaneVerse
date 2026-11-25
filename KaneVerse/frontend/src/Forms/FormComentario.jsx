import './FormComentario.css'
function FormComentario(props){
    async function comentar(e){
        e.preventDefault()
        const form = e.target;
        let comentario = {texto: e.target.texto.value, ...props.origem};
        if(await props.executar('/comentarios', 'POST', comentario, true)){
            form.reset()
        }
    }
    return(
        <form onSubmit={comentar} className="form-linha">
            <input name="texto" placeholder="Escreva um comentário" aria-label="Comentário" required/>
            <button disabled={props.ocupado}>Comentar</button>
        </form>
    )
}
export default FormComentario
