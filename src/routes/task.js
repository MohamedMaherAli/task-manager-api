require('../db/mongoose');
const express = require('express');
const router = new express.Router();
const auth = require('../Middlewares/auth');
const Task = require('../models/task');

router.get('/tasks', auth, async (req, res) => {
	const match = { owner: req.user._id };
	if (req.query.completed) {
		match.completed = req.query.completed === 'true';
	}
	try {
		const tasks = await Task.find(match)
			.limit(parseInt(req.query.limit))
			.skip(parseInt(req.query.skip))
			.sort({ createdAt: -1 });
		res.send(tasks);
	} catch (e) {
		res.status(500).send(e);
	}
});

router.get('/tasks/:id', auth, async (req, res) => {
	try {
		const task = await Task.findOne({ _id: req.params.id, owner: req.user._id });
		if (!task) {
			res.status(404).send();
		}
		res.send(task);
	} catch (e) {
		res.status(500).send(e);
	}
});

router.post('/tasks', auth, async (req, res) => {
	const task = new Task({
		...req.body,
		owner: req.user._id
	});
	try {
		await task.save();
		res.status(201).send(task);
	} catch (e) {
		res.status(500).send(e);
	}
});

router.patch('/tasks/:id', auth, async (req, res) => {
	const validUpdates = [ 'description', 'completed' ];
	const requestUpdates = Object.keys(req.body);
	const isValidUpdates = requestUpdates.every((update) => {
		return validUpdates.includes(update);
	});
	if (!isValidUpdates) {
		return res.status(400).send({ Error: 'Invalid update' });
	}
	try {
		const task = await Task.findOne({ _id: req.params.id, owner: req.user._id });

		requestUpdates.forEach((update) => {
			task[update] = req.body[update];
		});
		await task.save();

		if (!task) {
			return res.status(404).send();
		}
		res.send(task);
	} catch (e) {
		res.status(400).send(e);
	}
});

router.delete('/tasks/:id', auth, async (req, res) => {
	try {
		const task = await Task.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
		if (!task) {
			return res.status(404).send({ error: 'Not found' });
		}
		res.send(task);
	} catch (e) {
		res.status(500).send(e);
	}
});

module.exports = router;
