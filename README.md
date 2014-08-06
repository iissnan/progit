# About
This project aims to generate html pages for *Pro Git* book from [*Book Source*](https://github.com/progit/progit) using node.js.

The generated HTML pages can be hosted on the [GitHub](http://github.com) via [Github Pages](https://pages.github.com). 

## Demo
 - [demo](http://iissnan.com/progit).

## Screenshots

 - [Desktop](assets/img/preview-desktop.png?raw=true)
 - [Tablet](assets/img/preview-tablet.png?raw=true)
 - [Mobile](assets/img/preview-mobile.png?raw=true)


 ![Mobile](assets/img/preview-mobile.png?raw=true)




## How to build

1. Download and install [Node.js](http://nodejs.org).
2. Get a copy of this project:

    ```
    git clone https://github.com/iissnan/progit.git progit
    ```

    If you want to host this pages yourself, you need to fork this project to your account first.


3. Install dependencies:
    
    ```
    npm install
    ```

4. Get book source:

    Book source is involved as a git submodule.
    Run the following command to init the submodule.

    ```
    git submodule init
    git submodule update
    ````

5. Generate HTML pages:
    
    ```
    node lib/build
    ```
   
6. Push to your repository's gh-pages branch.

    ```
    git push origin gh-pages
    ```





