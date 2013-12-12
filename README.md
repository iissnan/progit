This project aims to generate html pages for *Pro Git* book from [*Book Source*](https://github.com/progit/progit) using node.js.

The HTML pages can be host on the [GitHub](http://github.com) via gh-pages. You can find more info about gh-pages [here](http://pages.github.com/).

You can visit [Here](http://iissnan.com/progit) to check out the demo.

## Build Procedure

1. Download [Node.js](http://nodejs.org).
2. Fork and clone this repository:

    ```
    git clone https://github.com/yourname/progit.git progit
    ```
3. Install Node Packages:
    
    ```
    npm install
    ```
    
4. Generate HTML pages:
    
    ```
    node lib/build
    ```
   
5. Push to your repository's gh-pages branch.

    ```
    git push origin gh-pages
    ```

6. There is no 6 step.
