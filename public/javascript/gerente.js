let operatorsList = []
function shortenText(text, maxLength) {
    if (text.length <= maxLength) {
        return text; // nothing to cut
    }

    return text.slice(0, maxLength) + "...";
}
function removeItem(elementId) {

    const elementPureIdStr = elementId.id;
    console.log("", elementPureIdStr);
    // 1. Remove do array
    const index = operatorsList.indexOf(elementPureIdStr);
    if (index !== -1) {
        operatorsList.splice(index, 1);
        console.log(`Item removido da lista: ${elementPureIdStr}`);
    } else {
        console.warn(`Item não encontrado na lista: ${elementPureIdStr}`);
    }

    // 2. Remove a div do DOM
    const element = document.getElementById(elementPureIdStr);
    if (element) {
        element.remove();
        console.log(`Elemento removido: #${elementPureIdStr}`);
    } else {
        console.warn(`Elemento com id "${elementPureIdStr}" não encontrado.`);
    }
}

function addOperators() {
    
    const operatorToList = document.getElementById("operadortolist");
    const operatorNew = operatorToList.value;
    operatorToList.value = '';
    const operatorsCards = document.getElementById("operatorsCards");
    let newName = shortenText(operatorNew, 9);
    operatorsCards.innerHTML += `<div id='${newName}' class='flex items-center gap-2 rounded-full bg-primary/20 px-3 py-1.5'><span class='text-sm font-medium text-primary' >${newName}</span><button class='text-primary/70 hover:text-primary' onclick='removeItem(${newName})'><span class='material-symbols-outlined' style='font-size: 16px;'>close</span></button></div>`;
    operatorsList.push(newName);

}
document.addEventListener("DOMContentLoaded", () => {
    const botaoSalvar = document.querySelector("header button"); // botão do topo “Salvar”
    const botaoListaOperator = document.getElementById("submitnewoperator");
    //por algum motivo isso abaixo n funciona
    //botaoSalvar.addEventListener("click", ()=>{addOperators()});
    botaoSalvar.addEventListener("click", () => {
        console.log("🟦 Iniciando coleta de dados...");

        // Lista de IDs a serem coletados
        const campos = [
            "nomedaobra",
            "local",
            "descricao",
            "datainicial",
            "datafinal",
            "nomeCliente",
            "cpfcnpjcliente",
            "emailcliente",
            "whatsappcliente"
        ];

        let dadosColetados = {};

        campos.forEach(id => {
            const elemento = document.getElementById(id);
            if (!elemento) {
                console.warn(`⚠ Campo com id '${id}' não encontrado.`);
                return;
            }

            const valor = elemento.value;
            dadosColetados[id] = valor;

            console.log(`📌 Campo coletado: ${id} → Valor: "${valor}"`);
        });

        console.log(`📌 Campo coletado: Operators → Valor: "${operatorsList}"`);
        console.log("🟩 Coleta finalizada! Dados obtidos:");
        console.log(dadosColetados);
    });
});
