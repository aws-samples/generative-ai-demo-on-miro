import {
    imageGenerationFromStickers,
    imageInpainting,
    imageChangeFromImageAndSticker,
    imageStyleTransfer
} from './Components'
import { getAppData, onBoarding, setAppData } from './Services'
// @ts-ignore
const { board } = window.miro

async function init() {
    // user click application icon to run action
    // 1 - selection: a group of sticky notes -> image generation
    // 2 - selection: a picture, a sticky note, an arrow and a shape -> image inpainting
    // 3 - selection: a picture, a sticky note and arrow -> image change based on prompt
    // 4 - selection: two pictures with arrow -> image style transfer

    board.ui.on('icon:click', async () => {
        // check if user has been onboarded
        const onBoardParam = 'GenAIOnBoard'
        const onBoarded = await getAppData(onBoardParam)
        console.log('onBoarded', onBoarded)
        if (!onBoarded) {
            await onBoarding()
            await setAppData(onBoardParam, 'true')
        }

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

        // case 1 - image generation from stickers
        // selected any number of stickers
        // yellow stickers - positive prompt, red stickers - negative prompt, green stickers - parameters
        if (stickers.length > 0 && stickers.length === selectedItems.length) {
            console.log('running use-case 1: image generation from stickers')
            await imageGenerationFromStickers(stickers)
            return
        }

        // case 2 - image inpainting
        // Selected 1 image, 1 round shape on it (region), 1 sticker and 1 connector between image and sticker
        if (
            selectedItems.length === 4 &&
            images.length === 1 &&
            stickers.length === 1 &&
            connectors.length === 1 &&
            shapes.length === 1
        ) {
            console.log('running use-case 2: image inpainting')
            await imageInpainting(shapes, stickers, images)
            return
        }

        // case 3 - image change from image & sticker
        // Selected 1 image, 1 sticker and a connector between them
        if (
            selectedItems.length === 3 &&
            images.length === 1 &&
            stickers.length === 1 &&
            connectors.length === 1
        ) {
            console.log('running use-case 3: image change from image & sticker')
            await imageChangeFromImageAndSticker(connectors, stickers, images)
            return
        }

        // case 4 - image style transfer
        // Selected 2 images and 1 connector between them
        if (selectedItems.length === 3 && images.length === 2 && connectors.length === 1) {
            console.log('running use-case 4: image style transfer')
            await imageStyleTransfer(images, connectors)
            return
        }

    })
}

init()
