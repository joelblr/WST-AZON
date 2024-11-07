// Import the necessary libraries.
const puppeteer = require("puppeteer");
const fs = require("fs");
// const fsp = require("fs").promises;
const path = require('path');

// hard coded
SIGN_IN_URL = 'https://www.amazon.in/ap/signin?openid.pape.max_auth_age=3600&openid.return_to=https%3A%2F%2Fwww.amazon.in%2FSamsung-Storage-Display-Charging-Security%2Fproduct-reviews%2FB0DFY3XCB6%2Fref%3Dcm_cr_dp_d_show_all_btm%3Fie%3DUTF8%26reviewerType%3Dall_reviews&openid.identity=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0%2Fidentifier_select&openid.assoc_handle=inflex&openid.mode=checkid_setup&language=en_IN&openid.claimed_id=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0%2Fidentifier_select&openid.ns=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0'

// Get the argument passed from Python (JSON string)
const dataJson = process.argv[2];
// Parse the JSON string into a JavaScript object
const data2 = JSON.parse(dataJson);
// const { PRODUCT_BASE_URL, PRODUCT_NAME, NUM_PAGES, FILE_NAME } = data2;
const { PRODUCT_BASE_URL, PRODUCT_NAME, FROM_PAGE, TO_PAGE, FILE_NAME } = data2;

// // from gui
// PRODUCT_BASE_URL = 'https://www.amazon.in/Samsung-Storage-Display-Charging-Security/product-reviews/B0DFY3XCB6/ref=cm_cr_dp_d_show_all_btm?ie=UTF8&reviewerType=all_reviews'
// PRODUCT_NAME = "Mobiles"
// NUM_PAGES = 2
// FILE_NAME = "amazon_reviews77"

// login cred.json
// async function readFile() {
function readFile() {
    try {
        // Read the JSON file asynchronously
        const data = fs.readFileSync('credentials.json', 'utf-8');
        // Parse the JSON content into an object
        const jsonData = JSON.parse(data);

        // Extract email and password
        const { email_phone, password } = jsonData;

        // Ensure email_phone and password are valid strings
        if (typeof email_phone !== 'string' || email_phone.trim() === '') {
            throw new Error('Invalid or missing email_phone');
        }
        if (typeof password !== 'string' || password.trim() === '') {
            throw new Error('Invalid or missing password');
        }

        // Return the email and password from the function
        return {"EMAIL_PHONE": email_phone, "PASSWORD": password };

    } catch (error) {
        console.error('Error reading or parsing JSON file:', error);
        throw error; // Rethrow error if needed
    }
}

const { EMAIL_PHONE, PASSWORD } = readFile();



// Define the selectors for the elements we need to extract.
const selectors = {
//   allReviews: '#cm_cr-review-list div.review',
  allReviews: '#cm_cr-review_list div.review',
//   allReviews: '#cm-cr-dp-review-list div.review',
  authorName: 'div[data-hook="genome-widget"] span.a-profile-name',
  reviewTitle: 'a[data-hook=review-title] span:not([class])',
//   reviewTitle: 'a[data-hook=review-title]>span:not([class])',
  rating: '[data-hook="review-title"] span.a-icon-alt',
  reviewText: 'div[class="a-row a-spacing-small review-data"] span',
//   reviewText: 'span[data-hook="review-body"] span',

//   reviewDate: 'span[data-hook=review-date]',
  emailid: 'input[name=email]',
  password: 'input[name=password]',
  continue: 'input[id=continue]',
  singin: 'input[id=signInSubmit]',
};


