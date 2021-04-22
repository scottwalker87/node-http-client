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

// Типы содержимого
const CONTENT_TYPE_JSON = "application/json"
const CONTENT_TYPE_FORM = "application/x-www-form-urlencoded"

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
      return key.toLowerCase() === HEADER_KEY_CONTENT_TYPE && value.includes(CONTENT_TYPE_JSON)
    })
  }

  /**
   * Проверить заголовки на параметр Content-Type: application/x-www-form-urlencoded
   * @param {Object} headers заголовки 
   * @return {Boolean}
   */
  isFormContent(headers) {
    return Object.entries(headers).some(([key, value]) => {
      return key.toLowerCase() === HEADER_KEY_CONTENT_TYPE && value.includes(CONTENT_TYPE_FORM)
    })
  }

  /**
   * Нормализовать URL
   * @param {URL} urlOptions 
   * @param {Object} query 
   * @return {String}
   */
  normalizeUrl(url, query) {
    query = this.normalizeQuery({ ...this.extractQuery(url), ...query })
    
    url = url.includes("?") ? url.substr(0, url.indexOf("?")) : url
    url = url.startsWith("/") ? url.substr(1) : url
    url = this.baseUrl + "/" + url + query

    return url
  }

  /**
   * Извлечь GET параметры из URL
   * @param {String} url 
   * @return {Object}
   */
  extractQuery(url) {
    if (url.includes("?")) {
      const query = url.substr(url.indexOf("?") + 1)

      return qs.decode(query)
    }

    return {}
  }

  /**
   * Нормализовать GET параметры запроса
   * @param {Object} query 
   * @return {String}
   */
  normalizeQuery(query) {
    query = { ...query }

    for (const key in query) {
      if (query[key] === null || query[key] === undefined) {
        delete query[key]
      }
    }

    if (Object.keys(query).length) {
      return "?" + qs.encode(query)
    }

    return ""
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
      const urlOptions = new URL(this.normalizeUrl(url, query))      
      // Определить драйвер клиента создающего запрос
      const driver = urlOptions.protocol === HTTPS_PROTOCOL ? https : http
      // Сформировать опции запроса
      const options = {
        method,
        headers: { ...this.headers, ...headers },
        protocol: urlOptions.protocol,
        hostname: urlOptions.hostname,
        port: urlOptions.port,
        path: urlOptions.pathname + urlOptions.search,
      }
      
      // Создать запрос
      const request = driver.request(options, response => {
        let body = ""

        // Слушать событие передачи тела запроса
        response.on('data', chunk => { body += chunk })
    
        // Слушать событие завершения запроса
        response.on('close', () => {
          const headers = response.headers || {}

          // Проверить тип контента на JSON
          const isJsonBody = this.isJsonContent(headers)

          try {
            // Форматировать тело ответа в JSON (если пришел соответствующий заголовок)
            body = isJsonBody ? JSON.parse(body) : body
          } finally {
            resolve({ body, headers, response })
          }
        })
      })

      // Слушать событие ошибки запроса
      request.on("error", reject)

      // Отправить тело запроса
      if (typeof data !== "undefined") {
        // Если это отправка формы
        if (this.isFormContent(options.headers)) {
          data = qs.stringify(data)
        } 

        // Если это отправка JSON тела
        else if (this.isJsonContent(options.headers)) {
          data = JSON.stringify(data)
        }
        
        // Включить тело в запрос
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
  get(url, params) {
    params = params || {}

    const query = params.query || {}
    const headers = params.headers || {}

    return this.request({ method: METHOD_GET, url, query, headers })
  }

  /**
   * Создать POST запрос
   * @param {String} url 
   * @param {Object} data 
   * @param {Object} params 
   * @return {Promise<{ body, response }>}
   */
  post(url, data, params) {
    params = params || {}

    const query = params.query || {}
    const headers = params.headers || {}

    return this.request({ method: METHOD_POST, url, query, data, headers })
  }
  
  /**
   * Создать PUT запрос
   * @param {String} url 
   * @param {Object} data 
   * @param {Object} params 
   * @return {Promise<{ body, response }>}
   */
  put(url, data, params) {
    params = params || {}

    const query = params.query || {}
    const headers = params.headers || {}

    return this.request({ method: METHOD_PUT, url, query, data, headers })
  }

  /**
   * Создать DELETE запрос
   * @param {String} url 
   * @param {Object} data 
   * @param {Object} params 
   * @return {Promise<{ body, response }>}
   */
  delete(url, data, params) {
    params = params || {}

    const query = params.query || {}
    const headers = params.headers || {}

    return this.request({ method: METHOD_DELETE, url, query, data, headers })
  }

  /**
   * Создать HEAD запрос
   * @param {String} url 
   * @param {Object} params 
   * @return {Promise<{ body, response }>}
   */
  head(url, params) {
    params = params || {}

    const query = params.query || {}
    const headers = params.headers || {}

    return this.request({ method: METHOD_HEAD, url, query, headers })
  }
}

// Пресеты заголовков запроса
const presetHeaders = {
  json: {
    'Accept': CONTENT_TYPE_JSON,
    "Content-Type": `${CONTENT_TYPE_JSON}; charset=UTF-8`
  },
  form: {
    "Content-Type": `${CONTENT_TYPE_FORM}; charset=UTF-8`
  }
}

module.exports = { 
  HttpClient, 
  METHOD_GET, 
  METHOD_POST, 
  METHOD_PUT, 
  METHOD_DELETE, 
  METHOD_HEAD,
  CONTENT_TYPE_JSON,
  CONTENT_TYPE_FORM,
  presetHeaders
}
