// Lista das 9 rodadas com dificuldade progressiva
// Rodadas 1 a 3: fáceis (caçar o resultado)
// Rodadas 4 a 6: médias com números negativos maiores e sinais duplos (caçar o resultado)
// Rodadas 7 a 9: desafiadoras, o jogador caça a conta que dá o resultado pedido
const RODADAS_DO_JOGO = [
  {
    tipo: "cacar_resultado",
    enunciado: "-4 + 7",
    opcoes: ["-11", "-3", "+3", "+11"],
    correta: "+3",
    explicacao: "Você devia 4 (-4) e ganhou 7 (+7). Pagando a dívida, ainda sobram +3."
  },
  {
    tipo: "cacar_resultado",
    enunciado: "3 - 8",
    opcoes: ["-5", "+5", "-11", "+11"],
    correta: "-5",
    explicacao: "Você tinha 3 e gastou 8. Como gastou mais do que tinha, ficou devendo -5."
  },
  {
    tipo: "cacar_resultado",
    enunciado: "-6 - 4",
    opcoes: ["-2", "+2", "+10", "-10"],
    correta: "-10",
    explicacao: "Sinais iguais: juntamos as duas dívidas (6 e 4) e mantemos o sinal de menos: -10."
  },
  {
    tipo: "cacar_resultado",
    enunciado: "-12 + 5",
    opcoes: ["+7", "-7", "-17", "+17"],
    correta: "-7",
    explicacao: "Sinais diferentes: subtraímos (12 - 5 = 7) e mantemos o sinal do maior valor (-12), ficando -7."
  },
  {
    tipo: "cacar_resultado",
    enunciado: "9 + (-14)",
    opcoes: ["+23", "-23", "+5", "-5"],
    correta: "-5",
    explicacao: "Somar uma dívida de 14 é o mesmo que fazer 9 - 14, que resulta em -5."
  },
  {
    tipo: "cacar_resultado",
    enunciado: "-8 - (-3)",
    opcoes: ["-11", "+11", "-5", "+5"],
    correta: "-5",
    explicacao: "Menos com menos vira mais: -8 + 3 = -5."
  },
  {
    tipo: "cacar_conta",
    enunciado: "Resultado alvo: -6",
    opcoes: ["-10 + 4", "-2 + 8", "10 - 4", "-4 - 10"],
    correta: "-10 + 4",
    explicacao: "Em -10 + 4, a dívida de 10 é maior que o ganho de 4, sobrando exatamente -6."
  },
  {
    tipo: "cacar_conta",
    enunciado: "Resultado alvo: +4",
    opcoes: ["-9 + 5", "-3 - (-7)", "3 - 7", "-4 + 0"],
    correta: "-3 - (-7)",
    explicacao: "Em -3 - (-7), o sinal duplo vira soma (-3 + 7), dando +4."
  },
  {
    tipo: "cacar_conta",
    enunciado: "Resultado alvo: -9",
    opcoes: ["-15 - 6", "15 - 6", "-15 + 6", "-3 + 6"],
    correta: "-15 + 6",
    explicacao: "Em -15 + 6, diminuímos 6 da dívida de 15 e conservamos o sinal negativo: -9."
  }
];

// Variáveis que controlam o estado atual da partida
let indiceRodadaAtual = 0;
let pontos = 0;
let vidas = 3;
let tempoInicioPartida = 0;
let rodadaRespondida = false;
const PONTOS_POR_ACERTO = 100;
const PONTUACAO_MAXIMA = RODADAS_DO_JOGO.length * PONTOS_POR_ACERTO;

// Pegando os elementos da tela (HTML)
const textoRodada = document.getElementById("texto-rodada");
const textoPontos = document.getElementById("texto-pontos");
const textoVidas = document.getElementById("texto-vidas");
const botaoTema = document.getElementById("botao-tema");

const telaInicio = document.getElementById("tela-inicio");
const telaJogo = document.getElementById("tela-jogo");
const telaFim = document.getElementById("tela-fim");

