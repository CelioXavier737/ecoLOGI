# ecoLOGI - Quiz Educacional de Lógica Ecológica

O **ecoLOGI** é uma aplicação web gamificada desenvolvida em Google Apps Script destinada a avaliar e conscientizar estudantes sobre práticas sustentáveis. O sistema realiza o sorteio aleatório de 15 perguntas de um banco de dados de 100 questões divididas em temas como Água, Energia, Resíduos, Consumo, entre outros.

## 🚀 Funcionalidades Principais
* **Validação em Dois Fatores:** O estudante insere o e-mail e recebe um código numérico de 6 dígitos válido por apenas 5 minutos.
* **Restrição de Domínio:** Apenas e-mails institucionais com o final `@aluno.mg.gov.br` são aceitos pelo sistema (com exceções configuradas para testes).
* **Trava contra Duplicidade:** O sistema lê a planilha de resultados e impede que um mesmo e-mail realize o quiz mais de uma vez.
* **Interface Responsiva:** Design moderno com estilo metálico adaptado para celulares e computadores.
* **Pontuação Dinâmica:** Respostas com pesos diferentes que geram notas automáticas salvas diretamente no Google Sheets.

## 📂 Estrutura do Projeto
* `/src/Code.gs`: Código backend responsável pelo envio de e-mails, validação de segurança e integração com as planilhas.
* `/src/Index.html`: Interface visual (HTML/CSS/JavaScript) do formulário e das telas do quiz.
* `perguntas.csv`: Banco de dados oficial com as 100 questões agrupadas por temas e pontuações.

## 🛠️ Como Instalar (Para Professores/Administradores)
1. Crie uma nova planilha no seu Google Drive para coletar as respostas.
2. Acesse **Extensões > Apps Script**.
3. Copie o conteúdo de `src/Code.gs` e substitua a ID da planilha na variável correspondente.
4. Crie um arquivo HTML chamado `Index` e cole o conteúdo de `src/Index.html`.
5. Clique em **Implantar > Nova Implantação** e selecione o tipo **App da Web**.
6. Configure para executar como "Você" e dar acesso a "Qualquer pessoa".