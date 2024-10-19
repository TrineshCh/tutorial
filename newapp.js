const express = require('express')
const path = require('path')
const app = express()
app.use(express.json())
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')

const dbpath = path.join(__dirname, 'todoApplication.db')
let database = null
const initializeDBandServer = async () => {
  try {
    database = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Sucessfully Running on port no. 3000....')
    })
  } catch (error) {
    console.log(`DataBase error is ${error.message}`)
    process.exit(1)
  }
}
initializeDBandServer()

const hasPriorityAndStatusProperties = requestQuery => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  )
}

const hasPriorityProperty = requestQuery => {
  return requestQuery.priority !== undefined
}

const hasStatusProperty = requestQuery => {
  return requestQuery.status !== undefined
}

app.get('/todos/', async (request, response) => {
  let data = null
  let getTodosQuery = ''
  const {search_q = '', priority, status} = request.query

  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      getTodosQuery = `
        SELECT 
          * 
        FROM 
          todo
        WHERE
          todo LIKE '%${search_q}%'
          AND status = '${status}'
          AND priority = '${priority}'
      `
      break
    case hasPriorityProperty(request.query):
      getTodosQuery = `
        SELECT 
          * 
        FROM 
          todo
        WHERE
          todo LIKE '%${search_q}%'
          AND priority = '${priority}'
      `
      break
    case hasStatusProperty(request.query):
      getTodosQuery = `
        SELECT 
          * 
        FROM 
          todo
        WHERE
          todo LIKE '%${search_q}%'
          AND status = '${status}'
      `
      break
    default:
      getTodosQuery = `
        SELECT 
          * 
        FROM 
          todo
        WHERE
          todo LIKE '%${search_q}%'
      `
  }
  data = await database.all(getTodosQuery)
  response.send(data)
})

//api2
app.get('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const getToDoQuery = `select * from todo where id=${todoId};`
  const responseResult = await database.get(getToDoQuery)
  response.send(responseResult)
})

//api4
app.post('/todos/', async (request, response) => {
  const {id, todo, priority, status} = request.body //Destructuring variables from the request body
  const insertTodo = `
            INSERT INTO todo (id, todo, priority, status)
            VALUES (${id},'${todo}','${priority}','${status}');` //Updated the values with the variables
  await database.run(insertTodo)
  response.send('Todo Successfully Added')
})

//api5
app.put('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  let updateColumn = ''
  const requestBody = request.body

  switch (true) {
    // update status
    case requestBody.status !== undefined:
      updateColumn = 'Status'
      break

    //update priority
    case requestBody.priority !== undefined:
      updateColumn = 'Priority'
      break

    //update todo
    case requestBody.todo !== undefined:
      updateColumn = 'Todo'
      break
  }
  const previousTodoQuery = `
    SELECT 
      * 
    FROM 
      todo 
    WHERE 
      id = ${todoId};`
  const previousTodo = await database.get(previousTodoQuery)
  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
  } = request.body

  //update category
  const updateTodoQuery = `
    UPDATE 
        todo 
    SET 
        todo='${todo}', 
        priority='${priority}', 
        status='${status}'
    WHERE 
        id = ${todoId};`

  await database.run(updateTodoQuery)
  response.send(`${updateColumn} Updated`)
})

//api6

app.delete('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const deleteTodoQuery = `
  DELETE FROM
    todo
  WHERE
    id = ${todoId};`

  await database.run(deleteTodoQuery)
  response.send('Todo Deleted')
})

module.exports = app

//INSERT INTO todo(id, todo, prrority,status) Values (1,"Learn HTML" ,"HIGH", "TO DO"),(2, "Learn JS", "MEDIUM", "DONE"), (3, "Learn CSS", "LOW", "DONE");
