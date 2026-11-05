-- CreateEnum
CREATE TYPE "RoleType" AS ENUM ('AFICIONADO', 'JUGADOR', 'DELEGADO', 'ARBITRO', 'LIGA', 'SUPERADMIN');

-- CreateEnum
CREATE TYPE "Sexo" AS ENUM ('HOMBRE', 'MUJER', 'OTRO');

-- CreateEnum
CREATE TYPE "Zona" AS ENUM ('NORTE', 'SUR', 'ORIENTE', 'PONIENTE', 'CENTRO');

-- CreateEnum
CREATE TYPE "TipoFutbol" AS ENUM ('SOCCER', 'RAPIDO', 'FUT7', 'FUT8', 'FUT9', 'SALON');

-- CreateEnum
CREATE TYPE "Categoria" AS ENUM ('LIBRE', 'VETERANOS', 'FEMENIL', 'MIXTA');

-- CreateEnum
CREATE TYPE "Rama" AS ENUM ('VARONIL', 'FEMENIL', 'MIXTA');

-- CreateEnum
CREATE TYPE "Posicion" AS ENUM ('POR', 'DFC', 'LAT', 'MCD', 'MC', 'MCO', 'EXT', 'DC');

-- CreateEnum
CREATE TYPE "PositionGroup" AS ENUM ('PORTERO', 'DEFENSA', 'MEDIO', 'DELANTERO');

-- CreateEnum
CREATE TYPE "PieHabil" AS ENUM ('DERECHO', 'IZQUIERDO', 'AMBIDIESTRO');

-- CreateEnum
CREATE TYPE "RangoEquiposJugados" AS ENUM ('DE_1_A_10', 'DE_10_A_20', 'DE_20_A_30', 'MAS_DE_30');

-- CreateEnum
CREATE TYPE "Superficie" AS ENUM ('PASTO_NATURAL', 'SINTETICO', 'CONCRETO', 'TIERRA', 'DUELA');

-- CreateEnum
CREATE TYPE "CardTier" AS ENUM ('BRONCE', 'PLATA', 'ORO', 'LEYENDA');

-- CreateEnum
CREATE TYPE "PostType" AS ENUM ('NORMAL', 'AUTO_GOL', 'AUTO_RESULTADO', 'AUTO_CRONICA', 'AUTO_PORTADA', 'AUTO_ONCE_JORNADA', 'AUTO_MVP', 'AUTO_INSIGNIA', 'AUTO_CAMPEON', 'AUTO_FICHAJE', 'AUTO_TABLA', 'AUTO_TORNEO', 'AUTO_RACHA', 'AUTO_CIERRE_TEMPORADA');

-- CreateEnum
CREATE TYPE "PostAuthorAs" AS ENUM ('USER', 'TEAM', 'LEAGUE', 'SYSTEM');

-- CreateEnum
CREATE TYPE "ContentSource" AS ENUM ('HUMANO', 'PLANTILLA', 'IA');

-- CreateEnum
CREATE TYPE "Visibility" AS ENUM ('PUBLICO', 'SEGUIDORES', 'EQUIPO');

-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('IMAGE', 'VIDEO');

-- CreateEnum
CREATE TYPE "ReactionType" AS ENUM ('FUEGO', 'GOLAZO', 'TROFEO');

-- CreateEnum
CREATE TYPE "ReportTarget" AS ENUM ('POST', 'COMMENT', 'USER', 'TEAM', 'BOARD_POST');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('ABIERTO', 'OCULTADO', 'MANTENIDO', 'AVISADO');

-- CreateEnum
CREATE TYPE "PollType" AS ENUM ('MVP_PARTIDO', 'GOLAZO_JORNADA', 'ONCE_JORNADA', 'ATAJADA_JORNADA', 'EL_MURO');

-- CreateEnum
CREATE TYPE "PollStatus" AS ENUM ('ABIERTA', 'CERRADA');

-- CreateEnum
CREATE TYPE "BoardPostType" AS ENUM ('BUSCO_JUGADOR', 'BUSCO_EQUIPO', 'JUGADOR_LIBRE', 'FALTA_PARA_RETA', 'FICHAJE');

