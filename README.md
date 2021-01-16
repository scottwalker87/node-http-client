# node-http-client
Простой HTTP/HTTPS клиент для NodeJS

#### Пример создания простого GET запроса
```js
const { get } = require("@scottwalker/node-http-client")

get("https://example.com")
  .then(content => console.log(content))
  .catch(error => console.error(error))
```

#### Пример создания простого POST запроса
```js
const { post } = require("@scottwalker/node-http-client")

/**
 * Отправить данные
 * @param {Object} data
 * @return {Promise}
 */
async function postData(data = {}) {
  try {
    return await post("https://example.com", data)
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
const { request, jsonHeaders, METHOD_PUT } = require("@scottwalker/node-http-client")

const requestPromise = request({
  method: METHOD_PUT,
  url: "https://example.com",
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

Функция request принимает в себя объект содержащий следующие параметры:

```
method - метод запроса
url - URL адрес
query - GET параметры запроса
data - тело запроса
headers - заголовки
```