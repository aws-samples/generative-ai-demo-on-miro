
const { board } = window.miro;

async function init() {
  board.ui.on("icon:click", async () => {
    // Get selected items and filter images
    let selectedItems = await board.getSelection();
    console.log(selectedItems);

    // Filter images from selected items
    let images = selectedItems.filter(
      (item) => item.type === "image"
    );

    // Check images quantity and found 2 images with connector between
    if (images.length == 2 ) {
      // Filter connectors - use connector to identify direction
      let connectors = (await board.get()).filter((item) => item.type === 'connector');
      let style_item = null
      let content_item = null
      // iterate over connectors while found the one between images
      for (const con of connectors) {
        if (con.start.item == images[0].id && con.end.item == images[1].id) {
          style_item = images[0];
          content_item = images[1];
          break;
        } else if (con.start.item == images[0].id && con.end.item == images[1].id) {
          style_item = images[1];
          content_item = images[0];
          break;
        }
      }
      // We found two stickies and understand which one is style/content
      console.log(style_item, content_item)
      // If connector found => create new item
      if (style_item && content_item) {
        // calculate coordinates to new item
        const new_x = content_item.x + (content_item.x - style_item.x)
        const new_y = content_item.y + (content_item.y - style_item.y)

        // request data from server
        // const apiUrl = "http://18.235.102.139:8889"
        const apiUrl = "https://5c61aoib04.execute-api.us-east-1.amazonaws.com"
        const parametersPOST = {
          method: 'POST',
          headers: {
            'content-type': 'application/json;charset=UTF-8',
          },
          // put images URL to body request
          body: btoa(JSON.stringify({
            styleImage: style_item.url,
            contentImage: content_item.url,
          }))
        }

        const response = await fetch(apiUrl, parametersPOST)
        if (response.ok) {
          console.log("Server data received: ", response)
          // const data = await JSON.parse(atob(response.body))
          const data = await response.json()
          console.log("Response data:", data)
          // create image on the board
          const image = await board.createImage({
            title: 'Result',
            url: data['responseURL'],
            x: new_x, // Default value: horizontal center of the board
            y: new_y, // Default value: vertical center of the board
            width: content_item.width, // Set either 'width', or 'height'
            //height: content_item.height,
            rotation: 0.0,
          });

        }


        /*
        const new_StickyNote = await board.createStickyNote({
          content: new_content,
          style: {
            fillColor: 'light_yellow', // Default value: light yellow
            textAlign: 'center', // Default alignment: center
            textAlignVertical: 'middle', // Default alignment: middle
          },
          x: new_x, // Default value: horizontal center of the board
          y: new_y, // Default value: vertical center of the board
          shape: 'square',
          width: content_item.width, // Set either 'width', or 'height'

        });
         */
        };  // end of content creation
      };  /// end of image searching

    // Filter stickers from selected items
    let stickers = selectedItems.filter(
      (item) => item.type === "sticky_note"
    );

    if (selectedItems.length > 0 && selectedItems.length == stickers.length) {
      let prompt = "";
      let negative_prompt = "";
      let new_x = 0;
      let new_y = 0;
      let seed = Math.floor(Math.random() * 10000000) + 1
      for (const s of stickers) {
        new_x += s.x
        new_y += s.y;
        if (s.style.fillColor == "light_yellow") {
          // strip all HTML tags : replaceAll(/<\/?[^>]+(>|$)/gi, "")
          prompt += ", " + s.content.replaceAll(/<\/?[^>]+(>|$)/gi, "")
        }
        if (s.style.fillColor == "red") {
          negative_prompt += ", " + s.content.replaceAll(/<\/?[^>]+(>|$)/gi, "")
        }
        if (s.style.fillColor == "dark_green") {
          let num = parseInt(s.content.match(/\d+/g))
          if ( num != null) {
            seed = num;
          }
        }
      }
      new_x = new_x / stickers.length;
      new_y = new_y / stickers.length
      if (prompt.length > 0) {
        // request for image generation Stable Diffusion
        // request data from server
        // const apiUrl = "http://18.235.102.139:8889"
        //const apiUrl = "https://a1dw81xscd.execute-api.us-east-1.amazonaws.com/default/miro-integration-sd-21-lambda"
        const apiUrl = "https://2ax4qaprfg.execute-api.us-east-1.amazonaws.com/default/miro-inference-invoke-lambda"
        //let seed = Math.floor(Math.random() * 10000000) + 1
        const parametersPOST = {
          method: 'POST',
          headers: {
            'content-type': 'application/json;charset=UTF-8',
          },
          // put images URL to body request
          body: btoa(JSON.stringify({
            action: "create",
            prompt: prompt,
            negative_prompt: negative_prompt,
            seed : seed,
            width : 512,
            height : 512,
            guidance_scale : 7
          }))
        }

        const response = await fetch(apiUrl, parametersPOST)
        if (response.ok) {
          console.log("Server data received: ", response)
          // const data = await JSON.parse(atob(response.body))
          const data = await response.json()
          console.log("Response data:", data)
          // create image on the board
          const image = await board.createImage({
            title: "Seed: " + seed,
            url: data['responseURL'],
            x: new_x, // Default value: horizontal center of the board
            y: new_y, // Default value: vertical center of the board
            width: 512, // Set either 'width', or 'height'
            //height: content_item.height,
            rotation: 0.0,
          });

        }

      }
    }

    // Filter 1 selected image and 1 sticker and arrow between them

    /*  DONE before
    let stickers = selectedItems.filter(
      (item) => item.type === "sticky_note"
    );
    let images = selectedItems.filter(
      (item) => item.type === "image"
    );
    */

    if (selectedItems.length == 3 && images.length == 1 && stickers.length == 1) {
      let connectors = selectedItems.filter((item) => item.type === 'connector');
      let con = connectors[0]
      // If selected connector goes from image to sticker
      if (con.start.item == images[0].id && con.end.item == stickers[0].id) {
          // extract image url from image

          // extract prompt from sticker
          const prompt = stickers[0].content.replaceAll(/<\/?[^>]+(>|$)/gi, "")
          const new_x = stickers[0].x + (stickers[0].x - images[0].x)
          const new_y = stickers[0].y + (stickers[0].y - images[0].y)
          const apiUrl = "https://2ax4qaprfg.execute-api.us-east-1.amazonaws.com/default/miro-inference-invoke-lambda"
          //let seed = Math.floor(Math.random() * 10000000) + 1
          const parametersPOST = {
            method: 'POST',
            headers: {
              'content-type': 'application/json;charset=UTF-8',
            },
            // put images URL to body request
            body: btoa(JSON.stringify({
              action: "modify",
              prompt: prompt,
              image_url: images[0].url,
              width : 512,
              height : 512,
              guidance_scale : 7
            }))
          }

          const response = await fetch(apiUrl, parametersPOST)
        if (response.ok) {
          console.log("Server data received: ", response)
          // const data = await JSON.parse(atob(response.body))
          const data = await response.json()
          console.log("Response data:", data)
          // create image on the board
          const image = await board.createImage({
            title: "Modified image",
            url: data['responseURL'],
            x: new_x, // Default value: horizontal center of the board
            y: new_y, // Default value: vertical center of the board
            width: 512, // Set either 'width', or 'height'
            //height: content_item.height,
            rotation: 0.0,
          });

        }


      }
    }



    })

  };

init();
