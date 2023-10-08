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

export const getCreatedImage = async (requestBody: any) => {
    const token = await getToken()
    const config = {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'content-type': 'application/json;charset=UTF-8',
        },
        body: requestBody,
    }

    const response = await fetch(`/api/create-image-proxy`, config)
    if (response.status !== 200) {
        console.log('Server data received: ', response)
    }
    return await response.json()
}

export const getModifiedImage = async (requestBody: any) => {
    const token = await getToken()
    const config = {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'content-type': 'application/json;charset=UTF-8',
        },
        body: requestBody,
    }

    const response = await fetch(`/api/modify-image-proxy`, config)
    if (response.status !== 200) {
        console.log('Server data received: ', response)
    }
    return await response.json()
}

export const getInPaintedImage = async (requestBody: any) => {
    const token = await getToken()
    const config = {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'content-type': 'application/json;charset=UTF-8',
        },
        body: requestBody,
    }

    const response = await fetch(`/api/inpaint-image-proxy`, config)
    if (response.status !== 200) {
        console.log('Server data received: ', response)
    }
    return await response.json()
}

export const getStyleTransferredImage = async (requestBody: any) => {
    const token = await getToken()
    const config = {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'content-type': 'application/json;charset=UTF-8',
        },
        body: requestBody,
    }

    const response = await fetch(`/api/modify-image-proxy`, config)
    if (response.status !== 200) {
        console.log('Server data received: ', response)
    }
    return await response.json()
}
