import {
    getGeneratedData,
    createError,
    createImageOnBoard,
} from '../../Services'

export const imageGenerationFromStickers = async (stickers: any) => {
    let prompt = ''
    let negative_prompt = ''
    let new_x = 0
    let new_y = 0
    let seed = Math.floor(Math.random() * 10000000) + 1
    // collect prompts from stickers
    for (const s of stickers) {
        new_x += s.x
        new_y += s.y
        // collect positive prompts
        if (s.style.fillColor === 'light_yellow') {
            // strip all HTML tags : replaceAll(/<\/?[^>]+(>|$)/gi, "")
            prompt += ', ' + s.content.replaceAll(/<\/?[^>]+(>|$)/gi, '')
        }
        // collect negative prompts
        if (s.style.fillColor === 'red') {
            negative_prompt +=
                ', ' + s.content.replaceAll(/<\/?[^>]+(>|$)/gi, '')
        }
        // collect parametes (SEED)
        if (s.style.fillColor === 'dark_green') {
            let num = parseInt(s.content.match(/\d+/g))
            if (num != null) {
                seed = num
            }
        }
    }
    new_x = new_x / stickers.length
    new_y = new_y / stickers.length
    if (prompt.length > 0) {
        const requestData = JSON.stringify({
            action: 'create',
            prompt: prompt,
            negative_prompt: negative_prompt,
            seed: seed,
            width: 512,
            height: 512,
            guidance_scale: 7,
        })

        const data: any = await getGeneratedData(requestData)

        // error handling
        if (data.status != 'ok') {
            await createError(new_x, new_y, data.reply)
            return
        } else {
            await createImageOnBoard(data, 512, new_x, new_y)
        }
    }
}
