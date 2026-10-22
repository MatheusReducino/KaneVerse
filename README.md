# KaneVerse 󠁧󠁢󠁥󠁮󠁧

![Harry Kane](/imagens/kane1.jpg)

> Projeto de desenvolvimento web utilizando React, Node.js, Express e PostgreSQL.

## 📚 Descrição

O KaneVerse é uma plataforma web voltada para o Senhor e grande jogador Harry Kane. O sistema reúne notícias, publicações e interações entre usuários, criando um espaço trocas e participação na comunidade.

A plataforma também conta com um sistema de pontuação chamado **Kane Points** e títulos desbloqueáveis, para que os usuários participem e possam exibir seu título irado.

## 📌 Objetivos

- Desenvolver uma aplicação web utilizando React, Node.js, Express e PostgreSQL;
- Criar um banco de dados relacional para armazenar os dados da plataforma;
- Permitir interações entre usuários por meio de publicações, comentários e reações;
- Organizar notícias e publicações utilizando palavras-chave;
- Implementar um sistema de pontuação e títulos para os usuários.

## 💻 Tecnologias 

- **React:** desenvolvimento da interface;
- **Node.js:** execução do backend;
- **Express:** criação da API;
- **PostgreSQL:** gerenciamento do banco de dados;
- **Docker:** conteinerização e execução dos serviços da aplicação em ambientes isolados.

## 🛠️ Ferramentas de desenvolvimento

- **Git:** controle de versão do código;
- **GitHub:** hospedagem do repositório e colaboração no desenvolvimento.

## 🗂️ Banco de dados

O banco de dados é composto por 12 tabelas:

| Tabela | Descrição |
|---|---|
| `usuarios` | Armazena os dados dos usuários, perfis, cargos e Kane Points. |
| `titulos` | Armazena os títulos e a pontuação necessária para liberar. |
| `posts` | Armazena as publicações dos usuários. |
| `noticias` | Armazena as notícias. |
| `palavraschave` | Armazena as palavras-chave dos conteúdos. |
| `comentariosposts` | Armazena os comentários das publicações. |
| `comentariosnoticias` | Armazena os comentários das notícias. |
| `reacoesposts` | Armazena as reações das publicações. |
| `reacoesnoticias` | Armazena as reações das notícias. |
| `usuario_titulo` | Relaciona usuários aos títulos desbloqueados. |
| `noticia_palavrachave` | Relaciona notícias com as palavras-chave. |
| `post_palavrachave` | Relaciona publicações com as palavras-chave. |

O arquivo `init.sql` contém os comandos para criar as tabelas, definir seus relacionamentos e inserir dados de exemplo, permitindo que seja inicializado.

## 🪪 Permissões

O Kaneverso possui duas roles de acesso: usuários e admins, cada um com determinadas permissões dentro do sistema.

| Funcionalidade | 👤 Usuário comum | 🛡️ Administrador |
|---|:---:|:---:|
| Criar publicações | ✅ | ✅ |
| Editar e excluir as próprias publicações | ✅ | ✅ |
| Comentar e reagir a publicações e notícias | ✅ | ✅ |
| Acumular Kane Points e desbloquear títulos | ✅ | ✅ |
| Publicar notícias | ✅ | ✅ |
| Editar e excluir qualquer notícia | ❌ | ✅ |
| Excluir publicações e comentários de outros usuários | ❌ | ✅ |
| Moderar conteúdos inadequados | ❌ | ✅ |
| Gerenciar usuários e suspender contas | ❌ | ✅ |
| Alterar o cargo de um usuário | ❌ | ✅ |
| Gerenciar títulos e recompensas | ❌ | ✅ |

As permissões são definidas pela role de cada usuário, armazenado na tabela `usuarios`.

## 🫪 Autoria

Matheus Reducino


_Sujeito a posteriores alterações._