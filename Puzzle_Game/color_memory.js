$(document).ready(function(){
	
	//Constants 
	BOARD_SIZE = 4, BOARD_WIDTH = 720, BOARD_HEIGHT = 576;
	CLOSEST	   = 1, UP = 38, DOWN = 40, RIGHT = 39, LEFT = 37, ENTER = 13;
	SCORE_MESSAGE = [""];
	
	//Variables
	var debug = false;
	var grids = BOARD_SIZE*BOARD_SIZE;
	var game_score =0;		
	var slot_height = 0, slot_width = 0;
	var i;
	var board_html="";
	var posComments=['Nice Try!',"You are doing good :)","Cool!!","Keep Going :)","Awesome!!!","Great Job!!! :)","Almost there!! :D","Yes!! You did it!!!!!! :D:D"]
	var negComments=["Can do better...","Well, you can improve","work on ur memory :p","you missed it :(","Go on.. keep trying"];
	var row=0, col=0;
	var itemIndex=0;
	var configInfo; 
	var bgColors = new Array();
	var pairOpen = false;
	var timerFn;
	var focussed_elem;
	
	//Calculate slot size
	
	slot_height = (BOARD_HEIGHT/BOARD_SIZE);
	slot_width = (BOARD_WIDTH/BOARD_SIZE);
	
	//Create table structure dynamically
	
	for(row=0;row<BOARD_SIZE;row++){
		board_html+="<tr>";
		for(col=0;col<BOARD_SIZE;col++){
			board_html+="<td><span id='slot-"+itemIndex+"'></span></td>";
			itemIndex++;
		}
		board_html+="</tr>";
	}
	
	// Set defaults for the board
	
	$('#playField').append(board_html);					
	$('#playField td').css({'height':slot_height,'width':slot_width});
	$('td span').addClass('back');	

	//Calculate middle area of screen from the top
	
	var winHt = parseInt($(window).height());
	var sectionHt = parseInt($('section').height());
	var topMargin = (winHt-sectionHt)/2;
	
	// Set board position
	
	$('section').css({'margin-top':topMargin});
	$('#slot-0').addClass('focussed');
	$(document).focus();
	
	//Get the colours from config file via Ajax
	if(debug) {
		bgColors = ['#3be6c4','#e6e03b','#6f3be6','#4fe63b','#e63b3b','#ff5a00','#ff00de','#3b8fe6']; //Testing use
		//bgColors = ['#3be6c4','#3be6c4','#3be6c4','#3be6c4','#3be6c4','#3be6c4','#3be6c4','#3be6c4']; //Testing use
	} else {
		$.ajax({
			url:"proxy.php",
			async:false,
			success:function(data){
				configInfo = data;
				var line = configInfo.split('\r\n');
				for(var i=0;i<line.length;i++){
					var relevant = line[i].split(';')[0];
					if(relevant.length >0){
						relevant = relevant.trim();
						if(relevant.indexOf('#')==0)
						bgColors.push(relevant);
					}
				}				
			}
		});
		if(bgColors.length < 8){
			alert('OOPS! Config file error!');
			exit;
		}
	}
	
	// We need to pair up colours as we have 8 colours n 16 slots.
	// Below code sets the colours in random slots
	
	bgColors = bgColors.concat(bgColors); //Pair colours
	for (var i = bgColors.length - 1; i > 0; i--) {
		var j = Math.floor(Math.random() * (i + 1));
		var temp = bgColors[i];
		bgColors[i] = bgColors[j];
		bgColors[j] = temp;					
	}
	
	//Restart click event
	
	$('#restartImg').click(function(){
		var restart = window.confirm("Are you sure you want to restart??");
		if(restart)
			restartSettings();							
	});
	
	//Arror key functions for block navigation
	
	$(document).keypress(function(e) {
		focussed_elem = $('.focussed');
		var currIndex = parseInt(focussed_elem.attr('id').split('-')[1]);
		if(pairOpen) //Dont Process KeyPress if 2 Cards are open. 
			return;
		switch(e.keyCode){
		
			//Enter key
			
			case ENTER:	
				var openCardIndex=0;
				var index = $(focussed_elem).attr('id').toString().split('-')[1];	
				var openCard = $('#playField').find('.front').attr('id');											
				if(openCard){
					openCardIndex = parseInt(openCard.split('-')[1]);	
					if(index==openCardIndex){
						break;
					}
					pairOpen = true;
					timerFn = setTimeout(function(){														
						compareCards(index, openCardIndex);
					},2000);
				}
				$(focussed_elem).removeClass('back').addClass('front').css({'background-color':bgColors[index]});					
				break;
				
			//Up arrow 
			
			case UP:
				var nextIndex = getClosestIndexCol(currIndex, UP);
					var currCol   = getCol(currIndex);
					if(nextIndex == -1) {
						for(var i = currIndex-BOARD_SIZE; i >= currCol; i-= BOARD_SIZE) {	
							nextIndex = getClosestIndexRow(i, CLOSEST);
							if(nextIndex != -1) break;
						}
					}												
				shiftFocus(nextIndex, currIndex);
				break;
				
			//Down arrow
			
			case DOWN:
				var nextIndex = getClosestIndexCol(currIndex, DOWN);
					var currCol   = getCol(currIndex);
					if(nextIndex == -1) {
						for(var i = currIndex+BOARD_SIZE; i <= currCol + (BOARD_SIZE - 1) * BOARD_SIZE; i+= BOARD_SIZE) {	
							nextIndex = getClosestIndexRow(i, CLOSEST);
							if(nextIndex != -1) break;
						}
						
					}									
				shiftFocus(nextIndex, currIndex);
				break;	
				
			//Right arrow
			
			case RIGHT:
				var nextIndex = getClosestIndexRow(currIndex, RIGHT);
					var currRow   = getRow(currIndex);
					if(nextIndex == -1) {
						for(var i = currIndex+1; i < currRow*BOARD_SIZE; i++) {	
							nextIndex = getClosestIndexCol(i, CLOSEST);
							if(nextIndex != -1) break;
						}
					}							
				shiftFocus(nextIndex, currIndex);
				break;
				
			//Left arrow
			
			case LEFT:
				var nextIndex = getClosestIndexRow(currIndex, LEFT);
					var currRow   = getRow(currIndex);
					if(nextIndex == -1) {
						for(var i = currIndex-1; i >= (currRow-1)*BOARD_SIZE; i--) {	
							nextIndex = getClosestIndexCol(i, CLOSEST);
							if(nextIndex != -1) break;
						}
					}						
				shiftFocus(nextIndex, currIndex);
				break;						
			default:						
				break;
		}									
	});
	
	// ********** HELPER FUNCTIONS *************
	
	// Reset game settings
	
	function restartSettings(){
		window.clearInterval(timerFn);
		game_score=0;
		$('#playField td span').removeClass().addClass('back').css('background-image','');					
		$('#slot-0').addClass('focussed');			
		$('.score').html(game_score);
		$('.scoreImages').css('display','none');
		$('#comment').html("You haven't scored anything yet");
	}
	
	//Gets random number between range - inclusive
	
	function genRandomNumber(min, max){
		return Math.floor(Math.random() * (max - min +1)) + min;
	}
					
	//Set positive comment
	
	function setPosComment(){
		if(game_score != 8){
			rand = genRandomNumber(0,6);
			$('#comment').html(posComments[rand]);
		}
		else $('#comment').html(posComments[7]);			
	}
	
	//Set negative comment
	
	function setNegComment(){
		rand = genRandomNumber(0,4);
		$('#comment').html(negComments[rand]);
	}
	
	// Find if game is over
	
	function checkGameOver(){
		if(!($('td span').not('.inactive').length)>0){
			var restart = window.confirm("You Won!!! Do you wish to continue??");
			if(restart)
				restartSettings();
		}
	}

	// Compare open cards
	
	function compareCards(index, openCardIndex){
		if(bgColors[index] == bgColors[openCardIndex]){
			$('#slot-'+index+',#slot-'+openCardIndex).removeClass('front back')
													 .addClass('inactive')
													 .css({
														'background-image':'url(images/dog-thumbs-up.jpg)'
														,'background-size':'100% 100%'
													 });
			game_score++;
			setPosComment();
			$('#slot-'+index).removeClass('focussed').closest('table').find('.back:not(.inactive)').first().addClass('focussed');
		}
		else{
			$('td span').removeClass('front').addClass('back');
			game_score--;
			setNegComment();
		}	
		$('.score').html(game_score);
		$('.scoreImages').css('display','inline-block');
		checkGameOver();
		pairOpen = false;
	}
	
	// Shift focus to new element
	
	function shiftFocus(nextIndex, currIndex){
		if(nextIndex == -1)
			nextIndex = currIndex;						
		$(focussed_elem).removeClass('focussed');
		$('#slot-'+nextIndex).addClass('focussed');
	}
	
	//Get closest column index to move to
	
	function getClosestIndexCol(currIndex, direction, minIndex, maxIndex){
		var is_up;
		var is_down;
		var count;
		var minIndex = getCol(currIndex);
		var maxIndex = getCol(currIndex) + (BOARD_SIZE - 1) * BOARD_SIZE;
		
		if(direction == CLOSEST) {
			is_up    = true;
			is_down  = true;
			count    = BOARD_SIZE/2 + 1;
		} else if (direction == UP) {
			is_up    = true;
			is_down  = false;
			count    = BOARD_SIZE;
		} else if ( direction == DOWN) {
			is_up    = false;
			is_down  = true;
			count    = BOARD_SIZE;
		} else {
		   return -1;
		}
		
		for(var i=1 ; i <= count; i++) {
			if(is_up && ((currIndex - i*BOARD_SIZE) >= minIndex)) { 
				if(!($('#slot-'+(currIndex - i*BOARD_SIZE)).hasClass('inactive'))) 
					return (currIndex - i*BOARD_SIZE);
			}
			if(is_down && ((currIndex + i*BOARD_SIZE) <= maxIndex)) {
				if(!($('#slot-'+(currIndex + i*BOARD_SIZE)).hasClass('inactive'))) 
					return (currIndex + i*BOARD_SIZE);
			}
		}
		return -1;
	}
	
	// Get closest row index to move to
	
	function getClosestIndexRow(currIndex, direction){
		var is_right;
		var is_left;
		var count;
		
		var minIndex = (getRow(currIndex) - 1) * BOARD_SIZE;
		var maxIndex = (getRow(currIndex) * BOARD_SIZE - 1);
		
		if(direction == CLOSEST) {
			is_right = true;
			is_left  = true;
			count    = BOARD_SIZE/2 + 1;
		} else if (direction == RIGHT) {
			is_right = true;
			is_left  = false;
			count 	 = BOARD_SIZE;
		} else if ( direction == LEFT) {
			is_right = false;
			is_left  = true;
			count 	 = BOARD_SIZE;
		} else {
		   return -1;
		}
			
		for(var i=1 ; i <= count; i++) {
			if(is_left && ((currIndex - i) >= minIndex)) { 
				if(!($('#slot-'+(currIndex - i)).hasClass('inactive'))) 
					return (currIndex - i);
			}
			if(is_right && ((currIndex + i) <= maxIndex)) {
				if(!($('#slot-'+(currIndex + i)).hasClass('inactive'))) 
					return (currIndex + i);
			}
		}
		return -1;
	}

	// Get current row of the element
	
	function getRow(currIndex) {			
		var row = parseInt(currIndex/BOARD_SIZE) + 1;
		return row;
	}
	
	// Get current column of the element
	
	function getCol(currIndex) {
		var col = (currIndex % BOARD_SIZE);
		return col;
	}
	
});		