// Asynchronously fetch the Amazon reviews.
async function fetchAmazonReviews() {
    // Launch a Puppeteer browser.
    const browser = await puppeteer.launch({
    // Set headless to false so we can see the browser in action.
    headless: false,
    });

    // Create a new page in the browser.
    const page = await browser.newPage();

    // Navigate to the Amazon sign-in page.
    await page.goto(SIGN_IN_URL);

    // Wait for the email input field to be loaded.
    await page.waitForSelector(selectors.emailid);

    // Type your email address into the email input field.
    await page.type(selectors.emailid, EMAIL_PHONE, { delay: 100 });

    // Click the continue button.
    await page.click(selectors.continue);

    // Wait for the password input field to be loaded.
    await page.waitForSelector(selectors.password);

    // Type your password into the password input field.
    await page.type(selectors.password, PASSWORD, { delay: 100 });

    // Click the sign-in button.
    await page.click(selectors.singin);

    // Wait for the page to navigate to the product page.
    await page.waitForNavigation();

    // Create an empty array to store the review data.
    const reviewsData = [];

    for (let i = FROM_PAGE; i <= TO_PAGE; i++) {
        const productURL = PRODUCT_BASE_URL + "&pageNumber=" + i;
    
        try {
            // Navigate to the product page for which you want to fetch the reviews.
            await page.goto(productURL, { waitUntil: 'load', timeout: 20000 }); // XXX:
    
            // Wait for the allReviews selector to be loaded.
            await page.waitForSelector(selectors.allReviews);
    
            // Get all of the review elements on the page.
            const reviewElements = await page.$$(selectors.allReviews);
    
            // Iterate over the review elements and extract the author, title, and date for each review.
            for (const reviewElement of reviewElements) {
                // Get the author name.
                const author = await reviewElement.$eval(selectors.authorName, (element) => element.textContent);
    
                // Get the review title.
                // const title = await reviewElement.$eval(selectors.reviewTitle, (element) => element.textContent);
                const title = await reviewElement.$eval(selectors.reviewTitle, (element) => {
                    // Extract the inner HTML first
                    let cleanedText = element.innerHTML.trim();

                    // Replace <br> tags with a single space
                    cleanedText = cleanedText.replace(/<br\s*\/?>/gi, '. ');
                
                    // Remove all other HTML tags (e.g., <span>, <a>, <em>, etc.)
                    cleanedText = cleanedText.replace(/<\/?[^>]+(>|$)/g, '');  // This will strip out all HTML tags
                
                    // Remove emojis using a regular expression (if needed)
                    cleanedText = cleanedText.replace(/[\p{Emoji}\p{ExtPict}]/gu, ''); // Remove emojis
                
                    // Remove extra spaces (replace multiple spaces with a single space)
                    cleanedText = cleanedText.replace(/\s+/g, ' ').trim(); // \s+ matches any whitespace, and trim() removes leading/trailing spaces

                    // Return the cleaned text
                    return cleanedText;
                });

                // Get the rating (only the numeric part, e.g., "4.5").
                const rating = await reviewElement.$eval(selectors.rating, (element) => {
                    const ratingText = element.textContent.trim(); // "4.5 out of 5 stars"
                    const match = ratingText.match(/^(\d+(\.\d+)?)/); // Match the numeric part at the start
                    return match ? match[1] : null; // Return the matched rating number, or null if no match
                });
    
                // Get the review text, replacing <br> tags with spaces and removing emojis.
                const text = await reviewElement.$eval(selectors.reviewText, (element) => {
                    // Extract the inner HTML first
                    let cleanedText = element.innerHTML.trim();
                
                    // Replace <br> tags with a single space
                    cleanedText = cleanedText.replace(/<br\s*\/?>/gi, ' ');
                
                    // Remove all other HTML tags (e.g., <span>, <a>, <em>, etc.)
                    cleanedText = cleanedText.replace(/<\/?[^>]+(>|$)/g, '');  // This will strip out all HTML tags
                
                    // Remove emojis using a regular expression (if needed)
                    cleanedText = cleanedText.replace(/[\p{Emoji}\p{ExtPict}]/gu, ''); // Remove emojis
                
                    // Remove extra spaces (replace multiple spaces with a single space)
                    cleanedText = cleanedText.replace(/\s+/g, ' ').trim(); // \s+ matches any whitespace, and trim() removes leading/trailing spaces

                    // Return the cleaned text
                    return cleanedText;
                });
    
                // Create a review data object.
                const reviewData = {
                    author,
                    title,
                    rating,
                    text,
                };
    
                // Add the review data object to the reviewsData array.
                reviewsData.push(reviewData);
            }
        } catch (error) {
            // Log the error if page.goto or any other part of the code fails
            console.error(`Error while navigating to ${productURL}:`, error.message);
            continue;
        }
    }

    // Create the CSV content.
    let csvHeader = "Product_Name,Customer_Name,Review_Title,Rating,Review_Text\n";
    let csvContent = "";

    // Iterate over the reviews data and add it to the CSV content.
    let cnt = 0;
    for (const review of reviewsData) {
        cnt++;
        const { author, title, rating, text } = review;
        csvContent += `"${PRODUCT_NAME}","${author}","${title}",${rating},"${text}"\n`;
    }


    // Define the directory and file path
    const dirPath = path.join(__dirname, 'datasets');
    const filePath = path.join(dirPath, FILE_NAME+'.csv');
    // Ensure the directory exists (create it if it doesn't)
    fs.mkdirSync(dirPath, { recursive: true }); // Creates the directory and any necessary subdirectories
    
    // Check if the file exists
    if (fs.existsSync(filePath)) {
        // Append an existing file without Header
        fs.appendFileSync(filePath, csvContent, 'utf8');
    } else {
        // Create a new file with Header
        csvContent = csvHeader+csvContent;
        fs.writeFileSync(filePath, csvContent, 'utf8');
    }

    // Log a message to the console indicating that the CSV file has been created.
    console.log(`File saved to ${filePath}`);
    console.log('Total number of records: ' + cnt);

    await browser.close()
}


// Call the fetchAmazonReviews function.
fetchAmazonReviews();
