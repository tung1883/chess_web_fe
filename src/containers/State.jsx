{/*
    at the moment: 1 game, 1 request at a time
    4 states: enter, exit, data
    playing:
        - enter: accept/get accepted
        - exit: game finished
        - data: game data
            + inital position + time
            + transition: move info
    - the other states will not be avalaible if gameEnded not null
    requesting
        - enter: user send request
        - exit: request get accepted/declined
        - data: request
    accepting
        - enter: receive request
        - exit: user replies request
        - data: receiving list
    listening
        - enter/exit: no
        - always listens for request (accept when playing)
*/}

export function State(params) {
    const { gameEnded, } = params
}