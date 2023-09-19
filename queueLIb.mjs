// Purpose: This file is used to create a worker for the queue
import puppeteer from "puppeteer";
import { Worker } from "bullmq";
import Redis from "ioredis";
import { saveToDb } from "./dataBase.js";

// Create a connection to local Redis
const connection = new Redis({
    maxRetriesPerRequest: null,
});

// Lunch a new browser
const browser = await puppeteer.launch({
    headless: false,
    args: ["--start-maximized"],
    defaultViewport: null,
    userDataDir: "./temp",
});

// Extract the inner text from a selector
const extractInnerText = async (page, selector) => {
    return page.evaluate((selector) => {
        return document.querySelector(selector)?.innerHTML;
    }, selector);
};

// Create a new worker with the name "eCrawler"
new Worker(
    "eCrawler",
    async (job) => {
        try {
            const page = await browser.newPage();
            await page.goto(job.data.url, {
                waitUntil: "networkidle2",
                timeout: 50000,
            });
            await page.waitForSelector(".product-single__title");
            const Title = await extractInnerText(
                page,
                ".product-single__title"
            );
            const Price = await extractInnerText(page, ".product__price");
            const Description = await extractInnerText(
                page,
                ".product-single__description p:first-child"
            );
            const Details = await page.evaluate(() => {
                const unorderLists = [];
                const List = document?.querySelector(
                    ".product-single__description ul"
                );
                const productDetailElements = List?.querySelectorAll("li");
                productDetailElements?.forEach((element) => {
                    unorderLists.push(element.innerText);
                });
                return unorderLists;
            });

            // Save the data to the database
            await saveToDb(job.data.url, {
                Title,
                Price,
                Description,
                Details,
            });
            await page.close();
        } catch (error) {
            console.log(error);
        }
    },
    { connection }
);
