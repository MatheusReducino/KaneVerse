# 🫪  KaneVerse

![Harry Kane](frontend/public/Imagens/hero-kane.png)

> Projeto de desenvolvimento web utilizando React, Node.js, Express e PostgreSQL.

## 📚 Descrição

O KaneVerse é uma plataforma web voltada para o senhor e grande jogador Harry Kane. O sistema reúne notícias, publicações e interações entre usuários, criando um espaço para trocas e participação na comunidade.

A plataforma também conta com um sistema de pontuação chamado **Kane Points** e títulos desbloqueáveis, para que os usuários participem e possam exibir seus títulos. A página de estatísticas consulta os dados da Bundesliga na OpenLigaDB.

## 📌 Objetivos

- Desenvolver uma aplicação web utilizando React, Node.js, Express e PostgreSQL;
- Criar um banco de dados relacional para armazenar os dados da plataforma;
- Permitir interações por meio de publicações, comentários e reações;
- Organizar notícias e publicações utilizando palavras-chave;
- Implementar Kane Points, títulos e ranking;
- Utilizar autenticação JWT e upload de imagens.

## 💻 Tecnologias

- **React:** desenvolvimento da interface;
- **Vite:** execução do frontend;
- **Node.js:** execução do backend;
- **Express:** criação da API;
- **PostgreSQL:** gerenciamento do banco de dados;
- **Docker:** execução dos serviços em containers;
- **OpenLigaDB:** consulta de estatísticas da Bundesliga.

## 🛠️ Ferramentas de desenvolvimento

- **Git:** controle de versão do código;
- **GitHub:** hospedagem do repositório.

## 🗂️ Banco de dados

O banco de dados é composto por 10 tabelas:

| Tabela | Descrição |
|---|---|
| `usuarios` | Dados dos usuários, perfis, permissões e Kane Points. |
| `titulos` | Títulos e pontuação necessária para desbloqueá-los. |
| `posts` | Publicações dos usuários. |
| `noticias` | Notícias. |
| `palavraschave` | Palavras-chave dos conteúdos. |
| `comentarios` | Comentários de posts ou notícias. |
| `reacoes` | Reações de posts ou notícias. |
| `usuario_titulo` | Relaciona usuários aos títulos desbloqueados. |
| `publicacao_palavrachave` | Relaciona posts ou notícias às palavras-chave. |
| `banimentos` | Histórico de banimentos dos usuários. |

O arquivo `backend/init.sql` contém a criação das tabelas, os relacionamentos e os dados de exemplo. Um usuário pode ter várias publicações (1:N) e vários títulos, que também podem pertencer a vários usuários (N:N).

## 🪪 Permissões

| Funcionalidade | 👤 Usuário comum | 🛡️ Administrador |
|---|:---:|:---:|
| Criar publicações | ✅ | ✅ |
| Editar e excluir as próprias publicações | ✅ | ✅ |
| Comentar e reagir | ✅ | ✅ |
| Acumular Kane Points e desbloquear títulos | ✅ | ✅ |
| Publicar, editar e excluir notícias | ❌ | ✅ |
| Excluir posts e comentários de terceiros | ❌ | ✅ |
| Banir e desbanir usuários | ❌ | ✅ |
| Alterar Kane Points de usuários | ❌ | ✅ |
| Gerenciar títulos e palavras-chave | ❌ | ✅ |

As permissões são definidas pelo campo booleano `admin` da tabela `usuarios`. O backend verifica o JWT, o banimento e as permissões. A alteração do campo `admin` é feita diretamente no banco, não pela interface.

## 🚀 Como executar o projeto

É necessário ter Node.js, npm e Docker Desktop instalados. Abra o Docker Desktop.

### 1. Configurar o backend

Na pasta principal do projeto, abra o terminal:

```bash
cd backend
```

### 2. Iniciar os containers

Ainda na pasta `backend`:

```bash
docker compose up --build
```

Esse comando inicia Node.js, PostgreSQL e Pgweb.

### 3. Iniciar o frontend

Abra outro terminal na pasta principal do projeto:

```bash
cd frontend
npm install
npm run dev
```

### 4. Acessar a aplicação

| Serviço | Endereço |
|---|---|
| Frontend | http://localhost:5173 |
| API e documentação | http://localhost:3000 |
| Pgweb | http://localhost:8081 |

O frontend consulta a API na porta 3000. A página de estatísticas usa o proxy configurado no `vite.config.js` para consultar a OpenLigaDB. A disponibilidade e atualização dos números dependem da fonte externa.

### 5. Criar uma conta de administrador

Cadastre uma conta pelo site. Os usuários de exemplo do `init.sql` possuem senhas fictícias, portanto não servem para login.

No terminal da pasta `backend`, execute:

```bash
docker compose exec database psql -U usuario -d bancodados
```

Substitua o email do exemplo pelo da conta que você cadastrou:

```sql
UPDATE usuarios SET admin=TRUE WHERE email='seu-email@exemplo.com';
```

Digite `\q` para sair e entre novamente no site. Não é necessário apagar o banco.

### 6. Parar o projeto

Pressione `Ctrl + C` no terminal do React. No terminal do Docker, pressione `Ctrl + C` e execute:

```bash
docker compose down -v
```

## 🫪  Autoria

Matheus Reducino

