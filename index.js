const SYMBOL_MAP = Object.freeze({ // enum para mapear os símbolos do tabuleiro para números inteiros
    'O': 0,
    'X': 1
});

const OBJECTIVES = Object.freeze({ // enum para mapear os possíveis objetivos da validação do tabuleiro
    TERMINAL_TEST: 0, // enum para verificação de estado terminal
    UTILITY: 1, // enum para retorno da utilidade do estado
    GET_POSITION: 2 // enum para retorno da posição dos símbolos vencedores (vertical, horizontal ou diagonal)
});

const PLAYERS = Object.freeze({ // enum para mapear os jogadores 
    MAX: 0,
    MIN: 1
})

// enum para mapear as coordenadas das possíveis posições para um estado terminal (com vencedor)
// É utilizado para desenhar uma linha vermelha no tabuleiro sobre os símbolos vencedores
const LINE_MAP = Object.freeze({ 
    horizontal_0: { x1: 0, x2: 300, y1: 50, y2: 50 },
    horizontal_1: { x1: 0, x2: 300, y1: 150, y2: 150 },
    horizontal_2: { x1: 0, x2: 300, y1: 250, y2: 250 },
    vertical_0: { x1: 50, x2: 50, y1: 0, y2: 300 },
    vertical_1: { x1: 150, x2: 150, y1: 0, y2: 300 },
    vertical_2: { x1: 250, x2: 250, y1: 0, y2: 300 },
    diagonal_principal: { x1: 0, x2: 300, y1: 0, y2: 300},
    diagonal_secundaria: { x1: 0, x2: 300, y1: 300, y2: 0 }
})

// Classe State, representa um estado do tabuleiro
class State {
    // Construtor da classe, pode iniciar uma instância com o tabuleiro vazio ou com 
    // o resultado do estado anterior
	constructor(board) { 
		this.board = board || [
			[null, null, null],
			[null, null, null],
			[null, null, null]
        ];
    }

    getValue() { // Método que retorna uma cópia do tabuleiro atual
        const boardCopy = JSON.parse(JSON.stringify(this.board));
        return boardCopy;
    }

    markOnBoard(action, symbol = SYMBOL_MAP['O']) { // Método para marcar um novo símbolo no tabuleiro
        const { row, column } = action; // Extrai os atributos 'row' e 'column' do objeto 'action'
        // Marca um novo símbolo no tabuleiro
        this.board[row][column] = symbol;
    }

    reset() { // Método para reiniciar o atributo 'board'
        this.board = [
			[null, null, null],
			[null, null, null],
			[null, null, null]
        ];
    }
}

let state = new State(); // Variável global que guarda o estado atual do jogo

