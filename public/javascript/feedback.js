// variável que será atualizada ao clicar em qualquer botão
let dataSelecionada = null;

// classe do botão selecionado
const classeSelecionado = `
    flex size-7 items-center justify-center rounded-full border-2
    border-primary bg-primary text-white
    dark:border-primary dark:bg-primary dark:text-white
    transition-colors duration-200
`.replace(/\s+/g, ' ').trim();

// pega a div e todos os botões dentro
const botoes = document.querySelectorAll("#feedbackNota button");


// adiciona o evento de clique
botoes.forEach(botao => {
    botao.addEventListener("click", () => {

        // atualiza a data
        const avaliacaotext = document.getElementById("avaliacaoshowtext");
        dataSelecionada = botao.getAttribute("value");
        dataSelecionada = parseInt(dataSelecionada);
        dataSelecionada +=1; 
        avaliacaotext.textContent = `Sua avaliação: ${dataSelecionada}`;
        console.log(dataSelecionada);
        //console.log("Data atualizada:", dataSelecionada);

        // remove a classe de todos os botões
        botoes.forEach(b => {
            b.className = "flex size-7 items-center justify-center rounded-full border-2 border-secondary bg-transparent text-secondary dark:border-secondary dark:bg-transparent dark:text-secondary transition-colors duration-200 hover:bg-secondary/20"
        });
        botao.className = classeSelecionado;

        // adiciona a classe ao botão clicado
    });
});

// variaveis fora a nota
let nome = null;
let obra = null;
let comentario = null;

// referencia dos objetos inputs
const nomeIp = document.getElementById("nomeIp");
const obraIp = document.getElementById("obraIp");
const comentarioIp = document.getElementById("adicionalComent");

// função de coletar data

function coletardata (){
    console.log("data coletada")
    if (dataSelecionada != null){
        nome = nomeIp.getAttribute("value");
        obra = obraIp.getAttribute("value");
        comentario = comentarioIp.value;
        console.log(nome);
        console.log(obra);
        console.log(comentario);
        // OBJ DATA a ser convertido em arquivo
        const dadosColetados = {
     nomedaobra: obra,
     local: "Rua das Acácias, 123",
     descricao: "Reforma completa",
     datainicial: "2024-08-01",
     datafinal: "2025-02-28",
     nomeCliente:nome,
     comentario: comentario,
     cpfcnpjcliente: "0010010019",
     emailcliente: "carlos.p@email.com",
     whatsappcliente: "(11) 98765-4321"
   };
   exportarDados(dadosColetados, "obraAutoName");
    } else{
        // o cliente não clicou na nota
    }
} 

// botao de coletar
const feedbacksender = document.getElementById("submitFeedback");
//feedbacksender.onclick(()=>{coletardata()});

//FUNÇÃO MAIN DE GERAÇÃO DE ARQUIVOS: 

/**
 * Gera e baixa JSON, CSV e SQL a partir de um objeto de dados.
 * - dados: objeto plain { chave: valor, ... } OR array de objetos [{...}, {...}] 
 * - baseName: nome-base para arquivos (ex: 'obra_2025')
 */
/**
 * Gera e baixa JSON, CSV e SQL a partir de um objeto de dados.
 * - dados: objeto plain { chave: valor, ... } OR array de objetos [{...}, {...}] 
 * - baseName: nome-base para arquivos (ex: 'obra_2025')
 */
function exportarDados(dados, baseName = "export") {
  console.log("🚀 Iniciando exportação de dados...");

  // Se não recebeu dados, tenta coletar do DOM usando lista de IDs (adaptável)
  if (!dados) {
    console.log("ℹ️ Nenhum objeto 'dados' informado. Tentando coletar do DOM...");
    const ids = [
      "nomedaobra", "local", "descricao",
      "datainicial", "datafinal",
      "operadortolist", "nomeCliente", "cpfcnpjcliente",
      "emailcliente", "whatsappcliente"
    ];
    const coleta = {};
    ids.forEach(id => {
      const el = document.getElementById(id);
      coleta[id] = el ? el.value : null;
      console.log(`📌 coletado ${id}: "${coleta[id]}"`);
    });
    dados = coleta;
  } else {
    // se foi passado um objeto único, transforma em array para criar CSV com linha(s)
    console.log("📌 Dados recebidos por parâmetro:", dados);
  }

  // Se for um objeto único, transforma em array para CSV/SQL unificados
  let linhas = Array.isArray(dados) ? dados : [dados];

  // --- 1) JSON ---
  const jsonContent = JSON.stringify(Array.isArray(dados) ? dados : dados, null, 2);
  downloadFile(jsonContent, "application/json", `${baseName}.json`);
  console.log(`✅ JSON gerado: ${baseName}.json`);

  // --- 2) CSV ---
  const csvContent = objectArrayToCsv(linhas);
  downloadFile(csvContent, "text/csv", `${baseName}.csv`);
  console.log(`✅ CSV gerado: ${baseName}.csv`);

  // --- 3) SQL ---
  const sqlContent = objectArrayToSql(linhas, "export_table");
  downloadFile(sqlContent, "application/sql", `${baseName}.sql`);
  console.log(`✅ SQL gerado: ${baseName}.sql`);

  console.log("🏁 Exportação concluída.");
}

