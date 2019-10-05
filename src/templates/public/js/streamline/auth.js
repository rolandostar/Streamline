if (!localStorage.getItem('Authorization')) location.replace('/login')
else { renewToken() }

function renewToken() {
  $.ajax({
    url: 'renew',
    type: 'PUT',
    beforeSend: function (request) {
      request.setRequestHeader('Authorization', 'Bearer ' + localStorage.getItem('Authorization'))
    },
    success: (response, status) => {
      localStorage.setItem('Authorization', response.token)
    },
    error: (response, status) => {
      if (response.responseJSON.statusCode === 401) {
        localStorage.removeItem('Authorization')
        location.replace('/login')
      }
    }
  })
}

function errGuard(response, status) {
  if (response.responseJSON.statusCode === 401) {
    localStorage.removeItem('Authorization')
    location.replace('/login')
  }
}