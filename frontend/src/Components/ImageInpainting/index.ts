import {
    createError,
    getGeneratedData,
    createImageOnBoard,
} from '../../Services'
export const imageInpainting = async (
    shapes: any,
    stickers: any,
    images: any
) => {
    console.log(' running use-case 4: image inpainting')
    console.log('Shape: ', shapes[0])
    const new_x = stickers[0].x + (stickers[0].x - images[0].x)
    const new_y = stickers[0].y + (stickers[0].y - images[0].y)
    if (shapes[0].shape != 'circle') {
        await createError(
            new_x,
            new_y,
            'Error: invalid selection. Please select 1 image, 1 circle shape, 1 sticker and an arrow from image to sticker'
        )
        return
    }
    const prompt = stickers[0].content.replaceAll(/<\/?[^>]+(>|$)/gi, '')
    const shape_position = {
        x: shapes[0].x - (images[0].x - images[0].width / 2),
        y: shapes[0].y - (images[0].y - images[0].height / 2),
        width: shapes[0].width,
        height: shapes[0].height,
        type: shapes[0].shape,
    }
    console.log('New shape: ', shape_position)

    const requestBody = btoa(
        JSON.stringify({
            action: 'inpaint',
            prompt: prompt,
            image_url: images[0].url,
            shape_position: shape_position,
            width: images[0].width,
            height: images[0].height,
            guidance_scale: 7,
        })
    )

    const data = await getGeneratedData(requestBody)
    await createImageOnBoard(data, 512, new_x, new_y)
}
