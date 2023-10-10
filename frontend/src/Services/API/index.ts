// @ts-ignore
const { board } = window.miro

export const getAppData = async (name: string) => {
    return await board.getAppData(name)
}

export const setAppData = async (name: string, value: unknown) => {
    await board.setAppData(name, value)
}

export const getToken = async () => {
    return await board.getIdToken()
}

export const getGeneratedData = async (requestBody: any) => {
    const token = await getToken()
    const config = {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'content-type': 'application/json;charset=UTF-8',
        },
        body: requestBody,
    }

    const response = await fetch(`/api/gen-ai-proxy`, config)
    if (response.status !== 200) {
        console.log('Server data received: ', response)
    }
    return await response.json()
}

export const getGeneratedTextData = async (requestBody: any) => {
	console.log('Request body is: ', requestBody)
	const token = await getToken()
	const config = {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${token}`,
			'content-type': 'application/json;charset=UTF-8',
		},
		body: JSON.stringify(requestBody)
}

	const response = await fetch(`/api/gen-ai-proxy-text`, config)
	if (response.status !== 200) {
		console.log('Server data received: ', response)
	}
	console.log('Response is: ', response)
	return await response.json()
}
