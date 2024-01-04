import axios from "axios"

export function sendMessage(gameID, message) {
    try {
        axios({
            method: 'post',
            url: `/game/message/${gameID}`,
            data: { message }
        })

        return true
    } catch (err) {
        console.log(err)
        return false
    }
}

export async function getMessages(gameID) {
    try {
        const getMessageList = await axios({
            method: 'get',
            url: `/game/message/${gameID}`
        })

        return getMessageList.data.messageList
    } catch (err) {
        console.log(err)
        return null
    }
}

export async function deleteMessages(gameID) {
    try {
        await axios({
            method: 'delete',
            url: `/game/message/${gameID}`
        })
        
        return true
    } catch (err) {
        console.log(err)
        return false
    }
}