// Função genérica para avaliar o tabuleiro
// Caso 'objective' = TERMINAL_TEST retorna se o estado é terminal
// Caso 'objective' = UTILITY retorna a utilidade do estado (considerando que o mesmo é terminal)
// Caso 'objective' = GET_POSITION retorna a chave do enum com as coordenadas para a posição vencedora
function evaluateBoard(objective, state) {
    const board = state.getValue(); // Obtém uma cópia do tabuleiro no estado atual

    for(let i = 0; i < 3; i++){
        // Verifica o tabuleiro na horizontal
        if (board[i][0] !== null && board[i][0] === board[i][1] && board[i][1] === board[i][2]){ // Verifica se os 3 elementos da linha são iguais
            switch(objective){ // Verifica qual o objetivo da chamada
                case OBJECTIVES.TERMINAL_TEST: 
                    return true; // retorna que o estado é um terminal
                case OBJECTIVES.UTILITY:
                    return board[i][0] === SYMBOL_MAP['O'] ? 1 : -1; // Caso os símbolos iguais sejam O (MAX) retorna utilidade 1, caso sejam X (MIN), retorna -1
                case OBJECTIVES.GET_POSITION:
                    return `horizontal_${i}` // Retorna a chave para a horizontal em que o jogo foi ganho (0, 1 ou 2, de cima para baixo)
                default:
                    return null;
            }
        }

        // Verifica o tabuleiro na vertical
        if (board[0][i] !== null && board[0][i] === board[1][i] && board[1][i] === board[2][i]){ // Verifica se os 3 elementos da coluna são iguais
            switch(objective){ // Verifica qual o objetivo da chamada
                case OBJECTIVES.TERMINAL_TEST:
                    return true; // retorna que o estado é um terminal
                case OBJECTIVES.UTILITY:
                    return board[0][i] === SYMBOL_MAP['O'] ? 1 : -1; // Caso os símbolos iguais sejam O (MAX) retorna utilidade 1, caso sejam X (MIN), retorna -1
                case OBJECTIVES.GET_POSITION:
                    return `vertical_${i}` // Retorna a chave para a vertical em que o jogo foi ganho (0, 1 ou 2, da esquerda para a direita)
                default:
                    return null;
            }
        }
    }

    // Verifica a diagonal principal 
    if (board[0][0] !== null && board[0][0] === board[1][1] && board[1][1] === board[2][2]) {
        switch(objective){ // Verifica qual o objetivo da chamada
            case OBJECTIVES.TERMINAL_TEST:
                return true; // retorna que o estado é um terminal
            case OBJECTIVES.UTILITY:
                return board[0][0] === SYMBOL_MAP['O'] ? 1 : -1; // Caso os símbolos iguais sejam O (MAX) retorna utilidade 1, caso sejam X (MIN), retorna -1
            case OBJECTIVES.GET_POSITION:
                return 'diagonal_principal'; // Retorna a chave para o jogo ganho na diagonal principal
            default:
                return null;
        }
    }

    // Verifica a diagonal secundária
    if (board[0][2] !== null && board[0][2] === board[1][1] && board[1][1] === board[2][0]){
        switch(objective){
            case OBJECTIVES.TERMINAL_TEST:
                return true; // retorna que o estado é um terminal
            case OBJECTIVES.UTILITY:
                return board[0][2] === SYMBOL_MAP['O'] ? 1 : -1; // Caso os símbolos iguais sejam O (MAX) retorna utilidade 1, caso sejam X (MIN), retorna -1
            case OBJECTIVES.GET_POSITION:
                return 'diagonal_secundaria'; // Retorna a chave para o jogo ganho na diagonal secundária
            default:
                return null;
        }
    }

    // Se chegou a este ponto há duas opções:
    // 1. O estado não é terminal
    // 2. O estádo é terminal e corresponde a um empate

    // Variável para contabilizar o número de posições preenchidas no tabuleiro
    let positionsFilled = 0; 
    
    // Verifica se o estado é terminal
    for(let row = 0; row < 3; row++){
        for(let column = 0; column < 3; column++){
            if(board[row][column] !== null)
                positionsFilled++;
        }
    }

    // Se todas as posições estão preenchidas o estado é um empate
    if(positionsFilled === 9) {
        switch(objective){ // Verifica o objetivo da chamada
            case OBJECTIVES.TERMINAL_TEST:
                return true; // retorna que o estádo é terminal
            case OBJECTIVES.UTILITY:
                return 0; // retorna a utilidade do empate
            case OBJECTIVES.GET_POSITION:
                return null // retorna nulo, pois, em caso de empate a linha não deve ser exibida
            default:
                return null;
        }
    }

    // Caso alguma posição não esteja preenchida (positionsFilled < 9), o estado não é um terminal
    if(objective === OBJECTIVES.TERMINAL_TEST)
        return false; // Caso o objetivo da chamada seja a verificação de terminal, retorna falso
}

// Função auxiliar para chamar a avaliação do tabuleiro com o objetivo de checar se o estado é terminal
function terminalTest(state) { 
    return evaluateBoard(OBJECTIVES.TERMINAL_TEST, state);
}

// Função auxiliar para chamar a avaliação do tabuleiro com o objetivo de checar 
// a utilidade do estado (considera-se que este é um terminal)
function utility(state) {
    return evaluateBoard(OBJECTIVES.UTILITY, state);
}

