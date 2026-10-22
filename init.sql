CREATE TABLE IF NOT EXISTS usuarios(
    id SERIAL PRIMARY KEY,
    nome_usuario VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    senha_hash CHAR(60) NOT NULL,
    pfp BYTEA,
    descricao VARCHAR(500),
    banido BOOLEAN NOT NULL DEFAULT FALSE,
    kane_points INTEGER NOT NULL DEFAULT 0 CHECK (kane_points >= 0),
    cargo VARCHAR(10) NOT NULL DEFAULT 'user' CHECK (cargo in ('user', 'admin')),
    data_cadastro TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS titulos(
    id SERIAL PRIMARY KEY,
    nome_titulo VARCHAR (50) NOT NULL UNIQUE,
    descricao VARCHAR(200) NOT NULL,
    kane_points_desbloqueio INTEGER NOT NULL CHECK (kane_points_desbloqueio >= 0)
);

CREATE TABLE IF NOT EXISTS posts(
    id SERIAL PRIMARY KEY,
    texto TEXT NOT NULL,
    foto BYTEA,
    editado BOOLEAN NOT NULL DEFAULT FALSE,
    data_post TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    usuario_id INTEGER NOT NULL,
    CONSTRAINT fk_usuario_posts FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS noticias(
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    subtitulo VARCHAR(500) NOT NULL,
    conteudo TEXT NOT NULL,
    foto BYTEA,
    categoria VARCHAR(50) NOT NULL DEFAULT 'Harry Kane',
    editada BOOLEAN NOT NULL DEFAULT FALSE,
    data_noticia TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    usuario_id INTEGER NOT NULL,
    CONSTRAINT fk_usuario_noticia FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS palavraschave(
    id SERIAL PRIMARY KEY,
    palavra VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS comentariosposts(
    id SERIAL PRIMARY KEY,
    texto TEXT NOT NULL,
    data_comentario TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    usuario_id INTEGER NOT NULL,
    post_id INTEGER NOT NULL,
    CONSTRAINT fk_usuario_comentario_post FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    CONSTRAINT fk_post_comentario FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS comentariosnoticias(
    id SERIAL PRIMARY KEY,
    texto TEXT NOT NULL,
    data_comentario TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    usuario_id INTEGER NOT NULL,
    noticia_id INTEGER NOT NULL,
    CONSTRAINT fk_usuario_comentario_noticia FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    CONSTRAINT fk_noticia_comentario FOREIGN KEY (noticia_id) REFERENCES noticias(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS reacoesnoticias(
    id SERIAL PRIMARY KEY,
    tipo VARCHAR(20) NOT NULL CHECK (tipo in ('curtida','fogo','caveira','risada')),
    usuario_id INTEGER NOT NULL,
    noticia_id INTEGER NOT NULL,
    CONSTRAINT fk_usuario_reacao_noticia FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    CONSTRAINT fk_noticia_reacao FOREIGN KEY (noticia_id) REFERENCES noticias(id) ON DELETE CASCADE,
    CONSTRAINT unique_usuario_reacao_noticia UNIQUE (usuario_id, noticia_id)
);

CREATE TABLE IF NOT EXISTS reacoesposts(
    id SERIAL PRIMARY KEY,
    tipo VARCHAR(20) NOT NULL CHECK (tipo in ('curtida','fogo','caveira','risada')),
    usuario_id INTEGER NOT NULL,
    post_id INTEGER NOT NULL,
    CONSTRAINT fk_usuario_reacao_post FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    CONSTRAINT fk_post_reacao FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    CONSTRAINT unique_usuario_reacao_post UNIQUE (usuario_id, post_id)
);

CREATE TABLE IF NOT EXISTS usuario_titulo(
    usuario_id INTEGER NOT NULL,
    titulo_id INTEGER NOT NULL,
    data_desbloqueio TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_usuario_id FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE, 
    CONSTRAINT fk_titulo_id FOREIGN KEY (titulo_id) REFERENCES titulos(id) ON DELETE CASCADE,
    PRIMARY KEY (usuario_id, titulo_id)
);

CREATE TABLE IF NOT EXISTS banimentos(
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL,
    administrador_id INTEGER NOT NULL,
    motivo VARCHAR(500) NOT NULL,
    data_banimento TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT fk_banimento_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
    CONSTRAINT fk_banimento_administrador FOREIGN KEY (administrador_id) REFERENCES usuarios(id)
);

CREATE TABLE IF NOT EXISTS noticia_palavrachave(
    noticia_id INTEGER NOT NULL,
    palavra_id INTEGER NOT NULL,
    CONSTRAINT fk_noticia_palavra_noticia FOREIGN KEY (noticia_id) REFERENCES noticias(id) ON DELETE CASCADE,
    CONSTRAINT fk_palavra_id FOREIGN KEY (palavra_id) REFERENCES palavraschave(id) ON DELETE CASCADE,
    PRIMARY KEY (noticia_id, palavra_id)
);

CREATE TABLE IF NOT EXISTS post_palavrachave(
    post_id INTEGER NOT NULL,
    palavra_id INTEGER NOT NULL,
    CONSTRAINT fk_post_palavra_post FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    CONSTRAINT fk_palavra_id FOREIGN KEY (palavra_id) REFERENCES palavraschave(id) ON DELETE CASCADE,
    PRIMARY KEY (post_id, palavra_id)
    
);

INSERT INTO usuarios (nome_usuario, email, senha_hash, descricao, kane_points, cargo) VALUES ('Harry', 'kane@email.com', 'hashqualquer','eu prazer.', 150, 'admin');
INSERT INTO usuarios (nome_usuario, email, senha_hash, descricao, kane_points, cargo) VALUES ('Bayern', 'bayern@email.com', 'hashqualquer','aqui é borussia!', 80, 'user');
INSERT INTO usuarios (nome_usuario, email, senha_hash, descricao, banido, kane_points, cargo) VALUES ('Thebeststrikerintheworld', 'a@email.com', 'hashqualquer','ho',TRUE, 40, 'user');

INSERT INTO titulos (nome_titulo, descricao, kane_points_desbloqueio) VALUES ('Ballondor', 'o melhor', 100);
INSERT INTO titulos (nome_titulo, descricao, kane_points_desbloqueio) VALUES ('nba', 'biribinha', 50);
INSERT INTO titulos (nome_titulo, descricao, kane_points_desbloqueio) VALUES ('ze ninguem', 'contribuiu muito pouco ao nosso senhor harry kane', 25);

INSERT INTO posts (texto, usuario_id) VALUES ('The best striker in thr eowrld', 1);
INSERT INTO posts (texto, usuario_id) VALUES ('Bayern 1 Montegladbach 0', 2);
INSERT INTO posts (texto, usuario_id) VALUES ('asdasdasdadasdsadasdasdasdsa', 3);

INSERT INTO noticias (titulo, subtitulo, conteudo, categoria, usuario_id) VALUES ('Harry Kane brilha em mais uma partida', 'Atacante é destaque no Bayern.', 'Harry Kane teve uma grande atuação e ajudou sua equipe a conquistar um resultado importante.', 'Bayern de Munique', 1);
INSERT INTO noticias (titulo, subtitulo, conteudo, categoria, usuario_id) VALUES ('Kane cobra tiro de meta', 'neuer pede aposentadoria apos isso', 'foi indicado ao premio de melhor goleiro do ano o atacante harry kane camisa 9 do bayern demunique', 'Memes', 2);

INSERT INTO palavraschave (palavra) VALUES ('Harry Kane');
INSERT INTO palavraschave (palavra) VALUES ('Bayern de Munique');
INSERT INTO palavraschave (palavra) VALUES ('Recordes');
INSERT INTO palavraschave (palavra) VALUES ('Memes');

INSERT INTO comentariosposts (texto, usuario_id, post_id) VALUES ('ABSURDO DE JOGADOR KKKKK', 2, 1);
INSERT INTO comentariosposts (texto, usuario_id, post_id) VALUES ('melhor q o suarez no auge', 3, 1);
INSERT INTO comentariosposts (texto, usuario_id, post_id) VALUES ('jogao viva os bavaros', 1, 2);

INSERT INTO comentariosnoticias (texto, usuario_id, noticia_id) VALUES ('o homem é uma maquina', 2, 1);
INSERT INTO comentariosnoticias (texto, usuario_id, noticia_id) VALUES ('mais um dia normal', 3, 1);
INSERT INTO comentariosnoticias (texto, usuario_id, noticia_id) VALUES ('to mais pra ganhar o premio de maior comedor de fish and chips do pais', 1, 2);

INSERT INTO reacoesnoticias (tipo, usuario_id, noticia_id) VALUES ('fogo', 1, 1);
INSERT INTO reacoesnoticias (tipo, usuario_id, noticia_id) VALUES ('curtida', 2, 1);
INSERT INTO reacoesnoticias (tipo, usuario_id, noticia_id) VALUES ('risada', 3, 2);

INSERT INTO reacoesposts (tipo, usuario_id, post_id) VALUES ('fogo', 2, 1);
INSERT INTO reacoesposts (tipo, usuario_id, post_id) VALUES ('risada', 3, 1);
INSERT INTO reacoesposts (tipo, usuario_id, post_id) VALUES ('curtida', 1, 2);
INSERT INTO reacoesposts (tipo, usuario_id, post_id) VALUES ('caveira', 2, 3);

INSERT INTO usuario_titulo (usuario_id, titulo_id) VALUES (1, 1);
INSERT INTO usuario_titulo (usuario_id, titulo_id) VALUES (1, 2);
INSERT INTO usuario_titulo (usuario_id, titulo_id) VALUES (2, 2);
INSERT INTO usuario_titulo (usuario_id, titulo_id) VALUES (3, 3);

INSERT INTO noticia_palavrachave (noticia_id, palavra_id) VALUES (1, 1);
INSERT INTO noticia_palavrachave (noticia_id, palavra_id) VALUES (1, 2);
INSERT INTO noticia_palavrachave (noticia_id, palavra_id) VALUES (1, 3);
INSERT INTO noticia_palavrachave (noticia_id, palavra_id) VALUES (2, 1);
INSERT INTO noticia_palavrachave (noticia_id, palavra_id) VALUES (2, 4);

INSERT INTO post_palavrachave (post_id, palavra_id) VALUES (1, 1);
INSERT INTO post_palavrachave (post_id, palavra_id) VALUES (1, 2);
INSERT INTO post_palavrachave (post_id, palavra_id) VALUES (2, 2);
INSERT INTO post_palavrachave (post_id, palavra_id) VALUES (3, 1);
INSERT INTO post_palavrachave (post_id, palavra_id) VALUES (3, 4);

INSERT INTO banimentos (usuario_id, administrador_id, motivo, ativo) VALUES (3, 1, 'falou mal do grande Kane', TRUE);