import {
    createError,
    getGeneratedData,
    createImageOnBoard,
    createShapeOnBoard,
    removeItemFromBoard
} from "../../Services";

export const imageChangeFromImageAndSticker = async (connectors: any, stickers: any, images: any) => {
    const con = connectors[0]
    const errMessage = "Error: invalid selection. Please select 1 image, 1 sticker and an arrow in between for image change"
    // If selected connector goes from image to sticker
    if (con.start.item == images[0].id && con.end.item == stickers[0].id) {
        const prompt = stickers[0].content.replaceAll(/<\/?[^>]+(>|$)/gi, "")
        const new_x = stickers[0].x + (stickers[0].x - images[0].x)
        const new_y = stickers[0].y + (stickers[0].y - images[0].y)

        const requestBody =  JSON.stringify({
            action: "modify",
            prompt: prompt,
            image_url: images[0].url,
            width : 512,
            height : 512,
            guidance_scale : 7
        })

        // create temporary shape on the board
        const tempShape = createShapeOnBoard("<p><strong>WAIT</strong></p><p>5-7 sec</p>", "octagon", new_x, new_y)
        const data: any = getGeneratedData(requestBody)

        const ultimatePromise = Promise.all([tempShape, data])
        ultimatePromise.then(res => {
            removeItemFromBoard(res[0])

            const genImage = res[1]
            if (genImage.status != 'ok') {
                // error handling
                createError(new_x, new_y, genImage.reply)
                return
            } else {
                // create image
                createImageOnBoard(genImage, 512, new_x, new_y)
            }

        })


        //await createImageOnBoard(data, 512, new_x, new_y)
    } else {
        // error happened. create error sticker on the board
        await createError(
            images[0].x,
            images[0].y,
            errMessage
            )
    }
}