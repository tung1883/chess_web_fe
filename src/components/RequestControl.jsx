import axios from "axios"

//check if there is any request left to render 
export function hasRequestToRender(requestList, DOMElement) {
    for (let i = 0; i < requestList.length; i++) {
        const elementRendered = (DOMElement === 'sub-menu') 
            ? requestList[i].rendered.subMenu : requestList[i].rendered.popUp
        if (!elementRendered && !requestList[i].actionClicked) return true
    }

    return false
}

//change and re-render request list when user accept/decline request
export function requestActionHandler (params) {   
    const { event, isAccepted, DOMElement, requestList, setRequestList, state, setState } = params

    const DOMElementClass = DOMElement + '-request-component'

    const requestComponent = document.elementsFromPoint(event.clientX, event.clientY).find((element) => {
        return element.classList.contains(DOMElementClass)
    })

    const reqID = requestComponent.id.split('-').pop()
    const request = requestList.find((req) => req.reqID == reqID)
    request.actionClicked = true

    if (DOMElement === 'sub-menu') request.rendered.subMenu = true
    else request.rendered.popUp = true

    setRequestList([...requestList])

    if (requestComponent) requestComponent.style.display = 'none'
    if (isAccepted && !state.accept && !state.play) {
        setState({...state, accept: request})
    }

    if (!isAccepted) declineRequest(reqID)
}

export function declineRequest(reqID) {
    axios({
        method: 'post',
        url: '/game/request/res',
        data: {
            reqID: reqID,
            action: 0
        }
    }).catch((err) => {
        console.log(err)
    })
}