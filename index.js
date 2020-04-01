const SYMBOL_MAP = Object.freeze({
    'O': 0,
    'X': 1
});

const OBJECTIVES = Object.freeze({
    TERMINAL_TEST: 0,
    UTILITY: 1,
    GET_POSITION: 2
});

const PLAYERS = Object.freeze({
    MAX: 0,
    MIN: 1
})

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
            switch(objective){
                case OBJECTIVES.TERMINAL_TEST:
                    return true;
                case OBJECTIVES.UTILITY:
                    return board[i][0] === SYMBOL_MAP['O'] ? 1 : -1;
                case OBJECTIVES.GET_POSITION:
                    return `horizontal_${i}`
                default:
                    return null;
            }
        }

        // Verifica o tabuleiro na vertical
        if (board[0][i] !== null && board[0][i] === board[1][i] && board[1][i] === board[2][i]){ // Verifica se os 3 elementos da coluna são iguais
            switch(objective){
                case OBJECTIVES.TERMINAL_TEST:
                    return true;
                case OBJECTIVES.UTILITY:
                    return board[0][i] === SYMBOL_MAP['O'] ? 1 : -1;
                case OBJECTIVES.GET_POSITION:
                    return `vertical_${i}`
                default:
                    return null;
            }
        }
    }

    // Verifica a diagonal principal 
    if (board[0][0] !== null && board[0][0] === board[1][1] && board[1][1] === board[2][2]) {
        switch(objective){
            case OBJECTIVES.TERMINAL_TEST:
                return true;
            case OBJECTIVES.UTILITY:
                return board[0][0] === SYMBOL_MAP['O'] ? 1 : -1;
            case OBJECTIVES.GET_POSITION:
                return 'diagonal_principal';
            default:
                return null;
        }
    }

    // Verifica a diagonal secundária
    if (board[0][2] !== null && board[0][2] === board[1][1] && board[1][1] === board[2][0]){
        switch(objective){
            case OBJECTIVES.TERMINAL_TEST:
                return true;
            case OBJECTIVES.UTILITY:
                return board[0][2] === SYMBOL_MAP['O'] ? 1 : -1;
            case OBJECTIVES.GET_POSITION:
                return 'diagonal_secundaria';
            default:
                return null;
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
        switch(objective){
            case OBJECTIVES.TERMINAL_TEST:
                return true;
            case OBJECTIVES.UTILITY:
                return 0;
            case OBJECTIVES.GET_POSITION:
                return null
            default:
                return null;
        }
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

function min(currentMin, utility){
    return currentMin === null || currentMin > utility ? utility : currentMin;
}

function max(currentMax, utility){
    return currentMax === null || currentMax < utility ? utility : currentMax;
}

function minimax(state, player, returnAction = false) {
    if(terminalTest(state))
        return utility(state)

    const actions = getPossibleActions(state);
    let bestActionIndex = 0;
    
    if(player === PLAYERS.MAX){
        let maxUtility = null;

        for(let i = 0; i < actions.length; i++){
            const action = actions[i];
            const newState = result(state, action, SYMBOL_MAP['O']);
            const utility = minimax(newState, PLAYERS.MIN);

            const previousUtility = maxUtility;
            maxUtility = max(maxUtility, utility);

            if(previousUtility !== maxUtility) // encontrou uma ação melhor, atualiza o índice
                bestActionIndex = i;
        }

        return returnAction ? actions[bestActionIndex] : maxUtility;
    }

    if(player === PLAYERS.MIN) {
        let minUtility = null;

        for(let i = 0; i < actions.length; i++){
            const action = actions[i];
            const newState = result(state, action, SYMBOL_MAP['X']);
            const utility = minimax(newState, PLAYERS.MAX);
            minUtility = min(minUtility, utility);
        }
        return minUtility;
    }
}

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

let gameOver = false;

function setup() {
	$('td').click(function() {
		const row = $(this)
			.parent()
			.index();

        const column = $(this).index();

        // Se o jogo não acabou permite que o jogador marque uma posição
        if(!gameOver) {
            if($(this).html() === '') {
                // Marca a entrada do usuário no tabuleiro
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
        
                    // Exibindo a jogada do computador
                    $('td').eq(cellPosition).html('O');

                    // Após a jogada do computador, verifica se o jogo acabou
                    gameOver = terminalTest(state);
                }

                // Se o jogo acabou (após a jogada do usuário ou do computador) exibe o resultado
                if(gameOver) { 
                    const finalStateUtility = utility(state);
                    const linePositionKey = evaluateBoard(OBJECTIVES.GET_POSITION, state);

                    if(linePositionKey !== null) {
                        const linePosition = LINE_MAP[linePositionKey];

                        $('line')[0].setAttribute('x1', linePosition.x1);
                        $('line')[0].setAttribute('x2', linePosition.x2);
                        $('line')[0].setAttribute('y1', linePosition.y1);
                        $('line')[0].setAttribute('y2', linePosition.y2);
                        $('svg').css('display', 'inline-block');
                    }

                    if(finalStateUtility === -1) {
                        $('#winner').show();
                    } 
                    else if (finalStateUtility === 1) {
                        $('#looser').show();
                    }
                    else {
                        $('#draw').show();
                    }
                }
            } else {
                alert('Posição inválida!');
            }
        }
        else { // Se o jogo já acabou exibe erro
            alert('O jogo acabou!');
        }
	});

	$('button').click(function() {
		$('td').each(function() {
            gameOver = false;
            $(this).html('');
            $('#winner').hide();
            $('#looser').hide();
            $('#draw').hide();
            $('svg').css('display', 'none');
        });
        state.reset();
	});
}
