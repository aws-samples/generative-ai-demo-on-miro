// @ts-ignore
const { board } = window.miro
export const getGeneratedData = async (requestBody: any) => {
    const token = await board.getIdToken()
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
