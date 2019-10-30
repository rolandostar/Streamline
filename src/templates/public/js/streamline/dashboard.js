/* eslint-disable no-undef */
let options = {
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
// TODO: fadeout for streamline logo
$('#acc').on('click', function (event) {
  event.preventDefault()
  $('.dashboard, .footer, .fab').fadeOut('fast', function () {
    location.replace('/account')
  })
})

/* -------------------------------- Datetime -------------------------------- */
$('#startDate').datetimepicker({
  ...options,
  format: 'Y-MM-DD HH:mm:ss',
  showTodayButton: true,
  useCurrent: false,
  widgetPositioning: { vertical: 'top' }
})
$('#duration').datetimepicker({
  ...options,
  format: 'HH:mm:ss',
  // defaultDate: '01/01/1970 00:00:00'
  useCurrent: 'year',
  widgetPositioning: { vertical: 'top' }
})

/* -------------------------- Error Message Dismiss ------------------------- */
$('div.alert').on('click', 'button.close', function () {
  $(this).parent().animate({ opacity: 0 }, 300).hide('slow')
})

/* ---------------------------- New Recording Job --------------------------- */
$('#new-recording-job').on('submit', function (event) {
  event.preventDefault()
  const data = $('#new-recording-job').serializeArray()
  let payload = {}
  data.forEach(element => { payload[element.name] = element.value })
  renewToken()
  $.ajax({
    url: 'job',
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

/* ------------------------------ Event Source ------------------------------ */
const source = new EventSource(`/recording/liveUpdate`)
source.addEventListener('error', function (e) {
  // if (e.eventPhase === EventSource.CLOSED) source.close()
  console.log(e)
}, false)
source.addEventListener('open', function (e) {
  console.log('OPENED')
}, false)

source.addEventListener('message', function (e) {
  let data = JSON.parse(e.data)
  console.log(data)
  switch (data.source) {
    case 'resolver':
      if (data.type === 'start') {
        // transition to resolver, was pending
        elements = $(`[id=${data.target}_link]`)
        elements.each(function (index) {
          $(this).children().eq(1).append(`
          <div class="progress no-margin">
          <div class="progress-bar progress-bar-striped progress-bar-animated" role="progressbar" aria-valuenow="100" aria-valuemin="100" aria-valuemax="100" style="width: 100%"></div>
          `)
        })
        elementsSubtitle = $(`[id=${data.target}_subtitle]`)
        elementsSubtitle.text('Adquiriendo fuente...')
      } else if (data.type === 'done') {
        // transition to downloader, was resolving
        elements = $(`[id=${data.target}_link]`)
        elements.each(function (index) {
          $(this).children().eq(1).children().eq(2).children().replaceWith(`
          <div id="${data.target + '_progress'}" class="progress-bar bg-warning" style="width:0%"></div>
          `)
        })
        elementsSubtitle = $(`[id=${data.target}_subtitle]`)
        elementsSubtitle.text('Descargando: 0%')
      }
      break
    case 'downloader':
      if (data.type === 'progress') {
        elementsSubtitle = $(`[id=${data.target}_subtitle]`)
        elements = $(`[id=${data.target}_progress]`)
        elementsSubtitle.text(`Descargando: ` + data.progress + '%')
        elements.css('width', data.progress + '%')
      } else if (data.type === 'done') {
        // transition to encoder, was downloading
        elements = $(`[id=${data.target}_link]`)
        elements.removeClass('pending')
        elements.attr('href', `/playback?id=${data.user}&title=${data.dirName}`)
        elements.each(function (index) {
          $(this).children().eq(0)
            .attr('src', `/storage/${data.user}/${data.dirName}/thumb.png`)
            .addClass('img-greyscale')
          $(this).children().eq(1).children().eq(1).text('Transcodificando: 360p')
          $(this).children().eq(1).children().eq(2).children()
            .removeClass('bg-warning')
            .addClass('bg-success')
            .css('width', '0%')
        })
      }
      break
    case 'encoder':
      if (data.type === 'progress') {
        elementsSubtitle = $(`[id=${data.target}_subtitle]`)
        elementsSubtitle.text(`Transcodificando: ` + data.quality)
        elements = $(`[id=${data.target}_progress]`)
        elements.css('width', data.progress + '%')
        elements.text(data.progress + '%')
      }
      break
    case 'packager':
      if (data.type === 'done') {
        const downloadedAt = new Date(data.downloadedAt)
        // transition to ready, was encoding
        elements = $(`[id=${data.target}_link]`)
        elements.each(function (index) {
          $(this).children().eq(0)
            .removeClass('img-greyscale')
          $(this).children().eq(1).children().last().remove()
          $(this).children().eq(1).children().last().replaceWith(`
          <small class="text-light">${downloadedAt.toLocaleString('es-MX')}</small>`)
        })
      }
      break
  }
})

/* ----------------- Utility for formatting recording grids ----------------- */
function addRecordingTo (parentElement, recording) {
  let html
  switch (recording.status) {
    case 'PENDING':
      const when = new Date(recording.scheduledFor)
      html = `<a id="${recording.id + '_link'}" class="thumbnail pending">
      <img src="/img/pending.png" class="img-responsive">
      <div class="thumbnail-title">\
        <h4>${recording.title}</h4>
        <p id="${recording.id + '_subtitle'}">${when.toLocaleString('es-MX')}</p>
      </div>`
      break
    case 'RESOLVING':
      html = `<a id="${recording.id + '_link'}" class="thumbnail pending">
        <img src="/img/pending.png" class="img-responsive">
        <div class="thumbnail-title">\
          <h4>${recording.title}</h4>
          <p id="${recording.id + '_subtitle'}">Adquiriendo fuente...</p>
          <div class="progress no-margin">
          <div class="progress-bar progress-bar-striped progress-bar-animated" role="progressbar" aria-valuenow="100" aria-valuemin="100" aria-valuemax="100" style="width: 100%"></div>
        </div>
        </div>
        </a>`
      break
    case 'DOWNLOADING':
      html = `<a id="${recording.id + '_link'}" class="thumbnail pending">
        <img src="/img/pending.png" class="img-responsive">
        <div class="thumbnail-title">\
          <h4>${recording.title}</h4>
          <p id="${recording.id + '_subtitle'}">Descargando: 0%</p>
          <div class="progress no-margin">
          <div id="${recording.id + '_progress'}" class="progress-bar bg-warning"></div>
        </div>
        </div>
        </a>`
      break
    case 'ENCODING':
      html = `<a id="${recording.id + '_link'}" class="thumbnail" href="/playback?id=${recording.user}&title=${recording.dirName}">
      <img src="/storage/${recording.user}/${recording.dirName}/thumb.png" class="img-responsive img-greyscale">
      <div class="thumbnail-title">\
        <h4>${recording.title}</h4>
        <p id="${recording.id + '_subtitle'}">Transcodificando: 360p</p>
        <div class="progress no-margin">
          <div id="${recording.id + '_progress'}" class="progress-bar bg-success">0%</div>
      </div>
      </div>
      </a>`
      break
    case 'READY':
      const downloadedAt = new Date(recording.startDate)
      html = `<a id="${recording.id + '_link'}" class="thumbnail" href="/playback?id=${recording.user}&title=${recording.dirName}">
        <img src="/storage/${recording.user}/${recording.dirName}/thumb.png" class="img-responsive">
        <div class="thumbnail-title">\
          <h4>${recording.title}</h4>
          <small class="text-light">${downloadedAt.toLocaleString('es-MX')}</small>
        </div>
        </div>
        </a>`
      break
    default:
      html = `<a id="${recording.id + '_link'}" class="thumbnail pending">
        <img src="/img/videoError.png" class="img-responsive">
        <div class="thumbnail-title text-center">\
          <p>${recording.title}</p>
          <p>${recording.status}</p>
        </div>`
      break
  }
  parentElement.append(html)
}

/* ----------------------------- Load Recordings ---------------------------- */
var recentRecordings
$.ajax({
  url: 'recording?limit=4&orderBy=createdAt&order=DESC&readyOnly=true',
  type: 'GET',
  beforeSend: function (request) {
    request.setRequestHeader('Authorization', 'Bearer ' + localStorage.getItem('Authorization'))
  },
  success: (response1, status) => {
    recentRecordings = response1
    $.ajax({
      url: 'recording?chronological=true',
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
          $('#main-spinner').fadeOut('fast', function () {
            $('.dashboard').fadeIn()
            $('.fab').css('display', 'flex')
          })
        } else {
          response.forEach(recording => { addRecordingTo($('#all-recordings'), recording) })
          recentRecordings.forEach(recording => { addRecordingTo($('#recent-recordings'), recording) })

          $('#main-spinner').fadeOut('fast', function () {
            $('.dashboard').fadeIn()
            $('.fab').css('display', 'flex')
            $('.footer').fadeIn()
            $('#search-text').prop('disabled', false)
            $('#search-btn').prop('disabled', false)
          })
        }
      },
      error: errGuard
    })
  },
  error: errGuard
})

/* ----------------------------- Search Function ---------------------------- */
var timeout = null
var searchResults = []
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
      /* searchResults.forEach(searchResult => {
        source.removeEventListener(recording.id, updateProgress)
      }) */
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
            searchResults = []
            $('#search-spinner').slideUp('fast', () => {
              $('#search-results').removeClass('grid').css('text-align', 'center').append(`<p>No se han encontrado resultados</p>`).slideDown('fast')
            })
          } else {
            searchResults = response
            $('#search-results').addClass('grid').css('text-align', 'none')
            searchResults.forEach(recording => { addRecordingTo($('#search-results'), recording) })
            $('#search-spinner').slideUp('fast', () => {
              $('#search-results').slideDown()
            })
          }
          $('.search-container').slideDown()
        },
        error: errGuard
      })
    }
  }, 500)
})
