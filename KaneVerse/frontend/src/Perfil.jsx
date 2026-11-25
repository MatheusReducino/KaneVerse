import './Perfil.css'
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

const url = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '');

function Perfil(props) {
    const usuario = props.usuario;
    const [titulos, setTitulos] = useState([]);
    const [erro, setErro] = useState('');
    const [msg, setMsg] = useState('');
    const [ocupado, setOcupado] = useState(false);

    async function getTitulos() {
        try{
            const r = await fetch(url + '/titulos/usuario/' + usuario.id)
            const dados = await r.json().catch(() => null);
            if(!r.ok) {
                throw new Error(dados?.msg || 'Erro na requisicao (' + r.status + ')')
            }
            setTitulos(dados)
        } catch (error){
            setErro(error.message)
        }
    }
    useEffect(()=>{
        getTitulos()
    }, [usuario.id])

    async function executar(acao, mensagem) {
        setOcupado(true)
        setErro('')
        setMsg('')
        try{
            await acao()
            setMsg(mensagem)
            await props.getUsuario()
            return true;
        } catch (error){
            setErro(error.message)
            return false;
        } finally{
            setOcupado(false)
        }
    }
    async function editarPerfil(e) {
        e.preventDefault()
        let dados = {
            nome_usuario: e.target.nome_usuario.value,
            email: e.target.email.value,
            descricao: e.target.descricao.value || null
        };
        await executar(async ()=>{
            const token = localStorage.getItem('token');
            const r = await fetch(url + '/usuarios/me', {
                method: 'PUT',
                headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
                body: JSON.stringify(dados)
            })
            const resposta = await r.json().catch(() => null);
            if(!r.ok) {
                throw new Error(resposta?.msg || 'Erro na requisicao (' + r.status + ')')
            }
        }, 'Perfil atualizado')
    }
    async function atualizarFoto(e) {
        e.preventDefault()
        const form = e.target;
        const foto = e.target.pfp.files[0];
        if(await executar(async ()=>{
            if(!foto || !['image/png', 'image/jpeg'].includes(foto.type) || foto.size > 2 * 1024 * 1024) {
                throw new Error('Selecione uma imagem PNG ou JPEG de ate 2 MB')
            }
            const dados = new FormData();
            dados.append('pfp', foto);
            const token = localStorage.getItem('token');
            const r = await fetch(url + '/usuarios/me/pfp', {
                method: 'PUT',
                headers: { Authorization: 'Bearer ' + token },
                body: dados
            })
            const resposta = await r.json().catch(() => null);
            if(!r.ok) {
                throw new Error(resposta?.msg || 'Erro na requisicao (' + r.status + ')')
            }
        }, 'Foto atualizada')) {
            form.reset()
        }
    }
    async function excluirConta() {
        if(!confirm('Deseja excluir permanentemente sua conta e publicações?')) {
            return;
        }
        try{
            const token = localStorage.getItem('token');
            const r = await fetch(url + '/usuarios/' + usuario.id, {
                method: 'DELETE',
                headers: { Authorization: 'Bearer ' + token }
            })
            const resposta = await r.json().catch(() => null);
            if(!r.ok) {
                throw new Error(resposta?.msg || 'Erro na requisicao (' + r.status + ')')
            }
            props.sair()
        } catch (error){
            setErro(error.message)
        }
    }
    async function removerFoto() {
        await executar(async ()=>{
            const token = localStorage.getItem('token');
            const r = await fetch(url + '/usuarios/me/pfp', {
                method: 'DELETE',
                headers: { Authorization: 'Bearer ' + token }
            })
            const resposta = await r.json().catch(() => null);
            if(!r.ok) {
                throw new Error(resposta?.msg || 'Erro na requisicao (' + r.status + ')')
            }
        }, 'Foto removida')
    }
    let listaTitulos = [];
    for(const t of titulos) {
        listaTitulos.push(<span className="tag" key={t.id}>{t.nome_titulo}</span>)
    }
    return (
        <>
            <h1>Meu perfil</h1>
            {erro && <p className="erro" role="alert">{erro}</p>}
            {msg && <p className="sucesso" role="status">{msg}</p>}
            <div className="layout-feed">
                <section className="coluna-feed">
                    <article className="card">
                        <div className="perfil-topo">
                            {usuario.tem_pfp ? <img className="avatar" src={url + '/usuarios/' + usuario.id + '/pfp?v=' + props.versao} alt="Sua foto de perfil" /> : <span className="avatar avatar-padrao">{usuario.nome_usuario.charAt(0).toUpperCase()}</span>}
                            <div>
                                <h2>{usuario.nome_usuario}</h2>
                                <p>{usuario.admin ? 'Administrador' : 'Torcedor'}</p>
                                <p className="dourado">{usuario.kane_points} Kane Points</p>
                            </div>
                        </div>
                        <p className="texto">{usuario.descricao || 'Sem descrição.'}</p>
                        <h3>Foto de perfil</h3>
                        <form onSubmit={atualizarFoto} className="form-linha">
                            <input type="file" name="pfp" accept="image/png,image/jpeg" aria-label="Foto de perfil" required />
                            <button disabled={ocupado}>Enviar foto</button>
                        </form>
                        {usuario.tem_pfp && <button className="secundario" disabled={ocupado} onClick={removerFoto}>Remover foto</button>}
                    </article>
                    <article className="card">
                        <h2>Editar perfil</h2>
                        <form onSubmit={editarPerfil}>
                            <label>Nome de usuário<input name="nome_usuario" defaultValue={usuario.nome_usuario} maxLength={255} required /></label>
                            <label>Email<input type="email" name="email" defaultValue={usuario.email} maxLength={255} required /></label>
                            <label>Descrição<textarea name="descricao" defaultValue={usuario.descricao || ''} maxLength={500} /></label>
                            <button disabled={ocupado}>Salvar alterações</button>
                        </form>
                        {!usuario.admin && <button className="perigo" disabled={ocupado} onClick={excluirConta}>Excluir minha conta</button>}
                    </article>
                </section>
                <aside className="card lateral">
                    <h2>Meus títulos</h2>
                    <div className="tags">
                        {listaTitulos.length ? listaTitulos : 'Você ainda não possui títulos.'}
                    </div>
                    <p><Link to="/titulos">Ver títulos disponíveis →</Link></p>
                </aside>
            </div>
        </>
    )
}
export default Perfil
