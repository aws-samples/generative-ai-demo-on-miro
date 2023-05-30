import {
    imageStyleTransfer,
    imageGenerationFromStickers,
    imageInpainting,
    imageChangeFromImageAndSticker,
} from './Components'
// @ts-ignore
const { board } = window.miro

async function init() {
    // user click application icon to run action
    // 1 - selection: two pictures with arrow -> image style transfer
    // 2 - selection: a group of sticky notes -> image generation
    // 3 - selection: a picture, a sticky note and arrow -> image change based on prompt
    // 4 - selection: a picture, a sticky note, an arrow and a shape -> image inpainting

    board.ui.on('icon:click', async () => {
        // Get selected items and filter images
        const selectedItems = await board.getSelection()

        const images = selectedItems.filter(
            (item: { type: string }) => item.type === 'image'
        )
        const stickers = selectedItems.filter(
            (item: { type: string }) => item.type === 'sticky_note'
        )

        const connectors = selectedItems.filter(
            (item: { type: string }) => item.type === 'connector'
        )

        const shapes = selectedItems.filter(
            (item: { type: string }) => item.type === 'shape'
        )

        // case 1 - image style transfer
        if (images.length === 2) {
            console.log('running use-case 1: image style transfer')
            await imageStyleTransfer(images, connectors)
            return
        }

        // case 2 - image generation from stickers
        if (stickers.length > 0) {
            console.log('running use-case 2: image generation from stickers')
            await imageGenerationFromStickers(stickers)
            return
        }

        // case 3 - image change from image & sticker
        if (
            selectedItems.length === 3 &&
            images.length === 1 &&
            stickers.length === 1
        ) {
            console.log('running use-case 3: image change from image & sticker')
            await imageChangeFromImageAndSticker(connectors, stickers, images)
            return
        }

        // case 4 - image inpainting
        if (
            images.length === 1 &&
            stickers.length === 1 &&
            connectors.length === 1 &&
            shapes.length === 1
        ) {
            console.log('running use-case 4: image inpainting')
            await imageInpainting(shapes, stickers, images)
            return
        }
    })
}

init()
