import puppeteer from 'puppeteer';

export async function fetchHastebinContent(url: string): Promise<string | null> {
    try {
        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();
        await page.goto(url, { waitUntil: 'networkidle0' });

        await page.waitForSelector('body');

        const bodyContent = await page.evaluate(() => {
            return document.body.innerHTML;
        });

        await browser.close();

        if (!bodyContent) {
            console.log('No body content found.');
        }

        return bodyContent || null;
    } catch (error) {
        console.error('Error fetching Hastebin content:', error);
        return null;
    }
}

export async function isHastebinPage(url: string): Promise<boolean> {
    try {
        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();
        await page.goto(url);

        await page.waitForSelector('head');

        const source = await page.evaluate(() => {
            return document.documentElement.outerHTML;
        });

        await browser.close();

        if (source.includes('hastebin')) {
            console.log('Hastebin detected in the page source!');
            return true;
        }

        return false;
    } catch (error) {
        console.error('Error checking if the page is a hastebin:', error);
        return false;
    }
}