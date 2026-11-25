function FormPontos(props){
    const u = props.usuario;
    return(
        <form key={u.kane_points} className="form-linha" onSubmit={e=>props.alterarPontos(e,u.id)}>
            <input type="number" name="kane_points" aria-label={'Pontos de '+u.nome_usuario} min={0} max={2147483647} step={1} defaultValue={u.kane_points} required/>
            <button disabled={props.ocupado}>Salvar</button>
        </form>
    )
}
export default FormPontos
