//@ts-ignore
const { board } = window.miro

export const createShapeOnBoard = async (
    title: string,
    type: string,
    x: number,
    y: number
) => {
        return await board.board.createShape({
            content: title,
            shape: type,
            style: {
                color: '#1a1a1a', // Default text color: '#1a1a1a' (black)
                fillColor: '#fff9f9', // Default shape fill color: transparent (no fill)
                fontFamily: 'arial', // Default font type for the text
                fontSize: 48, // Default font size for the text, in dp
                textAlign: 'center', // Default horizontal alignment for the text
                textAlignVertical: 'middle', // Default vertical alignment for the text
                borderStyle: 'normal', // Default border line style
                borderOpacity: 1.0, // Default border color opacity: no opacity
                borderColor: '#2d9bf0', // Default border color: '#ffffff` (white)
                borderWidth: 8, // Default border width
                fillOpacity: 0.9, // Default fill color opacity: no opacity
              },

            x: x, // Default value: horizontal center of the board
            y: y, // Default value: vertical center of the board
            width: 400 // Set either 'width', or 'height'
        })
    }

export const removeItemFromBoard = async (
    item: object
) => {
        await board.board.remove(item)
    }
