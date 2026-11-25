function FormPalavra(props){
    const palavraEditando = props.palavraEditando;
    return(
        <form className="form-linha" key={palavraEditando?.id || 'nova'} onSubmit={props.salvarPalavra}>
            <input name="palavra" aria-label="Palavra-chave" maxLength={50} defaultValue={palavraEditando?.palavra || ''} required/>
            <button disabled={props.ocupado}>Salvar</button>
            {palavraEditando && <button type="button" className="secundario" onClick={()=>props.cancelar()}>Cancelar</button>}
        </form>
    )
}
export default FormPalavra
