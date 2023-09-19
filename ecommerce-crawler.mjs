// Libs: puppeteer, bullmq, ioredis
import puppeteer from "puppeteer";
import { Queue } from "bullmq";
import { Redis } from "ioredis";

// Create a connection to local Redis
const connection = new Redis({
    maxRetriesPerRequest: null,
});
// Create a new Queue with the name "eCrawler"
const crawlerQueue = new Queue("eCrawler", {
    connection,
});
// Lunch a new browser
const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ["--start-maximized"],
    userDataDir: "./temp",
});
// Get the first page
const [page] = await browser.pages();
// Go to the page
await page.goto("https://www.ottostore.com/", {
    waitUntil: "networkidle2",
});
// Wait for the selector to load
await page.waitForSelector(".grid-product__content a");
// Get the links
const productLinks = await page.$$eval(".grid-product__content a", (links) =>
    links.map((link) => link.href)
);
// Close the browser
await page.close();
await browser.close();

// Add the links to the queue
for (let product of productLinks) {
    crawlerQueue.add(product, { url: product }, { jobId: product });
}
