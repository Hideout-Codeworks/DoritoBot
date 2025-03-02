import * as puppeteer from 'puppeteer';

export async function fetchHastebinContent(url: string): Promise<string | null> {
    try {
        const isRaw = url.includes('/raw/');
        const rawUrl = isRaw ? url : url.replace(/(https?:\/\/[^/]+)\/(\w+)(\.\w+)?$/, '$1/raw/$2');

        const browser = await puppeteer.launch({ headless: true });
        if (!isRaw) {
            const page = await browser.newPage();
            await page.goto(url);
            await page.waitForSelector('head');
            const source = await page.evaluate(() => document.head.outerHTML);

            if (!source.includes('hastebin')) {
                console.log('Not a Hastebin page.');
                await browser.close();
                return null;
            }
        }

        const page = await browser.newPage();
        await page.goto(rawUrl, { waitUntil: 'networkidle0' });

        await page.waitForSelector('body');

        const rawText = await page.evaluate(() => document.querySelector('pre')?.textContent || null);

        await browser.close();

        if (!rawText) {
            console.log('No content found in <body> tag.');
            return null;
        }

        return rawText;
    } catch (error) {
        console.error('Error fetching Hastebin content:', error);
        return null;
    }
}
