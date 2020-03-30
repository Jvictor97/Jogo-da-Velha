const SYMBOL_MAP = Object.freeze({
    'O': 0,
    'X': 1
});

const OBJECTIVES = Object.freeze({
    TERMINAL_TEST: 0,
    UTILITY: 1
});

// Código MIN-MAX

class State {
	constructor(board) {
		this.board = board || [
			[null, null, null],
			[null, null, null],
			[null, null, null]
        ];
        
        this.isTerminal = false;
        this.utility = null;
        this.parent = null;
    }

    getValue() {
        const boardCopy = JSON.parse(JSON.stringify(this.board));
        return boardCopy;
    }

    markOnBoard(action, symbol = SYMBOL_MAP['O']) {
        const { row, column } = action;
        // Marca um novo símbolo no tabuleiro
        this.board[row][column] = symbol;
    }

    reset() {
        this.board = [
			[null, null, null],
			[null, null, null],
			[null, null, null]
        ];
    }
}

let state = new State();

// Função genérica para avaliar o tabuleiro
// Caso 'objective' = TERMINAL_TEST retorna se o estado é terminal
// Caso 'objective' = UTILITY retorna a utilidade do estado (considerando que o mesmo é terminal)
function evaluateBoard(objective, state) {
    const board = state.getValue();

    for(let i = 0; i < 3; i++){
        // Verifica o tabuleiro na horizontal
        if (board[i][0] !== null && board[i][0] === board[i][1] && board[i][1] === board[i][2]){ // Verifica se os 3 elementos da linha são iguais
            if (objective === OBJECTIVES.TERMINAL_TEST) 
                return true;
            else {
                return board[i][0] === SYMBOL_MAP['O'] ? 1 : -1;
            }
        }

        // Verifica o tabuleiro na vertical
        if (board[0][i] !== null && board[0][i] === board[1][i] && board[1][i] === board[2][i]){ // Verifica se os 3 elementos da coluna são iguais
            if (objective === OBJECTIVES.TERMINAL_TEST) 
                return true;
            else {
                return board[0][i] === SYMBOL_MAP['O'] ? 1 : -1;
            }
        }
    }

    // Verifica a diagonal principal 
    if (board[0][0] !== null && board[0][0] === board[1][1] && board[1][1] === board[2][2]) {
        if (objective === OBJECTIVES.TERMINAL_TEST) 
            return true;
        else {
            return board[0][0] === SYMBOL_MAP['O'] ? 1 : -1;
        }
    }

    // Verifica a diagonal secundária
    if (board[0][2] !== null && board[0][2] === board[1][1] && board[1][1] === board[2][0]){
        if (objective === OBJECTIVES.TERMINAL_TEST) 
            return true;
        else {
            return board[0][2] === SYMBOL_MAP['O'] ? 1 : -1;
        }
    }

    // Se chegou a este ponto o estado é um empate (se for terminal) ou não é terminal

    // Verifica se o estado é terminal
    let positionsFilled = 0;

    for(let row = 0; row < 3; row++){
        for(let column = 0; column < 3; column++){
            if(board[row][column] !== null)
                positionsFilled++;
        }
    }

    // Se todas as posições estão preenchidas o estado é um empate
    if(positionsFilled === 9) {
        if(objective === OBJECTIVES.TERMINAL_TEST)
            return true;
        
        if(objective === OBJECTIVES.UTILITY)
            return 0;
    }

    // Caso contrário, o estado não é um terminal
    if(objective === OBJECTIVES.TERMINAL_TEST)
        return false;
}

function terminalTest(state) {
    return evaluateBoard(OBJECTIVES.TERMINAL_TEST, state);
}

function utility(state) {
    return evaluateBoard(OBJECTIVES.UTILITY, state);
}

function result(state, action, symbol = SYMBOL_MAP['O']) {
    const newState = new State(state.getValue());
    newState.markOnBoard(action, symbol);
    return newState;
}

function minValue(state) {
    if(terminalTest(state))
        return utility(state);

    let minUtility = null;
    const actions = getPossibleActions(state);

    for(let i = 0; i < actions.length; i++){
        const action = actions[i];

        minUtility = min(minUtility, maxValue(result(state, action, SYMBOL_MAP['X'])));
    }
    
    return minUtility;  
}

function maxValue(state) {
    if(terminalTest(state))
        return utility(state);

    let maxUtility = null;
    const actions = getPossibleActions(state);

    for(let i = 0; i < actions.length; i++){
        const action = actions[i];

        maxUtility = max(maxUtility, minValue(result(state, action, SYMBOL_MAP['O'])));
    }
}

function min(currentMin, utility){
    return currentMin === null || currentMin > utility ? utility : currentMin;
}

function max(currentMax, utility){
    return currentMax === null || currentMax < utility ? utility : currentMax;
}

function minimax(state) {
    const actions = getPossibleActions(state);
    console.log('possible actions', actions);
    let maxUtility = null;
    let maxUtilityActionIndex = null;

    for(let i = 0; i < actions.length; i++){
        const action = actions[i];
        const utility = minValue(result(state, action))

        if(maxUtility === null || utility > maxUtility) {
            maxUtility = utility
            maxUtilityActionIndex = i;
        }
    }

    return actions[maxUtilityActionIndex];
}

// Operações no tabuleiro

// Verifica o tabuleiro e retorna uma lista com as posições vazias
function getPossibleActions(state) {
    const board = state.getValue();
    let actions = [];

    for(let row = 0; row < 3; row++){
        for(let column = 0; column < 3; column++){
            if(board[row][column] === null){
                actions.push({ row, column })
            }
        }
    }
    return actions;
}

// Código de preparação do HTML
$(() => {
	setup();
});

function setup() {
	$('td').click(function() {
		const row = $(this)
			.parent()
			.index();

        const column = $(this).index();
        
        if($(this).html() === '') {
            // Marca a entrada do usuário no tabuleiro
            state.markOnBoard({ row, column }, SYMBOL_MAP['X'])
            // Exibe no tabuleiro (visual) o símbolo clicado
            $(this).html('X');
            
            // Ação do computador é obtida pelo algoritmo MINIMAX
            const action = minimax(state);
            console.log('action', action);
            // Setando a ação no state
            state.markOnBoard(action);

            // Calcula a célula a ser marcada no HTML
            const cellPosition = action.row * 3 + action.column;

            // Exibindo a jogada do computador
            $('td').eq(cellPosition).html('O');

        } else {
            alert('Posição inválida!');
        }
	});

	$('button').click(function() {
		$('td').each(function() {
			$(this).html('');
        });
        state.reset();
	});
}