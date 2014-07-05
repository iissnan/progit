// Sauce: https://github.com/mdo/github-buttons/blob/master/github-btn.html

var head = document.getElementsByTagName('head')[0]

var counterMap = {
  watch: 'watchers',
  fork: 'forks',
  follow: 'followers'
}

module.exports = setButton

;(setButton.all = function () {
  var buttons = document.querySelectorAll('.github-btn')
  var button
  for (var i = 0, l = buttons.length; i < l; i++)
    if (!(button = buttons[i]).getAttribute('data-processed'))
      setButton(button)
})()

function setButton(el) {
  var user = el.getAttribute('data-user')
  var repo = el.getAttribute('data-repo')
  var type = el.getAttribute('data-type') || 'watch'
  var count = el.getAttribute('data-count')
  var size = el.getAttribute('data-size')

  if (!user)
    throw new Error('User not set!')

  var btn = createButton()

  // Set href to be URL for repo
  btn.button.href = 'https://github.com/' + user + '/' + repo + '/'

  // Add the class, change the text label, set count link href
  if (type === 'watch') {
    btn.main.className += ' github-watchers'
    btn.text.innerHTML = 'Star'
    btn.counter.href = 'https://github.com/' + user + '/' + repo + '/stargazers'
  } else if (type === 'fork') {
    btn.main.className += ' github-forks'
    btn.text.innerHTML = 'Fork'
    btn.counter.href = 'https://github.com/' + user + '/' + repo + '/network'
  } else if (type === 'follow') {
    btn.main.className += ' github-me'
    btn.text.innerHTML = 'Follow @' + user
    btn.button.href = 'https://github.com/' + user
    btn.counter.href = 'https://github.com/' + user + '/followers'
  } else {
    throw new Error('Invalid type.')
  }

  // Change the size
  if (size === 'large')
    btn.main.className += ' github-btn-large'

  var id = 'callback_' + Math.random().toString(36).substr(2,16)
  window[id] = callback

  if (type == 'follow')
    jsonp('https://api.github.com/users/' + user, id)
  else
    jsonp('https://api.github.com/repos/' + user + '/' + repo, id)

  function callback(obj) {
    btn.counter.innerHTML = addCommas(obj.data[counterMap[type]] || 0)

    if (count)
      btn.counter.style.display = 'block'

    el.parentNode.replaceChild(btn.main, el)

    delete window[id]
  }
}

function createButton() {
  var main = document.createElement('span')
  main.className = 'github-btn'
  main.setAttribute('data-processed', '1')

  var button = document.createElement('a')
  button.className = 'gh-btn'

  var text = document.createElement('span')
  text.className = 'gh-text'

  var icon = document.createElement('span')
  icon.className = 'gh-ico'

  var counter = document.createElement('a')
  counter.className = 'gh-count'

  button.href = counter.href = '#'
  button.target = counter.target = '_blank'

  main.appendChild(button)
  button.appendChild(icon)
  button.appendChild(text)
  main.appendChild(counter)

  return {
    main: main,
    button: button,
    text: text,
    icon: icon,
    counter: counter
  }
}

function addCommas(n) {
  return String(n).replace(/(\d)(?=(\d{3})+$)/g, '$1,')
}

function jsonp(path, callback) {
  var el = document.createElement('script')
  el.src = path + '?callback=' + callback
  head.insertBefore(el, head.firstChild)
}