/* -------------------------
   Helpers
   ------------------------- */

// Cria e dispara download de arquivo (blob)
function downloadFile(content, mimeType, filename) {
  const blob = new Blob([content], { type: mimeType + ";charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// Converte array de objetos para CSV (headers a partir das chaves unificadas)
function objectArrayToCsv(arr) {
  if (!arr || arr.length === 0) return "";

  // Unifica todas as chaves presentes nas linhas
  const allKeys = Array.from(arr.reduce((set, obj) => {
    Object.keys(obj || {}).forEach(k => set.add(k));
    return set;
  }, new Set()));

  // Cabeçalho
  const header = allKeys.join(",");

  // Linhas
  const rows = arr.map(obj => {
    return allKeys.map(k => csvEscape(valueToPrimitive(obj ? obj[k] : null))).join(",");
  });

  return [header, ...rows].join("\r\n");
}

// Escapa valor para CSV (envolve entre "" se necessário e duplica "")
function csvEscape(val) {
  if (val === null || val === undefined) return "";
  const s = String(val);
  // se tiver vírgula, nova linha ou aspas, precisamos envolver por aspas
  if (/[,"\r\n]/.test(s)) {
    return `"` + s.replace(/"/g, '""') + `"`;
  }
  return s;
}

// Transforma arrays/objetos em string primitiva para CSV/SQL
function valueToPrimitive(v) {
  if (v === null || v === undefined) return "";
  if (typeof v === "object") return JSON.stringify(v);
  return v;
}

// Gera SQL: CREATE TABLE (text cols) + INSERT INTO statements
function objectArrayToSql(arr, tableName = "export_table") {
  if (!arr || arr.length === 0) return "";

  // Unifica todas as chaves
  const allKeys = Array.from(arr.reduce((set, obj) => {
    Object.keys(obj || {}).forEach(k => set.add(k));
    return set;
  }, new Set()));

  // Cria definição de tabela (todos TEXT)
  const columnsSql = allKeys.map(k => `\`${k}\` TEXT`).join(",\n  ");
  let sql = `-- SQL gerado automaticamente\nCREATE TABLE IF NOT EXISTS \`${tableName}\` (\n  id INTEGER PRIMARY KEY AUTOINCREMENT,\n  ${columnsSql}\n);\n\n`;

  // Inserts
  arr.forEach(obj => {
    const cols = allKeys.map(k => `\`${k}\``).join(", ");
    const vals = allKeys.map(k => sqlEscape(valueToPrimitive(obj ? obj[k] : null))).join(", ");
    sql += `INSERT INTO \`${tableName}\` (${cols}) VALUES (${vals});\n`;
  });

  return sql;
}

// Escapa valores para SQL (single quotes) e trata NULL
function sqlEscape(v) {
  if (v === null || v === undefined || v === "") return "NULL";
  // converte para string e escapa '
  const s = String(v).replace(/'/g, "''");
  return `'${s}'`;
}

/* -------------------------
   Exemplo de uso
   -------------------------
   // 1) Usando um objeto já coletado:
   const dadosColetados = {
     nomedaobra: "Residencial das Flores - Bloco B",
     local: "Rua das Acácias, 123",
     descricao: "Reforma completa",
     datainicial: "2024-08-01",
     datafinal: "2025-02-28",
     nomeCliente: "Carlos Pereira",
     cpfcnpjcliente: "0010010019",
     emailcliente: "carlos.p@email.com",
     whatsappcliente: "(11) 98765-4321"
   };
   exportarDados(dadosColetados, "obra_123");

   // 2) Usando sem parâmetro (o código irá tentar coletar do DOM usando IDs predefinidos):
   exportarDados(null, "obra_auto");
*/