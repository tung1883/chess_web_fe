export async function errorRedo({ errorObject, errorMsg, maxRedos, action, actionParams, isThrowingError }) {
    let errorCounter = 0
    maxRedos = (maxRedos) ? maxRedos : 5
    errorMsg = (errorMsg) ? errorMsg : "Error when execute errorRedo"

    if (!errorObject) {
        if (errorCounter > maxRedos) {
            if (isThrowingError) {
                throw new Error(errorMsg)
            } else {
                console.log(errorMsg)
                return errorObject
            }
        }

        errorObject = await action(actionParams)
    }

    return errorObject
}
