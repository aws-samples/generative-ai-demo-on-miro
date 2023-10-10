//@ts-ignore
const { board } = window.miro

export const createCardOnBoard = async (
    title: string,
    x: number,
    y: number,
	width: number,
) => {
	console.log('Creating card')
        return await board.createCard({
            title: title,
            x: x, // Default value: horizontal center of the board
            y: y, // Default value: vertical center of the board
			width: width
        })
    };

export const createConnectorBetweenCards = async (
	start: string,
	end: string,
	text: string
) => {
	console.log('Creating connector')
		return await board.createConnector({
			start: {
				item: start,
				position: {
					x: 1,
					y: 0.5,
				},
			},
			end: {
				item: end,
				position: {
					x: 0,
					y: 0.5,
				},
			},
			captions: [
				{
					content: text,
					position: 0.5,
					textAlignVertical: 'bottom',
				}
			]
		})
}
