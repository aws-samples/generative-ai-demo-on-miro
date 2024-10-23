const { board } = miro

export const getToken = async () => {
    return await board.getIdToken()
}

function convertResolution(resolution: string): { width: number; height: number } {
    const [width, height] = resolution.split(' x ').map(Number);
    return { width, height };
}

export const generateImage = async (prompt : string, region: string, model_id: string, resolution: string) => {
    const token = await getToken()

    const { width, height } = convertResolution(resolution);

    let seed = Math.floor(Math.random() * 10000000) + 1;

    const requestBody = JSON.stringify(
        {
            "action": "generate",
            "prompt": prompt,
            "region": region,
            "model_id": model_id,
            "height": height,
            "width": width,
            "seed": seed,
          }
    )

    const config = {
        method: 'POST',
        headers: {
            // 'Authorization': `Bearer ${token}`,
            Authorization: `Bearer ADD_MIRO_APP_CLIENT_SECRET_HERE`,
            'Content-Type': 'application/json',
        },
        body: requestBody,
        //mode: 'no-cors'  as RequestMode, // Add this line
    }

    try {
        // const response = await fetch(`/api/moodboard`, config)
        const response = await fetch(`https://d7t3y54ijltza.cloudfront.net/api/moodboard`, config)
        if (response.status !== 200) {
            console.log('Server data received: ', response)
        }
        return await response.json()
    } catch (error) {
        console.error('Error:', error)
    }
    
}