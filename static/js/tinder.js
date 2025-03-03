// Tinder-style swiping functionality
export function initTinder(onFavorite, onDiscard) {
  var tinderContainer = document.querySelector('.tinder');
  var allCards = document.querySelectorAll('.tinder--card');
  var nope = document.getElementById('nope');
  var love = document.getElementById('love');

  function initCards(card, index) {
    var newCards = document.querySelectorAll('.tinder--card:not(.removed)');
    newCards.forEach(function (card, index) {
      card.style.zIndex = allCards.length - index;
      card.style.transform = 'scale(' + (20 - index) / 20 + ') translateY(-' + 30 * index + 'px)';
      card.style.opacity = (10 - index) / 10;
    });
   
    tinderContainer.classList.add('loaded');
  }

  function createButtonListener(love) {
    return function (event) {
      var cards = document.querySelectorAll('.tinder--card:not(.removed)');
      var moveOutWidth = document.body.clientWidth * 1.5;
      if (!cards.length) return false;
      var card = cards[0];
      
      // Get the file ID from the card
      const fileId = card.dataset.fileId;
      
      // Call the appropriate callback
      if (love) {
        onFavorite(fileId);
      } else {
        onDiscard(fileId);
      }
      
      card.classList.add('removed');
      if (love) {
        card.style.transform = 'translate(' + moveOutWidth + 'px, -100px) rotate(-30deg)';
      } else {
        card.style.transform = 'translate(-' + moveOutWidth + 'px, -100px) rotate(30deg)';
      }
      initCards();
      event.preventDefault();
    };
  }

  // Initialize cards
  initCards();

  // Set up Hammer.js for each card
  allCards.forEach(function (el) {
    var hammertime = new Hammer(el);
    hammertime.on('pan', function (event) {
      el.classList.add('moving');
    });
    
    hammertime.on('pan', function (event) {
      if (event.deltaX === 0) return;
      if (event.center.x === 0 && event.center.y === 0) return;
      tinderContainer.classList.toggle('tinder_love', event.deltaX > 0);
      tinderContainer.classList.toggle('tinder_nope', event.deltaX < 0);
      var xMulti = event.deltaX * 0.03;
      var yMulti = event.deltaY / 80;
      var rotate = xMulti * yMulti;
      event.target.style.transform = 'translate(' + event.deltaX + 'px, ' + event.deltaY + 'px) rotate(' + rotate + 'deg)';
    });
    
    hammertime.on('panend', function (event) {
      el.classList.remove('moving');
      tinderContainer.classList.remove('tinder_love');
      tinderContainer.classList.remove('tinder_nope');
      var moveOutWidth = document.body.clientWidth;
      var keep = Math.abs(event.deltaX) < 80 || Math.abs(event.velocityX) < 0.5;
      
      // Get the file ID from the card
      const fileId = el.dataset.fileId;
      
      if (!keep) {
        // Determine if it's a like or dislike based on direction
        const isLike = event.deltaX > 0;
        
        // Call the appropriate callback
        if (isLike) {
          onFavorite(fileId);
        } else {
          onDiscard(fileId);
        }
      }
      
      event.target.classList.toggle('removed', !keep);
      if (keep) {
        event.target.style.transform = '';
      } else {
        var endX = Math.max(Math.abs(event.velocityX) * moveOutWidth, moveOutWidth);
        var toX = event.deltaX > 0 ? endX : -endX;
        var endY = Math.abs(event.velocityY) * moveOutWidth;
        var toY = event.deltaY > 0 ? endY : -endY;
        var xMulti = event.deltaX * 0.03;
        var yMulti = event.deltaY / 80;
        var rotate = xMulti * yMulti;
        event.target.style.transform = 'translate(' + toX + 'px, ' + (toY + event.deltaY) + 'px) rotate(' + rotate + 'deg)';
        initCards();
      }
    });
  });

  // Set up button listeners
  var nopeListener = createButtonListener(false);
  var loveListener = createButtonListener(true);
  
  if (nope) nope.addEventListener('click', nopeListener);
  if (love) love.addEventListener('click', loveListener);
  
  return {
    refresh: function(newCards) {
      // Remove existing cards
      const cardsContainer = document.querySelector('.tinder--cards');
      if (!cardsContainer) return;
      
      cardsContainer.innerHTML = '';
      
      // Add new cards
      newCards.forEach(file => {
        const card = document.createElement('div');
        card.classList.add('tinder--card');
        card.dataset.fileId = file.id;
        
        const img = document.createElement('img');
        img.src = file.data_url || `/api/images/${file.image_id}`;
        img.alt = 'Photo';
        
        card.appendChild(img);
        cardsContainer.appendChild(card);
      });
      
      // Reinitialize
      allCards = document.querySelectorAll('.tinder--card');
      initCards();
      
      // Reattach listeners
      allCards.forEach(function (el) {
        var hammertime = new Hammer(el);
        hammertime.on('pan', function (event) {
          el.classList.add('moving');
        });
        
        hammertime.on('pan', function (event) {
          if (event.deltaX === 0) return;
          if (event.center.x === 0 && event.center.y === 0) return;
          tinderContainer.classList.toggle('tinder_love', event.deltaX > 0);
          tinderContainer.classList.toggle('tinder_nope', event.deltaX < 0);
          var xMulti = event.deltaX * 0.03;
          var yMulti = event.deltaY / 80;
          var rotate = xMulti * yMulti;
          event.target.style.transform = 'translate(' + event.deltaX + 'px, ' + event.deltaY + 'px) rotate(' + rotate + 'deg)';
        });
        
        hammertime.on('panend', function (event) {
          el.classList.remove('moving');
          tinderContainer.classList.remove('tinder_love');
          tinderContainer.classList.remove('tinder_nope');
          var moveOutWidth = document.body.clientWidth;
          var keep = Math.abs(event.deltaX) < 80 || Math.abs(event.velocityX) < 0.5;
          
          // Get the file ID from the card
          const fileId = el.dataset.fileId;
          
          if (!keep) {
            // Determine if it's a like or dislike based on direction
            const isLike = event.deltaX > 0;
            
            // Call the appropriate callback
            if (isLike) {
              onFavorite(fileId);
            } else {
              onDiscard(fileId);
            }
          }
          
          event.target.classList.toggle('removed', !keep);
          if (keep) {
            event.target.style.transform = '';
          } else {
            var endX = Math.max(Math.abs(event.velocityX) * moveOutWidth, moveOutWidth);
            var toX = event.deltaX > 0 ? endX : -endX;
            var endY = Math.abs(event.velocityY) * moveOutWidth;
            var toY = event.deltaY > 0 ? endY : -endY;
            var xMulti = event.deltaX * 0.03;
            var yMulti = event.deltaY / 80;
            var rotate = xMulti * yMulti;
            event.target.style.transform = 'translate(' + toX + 'px, ' + (toY + event.deltaY) + 'px) rotate(' + rotate + 'deg)';
            initCards();
          }
        });
      });
    }
  };
}