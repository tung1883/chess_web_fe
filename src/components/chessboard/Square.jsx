import { indexToPos } from "./BoardControl"

export function squareClass(i, id, cur, rotate) {
    let [x, y] = indexToPos(i)
    let className = 'square ' + x + y
    
    if (id) className += ' ' + id
    if (cur) className += ((x + y) % 2 === 0) ? ' cur-light' : ' cur-dark'

    return className
}

const pieceImage = (id) => process.env.PUBLIC_URL + '/assets/pieces/' +  id + '.png'

export default function Square({ className, id }) {
    return <div className={className}>
        {id && <div
            className='piece' 
            style={{backgroundImage: `url(${pieceImage(id)})`}}></div>}
    </div>
}