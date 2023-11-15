document.addEventListener('DOMContentLoaded', () => {
    const grid = document.querySelector('.grid')
    const scoreDisplay = document.getElementById('score')
    const scoreLabel = document.getElementById('score-header')
    const movesDisplay = document.getElementById('moves')
    const movesLabel = document.getElementById('moves-header')
    const hiddenContent = document.getElementById('hidden')
    const userHighscore = document.getElementById('highscore')

    const width = 8
    const squares = []

    var candyColors = []

    let score = 0
    let movesLeft = 5
    let winCon = 40   
    let condition = "moves"

    /*
        Candy Setup And Board Instantiation
    */

    function doesFileExist(urlToFile) {
        var xhr = new XMLHttpRequest();
        xhr.open('HEAD', urlToFile, false);
        xhr.send();
    
        if(xhr.status == "404"){
            return false;
        } else {
            return true;
        }
    }
    
    if(doesFileExist('../images/alternative-red.png')){
        candyColors = [
            'url(../images/alternative-red.png)',
            'url(../images/alternative-yellow.png)',
            'url(../images/alternative-orange.png)',
            'url(../images/alternative-purple.png)',
            'url(../images/alternative-green.png)',
            'url(../images/alternative-blue.png)'
        ]
    } else if (doesFileExist('../public/images/alternative-red.png')){
        candyColors = [
            'url(../public/images/alternative-red.png)',
            'url(../public/images/alternative-yellow.png)',
            'url(../public/images/alternative-orange.png)',
            'url(../public/images/alternative-purple.png)',
            'url(../public/images/alternative-green.png)',
            'url(../public/images/alternative-blue.png)'
        ]
    } else {
        // This should never happen
        console.log("Error: Could not find image files required")
    }

    function createBoard(){
        for (let i = 0; i < width*width; i++){
            const square = document.createElement('div')
            square.setAttribute('draggable', true)
            square.setAttribute( 'id', i)            
            let randColor = Math.floor(Math.random() * candyColors.length)
            square.style.backgroundImage = candyColors[randColor]
            grid.appendChild(square)
            squares.push(square)
        }
    }

// needed to overwrite any existing html in document
movesDisplay.innerHTML = movesLeft  

let i = 0
createBoard()
window.setInterval(
    function () {
        moveDown()
        replaceCandies()
        i += 1
        if(i = 300){
            window.clearInterval();
        }
    }
, 100)




    /*
        Moving and Swapping Candies
    */

    let colorBeingDragged
    let colorBeingReplaced
    let squareIdBeingDragged
    let squareIdBeingReplaced

    squares.forEach(square => square.addEventListener('dragstart', dragStart))
    squares.forEach(square => square.addEventListener('dragend', dragEnd))
    squares.forEach(square => square.addEventListener('dragover', dragOver))
    squares.forEach(square => square.addEventListener('dragenter', dragEnter))
    squares.forEach(square => square.addEventListener('dragleave', dragLeave))
    squares.forEach(square => square.addEventListener('drop', dragDrop))

    function dragStart() {
        colorBeingDragged = this.style.backgroundImage
        squareIdBeingDragged = parseInt(this.id)
        console.log(colorBeingDragged)
        console.log(this.id, 'dragstart')
    }

    function dragOver(e) {
        e.preventDefault()
        console.log(this.id, 'dragover')
    }

    function dragEnter(e) {
        e.preventDefault()
        console.log(this.id, 'dragenter')
    }

    function dragLeave() {
        console.log(this.id, 'dragleave')
    }

    function dragEnd() {
        console.log(this.id, 'dragend')

        let validMoves = [ // define a valid move
            squareIdBeingDragged -1,
            squareIdBeingDragged -width,
            squareIdBeingDragged +1,
            squareIdBeingDragged +width,
        ]
        let validMove = validMoves.includes(squareIdBeingReplaced)

        if(squareIdBeingReplaced && validMove) {
            squareIdBeingReplaced = null
            movesLeft--
            movesDisplay.innerHTML = movesLeft
        } else if (squareIdBeingReplaced && !validMove) {
            squares[squareIdBeingReplaced].style.backgroundImage = colorBeingReplaced
            squares[squareIdBeingDragged].style.backgroundImage = colorBeingDragged
        } else squares[squareIdBeingDragged].style.backgroundImage = colorBeingDragged
    }

    function dragDrop() {
        console.log(this.id, 'dragdrop')
        colorBeingReplaced = this.style.backgroundImage
        squareIdBeingReplaced = parseInt(this.id)
        this.style.backgroundImage = colorBeingDragged
        squares[squareIdBeingDragged].style.backgroundImage = colorBeingReplaced
    }

    /*
        Checking for matches
    */

    // Check for Row Of Three
    function checkRowForThree() {
        for (i = 0; i<62; i++){
            let rowOfThree = [i, i+1, i+2]
            let decidedColor = squares[i].style.backgroundImage
            const isBlank = squares[i].style.backgroundImage === ''

            const notValid = [6, 7, 14, 15, 22, 23, 30, 31, 38, 39, 46, 47, 54, 55, 62, 63]
            if (notValid.includes(i)) continue

            if (rowOfThree.every(index => squares[index].style.backgroundImage === decidedColor && !isBlank)){
                score += 3
                scoreDisplay.innerHTML = score;
                rowOfThree.forEach(index => {
                    squares[index].style.backgroundImage = ''
                })
            }
        }
    }
    // Check for Column Of Three
    function checkColumnForThree() {
        for (i = 0; i < 48; i++){
            let columnOfThree = [i, i+width, i+width*2]
            let decidedColor = squares[i].style.backgroundImage
            const isBlank = squares[i].style.backgroundImage === ''

            if (columnOfThree.every(index => squares[index].style.backgroundImage === decidedColor && !isBlank)){
                score += 3
                scoreDisplay.innerHTML = score
                columnOfThree.forEach(index => {
                    squares[index].style.backgroundImage = ''
                })
            }
        }
    }


    // Check for Row Of Four
    function checkRowForFour() {
        for (i = 0; i<61; i++){
            let rowOfFour = [i, i+1, i+2, i+3]
            let decidedColor = squares[i].style.backgroundImage
            const isBlank = squares[i].style.backgroundImage === ''

            const notValid = [5, 6, 7, 13, 14, 15, 21, 22, 23, 29, 30, 31, 37, 38, 39, 45, 46, 47, 53, 54, 55, 61, 62, 63]
            if (notValid.includes(i)) continue

            if (rowOfFour.every(index => squares[index].style.backgroundImage === decidedColor && !isBlank)){
                score += 4
                scoreDisplay.innerHTML = score
                rowOfFour.forEach(index => {
                    squares[index].style.backgroundImage = ''
                })
            }
        }
    }
    // Check for Column Of Four
    function checkColumnForFour() {
        for (i = 0; i<40; i++){
            let columnOfFour = [i, i+width, i+2*width, i+3*width]
            let decidedColor = squares[i].style.backgroundImage
            const isBlank = squares[i].style.backgroundImage === ''
            
            if (columnOfFour.every(index => squares[index].style.backgroundImage === decidedColor && !isBlank)){      
                score += 4
                scoreDisplay.innerHTML = score
                columnOfFour.forEach(index => {
                    squares[index].style.backgroundImage = ''
                })
            }
        }
    }

    // Check for Row Of Five
    function checkRowForFive() {
        for (i = 0; i<60; i++){
            let rowOfFive = [i, i+1, i+2, i+3, i+4]
            let decidedColor = squares[i].style.backgroundImage
            const isBlank = squares[i].style.backgroundImage === ''

            const notValid = [4, 5, 6, 7, 12, 13, 14, 15, 20, 21, 22, 23, 28, 29, 30, 31, 36, 37, 38, 39, 44, 45, 46, 47, 52, 53, 54, 55, 60, 61, 62, 63]
            if (notValid.includes(i)) continue

            if (rowOfFive.every(index => squares[index].style.backgroundImage === decidedColor && !isBlank)){
                score += 5
                scoreDisplay.innerHTML = score
                rowOfFive.forEach(index => {
                    squares[index].style.backgroundImage = ''
                })
            }
        }
    }
    // Check for Column Of Five
    function checkColumnForFive() {
        for (i = 0; i<32; i++){
            let columnOfFive = [i, i+width, i+2*width, i+3*width, i+4*width]
            let decidedColor = squares[i].style.backgroundImage
            const isBlank = squares[i].style.backgroundImage === ''
            
            if (columnOfFive.every(index => squares[index].style.backgroundImage === decidedColor && !isBlank)){      
                score += 5
                scoreDisplay.innerHTML = score
                columnOfFive.forEach(index => {
                    squares[index].style.backgroundImage = ''
                })
            }
        }
    }

/*
    ACTUAL GAME LOOP
*/
var gameLoop = window.setInterval(
    function() {
        // refresh board state
        moveDown()
        replaceCandies()

        if(movesLeft >= 0){
            // check for matches
            checkColumnForFive()
            checkRowForFive()
            checkRowForFour()
            checkColumnForFour()
            checkRowForThree()
            checkColumnForThree()
        }
        // check if the player won or lost
        isGameOver()
    }, 
100)

    //  drop candies once some candies have been cleared
    function moveDown() {
        for(i = 0; i < 56; i++){
            if(squares[i+width].style.backgroundImage === ''){
                squares[i+width].style.backgroundImage = squares[i].style.backgroundImage
                squares[i].style.backgroundImage = ''
                const firstRow = [0, 1, 2, 3, 4, 5, 6, 7]
                const isFirstRow = firstRow.includes(i)
                if(isFirstRow && squares[i].style.backgroundImage === ''){
                    let randomColor = (Math.random() * candyColors.length)
                    squares[i].style.backgroundImage = candyColors[randomColor]
                }
            }
        }
    }

    //  generate new candies when some candies are cleared: makes candies 'fall' from top
    function replaceCandies(){
        for (let i = 0; i < width*width; i++){
            let randColor = Math.floor(Math.random() * candyColors.length)
            let currSquare = squares[i]
            let currColumn = i%8
            let targetSquare = squares[currColumn]

            if(currSquare.style.backgroundImage === ''){
                targetSquare.style.backgroundImage = candyColors[randColor]
                moveDown()
            }            
        }
    }

    //  Check if our win condition is met
    function isGameOver() {
        if(condition == "score"){
            if(score >= winCon){
                displayGameEnd()
                deleteBoard()
            }
        }
        if(condition == "moves"){
            if(movesLeft <= 0){
                displayGameEnd()
                deleteBoard()
            }
        }
    }

    // Display text so user knows game is over
    function displayGameEnd() {
        scoreLabel.innerText = "Game Over!"
        movesLabel.innerHTML = "Your score was " + score + "!"
        if(userHighscore != null){
            userHighscore.innerHTML = score
        }
        if(hiddenContent != null){
            hiddenContent.classList.remove('hide') 
        }
    }

    function deleteBoard(){
        grid.remove()
        console.log("Removed Game Board")
        clearInterval(gameLoop)
    }
})