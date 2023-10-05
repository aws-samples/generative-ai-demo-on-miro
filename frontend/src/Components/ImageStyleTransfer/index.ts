import {
    getStyleTransferredImage,
    createError,
    createImageOnBoard,
} from '../../Services'
//@ts-ignore
const { board } = window.miro

export const imageStyleTransfer = async (images: any, connectors: any) => {
    let style_item = null
    let content_item = null
    // need to find the right connector if exist -> identify direction
    // iterate over connectors while found the one between images
    for (const con of connectors) {
        if (con.start.item == images[0].id && con.end.item == images[1].id) {
            style_item = images[0]
            content_item = images[1]
            break
        } else if (
            con.start.item == images[0].id &&
            con.end.item == images[1].id
        ) {
            style_item = images[1]
            content_item = images[0]
            break
        }
    }
    // error handling
    if (style_item == null || content_item == null) {
        await createError(
            images[0].x,
            images[0].y,
            'Invalid selection. Select two images and arrow between them'
        )
        return
    }

    console.log(style_item, content_item)
    // If connector found => create new item
    if (style_item && content_item) {
        // calculate coordinates to new item
        const new_x = content_item.x + (content_item.x - style_item.x)
        const new_y = content_item.y + (content_item.y - style_item.y)

        const requestBody = JSON.stringify({
            styleImage: style_item.url,
            contentImage: content_item.url,
        })

        const data: any = await getStyleTransferredImage(requestBody)

        await createImageOnBoard(data, content_item.width, new_x, new_y)
    } // end of content creation
}
