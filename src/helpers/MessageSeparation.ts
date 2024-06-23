export function messageSplit(message :string, parts: number) {
  const length = Math.ceil(message.length / parts)
  const pattern = new RegExp(".{1," + length + "}", "ig");
  const result =  message.match(pattern)
  return result
}

