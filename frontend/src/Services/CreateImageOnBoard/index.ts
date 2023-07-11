import { createError } from '../Error'
//@ts-ignore
const { board } = window.miro
const APP_ORIGIN = location.origin

export const createImageOnBoard = async (
    data: any,
    width: number,
    x: number,
    y: number
) => {
    // error handling
    if (data.status != 'ok') {
        // if error happened - put error sticker to the board
        await createError(x, y, data.reply)
    } else {
        await board.createImage({
            title: 'Modified image',
            url: `${APP_ORIGIN}/${data.responseURL}`,
            x: x, // Default value: horizontal center of the board
            y: y, // Default value: vertical center of the board
            width: width, // Set either 'width', or 'height'
            rotation: 0.0,
        })
    }
}
