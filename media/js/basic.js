$(function () {
	
	$(document).keyup(function(e) {
		 if (e.keyCode === 37) { // left
			//console.log(JSON.stringify(userData));
		}
	});
	var homepage = 'http://127.0.0.1',
		$views = $('#views .view'),
		$window = $(window),
		$body = $('body'),
		$liveButtons = $('.live-buttons'),
		$buttons = $('.button'),
		currentView = '',
		$loginView = $('#login'),
		$loginForm = $loginView.find('form'),
		userData,
		quizData,
		correctOptionIndex,
		correctIndex,
		quizLastIndex = false,
		quizLastIndexNoRepeat = -1,
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
			$.post( homepage+'/player/login/', $loginForm.serializeArray(),function(data) {
				try {
                    data = $.parseJSON(data);
                    userData = {
						'id': data.id,
						'name': data.name,
						'userkey': data.userkey,
						'right': parseInt(data.right_answers),
						'wrong': parseInt(data.wrong_answers),
						'right_cache': {},
						'wrong_cache': {}
					};
					setStorage('user',userData);
					action('sync');
                } catch (e) {
                    alert('Při přihlašování došlo k chybě na straně serveru.');
                }
			})
			.fail(function(jqxhr, textStatus, error) {
				var msg = '';
                try {
                    data = $.parseJSON(jqxhr.responseText);
                    msg = data.error;
                } catch (e) {
                    msg = 'Spojení selhalo.';
                }
                alert(msg);
			})
			.always(function() {
				$loginForm.removeClass('loading');
			});
		}
	});
	function setImage(filename) {
		$quizElements.image.html('<img src="'+getFileURL(filename)+'">');
	}
	function getFileURL(filename) {
		return 'http://localhost/uploads/'+filename;
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
	function getRandomImageIndex() {
		var answer = false;
		for (var i=0;i<10;i++) {
			var probability = Math.random();
			$.each(quizData,function(key,val){
				if (probability < val.probability) {
					answer = key;
					return false;
				}
			});
			if (answer !== quizLastIndexNoRepeat) {
				break;
			}
		}
		quizLastIndexNoRepeat = quizData.length>1?answer:-1;
		return answer;
	}
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
					if (getStorage('sync-needed') === true) {
						action('sync');
					}
					$userInfo.name.text(userData.name);
					if (userData.right+userData.wrong !== 0) {
						$userInfo.accuracy.text(Math.ceil(100*userData.right/(userData.right+userData.wrong)));
					}
				} else if (param === 'quiz') {
					if (quizData.length === 0) {
						action('view','info');
						alert('Nebyly nalezeny žádná data pro trénink.');
					} else {
						if (quizLastIndex === false) {
							correctIndex = getRandomImageIndex();
							quizLastIndex = correctIndex;
							if (correctIndex === false) {
								action('view','info');
								alert('Došlo k chybě.');
							} else {
								for (var i=1;i<=4;i++) {
									$quizElements['option'+i].toggleClass('hide',i > quizData.length).removeClass('blocked');
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
								setImage(quizData[correctIndex].filename);
							}
						}
					}
				}
				currentView = param;
				break;
			case 'quiz':
				var status;
				quizLastIndex = false;
				if (param == correctOptionIndex) {
					status = 'right';
				} else {
					status = 'wrong';
				}
				$body.addClass(status+'_answer');
				setTimeout(function(){
					$body.removeClass('wrong_answer right_answer');
				},400);
				userData[status]++;
				if (userData[status+'_cache'][quizData[correctIndex].id]) {
					userData[status+'_cache'][quizData[correctIndex].id]++;
				} else {
					userData[status+'_cache'][quizData[correctIndex].id] = 1;
				}
				if (status === 'wrong') {
					$quizElements['option'+param].addClass('blocked');
				} else {
					action('view','quiz');
				}
				setStorage('user',userData);
				break;
			case 'login':
				$loginForm.submit();
				break;
			case 'reload':
				location.reload();
				break;
			case 'logout':
				if (confirm('Určitě se chcete odhlásit?\nPřed odhlášením prosím proveďte synchronizaci.')) {
					localStorage.clear();
					action('reload');
				}
				break;
			case 'sync':
				action('view','sync');
				quizLastIndex = false;
				$syncElements.back.addClass('blocked');
				$syncElements.bar.css('width','0%');
				$syncElements.bar.removeClass('done fail');
				$syncElements.message.text('Probíhá synchronizace.');
				syncStep(1);
				break;
			default:
				alert(name + ' - ' + param);
		}
	}
	function syncError(e) {
		if (typeof e === 'string' || e instanceof String) {
			$syncElements.message.text(e);
		} else {
			$syncElements.message.text('Došlo k chybě.');
		}
		$syncElements.bar.addClass('fail');
		$syncElements.repeat.removeClass('hide');
		$syncElements.logout.removeClass('hide');
	}
	function visualizeSyncStep(step) {
		$syncElements.bar.css('width',(step*10)+'%');
	}
	var currentStep = 0;
	function syncStep(step) {
		setStorage('sync-needed',true);
		currentStep = step;
		visualizeSyncStep(currentStep-1);
		var upload_data = userData;
		if (step === 1) {
			setTimeout(function(){
				syncStep(currentStep+1);
			},100);
		} else if (step === 2) {
			$.post( homepage+'/player/check_access/', upload_data,function(data) {
				try {
                    syncStep(step+1);
                } catch (e) {
                	syncError(e);
                }
			})
			.fail(function(jqxhr, textStatus, error) {
				syncError('Uživateli byl odebrán přístup nebo došlo ke změně přihlašovacího klíče.');
			});
		} else if (step === 3) {
			$.post( homepage+'/player/upload/', upload_data,function(data) {
				try {
                    data = $.parseJSON(data);
                    userData.right_cache = {};
                    userData.wrong_cache = {};
                    setStorage('user',userData);
                    syncStep(step+1);
                } catch (e) {
                	syncError(e);
                }
			})
			.fail(function(jqxhr, textStatus, error) {
				syncError('Při nahrávání údajů o uživateli došlo k chybě.');
			});
		} else if (step === 4) {
			//build strategies structure
			$.post( homepage+'/player/structure/', upload_data,function(data) {
				try {
                    data = $.parseJSON(data);
                    quizData = [];
                    for (var i=0;i<data.strategies.length;++i) {
                    	quizData.push(data.strategies[i]);
                    }
                    setStorage('quiz',quizData);
                    syncStep(step+1);
                } catch (e) {
                	syncError(e);
                }
			})
			.fail(function(jqxhr, textStatus, error) {
				syncError('Při stahování struktury došlo k chybě.');
			});
		} else if (step === 5) {
			//download strategies structure
			//todo
			//syncError('Při stahování obrázků strategií došlo k chybě.');
			syncStep(step+1);
		} else {
			visualizeSyncStep(10);
			setStorage('sync-needed');
			$syncElements.bar.addClass('done');
			$syncElements.message.text('Synchronizace byla dokončena.');
			$syncElements.back.removeClass('blocked');
		}
		/*try {
		} catch (e) {
			syncError(e);
		}*/
	}
	userData = getStorage('user');
	quizData = getStorage('quiz');
	if (userData.name) {
		action('view','info');
	} else {
		action('view','login');
	}
});
