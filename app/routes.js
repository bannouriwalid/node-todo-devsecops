const Todo = require('./models/todo');

async function getTodos(res) {
    try {
        const todos = await Todo.find();
        res.json(todos); // return all todos in JSON format
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

module.exports = function (app) {

    // api ---------------------------------------------------------------------
    // get all todos
    app.get('/api/todos', async (req, res) => {
        await getTodos(res);
    });

    // create todo and send back all todos after creation
    app.post('/api/todos', async (req, res) => {
        try {
            await Todo.create({
                text: req.body.text,
                done: false
            });
            await getTodos(res); // return updated list
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // delete a todo
    app.delete('/api/todos/:todo_id', async (req, res) => {
        try {
            await Todo.deleteOne({ _id: req.params.todo_id });
            await getTodos(res); // return updated list
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // application -------------------------------------------------------------
    app.get('*', (req, res) => {
        res.sendFile(__dirname + '/public/index.html'); // load the single view file
    });
};