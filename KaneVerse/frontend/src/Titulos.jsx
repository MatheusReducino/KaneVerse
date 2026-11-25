import { useState, useEffect } from 'react'
import ListaTitulos from './Lista/ListaTitulos'

const url = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '');

function Titulos(props) {
    const usuario = props.usuario;
    const [titulos, setTitulos] = useState([]);
    const [meusTitulos, setMeusTitulos] = useState([]);
    const [erro, setErro] = useState('');
    const [msg, setMsg] = useState('');
    const [ocupado, setOcupado] = useState(false);
    async function carregar() {
        try{
            const r = await fetch(url + '/titulos')
            const dados = await r.json().catch(() => null);
            if(!r.ok) {
                throw new Error(dados?.msg || 'Erro na requisicao (' + r.status + ')')
            }
            setTitulos(dados)
            if(usuario) {
                const r = await fetch(url + '/titulos/usuario/' + usuario.id)
                const dados = await r.json().catch(() => null);
                if(!r.ok) {
                    throw new Error(dados?.msg || 'Erro na requisicao (' + r.status + ')')
                }
                setMeusTitulos(dados)
            } else{
                setMeusTitulos([])
            }
        } catch (error){
            setErro(error.message)
        }
    }
    useEffect(()=>{
        carregar()
    }, [usuario?.id])
    async function desbloquear(id) {
        setOcupado(true)
        setErro('')
        setMsg('')
        try{
            const token = localStorage.getItem('token');
            const r = await fetch(url + '/titulos/' + id + '/desbloquear', {
                method: 'POST',
                headers: { Authorization: 'Bearer ' + token }
            })
            const dados = await r.json().catch(() => null);
            if(!r.ok) {
                throw new Error(dados?.msg || 'Erro na requisicao (' + r.status + ')')
            }
            setMsg(dados.msg)
            await carregar()
            await props.getUsuario()
        } catch (error){
            setErro(error.message)
        } finally{
            setOcupado(false)
        }
    }
    return (
        <>
            <h1>Sala de troféus</h1>
            <p>{usuario ? 'Você possui ' + usuario.kane_points + ' Kane Points.' : 'Conquiste títulos ao participar da comunidade.'} Desbloquear um título não consome pontos.</p>
            {erro && <p className="erro" role="alert">{erro} <button onClick={()=>{ setErro(''); carregar() }}>Tentar novamente</button></p>}
            {msg && <p className="sucesso">{msg}</p>}
            <ListaTitulos titulos={titulos} meusTitulos={meusTitulos} usuario={usuario} ocupado={ocupado} desbloquear={desbloquear} />
        </>
    )
}
export default Titulos
