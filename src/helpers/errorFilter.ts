

const  errorCodes: Record<string, number[]> = {
 'critical': [500, 400],
 'temporary': [429]
}

const  errorTime: Record<string, number> = {
  'critical': 6,
  "temporary": 1, 
  "default": 1
}


export function errorFilter(error: string) {
  const  match = error.match(/error: (\d+)/)
  if(!match) return errorTime.default;

  const  code = parseInt(match[1])
  console.log(code)
  const  category = Object.keys(errorCodes).find(key => errorCodes[key].includes(code))
  return category ?  errorTime[category] : errorTime.default
}
