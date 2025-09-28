-- CreateEnum
CREATE TYPE "StatusPartida" AS ENUM ('AGENDADA', 'EM_ANDAMENTO', 'FINALIZADA', 'ADIADA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "TipoNotificacao" AS ENUM ('CONVITE', 'LEMBRETE_PARTIDA', 'RESULTADO', 'ALTERACAO_DATA', 'INSCRICAO_ACEITA', 'NOVA_FASE');

-- CreateEnum
CREATE TYPE "FormatoCampeonato" AS ENUM ('ELIMINACAO_SIMPLES', 'ELIMINACAO_DUPLA', 'GRUPOS_ELIMINACAO', 'PONTOS_CORRIDOS', 'SUICO', 'ROUND_ROBIN', 'MATA_MATA_GRUPOS', 'PLAYOFF', 'LIGA_ASCENSO', 'TORNEIO_DUPLO', 'CLASSIFICATORIO', 'COPA_LIGA', 'CHAMPIONS', 'MUNDIAL', 'REGIONAL', 'ESTADUAL', 'MUNICIPAL', 'AMISTOSO', 'FESTIVAL', 'EXHIBITION');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha" TEXT NOT NULL,
    "dataCadastro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "times" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "escudo" TEXT,
    "dataCriacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "criadorId" INTEGER NOT NULL,

    CONSTRAINT "times_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jogadores" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "posicao" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "timeId" INTEGER NOT NULL,

    CONSTRAINT "jogadores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campeonatos" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "formato" "FormatoCampeonato" NOT NULL,
    "dataInicio" TIMESTAMP(3) NOT NULL,
    "privado" BOOLEAN NOT NULL DEFAULT false,
    "codigo" TEXT,
    "organizadorId" INTEGER NOT NULL,

    CONSTRAINT "campeonatos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "partidas" (
    "id" SERIAL NOT NULL,
    "dataHora" TIMESTAMP(3) NOT NULL,
    "local" TEXT NOT NULL,
    "fase" TEXT NOT NULL,
    "status" "StatusPartida" NOT NULL DEFAULT 'AGENDADA',
    "campeonatoId" INTEGER NOT NULL,
    "timeCasaId" INTEGER NOT NULL,
    "timeVisitanteId" INTEGER NOT NULL,

    CONSTRAINT "partidas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resultados" (
    "id" SERIAL NOT NULL,
    "golsCasa" INTEGER NOT NULL DEFAULT 0,
    "golsVisitante" INTEGER NOT NULL DEFAULT 0,
    "penaltisCasa" INTEGER NOT NULL DEFAULT 0,
    "penaltisVisitante" INTEGER NOT NULL DEFAULT 0,
    "partidaId" INTEGER NOT NULL,

    CONSTRAINT "resultados_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inscricoes" (
    "id" SERIAL NOT NULL,
    "dataInscricao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'PENDENTE',
    "timeId" INTEGER NOT NULL,
    "campeonatoId" INTEGER NOT NULL,

    CONSTRAINT "inscricoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "estatisticas" (
    "id" SERIAL NOT NULL,
    "gols" INTEGER NOT NULL DEFAULT 0,
    "assistencias" INTEGER NOT NULL DEFAULT 0,
    "cartoes" TEXT,
    "jogadorId" INTEGER NOT NULL,
    "partidaId" INTEGER NOT NULL,

    CONSTRAINT "estatisticas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notificacoes" (
    "id" SERIAL NOT NULL,
    "tipo" "TipoNotificacao" NOT NULL,
    "mensagem" TEXT NOT NULL,
    "lida" BOOLEAN NOT NULL DEFAULT false,
    "dataEnvio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuarioId" INTEGER NOT NULL,

    CONSTRAINT "notificacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "classificacoes" (
    "id" SERIAL NOT NULL,
    "posicao" INTEGER NOT NULL,
    "pontos" INTEGER NOT NULL DEFAULT 0,
    "vitorias" INTEGER NOT NULL DEFAULT 0,
    "empates" INTEGER NOT NULL DEFAULT 0,
    "derrotas" INTEGER NOT NULL DEFAULT 0,
    "golsPro" INTEGER NOT NULL DEFAULT 0,
    "golsContra" INTEGER NOT NULL DEFAULT 0,
    "saldoGols" INTEGER NOT NULL DEFAULT 0,
    "jogos" INTEGER NOT NULL DEFAULT 0,
    "timeId" INTEGER NOT NULL,
    "campeonatoId" INTEGER NOT NULL,

    CONSTRAINT "classificacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "escalacoes" (
    "id" SERIAL NOT NULL,
    "formacao" TEXT NOT NULL,
    "titular" BOOLEAN NOT NULL DEFAULT true,
    "partidaId" INTEGER NOT NULL,
    "timeId" INTEGER NOT NULL,
    "jogadorId" INTEGER NOT NULL,

    CONSTRAINT "escalacoes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "jogadores_timeId_numero_key" ON "jogadores"("timeId", "numero");

-- CreateIndex
CREATE UNIQUE INDEX "campeonatos_codigo_key" ON "campeonatos"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "resultados_partidaId_key" ON "resultados"("partidaId");

-- CreateIndex
CREATE UNIQUE INDEX "inscricoes_timeId_campeonatoId_key" ON "inscricoes"("timeId", "campeonatoId");

-- CreateIndex
CREATE UNIQUE INDEX "estatisticas_jogadorId_partidaId_key" ON "estatisticas"("jogadorId", "partidaId");

-- CreateIndex
CREATE UNIQUE INDEX "classificacoes_timeId_campeonatoId_key" ON "classificacoes"("timeId", "campeonatoId");

-- CreateIndex
CREATE UNIQUE INDEX "escalacoes_partidaId_timeId_jogadorId_key" ON "escalacoes"("partidaId", "timeId", "jogadorId");

-- AddForeignKey
ALTER TABLE "times" ADD CONSTRAINT "times_criadorId_fkey" FOREIGN KEY ("criadorId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jogadores" ADD CONSTRAINT "jogadores_timeId_fkey" FOREIGN KEY ("timeId") REFERENCES "times"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campeonatos" ADD CONSTRAINT "campeonatos_organizadorId_fkey" FOREIGN KEY ("organizadorId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partidas" ADD CONSTRAINT "partidas_campeonatoId_fkey" FOREIGN KEY ("campeonatoId") REFERENCES "campeonatos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partidas" ADD CONSTRAINT "partidas_timeCasaId_fkey" FOREIGN KEY ("timeCasaId") REFERENCES "times"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partidas" ADD CONSTRAINT "partidas_timeVisitanteId_fkey" FOREIGN KEY ("timeVisitanteId") REFERENCES "times"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resultados" ADD CONSTRAINT "resultados_partidaId_fkey" FOREIGN KEY ("partidaId") REFERENCES "partidas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inscricoes" ADD CONSTRAINT "inscricoes_timeId_fkey" FOREIGN KEY ("timeId") REFERENCES "times"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inscricoes" ADD CONSTRAINT "inscricoes_campeonatoId_fkey" FOREIGN KEY ("campeonatoId") REFERENCES "campeonatos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estatisticas" ADD CONSTRAINT "estatisticas_jogadorId_fkey" FOREIGN KEY ("jogadorId") REFERENCES "jogadores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estatisticas" ADD CONSTRAINT "estatisticas_partidaId_fkey" FOREIGN KEY ("partidaId") REFERENCES "partidas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificacoes" ADD CONSTRAINT "notificacoes_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classificacoes" ADD CONSTRAINT "classificacoes_timeId_fkey" FOREIGN KEY ("timeId") REFERENCES "times"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classificacoes" ADD CONSTRAINT "classificacoes_campeonatoId_fkey" FOREIGN KEY ("campeonatoId") REFERENCES "campeonatos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "escalacoes" ADD CONSTRAINT "escalacoes_partidaId_fkey" FOREIGN KEY ("partidaId") REFERENCES "partidas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "escalacoes" ADD CONSTRAINT "escalacoes_timeId_fkey" FOREIGN KEY ("timeId") REFERENCES "times"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "escalacoes" ADD CONSTRAINT "escalacoes_jogadorId_fkey" FOREIGN KEY ("jogadorId") REFERENCES "jogadores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;