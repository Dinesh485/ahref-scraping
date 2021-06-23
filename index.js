const express = require('express');
const app = express();
if(process.env.NODE_ENV !== 'production'){
    require('dotenv').config()
}
const puppeteer = require("puppeteer-extra");
const fs = require('fs');
const cookies = require('./cookies.json');
const stealthPlugin  = require('puppeteer-extra-plugin-stealth')

puppeteer.use(stealthPlugin());


(async() =>{
   
    //-------puppeteer gonna create a page when server starts--------------
    const wpName = process.env.WP_NAME
    const password = process.env.PASSWORD
    const browser  = await puppeteer.launch({headless: true})
    const page = await browser.newPage()
 
    //----------check for auth cookies in the cookies.json file-------
    let authCookie = cookies.filter(cookie => {
        return cookie.name.includes('wfwaf-authcookie') 
    })[0]
     
    /* if auth doest not exists, puppeteer gonna login and retrive the cookies from the dashboad and store them in cookies.json for future use*/
    if(!authCookie){
        await page.goto('https://webcreatives.in/wp-admin', {waitUntil: "networkidle2"})
        console.log('page fetched')
        await page.waitForSelector('input[name=log]')
        await page.type('input[name=log]', wpName )
        await page.waitForSelector('input[name=pwd]')
        await page.type('input[name=pwd]', password )
        await page.click('input[name=wp-submit]'),
        await page.waitForNavigation()
        console.log('logged in')
        let currentCookies = await page.cookies()
        console.log(currentCookies)
        await fs.writeFileSync('cookies.json', JSON.stringify(currentCookies))
        console.log('cookies saved')

    //if there is a authcookie in cookie.json, we are gonna set cookies of puppeteer page that was initialized in the line 17    
    }else{
       await page.setCookie(...cookies)
       console.log('cookies set')
       
    }
   
//-----------ignore from here, still working on this---------------
    app.get('/', async (req,res) =>{
  

        // since cookies for the page are already set in the else block, we can access any private routes without loging in again
        await page.goto('https://webcreatives.in/wp-admin')
        let pageContent = await page.content()
         res.send(pageContent)
    })
  
    app.listen(process.env.PORT, () => console.log(`listening to the port ${process.env.PORT}`))
   
})();


