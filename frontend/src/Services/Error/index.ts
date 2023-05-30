// @ts-ignore
const { board } = window.miro
export const createError = async (
    error_x: number,
    error_y: number,
    message: string
) => {
    await board.createStickyNote({
        content: message,
        style: {
            fillColor: 'orange', // Default value: light yellow
            textAlign: 'center', // Default alignment: center
            textAlignVertical: 'middle', // Default alignment: middle
        },
        x: error_x, // Default value: horizontal center of the board
        y: error_y, // Default value: vertical center of the board
        shape: 'square',
        width: 300, // Set either 'width', or 'height'
    })
}
