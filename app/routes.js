const path = require('path');
const Todo = require('./models/todo');

async function getTodos(res) {
    try {
        const todos = await Todo.find();
        res.json(todos);
    } catch (err) {
        res.status(500).send(err);
    }
}

module.exports = function (app) {

    // API ---------------------------------------------------------------------
    app.get('/api/todos', async (req, res) => {
        await getTodos(res);
    });

    app.post('/api/todos', async (req, res) => {
        try {
            await Todo.create({
                text: req.body.text,
                done: false
            });
            await getTodos(res);
        } catch (err) {
            res.status(500).send(err);
        }
    });

    app.delete('/api/todos/:todo_id', async (req, res) => {
        try {
            await Todo.deleteOne({ _id: req.params.todo_id });
            await getTodos(res);
        } catch (err) {
            res.status(500).send(err);
        }
    });

    // Serve front-end ---------------------------------------------------------
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
    });
};