const usr = localStorage.getItem('Username')
if (usr.length > 0) $('#username-input').attr('placeholder', usr)

$('div.alert').on('click', 'button.close', function () {
  $(this).parent().animate({ opacity: 0 }, 300).hide('slow')
})

$('#username-change').on('submit', function (event) {
  event.preventDefault()
  const data = $('#username-change').serializeArray()
  let payload = {}
  data.forEach(element => { payload[element.name] = element.value })
  renewToken()
  $.ajax({
    url: 'user',
    type: 'PUT',
    beforeSend: function (request) {
      request.setRequestHeader('Authorization', 'Bearer ' + localStorage.getItem('Authorization'))
    },
    dataType: 'json',
    contentType: 'application/json',
    data: JSON.stringify(payload),
    success: (response, status) => {
      $('#success-alert').slideDown()
      setTimeout(() => { location.replace('/login') }, 3000)
    },
    error: (response, status) => {
      if (response.responseJSON.statusCode === 401) {
        localStorage.removeItem('Authorization')
        location.replace('/login')
      } else {
        $('#username-err-text').text(response.responseJSON.message)
        $('#username-err').css('opacity', 1).slideDown()
      }
    }
  })
})

$('#password-change').on('submit', function (event) {
  event.preventDefault()
  const data = $('#password-change').serializeArray()
  let password = {
    old: data[0].value,
    new: data[1].value
  }
  if (data[1].value !== data[2].value) {
    $('#password-err-text').text('Contraseña Nueva y Confirmacion no coinciden.')
    $('#password-err').css('opacity', 1).slideDown()
  } else {
    renewToken()
    $.ajax({
      url: 'user',
      type: 'PUT',
      beforeSend: function (request) {
        request.setRequestHeader('Authorization', 'Bearer ' + localStorage.getItem('Authorization'))
      },
      dataType: 'json',
      contentType: 'application/json',
      data: JSON.stringify({ password }),
      success: (response, status) => {
        $('#success-alert').slideDown()
        setTimeout(() => { location.replace('/login') }, 3000)
      },
      error: (response, status) => {
        if (response.responseJSON.statusCode === 401) {
          localStorage.removeItem('Authorization')
          location.replace('/login')
        } else {
          $('#password-err-text').text(response.responseJSON.message)
          $('#password-err').css('opacity', 1).slideDown()
        }
      }
    })
  }
})
