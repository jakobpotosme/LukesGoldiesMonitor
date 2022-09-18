import fetch from "node-fetch";
import * as dotenv from "dotenv";
dotenv.config();

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const webhookId = process.env.DISCORD_WEBHOOK_ID;
const webhookToken = process.env.DISCORD_WEBHOOK_TOKEN;

async function WebHook() {
  const initialProducts = [];
  let isThereUpdate = false;

  const initialResponse = await fetch("https://lukesgoldies.com/products.json")
    .then((response) => response.json())
    .then((data) => {
      return data.products;
    });

  initialResponse.forEach((product) => {
    let template = {
      name: product.title,
      available: product.variants[0].available,
      price: product.variants[0].price,
      image: product.images[0].src,
    };
    initialProducts.push(template);
  });

  while (true) {
    const response = await fetch("https://lukesgoldies.com/products.json")
      .then((response) => response.json())
      .then((data) => {
        return data.products;
      });

    if (response.length != initialProducts.length) {
      const updates = {
        embeds: [
          {
            title: `${response[0].vendor}`,
            description: `There has been a store update! Don't forget to restart script...`,
            url: `https://lukesgoldies.com/collections/all`,
          },
        ],
      };

      postUpdate(
        `https://discord.com/api/webhooks/${webhookId}/${webhookToken}?wait=true`,
        updates
      );
      console.log(
        `${new Date().toISOString()} There has been a store update! Don't forget to restart script...`
      );
      await sleep(10000);

      process.exit(1);
    }

    for (let i = 0; i < response.length; i++) {
      if (response[i].variants[0].available != initialProducts[i].available) {
        const updates = {
          embeds: [
            {
              title: `${initialProducts[i].name}`,
              description: `In stock for $${initialProducts[i].price}`,
              url: `https://lukesgoldies.com/products/${response[i].handle}`,
              image: {
                url: initialProducts[i].image,
                height: 25,
                width: 25,
              },
            },
          ],
        };
        postUpdate(
          `https://discord.com/api/webhooks/${webhookId}/${webhookToken}?wait=true`,
          updates
        );
        console.log(`${new Date().toISOString()} Update!`);
        isThereUpdate = true;
      }
    }

    if (!isThereUpdate) {
      console.log(`${new Date().toISOString()} No Update`);
    }

    await sleep(60000);
  }
}

async function postUpdate(url = "", data = {}) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  return response.json();
}

WebHook();
