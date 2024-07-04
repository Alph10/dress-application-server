const puppeteer = require("puppeteer");
require("dotenv").config();

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
    const page = await browser.newPage();

    await page.goto("https://developer.chrome.com/");
  }
  catch (e) {
    console.error(e);
    res.send(`Something went wrong while running Puppeteer: ${e}`);
  } finally {
    await browser.close();
  }
};

const scrapeLogic = async (req, res) => {
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

    console.log(queryString);

    const page = await browser.newPage();

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

module.exports = { search, scrapeLogic };
