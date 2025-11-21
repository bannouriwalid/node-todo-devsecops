const path = require('path');
var Todo = require('./models/todo');

function getTodos(res) {
    Todo.find(function (err, todos) {
        if (err) {
            return res.send(err);
        }
        res.json(todos);
    });
}

module.exports = function (app) {

    // api ---------------------------------------------------------------------
    app.get('/api/todos', (req, res) => getTodos(res));

    app.post('/api/todos', async (req, res) => {
        try {
            const todo = await Todo.create({
                text: req.body.text,
                done: false
            });
            getTodos(res);
        } catch (err) {
            res.send(err);
        }
    });

    app.delete('/api/todos/:todo_id', async (req, res) => {
        try {
            await Todo.deleteOne({ _id: req.params.todo_id });
            getTodos(res);
        } catch (err) {
            res.send(err);
        }
    });

    // Serve front-end ---------------------------------------------------------
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
    });
};