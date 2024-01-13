import '../css/LoadingSpinner.css'

const DEFAULT_ATTRIBUTES = {
    width: '10',
    height: '10',
    borderColor: '#dddddd',
    borderTopColor: 'rgba(0, 0, 0, 0.817)'
}

export default function LoadingSpinner(params) {
    let { width, height, borderColor, borderTopColor } = params
    
    width = (width) ? width : DEFAULT_ATTRIBUTES.width
    height = (height) ? height : DEFAULT_ATTRIBUTES.height
    borderColor = (borderColor) ? borderColor : DEFAULT_ATTRIBUTES.borderColor
    borderTopColor = (borderTopColor) ? borderTopColor : DEFAULT_ATTRIBUTES.borderTopColor
    let borderWidth = width / 5

    return (
        <div className = 'loading'
            style={{
                display: 'flex',
                justifyContent: 'center',
                content: '',
                width: width + 'px',
                height: height + 'px',
                border: borderWidth + 'px solid ' + borderColor,
                borderTopColor: borderTopColor,
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
            }}
        />
    )
}