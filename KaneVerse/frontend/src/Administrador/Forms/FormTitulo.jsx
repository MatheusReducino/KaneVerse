function FormTitulo(props){
    const tituloEditando = props.tituloEditando;
    return(
        <form key={tituloEditando?.id || 'novo'} onSubmit={props.salvarTitulo}>
            <label>Nome<input name="nome_titulo" maxLength={50} defaultValue={tituloEditando?.nome_titulo || ''} required/></label>
            <label>Descrição<textarea name="descricao" maxLength={200} defaultValue={tituloEditando?.descricao || ''} required/></label>
            <label>Pontos necessários<input name="kane_points_desbloqueio" type="number" min={0} max={2147483647} step={1} defaultValue={tituloEditando?.kane_points_desbloqueio ?? 0} required/></label>
            <div className="acoes">
                <button disabled={props.ocupado}>Salvar título</button>
                {tituloEditando && <button type="button" className="secundario" onClick={()=>props.cancelar()}>Cancelar</button>}
            </div>
        </form>
    )
}
export default FormTitulo
