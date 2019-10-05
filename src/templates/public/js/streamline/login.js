$('div.alert').on('click', 'button.close', function () {
  $(this).parent().animate({ opacity: 0 }, 300).hide('slow')
})
$('button#login-btn').on('click', function (event) {
  event.preventDefault()
  const data = $('form').serializeArray()
  let payload = {}
  data.forEach(element => { payload[element.name] = element.value })
  $.ajax({
    url: 'login',
    type: 'POST',
    dataType: 'json',
    contentType: 'application/json',
    data: JSON.stringify(payload),
    success: (response, status) => {
      localStorage.setItem('Username', response.username)
      localStorage.setItem('Authorization', response.token)
      location.replace('/')
    },
    error: (response, status) => { $('.alert').css('opacity', 1).slideDown() }
  })
})
