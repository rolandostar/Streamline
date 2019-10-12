/* eslint-disable no-undef */
let options = {
  format: 'Y-MM-DD HH:mm:ss',
  locale: moment.locale('es'),
  icons: {
    time: 'fa fa-clock',
    clear: 'fa fa-trash'
  },
  tooltips: {
    today: 'Hoy',
    clear: 'Eliminar',
    close: 'Cerrar',
    selectMonth: 'Elegir mes',
    prevMonth: 'Anterior mes',
    nextMonth: 'Siguiente mes',
    selectYear: 'Elegir año',
    prevYear: 'Año anterior',
    nextYear: 'Año siguiente',
    selectDecade: 'Elegir decada',
    prevDecade: 'Anterior decada',
    nextDecade: 'Siguiente decada',
    prevCentury: 'Anterior siglo',
    nextCentury: 'Siguiente siglo',
    pickHour: 'Elegir hora',
    incrementHour: 'Incrementar hora',
    decrementHour: 'Reducir hora',
    pickMinute: 'Elegir minuto',
    incrementMinute: 'Incrementar minuto',
    decrementMinute: 'Reducir minuto',
    pickSecond: 'Elegir segundo',
    incrementSecond: 'Incrementar segundo',
    decrementSecond: 'Reducir segundo',
    togglePeriod: 'Cambiar periodo',
    selectTime: 'Elegir hora'
  }
}
$('#acc').on('click', function (event) {
  event.preventDefault()
  $('.dashboard, .footer, .fab').fadeOut('fast', function () {
    location.replace('/account')
  })
})
var timeout = null
$('#search-text').on('search', function (e) {
  $('.search-container').slideUp()
})
$('#search-text').keyup(function (e) {
  $('#search-results').slideUp('fast', () => {
    $('#search-spinner').slideDown()
  })
  $('.search-container').slideDown()
  clearTimeout(timeout)
  timeout = setTimeout(function () {
    const value = $('#search-text').val()
    if (value.length === 0) {
      $('.search-container').slideUp()
    } else {
      $('#search-results').empty()
      renewToken()
      $.ajax({
        url: 'recording/search?query=' + value,
        type: 'GET',
        beforeSend: function (request) {
          request.setRequestHeader('Authorization', 'Bearer ' + localStorage.getItem('Authorization'))
        },
        success: (response, status) => {
          if (response.length === 0) {
            $('#search-spinner').slideUp('fast', () => {
              $('#search-results').removeClass('grid').css('text-align', 'center').append(`<p>No se han encontrado resultados</p>`).slideDown('fast')
            })
          } else {
            $('#search-results').addClass('grid').css('text-align', 'none')
            response.forEach(recording => {
              $('#search-results').append(`
            <a class="thumbnail" href="1">
              <img src="https://dummyimage.com/290x160/ccc/000.png" class="img-responsive">
              <div class="thumbnail-title">\
                  <h4>${recording.title}</h4>
                  <p>${recording.status}</p>
              </div>
            </a>`)
            })
            $('#search-spinner').slideUp('fast', () => {
              $('#search-results').slideDown()
            })
          }
          $('.search-container').slideDown()
        },
        error: errGuard
      })
    }
    console.log('Input Value:', $('#search-text').val())
  }, 500)
})
$('#endDate').datetimepicker(options)
$('#startDate').datetimepicker(options)
$('div.alert').on('click', 'button.close', function () {
  $(this).parent().animate({ opacity: 0 }, 300).hide('slow')
})
$('#new-recording-job').on('submit', function (event) {
  event.preventDefault()
  const data = $('#new-recording-job').serializeArray()
  let payload = {}
  data.forEach(element => { payload[element.name] = element.value })
  renewToken()
  $.ajax({
    url: 'task',
    type: 'POST',
    beforeSend: function (request) {
      request.setRequestHeader('Authorization', 'Bearer ' + localStorage.getItem('Authorization'))
    },
    dataType: 'json',
    contentType: 'application/json',
    data: JSON.stringify(payload),
    success: (response, status) => {
      location.reload()
    },
    error: (response, status) => {
      if (response.responseJSON.statusCode === 401) {
        localStorage.removeItem('Authorization')
        location.replace('/login')
      } else {
        $('#err-text').text(response.responseJSON.message)
        $('.alert').css('opacity', 1).slideDown()
      }
    }
  })
})

$(document).ready(() => {
  $.ajax({
    url: 'recording',
    type: 'GET',
    beforeSend: function (request) {
      request.setRequestHeader('Authorization', 'Bearer ' + localStorage.getItem('Authorization'))
    },
    success: (response, status) => {
      const isEmpty = response.length === 0
      if (isEmpty) {
        $('.dashboard').empty()
        $('.dashboard').prepend(`
        <div class="row justify-content-center my-2">
          <div class="col-md-4">
            <img class="img-fluid no-video" src="img/no-videos.png">
          </div>
          <div class="col-md-4">
            <h1 class="my-5">Ningun video encontrado</h1>
            <h5>Crea una nueva tarea de grabacion dando clic en el boton "+"</h5>
          </div>
        </div>
        `)
        $('.fab').css('right', 'calc( 50% - 40px )')
      } else {
        response.forEach(recording => {
          $('#all-recordings').append(`
          <a class="thumbnail" href="1">
            <img src="https://dummyimage.com/290x160/ccc/000.png" class="img-responsive">
            <div class="thumbnail-title">\
                <h4>${recording.title}</h4>
                <p>${recording.status}</p>
            </div>
          </a>`)
        })
        $.ajax({
          url: 'recording?limit=4&orderBy=createdAt&order=DESC',
          type: 'GET',
          beforeSend: function (request) {
            request.setRequestHeader('Authorization', 'Bearer ' + localStorage.getItem('Authorization'))
          },
          success: (response, status) => {
            response.forEach(recording => {
              $('#recent-recordings').append(`
            <a class="thumbnail" href="1">
              <img src="https://dummyimage.com/290x160/ccc/000.png" class="img-responsive">
              <div class="thumbnail-title">\
                  <h4>${recording.title}</h4>
                  <p>${recording.status}</p>
              </div>
            </a>`)
            })
          },
          error: errGuard
        })
      }
      $('#main-spinner').fadeOut('fast', function () {
        $('.dashboard').fadeIn()
        $('.fab').css('display', 'flex')
        if (!isEmpty) {
          $('.footer').fadeIn()
          $('#search-text').prop('disabled', false)
          $('#search-btn').prop('disabled', false)
        }
      })
    },
    error: errGuard
  })
})
