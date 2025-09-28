-- CreateTable
CREATE TABLE "usuarios" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha" TEXT NOT NULL,
    "dataCadastro" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "times" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "escudo" TEXT,
    "dataCriacao" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "criadorId" INTEGER NOT NULL,
    CONSTRAINT "times_criadorId_fkey" FOREIGN KEY ("criadorId") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "jogadores" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "posicao" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "timeId" INTEGER NOT NULL,
    CONSTRAINT "jogadores_timeId_fkey" FOREIGN KEY ("timeId") REFERENCES "times" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "campeonatos" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "formato" TEXT NOT NULL,
    "dataInicio" DATETIME NOT NULL,
    "privado" BOOLEAN NOT NULL DEFAULT false,
    "organizadorId" INTEGER NOT NULL,
    CONSTRAINT "campeonatos_organizadorId_fkey" FOREIGN KEY ("organizadorId") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "partidas" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "dataHora" DATETIME NOT NULL,
    "local" TEXT NOT NULL,
    "fase" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'AGENDADA',
    "campeonatoId" INTEGER NOT NULL,
    "timeCasaId" INTEGER NOT NULL,
    "timeVisitanteId" INTEGER NOT NULL,
    CONSTRAINT "partidas_campeonatoId_fkey" FOREIGN KEY ("campeonatoId") REFERENCES "campeonatos" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "partidas_timeCasaId_fkey" FOREIGN KEY ("timeCasaId") REFERENCES "times" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "partidas_timeVisitanteId_fkey" FOREIGN KEY ("timeVisitanteId") REFERENCES "times" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "resultados" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "golsCasa" INTEGER NOT NULL DEFAULT 0,
    "golsVisitante" INTEGER NOT NULL DEFAULT 0,
    "penaltisCasa" INTEGER NOT NULL DEFAULT 0,
    "penaltisVisitante" INTEGER NOT NULL DEFAULT 0,
    "partidaId" INTEGER NOT NULL,
    CONSTRAINT "resultados_partidaId_fkey" FOREIGN KEY ("partidaId") REFERENCES "partidas" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "inscricoes" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "dataInscricao" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'PENDENTE',
    "timeId" INTEGER NOT NULL,
    "campeonatoId" INTEGER NOT NULL,
    CONSTRAINT "inscricoes_timeId_fkey" FOREIGN KEY ("timeId") REFERENCES "times" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "inscricoes_campeonatoId_fkey" FOREIGN KEY ("campeonatoId") REFERENCES "campeonatos" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "estatisticas" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "gols" INTEGER NOT NULL DEFAULT 0,
    "assistencias" INTEGER NOT NULL DEFAULT 0,
    "cartoes" TEXT,
    "jogadorId" INTEGER NOT NULL,
    "partidaId" INTEGER NOT NULL,
    CONSTRAINT "estatisticas_jogadorId_fkey" FOREIGN KEY ("jogadorId") REFERENCES "jogadores" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "estatisticas_partidaId_fkey" FOREIGN KEY ("partidaId") REFERENCES "partidas" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "notificacoes" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tipo" TEXT NOT NULL,
    "mensagem" TEXT NOT NULL,
    "lida" BOOLEAN NOT NULL DEFAULT false,
    "dataEnvio" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuarioId" INTEGER NOT NULL,
    CONSTRAINT "notificacoes_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "classificacoes" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "posicao" INTEGER NOT NULL,
    "pontos" INTEGER NOT NULL DEFAULT 0,
    "vitorias" INTEGER NOT NULL DEFAULT 0,
    "empates" INTEGER NOT NULL DEFAULT 0,
    "derrotas" INTEGER NOT NULL DEFAULT 0,
    "saldoGols" INTEGER NOT NULL DEFAULT 0,
    "timeId" INTEGER NOT NULL,
    "campeonatoId" INTEGER NOT NULL,
    CONSTRAINT "classificacoes_timeId_fkey" FOREIGN KEY ("timeId") REFERENCES "times" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "classificacoes_campeonatoId_fkey" FOREIGN KEY ("campeonatoId") REFERENCES "campeonatos" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "jogadores_timeId_numero_key" ON "jogadores"("timeId", "numero");

-- CreateIndex
CREATE UNIQUE INDEX "resultados_partidaId_key" ON "resultados"("partidaId");

-- CreateIndex
CREATE UNIQUE INDEX "inscricoes_timeId_campeonatoId_key" ON "inscricoes"("timeId", "campeonatoId");

-- CreateIndex
CREATE UNIQUE INDEX "estatisticas_jogadorId_partidaId_key" ON "estatisticas"("jogadorId", "partidaId");

-- CreateIndex
CREATE UNIQUE INDEX "classificacoes_timeId_campeonatoId_key" ON "classificacoes"("timeId", "campeonatoId");