const botaoIniciar = document.getElementById("botao-iniciar");
const etiquetaTipoDesafio = document.getElementById("etiqueta-tipo-desafio");
const textoDesafio = document.getElementById("texto-desafio");
const gradeOpcoes = document.getElementById("grade-opcoes");

const caixaFeedback = document.getElementById("caixa-feedback");
const textoFeedback = document.getElementById("texto-feedback");
const botaoProxima = document.getElementById("botao-proxima");

const iconeFim = document.getElementById("icone-fim");
const tituloFim = document.getElementById("titulo-fim");
const mensagemFim = document.getElementById("mensagem-fim");
const pontosFinais = document.getElementById("pontos-finais");
const tempoFinal = document.getElementById("tempo-final");
const botaoReiniciar = document.getElementById("botao-reiniciar");

// --- FUNÇÕES DE COMUNICAÇÃO COM O PORTAL ESCOLAR ---

function avisarAlturaParaPortal() {
  const alturaDocumento = Math.max(
    document.body.scrollHeight,
    document.documentElement.scrollHeight
  );
  window.parent.postMessage({ type: "vrgame:resize", height: alturaDocumento }, "*");
}

function aplicarTema(tema) {
  if (tema === "light" || tema === "claro") {
    document.documentElement.setAttribute("data-theme", "light");
  } else {
    document.documentElement.removeAttribute("data-theme");
  }
  avisarAlturaParaPortal();
}

// Escuta mensagens enviadas pelo portal (tema e tela cheia)
window.addEventListener("message", (evento) => {
  const dados = evento.data;
  if (!dados || typeof dados !== "object") return;

  if (dados.type === "vrgame:theme" && dados.theme) {
    aplicarTema(dados.theme);
  }

  if (dados.type === "vrgame:fullscreen") {
    if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }
    avisarAlturaParaPortal();
  }
});

// Atualiza a altura sempre que a janela mudar de tamanho
window.addEventListener("resize", avisarAlturaParaPortal);

// --- LÓGICA PRINCIPAL DO JOGO ---

