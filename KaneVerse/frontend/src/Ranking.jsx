import './Ranking.css'
import { useState, useEffect } from 'react'

const url = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '');

function Ranking() {
    const [usuarios, setUsuarios] = useState([]);
    const [erro, setErro] = useState('');
    const [carregando, setCarregando] = useState(true);
    async function getRanking() {
        setErro('')
        try{
            const r = await fetch(url + '/usuarios/ranking')
            const dados = await r.json().catch(() => null);
            if(!r.ok) {
                throw new Error(dados?.msg || 'Erro na requisicao (' + r.status + ')')
            }
            setUsuarios(dados)
        } catch (error){
            setErro(error.message)
        } finally{
            setCarregando(false)
        }
    }
    useEffect(()=>{
        getRanking()
    }, [])
    let linhas = [];
    let posicao = 1;
    for(const u of usuarios) {
        linhas.push(<tr key={u.id}>
            <td className="dourado">{posicao++}º</td>
            <td><div className="usuario-ranking">
                {u.tem_pfp && <img className="avatar-pequeno" src={url + '/usuarios/' + u.id + '/pfp'} alt="" />}
                {u.nome_usuario}
            </div></td>
            <td>{u.kane_points} KP</td>
        </tr>)
    }
    return (
        <section className="card">
            <span className="etiqueta">HALL DA FAMA</span>
            <h1>Ranking KaneVerse</h1>
            <p>Os dez torcedores com mais Kane Points.</p>
            {erro && <p className="erro" role="alert">{erro}</p>}
            <button className="secundario" onClick={getRanking}>Atualizar ranking</button>
            {carregando ? <p>Carregando...</p> : <div className="tabela">
                <table>
                    <thead>
                        <tr>
                            <th>Posição</th>
                            <th>Usuário</th>
                            <th>Kane Points</th>
                        </tr>
                    </thead>
                    <tbody>{linhas}</tbody>
                </table>
                {!linhas.length && <p>Nenhum usuário no ranking.</p>}
            </div>}
        </section>
    )
}
export default Ranking
