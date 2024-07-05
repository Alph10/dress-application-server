const puppeteer = require("puppeteer");
require("dotenv").config();

// const scrapeLogic = async (req, res) => {
//   const browser = await puppeteer.launch({
//     args: [
//       "--disable-setuid-sandbox",
//       "--no-sandbox",
//       "--single-process",
//       "--no-zygote",
//     ],
//     executablePath:
//       process.env.NODE_ENV === "production"
//         ? process.env.PUPPETEER_EXECUTABLE_PATH
//         : puppeteer.executablePath(),
//   });
//   try {
//     const page = await browser.newPage();

//     await page.goto("https://developer.chrome.com/");
//   }
//   catch (e) {
//     console.error(e);
//     res.send(`Something went wrong while running Puppeteer: ${e}`);
//   } finally {
//     await browser.close();
//   }
// };

const search = async (req, res) => {
  const browser = await puppeteer.launch({
    args: [
      "--disable-setuid-sandbox",
      "--no-sandbox",
      "--single-process",
      "--no-zygote",
    ],
    executablePath:
      process.env.NODE_ENV === "production"
        ? process.env.PUPPETEER_EXECUTABLE_PATH
        : puppeteer.executablePath(),
  });
  try {
    // Get query
    const query = req.query;

    var queryString = "";
    Object.entries(query).forEach(queryElement => {
      if (Array.isArray(queryElement[1])) {
        queryElement[1].forEach(element => {
          queryString += (queryElement[0] + "[]=" + element + "&");
        })
      }
      else {
        queryString += (queryElement[0] + "=" + queryElement[1] + "&");
      }
    });

    console.log("/search", queryString);

    const page = await browser.newPage();
    page.setDefaultTimeout(2*60*1000);

    // Go to the target website
    await page.goto(`https://www.vinted.it/catalog?${queryString}`, { waitUntil: 'networkidle2' });

    // Wait for a specific element to ensure all data has loaded
    await page.waitForSelector('[data-testid^="product-item"]');
 
    // Evaluate the page content and extract the desired information
    const items = await page.evaluate(() => {
      const elements = document.querySelectorAll('div.new-item-box__container[data-testid^=product-item-id]');
      return Array.from(elements).map(element => ({
        title: element.children[1].children[0].children[0].children[0].alt.trim().split(", ")[0],
        price: element.children[1].children[0].children[0].children[0].alt.trim().split(", ")[1],
        image: element.children[1].children[0].children[0].children[0].src,
        // Double href so that it works when the a tag is in the position 1 or 2
        link: element.children[1].children[1].href,
        link: element.children[1].children[2].href
      }));
    });

    // Send the extracted information as JSON
    res.json(items);
  } catch (e) {
    console.error(e);
    res.send(`Something went wrong while running Puppeteer: ${e}`);
  } finally {
    await browser.close();
  }
};

const brands = async (req, res) => {
  const browser = await puppeteer.launch({
    defaultViewport: false,
    args: [
      "--disable-setuid-sandbox",
      "--no-sandbox",
      "--single-process",
      "--no-zygote",
    ],
    executablePath:
      process.env.NODE_ENV === "production"
        ? process.env.PUPPETEER_EXECUTABLE_PATH
        : puppeteer.executablePath(),
  });
  try {
    console.log("/brands");

    const page = await browser.newPage();
    page.setDefaultTimeout(3*60*1000);
    await page.setViewport({width: 640, height:480})

    // Go to the target website
    await page.goto(`https://www.vinted.it/catalog`, { waitUntil: 'networkidle2' });
    await page.waitForNavigation();

    const rejectCookie = await page.waitForSelector('#onetrust-reject-all-handler');
    if(rejectCookie) {
      await rejectCookie.click();
    }

    await page.waitForSelector('button[data-testid="trigger"]'); //Filters
    await page.evaluate(() => {
      document.querySelector('button[data-testid="trigger"]').click();
    });

    await page.waitForSelector('[data-testid="modal"]>div:nth-child(2)>div:nth-child(5)>div'); // Brands
    await page.evaluate(() => {
      document.querySelector('[data-testid="modal"]>div:nth-child(2)>div:nth-child(5)>div').click();
    });

    // Evaluate the page content and extract the desired information
    await page.waitForSelector('ul.pile>li span.web_ui__Text__title'); // Brand list
    const items = await page.evaluate(() => {
      const elements = document.querySelectorAll('ul.pile>li>div>div');
      return Array.from(elements).map(element => ({
        name: element.children[0].children[0].children[0].children[0].textContent,
        id: element.id.slice(element.id.lastIndexOf("-")+1, element.id.length)
      }));A
    });

    // Send the extracted information as JSON
    res.json(items);
  }
  catch (e) {
    console.error(e);
    res.send(`Something went wrong while running Puppeteer: ${e}`);
  } finally {
    await browser.close();
  }
}

module.exports = { search, brands };