function embaralharLista(lista) {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

function atualizarBarraSuperior() {
  const numeroExibido = Math.min(indiceRodadaAtual + 1, RODADAS_DO_JOGO.length);
  textoRodada.textContent = `${numeroExibido} / ${RODADAS_DO_JOGO.length}`;
  textoPontos.textContent = pontos;

  // Mostra corações cheios para vidas restantes e vazios para perdidas
  const coracoesCheios = "❤️".repeat(Math.max(0, vidas));
  const coracoesVazios = "🖤".repeat(Math.max(0, 3 - vidas));
  textoVidas.textContent = coracoesCheios + coracoesVazios;
}

function iniciarPartida() {
  indiceRodadaAtual = 0;
  pontos = 0;
  vidas = 3;
  tempoInicioPartida = Date.now();

  telaInicio.classList.add("escondido");
  telaFim.classList.add("escondido");
  telaJogo.classList.remove("escondido");

  carregarRodada();
}

function carregarRodada() {
  rodadaRespondida = false;
  caixaFeedback.classList.add("escondido");
  caixaFeedback.classList.remove("acerto", "erro");
  gradeOpcoes.innerHTML = "";

  atualizarBarraSuperior();

  const rodada = RODADAS_DO_JOGO[indiceRodadaAtual];

  if (rodada.tipo === "cacar_resultado") {
    etiquetaTipoDesafio.textContent = "Caça ao Resultado — Quanto dá essa conta?";
  } else {
    etiquetaTipoDesafio.textContent = "Caça à Conta — Qual expressão dá esse valor?";
  }

  textoDesafio.textContent = rodada.enunciado;

  const opcoesEmbaralhadas = embaralharLista(rodada.opcoes);

  opcoesEmbaralhadas.forEach((opcaoTexto) => {
    const botao = document.createElement("button");
    botao.type = "button";
    botao.className = "botao-opcao";
    botao.textContent = opcaoTexto;
    botao.addEventListener("click", () => verificarResposta(opcaoTexto, botao));
    gradeOpcoes.appendChild(botao);
  });

  avisarAlturaParaPortal();
}

function verificarResposta(escolhaDoJogador, botaoClicado) {
  if (rodadaRespondida) return;
  rodadaRespondida = true;

  const rodada = RODADAS_DO_JOGO[indiceRodadaAtual];
  const todosBotoes = gradeOpcoes.querySelectorAll("button");

  // Trava todos os botões e marca qual era a opção certa
  todosBotoes.forEach((btn) => {
    btn.disabled = true;
    if (btn.textContent === rodada.correta) {
      btn.classList.add("correta");
    }
  });

  if (escolhaDoJogador === rodada.correta) {
    pontos += PONTOS_POR_ACERTO;
    caixaFeedback.classList.add("acerto");
    textoFeedback.innerHTML = `<strong>Acertou! (+${PONTOS_POR_ACERTO} pts)</strong><br>${rodada.explicacao}`;
  } else {
    vidas -= 1;
    botaoClicado.classList.add("errada");
    caixaFeedback.classList.add("erro");
    textoFeedback.innerHTML = `<strong>Ops, sinal trocado! (-1 vida)</strong><br>${rodada.explicacao}`;
  }

  atualizarBarraSuperior();

  // Define o texto do botão para avançar
  if (vidas <= 0) {
    botaoProxima.textContent = "Ver Resultado Final";
  } else if (indiceRodadaAtual === RODADAS_DO_JOGO.length - 1) {
    botaoProxima.textContent = "Concluir Missão";
  } else {
    botaoProxima.textContent = "Próxima Rodada";
  }

  caixaFeedback.classList.remove("escondido");
  avisarAlturaParaPortal();
}

function avancarOuFinalizar() {
  if (vidas <= 0) {
    encerrarPartida(false);
    return;
  }

  indiceRodadaAtual += 1;

  if (indiceRodadaAtual < RODADAS_DO_JOGO.length) {
    carregarRodada();
  } else {
    encerrarPartida(true);
  }
}

function encerrarPartida(completouTodasRodadas) {
  telaJogo.classList.add("escondido");
  telaFim.classList.remove("escondido");

  const tempoEmMs = Date.now() - tempoInicioPartida;
  const segundos = Math.max(1, Math.round(tempoEmMs / 1000));

  pontosFinais.textContent = `${pontos} / ${PONTUACAO_MAXIMA}`;
  tempoFinal.textContent = `${segundos}s`;

  if (completouTodasRodadas) {
    iconeFim.textContent = "🏆";
    tituloFim.textContent = "Missão Concluída!";
    mensagemFim.textContent = "Parabéns! Você atravessou o campo de números inteiros e completou todas as 9 rodadas.";
  } else {
    iconeFim.textContent = "🛸";
    tituloFim.textContent = "Fim das Vidas!";
    mensagemFim.textContent = "Sua nave ficou sem energia, mas cada erro ajudou a treinar os sinais. Tente de novo!";
  }

  // Envia o resultado final para o portal escolar
  window.parent.postMessage(
    {
      type: "vrgame:finish",
      score: pontos,
      maxScore: PONTUACAO_MAXIMA,
      timeMs: tempoEmMs,
      detail: { jogo: "caca-sinais-espacial" }
    },
    "*"
  );

  avisarAlturaParaPortal();
}

// --- EVENTOS DOS BOTÕES ---

botaoIniciar.addEventListener("click", iniciarPartida);
botaoProxima.addEventListener("click", avancarOuFinalizar);
botaoReiniciar.addEventListener("click", iniciarPartida);

botaoTema.addEventListener("click", () => {
  const estaClaro = document.documentElement.getAttribute("data-theme") === "light";
  aplicarTema(estaClaro ? "dark" : "light");
});

// Avisa ao portal que o jogo carregou e está pronto
window.addEventListener("load", () => {
  window.parent.postMessage({ type: "vrgame:ready" }, "*");
  avisarAlturaParaPortal();
});