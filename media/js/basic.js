$(function () {
	var homepage = '.',
		$views = $('#views .view'),
		$window = $(window),
		$liveButtons = $('.live-buttons'),
		$buttons = $('.button'),
		currentView = '',
		$loginView = $('#login'),
		$loginForm = $loginView.find('form'),
		userData,
		quizData,
		correctOptionIndex,
		correctIndex,
		$userInfo = $('#user-info'),
		$syncElements = $('#sync'),
		$quizElements = $('#quiz');

	function getDynamicElements($parent) {
		var elements = {};
		$parent.find('.dynamic').each(function(){
			var $this = $(this);
			elements[$this.data('dynamic')] = $this;
		});
		return elements;
	}
	$userInfo = getDynamicElements($userInfo);
	$syncElements = getDynamicElements($syncElements);
	$quizElements = getDynamicElements($quizElements);
	function getStorage(name) {
		try {
			var data = JSON.parse(localStorage[name]);
			return data?data:[];
		} catch (e) {
			return [];
		}
	}
	function setStorage(name,content) {
		try {
			if (content) {
				localStorage[name] = JSON.stringify(content);
			} else {
				localStorage.removeItem(name);
			}
			return true;
		} catch (e) {
			return false;
		}
	}
	$loginForm.submit(function(event){
		event.preventDefault();
		if (!$loginForm.hasClass('loading')) {
			$loginForm.addClass('loading');
			$.post( homepage+'/index.html', $loginForm.serializeArray(),function(data) {
				userData = {
					'id': 17,
					'name': 'Bořek Stavitel',
					'right': 0,
					'wrong': 0,
					'right_cache': {},
					'wrong_cache': {}
				};
				setStorage('user',userData);
				action('sync');
			})
			.fail(function() {
				alert('Spojení selhalo.');
			})
			.always(function() {
				$loginForm.removeClass('loading');
			});
		}
	});
	function setImage(id) {
		$quizElements.image.html('<img src="http://lorempixel.com/400/400/cats/'+id+'/">');
	}

	$liveButtons.on('click','.button',function(){
		buttonPress($(this));
	});
	$buttons.on('click',function(){
		buttonPress($(this));
	});
	function buttonPress($this) {
		if (!$this.hasClass('blocked')) {
			var actions = $this.data('action').split(';');
			$.each(actions,function(key,val){
				var data = val.split('-');
				action(data[0],data[1]);
			});
		}
	}
	function shuffleArray(o){
		for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
		return o;
	};
	function action(name,param,param2) {
		switch (name) {
			case 'view':
				$views.each(function(){
					var $this = $(this);
					$this.toggleClass('show',$this.data('name') === param);
				});
				if (param === 'login') {
					$loginForm.removeClass('loading');
				} else if (param === 'info') {
					$userInfo.name.text(userData.name);
					$userInfo.accuracy.text(Math.ceil(100*userData.right/(userData.right+userData.wrong))+'%');
				} else if (param === 'quiz') {
					if (quizData.length === 0) {
						action('view','info');
						alert('Nebyly nalezeny žádná data pro trénink.');
					} else {
						//$quizElements.back.addClass('blocked');
						var probability = Math.random();
						correctIndex = false;
						$.each(quizData,function(key,val){
							if (probability < val.probability) {
								correctIndex = key;
								return false;
							}
						});
						if (correctIndex === false) {
							action('view','info');
							alert('Došlo k chybě.');
						} else {
							for (var i=1;i<=4;i++) {
								$quizElements['option'+i].toggleClass('hide',i > quizData.length);
							}
							var count = (quizData.length < 4)?quizData.length:4;
							var usedKeys = [correctIndex];
							while (usedKeys.length < count) {
								var rand = Math.floor(Math.random()*quizData.length);
								if (usedKeys.indexOf(rand) === -1) {
									usedKeys.push(rand);
								}
							}
							shuffleArray(usedKeys);
							for (var i=1;i<=count;i++) {
								var ii = usedKeys.pop();
								$quizElements['option'+i].text(quizData[ii].name);
								if (correctIndex === ii) {
									correctOptionIndex = i;
								}
							}
							setImage(quizData[correctIndex].id);
						}
					}
				}
				currentView = param;
				break;
			case 'quiz':
				var status;
				if (param == correctOptionIndex) {
					status = 'right';
				} else {
					status = 'wrong';
					alert('Špatné odpověď.\nSprávná odpověď je: "'+$quizElements['option'+correctOptionIndex].text()+'".');
				}
				userData[status]++;
				if (userData[status+'_cache'][quizData[correctIndex].id]) {
					userData[status+'_cache'][quizData[correctIndex].id]++;
				} else {
					userData[status+'_cache'][quizData[correctIndex].id] = 1;
				}
				setStorage('user',userData);
				action('view','quiz');
				break;
			case 'login':
				$loginForm.submit();
				break;
			case 'logout':
				if (confirm('Určitě se chcete odhlásit?')) {
					setStorage('user');
					action('view','login');
				}
				break;
			case 'sync':
				action('view','sync');
				$syncElements.back.addClass('blocked');
				//temp start
				$syncElements.bar.css('width','0%');
				$syncElements.bar.data('x',0);
				$syncElements.message.text('Probíhá synchronizace.');
				for (var i=1;i<=10;i++) {
					setTimeout(function(){
						$syncElements.bar.data('x',10+$syncElements.bar.data('x'));
						$syncElements.bar.css('width',($syncElements.bar.data('x')+'%'));
					},100+i*100);
				}
				setTimeout(function(){
					$syncElements.back.removeClass('blocked');
					$syncElements.message.text('Synchronizace byla dokončena.');
					quizData = getStorage('quiz');
				},1200);
				//temp end
				break;
			default:
				alert(name + ' - ' + param);
		}
	}
	userData = getStorage('user');
	quizData = getStorage('quiz');
	//temp start
	quizData = [
		{
			'id': 1,
			'name': 'koule',
			'probability': 0.1
		},
		{
			'id': 2,
			'name': 'Mirek',
			'probability': 0.3
		},
		{
			'id': 3,
			'name': 'Zbytek',
			'probability': 1
		}
	];
	//temp end
	action('view',userData.name?'info':'login');
});
