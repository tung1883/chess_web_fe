export function delay(time, val) {
    return new Promise(resolve => setTimeout(resolve, time, val));
}