// Retorna um novo estado resultado de uma ação aplicada ao estado recebido
function result(state, action, symbol = SYMBOL_MAP['O']) {
    const newState = new State(state.getValue()); // Cria um novo estado com o tabuleiro do estado recebido
    newState.markOnBoard(action, symbol); // Marca no tabuleiro o símbolo recebido na posição dada por 'action'
    return newState; // retorna o novo estado
}

function min(currentMin, utility){ // Retorna o menor valor entre 'currentMin' e 'utility'
    return currentMin === null || currentMin > utility ? utility : currentMin;
}

function max(currentMax, utility){ // Retorna o maior valor entre 'currentMax' e 'utility'
    return currentMax === null || currentMax < utility ? utility : currentMax;
}

// Função minimax, recebe um estado, o jogador atual e um flag para retornar uma ação (ou uma utilidade, caso este seja falso)
function minimax(state, player, returnAction = false) {
    if(terminalTest(state)) // Verifica se o estado é terminal
        return utility(state) // Caso seja, retorna a utilidade desse estado

    const actions = getPossibleActions(state); // Obtém as possíveis ações (posições disponíveis no tabuleiro), para o estado atual
    let bestActionIndex = 0; // Inicializa a variável com o índice da melhor ação
    
    if(player === PLAYERS.MAX){ // Verifica se o jogador atual é o MAX (computador)
        let maxUtility = null; // Inicializa a variável que receberá a maior utilidade

        for(let i = 0; i < actions.length; i++){ // Itera sobre todas as possíveis ações
            const action = actions[i]; // Obtém a ação na posição 'i'
            const newState = result(state, action, SYMBOL_MAP['O']); // Gera um novo estado com base no estado atual e na ação escolhida 
            const utility = minimax(newState, PLAYERS.MIN); // Chama recursivamente o algoritmo passando o estado gerado e o jogador MIN (adversário)

            const previousUtility = maxUtility; // Variável que recebe a utilidade atual para posterior comparação
            maxUtility = max(maxUtility, utility); // Escolhe o maior valor entre 'maxUtility' e 'utility'

            // Caso a utilidade tenha se alterado o programa encontrou uma ação melhor, nesse caso atualiza o índice da melhor ação
            if(previousUtility !== maxUtility) 
                bestActionIndex = i;
        }

        // Caso o flag para retornar uma ação seja verdadeiro (somente na primeira chamada), retorna a melhor ação para o computador
        // caso contrário, retorna a maior utilidade encontrada
        return returnAction ? actions[bestActionIndex] : maxUtility; 
    }

    if(player === PLAYERS.MIN) { // Verifica se o jogador atual é o MIN (adversário)
        let minUtility = null; // Inicializa a variável para a menor utilidade

        for(let i = 0; i < actions.length; i++){ // Itera sobre as possíveis ações (espaços disponíveis no tabuleiro)
            const action = actions[i]; // Obtém a ação na posição 'i'
            const newState = result(state, action, SYMBOL_MAP['X']); // Gera um novo estado com base no estado atual e na ação escolhida
            const utility = minimax(newState, PLAYERS.MAX); // Chama recursivamente a função minimax passando o novo estado e o jogador MAX (computador)
            minUtility = min(minUtility, utility); // Escolhe o menor valor entre 'minUtility' e 'utility'
        }
        return minUtility; // Retorna a menor utilidade
    }
}

// Verifica o tabuleiro e retorna uma lista com as posições vazias
function getPossibleActions(state) {
    const board = state.getValue(); // Obtém uma cópia do tabuleiro atual
    let actions = []; // Inicializa a lista de ações (posições vazias)

    for(let row = 0; row < 3; row++){ // Itera sobre as linhas do tabuleiro
        for(let column = 0; column < 3; column++){ // Itera sobre as colunas do tabuleiro
            if(board[row][column] === null){ // Caso a posição esteja vazia adiciona as coordenadas à lista
                actions.push({ row, column })
            }
        }
    }
    return actions; // Retorna as possíveis ações
}

