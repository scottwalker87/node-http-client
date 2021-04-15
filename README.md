# Node HTTP client

[![Build Version](https://img.shields.io/github/package-json/v/scottwalker87/node-http-client?style=for-the-badge)](https://github.com/scottwalker87/node-http-client)
[![NPM Package](https://img.shields.io/npm/v/@scottwalker/node-http-client?style=for-the-badge)](https://www.npmjs.com/package/@scottwalker/node-http-client)
[![Scottweb](https://img.shields.io/badge/Scottweb-Web%20Development-red?style=for-the-badge)](http://scottweb.ru/)

Простой HTTP/HTTPS клиент для NodeJS

#### Пример создания простого GET запроса
```js
const { HttpClient } = require("@scottwalker/node-http-client")

// Инициализировать HTTP клиент
const httpClient = new HttpClient()

httpClient.get("https://example.com")
  .then(content => console.log(content))
  .catch(error => console.error(error))
```

#### Пример создания простого POST запроса
```js
const { HttpClient } = require("@scottwalker/node-http-client")

// Инициализировать HTTP клиент
const httpClient = new HttpClient()

/**
 * Отправить данные
 * @param {Object} data
 * @return {Promise}
 */
async function postData(data = {}) {
  try {
    return await httpClient.post("https://example.com", data)
  } catch (error) {
    console.error(error)

    return null
  }
}

postData({ message: "Hello World" })
```

#### Пример создания более сложного запроса
Если указать в заголовках запроса `Content-Type: application/json`, то тело ответа будет преобразовано в js объект 
(при условии валидного JSON в теле ответа), также для удобства можно использовать пересет `jsonHeaders`

```js
const { HttpClient, jsonHeaders, METHOD_PUT } = require("@scottwalker/node-http-client")

// Инициализировать HTTP клиент (с конфигурацией)
const httpClient = new HttpClient({
  baseUrl: "https://example.com",
  headers: {
    ...jsonHeaders
    "X-My-Param": "hello"
  }
})

const requestPromise = httpClient.request({
  method: METHOD_PUT,
  url: "info/update",
  query: { 
    limit: 1,
    order: "desc" 
  },
  data: { 
    message: "Hello World"
  },
  headers: jsonHeaders
})

requestPromise
  .then(content => console.log(content))
  .catch(error => console.error(error))
```

Конструктор клиента принимает в себя объект конфигурации, содержащий следующие параметры:

```
baseUrl - базовый URL для всех запросов
headers - заголовки по умолчанию
```

Метод request принимает в себя объект, содержащий следующие параметры:

```
method - метод запроса
url - URL адрес
query - GET параметры запроса
data - тело запроса
headers - заголовки
```