-- CreateEnum
CREATE TYPE "ChallengeStatus" AS ENUM ('PROPUESTA', 'ACEPTADA', 'RECHAZADA', 'JUGADA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "WhoPays" AS ENUM ('RETADOR', 'RETADO', 'MITAD', 'CADA_QUIEN');

-- CreateEnum
CREATE TYPE "TeamMemberRole" AS ENUM ('DELEGADO_PRINCIPAL', 'DELEGADO_AUXILIAR', 'CAPITAN', 'JUGADOR');

-- CreateEnum
CREATE TYPE "MembershipStatus" AS ENUM ('SOLICITADO', 'INVITADO', 'ACTIVO', 'RECHAZADO', 'BAJA');

-- CreateEnum
CREATE TYPE "LeagueAdminRole" AS ENUM ('DUENO', 'ADMINISTRADOR', 'GESTOR');

-- CreateEnum
CREATE TYPE "TournamentFormat" AS ENUM ('LIGA', 'LIGA_LIGUILLA', 'COPA');

-- CreateEnum
CREATE TYPE "TournamentStatus" AS ENUM ('BORRADOR', 'INSCRIPCIONES_ABIERTAS', 'EN_CURSO', 'LIGUILLA', 'FINALIZADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "RegistrationStatus" AS ENUM ('SOLICITADA', 'ACEPTADA', 'RECHAZADA', 'BAJA');

-- CreateEnum
CREATE TYPE "RosterStatus" AS ENUM ('PENDIENTE_APROBACION', 'ACTIVO', 'SUSPENDIDO', 'BAJA');

-- CreateEnum
CREATE TYPE "Fase" AS ENUM ('REGULAR', 'OCTAVOS', 'CUARTOS', 'SEMIFINAL', 'TERCER_LUGAR', 'FINAL');

-- CreateEnum
CREATE TYPE "MatchKind" AS ENUM ('TORNEO', 'RETA');

-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('PROGRAMADO', 'EN_JUEGO', 'POR_FIRMAR', 'FINALIZADO', 'VALIDADO', 'EN_DISPUTA', 'SUSPENDIDO', 'REPROGRAMADO', 'CANCELADO', 'DEFAULT');

-- CreateEnum
CREATE TYPE "ScoreSource" AS ENUM ('ARBITRO', 'DELEGADO', 'AFICIONADO', 'LIGA');

-- CreateEnum
CREATE TYPE "AssignmentStatus" AS ENUM ('ASIGNADO', 'ACEPTADO', 'RECHAZADO');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('CONVOCADO', 'VA', 'NO_VA', 'LESIONADO', 'PRESENTE', 'AUSENTE');

-- CreateEnum
CREATE TYPE "ResponseChannel" AS ENUM ('APP', 'LINK');

-- CreateEnum
CREATE TYPE "MatchEventType" AS ENUM ('INICIO_PARTIDO', 'MEDIO_TIEMPO', 'FIN_PARTIDO', 'GOL', 'AUTOGOL', 'PENAL_FALLADO', 'PENAL_ATAJADO', 'AMARILLA', 'ROJA', 'CAMBIO', 'LESION_GRAVE', 'CACHIRUL', 'SUSPENSION');

-- CreateEnum
CREATE TYPE "TipoGol" AS ENUM ('JUGADA', 'CABEZA', 'PENAL', 'TIRO_LIBRE', 'FUERA_DEL_AREA', 'CHILENA', 'PANENKA', 'OLIMPICO');

-- CreateEnum
CREATE TYPE "ReportSource" AS ENUM ('APP_ARBITRO', 'PAPEL_LIGA');

-- CreateEnum
CREATE TYPE "MatchReportStatus" AS ENUM ('BORRADOR', 'ENVIADA', 'EN_CORRECCION', 'FIRMADA', 'VALIDADA');

-- CreateEnum
CREATE TYPE "CorrectionKind" AS ENUM ('JUGADOR_EQUIVOCADO', 'MINUTO', 'TIPO_EVENTO', 'FALTA_EVENTO', 'SOBRA_EVENTO');

-- CreateEnum
CREATE TYPE "CorrectionStatus" AS ENUM ('PENDIENTE', 'ACEPTADA', 'RECHAZADA');

-- CreateEnum
CREATE TYPE "SanctionType" AS ENUM ('SUSPENSION_PARTIDOS', 'MULTA', 'EXPULSION_TORNEO', 'PERDIDA_PARTIDO');

-- CreateEnum
CREATE TYPE "SanctionStatus" AS ENUM ('ACTIVA', 'CUMPLIDA', 'ANULADA');

-- CreateEnum
CREATE TYPE "SuspensionRequestStatus" AS ENUM ('PENDIENTE', 'CONFIRMADA', 'RECHAZADA');

-- CreateEnum
CREATE TYPE "ChargeConcept" AS ENUM ('INSCRIPCION', 'ARBITRAJE', 'MULTA', 'OTRO');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDIENTE', 'REPORTADO', 'CONFIRMADO', 'CONDONADO');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('NUEVO_SEGUIDOR', 'REACCION', 'COMENTARIO', 'ETIQUETA', 'INSIGNIA', 'CARTA_ACTUALIZADA', 'PERFIL_CREADO', 'INVITACION_EQUIPO', 'ALTA_EQUIPO', 'PASE_DE_LISTA', 'RECORDATORIO_PARTIDO', 'PARTIDO_EN_VIVO', 'RESULTADO_OFICIAL', 'CEDULA_POR_FIRMAR', 'CORRECCION_CEDULA', 'ASIGNACION_ARBITRO', 'NO_HAY_JUEGO', 'PARTIDO_SUSPENDIDO', 'SANCION', 'ALERTA_TARJETAS', 'CUOTA', 'PAGO_REPORTADO', 'VOTACION_ABIERTA', 'QUINIELA', 'RETA', 'PORTADA', 'LIGA', 'SISTEMA');

-- CreateEnum
CREATE TYPE "BugStatus" AS ENUM ('NUEVO', 'EN_REVISION', 'RESUELTO', 'DESCARTADO');

-- CreateEnum
CREATE TYPE "AdminAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'VALIDATE', 'OVERRIDE');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('PENDIENTE', 'CORRIENDO', 'HECHO', 'FALLIDO');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "authId" UUID,
    "claimedAt" TIMESTAMP(3),
    "createdById" UUID,
    "username" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellidos" TEXT,
    "sobrenombre" TEXT,
    "fechaNacimiento" DATE,
    "sexo" "Sexo",
    "celular" TEXT,
    "email" TEXT,
    "fotoPath" TEXT,
    "bio" VARCHAR(160),
    "zona" "Zona",
    "alcaldia" TEXT,
    "facebookUrl" TEXT,
    "instagramUrl" TEXT,
    "contactoEmergenciaNom" TEXT,
    "contactoEmergenciaTel" TEXT,
    "activeRole" "RoleType" NOT NULL DEFAULT 'AFICIONADO',
    "profileCompletion" INTEGER NOT NULL DEFAULT 0,
    "qrToken" TEXT NOT NULL,
    "isPionero" BOOLEAN NOT NULL DEFAULT false,
    "searchable" BOOLEAN NOT NULL DEFAULT true,
    "showCelularToTeam" BOOLEAN NOT NULL DEFAULT true,
    "followersCount" INTEGER NOT NULL DEFAULT 0,
    "followingCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastSeenAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "userId" UUID NOT NULL,
    "role" "RoleType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("userId","role")
);

-- CreateTable
CREATE TABLE "player_profiles" (
    "userId" UUID NOT NULL,
    "posiciones" "Posicion"[],
    "posicionPrincipal" "Posicion",
    "pieHabil" "PieHabil",
    "numeroFavorito" INTEGER,
    "tallaCalzado" DECIMAL(3,1),
    "tallaPantalon" TEXT,
    "tallaPlayera" TEXT,
    "tiposFutbol" "TipoFutbol"[],
    "categoriasInteres" "Categoria"[],
    "equiposJugados" "RangoEquiposJugados",
    "superficieFavorita" "Superficie",
    "disponibleFichar" BOOLEAN NOT NULL DEFAULT false,
    "partidos" INTEGER NOT NULL DEFAULT 0,
    "goles" INTEGER NOT NULL DEFAULT 0,
    "asistencias" INTEGER NOT NULL DEFAULT 0,
    "amarillas" INTEGER NOT NULL DEFAULT 0,
    "rojas" INTEGER NOT NULL DEFAULT 0,
    "titulos" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "player_profiles_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "referee_profiles" (
    "userId" UUID NOT NULL,
    "tiposFutbol" "TipoFutbol"[],
    "categorias" "Categoria"[],
    "zonasInteres" "Zona"[],
    "temporadas" INTEGER,
    "tallaPlayera" TEXT,
    "tallaPantalon" TEXT,
    "partidosPitados" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "referee_profiles_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "player_cards" (
    "userId" UUID NOT NULL,
    "positionGroup" "PositionGroup" NOT NULL DEFAULT 'MEDIO',
    "tier" "CardTier" NOT NULL DEFAULT 'BRONCE',
    "media" INTEGER,
    "enConstruccion" BOOLEAN NOT NULL DEFAULT true,
    "partidosValidados" INTEGER NOT NULL DEFAULT 0,
    "atributos" JSONB,
    "goles" INTEGER NOT NULL DEFAULT 0,
    "partidos" INTEGER NOT NULL DEFAULT 0,
    "asistencias" INTEGER NOT NULL DEFAULT 0,
    "deltaUltimaJornada" INTEGER NOT NULL DEFAULT 0,
    "recalculadaAt" TIMESTAMP(3),

    CONSTRAINT "player_cards_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "player_card_snapshots" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "roundId" UUID,
    "semana" DATE NOT NULL,
    "media" INTEGER,
    "tier" "CardTier" NOT NULL,
    "atributos" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "player_card_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_follows" (
    "followerId" UUID NOT NULL,
    "followedId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_follows_pkey" PRIMARY KEY ("followerId","followedId")
);

-- CreateTable
CREATE TABLE "team_follows" (
    "userId" UUID NOT NULL,
    "teamId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "team_follows_pkey" PRIMARY KEY ("userId","teamId")
);

-- CreateTable
CREATE TABLE "league_follows" (
    "userId" UUID NOT NULL,
    "leagueId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "league_follows_pkey" PRIMARY KEY ("userId","leagueId")
);

-- CreateTable
CREATE TABLE "posts" (
    "id" UUID NOT NULL,
    "type" "PostType" NOT NULL DEFAULT 'NORMAL',
    "source" "ContentSource" NOT NULL DEFAULT 'HUMANO',
    "authorId" UUID,
    "authorAs" "PostAuthorAs" NOT NULL DEFAULT 'USER',
    "subjectUserId" UUID,
    "teamId" UUID,
    "leagueId" UUID,
    "matchId" UUID,
    "tournamentId" UUID,
    "roundId" UUID,
    "body" VARCHAR(2000),
    "headline" VARCHAR(140),
    "visibility" "Visibility" NOT NULL DEFAULT 'PUBLICO',
    "zona" "Zona",
    "data" JSONB,
    "reactionsCount" INTEGER NOT NULL DEFAULT 0,
    "commentsCount" INTEGER NOT NULL DEFAULT 0,
    "sharesCount" INTEGER NOT NULL DEFAULT 0,
    "editedByLeague" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "hidden" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "post_media" (
    "id" UUID NOT NULL,
    "postId" UUID NOT NULL,
    "type" "MediaType" NOT NULL,
    "path" TEXT NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "durationS" INTEGER,
    "orden" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "post_media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "post_tags" (
    "postId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "hiddenByUser" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "post_tags_pkey" PRIMARY KEY ("postId","userId")
);

-- CreateTable
CREATE TABLE "reactions" (
    "postId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "type" "ReactionType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reactions_pkey" PRIMARY KEY ("postId","userId")
);

-- CreateTable
CREATE TABLE "anonymous_reactions" (
    "postId" UUID NOT NULL,
    "deviceHash" TEXT NOT NULL,
    "type" "ReactionType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "anonymous_reactions_pkey" PRIMARY KEY ("postId","deviceHash")
);

-- CreateTable
CREATE TABLE "comments" (
    "id" UUID NOT NULL,
    "authorId" UUID NOT NULL,
    "postId" UUID,
    "wallUserId" UUID,
    "wallTeamId" UUID,
    "parentId" UUID,
    "body" VARCHAR(1000) NOT NULL,
    "reactionsCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "hidden" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "badges" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "icon" TEXT,
    "repetible" BOOLEAN NOT NULL DEFAULT false,
    "criteria" JSONB NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "orden" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "badges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_badges" (
    "userId" UUID NOT NULL,
    "badgeId" UUID NOT NULL,
    "veces" INTEGER NOT NULL DEFAULT 1,
    "firstAwardedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastAwardedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "progreso" INTEGER,
    "meta" INTEGER,

    CONSTRAINT "user_badges_pkey" PRIMARY KEY ("userId","badgeId")
);

-- CreateTable
CREATE TABLE "reports" (
    "id" UUID NOT NULL,
    "reporterId" UUID NOT NULL,
    "leagueId" UUID,
    "targetType" "ReportTarget" NOT NULL,
    "targetId" UUID NOT NULL,
    "motivo" TEXT NOT NULL,
    "detalle" TEXT,
    "status" "ReportStatus" NOT NULL DEFAULT 'ABIERTO',
    "reviewedById" UUID,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blocks" (
    "blockerId" UUID NOT NULL,
    "blockedId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blocks_pkey" PRIMARY KEY ("blockerId","blockedId")
);

-- CreateTable
CREATE TABLE "predictions" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "matchId" UUID NOT NULL,
    "homeGoals" INTEGER NOT NULL,
    "awayGoals" INTEGER NOT NULL,
    "points" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "predictions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "polls" (
    "id" UUID NOT NULL,
    "type" "PollType" NOT NULL,
    "status" "PollStatus" NOT NULL DEFAULT 'ABIERTA',
    "titulo" TEXT NOT NULL,
    "posicion" "PositionGroup",
    "leagueId" UUID,
    "tournamentId" UUID,
    "roundId" UUID,
    "matchId" UUID,
    "teamId" UUID,
    "closesAt" TIMESTAMP(3) NOT NULL,
    "votesCount" INTEGER NOT NULL DEFAULT 0,
    "winnerOptionId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "polls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "poll_options" (
    "id" UUID NOT NULL,
    "pollId" UUID NOT NULL,
    "userId" UUID,
    "matchEventId" UUID,
    "etiqueta" TEXT NOT NULL,
    "votesCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "poll_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "poll_votes" (
    "pollId" UUID NOT NULL,
    "voterId" UUID NOT NULL,
    "optionId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "poll_votes_pkey" PRIMARY KEY ("pollId","voterId")
);

-- CreateTable
CREATE TABLE "respect_votes" (
    "matchId" UUID NOT NULL,
    "voterId" UUID NOT NULL,
    "receiverId" UUID NOT NULL,
    "score" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "respect_votes_pkey" PRIMARY KEY ("matchId","voterId","receiverId")
);

-- CreateTable
CREATE TABLE "fan_stats" (
    "userId" UUID NOT NULL,
    "teamId" UUID NOT NULL,
    "porraCount" INTEGER NOT NULL DEFAULT 0,
    "marcadoresReportados" INTEGER NOT NULL DEFAULT 0,
    "nivel" INTEGER NOT NULL DEFAULT 1,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fan_stats_pkey" PRIMARY KEY ("userId","teamId")
);

-- CreateTable
CREATE TABLE "board_posts" (
    "id" UUID NOT NULL,
    "type" "BoardPostType" NOT NULL,
    "authorId" UUID NOT NULL,
    "teamId" UUID,
    "titulo" VARCHAR(120) NOT NULL,
    "detalle" VARCHAR(600),
    "zona" "Zona",
    "tipoFutbol" "TipoFutbol",
    "posicion" "Posicion",
    "urgente" BOOLEAN NOT NULL DEFAULT false,
    "fechaPartido" TIMESTAMP(3),
    "whatsapp" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "board_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "challenges" (
    "id" UUID NOT NULL,
    "fromTeamId" UUID NOT NULL,
    "toTeamId" UUID NOT NULL,
    "createdById" UUID NOT NULL,
    "status" "ChallengeStatus" NOT NULL DEFAULT 'PROPUESTA',
    "propuestaAt" TIMESTAMP(3) NOT NULL,
    "lugar" TEXT,
    "venueId" UUID,
    "quienPaga" "WhoPays" NOT NULL DEFAULT 'MITAD',
    "mensaje" VARCHAR(300),
    "matchId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),

    CONSTRAINT "challenges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "actorId" UUID,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "href" TEXT,
    "data" JSONB,
    "readAt" TIMESTAMP(3),
    "pushedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "push_subscriptions" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "push_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_preferences" (
    "userId" UUID NOT NULL,
    "type" "NotificationType" NOT NULL,
    "inApp" BOOLEAN NOT NULL DEFAULT true,
    "push" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("userId","type")
);

-- CreateTable
CREATE TABLE "teams" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "siglas" VARCHAR(4),
    "escudoPath" TEXT,
    "colorPrimario" TEXT,
    "colorSecundario" TEXT,
    "bio" VARCHAR(300),
    "fundadoAnio" INTEGER,
    "zona" "Zona",
    "alcaldia" TEXT,
    "tipoFutbol" "TipoFutbol",
    "categoria" "Categoria",
    "diasJuego" INTEGER[],
    "whatsappGrupoUrl" TEXT,
    "datosPago" TEXT,
    "followersCount" INTEGER NOT NULL DEFAULT 0,
    "createdById" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_members" (
    "id" UUID NOT NULL,
    "teamId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "role" "TeamMemberRole" NOT NULL DEFAULT 'JUGADOR',
    "status" "MembershipStatus" NOT NULL,
    "numero" INTEGER,
    "posicion" "Posicion",
    "invitedById" UUID,
    "joinedAt" TIMESTAMP(3),
    "leftAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "team_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_dues" (
    "id" UUID NOT NULL,
    "teamId" UUID NOT NULL,
    "concepto" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "dueDate" DATE NOT NULL,
    "createdById" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "team_dues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_due_payments" (
    "dueId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDIENTE',
    "reportedAt" TIMESTAMP(3),
    "confirmedAt" TIMESTAMP(3),
    "confirmedById" UUID,
    "nota" TEXT,

    CONSTRAINT "team_due_payments_pkey" PRIMARY KEY ("dueId","userId")
);

-- CreateTable
CREATE TABLE "leagues" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "siglas" VARCHAR(5),
    "codigoAcceso" TEXT NOT NULL,
    "descripcion" TEXT,
    "logoPath" TEXT,
    "zona" "Zona",
    "alcaldia" TEXT,
    "tiposFutbol" "TipoFutbol"[],
    "categorias" "Categoria"[],
    "whatsappContacto" TEXT,
    "datosPago" TEXT,
    "verificada" BOOLEAN NOT NULL DEFAULT false,
    "requiereAprobacionJugadores" BOOLEAN NOT NULL DEFAULT true,
    "rankingsConHumor" BOOLEAN NOT NULL DEFAULT false,
    "followersCount" INTEGER NOT NULL DEFAULT 0,
    "createdById" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "leagues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "league_admins" (
    "leagueId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "role" "LeagueAdminRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "league_admins_pkey" PRIMARY KEY ("leagueId","userId")
);

-- CreateTable
CREATE TABLE "venues" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "direccion" TEXT NOT NULL,
    "alcaldia" TEXT,
    "zona" "Zona",
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "vestidores" BOOLEAN NOT NULL DEFAULT false,
    "estacionamiento" BOOLEAN NOT NULL DEFAULT false,
    "createdById" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "venues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fields" (
    "id" UUID NOT NULL,
    "venueId" UUID NOT NULL,
    "nombre" TEXT NOT NULL,
    "superficie" "Superficie" NOT NULL,
    "tipoFutbol" "TipoFutbol" NOT NULL,

    CONSTRAINT "fields_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "league_venues" (
    "leagueId" UUID NOT NULL,
    "venueId" UUID NOT NULL,

    CONSTRAINT "league_venues_pkey" PRIMARY KEY ("leagueId","venueId")
);

-- CreateTable
CREATE TABLE "league_referees" (
    "leagueId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "status" "MembershipStatus" NOT NULL,
    "tarifaCents" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "league_referees_pkey" PRIMARY KEY ("leagueId","userId")
);

-- CreateTable
CREATE TABLE "tournaments" (
    "id" UUID NOT NULL,
    "leagueId" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "categoria" "Categoria" NOT NULL,
    "tipoFutbol" "TipoFutbol" NOT NULL,
    "rama" "Rama" NOT NULL,
    "formato" "TournamentFormat" NOT NULL DEFAULT 'LIGA_LIGUILLA',
    "idaYVuelta" BOOLEAN NOT NULL DEFAULT false,
    "equiposLiguilla" INTEGER,
    "status" "TournamentStatus" NOT NULL DEFAULT 'BORRADOR',
    "fechaInicio" DATE,
    "numJornadas" INTEGER,
    "diasSemana" INTEGER[],
    "horarios" TEXT[],
    "duracionPartidoMin" INTEGER NOT NULL DEFAULT 60,
    "costoInscripcionCents" INTEGER NOT NULL DEFAULT 0,
    "costoArbitrajeCents" INTEGER NOT NULL DEFAULT 0,
    "minJugadores" INTEGER NOT NULL DEFAULT 7,
    "maxJugadores" INTEGER NOT NULL DEFAULT 25,
    "puntosVictoria" INTEGER NOT NULL DEFAULT 3,
    "puntosEmpate" INTEGER NOT NULL DEFAULT 1,
    "partidosPorRoja" INTEGER NOT NULL DEFAULT 1,
    "amarillasParaSuspension" INTEGER NOT NULL DEFAULT 5,
    "ventanaFichajesAbierta" BOOLEAN NOT NULL DEFAULT true,
    "reglamento" TEXT,
    "campeonId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tournaments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tournament_teams" (
    "id" UUID NOT NULL,
    "tournamentId" UUID NOT NULL,
    "teamId" UUID NOT NULL,
    "status" "RegistrationStatus" NOT NULL DEFAULT 'SOLICITADA',
    "seed" INTEGER,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decidedAt" TIMESTAMP(3),

    CONSTRAINT "tournament_teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tournament_rosters" (
    "id" UUID NOT NULL,
    "tournamentId" UUID NOT NULL,
    "tournamentTeamId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "numero" INTEGER,
    "status" "RosterStatus" NOT NULL DEFAULT 'PENDIENTE_APROBACION',
    "registeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),
    "leftAt" TIMESTAMP(3),

    CONSTRAINT "tournament_rosters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tournament_referees" (
    "tournamentId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "status" "MembershipStatus" NOT NULL DEFAULT 'INVITADO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tournament_referees_pkey" PRIMARY KEY ("tournamentId","userId")
);

-- CreateTable
CREATE TABLE "rounds" (
    "id" UUID NOT NULL,
    "tournamentId" UUID NOT NULL,
    "numero" INTEGER NOT NULL,
    "nombre" TEXT,
    "fase" "Fase" NOT NULL DEFAULT 'REGULAR',
    "fechaInicio" DATE,
    "publicada" BOOLEAN NOT NULL DEFAULT false,
    "cerrada" BOOLEAN NOT NULL DEFAULT false,
    "portadaPostId" UUID,

    CONSTRAINT "rounds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "matches" (
    "id" UUID NOT NULL,
    "kind" "MatchKind" NOT NULL DEFAULT 'TORNEO',
    "tournamentId" UUID,
    "roundId" UUID,
    "homeTeamId" UUID NOT NULL,
    "awayTeamId" UUID NOT NULL,
    "fieldId" UUID,
    "lugarTexto" TEXT,
    "scheduledAt" TIMESTAMP(3),
    "status" "MatchStatus" NOT NULL DEFAULT 'PROGRAMADO',
    "homeScore" INTEGER,
    "awayScore" INTEGER,
    "homePenalties" INTEGER,
    "awayPenalties" INTEGER,
    "winnerTeamId" UUID,
    "liveHomeScore" INTEGER NOT NULL DEFAULT 0,
    "liveAwayScore" INTEGER NOT NULL DEFAULT 0,
    "liveMinute" INTEGER,
    "liveUpdatedAt" TIMESTAMP(3),
    "liveViewers" INTEGER NOT NULL DEFAULT 0,
    "refereeId" UUID,
    "refereeStatus" "AssignmentStatus",
    "arbitrajeCents" INTEGER,
    "validatedAt" TIMESTAMP(3),
    "validatedById" UUID,
    "suspendedAt" TIMESTAMP(3),
    "suspendedById" UUID,
    "suspensionReason" TEXT,
    "rescheduledFromId" UUID,
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "streamUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance_links" (
    "token" TEXT NOT NULL,
    "matchId" UUID NOT NULL,
    "teamId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attendance_links_pkey" PRIMARY KEY ("token")
);

-- CreateTable
CREATE TABLE "match_attendances" (
    "matchId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "teamId" UUID NOT NULL,
    "status" "AttendanceStatus" NOT NULL DEFAULT 'CONVOCADO',
    "channel" "ResponseChannel",
    "nota" TEXT,
    "respondedAt" TIMESTAMP(3),
    "checkedInAt" TIMESTAMP(3),
    "checkedInById" UUID,

    CONSTRAINT "match_attendances_pkey" PRIMARY KEY ("matchId","userId")
);

-- CreateTable
CREATE TABLE "lineups" (
    "id" UUID NOT NULL,
    "matchId" UUID NOT NULL,
    "teamId" UUID NOT NULL,
    "submittedById" UUID NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "alerts" JSONB,

    CONSTRAINT "lineups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lineup_players" (
    "lineupId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "numero" INTEGER,
    "titular" BOOLEAN NOT NULL DEFAULT true,
    "posicion" "Posicion",
    "capitan" BOOLEAN NOT NULL DEFAULT false,
    "jugo" BOOLEAN,

    CONSTRAINT "lineup_players_pkey" PRIMARY KEY ("lineupId","userId")
);

-- CreateTable
CREATE TABLE "match_events" (
    "id" UUID NOT NULL,
    "matchId" UUID NOT NULL,
    "type" "MatchEventType" NOT NULL,
    "minute" INTEGER,
    "teamId" UUID,
    "playerId" UUID,
    "assistPlayerId" UUID,
    "playerOutId" UUID,
    "tipoGol" "TipoGol",
    "source" "ScoreSource" NOT NULL DEFAULT 'ARBITRO',
    "oficial" BOOLEAN NOT NULL DEFAULT true,
    "voided" BOOLEAN NOT NULL DEFAULT false,
    "nota" TEXT,
    "clientId" TEXT,
    "createdById" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "match_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "live_score_updates" (
    "id" UUID NOT NULL,
    "matchId" UUID NOT NULL,
    "reporterId" UUID NOT NULL,
    "homeScore" INTEGER NOT NULL,
    "awayScore" INTEGER NOT NULL,
    "minute" INTEGER,
    "nota" VARCHAR(140),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "live_score_updates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "match_reports" (
    "id" UUID NOT NULL,
    "matchId" UUID NOT NULL,
    "source" "ReportSource" NOT NULL DEFAULT 'APP_ARBITRO',
    "refereeId" UUID,
    "capturedById" UUID,
    "status" "MatchReportStatus" NOT NULL DEFAULT 'BORRADOR',
    "observaciones" TEXT,
    "homeScore" INTEGER,
    "awayScore" INTEGER,
    "submittedAt" TIMESTAMP(3),
    "homeSignedById" UUID,
    "homeSignedAt" TIMESTAMP(3),
    "awaySignedById" UUID,
    "awaySignedAt" TIMESTAMP(3),
    "snapshot" JSONB,

    CONSTRAINT "match_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "match_report_corrections" (
    "id" UUID NOT NULL,
    "reportId" UUID NOT NULL,
    "eventId" UUID,
    "kind" "CorrectionKind" NOT NULL,
    "propuesta" JSONB NOT NULL,
    "comentario" VARCHAR(500),
    "status" "CorrectionStatus" NOT NULL DEFAULT 'PENDIENTE',
    "requestedById" UUID NOT NULL,
    "respondedById" UUID,
    "respondedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "match_report_corrections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "match_suspension_requests" (
    "id" UUID NOT NULL,
    "matchId" UUID NOT NULL,
    "requestedById" UUID NOT NULL,
    "motivo" TEXT NOT NULL,
    "status" "SuspensionRequestStatus" NOT NULL DEFAULT 'PENDIENTE',
    "reviewedById" UUID,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "match_suspension_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sanctions" (
    "id" UUID NOT NULL,
    "tournamentId" UUID NOT NULL,
    "userId" UUID,
    "tournamentTeamId" UUID,
    "matchId" UUID,
    "type" "SanctionType" NOT NULL,
    "partidos" INTEGER,
    "partidosCumplidos" INTEGER NOT NULL DEFAULT 0,
    "multaCents" INTEGER,
    "motivo" TEXT NOT NULL,
    "automatica" BOOLEAN NOT NULL DEFAULT false,
    "status" "SanctionStatus" NOT NULL DEFAULT 'ACTIVA',
    "createdById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sanctions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "standings" (
    "tournamentTeamId" UUID NOT NULL,
    "tournamentId" UUID NOT NULL,
    "pj" INTEGER NOT NULL DEFAULT 0,
    "pg" INTEGER NOT NULL DEFAULT 0,
    "pe" INTEGER NOT NULL DEFAULT 0,
    "pp" INTEGER NOT NULL DEFAULT 0,
    "gf" INTEGER NOT NULL DEFAULT 0,
    "gc" INTEGER NOT NULL DEFAULT 0,
    "dg" INTEGER NOT NULL DEFAULT 0,
    "pts" INTEGER NOT NULL DEFAULT 0,
    "posicion" INTEGER,
    "posicionAnterior" INTEGER,
    "ordenManual" INTEGER,
    "racha" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "standings_pkey" PRIMARY KEY ("tournamentTeamId")
);

-- CreateTable
CREATE TABLE "player_tournament_stats" (
    "tournamentId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "partidos" INTEGER NOT NULL DEFAULT 0,
    "goles" INTEGER NOT NULL DEFAULT 0,
    "asistencias" INTEGER NOT NULL DEFAULT 0,
    "amarillas" INTEGER NOT NULL DEFAULT 0,
    "rojas" INTEGER NOT NULL DEFAULT 0,
    "mvps" INTEGER NOT NULL DEFAULT 0,
    "golesRecibidos" INTEGER NOT NULL DEFAULT 0,
    "vallasInvictas" INTEGER NOT NULL DEFAULT 0,
    "penalesAtajados" INTEGER NOT NULL DEFAULT 0,
    "rachaGoles" INTEGER NOT NULL DEFAULT 0,
    "rachaAsistencia" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "player_tournament_stats_pkey" PRIMARY KEY ("tournamentId","userId")
);

-- CreateTable
CREATE TABLE "league_charges" (
    "id" UUID NOT NULL,
    "leagueId" UUID NOT NULL,
    "tournamentId" UUID,
    "tournamentTeamId" UUID NOT NULL,
    "matchId" UUID,
    "sanctionId" UUID,
    "concept" "ChargeConcept" NOT NULL,
    "descripcion" TEXT,
    "amountCents" INTEGER NOT NULL,
    "dueDate" DATE,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDIENTE',
    "reportedAt" TIMESTAMP(3),
    "confirmedAt" TIMESTAMP(3),
    "recordedById" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "league_charges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "referee_payments" (
    "id" UUID NOT NULL,
    "leagueId" UUID NOT NULL,
    "refereeId" UUID NOT NULL,
    "matchId" UUID,
    "amountCents" INTEGER NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDIENTE',
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "referee_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feature_flags" (
    "key" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "descripcion" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feature_flags_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "jobs" (
    "id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'PENDIENTE',
    "runAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "dedupeKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bug_reports" (
    "id" UUID NOT NULL,
    "userId" UUID,
    "path" TEXT NOT NULL,
    "descripcion" VARCHAR(2000) NOT NULL,
    "device" JSONB,
    "status" "BugStatus" NOT NULL DEFAULT 'NUEVO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bug_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "actorId" UUID,
    "action" "AdminAction" NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "before" JSONB,
    "after" JSONB,
    "motivo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_authId_key" ON "users"("authId");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_celular_key" ON "users"("celular");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_qrToken_key" ON "users"("qrToken");

-- CreateIndex
CREATE INDEX "users_zona_idx" ON "users"("zona");

-- CreateIndex
CREATE INDEX "users_createdById_idx" ON "users"("createdById");

-- CreateIndex
CREATE INDEX "player_cards_media_idx" ON "player_cards"("media" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "player_card_snapshots_userId_semana_key" ON "player_card_snapshots"("userId", "semana");

-- CreateIndex
CREATE INDEX "user_follows_followedId_idx" ON "user_follows"("followedId");

-- CreateIndex
CREATE INDEX "team_follows_teamId_idx" ON "team_follows"("teamId");

-- CreateIndex
CREATE INDEX "league_follows_leagueId_idx" ON "league_follows"("leagueId");

-- CreateIndex
CREATE INDEX "posts_createdAt_idx" ON "posts"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "posts_authorId_createdAt_idx" ON "posts"("authorId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "posts_subjectUserId_createdAt_idx" ON "posts"("subjectUserId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "posts_teamId_createdAt_idx" ON "posts"("teamId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "posts_leagueId_createdAt_idx" ON "posts"("leagueId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "posts_type_createdAt_idx" ON "posts"("type", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "post_media_postId_idx" ON "post_media"("postId");

-- CreateIndex
CREATE INDEX "post_tags_userId_idx" ON "post_tags"("userId");

-- CreateIndex
CREATE INDEX "comments_postId_createdAt_idx" ON "comments"("postId", "createdAt");

-- CreateIndex
CREATE INDEX "comments_wallUserId_createdAt_idx" ON "comments"("wallUserId", "createdAt");

-- CreateIndex
CREATE INDEX "comments_wallTeamId_createdAt_idx" ON "comments"("wallTeamId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "badges_code_key" ON "badges"("code");

-- CreateIndex
CREATE INDEX "reports_leagueId_status_createdAt_idx" ON "reports"("leagueId", "status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "predictions_userId_matchId_key" ON "predictions"("userId", "matchId");

-- CreateIndex
CREATE INDEX "polls_status_closesAt_idx" ON "polls"("status", "closesAt");

-- CreateIndex
CREATE INDEX "poll_options_pollId_idx" ON "poll_options"("pollId");

-- CreateIndex
CREATE INDEX "respect_votes_receiverId_idx" ON "respect_votes"("receiverId");

-- CreateIndex
CREATE INDEX "board_posts_type_createdAt_idx" ON "board_posts"("type", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "board_posts_zona_createdAt_idx" ON "board_posts"("zona", "createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "challenges_matchId_key" ON "challenges"("matchId");

-- CreateIndex
CREATE INDEX "challenges_toTeamId_status_idx" ON "challenges"("toTeamId", "status");

-- CreateIndex
CREATE INDEX "notifications_userId_readAt_createdAt_idx" ON "notifications"("userId", "readAt", "createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "push_subscriptions_endpoint_key" ON "push_subscriptions"("endpoint");

-- CreateIndex
CREATE INDEX "push_subscriptions_userId_idx" ON "push_subscriptions"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "teams_slug_key" ON "teams"("slug");

-- CreateIndex
CREATE INDEX "teams_zona_categoria_tipoFutbol_idx" ON "teams"("zona", "categoria", "tipoFutbol");

-- CreateIndex
CREATE INDEX "team_members_userId_status_idx" ON "team_members"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "team_members_teamId_userId_key" ON "team_members"("teamId", "userId");

-- CreateIndex
CREATE INDEX "team_dues_teamId_dueDate_idx" ON "team_dues"("teamId", "dueDate");

-- CreateIndex
CREATE INDEX "team_due_payments_userId_status_idx" ON "team_due_payments"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "leagues_slug_key" ON "leagues"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "leagues_codigoAcceso_key" ON "leagues"("codigoAcceso");

-- CreateIndex
CREATE INDEX "leagues_zona_idx" ON "leagues"("zona");

-- CreateIndex
CREATE INDEX "league_admins_userId_idx" ON "league_admins"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "venues_slug_key" ON "venues"("slug");

-- CreateIndex
CREATE INDEX "venues_zona_idx" ON "venues"("zona");

-- CreateIndex
CREATE UNIQUE INDEX "fields_venueId_nombre_key" ON "fields"("venueId", "nombre");

-- CreateIndex
CREATE INDEX "league_referees_userId_idx" ON "league_referees"("userId");

-- CreateIndex
CREATE INDEX "tournaments_status_idx" ON "tournaments"("status");

-- CreateIndex
CREATE UNIQUE INDEX "tournaments_leagueId_slug_key" ON "tournaments"("leagueId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "tournament_teams_tournamentId_teamId_key" ON "tournament_teams"("tournamentId", "teamId");

-- CreateIndex
CREATE INDEX "tournament_rosters_tournamentTeamId_idx" ON "tournament_rosters"("tournamentTeamId");

-- CreateIndex
CREATE UNIQUE INDEX "tournament_rosters_tournamentId_userId_key" ON "tournament_rosters"("tournamentId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "rounds_portadaPostId_key" ON "rounds"("portadaPostId");

-- CreateIndex
CREATE UNIQUE INDEX "rounds_tournamentId_numero_key" ON "rounds"("tournamentId", "numero");

-- CreateIndex
CREATE INDEX "matches_tournamentId_scheduledAt_idx" ON "matches"("tournamentId", "scheduledAt");

-- CreateIndex
CREATE INDEX "matches_homeTeamId_scheduledAt_idx" ON "matches"("homeTeamId", "scheduledAt");

-- CreateIndex
CREATE INDEX "matches_awayTeamId_scheduledAt_idx" ON "matches"("awayTeamId", "scheduledAt");

-- CreateIndex
CREATE INDEX "matches_refereeId_scheduledAt_idx" ON "matches"("refereeId", "scheduledAt");

-- CreateIndex
CREATE INDEX "matches_status_scheduledAt_idx" ON "matches"("status", "scheduledAt");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_links_matchId_teamId_key" ON "attendance_links"("matchId", "teamId");

-- CreateIndex
CREATE INDEX "match_attendances_teamId_matchId_idx" ON "match_attendances"("teamId", "matchId");

-- CreateIndex
CREATE UNIQUE INDEX "lineups_matchId_teamId_key" ON "lineups"("matchId", "teamId");

-- CreateIndex
CREATE UNIQUE INDEX "match_events_clientId_key" ON "match_events"("clientId");

-- CreateIndex
CREATE INDEX "match_events_matchId_minute_idx" ON "match_events"("matchId", "minute");

-- CreateIndex
CREATE INDEX "match_events_playerId_type_idx" ON "match_events"("playerId", "type");

-- CreateIndex
CREATE INDEX "live_score_updates_matchId_createdAt_idx" ON "live_score_updates"("matchId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "match_reports_matchId_key" ON "match_reports"("matchId");

-- CreateIndex
CREATE INDEX "match_reports_status_idx" ON "match_reports"("status");

-- CreateIndex
CREATE INDEX "match_report_corrections_reportId_status_idx" ON "match_report_corrections"("reportId", "status");

-- CreateIndex
CREATE INDEX "match_suspension_requests_matchId_idx" ON "match_suspension_requests"("matchId");

-- CreateIndex
CREATE INDEX "sanctions_tournamentId_userId_status_idx" ON "sanctions"("tournamentId", "userId", "status");

-- CreateIndex
CREATE INDEX "standings_tournamentId_pts_idx" ON "standings"("tournamentId", "pts" DESC);

-- CreateIndex
CREATE INDEX "player_tournament_stats_tournamentId_goles_idx" ON "player_tournament_stats"("tournamentId", "goles" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "league_charges_sanctionId_key" ON "league_charges"("sanctionId");

-- CreateIndex
CREATE INDEX "league_charges_tournamentTeamId_status_idx" ON "league_charges"("tournamentTeamId", "status");

-- CreateIndex
CREATE INDEX "league_charges_leagueId_status_idx" ON "league_charges"("leagueId", "status");

-- CreateIndex
CREATE INDEX "referee_payments_refereeId_status_idx" ON "referee_payments"("refereeId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "jobs_dedupeKey_key" ON "jobs"("dedupeKey");

-- CreateIndex
CREATE INDEX "jobs_status_runAt_idx" ON "jobs"("status", "runAt");

-- CreateIndex
CREATE INDEX "bug_reports_status_createdAt_idx" ON "bug_reports"("status", "createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_entityType_entityId_idx" ON "audit_logs"("entityType", "entityId");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_profiles" ADD CONSTRAINT "player_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referee_profiles" ADD CONSTRAINT "referee_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_cards" ADD CONSTRAINT "player_cards_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_card_snapshots" ADD CONSTRAINT "player_card_snapshots_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_card_snapshots" ADD CONSTRAINT "player_card_snapshots_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "rounds"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_follows" ADD CONSTRAINT "user_follows_followerId_fkey" FOREIGN KEY ("followerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_follows" ADD CONSTRAINT "user_follows_followedId_fkey" FOREIGN KEY ("followedId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_follows" ADD CONSTRAINT "team_follows_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_follows" ADD CONSTRAINT "team_follows_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "league_follows" ADD CONSTRAINT "league_follows_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "league_follows" ADD CONSTRAINT "league_follows_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "leagues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_subjectUserId_fkey" FOREIGN KEY ("subjectUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "leagues"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "matches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "tournaments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "rounds"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_media" ADD CONSTRAINT "post_media_postId_fkey" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_tags" ADD CONSTRAINT "post_tags_postId_fkey" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_tags" ADD CONSTRAINT "post_tags_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reactions" ADD CONSTRAINT "reactions_postId_fkey" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reactions" ADD CONSTRAINT "reactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anonymous_reactions" ADD CONSTRAINT "anonymous_reactions_postId_fkey" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_postId_fkey" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_wallUserId_fkey" FOREIGN KEY ("wallUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_wallTeamId_fkey" FOREIGN KEY ("wallTeamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_badgeId_fkey" FOREIGN KEY ("badgeId") REFERENCES "badges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "leagues"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blocks" ADD CONSTRAINT "blocks_blockerId_fkey" FOREIGN KEY ("blockerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blocks" ADD CONSTRAINT "blocks_blockedId_fkey" FOREIGN KEY ("blockedId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "predictions" ADD CONSTRAINT "predictions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "predictions" ADD CONSTRAINT "predictions_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "polls" ADD CONSTRAINT "polls_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "leagues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "polls" ADD CONSTRAINT "polls_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "rounds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "polls" ADD CONSTRAINT "polls_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "polls" ADD CONSTRAINT "polls_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "poll_options" ADD CONSTRAINT "poll_options_pollId_fkey" FOREIGN KEY ("pollId") REFERENCES "polls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "poll_options" ADD CONSTRAINT "poll_options_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "poll_options" ADD CONSTRAINT "poll_options_matchEventId_fkey" FOREIGN KEY ("matchEventId") REFERENCES "match_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "poll_votes" ADD CONSTRAINT "poll_votes_pollId_fkey" FOREIGN KEY ("pollId") REFERENCES "polls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "poll_votes" ADD CONSTRAINT "poll_votes_voterId_fkey" FOREIGN KEY ("voterId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "poll_votes" ADD CONSTRAINT "poll_votes_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "poll_options"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "respect_votes" ADD CONSTRAINT "respect_votes_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "respect_votes" ADD CONSTRAINT "respect_votes_voterId_fkey" FOREIGN KEY ("voterId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "respect_votes" ADD CONSTRAINT "respect_votes_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fan_stats" ADD CONSTRAINT "fan_stats_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fan_stats" ADD CONSTRAINT "fan_stats_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "board_posts" ADD CONSTRAINT "board_posts_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "board_posts" ADD CONSTRAINT "board_posts_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "challenges" ADD CONSTRAINT "challenges_fromTeamId_fkey" FOREIGN KEY ("fromTeamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "challenges" ADD CONSTRAINT "challenges_toTeamId_fkey" FOREIGN KEY ("toTeamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "challenges" ADD CONSTRAINT "challenges_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "challenges" ADD CONSTRAINT "challenges_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "venues"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "challenges" ADD CONSTRAINT "challenges_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "matches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teams" ADD CONSTRAINT "teams_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_dues" ADD CONSTRAINT "team_dues_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_dues" ADD CONSTRAINT "team_dues_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_due_payments" ADD CONSTRAINT "team_due_payments_dueId_fkey" FOREIGN KEY ("dueId") REFERENCES "team_dues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_due_payments" ADD CONSTRAINT "team_due_payments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_due_payments" ADD CONSTRAINT "team_due_payments_confirmedById_fkey" FOREIGN KEY ("confirmedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leagues" ADD CONSTRAINT "leagues_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "league_admins" ADD CONSTRAINT "league_admins_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "leagues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "league_admins" ADD CONSTRAINT "league_admins_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "venues" ADD CONSTRAINT "venues_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fields" ADD CONSTRAINT "fields_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "venues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "league_venues" ADD CONSTRAINT "league_venues_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "leagues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "league_venues" ADD CONSTRAINT "league_venues_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "venues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "league_referees" ADD CONSTRAINT "league_referees_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "leagues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "league_referees" ADD CONSTRAINT "league_referees_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournaments" ADD CONSTRAINT "tournaments_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "leagues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournaments" ADD CONSTRAINT "tournaments_campeonId_fkey" FOREIGN KEY ("campeonId") REFERENCES "tournament_teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_teams" ADD CONSTRAINT "tournament_teams_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "tournaments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_teams" ADD CONSTRAINT "tournament_teams_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_rosters" ADD CONSTRAINT "tournament_rosters_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "tournaments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_rosters" ADD CONSTRAINT "tournament_rosters_tournamentTeamId_fkey" FOREIGN KEY ("tournamentTeamId") REFERENCES "tournament_teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_rosters" ADD CONSTRAINT "tournament_rosters_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_referees" ADD CONSTRAINT "tournament_referees_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "tournaments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_referees" ADD CONSTRAINT "tournament_referees_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rounds" ADD CONSTRAINT "rounds_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "tournaments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "tournaments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "rounds"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_homeTeamId_fkey" FOREIGN KEY ("homeTeamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_awayTeamId_fkey" FOREIGN KEY ("awayTeamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_winnerTeamId_fkey" FOREIGN KEY ("winnerTeamId") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "fields"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_refereeId_fkey" FOREIGN KEY ("refereeId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_validatedById_fkey" FOREIGN KEY ("validatedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_suspendedById_fkey" FOREIGN KEY ("suspendedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_rescheduledFromId_fkey" FOREIGN KEY ("rescheduledFromId") REFERENCES "matches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_links" ADD CONSTRAINT "attendance_links_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_links" ADD CONSTRAINT "attendance_links_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_attendances" ADD CONSTRAINT "match_attendances_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_attendances" ADD CONSTRAINT "match_attendances_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_attendances" ADD CONSTRAINT "match_attendances_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_attendances" ADD CONSTRAINT "match_attendances_checkedInById_fkey" FOREIGN KEY ("checkedInById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lineups" ADD CONSTRAINT "lineups_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lineups" ADD CONSTRAINT "lineups_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lineups" ADD CONSTRAINT "lineups_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lineup_players" ADD CONSTRAINT "lineup_players_lineupId_fkey" FOREIGN KEY ("lineupId") REFERENCES "lineups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lineup_players" ADD CONSTRAINT "lineup_players_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_events" ADD CONSTRAINT "match_events_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_events" ADD CONSTRAINT "match_events_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_events" ADD CONSTRAINT "match_events_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_events" ADD CONSTRAINT "match_events_assistPlayerId_fkey" FOREIGN KEY ("assistPlayerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_events" ADD CONSTRAINT "match_events_playerOutId_fkey" FOREIGN KEY ("playerOutId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_events" ADD CONSTRAINT "match_events_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_score_updates" ADD CONSTRAINT "live_score_updates_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_score_updates" ADD CONSTRAINT "live_score_updates_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_reports" ADD CONSTRAINT "match_reports_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_reports" ADD CONSTRAINT "match_reports_refereeId_fkey" FOREIGN KEY ("refereeId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_reports" ADD CONSTRAINT "match_reports_capturedById_fkey" FOREIGN KEY ("capturedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_reports" ADD CONSTRAINT "match_reports_homeSignedById_fkey" FOREIGN KEY ("homeSignedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_reports" ADD CONSTRAINT "match_reports_awaySignedById_fkey" FOREIGN KEY ("awaySignedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_report_corrections" ADD CONSTRAINT "match_report_corrections_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "match_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_report_corrections" ADD CONSTRAINT "match_report_corrections_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "match_events"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_report_corrections" ADD CONSTRAINT "match_report_corrections_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_report_corrections" ADD CONSTRAINT "match_report_corrections_respondedById_fkey" FOREIGN KEY ("respondedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_suspension_requests" ADD CONSTRAINT "match_suspension_requests_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_suspension_requests" ADD CONSTRAINT "match_suspension_requests_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_suspension_requests" ADD CONSTRAINT "match_suspension_requests_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sanctions" ADD CONSTRAINT "sanctions_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "tournaments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sanctions" ADD CONSTRAINT "sanctions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sanctions" ADD CONSTRAINT "sanctions_tournamentTeamId_fkey" FOREIGN KEY ("tournamentTeamId") REFERENCES "tournament_teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sanctions" ADD CONSTRAINT "sanctions_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "matches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sanctions" ADD CONSTRAINT "sanctions_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "standings" ADD CONSTRAINT "standings_tournamentTeamId_fkey" FOREIGN KEY ("tournamentTeamId") REFERENCES "tournament_teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "standings" ADD CONSTRAINT "standings_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "tournaments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_tournament_stats" ADD CONSTRAINT "player_tournament_stats_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "tournaments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_tournament_stats" ADD CONSTRAINT "player_tournament_stats_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "league_charges" ADD CONSTRAINT "league_charges_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "leagues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "league_charges" ADD CONSTRAINT "league_charges_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "tournaments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "league_charges" ADD CONSTRAINT "league_charges_tournamentTeamId_fkey" FOREIGN KEY ("tournamentTeamId") REFERENCES "tournament_teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "league_charges" ADD CONSTRAINT "league_charges_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "matches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "league_charges" ADD CONSTRAINT "league_charges_sanctionId_fkey" FOREIGN KEY ("sanctionId") REFERENCES "sanctions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "league_charges" ADD CONSTRAINT "league_charges_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referee_payments" ADD CONSTRAINT "referee_payments_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "leagues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referee_payments" ADD CONSTRAINT "referee_payments_refereeId_fkey" FOREIGN KEY ("refereeId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referee_payments" ADD CONSTRAINT "referee_payments_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "matches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bug_reports" ADD CONSTRAINT "bug_reports_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
