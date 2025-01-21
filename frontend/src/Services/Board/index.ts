// @ts-ignore
const { board } = window.miro

interface BaseItem {
    id: string;
    type: string;
}

export const getPromptFromStickies = async () => {
    const selectedItems = await board.getSelection()

    const stickies = selectedItems.filter(
        (item: { type: string }) => item.type === 'sticky_note'
    )

    if (stickies.length === 0) {
        throw new Error("No stickies found");
    }

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    stickies.forEach((sticky: any) => {
        minX = Math.min(minX, sticky.x - sticky.width);
        maxX = Math.max(maxX, sticky.x + sticky.width);
        minY = Math.min(minY, sticky.y - sticky.height);
        maxY = Math.max(maxY, sticky.y + sticky.height);
        //console.log(`minX: ${minX}, maxX: ${maxX}, minY: ${minY}, maxY: ${maxY}`);
    });

    const tolerance = 10;

    stickies.sort((a: any, b: any) => {
        if (Math.abs(a.y - b.y) <= tolerance) {
            // If the y coordinates are close enough, sort by x coordinate
            return a.x - b.x;
        } else {
            // Otherwise, sort by y coordinate
            return a.y - b.y;
        }
    });

   const prompt = stickies
  .filter((sticky: any) => sticky.style.fillColor != 'red')
  .map((sticky: any) => sticky.content.replaceAll(/<\/?[^>]+(>|$)/gi, ''))
  .join(' ');

   const negativePrompt = stickies
  .filter((sticky: any) => sticky.style.fillColor === 'red')
  .map((sticky: any) => sticky.content.replaceAll(/<\/?[^>]+(>|$)/gi, ''))
  .join(' ');


    // The width calculation now correctly considers the width of the stickies
    return { prompt: prompt, negativePrompt: negativePrompt, x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

export const getInitImageUrl = async () => {
    const selectedItems = await board.getSelection()

    const images = selectedItems.filter(
        (item: { type: string }) => item.type === 'image'
    )
    const shapes = selectedItems.filter(
        (item: { type: string }) => item.type === 'shape'
    )

    if (images.length === 0) {
        return { initImage: '', shapePosition: '' };
    } else if (shapes.length === 0) {
        return { initImage: await images[0].getDataUrl(), shapePosition: '' };
    }

    const shape_position = {
        x: shapes[0].x - (images[0].x - images[0].width / 2),
        y: shapes[0].y - (images[0].y - images[0].height / 2),
        width: shapes[0].width,
        height: shapes[0].height,
        type: shapes[0].shape,
    }

    return { initImage: await images[0].getDataUrl(), shapePosition: shape_position }
}

export const createImageOnBoard = async (
    url: string,
    width: number,
    x: number,
    y: number
) => {
    await board.createImage({
        title: 'Modified image',
        url: url,
        x: x, // Default value: horizontal center of the board
        y: y, // Default value: vertical center of the board
        width: width, // Set either 'width', or 'height'
        rotation: 0.0,
    })
}

export const createWaitShapeOnBoard = async (
    x: number,
    y: number
) => {
    return await board.createShape({
        content: "Generating...",
        shape: "octagon",
        style: {
            color: '#1a1a1a', // Default text color: '#1a1a1a' (black)
            fillColor: '#fff9f9', // Default shape fill color: transparent (no fill)
            fontFamily: 'arial', // Default font type for the text
            fontSize: 40, // Default font size for the text, in dp
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
        width: 400, // Set either 'width', or 'height'
        height: 400
    })
}

export const findItemOnBoard = async (
    shape_id : string
) => { 
        return board.getById (shape_id) 
}

export const removeItemFromBoard = async (
    item: BaseItem
) => {
        await board.remove(item)
}

    
