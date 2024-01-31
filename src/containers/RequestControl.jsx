import { deleteRequest } from "./StateControl"

// NOTE: this file only contains UI-related functions for request feature
// see StateControl.jsx for logic-related functions

//check if there is any request left to render 
export function hasRequestToRender(receivedRequests, DOMElement) {
    for (let i = 0; i < receivedRequests.length; i++) {
        const elementRendered = (DOMElement === 'sub-menu') 
            ? receivedRequests[i].rendered.subMenu : receivedRequests[i].rendered.popUp
        if (!elementRendered && !receivedRequests[i].actionClicked) return true
    }

    return false
}

//change and re-render request list when user accept/decline request
export function requestActionHandler (params) {   
    const { event, isAccepted, DOMElement, receivedRequests, setReceivedRequests, state, setState } = params
    const DOMElementClass = DOMElement + '-request-component'
    const requestComponent = document.elementsFromPoint(event.clientX, event.clientY).find((element) => {
        return element.classList.contains(DOMElementClass)
    })
    const reqID = requestComponent.id.split('-').pop()
    const request = receivedRequests.find((req) => req.reqID == reqID)
    request.actionClicked = true

    if (DOMElement === 'sub-menu') request.rendered.subMenu = true
    else request.rendered.popUp = true

    setReceivedRequests([...receivedRequests])

    if (requestComponent) requestComponent.style.display = 'none'
    if (isAccepted && !state.accept && !(state.play && !state.play.end)) {
        setState({...state, accept: request})
    }

    if (!isAccepted) deleteRequest({reqID})
}

