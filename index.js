const http = require("http")
const https = require("https")
const qs = require("querystring")
const { URL } = require("url")

// Протоколы запроса
// const HTTP_PROTOCOL = "http:"
const HTTPS_PROTOCOL = "https:"

// Методы запроса
const METHOD_GET = "GET"
const METHOD_POST = "POST"
const METHOD_PUT = "PUT"
const METHOD_DELETE = "DELETE"
const METHOD_HEAD = "HEAD"

// Заголовки запроса
const HEADER_KEY_CONTENT_TYPE = "content-type"

// MIME типы содержимого в теле запроса
const MIME_TYPE_JSON = "application/json"

// Пресеты заголовко запроса
const jsonHeaders = {
  'Accept': MIME_TYPE_JSON,
  "Content-Type": `${MIME_TYPE_JSON}; charset=UTF-8`
}

/**
 * HTTP/HTTPS клиент
 */
class HttpClient {
  /**
   * Инициализировать клиент
   * @param {Object} config конфигурация
   */
  constructor(config) {
    this.config = config || {}
  }

  /**
   * Базовый урл
   * @return {String|null}
   */
  get baseUrl() {
    return this.config.baseUrl || null
  }

  /**
   * Заголовки по умолчанию
   * @return {Object}
   */
  get headers() {
    return this.config.headers || {}
  }

  /**
   * Проверить заголовки на параметр Content-Type: application/json
   * @param {Object} headers заголовки 
   * @return {Boolean}
   */
  isJsonContent(headers) {
    return Object.entries(headers).some(([key, value]) => {
      return key.toLowerCase() === HEADER_KEY_CONTENT_TYPE && value.includes(MIME_TYPE_JSON)
    })
  }

  /**
   * Нормализовать путь в запросе
   * @param {URL} urlOptions 
   * @param {Object} query 
   * @return {String}
   */
  normalizePath(urlOptions, query) {
    // Сформировать объект GET параметров на основе параметров из url и query
    const search = { ...qs.decode(urlOptions.search.replace("?", "")), ...query }
    // Сформировать строку GET параметров
    const queryString = Object.keys(search).length ? "?" + qs.encode(search) :  "" 

    return urlOptions.pathname + queryString
  }

  /**
   * Создать HTTP/HTTPS запрос
   * @param {Object} params параметры запроса
   * @return {Promise<{ body, response }>}
   */
  request({ method, url, query, data, headers }) {
    return new Promise((resolve, reject) => {
      // Нормализовать метод запроса
      method = method ? String(method).toUpperCase() : METHOD_GET
      // Нормализовать заголовки  
      headers = headers || {}
      // Нормализовать GET параметры 
      query = query || {}

      // Парсить опции URL 
      const urlOptions = new URL(url, this.baseUrl)      
      // Определить драйвер клиента создающего запрос
      const driver = urlOptions.protocol === HTTPS_PROTOCOL ? https : http
      // Сформировать опции запроса
      const options = {
        method,
        headers: { ...this.headers, ...headers },
        protocol: urlOptions.protocol,
        hostname: urlOptions.hostname,
        port: urlOptions.port,
        path: this.normalizePath(urlOptions, query),
      }

      // Создать запрос
      const request = driver.request(options, response => {
        let body = ''

        // Слушать событие передачи тела запроса
        response.on('data', chunk => { body += chunk })
    
        // Слушать событие завершения запроса
        response.on('close', () => {
          // Проверить тип контента на JSON
          const isJsonBody = this.isJsonContent(response.headers)

          try {
            // Форматировать тело ответа в JSON (если пришел соответствующий заголовок)
            body = isJsonBody ? JSON.parse(body) : body
          } finally {
            resolve({ body, response })
          }
        })
      })

      // Слушать событие ошибки запроса
      request.on("error", reject)

      // Отправить тело запроса
      if (typeof data !== "undefined") {
        data = JSON.stringify(data)

        request.write(data)
      }

      // Завершить запрос
      request.end()
    }) 
  }

  /**
   * Создать GET запрос
   * @param {String} url 
   * @param {Object} params 
   * @return {Promise<{ body, response }>}
   */
  get(url, { query, headers }) {
    return this.request({ method: METHOD_GET, url, query, headers })
  }

  /**
   * Создать POST запрос
   * @param {String} url 
   * @param {Object} data 
   * @param {Object} params 
   * @return {Promise<{ body, response }>}
   */
  post(url, data, { query, headers }) {
    return this.request({ method: METHOD_POST, url, query, data, headers })
  }
  
  /**
   * Создать PUT запрос
   * @param {String} url 
   * @param {Object} data 
   * @param {Object} params 
   * @return {Promise<{ body, response }>}
   */
  put(url, data, { query, headers }) {
    return this.request({ method: METHOD_PUT, url, query, data, headers })
  }

  /**
   * Создать DELETE запрос
   * @param {String} url 
   * @param {Object} data 
   * @param {Object} params 
   * @return {Promise<{ body, response }>}
   */
  delete(url, data, { query, headers }) {
    return this.request({ method: METHOD_DELETE, url, query, data, headers })
  }

  /**
   * Создать HEAD запрос
   * @param {String} url 
   * @param {Object} params 
   * @return {Promise<{ body, response }>}
   */
  head(url, { query, headers }) {
    return this.request({ method: METHOD_HEAD, url, query, headers })
  }
}

module.exports = { HttpClient, jsonHeaders, METHOD_GET, METHOD_POST, METHOD_PUT, METHOD_DELETE, METHOD_HEAD }
