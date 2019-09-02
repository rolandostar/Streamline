$(function () {
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
  $('#endDate').datetimepicker(options)
  $('#startDate').datetimepicker(options)
})
