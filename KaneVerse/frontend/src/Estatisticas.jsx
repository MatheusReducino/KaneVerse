import { useState, useEffect } from 'react'
import './Estatisticas.css'

function Estatisticas() {
    const hoje = new Date();
    const atual = hoje.getMonth() >= 6 ? hoje.getFullYear() : hoje.getFullYear() - 1;
    const [temporada, setTemporada] = useState(atual);
    const [dados, setDados] = useState(null);
    const [erro, setErro] = useState('');
    const [carregando, setCarregando] = useState(true);
    const [atualizado, setAtualizado] = useState('');

    function ehKane(jogador) {
        const nome = String(jogador.goalGetterName || '').trim().toLowerCase();
        return nome === 'kane' || nome === 'harry kane' || nome === 'kane, harry' || nome === 'h. kane' || Number(jogador.goalGetterId) === 18898;
    }
    async function buscarEstatisticas() {
        setCarregando(true)
        setErro('')
        setDados(null)
        let gols = null;
        let posicao = null;
        let jogosComGol = null;
        let penaltis = null;
        let aviso = '';
        try{
            const r = await fetch('/openliga/getgoalgetters/bl1/'+temporada)
            if(!r.ok) {
                throw new Error('HTTP ' + r.status)
            }
            const jogadores = await r.json();
            if(!Array.isArray(jogadores)) {
                throw new Error('Resposta invalida da artilharia')
            }
            const kane = jogadores.find(ehKane);
            if(kane && Number.isInteger(kane.goalCount) && kane.goalCount >= 0) {
                gols = kane.goalCount;
                posicao = jogadores.filter(j => j.goalCount > gols).length + 1;
            } else{
                aviso = 'Kane nao encontrado na lista de artilheiros.';
            }
        } catch (error){
            aviso = 'Artilharia indisponivel (' + error.message + ').';
        }
        try{
            const r = await fetch('/openliga/getmatchdata/bl1/'+temporada)
            if(!r.ok) {
                throw new Error('HTTP ' + r.status)
            }
            const partidas = await r.json();
            if(!Array.isArray(partidas)) {
                throw new Error('Resposta invalida das partidas')
            }
            let totalGols = 0;
            let totalJogos = 0;
            let totalPenaltis = 0;
            let temDadosPenalti = true;
            for(const partida of partidas) {
                if(!partida.matchIsFinished || !Array.isArray(partida.goals)) {
                    continue;
                }
                const marcados = partida.goals.filter(g => ehKane(g) && !g.isOwnGoal && !g.isPenaltyShootout);
                if(marcados.length) {
                    totalJogos++;
                    totalGols += marcados.length;
                    for(const gol of marcados) {
                        if(typeof gol.isPenalty !== 'boolean') {
                            temDadosPenalti = false;
                        } else if(gol.isPenalty) {
                            totalPenaltis++;
                        }
                    }
                }
            }
            if(gols === null && totalGols > 0) {
                gols = totalGols;
                aviso += ' Gols contados pelos registros de partidas finalizadas; total pode estar incompleto.';
            }
            if(gols !== null && totalGols === gols) {
                jogosComGol = totalJogos;
                if(temDadosPenalti) {
                    penaltis = totalPenaltis;
                }
            } else if(gols !== null) {
                aviso += ' Os registros de gols das partidas nao conferem com a artilharia.';
            }
        } catch (error){
            aviso += ' Partidas indisponiveis (' + error.message + ').';
        }
        if(gols === null) {
            setErro('Nao foi possivel obter os dados desta temporada. ' + aviso + ' Tente novamente ou selecione outra temporada.')
        } else{
            setDados({ gols, posicao, jogosComGol, penaltis, aviso })
            setAtualizado(new Date().toLocaleString('pt-BR'))
        }
        setCarregando(false)
    }

    useEffect(()=>{
        buscarEstatisticas()
    }, [temporada])

    let opcoes = [];
    for(let ano = atual; ano >= 2023; ano--) {
        opcoes.push(<option key={ano} value={ano}>{ano}/{ano + 1}</option>)
    }

    return (
        <section className="estatisticas">
            <img className="foto-estatisticas" src="/Imagens/estatisticas-kane.png" alt="Harry Kane"/>
            <div className="estatisticas-conteudo">
                <span className="etiqueta">BUNDESLIGA / TEMPORADA {temporada}/{temporada + 1}</span>
                <h1>Harry Kane</h1>
                <p>O camisa 9 em numeros.</p>
                <label>Temporada
                    <select className="temporada" value={temporada} onChange={e => setTemporada(Number(e.target.value))} disabled={carregando}>
                        {opcoes}
                    </select>
                </label>
                {carregando && <p>Buscando estatisticas...</p>}
                {erro && <p className="erro" role="alert">{erro}</p>}
                <div className="numeros-kane">
                    <div><strong>{dados?.gols ?? '—'}</strong><span>Gols na liga</span></div>
                    <div><strong>{dados?.posicao != null ? dados.posicao + 'º' : '—'}</strong><span>Artilharia</span></div>
                    <div><strong>{dados?.jogosComGol ?? '—'}</strong><span>Jogos em que marcou</span></div>
                    <div><strong>{dados?.penaltis ?? '—'}</strong><span>Gols de penalti</span></div>
                </div>
                <button onClick={buscarEstatisticas} disabled={carregando}>Atualizar numeros</button>
                {dados?.aviso && <small className="bloco">{dados.aviso}</small>}
                <small className="bloco">Dados da liga alema, nao de todas as competicoes. A atualizacao depende da fonte.</small>
            </div>
        </section>
    )
}

export default Estatisticas