// Código de preparação do HTML
// Essa função é executada quando a página HTML termina de carregar no browser
$(() => { 
	setup(); // Chama a função de preparação dos eventos do jogo
});

let gameOver = false; // Flag para verificar se o jogo já acabou

function setup() { // Função de preparação dos eventos do jogo
	$('td').click(function() { // Função acionada quando o usuário clica em uma posição do tabuleiro
		const row = $(this).parent().index(); // Obtém a linha clicada pelo usuário
        const column = $(this).index(); // Obtém a coluna clicada pelo usuário

        // Se o jogo não acabou permite que o jogador marque uma posição
        if(!gameOver) {
            if($(this).html() === '') { // Verifica se a posição está vazia no tabuleiro HTML
                
                // Marca a entrada do usuário no tabuleiro (estado atual)
                state.markOnBoard({ row, column }, SYMBOL_MAP['X'])
    
                // Exibe no tabuleiro (visual) o símbolo clicado
                $(this).html('X');

                // Após a jogada do usuário, verifica se o jogo acabou
                gameOver = terminalTest(state);
                
                if(!gameOver){ // Se o jogo não acabou, o computador joga
                    // Ação do computador é obtida pelo algoritmo MINIMAX
                    const action = minimax(state, PLAYERS.MAX, true);
        
                    // Setando a ação no state
                    state.markOnBoard(action);
        
                    // Calcula a célula a ser marcada no HTML
                    const cellPosition = action.row * 3 + action.column;
        
                    // Exibe a jogada do computador no HTML
                    $('td').eq(cellPosition).html('O');

                    // Após a jogada do computador, verifica se o jogo acabou
                    gameOver = terminalTest(state);
                }

                // Se o jogo acabou (após a jogada do usuário ou do computador) exibe o resultado
                if(gameOver) { 
                    const finalStateUtility = utility(state); // Obtém a utilidade do estado final para saber quem ganhou (ou se houve um empate)
                    const linePositionKey = evaluateBoard(OBJECTIVES.GET_POSITION, state); // Obtém a posição dos símbolos vencedores

                    if(linePositionKey !== null) { // Caso a chave não seja nula (houve um vencedor)
                        const linePosition = LINE_MAP[linePositionKey]; // Obtém as coordenadas da linha a ser desenhada

                        // Seta as coordenadas da linha no HTML
                        $('line')[0].setAttribute('x1', linePosition.x1);
                        $('line')[0].setAttribute('x2', linePosition.x2);
                        $('line')[0].setAttribute('y1', linePosition.y1);
                        $('line')[0].setAttribute('y2', linePosition.y2);
                        // Exibe a linha no tabuleiro
                        $('svg').css('display', 'inline-block');
                    }

                    if(finalStateUtility === -1) { // Caso o usuário tenha vencido
                        $('#winner').show(); // Exibe a mensagem de partida vencida
                    } 
                    else if (finalStateUtility === 1) {  // Caso o computador tenha vencido
                        $('#looser').show(); // Exibe a mensagem de partida perdida
                    }
                    else { // Caso seja um empate
                        $('#draw').show(); // Exibe a mensagem de empate
                    }
                }
            } else { // Caso o usuário tente marcar uma posição indisponível no tabuleiro
                alert('Posição inválida!');
            }
        }
        else { // Caso o jogo tenha acabado e o usuário tente interagir com o tabuleiro exibe uma mensagem de erro
            alert('O jogo acabou!');
        }
	});

	$('button').click(function() { // Função do botão de reiniciar o jogo
		$('td').each(function() { // Função executada para cada posição do tabuleiro
            $(this).html(''); // Limpa o conteúdo da posição do tabuleiro
        });
        gameOver = false; // Reinicia o flag de fim de jogo
        $('#winner').hide(); // Esconde a mensagem de jogo vencido
        $('#looser').hide(); // Esconde a mensagem de jogo perdido
        $('#draw').hide(); // Esconde a mensagem de empate
        $('svg').css('display', 'none'); // Esconde a linha
        state.reset(); // Reinicia o estado atual para o estado inicial do jogo
	});
}
