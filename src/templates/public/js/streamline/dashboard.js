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
$('#endDate').datetimepicker(options)
$('#startDate').datetimepicker(options)

$('#addRecordingTask-button').on('click', function (event) {
  event.preventDefault()
  const data = $('form').serializeArray()
  let payload = {}
  data.forEach(element => { payload[element.name] = element.value })
  console.log(payload)
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
      localStorage.setItem('Authorization', response.token)
      location.replace('/')
    },
    error: (response, status) => {
      if (response.responseJSON.statusCode === 401) {
        localStorage.removeItem('Authorization')
        location.replace('/login')
      }
    }
  })
})

$(document).ready(() => {
  console.log('sup')
  $.ajax({
    url: 'recording/',
    type: 'GET',
    beforeSend: function (request) {
      request.setRequestHeader('Authorization', 'Bearer ' + localStorage.getItem('Authorization'))
    },
    success: (response, status) => {
      response.forEach(recording => {
        console.log(recording)
        // eslint-disable-next-line no-multi-str
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
    error: (response, status) => {
      if (response.responseJSON.statusCode === 401) {
        localStorage.removeItem('Authorization')
        location.replace('/login')
      }
    }
  })
})
