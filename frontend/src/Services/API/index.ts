const { board } = miro

export const getToken = async () => {
    return await board.getIdToken()
}

function convertResolution(resolution: string): { width: number; height: number } {
    const [width, height] = resolution.split(' x ').map(Number);
    return { width, height };
}

export const generateImage =
	async (action : string , prompt : string, negative_prompt : string, init_image : any, shape_position : any,
           region: string, model_id: string, resolution: string) => {
    const token = await getToken()

    const { width, height } = convertResolution(resolution);

    let seed = Math.floor(Math.random() * 10000000) + 1;

    const requestBody = JSON.stringify(
        {
            "action": action,
            "prompt": prompt,
			"negative_prompt": negative_prompt,
            "init_image": init_image,
            "shape_position": shape_position,
            "region": region,
            "model_id": model_id,
            "height": height,
            "width": width,
            "seed": seed,
          }
    );

    console.log('Request body: ', requestBody);
    console.log('Image: ', init_image);

    const config = {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: requestBody,
        //mode: 'no-cors'  as RequestMode, //TODO: Add this line
    }

    try {
        const response = await fetch(`/api/gen-ai-proxy`, config)
        if (response.status !== 200) {
            console.log('Server data received: ', response)
        }
        return await response.json()
    } catch (error) {
        console.error('Error:', error)
    }
    
}