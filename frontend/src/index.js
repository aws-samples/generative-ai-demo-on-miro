
const { board } = window.miro;

function createError(error_x, error_y, message) {
  const stickyNote = miro.board.createStickyNote({
    content: message,
    style: {
      fillColor: 'orange', // Default value: light yellow
      textAlign: 'center', // Default alignment: center
      textAlignVertical: 'middle', // Default alignment: middle
    },
    x: error_x, // Default value: horizontal center of the board
    y: error_y, // Default value: vertical center of the board
    shape: 'square',
    width: 300, // Set either 'width', or 'height'
  });

}


async function init() {
  // user click application icon to run action
  // 1 - selection: two pictures with arrow -> image style transfer
  // 2 - selection: a group of sticky notes -> image generation
  // 3 - selection: a picture, a sticky note and arrow -> image change based on prompt
  //
  //

  board.ui.on("icon:click", async () => {
    // procedure parameters
    const apiUrl = "https://4ay7wa1sij.execute-api.us-east-1.amazonaws.com/default/lambda-generative-ai-demo-on-miro"


    // Get selected items and filter images
    let selectedItems = await board.getSelection();
    console.log(selectedItems);

    //-----------------------------------------//
    // look for case 1 - image style transfer  ||
    //-----------------------------------------//
    // Filter images from selected items
    let images = selectedItems.filter(
      (item) => item.type === "image"
    );

    // Check images quantity and found 2 images with connector between
    if (images.length === 2 ) {
      // Filter connectors - use connector to identify direction
      let connectors = (await board.get()).filter((item) => item.type === 'connector');
      let style_item = null
      let content_item = null
      // need to find the right connector if exist -> identify direction
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
      // error handling
      if (style_item == null || content_item == null) {
        createError(images[0].x, images[0].y, "Invalid selection. Select two images and arrow between them")
        return 0;
      }

      console.log(style_item, content_item)
      // If connector found => create new item
      if (style_item && content_item) {
        // calculate coordinates to new item
        const new_x = content_item.x + (content_item.x - style_item.x)
        const new_y = content_item.y + (content_item.y - style_item.y)

        // request data from server
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
          const data = await response.json()
          console.log("Response data:", data)
          // error handling
          if (data["status"] != "ok") {
            createError(new_x, new_y, data.toString())
            return;
          }
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

        } else {
          // error happened
          console.log("Server data received: ", response)
          const data = await response.json()
          console.log("Response data:", data['reply'].toString())
          // create error sticker on the board
          createError(new_x, new_y, data['reply'].toString())
          return 0;
        }

        }  // end of content creation
      }  /// end of image searching

    //---------------------------------------------------//
    // look for case 2 - image generation from stickers  ||
    //---------------------------------------------------//
    // Filter stickers from selected items
    let stickers = selectedItems.filter(
      (item) => item.type === "sticky_note"
    );

    // check that only stickers selected and the total number > 0
    if (selectedItems.length > 0 && selectedItems.length === stickers.length) {
      let prompt = "";
      let negative_prompt = "";
      let new_x = 0;
      let new_y = 0;
      let seed = Math.floor(Math.random() * 10000000) + 1
      // collect prompts from stickers
      for (const s of stickers) {
        new_x += s.x
        new_y += s.y;
        // collect positive prompts
        if (s.style.fillColor === "light_yellow") {
          // strip all HTML tags : replaceAll(/<\/?[^>]+(>|$)/gi, "")
          prompt += ", " + s.content.replaceAll(/<\/?[^>]+(>|$)/gi, "")
        }
        // collect negative prompts
        if (s.style.fillColor === "red") {
          negative_prompt += ", " + s.content.replaceAll(/<\/?[^>]+(>|$)/gi, "")
        }
        // collect parametes (SEED)
        if (s.style.fillColor === "dark_green") {
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
          const data = await response.json()
          console.log("Response data:", data)
          // error handling
          if (data["status"] != "ok") {
            createError(new_x, new_y, data['reply'].toString())
            return 0;
          }
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

        } else {
          // error happened
          console.log("Server data received: ", response)
          const data = await response.json()
          console.log("Response data:", data)
          // create error sticker on the board
          createError(new_x, new_y, data['reply'].toString())
          return 0;

        }

      }
    }

    //------------------------------------------------------//
    // look for case 3 - image change from image & sticker  ||
    //------------------------------------------------------//

    // check if only 3 items are selected and it's 1 image and 1 sticker
    if (selectedItems.length === 3 && images.length === 1 && stickers.length === 1) {
      // select connectors and check if it goes from image to sticky note
      let connectors = selectedItems.filter((item) => item.type === 'connector');
      let con = connectors[0]
      // If selected connector goes from image to sticker
      if (con.start.item == images[0].id && con.end.item == stickers[0].id) {
          // extract image url from image

          // extract prompt from sticker
          const prompt = stickers[0].content.replaceAll(/<\/?[^>]+(>|$)/gi, "")
          const new_x = stickers[0].x + (stickers[0].x - images[0].x)
          const new_y = stickers[0].y + (stickers[0].y - images[0].y)
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
            // error handling
            if (data["status"] != "ok") {
              // if error happened - put error sticker to the board
              createError(new_x, new_y, data.toString())
              return 0;
            }
            // if status OK -> create image on the board
            const image = await board.createImage({
              title: "Modified image",
              url: data['responseURL'],
              x: new_x, // Default value: horizontal center of the board
              y: new_y, // Default value: vertical center of the board
              width: 512, // Set either 'width', or 'height'
              //height: content_item.height,
              rotation: 0.0,
            });


        } else {
          // error happened
          console.log("Server data received: ", response)
          const data = await response.json()
          console.log("Response data:", data)
          // create error sticker on the board
          createError(new_x, new_y, data['reply'].toString())
          return 0;

        }


      } else {
        // error happened. create error sticker on the board
        createError(selectedItems[0].x, selectedItems[0].y, "Error: invalid selection. Please select 1 image, 1 sticker and an arrow in between for image change")
        return 0;

      }
    }



    })

  }

init();
