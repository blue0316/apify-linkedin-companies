// This is the main Node.js source code file of your actor.
// It is referenced from the "scripts" section of the package.json file,
// so that it can be started by running "npm start".

// Import Apify SDK. For more information, see https://sdk.apify.com/
const Apify = require("apify");
const { log } = Apify.utils;

Apify.main(async () => {
  // Get input of the actor (here only for demonstration purposes).
  // If you'd like to have your input checked and have Apify display
  // a user interface for it, add INPUT_SCHEMA.json file to your actor.
  // For more information, see https://docs.apify.com/actors/development/input-schema
  // linkedin company directory page
  // const url = "https://www.linkedin.com";
  const url =
    "https://www.linkedin.com/directory/companies?trk=homepage-basic_directory_companyDirectoryUrl";
  // see if the user wants to filter by company
  const input = {
    username: "",
    password: "",
    company: "Amazon",
  };

  const date = new Date();
  const dateLocale = date.toISOString();

  try {
    let launchOptions = { headless: false, slowMo: 0o10 };
    let launchContext = {
      launchOptions: launchOptions,
    };

    log.info("Launching Puppeteer...");
    // console.log("Launching Puppeteer...");
    const browser = await Apify.launchPuppeteer(launchContext);
    // const browser = await Puppeteer.launch(launchContext);
    try {
      const page = await browser.newPage();

      // Turn on ability to abort requests.
      await page.setRequestInterception(true);

      // log to browser console to terminal
      page.on("console", async (msg) => {
        const msgArgs = msg.args();
        for (let i = 0; i < msgArgs.length; ++i) {
          console.log(await msgArgs[i].jsonValue());
        }
      });

      log.info(`Opening page ${url}...`);
      await page.goto(url);

      // Take screenshot of home page
      await page.screenshot({
        path: "./screenshots/linkedin-" + dateLocale + ".png",
        fullPage: true,
      });

      // Get title of the page.
      const title = await page.title();
      log.info(`Title of the page "${url}" is "${title}".`);

      // Save title to table
      log.info("Saving output...");
      await Apify.setValue("title", {
        title,
      });

      log.info("Logging in...");
      let selector = ".authwall-join-form__form-toggle--bottom";
      let waitOptions = { timeout: 120000 };

      const waitForSignInBtn = await page.waitForSelector(
        selector,
        waitOptions
      );

      log.info(`Navigating to Sign In Page by clicking Sign In Button...`);
      const [response] = await Promise.all([
        page.waitForNavigation(),
        // page.goto(jsonLink),
        page.click(selector),
      ]);

      await page.screenshot({
        path: "./screenshots/linkedincompaniesdirectory-" + dateLocale + ".png",
        fullPage: true,
      });

      // should return array of links to the companies individual pages
      selector = "input[autocomplete=username]";
      page.type(selector, username);

    } catch (error) {
      log.error("browser or other error:");
      log.error(error);
    } finally {
      log.info("Closing Puppeteer...");
      await browser.close();

      log.info("Done.");
    }
  } catch (e) {
    log.error("Launch Puppeteer error:");
    log.error(e);
  }
});
