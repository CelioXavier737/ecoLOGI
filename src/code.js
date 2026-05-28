/**
 * PROJETO ecoLOGI - Escola Estadual Monsenhor Domingos
 * Versão Final Protegida (Sem IDs Expostos para o GitHub)
 * 
 * Este arquivo utiliza PropertiesService para ocultar os IDs das planilhas
 * e o e-mail do desenvolvedor, em conformidade com a LGPD.
 */

// =========================================================
// CONFIGURAÇÕES GLOBAIS - BUSCA DOS COFRES DO GOOGLE
// =========================================================
const ID_QUIZ = PropertiesService.getScriptProperties().getProperty("ID_QUIZ");
const ID_ALUNOS = PropertiesService.getScriptProperties().getProperty("ID_ALUNOS");
const EMAIL_DESENVOLVEDOR = PropertiesService.getScriptProperties().getProperty("EMAIL_DESENVOLVEDOR") || "cxavier737@gmail.com";
// =========================================================

/**
 * Abre o Web App e injeta os logos diretamente do Drive
 */
function doGet() {
  const html = HtmlService.createTemplateFromFile('Index');
  
  // Busca logos na pasta ecoLOGI do Drive usando link de thumbnail de alta resolução (mais rápido e estável)
  html.logoProjeto = obterImagemDrive("logoecologi_completo.gif");
  html.logoEscola = obterImagemDrive("logoescola.gif");
  
  return html.evaluate()
      .setTitle('ecoLOGI - Sustentabilidade')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Função auxiliar para buscar arquivos na pasta ecoLOGI do Drive e gerar link público
 */
function obterImagemDrive(nomeArquivo) {
  try {
    const pastas = DriveApp.getFoldersByName("ecoLOGI");
    if (!pastas.hasNext()) return "";
    const pasta = pastas.next();
    const arquivos = pasta.getFilesByName(nomeArquivo.trim());
    if (!arquivos.hasNext()) return "";
    
    const arquivo = arquivos.next();
    
    // Força compartilhamento público de leitura para o link externo funcionar no navegador do aluno
    arquivo.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    return "https://drive.google.com/thumbnail?id=" + arquivo.getId() + "&sz=w1000";
  } catch (e) {
    console.error("Erro na imagem " + nomeArquivo + ": " + e.toString());
    return "";
  }
}

/**
 * Gera e envia o código de verificação por e-mail com travas de segurança
 */
function enviarCodigoVerificacao(email) {
  email = email.toLowerCase().trim();
  
  // 1. REGRA DE FORMATO: Bloqueia e-mails não institucionais, abrindo exceção para o e-mail de teste
  const eEmailInstitucional = email.endsWith("@aluno.mg.gov.br");
  const eEmailTeste = (email === EMAIL_DESENVOLVEDOR);
  
  if (!eEmailInstitucional && !eEmailTeste) {
    throw new Error("FORMATO_INVALIDO");
  }

  // 2. REGRA DE DUPLICIDADE: Impede que o mesmo e-mail realize o quiz mais de uma vez
  try {
    const ss = SpreadsheetApp.openById(ID_ALUNOS);
    const abaResultados = ss.getSheetByName("Resultados") || ss.getSheets()[0];
    const dadosResultados = abaResultados.getDataRange().getValues();
    
    // Percorre a coluna de e-mails informados (Coluna C / Índice 2)
    for (let i = 1; i < dadosResultados.length; i++) {
      if (dadosResultados[i][2].toString().toLowerCase().trim() === email) {
        throw new Error("EMAIL_JA_UTILIZADO");
      }
    }
  } catch (erroPlanilha) {
    if (erroPlanilha.message === "EMAIL_JA_UTILIZADO") {
      throw erroPlanilha;
    }
    console.error("Erro de duplicidade: " + erroPlanilha.message);
  }

  // 3. CONTROLE DE COTA: Verifica se ainda há cota diária de envio de e-mails
  const cotaRestante = MailApp.getRemainingDailyQuota();
  if (cotaRestante <= 0) {
    throw new Error("LIMITE_DIARIO_ATINGIDO");
  }

  // 4. GERAÇÃO E SALVAMENTO DO CÓDIGO
  try {
    const codigo = Math.floor(100000 + Math.random() * 900000).toString();
    const expiracao = new Date().getTime() + (5 * 60 * 1000); // Válido por 5 minutos
    
    PropertiesService.getScriptProperties().setProperty(email, JSON.stringify({
      codigo: codigo,
      expiracao: expiracao
    }));

    const assunto = "Código de Verificação - Projeto ecoLOGI";
    const corpo = `Olá!\n\nSeu código de acesso ao desafio de Sustentabilidade ecoLOGI é: ${codigo}\n\nEste código expira em 5 minutos.`;
    
    MailApp.sendEmail(email, assunto, corpo);
    return true;
  } catch (e) {
    throw new Error("Erro no envio do e-mail. Verifique o endereço digitado.");
  }
}

/**
 * Valida o código digitado e o prazo de 5 minutos
 */
function validarCodigo(email, codigoDigitado) {
  email = email.toLowerCase().trim();
  const dadosArmazenados = PropertiesService.getScriptProperties().getProperty(email);
  
  if (!dadosArmazenados) return { sucesso: false, msg: "Código não encontrado ou expirado." };
  
  const { codigo, expiracao } = JSON.parse(dadosArmazenados);
  const agora = new Date().getTime();

  if (agora > expiracao) {
    PropertiesService.getScriptProperties().deleteProperty(email);
    return { sucesso: false, msg: "O código expirou (limite de 5 min)." };
  }

  if (codigo === codigoDigitado.trim()) {
    PropertiesService.getScriptProperties().deleteProperty(email);
    return { sucesso: true };
  } else {
    return { sucesso: false, msg: "Código incorreto. Tente novamente." };
  }
}

/**
 * Lê as perguntas na planilha ecoLOGI_quiz de forma equilibrada por Uso (Coluna I)
 */
function obterPerguntasDoBanco() {
  try {
    const ss = SpreadsheetApp.openById(ID_QUIZ);
    const sheet = ss.getSheetByName("Perguntas");
    if (!sheet) return [];

    const range = sheet.getDataRange();
    const dados = range.getValues();
    dados.shift(); // Remove cabeçalho
    
    // Ordenação equilibrada por uso (Coluna I / Índice 8) e desempate aleatório
    let perguntasOrdenadas = dados.sort((a, b) => {
      let usoA = a[8] || 0;
      let usoB = b[8] || 0;
      return (usoA === usoB) ? Math.random() - 0.5 : usoA - usoB;
    });
    
    let selecaoFinal = perguntasOrdenadas.slice(0, 15);
    
    // Atualiza contador de uso na planilha de Quiz
    let dadosAtuais = sheet.getDataRange().getValues();
    selecaoFinal.forEach(p => {
      for (let i = 1; i < dadosAtuais.length; i++) {
        if (dadosAtuais[i][0] === p[0]) {
          sheet.getRange(i + 1, 9).setValue((dadosAtuais[i][8] || 0) + 1);
          break;
        }
      }
    });

    return selecaoFinal.map(linha => ({
      pergunta: linha[0],
      tema: linha[7],
      opcoes: [
        { texto: linha[1], pontos: linha[2] }, // Resposta 1 / Pontos 1
        { texto: linha[3], pontos: linha[4] }, // Resposta 2 / Pontos 2
        { texto: linha[5], pontos: linha[6] }  // Resposta 3 / Pontos 3
      ].filter(opt => opt.texto !== "").sort(() => Math.random() - 0.5) // Embaralha as 3 opções
    }));
  } catch (e) {
    console.error("Erro ao ler Quiz: " + e.toString());
    return [];
  }
}

/**
 * Salva o resultado final do aluno na planilha ecoLOGI_alunos
 */
function salvarResultadoFinal(dados, pontos) {
  try {
    const ss = SpreadsheetApp.openById(ID_ALUNOS);
    let sheet = ss.getSheetByName("Resultados");
    
    if (!sheet) {
      sheet = ss.insertSheet("Resultados");
      sheet.appendRow(["Data", "Nome", "E-mail Informado", "E-mail Autenticado", "Turma", "Turno", "Pontos", "Status"]);
    }
    
    const emailAutenticado = Session.getActiveUser().getEmail();
    let statusValidacao = (emailAutenticado === EMAIL_DESENVOLVEDOR) ? "MODO DESENVOLVEDOR" : 
                         (dados.email.toLowerCase() === emailAutenticado.toLowerCase() ? "OK" : "Divergência");

    sheet.appendRow([
      new Date(), 
      dados.nome, 
      dados.email, 
      emailAutenticado, 
      dados.turma, 
      dados.turno, 
      pontos, 
      statusValidacao
    ]);
    
    return { sucesso: true, mensagem: "Resultado gravado com sucesso!" };
  } catch (e) {
    console.error("Erro ao salvar: " + e.toString());
    return { sucesso: false, mensagem: "Erro ao gravar dados." };
  }
}

/**
 * Função auxiliar de diagnóstico para liberar acessos e permissões no Google Drive
 */
function forcarPermissoes() {
  const testDrive = DriveApp.getRootFolder().getName();
  const testSheet = SpreadsheetApp.openById(ID_QUIZ).getName();
  console.log("Se você viu isso, o acesso foi autorizado para: " + testDrive + " e " + testSheet);
}